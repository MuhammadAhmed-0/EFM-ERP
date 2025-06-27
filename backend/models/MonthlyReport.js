// models/MonthlyReport.js
const mongoose = require("mongoose");
const { Schema } = mongoose;

const academicEntrySchema = new Schema({
  date1: {
    type: String,
    required: true,
  },
  topic1: {
    type: String,
    required: true,
  },
  date2: {
    type: String,
    required: true,
  },
  topic2: {
    type: String,
    required: true,
  },
});

const testScoreSchema = new Schema({
  testNumber: {
    type: String,
    required: true,
  },
  totalMarks: {
    type: String,
  },
  passingMarks: {
    type: String,
  },
  obtainedMarks: {
    type: String,
  },
});

const monthlyReportSchema = new Schema(
  {
    student: {
      type: Schema.Types.ObjectId,
      ref: "Student",
      required: true,
    },
    teacher: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    client: {
      type: Schema.Types.ObjectId,
      ref: "Client",
      required: true,
    },
    subject: {
      type: Schema.Types.ObjectId,
      ref: "Subject",
      required: true,
    },

    month: {
      type: String,
      required: true,
    },
    year: {
      type: String,
      required: true,
    },
    reportDate: {
      type: Date,
      default: Date.now,
    },

    familyName: {
      type: String,
      required: true,
    },
    studentName: {
      type: String,
      required: true,
    },
    grade: {
      type: String,
      required: true,
    },
    subjectName: {
      type: String,
      required: true,
    },
    classCount: {
      type: String,
      required: true,
    },
    tutorName: {
      type: String,
      required: true,
    },

    academicEntries: [academicEntrySchema],

    testScores: [testScoreSchema],

    teacherRemarks: {
      type: String,
    },
    notes: {
      type: String,
    },

    status: {
      type: String,
      enum: ["draft", "submitted", "approved", "rejected"],
      default: "draft",
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    submittedAt: {
      type: Date,
    },
    approvedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    approvedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

monthlyReportSchema.index({ student: 1, subject: 1, month: 1, year: 1 });

module.exports = mongoose.model("MonthlyReport", monthlyReportSchema);
