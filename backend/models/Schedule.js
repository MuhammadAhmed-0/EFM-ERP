const mongoose = require("mongoose");
const { Schema } = mongoose;

const scheduleSchema = new Schema(
  {
    students: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
    ],
    studentNames: [{ type: String }],

    teacherId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    teacherName: {
      type: String,
    },

    subject: {
      type: Schema.Types.ObjectId,
      ref: "Subject",
      required: true,
    },
    subjectName: { type: String },
    subjectType: { type: String },

    day: {
      type: String,
      enum: [
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
        "Sunday",
      ],
      required: true,
    },
    classDate: { type: Date, required: true },
    startTime: { type: String, required: true },
    endTime: { type: String, required: true },

    status: {
      type: String,
      enum: ["scheduled", "completed", "cancelled", "rescheduled"],
      default: "scheduled",
    },
    sessionStatus: {
      type: String,
      enum: [
        "pending",
        "available",
        "in_progress",
        "completed",
        "leave",
        "absent",
      ],
      default: "pending",
    },

    teacherAvailableAt: { type: Date },
    classStartedAt: { type: Date },
    classEndedAt: { type: Date },
    sessionDurationMinutes: { type: Number },

    isRecurring: { type: Boolean, default: false },
    customDays: [
      {
        type: String,
        enum: [
          "Monday",
          "Tuesday",
          "Wednesday",
          "Thursday",
          "Friday",
          "Saturday",
          "Sunday",
        ],
      },
    ],

    recurrencePattern: {
      type: String,
      enum: ["weekly", "custom", "weekdays"],
      default: "weekly",
    },
    recurrenceEndDate: { type: Date },
    recurrenceParentId: {
      type: Schema.Types.ObjectId,
      ref: "Schedule",
    },
    isTemporaryChange: {
      type: Boolean,
    },
    rescheduleType: {
      type: String,
      enum: ["temporary", "permanent"],
    },
    isTeacherTemporaryChange: {
      type: Boolean,
    },
    teacherChangeType: {
      type: String,
      enum: ["temporary", "permanent"],
    },

    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    updatedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    startDelay: {
      type: Number,
      default: 0,
    },
    earlyEnd: {
      type: Number,
      default: 0,
    },
    actualDuration: {
      type: Number,
      default: 0,
    },
    scheduledDuration: {
      type: Number,
      default: 0,
    },
    lessons: [
      {
        title: String,
        description: String,
        status: {
          type: String,
          enum: ["pending", "completed", "in-progress"],
        },
        remarks: String,
        addedBy: {
          type: Schema.Types.ObjectId,
          ref: "User",
        },
        addedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },

  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Schedule", scheduleSchema);
