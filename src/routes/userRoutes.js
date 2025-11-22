const express = require('express');
const router = express.Router();
const {
  followUser,
  unfollowUser,
  blockUser,
  unblockUser,
  getUserProfile,
  getAllUsers,
  updateProfile
} = require('../controllers/userController');
const { protect } = require('../middleware/auth');

router.get('/', protect, getAllUsers);
router.put('/profile', protect, updateProfile);
router.get('/:id', protect, getUserProfile);

router.route('/:id/follow')
  .post(protect, followUser)
  .delete(protect, unfollowUser);

router.route('/:id/block')
  .post(protect, blockUser)
  .delete(protect, unblockUser);

module.exports = router;