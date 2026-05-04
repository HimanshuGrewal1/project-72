const authService = require('../services/authService');

const signup = async (req, res, next) => {
  try {
    console.log('Signup request body:', req.body);
    const { name, email, password } = req.body;
    console.log('Signup data:', { name, email });
    const result = await authService.signup({ name, email, password });
    res.status(201).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};

const signupf = async (req, res, next) => {
  try {
    console.log('Signupf request body:', req.body);
    const { name, email, password } = req.body;
    console.log('Signupf data:', { name, email });
    const result = await authService.signupf({ name, email, password });
    res.status(201).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const result = await authService.login({ email, password });
    res.status(200).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};

const refresh = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return res.status(400).json({ success: false, message: 'Refresh token required' });
    }
    const tokens = await authService.refresh(refreshToken);
    res.status(200).json({ success: true, data: tokens });
  } catch (err) {
    next(err);
  }
};

const logout = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const accessToken = authHeader && authHeader.split(' ')[1];
    await authService.logout(req.user.id, accessToken);
    res.status(200).json({ success: true, message: 'Logged out successfully' });
  } catch (err) {
    next(err);
  }
};

const getMe = async (req, res, next) => {
  try {
    const user = await authService.getMe(req.user.id);
    res.status(200).json({ success: true, data: user });
  } catch (err) {
    next(err);
  }
};

module.exports = { signup, login, refresh, logout, getMe, signupf };