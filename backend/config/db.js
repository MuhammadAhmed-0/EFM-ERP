const mongoose = require("mongoose");
require("dotenv").config();

// MongoDB connection URI
const MONGODB_URI = process.env.MONGODB_URI;

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log("MongoDB connected successfully");
  } catch (error) {
    console.error("MongoDB connection failed:", error.message);
    process.exit(1);
  }
};

// Handle connection events
mongoose.connection.on("connected", () => {
  console.log("Mongoose connected to DB");
});

mongoose.connection.on("error", (err) => {
  console.log("Mongoose connection error:", err);
});

// mongoose.connection.on('disconnected', () => {
//   console.log('Mongoose disconnected');
// });

// // Close the Mongoose connection when Node process ends
// process.on('SIGINT', async () => {
//   await mongoose.connection.close();
//   console.log('Mongoose connection closed due to app termination');
//   process.exit(0);
// });

module.exports = connectDB;
