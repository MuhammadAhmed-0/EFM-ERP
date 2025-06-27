const mongoose = require("mongoose");
const { Schema } = mongoose;

// Base User Schema
const userSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
    },
    staffId: {
      type: Number,
      unique: true,
      sparse: true,
    },
    email: {
      type: String,
      required: function () {
        return this.role !== "student";
      },
      unique: true,
      sparse: true,
    },
    password: {
      type: String,
      required: function () {
        return this.role !== "student";
      },
    },

    phoneNumber: {
      type: String,
    },
    address: {
      type: String,
    },
    profilePicture: {
      type: String,
    },
    gender: {
      type: String,
      enum: ["male", "female"],
      required: true,
    },
    role: {
      type: String,
      enum: [
        "student",
        "teacher_quran",
        "teacher_subjects",
        "supervisor_quran",
        "supervisor_subjects",
        "admin",
        "client",
      ],
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    portalAccess: {
      type: Boolean,
      default: true,
    },
    lastDeactivatedAt: {
      type: Date,
    },
    deactivatedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    deactivationReason: {
      type: String,
    },
    lastActivatedAt: {
      type: Date,
    },
    activatedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    activationReason: {
      type: String,
    },
    forceLogout: {
      type: Boolean,
      default: false,
    },
    lastLogoutReason: {
      type: String,
    },
    logoutTimestamp: {
      type: Date,
    },
    sessionInvalidated: {
      type: Boolean,
      default: false,
    },

    totalReferrals: {
      type: Number,
      default: 0,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
  }
);

const User = mongoose.model("User", userSchema);

module.exports = User;
