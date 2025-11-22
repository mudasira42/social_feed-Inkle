const User = require('../models/User');
const Post = require('../models/Post');
const Like = require('../models/Like');
const ActivityService = require('../services/activityService');
const { successResponse, errorResponse } = require('../utils/apiResponse');

// @desc    Delete a post (Admin/Owner)
// @route   DELETE /api/admin/posts/:id
// @access  Private (Admin/Owner)
exports.deletePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json(errorResponse('Post not found'));
    }

    // Mark as deleted and store who deleted it
    post.isActive = false;
    post.deletedBy = req.user.id;
    post.deletedAt = new Date();
    await post.save();

    // Update author's post count
    await User.findByIdAndUpdate(post.author, { $inc: { postsCount: -1 } });

    // Create activity
    const activityType = req.user.role === 'owner' ? 'POST_DELETED_BY_OWNER' : 'POST_DELETED_BY_ADMIN';
    await ActivityService.createActivity(activityType, req.user.id, post._id, 'Post', {
      postAuthor: post.author
    });

    res.status(200).json(successResponse('Post deleted successfully'));
  } catch (error) {
    res.status(500).json(errorResponse(error.message));
  }
};

// @desc    Delete a user (Admin/Owner)
// @route   DELETE /api/admin/users/:id
// @access  Private (Admin/Owner)
exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json(errorResponse('User not found'));
    }

    // Cannot delete owner or yourself
    if (user.role === 'owner') {
      return res.status(403).json(errorResponse('Cannot delete owner account'));
    }

    if (req.params.id === req.user.id) {
      return res.status(400).json(errorResponse('You cannot delete your own account'));
    }

    // Admins cannot delete other admins
    if (req.user.role === 'admin' && user.role === 'admin') {
      return res.status(403).json(errorResponse('Admins cannot delete other admins'));
    }

    // Soft delete - deactivate user
    user.isActive = false;
    await user.save();

    // Create activity
    const activityType = req.user.role === 'owner' ? 'USER_DELETED_BY_OWNER' : 'USER_DELETED_BY_ADMIN';
    await ActivityService.createActivity(activityType, req.user.id, user._id, 'User', {
      deletedUsername: user.username
    });

    res.status(200).json(successResponse('User deleted successfully'));
  } catch (error) {
    res.status(500).json(errorResponse(error.message));
  }
};

// @desc    Delete a like (Admin/Owner)
// @route   DELETE /api/admin/likes/:id
// @access  Private (Admin/Owner)
exports.deleteLike = async (req, res) => {
  try {
    const like = await Like.findById(req.params.id);

    if (!like) {
      return res.status(404).json(errorResponse('Like not found'));
    }

    await Like.findByIdAndDelete(req.params.id);

    // Update post likes count
    await Post.findByIdAndUpdate(like.post, { $inc: { likesCount: -1 } });

    res.status(200).json(successResponse('Like deleted successfully'));
  } catch (error) {
    res.status(500).json(errorResponse(error.message));
  }
};

// @desc    Create admin (Owner only)
// @route   POST /api/admin/create
// @access  Private (Owner)
exports.createAdmin = async (req, res) => {
  try {
    const { userId } = req.body;

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json(errorResponse('User not found'));
    }

    if (user.role === 'admin') {
      return res.status(400).json(errorResponse('User is already an admin'));
    }

    if (user.role === 'owner') {
      return res.status(400).json(errorResponse('Cannot change owner role'));
    }

    user.role = 'admin';
    await user.save();

    // Create activity
    await ActivityService.createActivity('ADMIN_CREATED', req.user.id, user._id, 'User', {
      newAdminUsername: user.username
    });

    res.status(200).json(successResponse('Admin created successfully', user));
  } catch (error) {
    res.status(500).json(errorResponse(error.message));
  }
};

// @desc    Remove admin (Owner only)
// @route   DELETE /api/admin/:id
// @access  Private (Owner)
exports.removeAdmin = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json(errorResponse('User not found'));
    }

    if (user.role !== 'admin') {
      return res.status(400).json(errorResponse('User is not an admin'));
    }

    user.role = 'user';
    await user.save();

    // Create activity
    await ActivityService.createActivity('ADMIN_DELETED', req.user.id, user._id, 'User', {
      removedAdminUsername: user.username
    });

    res.status(200).json(successResponse('Admin removed successfully', user));
  } catch (error) {
    res.status(500).json(errorResponse(error.message));
  }
};

// @desc    Get all admins (Owner only)
// @route   GET /api/admin/list
// @access  Private (Owner)
exports.getAllAdmins = async (req, res) => {
  try {
    const admins = await User.find({ role: { $in: ['admin', 'owner'] }, isActive: true })
      .select('-password')
      .sort({ createdAt: -1 });

    res.status(200).json(successResponse('Admins retrieved successfully', admins));
  } catch (error) {
    res.status(500).json(errorResponse(error.message));
  }
};