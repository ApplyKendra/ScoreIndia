import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { AppModule } from './app.module';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);

  const configService = app.get(ConfigService);
  const port = configService.get<number>('app.port') || 3001;
  const frontendUrl = configService.get<string>('app.frontendUrl') || 'http://localhost:3000';
  const isProduction = configService.get<string>('app.nodeEnv') === 'production';

  // Build allowed origins - include both www and non-www in production
  const getAllowedOrigins = (): string[] => {
    const origins = [frontendUrl];

    // In production, also allow both www and non-www versions
    if (isProduction) {
      // Add Vercel deployment URL
      origins.push('https://iskcon-burla-frontend.vercel.app');

      // If frontendUrl is https://iskconburla.com, also add https://www.iskconburla.com
      if (frontendUrl.includes('://iskconburla.com')) {
        origins.push('https://www.iskconburla.com');
      }
      // If frontendUrl is https://www.iskconburla.com, also add https://iskconburla.com
      if (frontendUrl.includes('://www.iskconburla.com')) {
        origins.push('https://iskconburla.com');
      }
    }

    logger.log(`🌐 Allowed CORS origins: ${origins.join(', ')}`);
    return origins;
  };

  const allowedOrigins = getAllowedOrigins();

  // Security middleware with enhanced headers
  app.use(helmet({
    // Content Security Policy - Restrict resource loading
    contentSecurityPolicy: isProduction ? {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"], // Required for inline styles
        imgSrc: ["'self'", "https://*.s3.*.amazonaws.com", "data:", "blob:"],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
        connectSrc: ["'self'", ...allowedOrigins],
        frameSrc: ["'none'"],
        objectSrc: ["'none'"],
      },
    } : false, // Disable in development for easier debugging
    // HTTP Strict Transport Security
    hsts: isProduction ? {
      maxAge: 31536000, // 1 year
      includeSubDomains: true,
      preload: true,
    } : false,
    // Prevent clickjacking
    frameguard: { action: 'deny' },
    // Hide X-Powered-By header
    hidePoweredBy: true,
    // Prevent MIME type sniffing
    noSniff: true,
    // XSS Protection (legacy browsers)
    xssFilter: true,
  }));
  app.use(cookieParser());

  // CORS configuration - allow both www and non-www
  app.enableCors({
    origin: allowedOrigins,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // API prefix
  app.setGlobalPrefix('api');

  await app.listen(port);
  logger.log(`🚀 ISKCON Backend running on http://localhost:${port}`);
  logger.log(`📚 API available at http://localhost:${port}/api`);
  logger.log(`🔒 CORS enabled for: ${allowedOrigins.join(', ')}`);
  logger.log(`⚙️ Environment: ${isProduction ? 'PRODUCTION' : 'DEVELOPMENT'}`);
}

bootstrap();

