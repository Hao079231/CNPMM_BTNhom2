const account = require('../model/account');
const bcrypt = require('bcrypt');
const token = require('../model/token');
const { sendOtpEmail } = require('../service/emailservice');
const { ACCOUNT_STATUS } = require('../constants/constant');
const { signAccessToken, signRefreshToken, verifyAccessToken, verifyRefreshToken } = require('../middleware/jwtAuth');

function generateOtp() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

exports.registerUser = async (req, res) => {
  try {
    const { email, username, fullName, password, phone, birthday } = req.body;

    // Kiểm tra trùng lặp
    const existingEmail = await account.findOne({ where: { email } });
    if (existingEmail) {
      return res.status(400).json({ message: 'Email already exists' });
    }

    const existingUsername = await account.findOne({ where: { username } });
    if (existingUsername) {
      return res.status(400).json({ message: 'Username already exists' });
    }

    const existingPhone = await account.findOne({ where: { phone } });
    if (existingPhone) {
      return res.status(400).json({ message: 'Phone number already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Tạo OTP
    const otp = generateOtp();

    // Tạo account với trạng thái pending
    const newAccount = await account.create({
      email,
      username,
      fullName,
      password: hashedPassword,
      phone,
      birthday,
      status: ACCOUNT_STATUS.PENDING,  // lưu status từ constant
      otp,                             // lưu otp vào DB
      otpAttempts: 0
    });

    // Gửi email OTP
    await sendOtpEmail(email, otp);

    return res.status(200).json({ message: 'User registered. OTP sent to email.' });
  } catch (error) {
    console.error('Error registering user:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await account.findOne({ where: { email } });
    if (!user) {
      return res.status(404).json({ message: 'Email or password is incorrect' });
    }

    // Check mật khẩu
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Email or password is incorrect' });
    }

    // Tạo tokens
    const accessToken = await signAccessToken(user.id);
    const refreshToken = await signRefreshToken(user.id);

    await token.create({
      accountId: user.id,
      access_token: accessToken,
      refresh_token: refreshToken
    });

    res.json({ accessToken, refreshToken });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Login failed' });
  }
};


exports.verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;
    const user = await account.findOne({ where: { email } });
    if (!user) return res.status(404).json({ message: 'Account not found' });

    if (user.status === -1) return res.status(403).json({ message: 'Account is locked' });

    if (user.otp !== otp) {
      user.otpAttempts += 1;
      if (user.otpAttempts >= 5) {
        user.status = ACCOUNT_STATUS.LOCKED;
        await user.save();
        return res.status(403).json({ message: 'Account locked due to too many failed attempts' });
      }
      await user.save();
      return res.status(400).json({ message: 'Invalid OTP', attempts: user.otpAttempts });
    }

    // Đúng OTP
    user.status = ACCOUNT_STATUS.ACTIVE;
    user.otp = null;
    user.otpAttempts = 0;
    await user.save();

    return res.status(200).json({ message: 'OTP verified. Account activated.' });
  } catch (error) {
    console.error('Error verifying OTP:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

exports.resendOtp = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await account.findOne({ where: { email } });
    if (!user) return res.status(404).json({ message: 'Account not found' });

    if (user.status === -1) return res.status(403).json({ message: 'Account is locked' });

    // Tạo OTP mới
    const otp = generateOtp();
    user.otp = otp;
    user.otpAttempts = 0;
    await user.save();

    // Gửi email OTP
    await sendOtpEmail(email, otp);

    return res.status(200).json({ message: 'OTP resent. Please check your email.' });
  } catch (error) {
    console.error('Error resending OTP:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

exports.getProfifleUser = async (req, res) => {
  try {
    const decode = req.user; // payload đã decode từ token { id, username, kind, pCodes }
    const requestUser = await account.findByPk(decode.id);

    if (!requestUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    const studentData = requestUser.toJSON();
    delete studentData.id;
    delete studentData.password;
    delete studentData.status;
    delete studentData.otp;
    delete studentData.otpAttempt;
    delete studentData.createdAt;
    delete studentData.updatedAt;

    return res.status(200).json({ message: 'Get user profile successfully', profile: studentData });
  } catch (error) {
    console.error('Error getting user profile:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

exports.displayUserProfile = async (req, res) => {
  try {
    const decode = req.user; // payload đã decode từ token { id, username, kind, pCodes }
    const requestUser = await account.findByPk(decode.id);

    if (!requestUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    const studentData = decode.fullName;

    return res.status(200).json({ message: 'Get user profile successfully', profile: studentData });
  } catch (error) {
    console.error('Error getting user profile:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};
