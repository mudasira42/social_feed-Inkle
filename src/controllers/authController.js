const User = require('../models/User');
const jwt = require('jsonwebtoken');
const { successResponse, errorResponse } = require('../utils/apiResponse');

// Generate JWT Token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE
  });
};

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res) => {
  try {
    const { username, email, password, fullName, bio, profilePicture } = req.body;

    // Check if user exists
    const userExists = await User.findOne({ $or: [{ email }, { username }] });
    if (userExists) {
      return res.status(400).json(errorResponse('User already exists with this email or username'));
    }

    // Create user
    const user = await User.create({
      username,
      email,
      password,
      fullName,
      bio,
      profilePicture
    });

    // Generate token
    const token = generateToken(user._id);

    res.status(201).json(successResponse('User registered successfully', {
      user,
      token
    }));
  } catch (error) {
    res.status(500).json(errorResponse(error.message));
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json(errorResponse('Please provide email and password'));
    }

    // Find user with password
    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      return res.status(401).json(errorResponse('Invalid credentials'));
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(401).json(errorResponse('Your account has been deactivated'));
    }

    // Check password
    const isPasswordValid = await user.matchPassword(password);
    if (!isPasswordValid) {
      return res.status(401).json(errorResponse('Invalid credentials'));
    }

    // Generate token
    const token = generateToken(user._id);

    // Remove password from output
    user.password = undefined;

    res.status(200).json(successResponse('Login successful', {
      user,
      token
    }));
  } catch (error) {
    res.status(500).json(errorResponse(error.message));
  }
};

// @desc    Get current user profile
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    res.status(200).json(successResponse('User profile retrieved', user));
  } catch (error) {
    res.status(500).json(errorResponse(error.message));
  }
};