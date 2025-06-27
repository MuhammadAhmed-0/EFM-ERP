const mongoose = require("mongoose");
const { Schema } = mongoose;
const moment = require("moment-timezone");

// Utility function for Pakistan date formatting
function formatToPakistanDate(date) {
  return moment(date).tz("Asia/Karachi").format("YYYY-MM-DD");
}

const staffAttendanceSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    staffId: {
      type: Number,
    },
    role: {
      type: String,
      enum: [
        "admin",
        "teacher_quran",
        "teacher_subjects",
        "supervisor_quran",
        "supervisor_subjects",
      ],
      required: true,
    },
    date: {
      type: Date,
      required: true,
    },
    // Store the Pakistan formatted date string for easier querying and display
    pakistanFormattedDate: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ["present", "absent", "leave"],
      required: true,
    },
    inTime: {
      type: String,
    },
    outTime: {
      type: String,
    },
    totalDuration: {
      type: String,
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
  { timestamps: true }
);

// Pre-save middleware to ensure date is always stored with Pakistan timezone info
staffAttendanceSchema.pre("save", function (next) {
  // Make sure we have the date in Pakistan timezone format
  if (this.date) {
    // Format the Pakistan date string (YYYY-MM-DD)
    this.pakistanFormattedDate = formatToPakistanDate(this.date);

    // Ensure the date is stored as midnight of the Pakistan date
    const pkDate = moment.tz(
      this.pakistanFormattedDate,
      "YYYY-MM-DD",
      "Asia/Karachi"
    );
    this.date = pkDate.toDate();
  }
  next();
});

// Static methods for the StaffAttendance model
staffAttendanceSchema.statics = {
  // Parse date string to Pakistan timezone date object
  parsePakistanDate(dateStr) {
    let momentDate;

    if (dateStr.includes("/")) {
      // Handle MM/DD/YYYY format
      const [month, day, year] = dateStr.split("/");
      momentDate = moment.tz(
        `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`,
        "YYYY-MM-DD",
        "Asia/Karachi"
      );
    } else {
      // Assume YYYY-MM-DD format
      momentDate = moment.tz(dateStr, "YYYY-MM-DD", "Asia/Karachi");
    }

    return momentDate.startOf("day").toDate();
  },

  // Find attendance by Pakistan date string
  async findByPakistanDate(userId, dateStr) {
    return this.findOne({
      user: userId,
      pakistanFormattedDate: dateStr,
    });
  },

  // Find attendances within a date range
  async findByDateRange(fromDate, toDate, additionalQuery = {}) {
    // Convert to Pakistan formatted date strings
    const fromPkDate = formatToPakistanDate(fromDate);
    const toPkDate = formatToPakistanDate(toDate);

    return this.find({
      pakistanFormattedDate: {
        $gte: fromPkDate,
        $lte: toPkDate,
      },
      ...additionalQuery,
    });
  },
};

// Indexes for faster queries
staffAttendanceSchema.index({ user: 1, pakistanFormattedDate: 1 });
staffAttendanceSchema.index({ pakistanFormattedDate: 1 });

module.exports = mongoose.model("StaffAttendance", staffAttendanceSchema);
