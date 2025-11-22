const express = require('express');
const router = express.Router();
const {
  createPost,
  getAllPosts,
  getPost,
  likePost,
  unlikePost,
  deletePost
} = require('../controllers/postController');
const { protect } = require('../middleware/auth');

router.route('/')
  .post(protect, createPost)
  .get(protect, getAllPosts);

router.route('/:id')
  .get(protect, getPost)
  .delete(protect, deletePost);

router.route('/:id/like')
  .post(protect, likePost)
  .delete(protect, unlikePost);

module.exports = router;