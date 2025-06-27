const mongoose = require("mongoose");
const stream = require("stream");
const csv = require("csv-parser");
const fs = require("fs");
const path = require("path");
const User = require("../models/User");
const Teacher = require("../models/Teacher");
const Supervisor = require("../models/Supervisor");
const StaffAttendance = require("../models/StaffAttendance");
const moment = require("moment-timezone");

exports.markStaffAttendance = async (req, res) => {
  try {
    moment.tz.setDefault("Asia/Karachi");

    const userId = req.user.id;
    const userName = req.user.name;
    const userRole = req.user.role;

    if (!["admin"].includes(userRole)) {
      return res.status(403).json({
        message: "Access denied. Only admin can mark attendance.",
      });
    }

    const { staffUserId, status, date, inTime, outTime, remarks } = req.body;

    if (!staffUserId || !status || !date) {
      return res.status(400).json({
        message: "staffUserId, status, and date are required.",
      });
    }

    const allowedStatuses = ["present", "absent", "leave"];
    if (!allowedStatuses.includes(status.toLowerCase())) {
      return res.status(400).json({
        message: `Invalid status. Allowed values: ${allowedStatuses.join(
          ", "
        )}`,
      });
    }

    const timeRegex = /^\d{2}:\d{2}$/;
    if (inTime && !timeRegex.test(inTime)) {
      return res.status(400).json({
        message: "Invalid inTime format. Use HH:MM (24-hour format).",
      });
    }
    if (outTime && !timeRegex.test(outTime)) {
      return res.status(400).json({
        message: "Invalid outTime format. Use HH:MM (24-hour format).",
      });
    }

    const staffUser = await User.findById(staffUserId);
    if (!staffUser) {
      return res.status(404).json({ message: "Staff user not found" });
    }

    const allowedRoles = [
      "teacher_quran",
      "teacher_subjects",
      "supervisor_quran",
      "supervisor_subjects",
      "admin",
    ];

    if (!allowedRoles.includes(staffUser.role)) {
      return res.status(400).json({
        message: `Invalid role for attendance. Only teachers and supervisors can be marked. Received: ${staffUser.role}`,
      });
    }

    const attendanceDate = moment(date)
      .tz("Asia/Karachi")
      .startOf("day")
      .toDate();
    const pakistanFormattedDate = moment(attendanceDate).format("YYYY-MM-DD");

    const existing = await StaffAttendance.findByPakistanDate(
      staffUserId,
      pakistanFormattedDate
    );

    if (existing) {
      return res.status(409).json({
        message:
          "Attendance already marked for this staff on the selected date.",
      });
    }

    let instituteId = staffUser.instituteId || null;

    if (staffUser.role.includes("teacher")) {
      const teacher = await Teacher.findOne({ user: staffUserId });
      if (teacher && teacher.instituteId) {
        instituteId = teacher.instituteId;
      }
    } else if (staffUser.role.includes("supervisor")) {
      const supervisor = await Supervisor.findOne({ user: staffUserId });
      if (supervisor && supervisor.instituteId) {
        instituteId = supervisor.instituteId;
      }
    }

    let totalDuration = null;
    if (inTime && outTime) {
      const [startH, startM] = inTime.split(":").map(Number);
      const [endH, endM] = outTime.split(":").map(Number);
      const totalMins = endH * 60 + endM - (startH * 60 + startM);

      if (totalMins < 0) {
        return res.status(400).json({
          message: "Invalid time: outTime cannot be before inTime.",
        });
      }

      totalDuration = `${Math.floor(totalMins / 60)}:${String(
        totalMins % 60
      ).padStart(2, "0")}`;
    }

    const newAttendance = new StaffAttendance({
      user: staffUserId,
      name: staffUser.name,
      staffId: staffUser.staffId || null,
      role: staffUser.role,
      date: attendanceDate,
      pakistanFormattedDate: pakistanFormattedDate,
      status: status.toLowerCase(),
      inTime,
      outTime,
      totalDuration,
      remarks,
      markedBy: userId,
      markedByName: userName || "Admin",
      instituteId: instituteId,
    });

    await newAttendance.save();

    return res.status(201).json({
      message: "Staff attendance marked successfully",
      attendance: newAttendance.toObject(),
    });
  } catch (error) {
    console.error("❌ Error marking staff attendance:", error);
    return res.status(500).json({
      message: "Server error while marking staff attendance",
      error: error.message,
    });
  }
};

