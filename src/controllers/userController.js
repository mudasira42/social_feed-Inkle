const User = require('../models/User');
const Follow = require('../models/Follow');
const Block = require('../models/Block');
const ActivityService = require('../services/activityService');
const { successResponse, errorResponse } = require('../utils/apiResponse');

// @desc    Follow a user
// @route   POST /api/users/:id/follow
// @access  Private
exports.followUser = async (req, res) => {
  try {
    const userToFollow = await User.findById(req.params.id);

    if (!userToFollow) {
      return res.status(404).json(errorResponse('User not found'));
    }

    if (req.params.id === req.user.id) {
      return res.status(400).json(errorResponse('You cannot follow yourself'));
    }

    // Check if already following
    const existingFollow = await Follow.findOne({
      follower: req.user.id,
      following: req.params.id
    });

    if (existingFollow) {
      return res.status(400).json(errorResponse('You are already following this user'));
    }

    // Create follow
    await Follow.create({
      follower: req.user.id,
      following: req.params.id
    });

    // Update counts
    await User.findByIdAndUpdate(req.user.id, { $inc: { followingCount: 1 } });
    await User.findByIdAndUpdate(req.params.id, { $inc: { followersCount: 1 } });

    // Create activity
    await ActivityService.createActivity('USER_FOLLOWED', req.user.id, req.params.id, 'User');

    res.status(200).json(successResponse('User followed successfully'));
  } catch (error) {
    res.status(500).json(errorResponse(error.message));
  }
};

// @desc    Unfollow a user
// @route   DELETE /api/users/:id/follow
// @access  Private
exports.unfollowUser = async (req, res) => {
  try {
    const follow = await Follow.findOneAndDelete({
      follower: req.user.id,
      following: req.params.id
    });

    if (!follow) {
      return res.status(400).json(errorResponse('You are not following this user'));
    }

    // Update counts
    await User.findByIdAndUpdate(req.user.id, { $inc: { followingCount: -1 } });
    await User.findByIdAndUpdate(req.params.id, { $inc: { followersCount: -1 } });

    // Create activity
    await ActivityService.createActivity('USER_UNFOLLOWED', req.user.id, req.params.id, 'User');

    res.status(200).json(successResponse('User unfollowed successfully'));
  } catch (error) {
    res.status(500).json(errorResponse(error.message));
  }
};

// @desc    Block a user
// @route   POST /api/users/:id/block
// @access  Private
exports.blockUser = async (req, res) => {
  try {
    const userToBlock = await User.findById(req.params.id);

    if (!userToBlock) {
      return res.status(404).json(errorResponse('User not found'));
    }

    if (req.params.id === req.user.id) {
      return res.status(400).json(errorResponse('You cannot block yourself'));
    }

    // Check if already blocked
    const existingBlock = await Block.findOne({
      blocker: req.user.id,
      blocked: req.params.id
    });

    if (existingBlock) {
      return res.status(400).json(errorResponse('You have already blocked this user'));
    }

    // Create block
    await Block.create({
      blocker: req.user.id,
      blocked: req.params.id
    });

    // Remove follow relationships if they exist
    await Follow.deleteOne({ follower: req.user.id, following: req.params.id });
    await Follow.deleteOne({ follower: req.params.id, following: req.user.id });

    res.status(200).json(successResponse('User blocked successfully'));
  } catch (error) {
    res.status(500).json(errorResponse(error.message));
  }
};

// @desc    Unblock a user
// @route   DELETE /api/users/:id/block
// @access  Private
exports.unblockUser = async (req, res) => {
  try {
    const block = await Block.findOneAndDelete({
      blocker: req.user.id,
      blocked: req.params.id
    });

    if (!block) {
      return res.status(400).json(errorResponse('You have not blocked this user'));
    }

    res.status(200).json(successResponse('User unblocked successfully'));
  } catch (error) {
    res.status(500).json(errorResponse(error.message));
  }
};

