/**
 * 创建测试用户脚本
 * Create Test Users Script
 * 
 * 批量创建测试用户 testuser001-testuser100
 * Batch create test users testuser001-testuser100
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
import { User, MembershipStatus } from '../modules/users/entities/user.entity';

async function createTestUsers() {
  console.log('🚀 开始创建测试用户...');
  
  try {
    const app = await NestFactory.createApplicationContext(AppModule);
    const userRepository = app.get<Repository<User>>(getRepositoryToken(User));
    
    const password = 'Test123456!';
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const users: User[] = [];
    const batchSize = 10; // 每批处理10个用户
    
    for (let i = 1; i <= 100; i++) {
      const userNumber = i.toString().padStart(3, '0'); // 001, 002, ..., 100
      const username = `testuser${userNumber}`;
      const email = `testuser${userNumber}@gamehub.test`;
      const nickname = `测试用户${userNumber}`;
      
      // 检查用户是否已存在
      const existingUser = await userRepository.findOne({
        where: { email }
      });
      
      if (existingUser) {
        console.log(`⚠️  用户 ${email} 已存在，跳过`);
        continue;
      }
      
      const user = userRepository.create({
        nickname: `${nickname} (${username})`,
        email,
        password_hash: hashedPassword,
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${username}`, // 随机头像
        point_balance: Math.floor(Math.random() * 1000), // 随机积分 0-999
        membership_status: Math.random() > 0.8 ? MembershipStatus.MEMBER : MembershipStatus.FREE, // 20%概率为会员
        registration_date: new Date(), // 注册日期
        is_active: true,
        is_email_verified: true,
        role: 'user'
      });
      
      users.push(user);
      
      // 批量保存
      if (users.length >= batchSize) {
        await userRepository.save(users);
        console.log(`✅ 已创建 ${users.length} 个用户 (${username})`);
        users.length = 0; // 清空数组
      }
    }
    
    // 保存剩余用户
    if (users.length > 0) {
      await userRepository.save(users);
      console.log(`✅ 已创建剩余 ${users.length} 个用户`);
    }
    
    console.log('🎉 测试用户创建完成！');
    console.log('📋 用户信息：');
    console.log('   昵称: 测试用户001 (testuser001) - 测试用户100 (testuser100)');
    console.log('   密码: Test123456!');
    console.log('   邮箱: testuser001@gamehub.test - testuser100@gamehub.test');
    console.log('   积分: 随机 0-999');
    console.log('   会员状态: 80% 免费用户, 20% 会员用户');
    
    await app.close();
    
  } catch (error) {
    console.error('❌ 创建测试用户失败:', error);
    process.exit(1);
  }
}


// 运行脚本
createTestUsers().catch(console.error);
