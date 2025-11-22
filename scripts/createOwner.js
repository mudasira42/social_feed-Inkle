require("dotenv").config();
const mongoose = require("mongoose");
const User = require("../src/models/User");

async function createOwner() {
  try {
    console.log("📡 Connecting to MongoDB...");
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✅ Connected");

    // Delete any existing OWNER users
    await User.deleteMany({ role: "OWNER" });

    // Create owner (schema will auto-hash password)
    const owner = await User.create({
      username: "owner",
      email: "owner@socialfeed.com",
      fullName: "System Owner",
      bio: "System Owner Account",
      password: "owner123",
      role: "OWNER"
    });

    console.log("🎉 OWNER CREATED SUCCESSFULLY");
    console.log("Email:", owner.email);
    console.log("Password: owner123");
    console.log("⚠️ IMPORTANT: Change this password in production.");

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  }
}

createOwner();
