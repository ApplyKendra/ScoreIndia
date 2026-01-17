import {
    Injectable,
    UnauthorizedException,
    ConflictException,
    BadRequestException,
    Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { PrismaService } from '../prisma';
import { RegisterDto, LoginDto } from './dto';
import { Role } from '@prisma/client';
import { EmailService } from '../email/email.service';
import { AuditService } from '../audit/audit.service';
import { TwoFactorService } from './two-factor.service';
import { OtpService } from './otp.service';

const BCRYPT_ROUNDS = 12;
const MAX_FAILED_ATTEMPTS = 5;
const LOCK_DURATION_MS = 15 * 60 * 1000; // 15 minutes
const VERIFICATION_TOKEN_EXPIRY_HOURS = 24;

// Role-based session timeout configuration (in seconds)
interface SessionConfig {
    accessTokenExpiry: number;  // Idle timeout - how long access token lasts
    refreshTokenExpiry: number; // Absolute timeout - max session duration
}

const SESSION_TIMEOUTS: Record<string, SessionConfig> = {
    // USER: 30 min idle, 9 days absolute
    USER: {
        accessTokenExpiry: 30 * 60,           // 30 minutes
        refreshTokenExpiry: 9 * 24 * 60 * 60, // 9 days
    },
    // SUPER_ADMIN: 15 min idle, 12 hours absolute
    SUPER_ADMIN: {
        accessTokenExpiry: 15 * 60,  // 15 minutes
        refreshTokenExpiry: 12 * 60 * 60, // 12 hours
    },
    // SUB_ADMIN: 30 min idle, 3 days absolute
    SUB_ADMIN: {
        accessTokenExpiry: 30 * 60,          // 30 minutes
        refreshTokenExpiry: 3 * 24 * 60 * 60, // 3 days
    },
};

@Injectable()
export class AuthService {
    private readonly logger = new Logger(AuthService.name);

    constructor(
        private prisma: PrismaService,
        private jwtService: JwtService,
        private configService: ConfigService,
        private emailService: EmailService,
        private auditService: AuditService,
        private twoFactorService: TwoFactorService,
        private otpService: OtpService,
    ) { }

    async register(dto: RegisterDto) {
        // Check if email already exists
        const existingUser = await this.prisma.user.findUnique({
            where: { email: dto.email.toLowerCase() },
        });

        if (existingUser) {
            throw new ConflictException('Email already registered');
        }

        // Hash password with bcrypt
        const hashedPassword = await bcrypt.hash(dto.password, BCRYPT_ROUNDS);

        // Generate email verification token
        const emailVerificationToken = crypto.randomBytes(32).toString('hex');
        const emailVerificationExpiry = new Date(
            Date.now() + VERIFICATION_TOKEN_EXPIRY_HOURS * 60 * 60 * 1000
        );

        // Create user
        const user = await this.prisma.user.create({
            data: {
                email: dto.email.toLowerCase(),
                password: hashedPassword,
                name: dto.name,
                phone: dto.phone,
                role: Role.USER,
                emailVerificationToken,
                emailVerificationExpiry,
                isEmailVerified: false,
            },
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
                isEmailVerified: true,
                createdAt: true,
            },
        });

        // Send verification email
        try {
            await this.emailService.sendVerificationEmail(
                user.email,
                user.name,
                emailVerificationToken,
            );
        } catch (error) {
            this.logger.error(`Failed to send verification email: ${error}`);
            // Don't fail registration if email fails
        }

        // Generate tokens
        const tokens = await this.generateTokens(user.id, user.email, user.role);

        // Store hashed refresh token
        await this.updateRefreshToken(user.id, tokens.refreshToken);

        // Audit log
        await this.auditService.logAuth('REGISTER', user.id, user.email);

        this.logger.log(`New user registered: ${user.email}`);

        // Get session config for cookie expiry in controller
        const sessionConfig = this.getSessionConfig(user.role);

        return {
            user,
            ...tokens,
            sessionConfig, // Include for cookie expiry settings
        };
    }

    async verifyEmail(token: string) {
        const user = await this.prisma.user.findFirst({
            where: {
                emailVerificationToken: token,
                emailVerificationExpiry: { gte: new Date() },
            },
        });

        if (!user) {
            throw new BadRequestException('Invalid or expired verification token');
        }

        await this.prisma.user.update({
            where: { id: user.id },
            data: {
                isEmailVerified: true,
                emailVerificationToken: null,
                emailVerificationExpiry: null,
            },
        });

        await this.auditService.logAuth('EMAIL_VERIFIED', user.id, user.email);

        return { message: 'Email verified successfully' };
    }

    async resendVerificationEmail(email: string) {
        const user = await this.prisma.user.findUnique({
            where: { email: email.toLowerCase() },
        });

        if (!user) {
            // Don't reveal if user exists
            return { message: 'If the email exists, a verification link has been sent' };
        }

        if (user.isEmailVerified) {
            throw new BadRequestException('Email is already verified');
        }

        const emailVerificationToken = crypto.randomBytes(32).toString('hex');
        const emailVerificationExpiry = new Date(
            Date.now() + VERIFICATION_TOKEN_EXPIRY_HOURS * 60 * 60 * 1000
        );

        await this.prisma.user.update({
            where: { id: user.id },
            data: { emailVerificationToken, emailVerificationExpiry },
        });

        await this.emailService.sendVerificationEmail(
            user.email,
            user.name,
            emailVerificationToken,
        );

        return { message: 'If the email exists, a verification link has been sent' };
    }

    async login(dto: LoginDto, ipAddress?: string, userAgent?: string) {
        const user = await this.prisma.user.findUnique({
            where: { email: dto.email.toLowerCase() },
        });

        if (!user) {
            throw new UnauthorizedException('Invalid credentials');
        }

        // Check if account is locked
        if (user.lockedUntil && user.lockedUntil > new Date()) {
            const remainingTime = Math.ceil(
                (user.lockedUntil.getTime() - Date.now()) / 60000,
            );
            throw new UnauthorizedException(
                `Account locked. Try again in ${remainingTime} minutes`,
            );
        }

        // Check if account is active
        if (!user.isActive) {
            throw new UnauthorizedException('Account is deactivated');
        }

        // Verify password
        const isPasswordValid = await bcrypt.compare(dto.password, user.password);

        if (!isPasswordValid) {
            // Increment failed attempts
            const failedAttempts = user.failedAttempts + 1;
            const updateData: any = { failedAttempts };

            if (failedAttempts >= MAX_FAILED_ATTEMPTS) {
                updateData.lockedUntil = new Date(Date.now() + LOCK_DURATION_MS);
                this.logger.warn(`Account locked due to failed attempts: ${user.email}`);
            }

            await this.prisma.user.update({
                where: { id: user.id },
                data: updateData,
            });

            await this.auditService.logAuth('LOGIN_FAILED', user.id, user.email, ipAddress, userAgent);

            throw new UnauthorizedException('Invalid credentials');
        }

        // Check if 2FA is enabled or mandatory for admins
        if ((user as any).twoFactorEnabled || this.twoFactorService.isTwoFactorMandatory(user.role)) {
            // If 2FA is mandatory but not enabled, require setup
            if (!(user as any).twoFactorEnabled && this.twoFactorService.isTwoFactorMandatory(user.role)) {
                // Generate a secure setup token (prevents enumeration attacks)
                const setupToken = await this.otpService.saveOtp(user.id, 'password_verified');
                return {
                    requiresTwoFactorSetup: true,
                    userId: user.id,
                    setupToken, // Required to access 2FA setup endpoints
                    message: 'Two-factor authentication setup is required for admin accounts',
                };
            }

            // 2FA is enabled, require validation
            return {
                requiresTwoFactor: true,
                userId: user.id,
                email: user.email,
            };
        }

        // Complete login (no 2FA)
        return this.completeLogin(user, ipAddress, userAgent);
    }

    async validateTwoFactor(userId: string, token: string, ipAddress?: string, userAgent?: string) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
        });

        if (!user || !(user as any).twoFactorSecret) {
            throw new UnauthorizedException('Invalid 2FA setup');
        }

        const decryptedSecret = this.twoFactorService.decryptSecret((user as any).twoFactorSecret);
        const isValid = this.twoFactorService.verifyToken(token, decryptedSecret);

        if (!isValid) {
            await this.auditService.logAuth('LOGIN_FAILED', user.id, user.email, ipAddress, userAgent, { reason: '2FA failed' });
            throw new UnauthorizedException('Invalid 2FA code');
        }

        // For admin roles, require email OTP as additional verification
        if (this.twoFactorService.isTwoFactorMandatory(user.role)) {
            const otp = await this.otpService.saveOtp(user.id, 'login');
            await this.emailService.sendLoginOtp(user.email, user.name, otp);
            this.logger.log(`Login OTP sent to admin: ${user.email}`);

            return {
                requiresEmailOtp: true,
                userId: user.id,
                message: 'An OTP has been sent to your email',
            };
        }

        return this.completeLogin(user, ipAddress, userAgent);
    }

    // Verify email OTP and complete login for admins
    async verifyEmailOtpAndLogin(userId: string, otp: string, ipAddress?: string, userAgent?: string) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
        });

        if (!user) {
            throw new BadRequestException('User not found');
        }

        // Verify OTP
        const isValid = await this.otpService.verifyOtp(userId, otp, 'login');
        if (!isValid) {
            await this.auditService.logAuth('LOGIN_FAILED', user.id, user.email, ipAddress, userAgent, { reason: 'Invalid email OTP' });
            throw new UnauthorizedException('Invalid or expired OTP');
        }

        return this.completeLogin(user, ipAddress, userAgent);
    }

    // Resend login OTP for admins
    async resendLoginOtp(userId: string) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
        });

        if (!user) {
            throw new BadRequestException('User not found');
        }

        // Only allow for admin roles
        if (!this.twoFactorService.isTwoFactorMandatory(user.role)) {
            throw new BadRequestException('OTP not required for this role');
        }

        const otp = await this.otpService.saveOtp(user.id, 'login');
        await this.emailService.sendLoginOtp(user.email, user.name, otp);

        this.logger.log(`Login OTP resent to admin: ${user.email}`);

        return { message: 'OTP resent to your email' };
    }

    // Send OTP for password change
    async sendPasswordChangeOtp(userId: string) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
        });

        if (!user) {
            throw new BadRequestException('User not found');
        }

        const otp = await this.otpService.saveOtp(userId, 'password_change');
        await this.emailService.sendPasswordChangeOtp(user.email, user.name, otp);

        this.logger.log(`Password change OTP sent to: ${user.email}`);

        return { message: 'OTP sent to your email' };
    }

    // Verify OTP for password change (returns a token/flag for 3-min window)
    async verifyPasswordChangeOtp(userId: string, otp: string) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
        });

        if (!user) {
            throw new BadRequestException('User not found');
        }

        const isValid = await this.otpService.verifyOtp(userId, otp, 'password_change');
        if (!isValid) {
            throw new UnauthorizedException('Invalid or expired OTP');
        }

        // Generate and store verification token using OTP service (3-min window)
        const { token, expiresAt } = await this.otpService.saveVerificationToken(userId);

        return {
            verified: true,
            token,
            expiresAt: expiresAt.toISOString(),
            message: 'OTP verified. You have 3 minutes to change your password.',
        };
    }

    // Change password with current password verification (after OTP verified)
    async changePasswordWithToken(userId: string, token: string, currentPassword: string, newPassword: string) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
        });

        if (!user) {
            throw new BadRequestException('User not found');
        }

        // Verify the password change token using OTP service
        if (!(await this.otpService.verifyToken(userId, token))) {
            throw new UnauthorizedException('Invalid or expired session. Please verify OTP again.');
        }

        // Verify current password
        const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
        if (!isPasswordValid) {
            throw new UnauthorizedException('Current password is incorrect');
        }

        // Hash new password
        const hashedPassword = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);

        // Update password
        await this.prisma.user.update({
            where: { id: userId },
            data: { password: hashedPassword },
        });

        // Clear the verification token
        this.otpService.clearVerificationToken(userId);

        // Audit log
        await this.auditService.logAuth('PASSWORD_CHANGED', userId, user.email);

        this.logger.log(`Password changed for user: ${user.email}`);

        return { message: 'Password changed successfully' };
    }

    // Keep old method for backward compatibility (but deprecate)
    async changePasswordWithOtp(userId: string, otp: string, newPassword: string) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
        });

        if (!user) {
            throw new BadRequestException('User not found');
        }

        // Verify OTP
        const isValid = await this.otpService.verifyOtp(userId, otp, 'password_change');
        if (!isValid) {
            throw new UnauthorizedException('Invalid or expired OTP');
        }

        // Hash new password
        const hashedPassword = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);

        // Update password
        await this.prisma.user.update({
            where: { id: userId },
            data: { password: hashedPassword },
        });

        // Audit log
        await this.auditService.logAuth('PASSWORD_CHANGED', userId, user.email);

        this.logger.log(`Password changed for user: ${user.email}`);

        return { message: 'Password changed successfully' };
    }

    private async completeLogin(user: any, ipAddress?: string, userAgent?: string) {
        // Reset failed attempts on successful login
        await this.prisma.user.update({
            where: { id: user.id },
            data: {
                failedAttempts: 0,
                lockedUntil: null,
                lastLoginAt: new Date(),
            },
        });

        // Generate tokens
        const tokens = await this.generateTokens(user.id, user.email, user.role);

        // Store hashed refresh token
        await this.updateRefreshToken(user.id, tokens.refreshToken);

        // Audit log
        await this.auditService.logAuth('LOGIN', user.id, user.email, ipAddress, userAgent);

        this.logger.log(`User logged in: ${user.email}`);

        // Get session config for cookie expiry in controller
        const sessionConfig = this.getSessionConfig(user.role);

        return {
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role,
                isEmailVerified: user.isEmailVerified,
                twoFactorEnabled: user.twoFactorEnabled,
            },
            ...tokens,
            sessionConfig, // Include for cookie expiry settings
        };
    }

    async setupTwoFactor(userId: string) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
        });

        if (!user) {
            throw new BadRequestException('User not found');
        }

        if (user.twoFactorEnabled) {
            throw new BadRequestException('2FA is already enabled');
        }

        const secret = this.twoFactorService.generateSecret();
        const qrCode = await this.twoFactorService.generateQRCode(user.email, secret);

        // Temporarily store encrypted secret (not yet enabled)
        const encryptedSecret = this.twoFactorService.encryptSecret(secret);
        await this.prisma.user.update({
            where: { id: userId },
            data: { twoFactorSecret: encryptedSecret },
        });

        return {
            qrCode,
            secret, // Show secret for manual entry
            message: 'Scan QR code with Google Authenticator and verify with a code',
        };
    }

    async verifyAndEnableTwoFactor(userId: string, token: string) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
        });

        if (!user || !user.twoFactorSecret) {
            throw new BadRequestException('2FA setup not initiated');
        }

        if (user.twoFactorEnabled) {
            throw new BadRequestException('2FA is already enabled');
        }

        const decryptedSecret = this.twoFactorService.decryptSecret(user.twoFactorSecret);
        const isValid = this.twoFactorService.verifyToken(token, decryptedSecret);

        if (!isValid) {
            throw new BadRequestException('Invalid verification code');
        }

        // Enable 2FA
        await this.prisma.user.update({
            where: { id: userId },
            data: {
                twoFactorEnabled: true,
                twoFactorMandatory: this.twoFactorService.isTwoFactorMandatory(user.role),
            },
        });

        // Send confirmation email
        await this.emailService.send2FAEnabledEmail(user.email, user.name);

        // Audit log
        await this.auditService.logAuth('2FA_ENABLED', userId, user.email);

        const recoveryCodes = this.twoFactorService.generateRecoveryCodes();

        return {
            message: '2FA enabled successfully',
            recoveryCodes,
        };
    }

    async disableTwoFactor(userId: string, token: string) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
        });

        if (!user || !user.twoFactorEnabled || !user.twoFactorSecret) {
            throw new BadRequestException('2FA is not enabled');
        }

        // Admin roles cannot disable 2FA
        if (this.twoFactorService.isTwoFactorMandatory(user.role)) {
            throw new BadRequestException('2FA is mandatory for admin accounts');
        }

        const decryptedSecret = this.twoFactorService.decryptSecret(user.twoFactorSecret);
        const isValid = this.twoFactorService.verifyToken(token, decryptedSecret);

        if (!isValid) {
            throw new UnauthorizedException('Invalid 2FA code');
        }

        await this.prisma.user.update({
            where: { id: userId },
            data: {
                twoFactorEnabled: false,
                twoFactorSecret: null,
            },
        });

        // Audit log
        await this.auditService.logAuth('2FA_DISABLED', userId, user.email);

        return { message: '2FA disabled successfully' };
    }

    // 2FA setup for first-time admin login (requires setupToken from login)
    async setupTwoFactorForUser(userId: string, setupToken?: string) {
        // SECURITY: Validate setup token to prevent enumeration attacks
        if (!setupToken) {
            throw new BadRequestException('Setup token required');
        }

        const isValidToken = await this.otpService.verifyToken(userId, setupToken);
        if (!isValidToken) {
            throw new BadRequestException('Invalid or expired setup token. Please login again.');
        }

        const user = await this.prisma.user.findUnique({
            where: { id: userId },
        });

        if (!user) {
            throw new BadRequestException('User not found');
        }

        // Only allow for admin roles that need to set up 2FA
        if (!this.twoFactorService.isTwoFactorMandatory(user.role)) {
            throw new BadRequestException('2FA setup not required for this role');
        }

        if ((user as any).twoFactorEnabled) {
            throw new BadRequestException('2FA is already enabled');
        }

        const secret = this.twoFactorService.generateSecret();
        const qrCode = await this.twoFactorService.generateQRCode(user.email, secret);

        // Temporarily store encrypted secret (not yet enabled)
        const encryptedSecret = this.twoFactorService.encryptSecret(secret);
        await this.prisma.user.update({
            where: { id: userId },
            data: { twoFactorSecret: encryptedSecret } as any,
        });

        return {
            qrCode,
            secret,
            message: 'Scan QR code with Google Authenticator and verify with a code',
        };
    }

    async verifyTwoFactorSetupAndLogin(userId: string, token: string, ipAddress?: string, userAgent?: string) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
        });

        if (!user || !(user as any).twoFactorSecret) {
            throw new BadRequestException('2FA setup not initiated');
        }

        if ((user as any).twoFactorEnabled) {
            throw new BadRequestException('2FA is already enabled');
        }

        const decryptedSecret = this.twoFactorService.decryptSecret((user as any).twoFactorSecret);
        const isValid = this.twoFactorService.verifyToken(token, decryptedSecret);

        if (!isValid) {
            throw new BadRequestException('Invalid verification code');
        }

        // Enable 2FA
        await this.prisma.user.update({
            where: { id: userId },
            data: {
                twoFactorEnabled: true,
                twoFactorMandatory: this.twoFactorService.isTwoFactorMandatory(user.role),
            } as any,
        });

        // Send confirmation email
        await this.emailService.send2FAEnabledEmail(user.email, user.name);

        // Audit log
        await this.auditService.logAuth('2FA_ENABLED', userId, user.email);

        // Complete login
        return this.completeLogin(user, ipAddress, userAgent);
    }

    async refreshTokens(userId: string, refreshToken: string) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
        });

        if (!user || !user.refreshToken || !user.isActive) {
            throw new UnauthorizedException('Invalid refresh token');
        }

        // Check absolute timeout - user must re-login after max session duration
        if (user.lastLoginAt) {
            const sessionConfig = this.getSessionConfig(user.role);
            const loginTime = new Date(user.lastLoginAt).getTime();
            const maxSessionDuration = sessionConfig.refreshTokenExpiry * 1000; // Convert to ms
            const now = Date.now();

            if (now - loginTime > maxSessionDuration) {
                // Session has exceeded absolute timeout
                this.logger.warn(`Session expired (absolute timeout) for user: ${user.email}, role: ${user.role}`);
                throw new UnauthorizedException('Session expired. Please login again.');
            }
        }

        // Verify refresh token
        const isTokenValid = await bcrypt.compare(refreshToken, user.refreshToken);
        if (!isTokenValid) {
            throw new UnauthorizedException('Invalid refresh token');
        }

        // Generate new tokens
        const tokens = await this.generateTokens(user.id, user.email, user.role);

        // Update stored refresh token (token rotation)
        await this.updateRefreshToken(user.id, tokens.refreshToken);

        // Get session config for cookie expiry in controller
        const sessionConfig = this.getSessionConfig(user.role);

        return {
            ...tokens,
            sessionConfig, // Include for cookie expiry settings
        };
    }

    async logout(userId: string, ipAddress?: string, userAgent?: string) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: { email: true },
        });

        await this.prisma.user.update({
            where: { id: userId },
            data: { refreshToken: null },
        });

        if (user) {
            await this.auditService.logAuth('LOGOUT', userId, user.email, ipAddress, userAgent);
        }
    }

    async getProfile(userId: string) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                email: true,
                name: true,
                phone: true,
                role: true,
                isEmailVerified: true,
                twoFactorEnabled: true,
                createdAt: true,
                lastLoginAt: true,
                addresses: true,
            },
        });

        if (!user) {
            throw new BadRequestException('User not found');
        }

        return user;
    }

    // Get session config for a role
    getSessionConfig(role: Role): SessionConfig {
        return SESSION_TIMEOUTS[role] || SESSION_TIMEOUTS.USER;
    }

    private async generateTokens(userId: string, email: string, role: Role) {
        const sessionConfig = this.getSessionConfig(role);
        const payload = { sub: userId, email, role };

        const jwtSecret = this.configService.get<string>('jwt.secret');
        const jwtRefreshSecret = this.configService.get<string>('jwt.refreshSecret');

        // In production, require proper secrets
        const isProduction = this.configService.get<string>('app.nodeEnv') === 'production';
        if (isProduction && (!jwtSecret || jwtSecret.includes('dev-secret') || jwtSecret.length < 32)) {
            throw new Error('JWT_SECRET must be a strong secret (32+ chars) in production');
        }
        if (isProduction && (!jwtRefreshSecret || jwtRefreshSecret.includes('dev-secret') || jwtRefreshSecret.length < 32)) {
            throw new Error('JWT_REFRESH_SECRET must be a strong secret (32+ chars) in production');
        }

        // Use configured secrets or dev fallbacks (dev only)
        const secret = jwtSecret || 'dev-secret-only-for-development';
        const refreshSecret = jwtRefreshSecret || 'dev-refresh-secret-only-for-development';

        const [accessToken, refreshToken] = await Promise.all([
            this.jwtService.signAsync(payload, {
                secret: secret,
                expiresIn: sessionConfig.accessTokenExpiry, // Role-based idle timeout
            }),
            this.jwtService.signAsync(payload, {
                secret: refreshSecret,
                expiresIn: sessionConfig.refreshTokenExpiry, // Role-based absolute timeout
            }),
        ]);

        return {
            accessToken,
            refreshToken,
            sessionConfig, // Return config for cookie maxAge setup
        };
    }

    private async updateRefreshToken(userId: string, refreshToken: string) {
        const hashedToken = await bcrypt.hash(refreshToken, BCRYPT_ROUNDS);
        await this.prisma.user.update({
            where: { id: userId },
            data: { refreshToken: hashedToken },
        });
    }

    async changePassword(userId: string, currentPassword: string, newPassword: string) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
        });

        if (!user) {
            throw new BadRequestException('User not found');
        }

        // Verify current password
        const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
        if (!isPasswordValid) {
            throw new UnauthorizedException('Current password is incorrect');
        }

        // Hash new password
        const hashedPassword = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);

        // Update password
        await this.prisma.user.update({
            where: { id: userId },
            data: { password: hashedPassword },
        });

        // Audit log
        await this.auditService.logAuth('PASSWORD_CHANGED', userId, user.email);

        this.logger.log(`Password changed for user: ${user.email}`);

        return { message: 'Password changed successfully' };
    }
}
