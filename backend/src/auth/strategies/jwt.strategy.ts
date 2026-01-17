import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Request } from 'express';
import { PrismaService } from '../../prisma';
import { SsmConfigService } from '../../config';

export interface JwtPayload {
    sub: string;
    email: string;
    role: string;
}

// Custom extractor: try cookie first, then Authorization header
const cookieOrHeaderExtractor = (req: Request): string | null => {
    // 1. Try to get from HttpOnly cookie
    if (req?.cookies?.accessToken) {
        return req.cookies.accessToken;
    }
    // 2. Fallback to Authorization header for backwards compatibility
    const authHeader = req?.headers?.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
        return authHeader.substring(7);
    }
    return null;
};

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
    constructor(
        private configService: ConfigService,
        private prisma: PrismaService,
        private ssmConfig: SsmConfigService,
    ) {
        // Get secret from SSM (production) or config (development)
        const secret = ssmConfig.getOptional('jwt.secret') || configService.get<string>('jwt.secret');
        if (!secret && process.env.NODE_ENV === 'production') {
            throw new Error('JWT_SECRET is required in production');
        }
        super({
            jwtFromRequest: cookieOrHeaderExtractor,
            ignoreExpiration: false,
            secretOrKey: secret || 'dev-secret-only-for-development',
        });
    }

    async validate(payload: JwtPayload) {
        const user = await this.prisma.user.findUnique({
            where: { id: payload.sub },
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
                isActive: true,
                isEmailVerified: true,
            },
        });

        if (!user || !user.isActive) {
            return null;
        }

        return user;
    }
}