exports.updateStaffAttendance = async (req, res) => {
  try {
    moment.tz.setDefault("Asia/Karachi");

    const userId = req.user.id;
    const userName = req.user.name;
    const userRole = req.user.role;

    if (!["admin"].includes(userRole)) {
      return res.status(403).json({
        message: "Access denied. Only admin can update attendance.",
      });
    }

    const { attendanceId } = req.params;
    const { status, inTime, outTime, remarks } = req.body;

    if (!attendanceId || !mongoose.Types.ObjectId.isValid(attendanceId)) {
      return res.status(400).json({ message: "Invalid attendanceId." });
    }

    const allowedStatuses = ["present", "absent", "leave"];
    if (status && !allowedStatuses.includes(status.toLowerCase())) {
      return res.status(400).json({
        message: `Invalid status. Allowed values: ${allowedStatuses.join(
          ", "
        )}`,
      });
    }

    if (inTime && !/^\d{2}:\d{2}$/.test(inTime)) {
      return res
        .status(400)
        .json({ message: "Invalid inTime format. Use HH:MM (24-hour)." });
    }

    if (outTime && !/^\d{2}:\d{2}$/.test(outTime)) {
      return res
        .status(400)
        .json({ message: "Invalid outTime format. Use HH:MM (24-hour)." });
    }

    const attendance = await StaffAttendance.findById(attendanceId);
    if (!attendance) {
      return res.status(404).json({ message: "Attendance record not found" });
    }

    if (status) attendance.status = status.toLowerCase();
    if (inTime) attendance.inTime = inTime;
    if (outTime) attendance.outTime = outTime;
    if (remarks) attendance.remarks = remarks;

    if (attendance.inTime && attendance.outTime) {
      const [startH, startM] = attendance.inTime.split(":").map(Number);
      const [endH, endM] = attendance.outTime.split(":").map(Number);
      const totalMins = endH * 60 + endM - (startH * 60 + startM);

      if (totalMins < 0) {
        return res
          .status(400)
          .json({ message: "outTime cannot be before inTime." });
      }

      attendance.totalDuration = `${Math.floor(totalMins / 60)}:${String(
        totalMins % 60
      ).padStart(2, "0")}`;
    }

    attendance.markedBy = userId;
    attendance.markedByName = userName || "Admin";
    attendance.updatedAt = new Date();

    await attendance.save();

    return res.status(200).json({
      message: "Staff attendance updated successfully",
      attendance: attendance.toObject(),
    });
  } catch (error) {
    console.error("❌ Error updating staff attendance:", error);
    return res.status(500).json({
      message: "Server error while updating staff attendance",
      error: error.message,
    });
  }
};

