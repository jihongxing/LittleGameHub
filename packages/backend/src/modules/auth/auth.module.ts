/**
 * Auth Module
 * 认证模块
 *
 * Handles user authentication, including traditional and OAuth methods
 * 处理用户认证，包括传统和OAuth方式
 */

import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthController } from './controllers/auth.controller';
import { OAuthController } from './controllers/oauth.controller';
import { JwtService } from './services/jwt.service';
import { OAuthBackendService } from './services/oauth.service';
import { UserAuthMethodRepository } from './repositories/user-auth-method.repository';
import { UserAuthMethod } from './entities/user-auth-method.entity';
import { User } from '../users/entities/user.entity';

@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forFeature([UserAuthMethod, User]),
  ],
  controllers: [
    AuthController,
    OAuthController,
  ],
  providers: [
    JwtService,
    OAuthBackendService,
    UserAuthMethodRepository,
  ],
  exports: [
    JwtService,
    OAuthBackendService,
  ],
})
export class AuthModule {}
