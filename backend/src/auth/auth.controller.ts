import {
    Controller,
    Post,
    Body,
    Get,
    Res,
    Req,
    UseGuards,
    HttpCode,
    HttpStatus,
    Query,
} from '@nestjs/common';
import * as express from 'express';
import { AuthGuard } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';
import { Throttle, SkipThrottle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { RegisterDto, LoginDto } from './dto';
import { Public, CurrentUser } from '../common/decorators';

// Cookie options for secure token storage
// IMPORTANT: For cross-domain (different origins like iskconburla.com + iskconburla-api.onrender.com)
// - sameSite must be 'none' (allows cross-site requests)
// - secure must be true (required when sameSite is 'none')
// - No domain setting (each domain manages its own cookies)
const getCookieOptions = () => ({
    httpOnly: true,
    secure: true, // Always true for cross-domain
    sameSite: 'none' as const, // Required for cross-origin requests
    path: '/',
});

const COOKIE_OPTIONS = getCookieOptions();

const ACCESS_TOKEN_MAX_AGE = 15 * 60 * 1000; // 15 minutes
const REFRESH_TOKEN_MAX_AGE = 7 * 24 * 60 * 60 * 1000; // 7 days

@Controller('auth')
export class AuthController {
    constructor(
        private authService: AuthService,
        private configService: ConfigService,
    ) { }

    // ============================================
    // REGISTRATION & LOGIN
    // ============================================

    @Public()
    @Post('register')
    async register(
        @Body() dto: RegisterDto,
        @Req() req: express.Request,
        @Res({ passthrough: true }) res: express.Response,
    ) {
        const result = await this.authService.register(dto);

        // Use role-based expiry from session config
        const accessMaxAge = (result.sessionConfig?.accessTokenExpiry || 900) * 1000;
        const refreshMaxAge = (result.sessionConfig?.refreshTokenExpiry || 604800) * 1000;

        // Set tokens in HttpOnly cookies
        res.cookie('accessToken', result.accessToken, {
            ...COOKIE_OPTIONS,
            maxAge: accessMaxAge,
        });
        res.cookie('refreshToken', result.refreshToken, {
            ...COOKIE_OPTIONS,
            maxAge: refreshMaxAge,
        });

        return {
            user: result.user,
            message: 'Registration successful. Please check your email to verify your account.',
        };
    }

    @Public()
    @Post('login')
    @HttpCode(HttpStatus.OK)
    async login(
        @Body() dto: LoginDto,
        @Req() req: express.Request,
        @Res({ passthrough: true }) res: express.Response,
    ) {
        const ipAddress = req.ip || req.socket.remoteAddress;
        const userAgent = req.headers['user-agent'];

        const result = await this.authService.login(dto, ipAddress, userAgent);

        // Check if 2FA is required
        if ('requiresTwoFactor' in result) {
            return {
                requiresTwoFactor: true,
                userId: (result as any).userId,
                message: 'Please enter your 2FA code',
            };
        }

        // Check if 2FA setup is required
        if ('requiresTwoFactorSetup' in result) {
            return {
                requiresTwoFactorSetup: true,
                userId: (result as any).userId,
                message: (result as any).message || 'Two-factor authentication setup is required',
            };
        }

        // Normal login - set cookies with role-based expiry
        const accessMaxAge = (result.sessionConfig?.accessTokenExpiry || 900) * 1000; // Convert to ms
        const refreshMaxAge = (result.sessionConfig?.refreshTokenExpiry || 604800) * 1000;

        res.cookie('accessToken', result.accessToken, {
            ...COOKIE_OPTIONS,
            maxAge: accessMaxAge,
        });
        res.cookie('refreshToken', result.refreshToken, {
            ...COOKIE_OPTIONS,
            maxAge: refreshMaxAge,
        });

        return {
            user: result.user,
            message: 'Login successful',
        };
    }

    @Public()
    @Post('2fa/validate')
    @HttpCode(HttpStatus.OK)
    async validateTwoFactor(
        @Body() body: { userId: string; token: string },
        @Req() req: express.Request,
        @Res({ passthrough: true }) res: express.Response,
    ) {
        const ipAddress = req.ip || req.socket.remoteAddress;
        const userAgent = req.headers['user-agent'];

        const result = await this.authService.validateTwoFactor(
            body.userId,
            body.token,
            ipAddress,
            userAgent,
        );

        // Check if email OTP is required (admin accounts)
        if ('requiresEmailOtp' in result) {
            return {
                requiresEmailOtp: true,
                userId: (result as any).userId,
                message: (result as any).message,
            };
        }

        // Set cookies after successful 2FA (non-admin) with role-based expiry
        const accessMaxAge = (result.sessionConfig?.accessTokenExpiry || 900) * 1000;
        const refreshMaxAge = (result.sessionConfig?.refreshTokenExpiry || 604800) * 1000;

        res.cookie('accessToken', result.accessToken, {
            ...COOKIE_OPTIONS,
            maxAge: accessMaxAge,
        });
        res.cookie('refreshToken', result.refreshToken, {
            ...COOKIE_OPTIONS,
            maxAge: refreshMaxAge,
        });

        return {
            user: result.user,
            message: 'Login successful',
        };
    }

    // ============================================
    // EMAIL OTP VERIFICATION
    // ============================================

    @Public()
    @Post('otp/verify-login')
    @HttpCode(HttpStatus.OK)
    async verifyEmailOtpAndLogin(
        @Body() body: { userId: string; otp: string },
        @Req() req: express.Request,
        @Res({ passthrough: true }) res: express.Response,
    ) {
        const ipAddress = req.ip || req.socket.remoteAddress;
        const userAgent = req.headers['user-agent'];

        const result = await this.authService.verifyEmailOtpAndLogin(
            body.userId,
            body.otp,
            ipAddress,
            userAgent,
        );

        // Set cookies with role-based expiry
        const accessMaxAge = (result.sessionConfig?.accessTokenExpiry || 900) * 1000;
        const refreshMaxAge = (result.sessionConfig?.refreshTokenExpiry || 604800) * 1000;

        res.cookie('accessToken', result.accessToken, {
            ...COOKIE_OPTIONS,
            maxAge: accessMaxAge,
        });
        res.cookie('refreshToken', result.refreshToken, {
            ...COOKIE_OPTIONS,
            maxAge: refreshMaxAge,
        });

        return {
            user: result.user,
            message: 'Login successful',
        };
    }

    @Public()
    @Post('otp/resend-login')
    @HttpCode(HttpStatus.OK)
    async resendLoginOtp(@Body() body: { userId: string }) {
        return this.authService.resendLoginOtp(body.userId);
    }

    @Post('otp/send-password-change')
    @HttpCode(HttpStatus.OK)
    async sendPasswordChangeOtp(@CurrentUser('id') userId: string) {
        return this.authService.sendPasswordChangeOtp(userId);
    }

    @Post('otp/verify-password-change')
    @HttpCode(HttpStatus.OK)
    async verifyPasswordChangeOtp(
        @CurrentUser('id') userId: string,
        @Body() body: { otp: string },
    ) {
        return this.authService.verifyPasswordChangeOtp(userId, body.otp);
    }

    // ============================================
    // EMAIL VERIFICATION
    // ============================================

    @Public()
    @Get('verify-email')
    async verifyEmail(@Query('token') token: string) {
        return this.authService.verifyEmail(token);
    }

    @Public()
    @Post('resend-verification')
    @HttpCode(HttpStatus.OK)
    async resendVerification(@Body() body: { email: string }) {
        return this.authService.resendVerificationEmail(body.email);
    }

    // ============================================
    // TWO-FACTOR AUTHENTICATION
    // ============================================

    @Post('2fa/setup')
    @HttpCode(HttpStatus.OK)
    async setupTwoFactor(@CurrentUser('id') userId: string) {
        return this.authService.setupTwoFactor(userId);
    }

    @Post('2fa/verify')
    @HttpCode(HttpStatus.OK)
    async verifyAndEnableTwoFactor(
        @CurrentUser('id') userId: string,
        @Body() body: { token: string },
    ) {
        return this.authService.verifyAndEnableTwoFactor(userId, body.token);
    }

    @Post('2fa/disable')
    @HttpCode(HttpStatus.OK)
    async disableTwoFactor(
        @CurrentUser('id') userId: string,
        @Body() body: { token: string },
    ) {
        return this.authService.disableTwoFactor(userId, body.token);
    }

    // 2FA setup for first-time admin login (requires setupToken from /login response)
    // SECURITY: No @Public() - setupToken validates the user authenticated via login
    @Throttle({ default: { limit: 3, ttl: 3600000 } }) // 3 requests per hour per IP
    @Post('2fa/setup-for-user')
    @HttpCode(HttpStatus.OK)
    async setupTwoFactorForUser(@Body() body: { userId: string; setupToken: string }) {
        return this.authService.setupTwoFactorForUser(body.userId, body.setupToken);
    }

    @Public()
    @Throttle({ default: { limit: 5, ttl: 300000 } }) // 5 attempts per 5 minutes per IP
    @Post('2fa/verify-setup')
    @HttpCode(HttpStatus.OK)
    async verifyTwoFactorSetup(
        @Body() body: { userId: string; token: string },
        @Req() req: express.Request,
        @Res({ passthrough: true }) res: express.Response,
    ) {
        const ipAddress = req.ip;
        const userAgent = req.headers['user-agent'] || '';
        const result = await this.authService.verifyTwoFactorSetupAndLogin(body.userId, body.token, ipAddress, userAgent);

        // Use role-based expiry from session config
        const accessMaxAge = (result.sessionConfig?.accessTokenExpiry || 900) * 1000;
        const refreshMaxAge = (result.sessionConfig?.refreshTokenExpiry || 604800) * 1000;

        // Set cookies
        res.cookie('accessToken', result.accessToken, {
            ...COOKIE_OPTIONS,
            maxAge: accessMaxAge,
        });
        res.cookie('refreshToken', result.refreshToken, {
            ...COOKIE_OPTIONS,
            maxAge: refreshMaxAge,
        });

        return {
            user: result.user,
            message: '2FA enabled and login successful',
        };
    }

    // ============================================
    // TOKEN REFRESH & LOGOUT
    // ============================================

    @Public()
    @UseGuards(AuthGuard('jwt-refresh'))
    @Post('refresh')
    @HttpCode(HttpStatus.OK)
    async refreshTokens(
        @CurrentUser('id') userId: string,
        @Req() req: express.Request,
        @Res({ passthrough: true }) res: express.Response,
    ) {
        console.log('[AUTH] Refresh token endpoint called');
        console.log('[AUTH] Cookies received:', Object.keys(req.cookies || {}));
        console.log('[AUTH] User ID from JWT:', userId);

        const refreshToken = req.cookies?.refreshToken || req.body?.refreshToken;

        if (!refreshToken) {
            console.error('[AUTH] No refresh token found in cookies or body!');
        }

        const result = await this.authService.refreshTokens(userId, refreshToken);

        // Use role-based expiry from session config
        const accessMaxAge = (result.sessionConfig?.accessTokenExpiry || 900) * 1000;
        const refreshMaxAge = (result.sessionConfig?.refreshTokenExpiry || 604800) * 1000;

        console.log('[AUTH] Setting cookies with maxAge:', {
            accessMaxAge: accessMaxAge / 1000 + 's',
            refreshMaxAge: refreshMaxAge / 1000 / 60 + 'min',
        });

        res.cookie('accessToken', result.accessToken, {
            ...COOKIE_OPTIONS,
            maxAge: accessMaxAge,
        });
        res.cookie('refreshToken', result.refreshToken, {
            ...COOKIE_OPTIONS,
            maxAge: refreshMaxAge,
        });

        return { message: 'Tokens refreshed successfully' };
    }

    @Post('logout')
    @HttpCode(HttpStatus.OK)
    async logout(
        @CurrentUser('id') userId: string,
        @Req() req: express.Request,
        @Res({ passthrough: true }) res: express.Response,
    ) {
        const ipAddress = req.ip || req.socket.remoteAddress;
        const userAgent = req.headers['user-agent'];

        await this.authService.logout(userId, ipAddress, userAgent);

        res.clearCookie('accessToken', { path: '/' });
        res.clearCookie('refreshToken', { path: '/' });

        return { message: 'Logged out successfully' };
    }

    // ============================================
    // PROFILE & SETTINGS
    // ============================================

    @Get('profile')
    async getProfile(@CurrentUser('id') userId: string) {
        return this.authService.getProfile(userId);
    }

    // New secure password change with token (after OTP verification)
    @Post('change-password-with-token')
    @HttpCode(HttpStatus.OK)
    async changePasswordWithToken(
        @CurrentUser('id') userId: string,
        @Body() body: { token: string; currentPassword: string; newPassword: string },
    ) {
        return this.authService.changePasswordWithToken(userId, body.token, body.currentPassword, body.newPassword);
    }

    // Keep old endpoint for backward compatibility
    @Post('change-password')
    @HttpCode(HttpStatus.OK)
    async changePassword(
        @CurrentUser('id') userId: string,
        @Body() body: { otp: string; newPassword: string },
    ) {
        return this.authService.changePasswordWithOtp(userId, body.otp, body.newPassword);
    }
}
