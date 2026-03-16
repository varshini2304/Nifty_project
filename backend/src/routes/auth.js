// backend/src/routes/auth.js
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body } = require('express-validator');
const { asyncHandler } = require('../utils/asyncHandler');
const { validateRequest } = require('../utils/validateRequest');
const { success, error } = require('../utils/apiResponse');
const { loginLimiter } = require('../middleware/rateLimiter');
const { authMiddleware } = require('../middleware/authMiddleware');

const router = express.Router();

router.post(
  '/login',
  loginLimiter,
  [
    body('username').trim().notEmpty().withMessage('Username is required'),
    body('password').notEmpty().withMessage('Password is required'),
  ],
  asyncHandler(async (req, res) => {
    const validationError = validateRequest(req, res);
    if (validationError) {
      return;
    }

    const { username, password } = req.body;
    const expectedUser = process.env.NICHIN_USERNAME;
    const expectedHash = process.env.NICHIN_PASSWORD_HASH;

    const usernameOk = username === expectedUser;
    const passwordOk = await bcrypt.compare(password, expectedHash);

    if (!usernameOk || !passwordOk) {
      return error(res, 'Invalid credentials', 401);
    }

    const payload = { username: expectedUser, role: 'admin' };
    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      algorithm: 'HS256',
      expiresIn: process.env.JWT_EXPIRES_IN,
    });

    return success(res, { accessToken: token, expiresIn: process.env.JWT_EXPIRES_IN }, 'Login successful');
  })
);

router.post(
  '/logout',
  authMiddleware,
  asyncHandler(async (req, res) => {
    return success(res, null, 'Logged out');
  })
);

router.get(
  '/me',
  authMiddleware,
  asyncHandler(async (req, res) => {
    return success(res, { username: req.user.username, role: req.user.role }, 'Current user');
  })
);

module.exports = router;
