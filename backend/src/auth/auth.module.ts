import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy, JwtRefreshStrategy } from './strategies';
import { TwoFactorService } from './two-factor.service';
import { OtpService } from './otp.service';
import { SsmConfigService } from '../config';

@Module({
    imports: [
        PassportModule.register({ defaultStrategy: 'jwt' }),
        JwtModule.registerAsync({
            imports: [ConfigModule],
            useFactory: (configService: ConfigService, ssmConfig: SsmConfigService) => {
                // Get secret from SSM (production) or config (development)
                const secret = ssmConfig.getOptional('jwt.secret') || configService.get<string>('jwt.secret');
                if (!secret && process.env.NODE_ENV === 'production') {
                    throw new Error('JWT_SECRET is required in production');
                }
                return {
                    secret: secret || 'dev-secret-only-for-development',
                    signOptions: {
                        expiresIn: 900, // 15 minutes in seconds
                    },
                };
            },
            inject: [ConfigService, SsmConfigService],
        }),
    ],
    controllers: [AuthController],
    providers: [AuthService, JwtStrategy, JwtRefreshStrategy, TwoFactorService, OtpService],
    exports: [AuthService, TwoFactorService, OtpService],
})
export class AuthModule { }
