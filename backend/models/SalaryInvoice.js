const mongoose = require("mongoose");
const { Schema } = mongoose;

const salaryInvoiceSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    userName: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: [
        "teacher_quran",
        "teacher_subjects",
        "supervisor_quran",
        "supervisor_subjects",
      ],
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    bonus: {
      amount: {
        type: Number,
        default: 0,
      },
      reason: {
        type: String,
      },
      approvedBy: {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
    },
    month: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ["paid", "pending"],
      default: "pending",
    },
    deduction: {
      type: Number,
      default: 0,
    },
    totalLeaves: {
      type: Number,
      default: 0,
    },
    paymentDate: {
      type: Date,
      default: Date.now,
    },
    remarks: {
      type: String,
    },
    processedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    // Additional Fields
    studentBonus: {
      type: Number,
      default: 0,
    },
    refBonus: {
      type: Number,
      default: 0,
    },
    advancedSalary: {
      type: Number,
      default: 0,
    },
    absentFine: {
      type: Number,
      default: 0,
    },
    approvedLeave: {
      type: Number,
      default: 0,
    },
    biometricFine: {
      type: Number,
      default: 0,
    },
    finePerMinute: {
      type: Number,
      default: 0,
    },
    lateMinutes: {
      type: Number,
      default: 0,
    },
    netSalary: {
      type: Number,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("SalaryInvoice", salaryInvoiceSchema);
