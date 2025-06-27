const mongoose = require("mongoose");
const User = require("../models/User");
const Client = require("../models/Client");
const Student = require("../models/Student");
const Teacher = require("../models/Teacher");
const Supervisor = require("../models/Supervisor");
const Schedule = require("../models/Schedule");
const StudentAttendance = require("../models/StudentAttendance");
const { formatDate } = require("../utils/formatters");

exports.markSingleAttendance = async (req, res) => {
  try {
    const currentTime = new Date("2025-05-15 10:28:30");
    const userId = req.user.id;
    const userRole = req.user.role;
    const { scheduleId, studentUserId, status, remarks } = req.body;

    if (!scheduleId || !studentUserId || !status) {
      return res.status(400).json({
        message: "scheduleId, studentUserId, and status are required",
      });
    }

    const schedule = await Schedule.findById(scheduleId);
    if (!schedule) {
      return res.status(404).json({ message: "Schedule not found" });
    }

    if (userRole !== "admin") {
      const teacher = await Teacher.findOne({ user: userId });
      if (
        !teacher ||
        !schedule.teacherId ||
        schedule.teacherId.toString() !== teacher.user.toString()
      ) {
        return res.status(403).json({
          message: "You are not assigned to this class",
        });
      }
    }

    const teacherUser = await User.findById(userId);
    if (!teacherUser) {
      return res.status(404).json({ message: "User not found" });
    }

    const studentUser = await User.findById(studentUserId);
    if (!studentUser || studentUser.role !== "student") {
      return res.status(400).json({
        message: "Provided user is not a valid student",
      });
    }

    const student = await Student.findOne({ user: studentUserId }).populate(
      "user",
      "name"
    );
    if (!student) {
      return res.status(404).json({ message: "Student record not found" });
    }

    const classDateStart = new Date(schedule.classDate);
    classDateStart.setHours(0, 0, 0, 0);

    const classDateEnd = new Date(schedule.classDate);
    classDateEnd.setHours(23, 59, 59, 999);

    const attendanceAlreadyExists = await StudentAttendance.findOne({
      user: studentUserId,
      schedule: scheduleId,
      date: { $gte: classDateStart, $lte: classDateEnd },
    });

    if (attendanceAlreadyExists) {
      return res.status(409).json({
        message: "Attendance already marked for this student",
      });
    }

    const isStudentInSchedule = schedule.students
      .map((id) => id.toString())
      .includes(studentUserId.toString());

    if (!isStudentInSchedule) {
      return res.status(400).json({
        message: "This student is not part of the selected schedule",
      });
    }

    const newAttendance = new StudentAttendance({
      user: studentUserId,
      studentName: student.user.name || "Unknown Student",
      schedule: scheduleId,
      subject: schedule.subject,
      subjectName: schedule.subjectName,
      subjectType: schedule.subjectType,
      date: schedule.classDate,
      status,
      remarks,
      markedBy: userId,
      markedByName: teacherUser.name || "Unknown",
    });

    await newAttendance.save();

    if (status === "leave" || status === "absent") {
      const totalStudents = schedule.students.length;

      if (totalStudents === 1) {
        schedule.sessionStatus = status;
        schedule.status = status === "absent" ? "cancelled" : "completed";
        await schedule.save();
      } else {
        const allAttendances = await StudentAttendance.find({
          schedule: scheduleId,
          date: { $gte: classDateStart, $lte: classDateEnd },
        });

        if (allAttendances.length === totalStudents) {
          const allAbsentOrLeave = allAttendances.every(
            (att) => att.status === "absent" || att.status === "leave"
          );

          if (allAbsentOrLeave) {
            const absentCount = allAttendances.filter(
              (att) => att.status === "absent"
            ).length;
            const leaveCount = allAttendances.filter(
              (att) => att.status === "leave"
            ).length;

            schedule.sessionStatus =
              absentCount >= leaveCount ? "absent" : "leave";
            schedule.status = "cancelled";
            await schedule.save();
          }
        }
      }
    }

    return res.status(201).json({
      message: "Attendance marked successfully",
      attendance: {
        ...newAttendance.toObject(),
        date: formatDate(newAttendance.date),
      },
    });
  } catch (error) {
    console.error("❌ Error marking attendance:", error.stack);
    return res.status(500).json({
      message: "Server error while marking attendance",
      error: error.message,
    });
  }
};

