const Post = require('../models/Post');
const Like = require('../models/Like');
const User = require('../models/User');
const Block = require('../models/Block');
const ActivityService = require('../services/activityService');
const { successResponse, errorResponse } = require('../utils/apiResponse');

// @desc    Create a post
// @route   POST /api/posts
// @access  Private
exports.createPost = async (req, res) => {
  try {
    const { content, mediaUrls } = req.body;

    const post = await Post.create({
      author: req.user.id,
      content,
      mediaUrls: mediaUrls || []
    });

    // Update user's post count
    await User.findByIdAndUpdate(req.user.id, { $inc: { postsCount: 1 } });

    // Create activity
    await ActivityService.createActivity('POST_CREATED', req.user.id, post._id, 'Post');

    const populatedPost = await Post.findById(post._id).populate('author', 'username fullName profilePicture');

    res.status(201).json(successResponse('Post created successfully', populatedPost));
  } catch (error) {
    res.status(500).json(errorResponse(error.message));
  }
};

// @desc    Get all posts (excluding blocked users)
// @route   GET /api/posts
// @access  Private
exports.getAllPosts = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Get blocked users
    const blocks = await Block.find({ blocker: req.user.id });
    const blockedUserIds = blocks.map(block => block.blocked);

    const posts = await Post.find({
      isActive: true,
      author: { $nin: blockedUserIds }
    })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('author', 'username fullName profilePicture')
      .lean();

    const total = await Post.countDocuments({
      isActive: true,
      author: { $nin: blockedUserIds }
    });

    res.status(200).json(successResponse('Posts retrieved successfully', {
      posts,
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

// @desc    Get single post
// @route   GET /api/posts/:id
// @access  Private
exports.getPost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id)
      .populate('author', 'username fullName profilePicture');

    if (!post) {
      return res.status(404).json(errorResponse('Post not found'));
    }

    // Check if author is blocked
    const isBlocked = await Block.findOne({
      blocker: req.user.id,
      blocked: post.author._id
    });

    if (isBlocked) {
      return res.status(403).json(errorResponse('You have blocked this user'));
    }

    res.status(200).json(successResponse('Post retrieved successfully', post));
  } catch (error) {
    res.status(500).json(errorResponse(error.message));
  }
};

// @desc    Like a post
// @route   POST /api/posts/:id/like
// @access  Private
exports.likePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json(errorResponse('Post not found'));
    }

    // Check if already liked
    const existingLike = await Like.findOne({
      user: req.user.id,
      post: req.params.id
    });

    if (existingLike) {
      return res.status(400).json(errorResponse('You already liked this post'));
    }

    // Create like
    await Like.create({
      user: req.user.id,
      post: req.params.id
    });

    // Update post likes count
    await Post.findByIdAndUpdate(req.params.id, { $inc: { likesCount: 1 } });

    // Create activity
    await ActivityService.createActivity('POST_LIKED', req.user.id, post._id, 'Post', {
      postAuthor: post.author
    });

    res.status(200).json(successResponse('Post liked successfully'));
  } catch (error) {
    res.status(500).json(errorResponse(error.message));
  }
};

// @desc    Unlike a post
// @route   DELETE /api/posts/:id/like
// @access  Private
exports.unlikePost = async (req, res) => {
  try {
    const like = await Like.findOneAndDelete({
      user: req.user.id,
      post: req.params.id
    });

    if (!like) {
      return res.status(400).json(errorResponse('You have not liked this post'));
    }

    // Update post likes count
    await Post.findByIdAndUpdate(req.params.id, { $inc: { likesCount: -1 } });

    // Create activity
    await ActivityService.createActivity('POST_UNLIKED', req.user.id, req.params.id, 'Post');

    res.status(200).json(successResponse('Post unliked successfully'));
  } catch (error) {
    res.status(500).json(errorResponse(error.message));
  }
};

// @desc    Delete own post
// @route   DELETE /api/posts/:id
// @access  Private
exports.deletePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json(errorResponse('Post not found'));
    }

    // Check ownership
    if (post.author.toString() !== req.user.id) {
      return res.status(403).json(errorResponse('Not authorized to delete this post'));
    }

    await Post.findByIdAndDelete(req.params.id);

    // Update user's post count
    await User.findByIdAndUpdate(req.user.id, { $inc: { postsCount: -1 } });

    res.status(200).json(successResponse('Post deleted successfully'));
  } catch (error) {
    res.status(500).json(errorResponse(error.message));
  }
};