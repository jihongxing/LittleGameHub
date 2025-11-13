import { createClient, RedisClientType } from 'redis'
import { logger } from '@/utils/logger'
import { env } from './env'

let redisClient: RedisClientType

/**
 * 连接Redis
 */
export async function connectRedis(): Promise<RedisClientType> {
  try {
    console.log('🔍 Redis connection config:', {
      host: env.REDIS_HOST,
      port: env.REDIS_PORT,
      portType: typeof env.REDIS_PORT,
      password: env.REDIS_PASSWORD ? '***SET***' : 'NOT SET',
    });
    
    redisClient = createClient({
      socket: {
        host: env.REDIS_HOST,
        port: Number(env.REDIS_PORT)
      },
      password: env.REDIS_PASSWORD || undefined
    })

    redisClient.on('error', (err) => {
      logger.error('Redis连接错误:', err)
    })

    redisClient.on('connect', () => {
      logger.info('Redis连接成功，密码值：' + (env.REDIS_PASSWORD ? '已设置' : '未设置'))
    })

    await redisClient.connect()
    return redisClient
  } catch (error) {
    logger.error('Redis连接失败:', error)
    throw error
  }
}

/**
 * 关闭Redis连接
 */
export async function closeRedis(): Promise<void> {
  try {
    if (redisClient) {
      await redisClient.quit()
      logger.info('Redis连接已关闭')
    }
  } catch (error) {
    logger.error('关闭Redis连接失败:', error)
    throw error
  }
}

/**
 * 获取Redis客户端
 */
export function getRedisClient(): RedisClientType {
  if (!redisClient) {
    throw new Error('Redis客户端未初始化')
  }
  return redisClient
}

/**
 * 设置缓存
 */
export async function setCache(
  key: string, 
  value: any, 
  ttl?: number
): Promise<void> {
  try {
    const client = getRedisClient()
    const serializedValue = JSON.stringify(value)
    
    if (ttl) {
      await client.setEx(key, ttl, serializedValue)
    } else {
      await client.set(key, serializedValue)
    }
  } catch (error) {
    logger.error(`设置缓存失败 [${key}]:`, error)
    throw error
  }
}

/**
 * 获取缓存
 */
export async function getCache<T>(key: string): Promise<T | null> {
  try {
    const client = getRedisClient()
    const value = await client.get(key)
    
    if (!value) {
      return null
    }
    
    return JSON.parse(value) as T
  } catch (error) {
    logger.error(`获取缓存失败 [${key}]:`, error)
    return null
  }
}

/**
 * 删除缓存
 */
export async function deleteCache(key: string): Promise<void> {
  try {
    const client = getRedisClient()
    await client.del(key)
  } catch (error) {
    logger.error(`删除缓存失败 [${key}]:`, error)
    throw error
  }
}

/**
 * 检查缓存是否存在
 */
export async function existsCache(key: string): Promise<boolean> {
  try {
    const client = getRedisClient()
    return await client.exists(key) === 1
  } catch (error) {
    logger.error(`检查缓存存在性失败 [${key}]:`, error)
    return false
  }
}