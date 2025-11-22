const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: [true, 'Username is required'],
      unique: true,
      trim: true,
      lowercase: true,
      minlength: [3, 'Username must be at least 3 characters'],
      maxlength: [30, 'Username cannot exceed 30 characters']
    },

    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email']
    },

    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters'],
      select: false
    },

    fullName: {
      type: String,
      required: [true, 'Full name is required'],
      trim: true
    },

    bio: {
      type: String,
      maxlength: [500, 'Bio cannot exceed 500 characters'],
      default: ''
    },

    profilePicture: {
      type: String,
      default: 'https://via.placeholder.com/150'
    },

    // IMPORTANT: Updated to uppercase roles (standard practice)
    role: {
      type: String,
      enum: ['USER', 'ADMIN', 'OWNER'],
      default: 'USER'
    },

    isActive: {
      type: Boolean,
      default: true
    },

    followersCount: {
      type: Number,
      default: 0
    },

    followingCount: {
      type: Number,
      default: 0
    },

    postsCount: {
      type: Number,
      default: 0
    }
  },
  {
    timestamps: true
  }
);

// Indexes for performance
userSchema.index({ username: 1, email: 1 });
userSchema.index({ role: 1 });


userSchema.pre('save', async function () {
  if (!this.isModified('password')) return;

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Compare passwords
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Remove password from JSON output
userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

module.exports = mongoose.model('User', userSchema);
