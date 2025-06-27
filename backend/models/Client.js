// models/Client.js
const mongoose = require("mongoose");
const { Schema } = mongoose;

const clientSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    clientId: {
      type: String,
      required: true,
      unique: true,
    },
    clientName: {
      type: String,
      required: true,
    },
    contactNo: {
      type: String,
    },
    country: {
      type: String,
    },
    state: {
      type: String,
    },
    shift: {
      type: String,
      enum: ["morning", "night"],
      required: true,
    },
    numberOfStudents: {
      type: Number,
      default: 0,
    },
    totalFee: {
      type: Number,
      default: 0,
    },
    currency: {
      type: String,
      enum: [
        "AUD",
        "NZD",
        "USD",
        "CAD",
        "JPY",
        "PKR",
        "INR",
        "OMR",
        "QAR",
        "SAR",
        "AED",
        "HKD",
        "EUR",
        "GBP",
        "TRY",
        "KWD",
        "EGP",
        "FJD",
        "BHD",
      ],
      default: "PKR",
    },
    status: {
      type: String,
      enum: ["trial", "regular", "drop", "freeze", "completed"],
      default: "trial",
    },
    statusDates: {
      trial: {
        date: { type: Date, default: null },
        addedBy: { type: Schema.Types.ObjectId, ref: "User" },
      },
      regular: {
        date: { type: Date, default: null },
        addedBy: { type: Schema.Types.ObjectId, ref: "User" },
      },
      drop: {
        date: { type: Date, default: null },
        addedBy: { type: Schema.Types.ObjectId, ref: "User" },
      },
      freeze: {
        date: { type: Date, default: null },
        addedBy: { type: Schema.Types.ObjectId, ref: "User" },
      },
      completed: {
        date: { type: Date, default: null },
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
    remarks: {
      type: String,
    },
    referredByClient: {
      _id: { type: Schema.Types.ObjectId, ref: "Client" },
      name: { type: String },
    },

    referralRecords: [
      {
        referredClientId: { type: Schema.Types.ObjectId, ref: "Client" },
        referredOn: {
          type: Date,
          required: true,
        },
      },
    ],
    referralHandledBy: {
      _id: { type: Schema.Types.ObjectId, ref: "User" },
      name: { type: String },
      role: {
        type: String,
        enum: [
          "admin",
          "teacher_quran",
          "teacher_subjects",
          "supervisor_quran",
          "supervisor_subjects",
        ],
      },
    },

    totalReferrals: {
      type: Number,
      default: 0,
    },
    registrationDate: {
      type: Date,
      default: Date.now,
    },
    students: [
      {
        type: Schema.Types.ObjectId,
        ref: "Student",
      },
    ],
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Client", clientSchema);
