const mongoose = require('mongoose');

const activitySchema = new mongoose.Schema({
  type: {
    type: String,
    enum: [
      'POST_CREATED',
      'POST_LIKED',
      'POST_UNLIKED',
      'USER_FOLLOWED',
      'USER_UNFOLLOWED',
      'POST_DELETED_BY_ADMIN',
      'POST_DELETED_BY_OWNER',
      'USER_DELETED_BY_ADMIN',
      'USER_DELETED_BY_OWNER',
      'ADMIN_CREATED',
      'ADMIN_DELETED'
    ],
    required: true,
    index: true
  },
  actor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  target: {
    type: mongoose.Schema.Types.ObjectId,
    refPath: 'targetModel'
  },
  targetModel: {
    type: String,
    enum: ['User', 'Post']
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed
  },
  message: {
    type: String,
    required: true
  }
}, {
  timestamps: true
});

// Indexes for efficient querying
activitySchema.index({ createdAt: -1 });
activitySchema.index({ actor: 1, createdAt: -1 });
activitySchema.index({ type: 1, createdAt: -1 });

module.exports = mongoose.model('Activity', activitySchema);