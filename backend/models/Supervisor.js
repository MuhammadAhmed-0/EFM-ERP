const mongoose = require("mongoose");
const { Schema } = mongoose;

const supervisorSchema = new Schema({
  user: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  name: { type: String },
  fatherName: { type: String },
  department: {
    type: String,
    enum: ["quran", "subjects"],
    required: true,
  },
  dateOfBirth: {
    type: Date,
    required: true,
  },
  joiningDate: {
    type: Date,
    default: Date.now,
  },
  manager: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  managerName: {
    type: String,
    required: true,
  },
  salary: {
    type: Number,
    required: true,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  shift: {
    type: String,
    enum: ["morning", "night"],
    required: true,
  },
  cnicNumber: {
    type: Number,
    required: true,
  },
  religion: {
    type: String,
    required: true,
  },
  availability: {
    days: [
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
    startTime: {
      type: String,
    },
    endTime: {
      type: String,
    },
  },
  salaryHistory: [
    {
      month: { type: String },
      amount: { type: Number },
      bonusAmount: { type: Number, default: 0 },
      deduction: { type: Number, default: 0 },
      totalLeaves: { type: Number, default: 0 },
      paymentDate: { type: Date },
      status: { type: String, enum: ["paid", "pending"] },
      remarks: { type: String },
      processedBy: { type: Schema.Types.ObjectId, ref: "User" },
    },
  ],
});

module.exports = mongoose.model("Supervisor", supervisorSchema);