exports.updateSingleAttendance = async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;
    const { attendanceId } = req.params;
    const { status, remarks } = req.body;

    if (!status) {
      return res.status(400).json({ message: "Status is required" });
    }

    const allowedStatuses = ["present", "absent", "leave"];
    if (!allowedStatuses.includes(status.toLowerCase())) {
      return res.status(400).json({
        message: `Invalid status. Allowed values are: ${allowedStatuses.join(
          ", "
        )}`,
      });
    }

    const attendance = await StudentAttendance.findById(attendanceId);
    if (!attendance) {
      return res.status(404).json({ message: "Attendance not found" });
    }

    const schedule = await Schedule.findById(attendance.schedule);
    if (!schedule) {
      return res.status(404).json({ message: "Associated schedule not found" });
    }

    if (userRole !== "admin") {
      const teacher = await Teacher.findOne({ user: userId });
      if (
        !teacher ||
        !schedule.teacherId ||
        schedule.teacherId.toString() !== teacher.user.toString()
      ) {
        return res.status(403).json({
          message: "You are not authorized to update this attendance",
        });
      }
    }

    const teacherUser = await User.findById(userId);
    if (!teacherUser) {
      return res.status(404).json({ message: "User not found" });
    }

    const targetUser = await User.findById(attendance.user);
    if (!targetUser || targetUser.role !== "student") {
      return res.status(400).json({
        message: "Attendance record is not linked to a valid student.",
      });
    }

    attendance.status = status.toLowerCase();
    attendance.remarks = remarks || attendance.remarks;
    attendance.markedBy = userId;
    attendance.markedByName = teacherUser.name || "Unknown";

    await attendance.save();

    return res.status(200).json({
      message: "Attendance updated successfully",
      attendance: {
        ...attendance.toObject(),
        date: formatDate(attendance.date),
      },
    });
  } catch (error) {
    console.error("❌ Error updating attendance:", error.stack);
    return res.status(500).json({
      message: "Server error while updating attendance",
      error: error.message,
    });
  }
};

