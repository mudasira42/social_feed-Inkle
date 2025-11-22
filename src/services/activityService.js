const Activity = require('../models/Activity');
const User = require('../models/User');

class ActivityService {
  static async createActivity(type, actorId, targetId, targetModel, metadata = {}) {
    try {
      const actor = await User.findById(actorId).select('username fullName');
      
      const messages = {
        'POST_CREATED': `${actor.username} made a post`,
        'POST_LIKED': `${actor.username} liked a post`,
        'POST_UNLIKED': `${actor.username} unliked a post`,
        'USER_FOLLOWED': `${actor.username} followed a user`,
        'USER_UNFOLLOWED': `${actor.username} unfollowed a user`,
        'POST_DELETED_BY_ADMIN': `Post deleted by Admin ${actor.username}`,
        'POST_DELETED_BY_OWNER': `Post deleted by Owner ${actor.username}`,
        'USER_DELETED_BY_ADMIN': `User deleted by Admin ${actor.username}`,
        'USER_DELETED_BY_OWNER': `User deleted by Owner ${actor.username}`,
        'ADMIN_CREATED': `${actor.username} was made an admin`,
        'ADMIN_DELETED': `Admin ${actor.username} was removed`
      };

      const activity = await Activity.create({
        type,
        actor: actorId,
        target: targetId,
        targetModel,
        metadata,
        message: messages[type] || 'Activity occurred'
      });

      return activity;
    } catch (error) {
      console.error('Error creating activity:', error);
      throw error;
    }
  }

  static async getActivityFeed(userId, page = 1, limit = 20, blockedUsers = []) {
    try {
      const skip = (page - 1) * limit;

      const activities = await Activity.find({
        actor: { $nin: blockedUsers }
      })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('actor', 'username fullName profilePicture')
        .populate('target', 'content username fullName')
        .lean();

      const total = await Activity.countDocuments({
        actor: { $nin: blockedUsers }
      });

      return {
        activities,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      console.error('Error fetching activity feed:', error);
      throw error;
    }
  }
}

module.exports = ActivityService;