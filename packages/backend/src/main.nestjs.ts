/**
 * NestJS Application Entry Point
 * Tasks: T025
 * 
 * To run NestJS application:
 * - Development: npm run dev:nestjs
 * - Production: npm run build:nestjs && npm run start:nestjs
 */

import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { env, validateEnv } from './config/env';
import { GlobalValidationPipe } from './common/pipes/validation.pipe';
import { ErrorHandlerInterceptor } from './common/interceptors/error-handler.interceptor';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { initializeDatabase } from './config/database.config';
import { initializeRedis } from './config/redis.config';

async function bootstrap() {
  // Validate environment variables
  validateEnv();

  // Initialize database
  await initializeDatabase();
  console.log('✅ Database initialized');

  // Initialize Redis
  await initializeRedis();
  console.log('✅ Redis initialized');

  // Create NestJS application
  const app = await NestFactory.create(AppModule, {
    logger: ['log', 'error', 'warn', 'debug', 'verbose'],
  });

  // Global validation pipe
  app.useGlobalPipes(new GlobalValidationPipe());

  // Global interceptors
  app.useGlobalInterceptors(
    new LoggingInterceptor(),
    new ErrorHandlerInterceptor()
  );

  // CORS configuration
  app.enableCors({
    origin: env.CORS_ORIGIN.split(','),
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  });

  // API prefix
  app.setGlobalPrefix(env.API_PREFIX);

  // Start server
  const port = env.PORT;
  await app.listen(port);
  
  console.log('');
  console.log('🚀 GameHub API Server Started');
  console.log(`📍 URL: http://localhost:${port}${env.API_PREFIX}`);
  console.log(`🌍 Environment: ${env.NODE_ENV}`);
  console.log(`⏰ Started at: ${new Date().toISOString()}`);
  console.log('');
}

bootstrap().catch((error) => {
  console.error('❌ Failed to start NestJS application:', error);
  process.exit(1);
});

