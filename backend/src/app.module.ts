import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';

// Config
import { appConfig, jwtConfig, redisConfig, SsmModule } from './config';

// Modules
import { PrismaModule } from './prisma';
import { AuthModule } from './auth';
import { PrasadamModule } from './prasadam';
import { StoreModule } from './store';
import { YouthModule } from './youth';
import { UsersModule } from './users';
import { HeroSlidesModule } from './hero-slides/hero-slides.module';
import { UploadModule } from './upload/upload.module';
import { DarshanModule } from './darshan';
import { PagesModule } from './pages';
import { EmailModule } from './email/email.module';
import { AuditModule } from './audit/audit.module';
import { RedisModule } from './redis';
import { NotificationModule } from './notification/notification.module';
import { DonationModule } from './donation';

// Guards
import { JwtAuthGuard } from './common/guards';

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig, jwtConfig, redisConfig],
    }),

    // Rate limiting
    ThrottlerModule.forRoot({
      throttlers: [
        {
          ttl: 60000, // 1 minute
          limit: 100, // 100 requests per minute
        },
      ],
    }),

    // SSM for production secrets
    SsmModule,

    // Global modules
    RedisModule,
    EmailModule,
    AuditModule,

    // Feature modules
    PrismaModule,
    AuthModule,
    PrasadamModule,
    StoreModule,
    YouthModule,
    UsersModule,
    HeroSlidesModule,
    UploadModule,
    DarshanModule,
    PagesModule,
    NotificationModule,
    DonationModule,
  ],
  providers: [
    // Global JWT authentication guard
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    // Global rate limiting guard
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule { }
