const mongoose = require("mongoose");
const { Schema } = mongoose;

const studentAttendanceSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true, 
    },
    studentName: {
      type: String,
      required: true,
    },
    schedule: {
      type: Schema.Types.ObjectId,
      ref: "Schedule",
      required: true,
    },
    subject: {
      type: Schema.Types.ObjectId,
      ref: "Subject",
    },
    subjectName: {
      type: String,
    },
    subjectType: {
      type: String,
    },
    date: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      enum: ["present", "absent", "leave"],
      required: true,
    },
    remarks: {
      type: String,
    },
    markedBy: {
      type: Schema.Types.ObjectId,
      ref: "User", 
      required: true,
    },
    markedByName: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true, 
  }
);

module.exports = mongoose.model("StudentAttendance", studentAttendanceSchema);