exports.deleteMultipleStaffAttendance = async (req, res) => {
  try {
    const { role: userRole } = req.user;
    let { staffIds } = req.body;
    if (userRole !== "admin") {
      return res.status(403).json({
        message: "Access denied. Only admin can delete staff attendance.",
      });
    }

    if (!staffIds) {
      return res.status(400).json({
        message: "Staff IDs are required.",
      });
    }

    if (typeof staffIds === "string") {
      staffIds = staffIds
        .split(",")
        .map((id) => id.trim())
        .filter((id) => id);
    }

    if (!Array.isArray(staffIds)) {
      staffIds = [staffIds];
    }

    staffIds = staffIds.filter(
      (id) => id && typeof id === "string" && id.trim()
    );

    if (staffIds.length === 0) {
      return res.status(400).json({
        message: "Valid Staff IDs array is required and cannot be empty.",
      });
    }

    const invalidIds = staffIds.filter(
      (id) => !mongoose.Types.ObjectId.isValid(id)
    );
    if (invalidIds.length > 0) {
      return res.status(400).json({
        message: "Invalid ObjectId format detected.",
        invalidIds: invalidIds,
      });
    }

    const objectIds = staffIds.map((id) => new mongoose.Types.ObjectId(id));
    if (objectIds.length > 50) {
      return res.status(400).json({
        message:
          "Cannot delete attendance for more than 50 staff members at once.",
      });
    }
    const staffMembers = await User.find({
      _id: { $in: objectIds },
    });

    if (staffMembers.length !== objectIds.length) {
      const foundIds = staffMembers.map((staff) => staff._id.toString());
      const notFoundIds = staffIds.filter((id) => !foundIds.includes(id));

      return res.status(404).json({
        message: "Some staff members not found.",
        notFoundIds: notFoundIds,
      });
    }
    const allowedRoles = [
      "admin",
      "teacher_quran",
      "teacher_subjects",
      "supervisor_quran",
      "supervisor_subjects",
    ];

    const invalidStaff = staffMembers.filter(
      (staff) => !allowedRoles.includes(staff.role)
    );

    if (invalidStaff.length > 0) {
      return res.status(400).json({
        message: "Some selected users are not staff members.",
        invalidStaff: invalidStaff.map((staff) => ({
          name: staff.name,
          role: staff.role,
        })),
      });
    }

    const totalAttendanceCount = await StaffAttendance.countDocuments({
      user: { $in: objectIds },
    });

    if (totalAttendanceCount === 0) {
      return res.status(404).json({
        message: "No attendance records found for the selected staff members.",
        selectedStaff: staffMembers.map((staff) => ({
          name: staff.name,
          staffId: staff.staffId,
        })),
        deletedCount: 0,
      });
    }

    const attendanceCountPerStaff = await StaffAttendance.aggregate([
      { $match: { user: { $in: objectIds } } },
      { $group: { _id: "$user", count: { $sum: 1 } } },
    ]);

    const deleteResult = await StaffAttendance.deleteMany({
      user: { $in: objectIds },
    });

    const deletionSummary = staffMembers.map((staff) => {
      const countData = attendanceCountPerStaff.find(
        (item) => item._id.toString() === staff._id.toString()
      );
      return {
        name: staff.name,
        staffId: staff.staffId,
        deletedRecords: countData ? countData.count : 0,
      };
    });

    return res.status(200).json({
      message: `Successfully deleted attendance records for ${
        staffMembers.length
      } staff member${staffMembers.length > 1 ? "s" : ""}.`,
      totalDeleted: deleteResult.deletedCount,
      affectedStaff: deletionSummary,
      deletedBy: {
        name: req.user.name,
        id: req.user._id,
      },
      deletedAt: new Date(),
    });
  } catch (error) {
    console.error("❌ Error deleting multiple staff attendance:", error);
    return res.status(500).json({
      message: "Server error while deleting staff attendance.",
      error: error.message,
    });
  }
};