exports.getClientStudentAttendance = async (req, res) => {
  try {
    const clientUserId = req.user.id;

    const client = await Client.findOne({ user: clientUserId });
    if (!client) {
      return res.status(404).json({ message: "Client not found" });
    }

    const { studentId, studentName, subjectId, startDate, endDate } = req.query;

    let studentUserIds = [];
    if (studentName) {
      const searchPattern = new RegExp(studentName, "i");
      const matchingUsers = await User.find({
        name: searchPattern,
        role: "student",
        _id: { $in: client.students },
      }).select("_id");

      studentUserIds = matchingUsers.map((user) => user._id.toString());

      if (studentUserIds.length === 0) {
        return res.status(404).json({
          message: "No students found with that name in your account",
        });
      }
    }

    if (studentId) {
      if (!mongoose.Types.ObjectId.isValid(studentId)) {
        return res.status(400).json({ message: "Invalid studentId format" });
      }
      if (!client.students.map((id) => id.toString()).includes(studentId)) {
        return res
          .status(403)
          .json({ message: "This student is not linked to your account" });
      }
    }

    if (subjectId && !mongoose.Types.ObjectId.isValid(subjectId)) {
      return res.status(400).json({ message: "Invalid subjectId format" });
    }

    const query = {};

    if (studentId) {
      query.user = studentId;
    } else if (studentName && studentUserIds.length > 0) {
      query.user = { $in: studentUserIds };
    } else {
      query.user = { $in: client.students.map((s) => s.toString()) };
    }

    if (subjectId) {
      const scheduleIds = await Schedule.find({ subject: subjectId }, "_id");
      if (!scheduleIds.length) {
        return res
          .status(404)
          .json({ message: "No attendance found for this subject" });
      }
      query.schedule = { $in: scheduleIds.map((s) => s._id) };
    }

    if (startDate || endDate) {
      const dateFilter = {};

      if (startDate && !endDate) {
        const day = new Date(startDate);
        if (isNaN(day.getTime())) {
          return res.status(400).json({ message: "Invalid startDate format" });
        }
        const startOfDay = new Date(day.setHours(0, 0, 0, 0));
        const endOfDay = new Date(day.setHours(23, 59, 59, 999));
        query.date = { $gte: startOfDay, $lte: endOfDay };
      } else {
        if (startDate) {
          const from = new Date(startDate);
          if (isNaN(from.getTime())) {
            return res
              .status(400)
              .json({ message: "Invalid startDate format" });
          }
          dateFilter.$gte = new Date(from.setHours(0, 0, 0, 0));
        }

        if (endDate) {
          const to = new Date(endDate);
          if (isNaN(to.getTime())) {
            return res.status(400).json({ message: "Invalid endDate format" });
          }
          dateFilter.$lte = new Date(to.setHours(23, 59, 59, 999));
        }

        query.date = dateFilter;
      }
    }

    const attendance = await StudentAttendance.find(query)
      .populate({
        path: "schedule",
        select: "subject subjectName classDate startTime endTime",
      })
      .populate("user", "name")
      .sort({ date: -1 });

    const userIds = attendance.map((record) => record.user._id.toString());
    const students = await Student.find({
      user: { $in: userIds },
    });

    const studentIdMap = {};
    students.forEach((student) => {
      studentIdMap[student.user.toString()] = student.studentId;
    });

    const counts = {
      present: 0,
      absent: 0,
      leave: 0,
    };

    attendance.forEach((record) => {
      if (record.status === "present") counts.present++;
      if (record.status === "absent") counts.absent++;
      if (record.status === "leave") counts.leave++;
    });

    const totalRecords = attendance.length;
    const attendancePercentage =
      totalRecords > 0
        ? ((counts.present / totalRecords) * 100).toFixed(2) + "%"
        : "0.00%";

    const responseData = {
      message: "Attendance fetched successfully",
      totalRecords,
      attendancePercentage,
      totals: counts,
      searchCriteria: {
        studentId: studentId || null,
        studentName: studentName || null,
        subjectId: subjectId || null,
        dateRange: {
          startDate: startDate || null,
          endDate: endDate || null,
        },
      },
      data: attendance.map((a) => {
        const userId = a.user?._id?.toString();
        return {
          ...a.toObject(),
          date: formatDate(a.date),
          student: {
            _id: a.user?._id,
            name: a.user?.name,
            studentId: studentIdMap[userId] || null,
          },
          schedule: {
            ...a.schedule?.toObject?.(),
            classDate: formatDate(a.schedule?.classDate),
          },
        };
      }),
    };

    return res.status(200).json(responseData);
  } catch (error) {
    console.error("❌ Error fetching attendance:", error.stack);
    return res.status(500).json({
      message: "Server error while fetching attendance",
      error: error.message,
    });
  }
};

