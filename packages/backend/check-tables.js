const { Client } = require('pg');
require('dotenv').config();

const client = new Client({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME || 'gamehub',
});

async function checkTables() {
  try {
    await client.connect();
    console.log('✅ 连接到数据库成功\n');

    const result = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `);

    if (result.rows.length === 0) {
      console.log('❌ 数据库中没有表！');
      console.log('请确保：');
      console.log('1. NODE_ENV=development');
      console.log('2. 服务已启动并成功连接到数据库');
    } else {
      console.log(`✅ 找到 ${result.rows.length} 个表：\n`);
      result.rows.forEach((row, index) => {
        console.log(`${index + 1}. ${row.table_name}`);
      });
    }
  } catch (error) {
    console.error('❌ 错误:', error.message);
  } finally {
    await client.end();
  }
}

checkTables();

