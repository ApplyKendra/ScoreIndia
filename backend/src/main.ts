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
        connectSrc: ["'self'", frontendUrl],
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

  // CORS configuration
  app.enableCors({
    origin: [frontendUrl],
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
}

bootstrap();