exports.getTeacherMarkedStudentAttendance = async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;

    if (!["teacher_quran", "teacher_subjects"].includes(userRole)) {
      return res.status(403).json({
        message: "Access denied. Only teachers can access this data.",
      });
    }

    const teacher = await Teacher.findOne({ user: userId });
    if (!teacher) {
      return res.status(404).json({ message: "Teacher profile not found." });
    }

    const { subjectId, status, startDate, endDate, studentUserId } = req.query;

    if (subjectId && !mongoose.Types.ObjectId.isValid(subjectId)) {
      return res.status(400).json({ message: "Invalid subjectId format." });
    }

    if (studentUserId && !mongoose.Types.ObjectId.isValid(studentUserId)) {
      return res.status(400).json({ message: "Invalid studentUserId format." });
    }

    const scheduleFilter = { teacherId: teacher.user };
    if (subjectId) scheduleFilter.subject = subjectId;

    const schedules = await Schedule.find(scheduleFilter, "_id");
    const scheduleIds = schedules.map((s) => s._id);

    const query = {
      schedule: { $in: scheduleIds },
      markedBy: userId,
    };

    if (status) {
      const allowedStatuses = ["present", "absent", "leave"];
      if (!allowedStatuses.includes(status.toLowerCase())) {
        return res.status(400).json({
          message: `Invalid status. Allowed: ${allowedStatuses.join(", ")}`,
        });
      }
      query.status = status.toLowerCase();
    }

    if (startDate || endDate) {
      const dateQuery = {};
      if (startDate) {
        const from = new Date(startDate);
        if (isNaN(from)) {
          return res.status(400).json({ message: "Invalid startDate format" });
        }
        dateQuery.$gte = from;
      }

      if (endDate) {
        const to = new Date(endDate);
        if (isNaN(to)) {
          return res.status(400).json({ message: "Invalid endDate format" });
        }
        to.setHours(23, 59, 59, 999);
        dateQuery.$lte = to;
      }

      query.date = dateQuery;
    }

    if (studentUserId) {
      query.user = studentUserId;
    }

    const attendance = await StudentAttendance.find(query)
      .populate({
        path: "schedule",
        select: "subject subjectName subjectType classDate startTime endTime",
      })
      .populate({
        path: "user",
        select: "name email gender",
      })
      .sort({ date: -1 });

    const counts = {
      present: 0,
      absent: 0,
      leave: 0,
    };

    attendance.forEach((record) => {
      if (record.status === "present") counts.present++;
      if (record.status === "absent") counts.absent++;
      if (record.status === "leave") counts.leave++;
    });

    const totalRecords = attendance.length;
    const attendancePercentage =
      totalRecords > 0
        ? ((counts.present / totalRecords) * 100).toFixed(2) + "%"
        : "0.00%";

    return res.status(200).json({
      message: "Student attendance fetched successfully",
      totalRecords: attendance.length,
      attendancePercentage,
      totals: counts,
      data: attendance.map((a) => ({
        ...a.toObject(),
        date: formatDate(a.date),
        user: a.user,
        schedule: {
          ...a.schedule?.toObject?.(),
          classDate: formatDate(a.schedule?.classDate),
          startTime: a.schedule?.startTime,
          endTime: a.schedule?.endTime,
        },
      })),
    });
  } catch (error) {
    console.error("❌ Error fetching teacher attendance view:", error);
    return res.status(500).json({
      message: "Server error while fetching attendance",
      error: error.message,
    });
  }
};

