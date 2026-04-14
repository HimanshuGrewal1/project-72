const tokenService = require('../services/tokenService');
const { isBlacklisted } = require('../cache/redisClient');

const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];

    const blacklisted = await isBlacklisted(token);
    if (blacklisted) {
      return res.status(401).json({ success: false, message: 'Token revoked' });
    }

    const payload = tokenService.verifyAccessToken(token);
    req.user = payload;
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Invalid or expired token' });
  }
};

module.exports = authenticate;