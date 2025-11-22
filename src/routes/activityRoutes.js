const express = require('express');
const router = express.Router();
const { getActivityFeed, getUserActivities } = require('../controllers/activityController');
const { protect } = require('../middleware/auth');

router.get('/', protect, getActivityFeed);
router.get('/user/:userId', protect, getUserActivities);

module.exports = router;