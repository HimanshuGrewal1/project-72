const Redis = require('ioredis');
const config = require('../config');

const redis = new Redis(config.REDIS_URL);

redis.on('connect', () => console.log('Redis connected'));
redis.on('error', (err) => console.error('Redis error:', err.message));

// Blacklist an access token (on logout)
const blacklistToken = async (token, expiresInSeconds) => {
  await redis.set(`blacklist:${token}`, '1', 'EX', expiresInSeconds);
};

// Check if token is blacklisted
const isBlacklisted = async (token) => {
  const result = await redis.get(`blacklist:${token}`);
  return result !== null;
};

// Cache user session data
const cacheSession = async (userId, data, ttlSeconds) => {
  await redis.set(`session:${userId}`, JSON.stringify(data), 'EX', ttlSeconds);
};

const getCachedSession = async (userId) => {
  const data = await redis.get(`session:${userId}`);
  return data ? JSON.parse(data) : null;
};

const deleteCachedSession = async (userId) => {
  await redis.del(`session:${userId}`);
};

module.exports = {
  redis,
  blacklistToken,
  isBlacklisted,
  cacheSession,
  getCachedSession,
  deleteCachedSession,
};