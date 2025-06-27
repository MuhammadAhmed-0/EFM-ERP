const mongoose = require("mongoose");
const { Schema } = mongoose;

const announcementSchema = new Schema(
  {
    title: {
      type: String,
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
    sender: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    recipients: {
      role: [
        {
          type: String,
          enum: [
            "teacher_subjects",
            "teacher_quran",
            "supervisor_quran",
            "supervisor_subjects",
            "client",
            "admin",
            "all",
          ],
          required: true,
        },
      ],
    },
    readBy: [
      {
        user: {
          type: Schema.Types.ObjectId,
          ref: "User",
        },
        readAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    senderRole: {
      type: String,
      enum: [
        "teacher_subjects",
        "teacher_quran",
        "supervisor_quran",
        "supervisor_subjects",
        "client",
        "admin",
        "all",
      ],
      required: true,
    },
    // Add these new fields for query responses
    isQuery: {
      type: Boolean,
      default: false,
    },
    response: {
      content: String,
      respondedBy: {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
      respondedAt: Date,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Announcement", announcementSchema);
