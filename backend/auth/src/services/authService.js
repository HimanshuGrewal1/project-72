const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const { User, Session } = require('../models');
const tokenService = require('./tokenService');
const { cacheSession, deleteCachedSession } = require('../cache/redisClient');
const config = require('../config');

const signup = async ({ name, email, password }) => {
  const existing = await User.findOne({ where: { email } });
  if (existing) {
    const err = new Error('Email already in use');
    err.statusCode = 409;
    throw err;
  }

  const password_hash = await bcrypt.hash(password, config.BCRYPT_ROUNDS);
  const user = await User.create({ name, email, password_hash });

  const accessToken = tokenService.signAccessToken({ id: user.id, email: user.email });
  const refreshToken = tokenService.signRefreshToken({ id: user.id });

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);

  await Session.create({
    user_id: user.id,
    refresh_token: refreshToken,
    expires_at: expiresAt,
  });

  await cacheSession(user.id, { id: user.id, email: user.email, name: user.name }, 900);

  return {
    accessToken,
    refreshToken,
    user: { id: user.id, name: user.name, email: user.email },
  };
};

const login = async ({ email, password }) => {
  const user = await User.findOne({ where: { email } });
  if (!user) {
    const err = new Error('Invalid credentials');
    err.statusCode = 401;
    throw err;
  }

  const isMatch = await bcrypt.compare(password, user.password_hash);
  if (!isMatch) {
    const err = new Error('Invalid credentials');
    err.statusCode = 401;
    throw err;
  }

  const accessToken = tokenService.signAccessToken({ id: user.id, email: user.email });
  const refreshToken = tokenService.signRefreshToken({ id: user.id });

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);

  // Rotate session — delete old, create new
  await Session.destroy({ where: { user_id: user.id } });
  await Session.create({
    user_id: user.id,
    refresh_token: refreshToken,
    expires_at: expiresAt,
  });

  await cacheSession(user.id, { id: user.id, email: user.email, name: user.name }, 900);

  return {
    accessToken,
    refreshToken,
    user: { id: user.id, name: user.name, email: user.email },
  };
};

const refresh = async (refreshToken) => {
  let payload;
  try {
    payload = tokenService.verifyRefreshToken(refreshToken);
  } catch {
    const err = new Error('Invalid refresh token');
    err.statusCode = 401;
    throw err;
  }

  const session = await Session.findOne({
    where: { user_id: payload.id, refresh_token: refreshToken },
  });

  if (!session || new Date() > session.expires_at) {
    const err = new Error('Session expired or not found');
    err.statusCode = 401;
    throw err;
  }

  const user = await User.findByPk(payload.id);
  const newAccessToken = tokenService.signAccessToken({ id: user.id, email: user.email });
  const newRefreshToken = tokenService.signRefreshToken({ id: user.id });

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);

  await session.update({ refresh_token: newRefreshToken, expires_at: expiresAt });

  return { accessToken: newAccessToken, refreshToken: newRefreshToken };
};

const logout = async (userId, accessToken) => {
  const ttl = tokenService.getTokenTTL(accessToken, process.env.JWT_ACCESS_SECRET);
  const { blacklistToken } = require('../cache/redisClient');
  if (ttl > 0) await blacklistToken(accessToken, ttl);

  await Session.destroy({ where: { user_id: userId } });
  await deleteCachedSession(userId);
};

const getMe = async (userId) => {
  const { getCachedSession } = require('../cache/redisClient');
  const cached = await getCachedSession(userId);
  if (cached) return cached;

  const user = await User.findByPk(userId, {
    attributes: ['id', 'name', 'email', 'created_at'],
  });

  if (!user) {
    const err = new Error('User not found');
    err.statusCode = 404;
    throw err;
  }

  return user;
};

module.exports = { signup, login, refresh, logout, getMe };