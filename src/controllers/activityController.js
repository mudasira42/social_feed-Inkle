const Block = require('../models/Block');
const ActivityService = require('../services/activityService');
const { successResponse, errorResponse } = require('../utils/apiResponse');

// @desc    Get activity feed
// @route   GET /api/activities
// @access  Private
exports.getActivityFeed = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;

    // Get blocked users
    const blocks = await Block.find({ blocker: req.user.id });
    const blockedUserIds = blocks.map(block => block.blocked);

    const result = await ActivityService.getActivityFeed(req.user.id, page, limit, blockedUserIds);

    res.status(200).json(successResponse('Activity feed retrieved successfully', result));
  } catch (error) {
    res.status(500).json(errorResponse(error.message));
  }
};

// @desc    Get user-specific activities
// @route   GET /api/activities/user/:userId
// @access  Private
exports.getUserActivities = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const Activity = require('../models/Activity');

    const activities = await Activity.find({ actor: req.params.userId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('actor', 'username fullName profilePicture')
      .populate('target', 'content username fullName');

    const total = await Activity.countDocuments({ actor: req.params.userId });

    res.status(200).json(successResponse('User activities retrieved successfully', {
      activities,
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