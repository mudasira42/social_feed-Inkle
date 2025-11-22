const express = require('express');
const router = express.Router();
const {
  deletePost,
  deleteUser,
  deleteLike,
  createAdmin,
  removeAdmin,
  getAllAdmins
} = require('../controllers/adminController');
const { protect } = require('../middleware/auth');
const { isAdmin, isOwner } = require('../middleware/roleCheck');

// Admin & Owner routes
router.delete('/posts/:id', protect, isAdmin, deletePost);
router.delete('/users/:id', protect, isAdmin, deleteUser);
router.delete('/likes/:id', protect, isAdmin, deleteLike);

// Owner only routes
router.post('/create', protect, isOwner, createAdmin);
router.delete('/:id', protect, isOwner, removeAdmin);
router.get('/list', protect, isOwner, getAllAdmins);

module.exports = router;