exports.getAllStaffAttendance = async (req, res) => {
  try {
    const { role: userRole } = req.user;

    if (userRole !== "admin") {
      return res.status(403).json({
        message: "Access denied. Only admin can view all staff attendance.",
      });
    }

    const { type, department, gender, status, startDate, endDate } = req.query;

    const query = {};

    if (type === "teacher") {
      query.role = { $in: ["teacher_quran", "teacher_subjects"] };
    } else if (type === "supervisor") {
      query.role = { $in: ["supervisor_quran", "supervisor_subjects"] };
    }

    if (department) {
      query.role = department;
    }

    let genderFilter = null;
    if (gender) {
      const allowedGenders = ["male", "female"];
      if (!allowedGenders.includes(gender.toLowerCase())) {
        return res.status(400).json({
          message: "Invalid gender. Allowed values: male, female.",
        });
      }
      genderFilter = gender.toLowerCase();
    }

    if (status) {
      const allowedStatuses = ["present", "absent", "leave"];
      if (!allowedStatuses.includes(status.toLowerCase())) {
        return res.status(400).json({
          message: `Invalid status. Allowed values: ${allowedStatuses.join(
            ", "
          )}`,
        });
      }
      query.status = status.toLowerCase();
    }

    if (startDate || endDate) {
      const dateQuery = {};
      if (startDate) {
        const from = new Date(startDate);
        if (isNaN(from)) {
          return res.status(400).json({ message: "Invalid startDate format." });
        }
        dateQuery.$gte = from;
      }
      if (endDate) {
        const to = new Date(endDate);
        if (isNaN(to)) {
          return res.status(400).json({ message: "Invalid endDate format." });
        }
        to.setHours(23, 59, 59, 999);
        dateQuery.$lte = to;
      }
      query.date = dateQuery;
    }

    const attendance = await StaffAttendance.find(query)
      .populate({
        path: "user",
        select: "name email gender role isActive staffId",
      })
      .sort({ date: -1 });

    let filteredAttendance = attendance;
    if (genderFilter) {
      filteredAttendance = attendance.filter(
        (a) => a.user?.gender?.toLowerCase() === genderFilter
      );
    }

    return res.status(200).json({
      message: "Staff attendance fetched successfully",
      totalRecords: filteredAttendance.length,
      data: filteredAttendance.map((a) => ({
        ...a.toObject(),
        user: a.user,
        isActive: a.user.isActive,
        staffId: a.user.staffId,
      })),
    });
  } catch (error) {
    console.error("❌ Error fetching staff attendance:", error);
    return res.status(500).json({
      message: "Server error while fetching staff attendance",
      error: error.message,
    });
  }
};

exports.getOwnStaffAttendance = async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;

    const allowedRoles = [
      "teacher_quran",
      "teacher_subjects",
      "supervisor_quran",
      "supervisor_subjects",
      "admin",
    ];

    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({
        message:
          "Access denied. Only teachers and supervisors can view their own attendance.",
      });
    }

    const { status, startDate, endDate } = req.query;
    const query = { user: userId };

    if (status) {
      const allowedStatuses = ["present", "absent", "leave"];
      if (!allowedStatuses.includes(status.toLowerCase())) {
        return res.status(400).json({
          message: `Invalid status. Allowed values: ${allowedStatuses.join(
            ", "
          )}`,
        });
      }
      query.status = status.toLowerCase();
    }

    if (startDate || endDate) {
      const dateQuery = {};
      if (startDate) {
        const from = new Date(startDate);
        if (isNaN(from)) {
          return res.status(400).json({ message: "Invalid startDate format." });
        }
        dateQuery.$gte = from;
      }

      if (endDate) {
        const to = new Date(endDate);
        if (isNaN(to)) {
          return res.status(400).json({ message: "Invalid endDate format." });
        }
        to.setHours(23, 59, 59, 999);
        dateQuery.$lte = to;
      }

      query.date = dateQuery;
    }

    const attendance = await StaffAttendance.find(query).sort({ date: -1 });

    const totals = {
      present: 0,
      absent: 0,
      leave: 0,
    };

    attendance.forEach((a) => {
      if (a.status === "present") totals.present++;
      if (a.status === "absent") totals.absent++;
      if (a.status === "leave") totals.leave++;
    });

    return res.status(200).json({
      message: "Your attendance fetched successfully",
      totalRecords: attendance.length,
      totals,
      data: attendance,
    });
  } catch (error) {
    console.error("❌ Error fetching own staff attendance:", error);
    return res.status(500).json({
      message: "Server error while fetching your attendance",
      error: error.message,
    });
  }
};

