/**
 * 创建简单测试用户
 * Create Simple Test User
 */

import 'reflect-metadata';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as bcrypt from 'bcryptjs';

// 加载环境变量
const envPath = path.resolve(__dirname, '../../../../.env');
dotenv.config({ path: envPath });

import { DataSource } from 'typeorm';
import { User, MembershipStatus } from '../modules/users/entities/user.entity';

async function createSimpleTestUser() {
  console.log('🚀 创建简单测试用户...');
  
  // 创建数据源
  const dataSource = new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    username: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'password',
    database: process.env.DB_DATABASE || 'gamehub',
    entities: [User],
    synchronize: false,
  });

  try {
    await dataSource.initialize();
    console.log('✅ 数据库连接成功');

    const userRepository = dataSource.getRepository(User);
    
    // 检查测试用户是否存在
    const existingUser = await userRepository.findOne({
      where: { email: 'testuser001@gamehub.test' }
    });
    
    if (existingUser) {
      console.log('⚠️  测试用户已存在，删除旧用户...');
      await userRepository.remove(existingUser);
    }
    
    // 创建新的测试用户
    const password = 'Test123456!';
    const hashedPassword = await bcrypt.hash(password, 10);
    
    console.log('🔐 密码信息:');
    console.log('   原始密码:', password);
    console.log('   哈希密码:', hashedPassword);
    
    const user = userRepository.create({
      nickname: '测试用户001',
      email: 'testuser001@gamehub.test',
      password_hash: hashedPassword,
      registration_date: new Date(),
      membership_status: MembershipStatus.FREE,
      is_active: true,
      is_email_verified: true,
      role: 'user'
    });
    
    const savedUser = await userRepository.save(user);
    
    console.log('✅ 测试用户创建成功:');
    console.log('   ID:', savedUser.id);
    console.log('   邮箱:', savedUser.email);
    console.log('   昵称:', savedUser.nickname);
    
    // 验证密码
    const isValid = await bcrypt.compare(password, savedUser.password_hash || '');
    console.log('🔍 密码验证:', isValid ? '✅ 成功' : '❌ 失败');
    
    await dataSource.destroy();
    console.log('🎉 完成！');
    
  } catch (error) {
    console.error('❌ 创建失败:', error);
    process.exit(1);
  }
}

// 运行脚本
createSimpleTestUser().catch(console.error);