// @desc    Get user profile
// @route   GET /api/users/:id
// @access  Private
exports.getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');

    if (!user) {
      return res.status(404).json(errorResponse('User not found'));
    }

    // Check if user is blocked
    const isBlocked = await Block.findOne({
      blocker: req.user.id,
      blocked: req.params.id
    });

    if (isBlocked) {
      return res.status(403).json(errorResponse('You have blocked this user'));
    }

    res.status(200).json(successResponse('User profile retrieved', user));
  } catch (error) {
    res.status(500).json(errorResponse(error.message));
  }
};

// @desc    Get all users
// @route   GET /api/users
// @access  Private
exports.getAllUsers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const users = await User.find({ isActive: true })
      .select('-password')
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    const total = await User.countDocuments({ isActive: true });

    res.status(200).json(successResponse('Users retrieved successfully', {
      users,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    }));
  } catch (error) {
    res.status(500).json(errorResponse(error.message));
  }
};

// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private
exports.updateProfile = async (req, res) => {
  try {
    const { fullName, bio, profilePicture } = req.body;

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { fullName, bio, profilePicture },
      { new: true, runValidators: true }
    ).select('-password');

    res.status(200).json(successResponse('User unfollowed successfully'));
  } catch (error) {
    res.status(500).json(errorResponse(error.message));
  }
};

// @desc    Block a user
// @route   POST /api/users/:id/block
// @access  Private
exports.blockUser = async (req, res) => {
  try {
    const userToBlock = await User.findById(req.params.id);

    if (!userToBlock) {
      return res.status(404).json(errorResponse('User not found'));
    }

    if (req.params.id === req.user.id) {
      return res.status(400).json(errorResponse('You cannot block yourself'));
    }

    // Check if already blocked
    const existingBlock = await Block.findOne({
      blocker: req.user.id,
      blocked: req.params.id
    });

    if (existingBlock) {
      return res.status(400).json(errorResponse('You have already blocked this user'));
    }

    // Create block
    await Block.create({
      blocker: req.user.id,
      blocked: req.params.id
    });

    // Remove follow relationships if they exist
    await Follow.deleteOne({ follower: req.user.id, following: req.params.id });
    await Follow.deleteOne({ follower: req.params.id, following: req.user.id });

    res.status(200).json(successResponse('User blocked successfully'));
  } catch (error) {
    res.status(500).json(errorResponse(error.message));
  }
};

// @desc    Unblock a user
// @route   DELETE /api/users/:id/block
// @access  Private
exports.unblockUser = async (req, res) => {
  try {
    const block = await Block.findOneAndDelete({
      blocker: req.user.id,
      blocked: req.params.id
    });

    if (!block) {
      return res.status(400).json(errorResponse('You have not blocked this user'));
    }

    res.status(200).json(successResponse('User unblocked successfully'));
  } catch (error) {
    res.status(500).json(errorResponse(error.message));
  }
};

// @desc    Get user profile
// @route   GET /api/users/:id
// @access  Private
exports.getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');

    if (!user) {
      return res.status(404).json(errorResponse('User not found'));
    }

    // Check if user is blocked
    const isBlocked = await Block.findOne({
      blocker: req.user.id,
      blocked: req.params.id
    });

    if (isBlocked) {
      return res.status(403).json(errorResponse('You have blocked this user'));
    }

    res.status(200).json(successResponse('User profile retrieved', user));
  } catch (error) {
    res.status(500).json(errorResponse(error.message));
  }
};

// @desc    Get all users
// @route   GET /api/users
// @access  Private
exports.getAllUsers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const users = await User.find({ isActive: true })
      .select('-password')
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    const total = await User.countDocuments({ isActive: true });

    res.status(200).json(successResponse('Users retrieved successfully', {
      users,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    }));
  } catch (error) {
    res.status(500).json(errorResponse(error.message));
  }
};

// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private
exports.updateProfile = async (req, res) => {
  try {
    const { fullName, bio, profilePicture } = req.body;

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { fullName, bio, profilePicture },
      { new: true, runValidators: true }
    ).select('-password');

    res.status(200).json(successResponse('Profile updated successfully', user));
  } catch (error) {
    res.status(500).json(errorResponse(error.message));
  }
};