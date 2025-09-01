const jwt = require('jsonwebtoken');
require('dotenv').config();
const account = require('../model/account');

const signAccessToken = async (userId) => {
  try {
    // Tìm tài khoản và bao gồm thông tin group và permissions
    const acc = await account.findByPk(userId);

    if (!acc) {
      throw new Error('User not found');
    }

    // Tạo payload cho token
    const payload = {
      id: acc.id,
      username: acc.username,
      fullName: acc.fullName
    };

    // Tạo Access Token
    return jwt.sign(payload, process.env.JWT_ACCESS_SECRET, {
      expiresIn: process.env.JWT_ACCESS_EXPIRES,
    });
  } catch (error) {
    throw new Error(`Failed to sign access token: ${error.message}`);
  }
};

const signRefreshToken = async (userId) => {
  try {
    const acc = await account.findByPk(userId);

    if (!acc) {
      throw new Error('User not found');
    }

    const payload = {
      id: acc.id,
      username: acc.username
    };

    return jwt.sign(payload, process.env.JWT_REFRESH_SECRET, {
      expiresIn: process.env.JWT_REFRESH_EXPIRES,
    });
  } catch (error) {
    throw new Error(`Failed to sign refresh token: ${error.message}`);
  }
};

const verifyAccessToken = (token) => {
  try {
    jwt.verify(token, process.env.JWT_ACCESS_SECRET);
    return true;
  } catch (err) {
    return false;
  }
};


const verifyRefreshToken = (token) => {
  return new Promise((resolve, reject) => {
    jwt.verify(token, process.env.REFRESH_TOKEN_SECRET, (err, user) => {
      if (err) return reject(err);
      resolve(user);
    });
  });
};

module.exports = {
  signAccessToken,
  signRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
};
