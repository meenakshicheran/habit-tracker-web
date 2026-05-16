import Redis from 'ioredis';

const globalForRedis = globalThis as unknown as { redis: Redis };

export const redis =
  globalForRedis.redis ??
  new Redis(process.env.REDIS_URL ?? 'redis://localhost:6379', {
    maxRetriesPerRequest: 1,
    enableReadyCheck: false,
    lazyConnect: true,
    retryStrategy: () => null, // don't reconnect — routes handle errors gracefully
  });

redis.on('error', () => {
  // Connection errors are handled per-operation; suppress uncaught error event
});

if (process.env.NODE_ENV !== 'production') globalForRedis.redis = redis;