exports.getTeachersAttendanceForSupervisor = async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;

    if (!["supervisor_quran", "supervisor_subjects"].includes(userRole)) {
      return res.status(403).json({
        message:
          "Access denied. Only Quran/Subject supervisors can view teacher attendance.",
      });
    }

    const { gender, status, startDate, endDate } = req.query;

    const query = {};

    if (userRole === "supervisor_quran") {
      query.role = "teacher_quran";
    } else if (userRole === "supervisor_subjects") {
      query.role = "teacher_subjects";
    }

    if (status) {
      const allowedStatuses = ["present", "absent", "leave"];
      if (!allowedStatuses.includes(status.toLowerCase())) {
        return res.status(400).json({
          message: `Invalid status. Allowed values: ${allowedStatuses.join(
            ", "
          )}`,
        });
      }
      query.status = status.toLowerCase();
    }

    if (startDate || endDate) {
      const dateQuery = {};
      if (startDate) {
        const from = new Date(startDate);
        if (isNaN(from)) {
          return res.status(400).json({ message: "Invalid startDate format." });
        }
        dateQuery.$gte = from;
      }

      if (endDate) {
        const to = new Date(endDate);
        if (isNaN(to)) {
          return res.status(400).json({ message: "Invalid endDate format." });
        }
        to.setHours(23, 59, 59, 999);
        dateQuery.$lte = to;
      }

      query.date = dateQuery;
    }

    let attendance = await StaffAttendance.find(query)
      .populate({
        path: "user",
        select: "name email gender role",
      })
      .sort({ date: -1 });

    if (gender) {
      const allowedGenders = ["male", "female"];
      if (!allowedGenders.includes(gender.toLowerCase())) {
        return res.status(400).json({
          message: "Invalid gender. Allowed values: male, female.",
        });
      }

      attendance = attendance.filter(
        (a) => a.user?.gender?.toLowerCase() === gender.toLowerCase()
      );
    }

    return res.status(200).json({
      message: "Teachers attendance fetched successfully",
      totalRecords: attendance.length,
      data: attendance.map((a) => ({
        ...a.toObject(),
        user: a.user,
      })),
    });
  } catch (error) {
    console.error(
      "❌ Error fetching teachers attendance for supervisor:",
      error
    );
    return res.status(500).json({
      message: "Server error while fetching teacher attendance",
      error: error.message,
    });
  }
};

exports.uploadAttendanceFromCSV = async (req, res) => {
  try {
    moment.tz.setDefault("Asia/Karachi");
    if (!req.file) {
      return res.status(400).json({ message: "No CSV file uploaded." });
    }

    const filePath = path.join(__dirname, "../uploads", req.file.filename);
    const fileData = fs.readFileSync(filePath, "utf8");

    const allLines = fileData.split("\n").map((line) => line.trim());
    const usefulCsv = allLines.slice(4).join("\n");
    console.log(`✅ Skipped header lines.`);

    const superAdmin = await User.findOne({ role: "admin" });
    if (!superAdmin) {
      return res.status(404).json({ message: "No admin user found." });
    }

    const records = {};

    const Readable = new stream.Readable({
      read() {
        this.push(usefulCsv);
        this.push(null);
      },
    });

    await new Promise((resolve, reject) => {
      Readable.pipe(csv())
        .on("data", (row) => {
          const name = (row["First Name"] || "").trim();
          const staffId = (row["ID"] || "").trim();
          const dateOnly = (row["Date"] || "").trim();
          const inTime = (row["First Check In/Out"] || "").trim();
          const outTime = (row["Last Check In/Out"] || "").trim();
          const duration = (row["Total Duration"] || "").trim();

          if (!name || !staffId || !dateOnly) return;

          if (!records[name]) records[name] = [];

          records[name].push({
            staffId,
            dateOnly,
            inTime,
            outTime,
            duration,
          });
        })
        .on("end", resolve)
        .on("error", reject);
    });

    let totalMatched = 0;
    let totalInserted = 0;
    let totalUpdated = 0;
    let notFound = 0;

    for (const [fullName, entries] of Object.entries(records)) {
      for (const entry of entries) {
        const { staffId, dateOnly, inTime, outTime, duration } = entry;

        const user = await User.findOne({
          name: { $regex: `^${fullName}$`, $options: "i" },
          staffId: parseInt(staffId),
        });

        if (!user) {
          notFound++;
          continue;
        }

        totalMatched++;

        let attendanceDate;
        let pakistanFormattedDate;

        try {
          if (dateOnly.includes("/")) {
            attendanceDate = StaffAttendance.parsePakistanDate(dateOnly);
            pakistanFormattedDate = moment(attendanceDate)
              .tz("Asia/Karachi")
              .format("YYYY-MM-DD");
          }
        } catch (error) {
          console.error(`Error parsing date: ${dateOnly}`, error);
          continue;
        }

        const formattedInTime = inTime
          ? inTime.replace(/[^\d:]/g, "").slice(0, 5)
          : null;
        const formattedOutTime = outTime
          ? outTime.replace(/[^\d:]/g, "").slice(0, 5)
          : null;

        try {
          const existing = await StaffAttendance.findByPakistanDate(
            user._id,
            pakistanFormattedDate
          );

          if (existing) {
            existing.inTime = formattedInTime || existing.inTime;
            existing.outTime = formattedOutTime || existing.outTime;
            existing.totalDuration = duration || existing.totalDuration;
            existing.status = "present";
            existing.markedBy = superAdmin._id;
            await existing.save();

            const savedRecord = await StaffAttendance.findById(existing._id);

            totalUpdated++;
          } else {
            const newAttendance = await StaffAttendance.create({
              user: user._id,
              name: user.name,
              staffId: user.staffId || null,
              role: user.role,
              date: attendanceDate,
              pakistanFormattedDate: pakistanFormattedDate,
              status: "present",
              inTime: formattedInTime,
              outTime: formattedOutTime,
              totalDuration: duration || null,
              remarks: "Imported from organized CSV",
              markedBy: superAdmin._id,
              markedByName: superAdmin.name,
            });
            totalInserted++;
          }
        } catch (error) {
          console.error(`Error saving attendance for ${user.name}:`, error);
          continue;
        }
      }
    }

    fs.unlink(filePath, (err) => {
      if (err) {
        console.error("⚠️ Failed to delete uploaded CSV file:", err.message);
      }
    });

    console.log("\n✅ Final Summary:");
    console.log(`- Matched Users: ${totalMatched}`);
    console.log(`- Inserted Records: ${totalInserted}`);
    console.log(`- Updated Records: ${totalUpdated}`);
    console.log(`- Not Found: ${notFound}`);

    return res.status(200).json({
      message: "Attendance import completed.",
      matchedUsers: totalMatched,
      inserted: totalInserted,
      updated: totalUpdated,
      notFound,
    });
  } catch (error) {
    console.error("❌ Error uploading attendance:", error.stack);
    return res.status(500).json({
      message: "Server error during attendance import.",
      error: error.message,
    });
  }
};