exports.getSupervisorStudentAttendance = async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;

    if (!["supervisor_quran", "supervisor_subjects"].includes(userRole)) {
      return res.status(403).json({
        message: "Access denied. Only supervisors can view this data.",
      });
    }

    const supervisor = await Supervisor.findOne({ user: userId });
    if (!supervisor) {
      return res.status(404).json({ message: "Supervisor profile not found." });
    }

    const { status, subjectId, studentUserId, startDate, endDate } = req.query;

    if (subjectId && !mongoose.Types.ObjectId.isValid(subjectId)) {
      return res.status(400).json({ message: "Invalid subjectId format." });
    }

    if (studentUserId && !mongoose.Types.ObjectId.isValid(studentUserId)) {
      return res.status(400).json({ message: "Invalid studentUserId format." });
    }

    const managedTeachers = await Teacher.find({
      manager: userId,
      department: supervisor.department,
    }).select("user");

    if (managedTeachers.length === 0) {
      return res.status(200).json({
        message: "No teachers are managed by this supervisor",
        totalRecords: 0,
        attendancePercentage: "0.00%",
        totals: { present: 0, absent: 0, leave: 0 },
        data: [],
      });
    }

    const managedTeacherUserIds = managedTeachers.map((teacher) =>
      teacher.user.toString()
    );

    const managedTeacherUsers = await User.find({
      _id: { $in: managedTeacherUserIds },
    }).select("name");

    const managedTeacherNames = managedTeacherUsers.map((user) => user.name);

    const studentsWithAssignedTeachers = await Student.find({
      "assignedTeachers.teacher._id": { $in: managedTeacherUserIds },
    })
      .select("user assignedTeachers")
      .lean();

    if (studentsWithAssignedTeachers.length === 0) {
      return res.status(200).json({
        message: "No students with teachers managed by this supervisor",
        totalRecords: 0,
        attendancePercentage: "0.00%",
        totals: { present: 0, absent: 0, leave: 0 },
        data: [],
      });
    }

    const studentWithValidTeachers = new Set(
      studentsWithAssignedTeachers.map((s) => s.user.toString())
    );

    const query = {};
    const departmentType =
      supervisor.department === "quran" ? "quran" : "subjects";
    query.subjectType = departmentType;

    if (studentUserId) {
      if (!studentWithValidTeachers.has(studentUserId.toString())) {
        return res.status(200).json({
          message: "This student does not have any teacher managed by you",
          totalRecords: 0,
          attendancePercentage: "0.00%",
          totals: { present: 0, absent: 0, leave: 0 },
          data: [],
        });
      }
      query.user = studentUserId;
    } else {
      query.user = { $in: Array.from(studentWithValidTeachers) };
    }

    if (subjectId) query.subject = subjectId;

    if (status) {
      const allowedStatuses = ["present", "absent", "leave"];
      if (!allowedStatuses.includes(status.toLowerCase())) {
        return res.status(400).json({
          message: `Invalid status. Allowed: ${allowedStatuses.join(", ")}`,
        });
      }
      query.status = status.toLowerCase();
    }

    if (startDate || endDate) {
      const dateQuery = {};
      if (startDate) {
        const from = new Date(startDate);
        if (isNaN(from)) {
          return res.status(400).json({ message: "Invalid startDate format" });
        }
        dateQuery.$gte = from;
      }

      if (endDate) {
        const to = new Date(endDate);
        if (isNaN(to)) {
          return res.status(400).json({ message: "Invalid endDate format" });
        }
        to.setHours(23, 59, 59, 999);
        dateQuery.$lte = to;
      }

      query.date = dateQuery;
    }

    const attendance = await StudentAttendance.find(query)
      .populate({
        path: "user",
        select: "name email gender isActive",
      })
      .populate({
        path: "schedule",
        select:
          "subject subjectName subjectType classDate startTime endTime teacherId teacherName",
      })
      .sort({ date: -1 });

    const filteredAttendance = attendance.filter((record) => {
      if (!record.schedule) return false;

      if (
        record.schedule.teacherId &&
        managedTeacherUserIds.includes(record.schedule.teacherId.toString())
      ) {
        return true;
      }

      if (!record.schedule.teacherId && record.schedule.teacherName) {
        return managedTeacherNames.some((teacherName) =>
          record.schedule.teacherName.includes(
            `${teacherName} (Inactive Teacher)`
          )
        );
      }

      return false;
    });

    const studentUserIds = filteredAttendance.map((record) => record.user._id);

    const studentDetails = await mongoose
      .model("Student")
      .find({
        user: { $in: studentUserIds },
      })
      .select("user studentId clientName")
      .populate("user", "isActive");

    const studentDetailsMap = {};
    const studentActiveMap = {};

    studentDetails.forEach((student) => {
      const userId = student.user._id.toString();
      studentDetailsMap[userId] = {
        studentId: student.studentId,
        clientName: student.clientName,
      };
      studentActiveMap[userId] = student.user?.isActive === true;
    });

    const counts = {
      present: 0,
      absent: 0,
      leave: 0,
    };

    filteredAttendance.forEach((record) => {
      if (record.status === "present") counts.present++;
      if (record.status === "absent") counts.absent++;
      if (record.status === "leave") counts.leave++;
    });

    const totalRecords = filteredAttendance.length;
    const attendancePercentage =
      totalRecords > 0
        ? ((counts.present / totalRecords) * 100).toFixed(2) + "%"
        : "0.00%";

    return res.status(200).json({
      message: "Student attendance fetched successfully",
      totalRecords: filteredAttendance.length,
      attendancePercentage,
      totals: counts,
      data: filteredAttendance.map((a) => {
        const userId = a.user._id.toString();
        const studentDetail = studentDetailsMap[userId] || {};

        return {
          ...a.toObject(),
          date: formatDate(a.date),
          user: {
            ...a.user.toObject(),
            studentId: studentDetail.studentId || "",
            clientName: studentDetail.clientName || "",
            isActive:
              studentActiveMap[userId] !== undefined
                ? studentActiveMap[userId]
                : a.user?.isActive === true,
          },
          schedule: {
            ...a.schedule?.toObject?.(),
            classDate: formatDate(a.schedule?.classDate),
            startTime: a.schedule?.startTime,
            endTime: a.schedule?.endTime,
          },
        };
      }),
    });
  } catch (error) {
    console.error("❌ Error fetching supervisor attendance view:", error);
    return res.status(500).json({
      message: "Server error while fetching attendance",
      error: error.message,
    });
  }
};

