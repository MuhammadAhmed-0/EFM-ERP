// models/Student.js
const mongoose = require("mongoose");
const { Schema } = mongoose;

const studentSchema = new Schema({
  user: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  client: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  clientName: {
    type: String,
    required: true,
  },
  name: { type: String },
  studentId: {
    type: Number,
    required: true,
    unique: true,
  },
  studentNumber: {
    type: Number,
    required: true,
  },
  grade: { type: String },
  status: {
    type: String,
    enum: ["trial", "regular", "drop", "freeze", "completed"],
    default: "trial",
  },
  statusDates: {
    trial: {
      date: { type: Date },
      addedBy: { type: Schema.Types.ObjectId, ref: "User" },
    },
    regular: {
      date: { type: Date },
      addedBy: { type: Schema.Types.ObjectId, ref: "User" },
    },
    drop: {
      date: { type: Date },
      addedBy: { type: Schema.Types.ObjectId, ref: "User" },
    },
    freeze: {
      date: { type: Date },
      addedBy: { type: Schema.Types.ObjectId, ref: "User" },
    },
    completed: {
      date: { type: Date },
      addedBy: { type: Schema.Types.ObjectId, ref: "User" },
    },
  },
  statusDateHistory: {
    trial: [
      {
        date: { type: Date },
        addedBy: { type: Schema.Types.ObjectId, ref: "User" },
      },
    ],
    regular: [
      {
        date: { type: Date },
        addedBy: { type: Schema.Types.ObjectId, ref: "User" },
      },
    ],
    drop: [
      {
        date: { type: Date },
        addedBy: { type: Schema.Types.ObjectId, ref: "User" },
      },
    ],
    freeze: [
      {
        date: { type: Date },
        endDate: { type: Date, default: null },
        addedBy: { type: Schema.Types.ObjectId, ref: "User" },
        endedBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
      },
    ],
    completed: [
      {
        date: { type: Date },
        addedBy: { type: Schema.Types.ObjectId, ref: "User" },
      },
    ],
  },
  subjects: [{ type: Schema.Types.ObjectId, ref: "Subject" }],
  subjectStatus: [
    {
      subject: {
        type: Schema.Types.ObjectId,
        ref: "Subject",
        required: true,
      },
      isActive: {
        type: Boolean,
        default: true,
      },
      activationHistory: [
        {
          activatedAt: {
            type: Date,
            required: true,
          },
          activatedBy: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
          },
          reason: {
            type: String, 
          },
        },
      ],
      deactivationHistory: [
        {
          deactivatedAt: {
            type: Date,
            required: true,
          },
          deactivatedBy: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
          },
          reason: {
            type: String, 
          },
        },
      ],
      currentStatus: {
        lastActivatedAt: {
          type: Date,
        },
        lastActivatedBy: {
          type: Schema.Types.ObjectId,
          ref: "User",
        },
        lastDeactivatedAt: {
          type: Date,
        },
        lastDeactivatedBy: {
          type: Schema.Types.ObjectId,
          ref: "User",
        },
      },
    },
  ],
  assignedTeachers: [
    {
      teacher: {
        _id: { type: Schema.Types.ObjectId, ref: "User" },
        name: String,
      },
      subject: {
        _id: { type: Schema.Types.ObjectId, ref: "Subject" },
        name: String,
      },
      isTemporary: { type: Boolean, default: false },
      startDate: Date,
      endDate: Date,
      assignedBy: { type: Schema.Types.ObjectId, ref: "User" },
      assignedAt: { type: Date, default: Date.now },
    },
  ],
});

module.exports = mongoose.model("Student", studentSchema);
