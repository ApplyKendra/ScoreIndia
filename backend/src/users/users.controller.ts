import {
    Controller,
    Get,
    Post,
    Patch,
    Delete,
    Body,
    Param,
    Query,
    UseGuards,
    BadRequestException,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import { UsersService } from './users.service';
import { CreateUserDto, UpdateUserDto } from './dto';
import { Roles, CurrentUser } from '../common/decorators';
import { RolesGuard } from '../common/guards';
import { TwoFactorService } from '../auth/two-factor.service';
import { OtpService } from '../auth/otp.service';
import { PrismaService } from '../prisma/prisma.service';

@Controller('users')
@UseGuards(RolesGuard)
export class UsersController {
    constructor(
        private usersService: UsersService,
        private twoFactorService: TwoFactorService,
        private otpService: OtpService,
        private prisma: PrismaService,
    ) { }

    /**
     * Helper method to verify 2FA code for a user
     */
    private async verify2FA(userId: string, code: string): Promise<boolean> {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: { twoFactorSecret: true, twoFactorEnabled: true },
        });

        if (!user || !user.twoFactorEnabled || !user.twoFactorSecret) {
            return false;
        }

        try {
            const decryptedSecret = this.twoFactorService.decryptSecret(user.twoFactorSecret);
            return this.twoFactorService.verifyToken(code, decryptedSecret);
        } catch {
            return false;
        }
    }

    @Roles(Role.SUPER_ADMIN)
    @Get()
    getAllUsers(@Query('role') role?: Role) {
        return this.usersService.getAllUsers(role);
    }

    @Roles(Role.SUPER_ADMIN)
    @Get('stats')
    getDashboardStats() {
        return this.usersService.getDashboardStats();
    }

    @Roles(Role.SUPER_ADMIN)
    @Get(':id')
    getUserById(@Param('id') id: string) {
        return this.usersService.getUserById(id);
    }

    // ============================================
    // SECURE OPERATIONS REQUIRING 2FA + OTP
    // ============================================

    // Create sub-admin: Requires 2FA + OTP verification with session token
    @Roles(Role.SUPER_ADMIN)
    @Post('admin/secure')
    async createAdminSecure(
        @Body() body: { userData: CreateUserDto; twoFactorCode: string; sessionToken: string },
        @CurrentUser('id') creatorId: string,
        @CurrentUser('email') creatorEmail: string,
    ) {
        // Verify 2FA code
        const is2FAValid = await this.verify2FA(creatorId, body.twoFactorCode);
        if (!is2FAValid) {
            throw new BadRequestException('Invalid 2FA code');
        }

        // Verify session token (from OTP verification)
        if (!(await this.otpService.verifyToken(creatorId, body.sessionToken))) {
            throw new BadRequestException('Session expired or invalid. Please verify OTP again.');
        }

        return this.usersService.createAdmin(body.userData, creatorId);
    }

    // Send OTP for user management operations
    @Roles(Role.SUPER_ADMIN)
    @Post('management/send-otp')
    async sendManagementOtp(@CurrentUser('id') userId: string) {
        // Generate and return token after OTP sent (OTP sent via email in auth service)
        const { token, expiresAt } = await this.otpService.saveVerificationToken(userId);
        return {
            message: 'OTP sent to your email. You have 3 minutes.',
            token,
            expiresAt: expiresAt.toISOString(),
        };
    }

    // Verify OTP and get session token for 3-min window
    @Roles(Role.SUPER_ADMIN)
    @Post('management/verify-otp')
    async verifyManagementOtp(
        @CurrentUser('id') userId: string,
        @Body() body: { otp: string },
    ) {
        const isValid = await this.otpService.verifyOtp(userId, body.otp, 'password_change');
        if (!isValid) {
            throw new BadRequestException('Invalid or expired OTP');
        }

        // Generate session token for 3-min window
        const { token, expiresAt } = await this.otpService.saveVerificationToken(userId);
        return {
            verified: true,
            sessionToken: token,
            expiresAt: expiresAt.toISOString(),
            message: 'OTP verified. You have 3 minutes to complete the operation.',
        };
    }

    // Toggle user active: USER role = 2FA only, SUB_ADMIN = 2FA + OTP
    @Roles(Role.SUPER_ADMIN)
    @Patch(':id/toggle-active/secure')
    async toggleUserActiveSecure(
        @Param('id') id: string,
        @Body() body: { twoFactorCode: string; sessionToken?: string },
        @CurrentUser('id') adminId: string,
    ) {
        // Verify 2FA
        const is2FAValid = await this.verify2FA(adminId, body.twoFactorCode);
        if (!is2FAValid) {
            throw new BadRequestException('Invalid 2FA code');
        }

        // Get target user to check role
        const targetUser = await this.usersService.getUserById(id);

        // SUB_ADMIN requires OTP session token
        if (targetUser.role === Role.SUB_ADMIN) {
            if (!body.sessionToken || !(await this.otpService.verifyToken(adminId, body.sessionToken))) {
                throw new BadRequestException('Email OTP verification required for sub-admin actions');
            }
        }

        return this.usersService.toggleUserActive(id, adminId);
    }

    // Delete user: USER role = 2FA only, SUB_ADMIN = 2FA + OTP
    @Roles(Role.SUPER_ADMIN)
    @Delete(':id/secure')
    async deleteUserSecure(
        @Param('id') id: string,
        @Body() body: { twoFactorCode: string; sessionToken?: string },
        @CurrentUser('id') adminId: string,
    ) {
        // Verify 2FA
        const is2FAValid = await this.verify2FA(adminId, body.twoFactorCode);
        if (!is2FAValid) {
            throw new BadRequestException('Invalid 2FA code');
        }

        // Get target user to check role
        const targetUser = await this.usersService.getUserById(id);

        // SUB_ADMIN requires OTP session token
        if (targetUser.role === Role.SUB_ADMIN) {
            if (!body.sessionToken || !(await this.otpService.verifyToken(adminId, body.sessionToken))) {
                throw new BadRequestException('Email OTP verification required for sub-admin deletion');
            }
        }

        return this.usersService.deleteUser(id, adminId);
    }

    // ============================================
    // LEGACY ENDPOINTS - DEPRECATED
    // Note: createAdmin, toggleUserActive, and deleteUser removed for security
    // Use /admin/secure, /toggle-active/secure, /secure variants instead
    // ============================================

    @Roles(Role.SUPER_ADMIN)
    @Patch(':id')
    updateUser(
        @Param('id') id: string,
        @Body() dto: UpdateUserDto,
        @CurrentUser('id') adminId: string,
    ) {
        // updateUser is kept as it only modifies non-critical fields
        return this.usersService.updateUser(id, dto, adminId);
    }
}
