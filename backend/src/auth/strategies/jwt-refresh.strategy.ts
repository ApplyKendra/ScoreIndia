import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Request } from 'express';
import { PrismaService } from '../../prisma';
import { SsmConfigService } from '../../config';
import * as bcrypt from 'bcrypt';

// Custom extractor: try cookie first, then body
const cookieOrBodyExtractor = (req: Request): string | null => {
    // 1. Try to get from HttpOnly cookie
    if (req?.cookies?.refreshToken) {
        return req.cookies.refreshToken;
    }
    // 2. Fallback to body for backwards compatibility
    if (req?.body?.refreshToken) {
        return req.body.refreshToken;
    }
    return null;
};

@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(Strategy, 'jwt-refresh') {
    constructor(
        private configService: ConfigService,
        private prisma: PrismaService,
        private ssmConfig: SsmConfigService,
    ) {
        // Get secret from SSM (production) or config (development)
        const refreshSecret = ssmConfig.getOptional('jwt.refresh-secret') || configService.get<string>('jwt.refreshSecret');
        if (!refreshSecret && process.env.NODE_ENV === 'production') {
            throw new Error('JWT_REFRESH_SECRET is required in production');
        }
        super({
            jwtFromRequest: cookieOrBodyExtractor,
            ignoreExpiration: false,
            secretOrKey: refreshSecret || 'dev-refresh-secret-only-for-development',
            passReqToCallback: true,
        } as any);
    }

    async validate(req: Request, payload: { sub: string; email: string }) {
        // Get refresh token from cookie or body
        const refreshToken = req.cookies?.refreshToken || req.body?.refreshToken;

        const user = await this.prisma.user.findUnique({
            where: { id: payload.sub },
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
                isActive: true,
                refreshToken: true,
            },
        });

        if (!user || !user.isActive || !user.refreshToken) {
            return null;
        }

        // Verify refresh token matches stored hash
        const isTokenValid = await bcrypt.compare(refreshToken, user.refreshToken);
        if (!isTokenValid) {
            return null;
        }

        return user;
    }
}