exports.migrateAttendanceRecords = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Not authorized" });
    }

    const attendances = await StaffAttendance.find({
      $or: [
        { pakistanFormattedDate: { $exists: false } },
        { pakistanFormattedDate: null },
      ],
    });

    let updated = 0;
    let errors = 0;

    for (const attendance of attendances) {
      try {
        const pkDate = moment(attendance.date).tz("Asia/Karachi");
        attendance.pakistanFormattedDate = pkDate.format("YYYY-MM-DD");

        await attendance.save();
        updated++;

        if (updated % 100 === 0) {
        }
      } catch (err) {
        console.error(`Error updating record ${attendance._id}:`, err);
        errors++;
      }
    }

    return res.status(200).json({
      message: "Migration completed",
      updatedRecords: updated,
      errors: errors,
    });
  } catch (error) {
    console.error("Migration failed:", error);
    return res.status(500).json({
      message: "Migration failed",
      error: error.message,
    });
  }
};

exports.getAttendanceByDateRange = async (req, res) => {
  try {
    const { startDate, endDate, role } = req.query;

    if (!startDate || !endDate) {
      return res
        .status(400)
        .json({ message: "Start and end dates are required" });
    }

    const fromDate = StaffAttendance.parsePakistanDate(startDate);
    const toDate = StaffAttendance.parsePakistanDate(endDate);

    const query = {};
    if (role) {
      query.role = role;
    }

    const attendances = await StaffAttendance.findByDateRange(
      fromDate,
      toDate,
      query
    );

    return res.status(200).json({
      message: "Attendance records retrieved successfully",
      count: attendances.length,
      data: attendances,
    });
  } catch (error) {
    console.error("Error fetching attendance:", error);
    return res.status(500).json({
      message: "Server error while fetching attendance",
      error: error.message,
    });
  }
};

