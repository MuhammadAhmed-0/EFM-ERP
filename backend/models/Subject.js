const mongoose = require("mongoose");
const { Schema } = mongoose;

// Subject Schema
const subjectSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
    },
    description: {
      type: String,
    },
    type: {
      type: String,
      enum: ["quran", "subjects"],
      required: true,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

const Subject = mongoose.model("Subject", subjectSchema);

module.exports = Subject;
