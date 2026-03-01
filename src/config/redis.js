import Redis from 'ioredis'
import { env } from './env.js'

/** @type {Redis | null} */
let redisClient = null

/**
 * Get or create a shared Redis connection (for BullMQ queue/worker).
 * @returns {Redis}
 */
export function getRedisConnection() {
  if (!redisClient) {
    redisClient = new Redis(env.REDIS_URL, {
      maxRetriesPerRequest: null,
    })
  }
  return redisClient
}

/**
 * Close the Redis connection. Call on graceful shutdown.
 * @returns {Promise<void>}
 */
export async function closeRedisConnection() {
  if (redisClient) {
    await redisClient.quit()
    redisClient = null
  }
}