exports.getAllAttendanceForAdmin = async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;

    if (userRole !== "admin") {
      return res.status(403).json({
        message: "Access denied. Only admins can view this data.",
      });
    }

    const {
      status,
      subjectId,
      subjectType,
      studentUserId,
      startDate,
      endDate,
    } = req.query;

    const query = {};

    if (subjectId) {
      if (!mongoose.Types.ObjectId.isValid(subjectId)) {
        return res.status(400).json({ message: "Invalid subjectId format." });
      }
      query.subject = subjectId;
    }

    if (studentUserId) {
      if (!mongoose.Types.ObjectId.isValid(studentUserId)) {
        return res
          .status(400)
          .json({ message: "Invalid studentUserId format." });
      }
      query.user = studentUserId;
    }

    if (subjectType) {
      query.subjectType = { $regex: new RegExp(subjectType, "i") };
    }

    if (status) {
      const allowedStatuses = ["present", "absent", "leave"];
      if (!allowedStatuses.includes(status.toLowerCase())) {
        return res.status(400).json({
          message: `Invalid status. Allowed values are: ${allowedStatuses.join(
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
          return res.status(400).json({ message: "Invalid startDate format" });
        }
        dateQuery.$gte = from;
      }

      if (endDate) {
        const to = new Date(endDate);
        if (isNaN(to)) {
          return res.status(400).json({ message: "Invalid endDate format" });
        }
        to.setHours(23, 59, 59, 999);
        dateQuery.$lte = to;
      }

      query.date = dateQuery;
    }

    const attendance = await StudentAttendance.find(query)
      .populate({
        path: "user",
        select: "name email gender role",
      })
      .populate({
        path: "schedule",
        select:
          "subject subjectName subjectType classDate startTime endTime teacherName",
      })
      .sort({ date: -1 });

    const userIds = attendance.map((a) => a.user?._id).filter(Boolean);
    const studentDocs = await Student.find({
      user: { $in: userIds },
    }).select("user studentId");

    const userToStudentMap = {};
    studentDocs.forEach((s) => {
      userToStudentMap[s.user.toString()] = s.studentId;
    });
    const counts = { present: 0, absent: 0, leave: 0 };
    attendance.forEach((record) => {
      if (record.status === "present") counts.present++;
      if (record.status === "absent") counts.absent++;
      if (record.status === "leave") counts.leave++;
    });

    const totalRecords = attendance.length;
    const attendancePercentage =
      totalRecords > 0
        ? ((counts.present / totalRecords) * 100).toFixed(2) + "%"
        : "0.00%";

    return res.status(200).json({
      message: "Attendance fetched successfully",
      totalRecords,
      attendancePercentage,
      totals: counts,
      data: attendance.map((a) => ({
        ...a.toObject(),
        date: formatDate(a.date),
        user: a.user,
        studentId: userToStudentMap[a.user?._id.toString()] || null,
        schedule: {
          ...a.schedule?.toObject?.(),
          classDate: formatDate(a.schedule?.classDate),
          startTime: a.schedule?.startTime,
          endTime: a.schedule?.endTime,
          teacherName: a.schedule?.teacherName,
          subjectName: a.schedule?.subjectName,
          subjectType: a.schedule?.subjectType,
        },
      })),
    });
  } catch (error) {
    console.error("❌ Error fetching admin attendance view:", error);
    return res.status(500).json({
      message: "Server error while fetching attendance",
      error: error.message,
    });
  }
};

exports.deleteMultipleStudentAttendance = async (req, res) => {
  try {
    const { role: userRole } = req.user;
    let { studentIds } = req.body;
    if (userRole !== "admin") {
      return res.status(403).json({
        message: "Access denied. Only admin can delete student attendance.",
      });
    }
    if (!studentIds) {
      return res.status(400).json({
        message: "Student IDs are required.",
      });
    }

    if (typeof studentIds === "string") {
      studentIds = studentIds
        .split(",")
        .map((id) => id.trim())
        .filter((id) => id);
    }

    if (!Array.isArray(studentIds)) {
      studentIds = [studentIds];
    }

    studentIds = studentIds.filter(
      (id) => id && typeof id === "string" && id.trim()
    );

    if (studentIds.length === 0) {
      return res.status(400).json({
        message: "Valid Student IDs array is required and cannot be empty.",
      });
    }

    const invalidIds = studentIds.filter(
      (id) => !mongoose.Types.ObjectId.isValid(id)
    );
    if (invalidIds.length > 0) {
      return res.status(400).json({
        message: "Invalid ObjectId format detected.",
        invalidIds: invalidIds,
      });
    }

    const objectIds = studentIds.map((id) => new mongoose.Types.ObjectId(id));

    if (objectIds.length > 50) {
      return res.status(400).json({
        message: "Cannot delete attendance for more than 50 students at once.",
      });
    }
    const students = await User.find({
      _id: { $in: objectIds },
      role: "student",
    });

    if (students.length !== objectIds.length) {
      const foundIds = students.map((student) => student._id.toString());
      const notFoundIds = studentIds.filter((id) => !foundIds.includes(id));

      return res.status(404).json({
        message: "Some students not found.",
        notFoundIds: notFoundIds,
      });
    }

    const totalAttendanceCount = await StudentAttendance.countDocuments({
      user: { $in: objectIds },
    });

    if (totalAttendanceCount === 0) {
      return res.status(404).json({
        message: "No attendance records found for the selected students.",
        selectedStudents: students.map((student) => ({
          name: student.name,
          id: student._id,
        })),
        deletedCount: 0,
      });
    }

    const studentDetails = await Student.find({
      user: { $in: objectIds },
    }).select("user studentId");

    const studentIdMap = {};
    studentDetails.forEach((student) => {
      studentIdMap[student.user.toString()] = student.studentId;
    });

    const attendanceCountPerStudent = await StudentAttendance.aggregate([
      { $match: { user: { $in: objectIds } } },
      { $group: { _id: "$user", count: { $sum: 1 } } },
    ]);

    const deleteResult = await StudentAttendance.deleteMany({
      user: { $in: objectIds },
    });

    const deletionSummary = students.map((student) => {
      const countData = attendanceCountPerStudent.find(
        (item) => item._id.toString() === student._id.toString()
      );
      return {
        name: student.name,
        studentId: studentIdMap[student._id.toString()] || null,
        deletedRecords: countData ? countData.count : 0,
      };
    });

    return res.status(200).json({
      message: `Successfully deleted attendance records for ${
        students.length
      } student${students.length > 1 ? "s" : ""}.`,
      totalDeleted: deleteResult.deletedCount,
      affectedStudents: deletionSummary,
      deletedBy: {
        name: req.user.name,
        id: req.user._id,
      },
      deletedAt: new Date(),
    });
  } catch (error) {
    console.error("❌ Error deleting multiple student attendance:", error);
    return res.status(500).json({
      message: "Server error while deleting student attendance.",
      error: error.message,
    });
  }
};
