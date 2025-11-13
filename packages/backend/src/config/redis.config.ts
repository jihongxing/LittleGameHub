/**
 * Redis Configuration
 * Task: T017
 * 
 * Redis connection setup for caching, sessions, and rate limiting
 */

import { createClient, RedisClientType } from 'redis';
import { env } from './env';

/**
 * Redis client instance
 */
let redisClient: RedisClientType | null = null;

/**
 * Redis configuration options
 */
export const redisConfig = {
  socket: {
    host: env.REDIS_HOST,
    port: env.REDIS_PORT,
    reconnectStrategy: (retries: number) => {
      if (retries > 10) {
        console.error('❌ Redis connection failed after 10 retries');
        return new Error('Too many retries');
      }
      return Math.min(retries * 100, 3000);
    },
  },
  // Use password for Redis authentication (requirepass)
  password: env.REDIS_PASSWORD || undefined,
  database: env.REDIS_DB,
};

// Debug: Log Redis configuration
console.log('🔍 Redis Config:', {
  host: env.REDIS_HOST,
  port: env.REDIS_PORT,
  password: env.REDIS_PASSWORD ? '***SET***' : 'NOT SET',
  database: env.REDIS_DB,
  passwordType: typeof env.REDIS_PASSWORD,
  hasPassword: !!env.REDIS_PASSWORD,
});

/**
 * Initialize Redis connection
 */
export async function initializeRedis(): Promise<RedisClientType> {
  try {
    if (redisClient && redisClient.isOpen) {
      return redisClient;
    }

    redisClient = createClient(redisConfig);

    // Error handling
    redisClient.on('error', (error) => {
      console.error('❌ Redis Client Error:', error);
    });

    redisClient.on('connect', () => {
      console.log('🔄 Redis connecting...');
    });

    redisClient.on('ready', () => {
      console.log('✅ Redis connection established successfully');
    });

    redisClient.on('reconnecting', () => {
      console.log('🔄 Redis reconnecting...');
    });

    await redisClient.connect();
    return redisClient;
  } catch (error) {
    console.error('❌ Redis connection failed:', error);
    console.error('⚠️  CRITICAL: Redis service must be running!');
    console.error('Please ensure Redis is started before running the application.');
    throw error;
  }
}

/**
 * Get Redis client instance
 */
export function getRedisClient(): RedisClientType {
  if (!redisClient || !redisClient.isOpen) {
    throw new Error('Redis client not initialized. Call initializeRedis() first.');
  }
  return redisClient;
}

/**
 * Close Redis connection
 */
export async function closeRedis(): Promise<void> {
  if (redisClient && redisClient.isOpen) {
    await redisClient.quit();
    console.log('Redis connection closed');
    redisClient = null;
  }
}

/**
 * Check Redis connection health
 */
export async function checkRedisHealth(): Promise<boolean> {
  try {
    if (!redisClient || !redisClient.isOpen) {
      return false;
    }
    await redisClient.ping();
    return true;
  } catch (error) {
    console.error('Redis health check failed:', error);
    return false;
  }
}

/**
 * Redis cache helper functions
 */
export const RedisCache = {
  /**
   * Set value with expiration (in seconds)
   */
  async set(key: string, value: string, expirationSeconds?: number): Promise<void> {
    const client = getRedisClient();
    if (expirationSeconds) {
      await client.setEx(key, expirationSeconds, value);
    } else {
      await client.set(key, value);
    }
  },

  /**
   * Get value by key
   */
  async get(key: string): Promise<string | null> {
    const client = getRedisClient();
    return await client.get(key);
  },

  /**
   * Delete key
   */
  async del(key: string): Promise<void> {
    const client = getRedisClient();
    await client.del(key);
  },

  /**
   * Check if key exists
   */
  async exists(key: string): Promise<boolean> {
    const client = getRedisClient();
    return (await client.exists(key)) === 1;
  },

  /**
   * Set expiration on existing key
   */
  async expire(key: string, seconds: number): Promise<void> {
    const client = getRedisClient();
    await client.expire(key, seconds);
  },

  /**
   * Increment value
   */
  async incr(key: string): Promise<number> {
    const client = getRedisClient();
    return await client.incr(key);
  },

  /**
   * Decrement value
   */
  async decr(key: string): Promise<number> {
    const client = getRedisClient();
    return await client.decr(key);
  },

  /**
   * Get all keys matching pattern
   */
  async keys(pattern: string): Promise<string[]> {
    const client = getRedisClient();
    return await client.keys(pattern);
  },

  /**
   * Flush all data (use with caution!)
   */
  async flushAll(): Promise<void> {
    const client = getRedisClient();
    await client.flushAll();
  },
};

