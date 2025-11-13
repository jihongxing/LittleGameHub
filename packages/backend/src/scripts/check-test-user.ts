/**
 * 检查测试用户脚本
 * Check Test User Script
 */

import 'reflect-metadata';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as bcrypt from 'bcryptjs';

// 加载环境变量
const envPath = path.resolve(__dirname, '../../../../.env');
dotenv.config({ path: envPath });

import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../modules/users/entities/user.entity';

async function checkTestUser() {
  console.log('🔍 检查测试用户...');
  
  try {
    const app = await NestFactory.createApplicationContext(AppModule);
    const userRepository = app.get<Repository<User>>(getRepositoryToken(User));
    
    // 查找测试用户
    const testUser = await userRepository.findOne({
      where: { email: 'testuser001@gamehub.test' }
    });
    
    if (!testUser) {
      console.log('❌ 测试用户不存在');
      
      // 创建测试用户
      console.log('🚀 创建测试用户...');
      const hashedPassword = await bcrypt.hash('Test123456!', 10);
      
      const user = userRepository.create({
        nickname: '测试用户001 (testuser001)',
        email: 'testuser001@gamehub.test',
        password_hash: hashedPassword,
        registration_date: new Date(),
        is_active: true,
        is_email_verified: true,
        role: 'user'
      });
      
      const savedUser = await userRepository.save(user);
      console.log('✅ 测试用户创建成功:', savedUser.email);
    } else {
      console.log('✅ 测试用户已存在:', testUser.email);
      console.log('📋 用户信息:');
      console.log('   ID:', testUser.id);
      console.log('   昵称:', testUser.nickname);
      console.log('   邮箱:', testUser.email);
      console.log('   激活状态:', testUser.is_active);
      console.log('   邮箱验证:', testUser.is_email_verified);
      console.log('   密码哈希长度:', testUser.password_hash?.length || 0);
      
      // 测试密码验证
      const testPassword = 'Test123456!';
      const isValid = await bcrypt.compare(testPassword, testUser.password_hash || '');
      console.log('🔐 密码验证结果:', isValid ? '✅ 正确' : '❌ 错误');
      
      if (!isValid) {
        console.log('🔧 重新设置密码...');
        const newHashedPassword = await bcrypt.hash(testPassword, 10);
        testUser.password_hash = newHashedPassword;
        await userRepository.save(testUser);
        console.log('✅ 密码已重新设置');
      }
    }
    
    await app.close();
    
  } catch (error) {
    console.error('❌ 检查失败:', error);
    process.exit(1);
  }
}

// 运行脚本
checkTestUser().catch(console.error);
