const mongoose = require("mongoose");
const Schedule = require("../models/Schedule");
const Student = require("../models/Student");
const Teacher = require("../models/Teacher");
const Subject = require("../models/Subject");
const User = require("../models/User");
const Client = require("../models/Client");
const StudentAttendance = require("../models/StudentAttendance");
const { formatDate, formatTime } = require("../utils/formatters");

exports.createSchedule = async (req, res) => {
  try {
    if (
      !["admin", "supervisor_quran", "supervisor_subjects"].includes(
        req.user.role
      )
    ) {
      return res.status(403).json({
        message: "Only administrators and supervisors can create schedules",
      });
    }
    const {
      students: studentUserIds,
      teacher: teacherUserId,
      subject,
      day,
      startTime,
      endTime,
      classDate,
      isRecurring = false,
      recurrencePattern = "weekdays",
      customDays = [],
    } = req.body;

    if (!classDate) {
      return res.status(400).json({
        message: "classDate is required",
      });
    }

    if (isRecurring) {
      if (!["weekly", "weekdays", "custom"].includes(recurrencePattern)) {
        return res.status(400).json({
          message:
            "Invalid recurrence pattern. Must be either 'weekly', 'weekdays', or 'custom'",
        });
      }

      if (
        recurrencePattern === "custom" &&
        (!customDays || customDays.length === 0)
      ) {
        return res.status(400).json({
          message:
            "Custom days are required when using custom recurrence pattern",
        });
      }
    }

    const supervisorDepartment =
      req.user.role !== "admin" ? req.user.role.split("_")[1] : null;

    const teacher = await Teacher.findOne({ user: teacherUserId });
    if (!teacher) return res.status(404).json({ message: "Teacher not found" });

    const subjectDoc = await Subject.findById(subject);
    if (!subjectDoc)
      return res.status(404).json({ message: "Subject not found" });

    if (req.user.role !== "admin") {
      if (
        (subjectDoc.type === "quran" && supervisorDepartment !== "quran") ||
        (subjectDoc.type === "subjects" && supervisorDepartment !== "subjects")
      ) {
        return res.status(403).json({
          message: `Supervisor of '${supervisorDepartment}' cannot schedule '${subjectDoc.name}' class.`,
        });
      }
    }

    const studentDocs = await Student.find({ user: { $in: studentUserIds } });
    if (studentDocs.length !== studentUserIds.length) {
      return res
        .status(404)
        .json({ message: "One or more students not found" });
    }

    const studentUsers = await User.find({ _id: { $in: studentUserIds } });
    const studentUserMap = {};
    studentUsers.forEach((user) => {
      studentUserMap[user._id.toString()] = user.name || "Unknown Student";
    });

    for (const student of studentDocs) {
      const studentId = student.user.toString();
      const studentName = studentUserMap[studentId] || "Unknown Student";

      const isEnrolled = student.subjects.some((s) => s.toString() === subject);
      if (req.user.role !== "admin") {
        const isEnrolled = student.subjects.some(
          (s) => s.toString() === subject
        );
        if (!isEnrolled) {
          return res.status(400).json({
            message: `Student '${studentName}' is not enrolled in this subject`,
          });
        }
      }

      const conflict = await Schedule.findOne({
        students: studentId,
        day,
        classDate: new Date(classDate),
        $or: [{ startTime: { $lt: endTime }, endTime: { $gt: startTime } }],
      });

      if (conflict) {
        return res.status(400).json({
          message: `Student '${studentName}' already has a class during this time`,
        });
      }
    }

    const teacherConflict = await Schedule.findOne({
      teacher: teacher.user,
      day,
      classDate: new Date(classDate),
      $or: [{ startTime: { $lt: endTime }, endTime: { $gt: startTime } }],
    });

    if (teacherConflict) {
      const teacherUser = await User.findById(teacher.user);
      return res.status(400).json({
        message: `Teacher '${
          teacherUser?.name || "Unknown Teacher"
        }' already has a class during this time`,
      });
    }

    const teacherUser = await User.findById(teacher.user);
    const studentNames = studentUserIds.map(
      (id) => studentUserMap[id] || "Unknown Student"
    );

    const [startHour, startMinute] = startTime.split(":").map(Number);
    const [endHour, endMinute] = endTime.split(":").map(Number);
    const scheduledDuration =
      endHour * 60 + endMinute - (startHour * 60 + startMinute);

    const baseSchedule = new Schedule({
      students: studentUserIds,
      studentNames,
      teacher: teacher.user,
      teacherId: teacher.user,
      teacherName: teacherUser?.name || "Unknown Teacher",
      subject,
      subjectName: subjectDoc.name,
      subjectType: subjectDoc.type,
      day,
      startTime,
      endTime,
      classDate: new Date(classDate),
      isRecurring,
      recurrencePattern,
      customDays: recurrencePattern === "custom" ? customDays : undefined,
      scheduledDuration,
      createdBy: req.user.id,
      createdByRole: req.user.role,
    });

    await baseSchedule.save();

    return res.status(201).json({
      message: "Schedule created successfully",
      schedule: {
        _id: baseSchedule._id,
        students: baseSchedule.students,
        studentNames: baseSchedule.studentNames,
        teacher: baseSchedule.teacher,
        teacherId: baseSchedule.teacherId,
        teacherName: baseSchedule.teacherName,
        subject: baseSchedule.subject,
        subjectName: baseSchedule.subjectName,
        subjectType: baseSchedule.subjectType,
        day: baseSchedule.day,
        startTime: baseSchedule.startTime,
        endTime: baseSchedule.endTime,
        isRecurring: baseSchedule.isRecurring,
        recurrencePattern: baseSchedule.recurrencePattern,
        customDays: baseSchedule.customDays,
        classDate: formatDate(baseSchedule.classDate),
        status: baseSchedule.status,
        scheduledDuration: baseSchedule.scheduledDuration,
      },
    });
  } catch (error) {
    console.error("❌ Error in createSchedule:", error.stack);
    return res.status(500).json({
      message: "Server error while creating schedule",
      error: error.message,
    });
  }
};

exports.getSchedulesForSupervisor = async (req, res) => {
  try {
    const userId = req.user.id;
    const role = req.user.role;
    const { status, sessionStatus, startDate, endDate } = req.query;

    if (!["supervisor_quran", "supervisor_subjects"].includes(role)) {
      return res
        .status(403)
        .json({ message: "Only supervisors can view schedules" });
    }

    const department = role.split("_")[1];

    let managedTeacherIds = [];
    let managedTeacherNames = [];

    if (role === "supervisor_quran") {
      const managedTeachers = await Teacher.find({
        department: "quran",
        manager: userId,
      })
        .populate("user", "name")
        .select("user")
        .lean();

      managedTeacherIds = managedTeachers.map((t) => t.user._id.toString());
      managedTeacherNames = managedTeachers.map((t) => t.user.name);
    } else if (role === "supervisor_subjects") {
      const managedTeachers = await Teacher.find({
        department: "subjects",
        manager: userId,
      })
        .populate("user", "name")
        .select("user")
        .lean();

      managedTeacherIds = managedTeachers.map((t) => t.user._id.toString());
      managedTeacherNames = managedTeachers.map((t) => t.user.name);
    }

    if (managedTeacherIds.length === 0) {
      return res.status(200).json({
        total: 0,
        sessionStatusCounts: {
          pending: 0,
          available: 0,
          in_progress: 0,
          completed: 0,
        },
        schedules: [],
      });
    }

    const filter = {
      subjectType: department,
      $or: [
        { teacherId: { $in: managedTeacherIds } },
        {
          teacherId: null,
          teacherName: {
            $in: managedTeacherNames.map(
              (name) => new RegExp(`${name} \\(Inactive Teacher\\)`)
            ),
          },
        },
      ],
      classDate: { $exists: true },
    };

    if (status) filter.status = status;
    if (sessionStatus) filter.sessionStatus = sessionStatus;

    if (startDate || endDate) {
      filter.classDate = filter.classDate || {};
      if (startDate) filter.classDate.$gte = new Date(startDate);
      if (endDate) {
        const to = new Date(endDate);
        to.setHours(23, 59, 59, 999);
        filter.classDate.$lte = to;
      }
    }

    const schedules = await Schedule.find(filter)
      .sort({
        classDate: 1,
        startTime: 1,
      })
      .lean();

    const activeSchedules = schedules.filter(
      (s) => s.teacherId !== null
    ).length;
    const inactiveSchedules = schedules.filter(
      (s) => s.teacherId === null
    ).length;

    const sessionStatusCounts = {
      pending: 0,
      available: 0,
      in_progress: 0,
      completed: 0,
    };

    const scheduleIds = schedules.map((schedule) => schedule._id);

    const studentUserIds = [
      ...new Set(
        schedules.flatMap((s) => s.students.map((id) => id.toString()))
      ),
    ];

    const attendanceRecords = await StudentAttendance.find({
      schedule: { $in: scheduleIds },
    }).lean();

    const attendanceMap = {};
    attendanceRecords.forEach((record) => {
      const key = `${record.schedule.toString()}-${record.user.toString()}`;
      attendanceMap[key] = record;
    });

    const students = await Student.find({
      user: { $in: studentUserIds },
    })
      .populate("user", "name isActive")
      .populate("client", "name isActive")
      .lean();

    const clientUserIds = [
      ...new Set(
        students.map((st) => st.client?._id?.toString()).filter(Boolean)
      ),
    ];

    const clientDocs = await Client.find({
      user: { $in: clientUserIds },
    })
      .select("user clientId clientName")
      .lean();

    const clientLookup = {};
    clientDocs.forEach((c) => {
      clientLookup[c.user.toString()] = {
        clientId: c.clientId,
        clientName: c.clientName,
      };
    });

    const studentDetailsMap = {};
    students.forEach((st) => {
      const uid = st.user._id.toString();
      const clientUserId = st.client?._id?.toString();
      const clientInfo = clientLookup[clientUserId] || {};

      studentDetailsMap[uid] = {
        name: st.user.name || "Unknown",
        studentId: st.studentId || "Unknown",
        isActive: st.user?.isActive === true,
        clientName: clientInfo.clientName || st.clientName || "Unknown",
        clientId: clientInfo.clientId || "Unknown",
        clientIsActive: st.client?.isActive === true,
      };
    });

    const enrichedSchedules = schedules.map((schedule) => {
      const studentAttendances = schedule.students.map((studentId) => {
        const studentIdStr = studentId.toString();
        const attendanceKey = `${schedule._id.toString()}-${studentIdStr}`;
        const attendanceRecord = attendanceMap[attendanceKey];
        const studentDetails = studentDetailsMap[studentIdStr] || {
          name: "Unknown",
          studentId: "Unknown",
          isActive: true,
          clientName: "Unknown",
          clientId: "Unknown",
          clientIsActive: true,
        };

        return {
          studentId: studentIdStr,
          studentName: studentDetails.name,
          studentIsActive: studentDetails.isActive,
          clientName: studentDetails.clientName,
          clientId: studentDetails.clientId,
          clientIsActive: studentDetails.clientIsActive,
          status: attendanceRecord ? attendanceRecord.status : "pending",
          remarks: attendanceRecord ? attendanceRecord.remarks : "",
          markedBy: attendanceRecord ? attendanceRecord.markedByName : "",
          markedAt: attendanceRecord ? attendanceRecord.createdAt : null,
        };
      });

      if (
        schedule.sessionStatus &&
        sessionStatusCounts[schedule.sessionStatus] !== undefined
      ) {
        sessionStatusCounts[schedule.sessionStatus]++;
      }

      return {
        ...schedule,
        studentAttendances,
        isTeacherActive: schedule.teacherId !== null,
        teacherStatus: schedule.teacherId !== null ? "active" : "inactive",
      };
    });

    const activeStudentsCount = Object.values(studentDetailsMap).filter(
      (s) => s.isActive
    ).length;
    const inactiveStudentsCount = Object.values(studentDetailsMap).filter(
      (s) => !s.isActive
    ).length;
    const activeClientsCount = Object.values(studentDetailsMap).filter(
      (s) => s.clientIsActive
    ).length;
    const inactiveClientsCount = Object.values(studentDetailsMap).filter(
      (s) => !s.clientIsActive
    ).length;

    return res.status(200).json({
      total: enrichedSchedules.length,
      sessionStatusCounts,
      schedules: enrichedSchedules,
      summary: {
        activeTeacherSchedules: activeSchedules,
        inactiveTeacherSchedules: inactiveSchedules,
        activeStudents: activeStudentsCount,
        inactiveStudents: inactiveStudentsCount,
        activeClients: activeClientsCount,
        inactiveClients: inactiveClientsCount,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error(
      "❌ Error fetching supervisor schedules by hammas-coding at 2025-06-18 09:17:36:",
      err
    );
    return res.status(500).json({
      message: "Server error while fetching schedules",
      error: err.message,
    });
  }
};

exports.updateSchedule = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const {
      students: studentUserIds,
      teacher,
      subject,
      day,
      startTime,
      endTime,
      classDate,
      rescheduleType,
      isRecurring,
    } = req.body;

    console.log(`📝 Updating schedule ${id} by user ${userId}`);
    console.log(`📊 Update data:`, {
      students: studentUserIds,
      teacher,
      subject,
      day,
      startTime,
      endTime,
      classDate,
      rescheduleType,
      isRecurring,
    });

    // Check user permissions
    if (
      !["admin", "supervisor_quran", "supervisor_subjects"].includes(
        req.user.role
      )
    ) {
      return res.status(403).json({
        message: "Only administrators and supervisors can update schedules",
      });
    }

    // Find existing schedule
    const existingSchedule = await Schedule.findById(id);
    if (!existingSchedule) {
      return res.status(404).json({ message: "Schedule not found" });
    }

    console.log(`📋 Found existing schedule:`, {
      id: existingSchedule._id,
      teacher: existingSchedule.teacherName,
      subject: existingSchedule.subjectName,
      date: existingSchedule.classDate,
      isRecurring: existingSchedule.isRecurring,
    });

    // Check if schedule is completed
    if (existingSchedule.sessionStatus === "completed") {
      return res.status(400).json({
        message: "Completed classes cannot be updated or rescheduled.",
      });
    }

    // Supervisor permissions validation
    if (req.user.role !== "admin") {
      const supervisorDepartment = req.user.role.split("_")[1];

      const subjectDoc = await Subject.findById(subject);
      if (!subjectDoc) {
        return res.status(404).json({ message: "Subject not found" });
      }

      if (subjectDoc.type !== supervisorDepartment) {
        return res.status(403).json({
          message: `Supervisor of '${supervisorDepartment}' cannot update '${subjectDoc.name}' class.`,
        });
      }

      const currentTeacherId = existingSchedule.teacherId.toString();
      const teacherDoc = await Teacher.findOne({
        user: currentTeacherId,
        manager: userId,
      });

      if (!teacherDoc) {
        return res.status(403).json({
          message:
            "You don't have permission to update this schedule as you are not the manager of this teacher.",
        });
      }

      if (teacher && teacher !== currentTeacherId) {
        const newTeacherDoc = await Teacher.findOne({
          user: teacher,
          manager: userId,
        });

        if (!newTeacherDoc) {
          return res.status(403).json({
            message:
              "You don't have permission to assign this teacher as you are not their manager.",
          });
        }
      }
    }

    // Validate teacher exists
    const teacherDoc = await Teacher.findOne({
      user: teacher || existingSchedule.teacherId,
    });
    if (!teacherDoc) {
      return res.status(404).json({ message: "Teacher not found" });
    }

    // Validate students exist
    const studentDocs = await Student.find({ user: { $in: studentUserIds } });
    if (studentDocs.length !== studentUserIds.length) {
      return res.status(404).json({ message: "Some students not found" });
    }

    // Get student names
    const studentUsers = await User.find({ _id: { $in: studentUserIds } });
    const studentUserMap = {};
    studentUsers.forEach((u) => {
      studentUserMap[u._id] = u.name;
    });

    // Check student enrollment (non-admin only)
    if (req.user.role !== "admin") {
      for (const student of studentDocs) {
        const studentId = student.user.toString();
        const studentName = studentUserMap[studentId] || "Unknown Student";

        const isEnrolled = student.subjects.some(
          (s) => s.toString() === subject
        );
        if (!isEnrolled) {
          return res.status(400).json({
            message: `Student '${studentName}' is not enrolled in this subject`,
          });
        }
      }
    }

    // Check for student schedule conflicts
    const scheduleConflicts = await Promise.all(
      studentUserIds.map(async (studentId) => {
        const conflict = await Schedule.findOne({
          _id: { $ne: id },
          students: studentId,
          day,
          classDate: new Date(classDate),
          $or: [{ startTime: { $lt: endTime }, endTime: { $gt: startTime } }],
        });
        if (conflict) {
          const studentName = studentUserMap[studentId] || "Unknown Student";
          return `Student '${studentName}' already has a class during this time`;
        }
        return null;
      })
    );

    const conflictMessages = scheduleConflicts.filter(Boolean);
    if (conflictMessages.length > 0) {
      return res.status(400).json({
        message: conflictMessages[0],
      });
    }

    // Check for teacher schedule conflicts
    const teacherConflict = await Schedule.findOne({
      _id: { $ne: id },
      teacherId: teacher || existingSchedule.teacherId,
      day,
      classDate: new Date(classDate),
      $or: [{ startTime: { $lt: endTime }, endTime: { $gt: startTime } }],
    });

    if (teacherConflict) {
      const teacherUser = await User.findById(
        teacher || existingSchedule.teacherId
      );
      return res.status(400).json({
        message: `Teacher '${
          teacherUser?.name || "Unknown Teacher"
        }' already has a class during this time`,
      });
    }

    // Prepare update data
    const studentNames = studentUserIds.map(
      (id) => studentUserMap[id] || "Unknown"
    );

    const [startHour, startMinute] = startTime.split(":").map(Number);
    const [endHour, endMinute] = endTime.split(":").map(Number);
    const scheduledDuration =
      endHour * 60 + endMinute - (startHour * 60 + startMinute);

    const subjectDoc = await Subject.findById(subject);

    const updatedFields = {
      students: studentUserIds,
      studentNames,
      subject,
      subjectName: subjectDoc?.name || existingSchedule.subjectName,
      subjectType: subjectDoc?.type || existingSchedule.subjectType,
      day,
      startTime,
      endTime,
      classDate: new Date(classDate),
      rescheduleType,
      scheduledDuration,
      isRecurring:
        typeof isRecurring === "boolean"
          ? isRecurring
          : existingSchedule.isRecurring,
      updatedBy: req.user._id,
    };

    // Add teacher info if teacher is being updated
    if (teacher) {
      const teacherUser = await User.findById(teacher);
      updatedFields.teacherId = teacher;
      updatedFields.teacherName = teacherUser?.name || "Unknown";
    }

    console.log(`🔄 Processing ${rescheduleType} update...`);

    // Handle permanent vs temporary updates
    if (rescheduleType === "permanent") {
      console.log("📝 Processing permanent update...");

      // Update student schema if teacher is changing
      if (teacher && teacher !== existingSchedule.teacherId.toString()) {
        const newTeacherUser = await User.findById(teacher);
        if (!newTeacherUser) {
          return res.status(404).json({ message: "New teacher not found" });
        }

        console.log("👥 Updating student schema with new teacher...");

        const updateResult = await Student.updateMany(
          {
            user: { $in: studentUserIds },
            "assignedTeachers.subject._id": subject,
          },
          {
            $set: {
              "assignedTeachers.$.teacher._id": teacher,
              "assignedTeachers.$.teacher.name": newTeacherUser.name,
              "assignedTeachers.$.assignedBy": req.user._id,
              "assignedTeachers.$.assignedAt": new Date(),
            },
          }
        );

        console.log(
          `✅ Updated ${updateResult.modifiedCount} students with new teacher`
        );
      }

      // FIXED: Only update the current schedule for permanent changes
      // The cron job will handle future schedules based on this permanent change
      const updateResult = await Schedule.findByIdAndUpdate(id, {
        $set: {
          ...updatedFields,
          isTemporaryChange: false,
          isTeacherTemporaryChange: false,
        },
      });

      console.log(`✅ Updated current schedule ${id} permanently`);
    } else {
      console.log("⏰ Processing temporary update...");

      // Temporary update logic - only update this specific schedule
      await Schedule.findByIdAndUpdate(id, {
        $set: {
          ...updatedFields,
          isTemporaryChange: true,
          isTeacherTemporaryChange:
            teacher && teacher !== existingSchedule.teacherId.toString(),
          status: "rescheduled",
        },
      });

      console.log(`✅ Updated schedule ${id} temporarily`);
    }

    console.log(`🎉 Schedule update completed successfully`);

    return res.status(200).json({
      message: "Schedule updated successfully",
      scheduleId: id,
      rescheduleType: rescheduleType || "none",
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("❌ Error in updateSchedule:", error.stack);
    return res.status(500).json({
      message: "Server error while updating schedule",
      error: error.message,
    });
  }
};
exports.deleteSchedule = async (req, res) => {
  try {
    const { id } = req.params;
    const { deleteType } = req.query;

    const role = req.user.role;

    if (!["admin"].includes(role)) {
      return res
        .status(403)
        .json({ message: "Only administrators can delete schedules" });
    }

    const schedule = await Schedule.findById(id);
    if (!schedule) {
      return res.status(404).json({ message: "Schedule not found" });
    }

    if (schedule.isRecurring && deleteType === "permanent") {
      const baseId = schedule.recurrenceParentId || schedule._id;
      const futureSchedules = await Schedule.deleteMany({
        $or: [{ recurrenceParentId: baseId }, { _id: baseId }],
        classDate: { $gte: schedule.classDate },
      });
      return res
        .status(200)
        .json({ message: "All future recurring schedules deleted." });
    }

    await Schedule.findByIdAndDelete(id);
    return res.status(200).json({ message: "Schedule deleted successfully." });
  } catch (error) {
    console.error("❌ Error deleting schedule:", error.stack);
    return res.status(500).json({
      message: "Server error while deleting schedule",
      error: error.message,
    });
  }
};

exports.getTeacherSchedule = async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;
    const { status, sessionStatus, startDate, endDate } = req.query;

    if (!["teacher_quran", "teacher_subjects"].includes(userRole)) {
      return res.status(403).json({
        message: "Only teachers can view their schedules",
      });
    }

    const teacher = await Teacher.findOne({ user: userId });
    if (!teacher) {
      return res.status(404).json({ message: "Teacher not found" });
    }

    const filter = {
      teacherId: teacher.user,
      classDate: { $exists: true },
    };

    if (status) filter.status = status;
    if (sessionStatus) filter.sessionStatus = sessionStatus;

    if (startDate || endDate) {
      filter.classDate = filter.classDate || {};
      if (startDate) filter.classDate.$gte = new Date(startDate);
      if (endDate) {
        const to = new Date(endDate);
        to.setHours(23, 59, 59, 999);
        filter.classDate.$lte = to;
      }
    }

    const schedules = await Schedule.find(filter).sort({
      classDate: 1,
      startTime: 1,
    });

    const studentIds = [...new Set(schedules.flatMap((s) => s.students))];

    const students = await Student.find({ user: { $in: studentIds } })
      .populate("user", "name isActive")
      .populate("client", "name isActive")
      .lean();
    const clientUserIds = [
      ...new Set(
        students.map((st) => st.client?._id?.toString()).filter(Boolean)
      ),
    ];

    const clientDocs = await Client.find({
      user: { $in: clientUserIds },
    })
      .select("user clientId clientName")
      .lean();

    const clientLookup = {};
    clientDocs.forEach((c) => {
      clientLookup[c.user.toString()] = {
        clientId: c.clientId,
        clientName: c.clientName,
      };
    });

    const attendanceRecords = await StudentAttendance.find({
      schedule: { $in: schedules.map((s) => s._id) },
    });

    const attendanceMap = {};
    attendanceRecords.forEach((record) => {
      const key = `${record.schedule.toString()}-${record.user.toString()}`;
      attendanceMap[key] = {
        status: record.status,
        remarks: record.remarks,
        markedBy: record.markedBy,
        markedByName: record.markedByName,
        createdAt: record.createdAt,
        updatedAt: record.updatedAt,
      };
    });

    const studentMap = {};
    students.forEach((student) => {
      const uid = student.user._id.toString();
      const clientUserId = student.client?._id?.toString();
      const clientInfo = clientLookup[clientUserId] || {};

      studentMap[uid] = {
        studentId: student.studentId || "N/A",
        studentName: student.user.name || "Unknown",
        studentIsActive: student.user?.isActive === true,
        clientId: {
          _id: student.client?._id || "N/A",
          customId: clientInfo.clientId || "N/A",
        },
        clientName: clientInfo.clientName || student.clientName || "Unknown",
        clientIsActive: student.client?.isActive === true,
      };
    });

    return res.status(200).json({
      totalClasses: schedules.length,
      schedules: schedules.map((schedule) => {
        const mappedSchedule = schedule.toObject();

        mappedSchedule.studentDetails = schedule.students.map((studentId) => {
          const userStringId = studentId.toString();
          const attendanceKey = `${schedule._id.toString()}-${userStringId}`;
          const attendance = attendanceMap[attendanceKey] || null;

          return {
            ...(studentMap[userStringId] || {
              studentId: "N/A",
              studentName: "Unknown",
              studentIsActive: true,
              clientId: {
                _id: "N/A",
                customId: "N/A",
              },
              clientName: "Unknown",
              clientIsActive: true,
            }),
            attendance: attendance || {
              status: "not_marked",
              remarks: "",
              markedBy: null,
              markedByName: null,
              createdAt: null,
              updatedAt: null,
            },
          };
        });

        if (mappedSchedule.classDate) {
          mappedSchedule.classDate = formatDate(mappedSchedule.classDate);
        }

        return mappedSchedule;
      }),
    });
  } catch (error) {
    console.error("❌ Error fetching teacher's schedule:", error.stack);
    return res.status(500).json({
      message: "Server error while fetching schedule",
      error: error.message,
    });
  }
};

exports.getClientStudentsSchedule = async (req, res) => {
  try {
    const clientUserId = req.user.id;
    const currentDate = new Date("2025-05-21T07:29:36Z");

    const client = await Client.findOne({ user: clientUserId });
    if (!client) {
      return res.status(404).json({ msg: "Client not found" });
    }
    const { studentId, subjectId, startDate, endDate } = req.query;
    if (studentId && !mongoose.Types.ObjectId.isValid(studentId)) {
      return res.status(400).json({ msg: "Invalid studentId format" });
    }

    if (
      studentId &&
      !client.students.map((s) => s.toString()).includes(studentId)
    ) {
      return res.status(403).json({
        msg: "This student does not belong to your account",
      });
    }

    if (subjectId && !mongoose.Types.ObjectId.isValid(subjectId)) {
      return res.status(400).json({ msg: "Invalid subjectId format" });
    }

    if (startDate) {
      const sDate = new Date(startDate);
      if (isNaN(sDate.getTime())) {
        return res.status(400).json({ msg: "Invalid startDate format" });
      }
    }

    if (endDate) {
      const eDate = new Date(endDate);
      if (isNaN(eDate.getTime())) {
        return res.status(400).json({ msg: "Invalid endDate format" });
      }
    }

    const studentFilter = studentId
      ? [studentId]
      : client.students.map((s) => s.toString());

    const scheduleFilter = {
      students: { $in: studentFilter },
    };

    if (subjectId) {
      scheduleFilter.subject = subjectId;
    }

    if (startDate || endDate) {
      const dateFilter = {};

      if (startDate && !endDate) {
        const date = new Date(startDate);
        if (isNaN(date.getTime())) {
          return res.status(400).json({ msg: "Invalid startDate format" });
        }
        date.setHours(0, 0, 0, 0);
        const endOfDay = new Date(startDate);
        endOfDay.setHours(23, 59, 59, 999);
        scheduleFilter.classDate = { $gte: date, $lte: endOfDay };
      } else {
        if (startDate) {
          const from = new Date(startDate);
          if (isNaN(from.getTime())) {
            return res.status(400).json({ msg: "Invalid startDate format" });
          }
          from.setHours(0, 0, 0, 0);
          dateFilter.$gte = from;
        }

        if (endDate) {
          const to = new Date(endDate);
          if (isNaN(to.getTime())) {
            return res.status(400).json({ msg: "Invalid endDate format" });
          }
          to.setHours(23, 59, 59, 999);
          dateFilter.$lte = to;
        }

        scheduleFilter.classDate = dateFilter;
      }
    }

    const schedules = await Schedule.find(scheduleFilter)
      .populate("subject", "name type")
      .populate("students", "name")
      .populate("teacherId", "name")
      .sort({ classDate: 1, startTime: 1 });
    const studentData = await Student.find(
      { user: { $in: studentFilter } },
      "user studentId"
    );
    const studentIdMap = {};
    studentData.forEach((student) => {
      studentIdMap[student.user.toString()] = student.studentId;
    });
    const formatted = schedules.map((s) => ({
      _id: s._id,
      studentNames: s.students
        .filter((stu) => studentFilter.includes(stu._id.toString()))
        .map((stu) => ({
          _id: stu._id,
          name: stu.name,
          studentId: studentIdMap[stu._id.toString()] || null,
        })),
      subjectName: s.subject?.name || null,
      subjectType: s.subject?.type || "subjects",
      teacherId: s.teacherId?._id || null,
      teacherName: s.teacherId?.name || s.teacherName || null,
      subject: s.subject?._id || null,
      day: s.day,
      startTime: s.startTime,
      endTime: s.endTime,
      classDate: formatDate(s.classDate),
      status: s.status,
      sessionStatus: s.sessionStatus,
      isRecurring: s.isRecurring || false,
      recurrencePattern: s.recurrencePattern || null,
      customDays: s.customDays || [],
      createdBy: s.createdBy,
      createdAt: s.createdAt,
      updatedAt: s.updatedAt,
      teacherAvailableAt: s.teacherAvailableAt,
      classStartedAt: s.classStartedAt,
      classEndedAt: s.classEndedAt,
      startDelay: s.startDelay || 0,
      earlyEnd: s.earlyEnd || 0,
      actualDuration: s.actualDuration || 0,
      scheduledDuration: s.scheduledDuration || 0,
      sessionDurationInMinutes: s.sessionDurationInMinutes || 0,
      studentAttendances:
        s.studentAttendances
          ?.filter((att) => studentFilter.includes(att.studentId.toString()))
          .map((att) => ({
            studentId: att.studentId,
            studentName: att.studentName,
            status: att.status,
            remarks: att.remarks,
            markedBy: att.markedBy,
            markedAt: att.markedAt,
          })) || [],
      lessons:
        s.lessons?.map((lesson) => ({
          _id: lesson._id,
          title: lesson.title,
          description: lesson.description,
          addedAt: lesson.addedAt,
          remarks: lesson.remarks,
        })) || [],
      __v: s.__v,
      lastModifiedBy: s.lastModifiedBy,
    }));

    return res.status(200).json({
      total: formatted.length,
      schedules: formatted,
    });
  } catch (error) {
    console.error("❌ Error fetching client student schedule:", error.message);
    return res
      .status(500)
      .json({ msg: "Server error while fetching schedules" });
  }
};

exports.teacherAvailable = async (req, res) => {
  try {
    const { scheduleId } = req.params;

    const teacher = await Teacher.findOne({ user: req.user.id });
    if (!teacher) {
      return res.status(404).json({ message: "Teacher not found" });
    }

    const schedule = await Schedule.findById(scheduleId);
    if (!schedule) {
      return res.status(404).json({ message: "Schedule not found" });
    }

    if (schedule.teacherAvailableAt) {
      return res.status(400).json({
        message: "You have already marked your availability for this class",
        formattedDate: formatDate(schedule.classDate),
        availableAt: formatTime(schedule.teacherAvailableAt),
        alreadyMarked: true,
      });
    }

    if (!schedule.classDate || !schedule.startTime || !schedule.endTime) {
      return res.status(400).json({
        message:
          "This schedule appears to be a recurring template. Please mark availability only for actual scheduled classes.",
      });
    }

    if (
      !schedule.teacherId ||
      schedule.teacherId.toString() !== teacher.user.toString()
    ) {
      return res
        .status(403)
        .json({ message: "You are not assigned to this schedule" });
    }

    schedule.teacherAvailableAt = new Date();
    schedule.sessionStatus = "available";

    await schedule.save();

    return res.status(200).json({
      message: "Marked as available",
      formattedDate: formatDate(schedule.classDate),
      availableAt: formatTime(schedule.teacherAvailableAt),
    });
  } catch (error) {
    console.error("❌ Error in teacherAvailable:", error.stack);
    return res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};

exports.startClass = async (req, res) => {
  try {
    const { id } = req.params;

    const teacher = await Teacher.findOne({ user: req.user.id });
    if (!teacher) {
      return res.status(404).json({ message: "Teacher not found" });
    }

    const schedule = await Schedule.findById(id);
    if (!schedule) {
      return res.status(404).json({ message: "Schedule not found" });
    }

    if (!schedule.classDate || !schedule.startTime || !schedule.endTime) {
      return res.status(400).json({
        message:
          "This schedule is a recurring template. You can only start actual scheduled sessions.",
      });
    }

    if (
      !schedule.teacherId ||
      schedule.teacherId.toString() !== teacher.user.toString()
    ) {
      return res.status(403).json({
        message: "You are not assigned to this schedule",
      });
    }

    if (!schedule.teacherAvailableAt) {
      return res.status(400).json({
        message:
          "You must mark yourself as available before starting the class",
      });
    }

    if (
      schedule.sessionStatus === "absent" ||
      schedule.sessionStatus === "leave"
    ) {
      return res.status(400).json({
        message: `Cannot start class. This session is marked as ${schedule.sessionStatus}`,
      });
    }
    if (schedule.classStartedAt) {
      return res.status(400).json({
        message: "Class has already been started",
      });
    }

    const now = new Date();
    const scheduledStartTime = new Date(schedule.classDate);
    const [startHours, startMinutes] = schedule.startTime
      .split(":")
      .map(Number);
    scheduledStartTime.setHours(startHours, startMinutes, 0, 0);

    const [endHours, endMinutes] = schedule.endTime.split(":").map(Number);
    const scheduledEndTime = new Date(schedule.classDate);
    scheduledEndTime.setHours(endHours, endMinutes, 0, 0);

    const startDelayMs = Math.max(0, now - scheduledStartTime);
    const startDelayMinutes = Math.floor(startDelayMs / (1000 * 60));
    const scheduledDurationMinutes = Math.floor(
      (scheduledEndTime - scheduledStartTime) / (1000 * 60)
    );

    schedule.classStartedAt = now;
    schedule.sessionStatus = "in_progress";
    schedule.startDelay = startDelayMinutes;
    schedule.scheduledDuration = scheduledDurationMinutes;

    await schedule.save();

    return res.status(200).json({
      message: "Class started",
      schedule: {
        _id: schedule._id,
        classDate: formatDate(schedule.classDate),
        scheduledStart: schedule.startTime,
        actualStart: formatTime(now),
        startDelay: `${startDelayMinutes} minutes`,
        scheduledDuration: `${scheduledDurationMinutes} minutes`,
        sessionStatus: schedule.sessionStatus,
        studentNames: schedule.studentNames,
        teacherName: schedule.teacherName,
        subjectName: schedule.subjectName,
      },
      timingSummary: {
        scheduledStartTime: formatTime(scheduledStartTime),
        actualStartTime: formatTime(now),
        startDelay: startDelayMinutes,
        scheduledDuration: scheduledDurationMinutes,
      },
    });
  } catch (error) {
    console.error("❌ Error in startClass:", error.stack);
    return res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};

exports.endClass = async (req, res) => {
  try {
    const { id } = req.params;

    const teacher = await Teacher.findOne({ user: req.user.id });
    if (!teacher) {
      return res.status(404).json({ message: "Teacher not found" });
    }

    const schedule = await Schedule.findById(id);
    if (!schedule) {
      return res.status(404).json({ message: "Schedule not found" });
    }

    if (!schedule.classDate || !schedule.startTime || !schedule.endTime) {
      return res.status(400).json({
        message:
          "This is a recurring template. You can only end actual dated sessions.",
      });
    }

    if (
      !schedule.teacherId ||
      schedule.teacherId.toString() !== teacher.user.toString()
    ) {
      return res.status(403).json({
        message: "You are not assigned to this schedule",
      });
    }

    if (
      schedule.sessionStatus === "absent" ||
      schedule.sessionStatus === "leave"
    ) {
      return res.status(400).json({
        message: `Cannot end class. This session is marked as ${schedule.sessionStatus}`,
      });
    }
    if (!schedule.classStartedAt) {
      return res.status(400).json({
        message: "You must start the class before ending it",
      });
    }

    if (schedule.classEndedAt) {
      return res.status(400).json({
        message: "Class has already been ended",
      });
    }

    const now = new Date();
    const scheduledEndTime = new Date(schedule.classDate);
    const [endHours, endMinutes] = schedule.endTime.split(":").map(Number);
    scheduledEndTime.setHours(endHours, endMinutes, 0, 0);

    const earlyEndMs = Math.max(0, scheduledEndTime - now);
    const earlyEndMinutes = Math.floor(earlyEndMs / (1000 * 60));

    const actualDurationMs = now - schedule.classStartedAt;
    const actualDurationMinutes = Math.round(actualDurationMs / (1000 * 60));

    const durationDifference =
      schedule.scheduledDuration - actualDurationMinutes;

    schedule.classEndedAt = now;
    schedule.sessionStatus = "completed";
    schedule.status = "completed";
    schedule.earlyEnd = earlyEndMinutes;
    schedule.actualDuration = actualDurationMinutes;
    schedule.sessionDurationMinutes = actualDurationMinutes;

    await schedule.save();

    const timingSummary = {
      scheduledStartTime: schedule.startTime,
      actualStartTime: formatTime(schedule.classStartedAt),
      startDelay: `${schedule.startDelay} minutes`,
      scheduledEndTime: schedule.endTime,
      actualEndTime: formatTime(now),
      earlyEnd: `${earlyEndMinutes} minutes`,
      scheduledDuration: `${schedule.scheduledDuration} minutes`,
      actualDuration: `${actualDurationMinutes} minutes`,
      durationDifference: `${Math.abs(durationDifference)} minutes ${
        durationDifference > 0 ? "shorter" : "longer"
      } than scheduled`,
    };

    return res.status(200).json({
      message: "Class ended successfully",
      schedule: {
        _id: schedule._id,
        classDate: formatDate(schedule.classDate),
        studentNames: schedule.studentNames,
        teacherName: schedule.teacherName,
        subjectName: schedule.subjectName,
        status: schedule.status,
        sessionStatus: schedule.sessionStatus,
      },
      timingSummary,
      statistics: {
        startDelay: schedule.startDelay,
        earlyEnd: earlyEndMinutes,
        scheduledDuration: schedule.scheduledDuration,
        actualDuration: actualDurationMinutes,
        durationDifference,
      },
    });
  } catch (error) {
    console.error("❌ Error in endClass:", error.stack);
    return res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};

exports.updateLessons = async (req, res) => {
  try {
    const { id } = req.params;
    const { lessons } = req.body;

    const allowedRoles = ["teacher_quran", "teacher_subjects"];
    if (!allowedRoles.includes(req.user.role)) {
      return res
        .status(403)
        .json({ message: "Access denied. Only teachers can update lessons." });
    }

    const invalidFields = Object.keys(req.body).filter(
      (key) => key !== "lessons"
    );
    if (invalidFields.length > 0) {
      return res.status(400).json({
        message: `Invalid field(s): ${invalidFields.join(
          ", "
        )}. Only 'lessons' can be updated.`,
      });
    }

    if (!Array.isArray(lessons)) {
      return res.status(400).json({ message: "Lessons must be an array" });
    }

    const teacher = await Teacher.findOne({ user: req.user.id });
    if (!teacher) {
      return res.status(404).json({ message: "Teacher not found" });
    }

    const schedule = await Schedule.findById(id);
    if (!schedule) {
      return res.status(404).json({ message: "Schedule not found" });
    }

    if (!schedule.classDate || !schedule.startTime || !schedule.endTime) {
      return res.status(400).json({
        message:
          "This is a recurring base template. You can only update lessons for scheduled classes.",
      });
    }

    if (!schedule.teacherAvailableAt) {
      return res.status(400).json({
        message: "You must mark yourself as available before updating lessons.",
      });
    }

    if (
      !schedule.teacherId ||
      schedule.teacherId.toString() !== teacher.user.toString()
    ) {
      return res
        .status(403)
        .json({ message: "You are not assigned to this schedule" });
    }

    const updatedLessons = lessons.map((lesson) => ({
      ...lesson,
      addedBy: req.user.id,
      addedAt: new Date(),
    }));

    schedule.lessons = updatedLessons;
    await schedule.save();

    return res.status(200).json({
      message: "Lessons updated successfully",
      lessons: schedule.lessons,
    });
  } catch (error) {
    console.error("❌ Error updating lessons:", error.stack);
    return res
      .status(500)
      .json({ message: "Server error", error: error.message });
  }
};

exports.getClientStudentLessonsBySubject = async (req, res) => {
  try {
    const clientUserId = req.user.id;

    if (req.user.role !== "client") {
      return res
        .status(403)
        .json({ message: "Only clients can access this resource." });
    }

    const { subjectId, studentUserId, scheduleId } = req.query;

    if (!subjectId || !mongoose.Types.ObjectId.isValid(subjectId)) {
      return res
        .status(400)
        .json({ message: "Valid subjectId query parameter is required." });
    }

    if (scheduleId && !mongoose.Types.ObjectId.isValid(scheduleId)) {
      return res.status(400).json({ message: "Invalid scheduleId format." });
    }

    const client = await Client.findOne({ user: clientUserId });
    if (!client) {
      return res.status(404).json({ message: "Client not found." });
    }

    let studentFilter;
    if (studentUserId) {
      if (!mongoose.Types.ObjectId.isValid(studentUserId)) {
        return res
          .status(400)
          .json({ message: "Invalid studentUserId format." });
      }

      const isStudentOfClient = client.students
        .map((id) => id.toString())
        .includes(studentUserId);

      if (!isStudentOfClient) {
        return res
          .status(403)
          .json({ message: "This student does not belong to your account." });
      }

      studentFilter = [studentUserId];
    } else {
      studentFilter = client.students.map((id) => id.toString());
    }

    const studentUsers = await User.find({
      _id: { $in: studentFilter },
    }).select("name");

    const studentNameMap = {};
    studentUsers.forEach((stu) => {
      studentNameMap[stu._id.toString()] = stu.name;
    });

    const scheduleFilter = {
      students: { $in: studentFilter },
      subject: subjectId,
      classDate: { $exists: true },
    };

    if (scheduleId) {
      scheduleFilter._id = scheduleId;
    }

    const schedules = await Schedule.find(scheduleFilter).select(
      "lessons subjectName subject students classDate"
    );

    if (!schedules.length) {
      return res
        .status(404)
        .json({ message: "No schedules found for the given filters." });
    }

    const filteredSchedules = schedules.filter(
      (schedule) => schedule.lessons && schedule.lessons.length > 0
    );

    const groupedLessons = filteredSchedules.map((schedule) => {
      const matchedStudents = schedule.students.filter((stu) =>
        studentFilter.includes(stu.toString())
      );

      const lessonItems = schedule.lessons.map((lesson) => ({
        title: lesson.title,
        description: lesson.description,
        status: lesson.status,
        classDate: formatDate(schedule.classDate),
        remarks: lesson.remarks,
        addedAt: lesson.addedAt,
      }));

      return {
        scheduleId: schedule._id,
        subjectId: schedule.subject,
        subjectName: schedule.subjectName || "Unknown",
        classDate: formatDate(schedule.classDate),
        students: matchedStudents.map((id) => ({
          _id: id,
          name: studentNameMap[id.toString()] || "Unknown",
        })),
        lessons: lessonItems,
      };
    });

    return res.status(200).json({
      totalSchedules: groupedLessons.length,
      groupedLessons,
    });
  } catch (error) {
    console.error("❌ Error fetching client student lessons:", error.stack);
    return res.status(500).json({
      message: "Server error while fetching lessons",
      error: error.message,
    });
  }
};

exports.getTeacherLessonsBySubject = async (req, res) => {
  try {
    const { subjectId, classDate } = req.query;
    const userId = req.user.id;

    if (!["teacher_quran", "teacher_subjects"].includes(req.user.role)) {
      return res
        .status(403)
        .json({ message: "Only teachers can access this resource." });
    }

    if (!subjectId) {
      return res
        .status(400)
        .json({ message: "subjectId query parameter is required." });
    }

    const teacher = await Teacher.findOne({ user: userId }).populate(
      "subjects"
    );
    if (!teacher) {
      return res.status(404).json({ message: "Teacher not found" });
    }

    const isSubjectAssigned = teacher.subjects.some(
      (subj) => subj._id.toString() === subjectId
    );

    if (!isSubjectAssigned) {
      return res.status(403).json({
        message: "You are not assigned to this subject. Access denied.",
      });
    }

    const filter = {
      teacherId: userId,
      subject: subjectId,
      classDate: { $exists: true },
    };

    if (classDate) {
      filter.classDate = new Date(classDate);
    }

    const schedules = await Schedule.find(filter).select(
      "lessons subjectName subject classDate startTime endTime"
    );

    if (!schedules.length) {
      return res
        .status(404)
        .json({ message: "No lessons found for this subject." });
    }

    let lessons = [];
    schedules.forEach((schedule) => {
      lessons.push(
        ...schedule.lessons.map((lesson) => ({
          title: lesson.title,
          description: lesson.description,
          status: lesson.status,
          remarks: lesson.remarks,
          addedAt: lesson.addedAt,
          classDate: formatDate(schedule.classDate),
          startTime: schedule.startTime,
          endTime: schedule.endTime,
        }))
      );
    });

    return res.status(200).json({
      subjectId,
      subjectName: schedules[0]?.subjectName || "Unknown Subject",
      totalLessons: lessons.length,
      lessons,
    });
  } catch (error) {
    console.error("❌ Error fetching teacher lessons by subject:", error.stack);
    return res.status(500).json({
      message: "Server error while fetching lessons",
      error: error.message,
    });
  }
};

exports.getSchedulesForAdmin = async (req, res) => {
  try {
    const role = req.user.role;
    const { subjectType, status, sessionStatus, startDate, endDate } =
      req.query;

    if (role !== "admin") {
      return res.status(403).json({
        message: "Only admin can access all schedules",
      });
    }

    const filter = { classDate: { $exists: true } };
    if (subjectType) filter.subjectType = subjectType;
    if (status) filter.status = status;
    if (sessionStatus) filter.sessionStatus = sessionStatus;
    if (startDate || endDate) {
      filter.classDate = filter.classDate || {};
      if (startDate) filter.classDate.$gte = new Date(startDate);
      if (endDate) {
        const to = new Date(endDate);
        to.setHours(23, 59, 59, 999);
        filter.classDate.$lte = to;
      }
    }

    const schedules = await Schedule.find(filter)
      .sort({ classDate: 1, startTime: 1 })
      .lean();

    const sessionStatusCounts = {
      pending: 0,
      available: 0,
      in_progress: 0,
      completed: 0,
    };

    const scheduleIds = schedules.map((s) => s._id);
    const studentUserIds = [
      ...new Set(
        schedules.flatMap((s) => s.students.map((id) => id.toString()))
      ),
    ];

    const attendanceRecords = await StudentAttendance.find({
      schedule: { $in: scheduleIds },
    }).lean();

    const attendanceMap = {};
    attendanceRecords.forEach((rec) => {
      attendanceMap[`${rec.schedule.toString()}-${rec.user.toString()}`] = rec;
    });

    const students = await Student.find({
      user: { $in: studentUserIds },
    })
      .populate("user", "name isActive")
      .populate("client", "name isActive")
      .lean();

    const clientUserIds = [
      ...new Set(
        students.map((st) => st.client?._id?.toString()).filter(Boolean)
      ),
    ];

    const clientDocs = await Client.find({
      user: { $in: clientUserIds },
    })
      .select("user clientId clientName")
      .lean();

    const clientLookup = {};
    clientDocs.forEach((c) => {
      clientLookup[c.user.toString()] = {
        clientId: c.clientId,
        clientName: c.clientName,
      };
    });

    const studentDetailsMap = {};
    students.forEach((st) => {
      const uid = st.user._id.toString();
      const clientUserId = st.client?._id?.toString();
      const clientInfo = clientLookup[clientUserId] || {};

      studentDetailsMap[uid] = {
        name: st.user.name || "Unknown",
        isActive: st.user?.isActive === true,
        clientName: clientInfo.clientName || st.clientName || "Unknown",
        clientId: clientInfo.clientId || "Unknown",
        clientIsActive: st.client?.isActive === true,
      };
    });

    const enrichedSchedules = schedules.map((schedule) => {
      if (
        schedule.sessionStatus &&
        sessionStatusCounts[schedule.sessionStatus] !== undefined
      ) {
        sessionStatusCounts[schedule.sessionStatus]++;
      }

      const studentAttendances = schedule.students.map((studentId) => {
        const sid = studentId.toString();
        const key = `${schedule._id.toString()}-${sid}`;
        const record = attendanceMap[key];
        const det = studentDetailsMap[sid] || {
          name: "Unknown",
          isActive: true,
          clientName: "Unknown",
          clientId: "Unknown",
          clientIsActive: true,
        };

        return {
          studentId: sid,
          studentName: det.name,
          studentIsActive: det.isActive,
          clientName: det.clientName,
          clientId: det.clientId,
          clientIsActive: det.clientIsActive,
          status: record ? record.status : "pending",
          remarks: record ? record.remarks : "",
          markedBy: record ? record.markedByName : "",
          markedAt: record ? record.createdAt : null,
        };
      });

      return {
        ...schedule,
        studentAttendances,
      };
    });

    const activeStudentsCount = Object.values(studentDetailsMap).filter(
      (s) => s.isActive
    ).length;
    const inactiveStudentsCount = Object.values(studentDetailsMap).filter(
      (s) => !s.isActive
    ).length;
    const activeClientsCount = Object.values(studentDetailsMap).filter(
      (s) => s.clientIsActive
    ).length;
    const inactiveClientsCount = Object.values(studentDetailsMap).filter(
      (s) => !s.clientIsActive
    ).length;

    return res.status(200).json({
      total: enrichedSchedules.length,
      sessionStatusCounts,
      schedules: enrichedSchedules,
      summary: {
        activeStudents: activeStudentsCount,
        inactiveStudents: inactiveStudentsCount,
        activeClients: activeClientsCount,
        inactiveClients: inactiveClientsCount,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error(
      "❌ Error fetching admin schedules by hammas-coding at 2025-06-18 06:27:23:",
      err
    );
    return res.status(500).json({
      message: "Server error while fetching schedules",
      error: err.message,
    });
  }
};

exports.getAllStudentLessonsForAdmin = async (req, res) => {
  try {
    const { role } = req.user;

    if (role !== "admin") {
      return res
        .status(403)
        .json({ message: "Only admins can access this resource." });
    }

    const students = await Student.find({})
      .populate("user", "name isActive")
      .populate("client", "name isActive")
      .lean();

    const studentUserIds = students.map((s) => s.user._id.toString());

    const schedules = await Schedule.find({
      students: { $in: studentUserIds },
      classDate: { $exists: true },
    })
      .select(
        "students studentNames teacherName teacherId subjectName subject subjectType lessons classDate"
      )
      .lean();

    const studentInfoMap = {};
    students.forEach((s) => {
      studentInfoMap[s.user._id.toString()] = {
        studentDbId: s._id,
        studentId: s.studentId || "",
        studentStatus: s.status || "",
        studentName: s.user.name || "",
        studentIsActive: s.user?.isActive === true,
        clientName: s.clientName || s.client?.name || "Unknown",
        clientUserId: s.client?._id || "Unknown",
        clientIsActive: s.client?.isActive === true,
      };
    });

    const studentSubjectLessonsMap = new Map();

    for (const schedule of schedules) {
      for (const student of schedule.students) {
        const stuUserId = student.toString();
        if (!studentInfoMap[stuUserId]) continue;

        const info = studentInfoMap[stuUserId];
        const key = `${stuUserId}-${schedule.subject}`;

        if (!studentSubjectLessonsMap.has(key)) {
          studentSubjectLessonsMap.set(key, {
            studentDbId: info.studentDbId,
            studentId: info.studentId,
            studentUserId: stuUserId,
            studentStatus: info.studentStatus,
            studentName: info.studentName,
            studentIsActive: info.studentIsActive,
            clientName: info.clientName,
            clientUserId: info.clientUserId,
            clientIsActive: info.clientIsActive,
            subjectType: schedule.subjectType || "N/A",
            subjectId: schedule.subject,
            subjectName: schedule.subjectName,
            teacherName: schedule.teacherName,
            lessons: [],
            schedules: [],
          });
        }

        const entry = studentSubjectLessonsMap.get(key);

        entry.schedules.push({
          scheduleId: schedule._id,
          classDate: schedule.classDate,
          teacherName: schedule.teacherName,
        });

        if (schedule.lessons && schedule.lessons.length > 0) {
          entry.lessons.push(
            ...schedule.lessons.map((lesson) => ({
              ...lesson,
              classDate: schedule.classDate,
              teacherName: schedule.teacherName,
            }))
          );
        }
      }
    }

    const groupedLessons = Array.from(studentSubjectLessonsMap.values());

    const summary = {
      total: groupedLessons.length,
      activeStudents: groupedLessons.filter((item) => item.studentIsActive)
        .length,
      inactiveStudents: groupedLessons.filter((item) => !item.studentIsActive)
        .length,
      activeClients: groupedLessons.filter((item) => item.clientIsActive)
        .length,
      inactiveClients: groupedLessons.filter((item) => !item.clientIsActive)
        .length,
    };

    return res.status(200).json({
      total: groupedLessons.length,
      data: groupedLessons,
      summary,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error(
      "❌ Error fetching admin student lessons by hammas-coding at 2025-06-18 06:13:42:",
      error.stack
    );
    return res.status(500).json({
      message: "Server error while fetching lessons",
      error: error.message,
    });
  }
};

exports.getAllStudentLessonsForSupervisor = async (req, res) => {
  try {
    const { role, id: supervisorId } = req.user;

    if (!["supervisor_quran", "supervisor_subjects"].includes(role)) {
      return res
        .status(403)
        .json({ message: "Only supervisors can access this resource." });
    }

    const department = role.split("_")[1];

    const managedTeachers = await Teacher.find({
      manager: supervisorId,
      department,
    }).select("user");

    if (managedTeachers.length === 0) {
      return res.status(200).json({
        total: 0,
        summary: {
          totalStudents: 0,
          totalLessons: 0,
          averageLessonsPerStudent: 0,
          activeStudents: 0,
          inactiveStudents: 0,
          activeClients: 0,
          inactiveClients: 0,
        },
        data: [],
        message: "No teachers are managed by this supervisor",
      });
    }

    const managedTeacherUserIds = managedTeachers.map((teacher) =>
      teacher.user.toString()
    );

    const schedules = await Schedule.find({
      subjectType: department,
      teacherId: { $in: managedTeacherUserIds },
      classDate: { $exists: true },
    })
      .select(
        "students studentNames teacherName teacherId subjectName subject subjectType lessons classDate startTime endTime status sessionStatus"
      )
      .lean();

    if (schedules.length === 0) {
      return res.status(200).json({
        total: 0,
        summary: {
          totalStudents: 0,
          totalLessons: 0,
          averageLessonsPerStudent: 0,
          activeStudents: 0,
          inactiveStudents: 0,
          activeClients: 0,
          inactiveClients: 0,
        },
        data: [],
        message: "No schedules found for teachers managed by this supervisor",
      });
    }

    const studentUserIds = [
      ...new Set(
        schedules.flatMap((schedule) =>
          schedule.students.map((student) => student.toString())
        )
      ),
    ];

    const students = await Student.find({
      user: { $in: studentUserIds },
    })
      .populate("user", "name isActive")
      .populate("client", "name isActive")
      .select("studentId status user client")
      .lean();

    const studentInfoMap = {};
    students.forEach((s) => {
      studentInfoMap[s.user._id.toString()] = {
        studentDbId: s._id,
        studentId: s.studentId || "",
        studentStatus: s.status || "",
        studentName: s.user.name || "",
        studentIsActive: s.user?.isActive === true,
        clientName: s.client?.name || "Unknown",
        clientUserId: s.client?._id || "Unknown",
        clientIsActive: s.client?.isActive === true,
      };
    });

    const studentsWithAssignedTeachers = await Student.find({
      "assignedTeachers.teacher._id": { $in: managedTeacherUserIds },
    })
      .select("user assignedTeachers")
      .lean();

    const studentWithValidTeachers = new Set(
      studentsWithAssignedTeachers.map((s) => s.user.toString())
    );

    const studentSubjectLessonsMap = new Map();

    for (const schedule of schedules) {
      const teacherId = schedule.teacherId.toString();
      if (!managedTeacherUserIds.includes(teacherId)) {
        continue;
      }

      for (const student of schedule.students) {
        const stuUserId = student.toString();
        if (
          !studentInfoMap[stuUserId] ||
          !studentWithValidTeachers.has(stuUserId)
        ) {
          continue;
        }

        const info = studentInfoMap[stuUserId];
        const key = `${stuUserId}-${schedule.subject}`;

        if (!studentSubjectLessonsMap.has(key)) {
          studentSubjectLessonsMap.set(key, {
            studentDbId: info.studentDbId,
            studentId: info.studentId,
            studentUserId: stuUserId,
            studentStatus: info.studentStatus,
            studentName: info.studentName,
            studentIsActive: info.studentIsActive,
            clientName: info.clientName,
            clientUserId: info.clientUserId,
            clientIsActive: info.clientIsActive,
            subjectType: schedule.subjectType || "N/A",
            subjectId: schedule.subject,
            subjectName: schedule.subjectName,
            teacherName: schedule.teacherName,
            lessons: [],
            schedules: [],
            stats: {
              totalLessons: 0,
              completedLessons: 0,
              lastLessonDate: null,
            },
          });
        }

        const entry = studentSubjectLessonsMap.get(key);

        entry.schedules.push({
          scheduleId: schedule._id,
          classDate: schedule.classDate,
          startTime: schedule.startTime,
          endTime: schedule.endTime,
          status: schedule.status,
          sessionStatus: schedule.sessionStatus,
          teacherName: schedule.teacherName,
        });

        if (schedule.lessons && schedule.lessons.length > 0) {
          const formattedLessons = schedule.lessons.map((lesson) => ({
            ...lesson,
            classDate: schedule.classDate,
            teacherName: schedule.teacherName,
            startTime: schedule.startTime,
            endTime: schedule.endTime,
          }));

          entry.lessons.push(...formattedLessons);
          entry.stats.totalLessons += formattedLessons.length;

          entry.stats.completedLessons += formattedLessons.filter(
            (lesson) => lesson.status === "completed"
          ).length;

          const scheduleDate = new Date(schedule.classDate);
          if (
            !entry.stats.lastLessonDate ||
            scheduleDate > entry.stats.lastLessonDate
          ) {
            entry.stats.lastLessonDate = scheduleDate;
          }
        }
      }
    }

    const groupedLessons = Array.from(studentSubjectLessonsMap.values()).sort(
      (a, b) => a.studentName.localeCompare(b.studentName)
    );

    const summary = {
      totalStudents: groupedLessons.length,
      totalLessons: groupedLessons.reduce(
        (sum, entry) => sum + entry.stats.totalLessons,
        0
      ),
      completedLessons: groupedLessons.reduce(
        (sum, entry) => sum + entry.stats.completedLessons,
        0
      ),
      averageLessonsPerStudent:
        groupedLessons.length > 0
          ? (
              groupedLessons.reduce(
                (sum, entry) => sum + entry.stats.totalLessons,
                0
              ) / groupedLessons.length
            ).toFixed(1)
          : 0,
      activeStudents: groupedLessons.filter((item) => item.studentIsActive)
        .length,
      inactiveStudents: groupedLessons.filter((item) => !item.studentIsActive)
        .length,
      activeClients: groupedLessons.filter((item) => item.clientIsActive)
        .length,
      inactiveClients: groupedLessons.filter((item) => !item.clientIsActive)
        .length,
    };

    return res.status(200).json({
      total: groupedLessons.length,
      summary,
      data: groupedLessons,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error(
      "❌ Error fetching supervisor student lessons by hammas-coding at 2025-06-18 09:30:45:",
      error.stack
    );
    return res.status(500).json({
      message: "Server error while fetching lessons",
      error: error.message,
    });
  }
};

exports.getTeacherStudentLessons = async (req, res) => {
  try {
    const teacherId = req.user.id;
    const { studentId, subjectId } = req.params;

    if (!studentId || !subjectId) {
      return res.status(400).json({
        success: false,
        message: "Student ID and Subject ID are required",
      });
    }

    const mongoose = require("mongoose");
    let teacherObjId = teacherId;
    let studentObjId = studentId;
    let subjectObjId = subjectId;

    if (
      mongoose.Types.ObjectId.isValid(teacherId) &&
      typeof teacherId === "string"
    ) {
      teacherObjId = new mongoose.Types.ObjectId(teacherId);
    }
    if (
      mongoose.Types.ObjectId.isValid(studentId) &&
      typeof studentId === "string"
    ) {
      studentObjId = new mongoose.Types.ObjectId(studentId);
    }
    if (
      mongoose.Types.ObjectId.isValid(subjectId) &&
      typeof subjectId === "string"
    ) {
      subjectObjId = new mongoose.Types.ObjectId(subjectId);
    }

    const schedules = await Schedule.find({
      teacherId: teacherObjId,
      subject: subjectObjId,
      students: { $elemMatch: { $eq: studentObjId } },
      lessons: { $exists: true, $not: { $size: 0 } },
    })
      .select(
        "students studentNames lessons classDate startTime endTime teacherName subjectName"
      )
      .lean();

    if (schedules.length === 0) {
      const byTeacherCount = await Schedule.countDocuments({
        teacherId: teacherObjId,
      });
      const bySubjectCount = await Schedule.countDocuments({
        subject: subjectObjId,
      });
      const byStudentCount = await Schedule.countDocuments({
        students: { $elemMatch: { $eq: studentObjId } },
      });
      const withLessonsCount = await Schedule.countDocuments({
        "lessons.0": { $exists: true },
      });

      return res.status(200).json({
        success: true,
        message: "No lessons found for this combination",
        data: {
          lessons: [],
          totalLessons: 0,
        },
      });
    }

    let allLessons = [];
    schedules.forEach((schedule) => {
      if (schedule.lessons && schedule.lessons.length > 0) {
        const studentIndex = schedule.students.findIndex(
          (id) => id.toString() === studentObjId.toString()
        );

        const studentName =
          studentIndex !== -1
            ? schedule.studentNames[studentIndex]
            : "Unknown Student";

        const lessonsWithDetails = schedule.lessons.map((lesson) => ({
          ...lesson,
          classDate: schedule.classDate,
          startTime: schedule.startTime,
          endTime: schedule.endTime,
          teacherName: schedule.teacherName,
          subjectName: schedule.subjectName,
          studentName: studentName,
        }));
        allLessons.push(...lessonsWithDetails);
      }
    });

    allLessons.sort((a, b) => new Date(b.classDate) - new Date(a.classDate));

    return res.status(200).json({
      success: true,
      data: {
        teacherId: teacherObjId,
        studentId: studentObjId,
        subjectId: subjectObjId,
        teacherName: schedules[0]?.teacherName || "Unknown Teacher",
        studentName:
          schedules[0]?.studentNames?.[
            schedules[0]?.students?.findIndex(
              (id) => id.toString() === studentObjId.toString()
            )
          ] || "Unknown Student",
        subjectName: schedules[0]?.subjectName || "Unknown Subject",
        totalLessons: allLessons.length,
        lessons: allLessons,
      },
    });
  } catch (error) {
    console.error("Error in getTeacherStudentLessons:", error);
    return res.status(500).json({
      success: false,
      message: "Error fetching lessons",
      error: error.message,
    });
  }
};

exports.getClientStudentLessons = async (req, res) => {
  try {
    const clientId = req.user.id;
    const { studentId, teacherId, subjectId } = req.params;

    if (!studentId || !teacherId || !subjectId) {
      return res.status(400).json({
        success: false,
        message: "Student ID, Teacher ID and Subject ID are required",
      });
    }

    const client = await User.findOne({
      _id: clientId,
      role: "client",
    });

    if (!client) {
      return res.status(403).json({
        success: false,
        message: "Only clients can access this resource",
      });
    }

    const mongoose = require("mongoose");
    let teacherObjId = teacherId;
    let studentObjId = studentId;
    let subjectObjId = subjectId;

    if (
      mongoose.Types.ObjectId.isValid(teacherId) &&
      typeof teacherId === "string"
    ) {
      teacherObjId = new mongoose.Types.ObjectId(teacherId);
    }
    if (
      mongoose.Types.ObjectId.isValid(studentId) &&
      typeof studentId === "string"
    ) {
      studentObjId = new mongoose.Types.ObjectId(studentId);
    }
    if (
      mongoose.Types.ObjectId.isValid(subjectId) &&
      typeof subjectId === "string"
    ) {
      subjectObjId = new mongoose.Types.ObjectId(subjectId);
    }

    const schedules = await Schedule.find({
      teacherId: teacherObjId,
      subject: subjectObjId,
      students: { $elemMatch: { $eq: studentObjId } },
      lessons: { $exists: true, $not: { $size: 0 } },
    })
      .select(
        "students studentNames lessons classDate startTime endTime teacherName subjectName"
      )
      .lean();

    if (schedules.length === 0) {
      return res.status(200).json({
        success: true,
        message: "No lessons found for this combination",
        data: {
          lessons: [],
          totalLessons: 0,
        },
      });
    }

    let allLessons = [];
    schedules.forEach((schedule) => {
      if (schedule.lessons && schedule.lessons.length > 0) {
        const studentIndex = schedule.students.findIndex(
          (id) => id.toString() === studentObjId.toString()
        );

        const studentName =
          studentIndex !== -1
            ? schedule.studentNames[studentIndex]
            : "Unknown Student";

        const lessonsWithDetails = schedule.lessons.map((lesson) => ({
          ...lesson,
          classDate: schedule.classDate,
          startTime: schedule.startTime,
          endTime: schedule.endTime,
          teacherName: schedule.teacherName,
          subjectName: schedule.subjectName,
          studentName: studentName,
        }));
        allLessons.push(...lessonsWithDetails);
      }
    });

    allLessons.sort((a, b) => new Date(b.classDate) - new Date(a.classDate));

    return res.status(200).json({
      success: true,
      data: {
        teacherId: teacherObjId,
        studentId: studentObjId,
        subjectId: subjectObjId,
        teacherName: schedules[0]?.teacherName || "Unknown Teacher",
        studentName:
          schedules[0]?.studentNames?.[
            schedules[0]?.students?.findIndex(
              (id) => id.toString() === studentObjId.toString()
            )
          ] || "Unknown Student",
        subjectName: schedules[0]?.subjectName || "Unknown Subject",
        totalLessons: allLessons.length,
        lessons: allLessons,
      },
    });
  } catch (error) {
    console.error("Error in getClientStudentLessons:", error);
    return res.status(500).json({
      success: false,
      message: "Error fetching lessons",
      error: error.message,
    });
  }
};

exports.getScheduleById = async (req, res) => {
  try {
    const { id } = req.params;
    const userRole = req.user.role;

    if (!id) {
      return res.status(400).json({ message: "Schedule ID is required" });
    }

    const schedule = await Schedule.findById(id).lean();

    if (!schedule) {
      return res.status(404).json({ message: "Schedule not found" });
    }

    if (userRole === "client") {
      const client = await Client.findOne({ user: req.user.id });
      if (!client) {
        return res.status(404).json({ message: "Client not found" });
      }

      const hasAccess = schedule.students.some((studentId) =>
        client.students.includes(studentId)
      );

      if (!hasAccess) {
        return res.status(403).json({
          message: "You don't have access to this schedule",
        });
      }
    } else if (userRole.startsWith("teacher_")) {
      if (schedule.teacherId.toString() !== req.user.id) {
        return res.status(403).json({
          message: "You don't have access to this schedule",
        });
      }
    } else if (userRole.startsWith("supervisor_")) {
      const department = userRole.split("_")[1];
      if (schedule.subjectType !== department) {
        return res.status(403).json({
          message: "You don't have access to this schedule",
        });
      }
    } else if (userRole !== "admin") {
      return res.status(403).json({
        message: "Unauthorized access",
      });
    }

    const [studentAttendances, students] = await Promise.all([
      StudentAttendance.find({ schedule: id }).lean(),
      Student.find({
        user: { $in: schedule.students },
      })
        .populate("client", "name")
        .populate("user", "name")
        .lean(),
    ]);

    const attendanceMap = {};
    studentAttendances.forEach((record) => {
      attendanceMap[record.user.toString()] = {
        status: record.status,
        remarks: record.remarks,
        markedBy: record.markedByName,
        markedAt: record.createdAt,
      };
    });

    const studentDetailsMap = {};
    students.forEach((student) => {
      if (student.user) {
        studentDetailsMap[student.user._id.toString()] = {
          name: student.user.name || "Unknown",
          clientName: student.client?.name || "Unknown",
          studentId: student.studentId || "N/A",
        };
      }
    });

    const enrichedSchedule = {
      ...schedule,
      studentDetails: schedule.students.map((studentId) => {
        const studentIdStr = studentId.toString();
        const studentDetail = studentDetailsMap[studentIdStr] || {
          name: "Unknown",
          clientName: "Unknown",
          studentId: "N/A",
        };
        return {
          studentId: studentIdStr,
          name: studentDetail.name,
          clientName: studentDetail.clientName,
          customId: studentDetail.studentId,
          attendance: attendanceMap[studentIdStr] || {
            status: "not_marked",
            remarks: "",
            markedBy: null,
            markedAt: null,
          },
        };
      }),
    };

    return res.status(200).json({
      success: true,
      schedule: enrichedSchedule,
    });
  } catch (error) {
    console.error("❌ Error in getScheduleById:", error.stack);
    return res.status(500).json({
      message: "Server error while fetching schedule",
      error: error.message,
    });
  }
};

exports.getTodaysTimetableForAdmin = async (req, res) => {
  try {
    const role = req.user.role;

    if (role !== "admin") {
      return res.status(403).json({
        message: "Only admin can access timetable data",
      });
    }
    const { date } = req.query;
    let targetDate;
    if (date) {
      const parsedDate = new Date(date);
      if (isNaN(parsedDate.getTime())) {
        return res.status(400).json({
          message: "Invalid date format. Please use YYYY-MM-DD format.",
        });
      }
      targetDate = parsedDate;
    } else {
      targetDate = new Date();
    }
    targetDate.setHours(0, 0, 0, 0);
    const endOfTargetDate = new Date(targetDate);
    endOfTargetDate.setHours(23, 59, 59, 999);

    const filter = {
      classDate: {
        $gte: targetDate,
        $lte: endOfTargetDate,
      },
    };

    const schedules = await Schedule.find(filter)
      .populate("teacherId", "name isActive gender")
      .populate("subject", "name type")
      .sort({ startTime: 1, endTime: 1 })
      .lean();

    if (!schedules.length) {
      return res.status(200).json({
        message: `No schedules found for ${
          targetDate.toISOString().split("T")[0]
        }`,
        timetable: [],
        teachers: [],
        timeSlots: [],
        regions: [],
        summary: {
          totalSchedules: 0,
          totalTeachers: 0,
          activeSchedules: 0,
          completedSchedules: 0,
        },
        date: targetDate.toISOString().split("T")[0],
        duplicatesRemoved: 0,
        timestamp: new Date().toISOString(),
      });
    }

    const uniqueSchedules = removeDuplicateSchedules(schedules);

    const studentUserIds = [
      ...new Set(
        uniqueSchedules.flatMap((s) => s.students.map((id) => id.toString()))
      ),
    ];

    const students = await Student.find({
      user: { $in: studentUserIds },
    })
      .populate("user", "name isActive")
      .populate("client", "name isActive")
      .lean();

    const clientUserIds = [
      ...new Set(
        students.map((st) => st.client?._id?.toString()).filter(Boolean)
      ),
    ];

    const clientDocs = await Client.find({
      user: { $in: clientUserIds },
    })
      .select("user clientId clientName country state status shift")
      .lean();

    const clientLookup = {};
    clientDocs.forEach((c) => {
      clientLookup[c.user.toString()] = {
        clientId: c.clientId,
        clientName: c.clientName,
        country: c.country,
        state: c.state,
        status: c.status,
        shift: c.shift,
      };
    });

    const studentDetailsMap = {};
    students.forEach((st) => {
      const uid = st.user._id.toString();
      const clientUserId = st.client?._id?.toString();
      const clientInfo = clientLookup[clientUserId] || {};

      studentDetailsMap[uid] = {
        name: st.user.name || "Unknown",
        studentId: st.studentId,
        grade: st.grade || "N/A",
        isActive: st.user?.isActive === true,
        studentStatus: st.status,
        clientName: clientInfo.clientName || st.clientName || "Unknown",
        clientId: clientInfo.clientId || "Unknown",
        clientIsActive: st.client?.isActive === true,
        clientStatus: clientInfo.status || "unknown",
        clientShift: clientInfo.shift || "unknown",
        country: clientInfo.country || "Unknown",
        state: clientInfo.state || "Unknown",
      };
    });

    const scheduleIds = uniqueSchedules.map((s) => s._id);
    const attendanceRecords = await StudentAttendance.find({
      schedule: { $in: scheduleIds },
    }).lean();

    const attendanceMap = {};
    attendanceRecords.forEach((rec) => {
      attendanceMap[`${rec.schedule.toString()}-${rec.user.toString()}`] = rec;
    });

    const timetableData = uniqueSchedules.map((schedule) => {
      const teacher = {
        id: schedule.teacherId?._id,
        name:
          schedule.teacherId?.name || schedule.teacherName || "Unknown Teacher",
        gender: schedule.teacherId?.gender || "Unknown",
        isActive: schedule.teacherId?.isActive === true,
        timeSlot: `${schedule.startTime} to ${schedule.endTime}`,
      };

      const classPattern = getClassPatternInfo(schedule);
      const studentAttendances = schedule.students.map((studentId) => {
        const sid = studentId.toString();
        const key = `${schedule._id.toString()}-${sid}`;
        const record = attendanceMap[key];
        const studentInfo = studentDetailsMap[sid] || {
          name: "Unknown",
          studentId: "Unknown",
          grade: "N/A",
          isActive: true,
          studentStatus: "unknown",
          clientName: "Unknown",
          clientId: "Unknown",
          clientIsActive: true,
          clientStatus: "unknown",
          clientShift: "unknown",
          country: "Unknown",
          state: "Unknown",
        };

        return {
          studentId: sid,
          studentName: studentInfo.name,
          studentNumber: studentInfo.studentId,
          studentGrade: studentInfo.grade,
          studentIsActive: studentInfo.isActive,
          studentStatus: studentInfo.studentStatus,
          clientName: studentInfo.clientName,
          clientId: studentInfo.clientId,
          clientIsActive: studentInfo.clientIsActive,
          clientStatus: studentInfo.clientStatus,
          clientShift: studentInfo.clientShift,
          country: studentInfo.country,
          state: studentInfo.state,
          displayText: `${studentInfo.clientName} (${studentInfo.clientId})`,
          regionInfo: `${studentInfo.country}, ${studentInfo.state}`,
          statusIndicators: getStatusIndicators(studentInfo),
          status: record ? record.status : "pending",
          remarks: record ? record.remarks : "",
          markedBy: record ? record.markedByName : "",
          markedAt: record ? record.createdAt : null,
        };
      });

      return {
        scheduleId: schedule._id,
        teacher: teacher,
        subject: {
          name:
            schedule.subject?.name || schedule.subjectName || "Unknown Subject",
          type: schedule.subject?.type || schedule.subjectType || "Unknown",
        },
        timeSlot: teacher.timeSlot,
        startTime: schedule.startTime,
        endTime: schedule.endTime,
        day: schedule.day,
        sessionStatus: schedule.sessionStatus,
        status: schedule.status,
        studentAttendances: studentAttendances,
        classDate: schedule.classDate,
        isRecurring: schedule.isRecurring,
        recurrencePattern: schedule.recurrencePattern,
        classPattern: classPattern,
        studentsByRegion: groupStudentsByRegion(studentAttendances),
      };
    });

    const teachers = [
      ...new Set(
        timetableData.map((item) => `${item.teacher.name} (${item.timeSlot})`)
      ),
    ];

    const timeSlots = [...new Set(timetableData.map((item) => item.timeSlot))];

    const regions = [
      ...new Set(
        timetableData.flatMap((item) =>
          item.studentAttendances.map((student) => student.regionInfo)
        )
      ),
    ].filter((region) => region !== "Unknown, Unknown");

    const summary = calculateSummaryWithStatus(timetableData);

    return res.status(200).json({
      success: true,
      message: `Timetable data retrieved successfully for ${
        targetDate.toISOString().split("T")[0]
      }`,
      timetable: timetableData,
      teachers: teachers,
      timeSlots: timeSlots,
      regions: regions,
      summary: summary,
      date: targetDate.toISOString().split("T")[0],
      duplicatesRemoved: schedules.length - uniqueSchedules.length,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error("❌ Error fetching timetable data:", err);
    return res.status(500).json({
      message: "Server error while fetching timetable data",
      error: err.message,
    });
  }
};

function getClassPatternInfo(schedule) {
  const pattern = {
    isRecurring: schedule.isRecurring || false,
    recurrencePattern: schedule.recurrencePattern || "weekly",
    customDays: schedule.customDays || [],
    displayText: "One-time",
    shortText: "Once",
  };

  if (schedule.isRecurring) {
    switch (schedule.recurrencePattern) {
      case "weekly":
        pattern.displayText = "Weekly";
        pattern.shortText = "Weekly";
        break;
      case "weekdays":
        pattern.displayText = "Weekdays (Mon-Fri)";
        pattern.shortText = "Weekdays";
        break;
      case "custom":
        if (schedule.customDays && schedule.customDays.length > 0) {
          const dayAbbreviations = {
            Monday: "Mon",
            Tuesday: "Tue",
            Wednesday: "Wed",
            Thursday: "Thu",
            Friday: "Fri",
            Saturday: "Sat",
            Sunday: "Sun",
          };

          const customDaysShort = schedule.customDays
            .map((day) => dayAbbreviations[day] || day.substring(0, 3))
            .join(", ");

          pattern.displayText = `Custom Days (${schedule.customDays.join(
            ", "
          )})`;
          pattern.shortText = customDaysShort;
        } else {
          pattern.displayText = "Custom Pattern";
          pattern.shortText = "Custom";
        }
        break;
      default:
        pattern.displayText = "Recurring";
        pattern.shortText = "Recurring";
    }
  }

  return pattern;
}

function removeDuplicateSchedules(schedules) {
  const uniqueMap = new Map();

  schedules.forEach((schedule) => {
    const studentIds = schedule.students
      .map((id) => id.toString())
      .sort()
      .join(",");
    const key = `${schedule.teacherId}-${schedule.startTime}-${schedule.endTime}-${studentIds}`;

    if (!uniqueMap.has(key)) {
      uniqueMap.set(key, schedule);
    }
  });

  return Array.from(uniqueMap.values());
}

function getStatusIndicators(studentInfo) {
  const indicators = {
    clientStatus: studentInfo.clientStatus,
    studentStatus: studentInfo.studentStatus,
    clientShift: studentInfo.clientShift,
    isStudentActive: studentInfo.isActive,
    isClientActive: studentInfo.clientIsActive,
    warnings: [],
  };

  if (studentInfo.clientStatus === "trial") {
    indicators.warnings.push("Trial Client");
  }
  if (studentInfo.clientStatus === "freeze") {
    indicators.warnings.push("Frozen Client");
  }
  if (studentInfo.clientStatus === "drop") {
    indicators.warnings.push("Dropped Client");
  }
  if (!studentInfo.isActive) {
    indicators.warnings.push("Inactive Student");
  }
  if (!studentInfo.clientIsActive) {
    indicators.warnings.push("Inactive Client");
  }

  return indicators;
}

function groupStudentsByRegion(studentAttendances) {
  const grouped = {};

  studentAttendances.forEach((student) => {
    const region = student.regionInfo;
    if (!grouped[region]) {
      grouped[region] = [];
    }
    grouped[region].push({
      displayText: student.displayText,
      studentName: student.studentName,
      studentGrade: student.studentGrade,
      clientName: student.clientName,
      clientId: student.clientId,
      clientStatus: student.clientStatus,
      studentStatus: student.studentStatus,
      clientShift: student.clientShift,
      statusIndicators: student.statusIndicators,
      status: student.status,
      isActive: student.studentIsActive && student.clientIsActive,
    });
  });

  return grouped;
}

function calculateSummaryWithStatus(timetableData) {
  const allStudents = timetableData.flatMap((item) => item.studentAttendances);

  const clientStatusBreakdown = {
    regular: 0,
    trial: 0,
    freeze: 0,
    drop: 0,
    completed: 0,
    unknown: 0,
  };

  const studentStatusBreakdown = {
    regular: 0,
    trial: 0,
    freeze: 0,
    drop: 0,
    completed: 0,
    unknown: 0,
  };

  const shiftBreakdown = {
    morning: 0,
    night: 0,
    unknown: 0,
  };

  const gradeBreakdown = {};

  const patternBreakdown = {
    oneTime: 0,
    weekly: 0,
    weekdays: 0,
    custom: 0,
  };

  allStudents.forEach((student) => {
    if (clientStatusBreakdown[student.clientStatus] !== undefined) {
      clientStatusBreakdown[student.clientStatus]++;
    } else {
      clientStatusBreakdown.unknown++;
    }

    if (studentStatusBreakdown[student.studentStatus] !== undefined) {
      studentStatusBreakdown[student.studentStatus]++;
    } else {
      studentStatusBreakdown.unknown++;
    }

    if (shiftBreakdown[student.clientShift] !== undefined) {
      shiftBreakdown[student.clientShift]++;
    } else {
      shiftBreakdown.unknown++;
    }

    const grade = student.studentGrade || "N/A";
    gradeBreakdown[grade] = (gradeBreakdown[grade] || 0) + 1;
  });

  timetableData.forEach((item) => {
    if (!item.isRecurring) {
      patternBreakdown.oneTime++;
    } else {
      switch (item.recurrencePattern) {
        case "weekly":
          patternBreakdown.weekly++;
          break;
        case "weekdays":
          patternBreakdown.weekdays++;
          break;
        case "custom":
          patternBreakdown.custom++;
          break;
        default:
          patternBreakdown.oneTime++;
      }
    }
  });

  return {
    totalSchedules: timetableData.length,
    totalTeachers: [...new Set(timetableData.map((item) => item.teacher.name))]
      .length,
    totalStudents: allStudents.length,
    activeSchedules: timetableData.filter(
      (item) => item.sessionStatus === "in_progress"
    ).length,
    completedSchedules: timetableData.filter(
      (item) => item.sessionStatus === "completed"
    ).length,
    pendingSchedules: timetableData.filter(
      (item) => item.sessionStatus === "pending"
    ).length,
    recurringSchedules: timetableData.filter((item) => item.isRecurring).length,
    clientStatusBreakdown: clientStatusBreakdown,
    studentStatusBreakdown: studentStatusBreakdown,
    shiftBreakdown: shiftBreakdown,
    gradeBreakdown: gradeBreakdown,
    patternBreakdown: patternBreakdown,
    activeStudents: allStudents.filter(
      (s) => s.studentIsActive && s.clientIsActive
    ).length,
    inactiveStudents: allStudents.filter(
      (s) => !s.studentIsActive || !s.clientIsActive
    ).length,
  };
}

const calculateSummaryWithStatusForSupervisor = (timetableData) => {
  const summary = {
    totalSchedules: timetableData.length,
    totalTeachers: 0,
    totalStudents: 0,
    activeSchedules: 0,
    completedSchedules: 0,
    pendingSchedules: 0,
    recurringSchedules: 0,
    activeStudents: 0,
    inactiveStudents: 0,
    activeTeachers: 0,
    inactiveTeachers: 0,
    byRegion: {},
    byStatus: {},
    byTeacherStatus: {},
  };

  const uniqueTeachers = new Set();
  const uniqueStudents = new Set();

  timetableData.forEach((schedule) => {
    const teacherKey = `${schedule.teacher.name}-${schedule.timeSlot}`;
    uniqueTeachers.add(teacherKey);

    switch (schedule.sessionStatus) {
      case "completed":
        summary.completedSchedules++;
        break;
      case "in_progress":
      case "available":
        summary.activeSchedules++;
        break;
      default:
        summary.pendingSchedules++;
    }

    if (schedule.isRecurring) {
      summary.recurringSchedules++;
    }

    if (schedule.isTeacherActive) {
      summary.activeTeachers++;
    } else {
      summary.inactiveTeachers++;
    }

    schedule.studentAttendances.forEach((student) => {
      const studentKey = `${student.studentId}-${student.studentName}`;
      uniqueStudents.add(studentKey);

      if (student.studentIsActive && student.clientIsActive) {
        summary.activeStudents++;
      } else {
        summary.inactiveStudents++;
      }

      const region = student.regionInfo;
      if (region && region !== "Unknown, Unknown") {
        summary.byRegion[region] = (summary.byRegion[region] || 0) + 1;
      }

      const status = student.status || "pending";
      summary.byStatus[status] = (summary.byStatus[status] || 0) + 1;
    });

    const teacherStatus = schedule.teacherStatus || "unknown";
    summary.byTeacherStatus[teacherStatus] =
      (summary.byTeacherStatus[teacherStatus] || 0) + 1;
  });

  summary.totalTeachers = uniqueTeachers.size;
  summary.totalStudents = uniqueStudents.size;

  return summary;
};

exports.getTodaysTimetableForSupervisor = async (req, res) => {
  try {
    const userId = req.user.id;
    const role = req.user.role;

    if (!["supervisor_quran", "supervisor_subjects"].includes(role)) {
      return res.status(403).json({
        message: "Only supervisors can access timetable data",
      });
    }

    const { date } = req.query;
    let targetDate;
    if (date) {
      const parsedDate = new Date(date);
      if (isNaN(parsedDate.getTime())) {
        return res.status(400).json({
          message: "Invalid date format. Please use YYYY-MM-DD format.",
        });
      }
      targetDate = parsedDate;
    } else {
      targetDate = new Date();
    }
    targetDate.setHours(0, 0, 0, 0);
    const endOfTargetDate = new Date(targetDate);
    endOfTargetDate.setHours(23, 59, 59, 999);

    const department = role.split("_")[1];

    let managedTeacherIds = [];
    let managedTeacherNames = [];

    if (role === "supervisor_quran") {
      const managedTeachers = await Teacher.find({
        department: "quran",
        manager: userId,
      })
        .populate("user", "name")
        .select("user")
        .lean();

      managedTeacherIds = managedTeachers.map((t) => t.user._id.toString());
      managedTeacherNames = managedTeachers.map((t) => t.user.name);
    } else if (role === "supervisor_subjects") {
      const managedTeachers = await Teacher.find({
        department: "subjects",
        manager: userId,
      })
        .populate("user", "name")
        .select("user")
        .lean();

      managedTeacherIds = managedTeachers.map((t) => t.user._id.toString());
      managedTeacherNames = managedTeachers.map((t) => t.user.name);
    }

    if (managedTeacherIds.length === 0) {
      return res.status(200).json({
        success: true,
        message: `No managed teachers found for supervisor in ${department} department`,
        timetable: [],
        teachers: [],
        timeSlots: [],
        regions: [],
        summary: {
          totalSchedules: 0,
          totalTeachers: 0,
          totalStudents: 0,
          activeSchedules: 0,
          completedSchedules: 0,
          pendingSchedules: 0,
          recurringSchedules: 0,
          activeStudents: 0,
          inactiveStudents: 0,
        },
        date: targetDate.toISOString().split("T")[0],
        duplicatesRemoved: 0,
        managedTeachers: managedTeacherNames,
        department: department,
        timestamp: new Date().toISOString(),
      });
    }

    const filter = {
      classDate: {
        $gte: targetDate,
        $lte: endOfTargetDate,
      },
      subjectType: department,
      $or: [
        { teacherId: { $in: managedTeacherIds } },
        {
          teacherId: null,
          teacherName: {
            $in: managedTeacherNames.map(
              (name) => new RegExp(`${name} \\(Inactive Teacher\\)`)
            ),
          },
        },
      ],
    };

    const schedules = await Schedule.find(filter)
      .populate("teacherId", "name isActive")
      .populate("subject", "name type")
      .sort({ startTime: 1, endTime: 1 })
      .lean();

    if (!schedules.length) {
      return res.status(200).json({
        success: true,
        message: `No schedules found for ${
          targetDate.toISOString().split("T")[0]
        } in ${department} department`,
        timetable: [],
        teachers: [],
        timeSlots: [],
        regions: [],
        summary: {
          totalSchedules: 0,
          totalTeachers: 0,
          totalStudents: 0,
          activeSchedules: 0,
          completedSchedules: 0,
          pendingSchedules: 0,
          recurringSchedules: 0,
          activeStudents: 0,
          inactiveStudents: 0,
        },
        date: targetDate.toISOString().split("T")[0],
        duplicatesRemoved: 0,
        managedTeachers: managedTeacherNames,
        department: department,
        timestamp: new Date().toISOString(),
      });
    }

    const uniqueSchedules = removeDuplicateSchedules(schedules);

    const studentUserIds = [
      ...new Set(
        uniqueSchedules.flatMap((s) => s.students.map((id) => id.toString()))
      ),
    ];

    const students = await Student.find({
      user: { $in: studentUserIds },
    })
      .populate("user", "name isActive")
      .populate("client", "name isActive")
      .lean();

    const clientUserIds = [
      ...new Set(
        students.map((st) => st.client?._id?.toString()).filter(Boolean)
      ),
    ];

    const clientDocs = await Client.find({
      user: { $in: clientUserIds },
    })
      .select("user clientId clientName country state status shift")
      .lean();

    const clientLookup = {};
    clientDocs.forEach((c) => {
      clientLookup[c.user.toString()] = {
        clientId: c.clientId,
        clientName: c.clientName,
        country: c.country,
        state: c.state,
        status: c.status,
        shift: c.shift,
      };
    });

    const studentDetailsMap = {};
    students.forEach((st) => {
      const uid = st.user._id.toString();
      const clientUserId = st.client?._id?.toString();
      const clientInfo = clientLookup[clientUserId] || {};

      studentDetailsMap[uid] = {
        name: st.user.name || "Unknown",
        studentId: st.studentId,
        grade: st.grade || "N/A",
        isActive: st.user?.isActive === true,
        studentStatus: st.status,
        clientName: clientInfo.clientName || st.clientName || "Unknown",
        clientId: clientInfo.clientId || "Unknown",
        clientIsActive: st.client?.isActive === true,
        clientStatus: clientInfo.status || "unknown",
        clientShift: clientInfo.shift || "unknown",
        country: clientInfo.country || "Unknown",
        state: clientInfo.state || "Unknown",
      };
    });

    const scheduleIds = uniqueSchedules.map((s) => s._id);
    const attendanceRecords = await StudentAttendance.find({
      schedule: { $in: scheduleIds },
    }).lean();

    const attendanceMap = {};
    attendanceRecords.forEach((rec) => {
      attendanceMap[`${rec.schedule.toString()}-${rec.user.toString()}`] = rec;
    });

    const timetableData = uniqueSchedules.map((schedule) => {
      const teacher = {
        name:
          schedule.teacherId?.name || schedule.teacherName || "Unknown Teacher",
        isActive: schedule.teacherId?.isActive === true,
        timeSlot: `${schedule.startTime} to ${schedule.endTime}`,
        isManagedByMe: schedule.teacherId
          ? managedTeacherIds.includes(schedule.teacherId._id.toString())
          : managedTeacherNames.some(
              (name) =>
                schedule.teacherName && schedule.teacherName.includes(name)
            ),
      };

      const classPattern = getClassPatternInfo(schedule);
      const studentAttendances = schedule.students.map((studentId) => {
        const sid = studentId.toString();
        const key = `${schedule._id.toString()}-${sid}`;
        const record = attendanceMap[key];
        const studentInfo = studentDetailsMap[sid] || {
          name: "Unknown",
          studentId: "Unknown",
          grade: "N/A",
          isActive: true,
          studentStatus: "unknown",
          clientName: "Unknown",
          clientId: "Unknown",
          clientIsActive: true,
          clientStatus: "unknown",
          clientShift: "unknown",
          country: "Unknown",
          state: "Unknown",
        };

        return {
          studentId: sid,
          studentName: studentInfo.name,
          studentNumber: studentInfo.studentId,
          studentGrade: studentInfo.grade,
          studentIsActive: studentInfo.isActive,
          studentStatus: studentInfo.studentStatus,
          clientName: studentInfo.clientName,
          clientId: studentInfo.clientId,
          clientIsActive: studentInfo.clientIsActive,
          clientStatus: studentInfo.clientStatus,
          clientShift: studentInfo.clientShift,
          country: studentInfo.country,
          state: studentInfo.state,
          displayText: `${studentInfo.clientName} (${studentInfo.clientId})`,
          regionInfo: `${studentInfo.country}, ${studentInfo.state}`,
          statusIndicators: getStatusIndicators(studentInfo),
          status: record ? record.status : "pending",
          remarks: record ? record.remarks : "",
          markedBy: record ? record.markedByName : "",
          markedAt: record ? record.createdAt : null,
        };
      });

      return {
        scheduleId: schedule._id,
        teacher: teacher,
        subject: {
          name:
            schedule.subject?.name || schedule.subjectName || "Unknown Subject",
          type: schedule.subject?.type || schedule.subjectType || "Unknown",
        },
        timeSlot: teacher.timeSlot,
        startTime: schedule.startTime,
        endTime: schedule.endTime,
        day: schedule.day,
        sessionStatus: schedule.sessionStatus,
        status: schedule.status,
        studentAttendances: studentAttendances,
        classDate: schedule.classDate,
        isRecurring: schedule.isRecurring,
        recurrencePattern: schedule.recurrencePattern,
        classPattern: classPattern,
        studentsByRegion: groupStudentsByRegion(studentAttendances),
        isTeacherActive: schedule.teacherId !== null,
        teacherStatus: schedule.teacherId !== null ? "active" : "inactive",
      };
    });

    const teachers = [
      ...new Set(
        timetableData.map((item) => `${item.teacher.name} (${item.timeSlot})`)
      ),
    ];

    const timeSlots = [...new Set(timetableData.map((item) => item.timeSlot))];

    const regions = [
      ...new Set(
        timetableData.flatMap((item) =>
          item.studentAttendances.map((student) => student.regionInfo)
        )
      ),
    ].filter((region) => region !== "Unknown, Unknown");

    const summary = calculateSummaryWithStatusForSupervisor(timetableData);

    return res.status(200).json({
      success: true,
      message: `Timetable data retrieved successfully for ${
        targetDate.toISOString().split("T")[0]
      } - ${department} department`,
      timetable: timetableData,
      teachers: teachers,
      timeSlots: timeSlots,
      regions: regions,
      summary: summary,
      date: targetDate.toISOString().split("T")[0],
      duplicatesRemoved: schedules.length - uniqueSchedules.length,
      managedTeachers: managedTeacherNames,
      department: department,
      supervisorRole: role,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error("❌ Error fetching supervisor timetable data:", err);
    return res.status(500).json({
      message: "Server error while fetching supervisor timetable data",
      error: err.message,
    });
  }
};

const generateTimeSlots = () => {
  const slots = [];
  for (let hour = 7; hour < 19; hour++) {
    for (let minute = 0; minute < 60; minute += 30) {
      const startTime = `${String(hour).padStart(2, "0")}:${String(
        minute
      ).padStart(2, "0")}`;
      const endHour = minute === 30 ? hour + 1 : hour;
      const endMinute = minute === 30 ? 0 : 30;
      const endTime = `${String(endHour).padStart(2, "0")}:${String(
        endMinute
      ).padStart(2, "0")}`;

      slots.push({
        startTime,
        endTime,
        slotId: `${startTime}-${endTime}`,
      });
    }
  }
  return slots;
};

const getDayName = (date) => {
  const days = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];
  return days[date.getDay()];
};

const getNext5Weekdays = () => {
  const weekdays = [];
  const today = new Date();
  let currentDate = new Date(today);

  while (weekdays.length < 5) {
    const dayOfWeek = currentDate.getDay();
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      weekdays.push(new Date(currentDate));
    }
    currentDate.setDate(currentDate.getDate() + 1);
  }

  return weekdays;
};

const timeSlotsOverlap = (slot1Start, slot1End, slot2Start, slot2End) => {
  return slot1Start < slot2End && slot2Start < slot1End;
};

exports.getTeacherAvailability = async (req, res) => {
  try {
    const { teacherId } = req.params;
    const { startDate, endDate } = req.query;

    const teacher = await User.findById(teacherId);
    if (!teacher || !teacher.isActive) {
      return res.status(404).json({
        success: false,
        msg: "Teacher not found or inactive",
      });
    }

    const teacherProfile = await Teacher.findOne({ user: teacherId });

    let queryStartDate, queryEndDate;

    if (startDate && endDate) {
      queryStartDate = new Date(startDate);
      queryEndDate = new Date(endDate);
    } else {
      const weekdays = getNext5Weekdays();
      queryStartDate = weekdays[0];
      queryEndDate = weekdays[weekdays.length - 1];
    }

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const historicalSchedules = await Schedule.find({
      teacherId: teacherId,
      classDate: {
        $gte: thirtyDaysAgo,
        $lte: new Date(),
      },
    }).sort({ classDate: -1, startTime: 1 });

    const futureSchedules = await Schedule.find({
      teacherId: teacherId,
      classDate: {
        $gte: queryStartDate,
        $lte: queryEndDate,
      },
    });

    const allTimeSlots = generateTimeSlots();
    const recurringCommitments = analyzeRecurringPatterns(historicalSchedules);

    const freeSlots = [];
    const reservedSlots = [];

    allTimeSlots.forEach((slot) => {
      const availableDays = [];
      const reservedDays = [];

      const currentDate = new Date(queryStartDate);
      while (currentDate <= queryEndDate) {
        const dayName = getDayName(currentDate);
        const dateString = currentDate.toISOString().split("T")[0];

        const isTeacherAvailableOnDay = checkTeacherDayAvailability(
          teacherProfile,
          dayName
        );

        if (isTeacherAvailableOnDay) {
          const daySchedules = futureSchedules.filter((schedule) => {
            const scheduleDate = new Date(schedule.classDate);
            return scheduleDate.toISOString().split("T")[0] === dateString;
          });

          const slotAnalysis = analyzeSlotAvailability(
            slot,
            dayName,
            daySchedules,
            recurringCommitments,
            dateString
          );

          if (slotAnalysis.status === "free") {
            availableDays.push(dayName);
          } else if (slotAnalysis.status === "reserved") {
            reservedDays.push({
              day: dayName,
              reason: slotAnalysis.reason || "Reserved",
              details: slotAnalysis.details || {},
            });
          }
        }

        currentDate.setDate(currentDate.getDate() + 1);
      }

      if (availableDays.length > 0) {
        const uniqueDays = [...new Set(availableDays)];
        const dayOrder = [
          "Monday",
          "Tuesday",
          "Wednesday",
          "Thursday",
          "Friday",
          "Saturday",
          "Sunday",
        ];
        const sortedDays = uniqueDays.sort(
          (a, b) => dayOrder.indexOf(a) - dayOrder.indexOf(b)
        );

        freeSlots.push({
          timeSlot: `${slot.startTime} to ${slot.endTime}`,
          availableDays: sortedDays,
          daysText: sortedDays.join(", "),
        });
      }

      if (reservedDays.length > 0) {
        const uniqueReservedDays = reservedDays.reduce((acc, curr) => {
          if (!acc.find((item) => item.day === curr.day)) {
            acc.push(curr);
          }
          return acc;
        }, []);

        const dayOrder = [
          "Monday",
          "Tuesday",
          "Wednesday",
          "Thursday",
          "Friday",
          "Saturday",
          "Sunday",
        ];
        const sortedReservedDays = uniqueReservedDays.sort(
          (a, b) => dayOrder.indexOf(a.day) - dayOrder.indexOf(b.day)
        );

        reservedSlots.push({
          timeSlot: `${slot.startTime} to ${slot.endTime}`,
          reservedDays: sortedReservedDays,
          daysText: sortedReservedDays.map((d) => d.day).join(", "),
          reasons: [...new Set(sortedReservedDays.map((d) => d.reason))],
        });
      }
    });

    const summary = {
      teacherId,
      teacherName: teacher.name,
      dateRange: {
        startDate: queryStartDate.toISOString().split("T")[0],
        endDate: queryEndDate.toISOString().split("T")[0],
      },
      totalFreeSlots: freeSlots.length,
      totalReservedSlots: reservedSlots.length,
      totalTimeSlots: allTimeSlots.length,
    };

    res.status(200).json({
      success: true,
      summary,
      freeSlots,
      reservedSlots,
    });
  } catch (error) {
    console.error("Error getting teacher availability:", error);
    res.status(500).json({
      success: false,
      msg: "Server error while fetching teacher availability",
      error: error.message,
    });
  }
};

const analyzeRecurringPatterns = (schedules) => {
  const patterns = {};

  schedules.forEach((schedule) => {
    if (
      schedule.isRecurring &&
      !schedule.isTemporaryChange &&
      !schedule.isTeacherTemporaryChange
    ) {
      const key = `${schedule.startTime}-${schedule.endTime}`;

      if (!patterns[key]) {
        patterns[key] = {
          startTime: schedule.startTime,
          endTime: schedule.endTime,
          recurrencePattern: schedule.recurrencePattern,
          customDays: schedule.customDays || [],
          days: [],
          isActive: true,
          lastSeen: schedule.classDate,
        };
      }

      patterns[key].days.push(schedule.day);

      if (new Date(schedule.classDate) > new Date(patterns[key].lastSeen)) {
        patterns[key].lastSeen = schedule.classDate;
      }
    }
  });

  return patterns;
};

const checkTeacherDayAvailability = (teacherProfile, dayName) => {
  if (!teacherProfile || !teacherProfile.availability) {
    return true;
  }

  const { days } = teacherProfile.availability;

  if (days && days.length > 0) {
    return days.includes(dayName);
  }

  return true;
};

const analyzeSlotAvailability = (
  slot,
  dayName,
  daySchedules,
  recurringCommitments,
  dateString
) => {
  const slotStart = slot.startTime;
  const slotEnd = slot.endTime;

  const directConflict = daySchedules.find((schedule) =>
    timeSlotsOverlap(slotStart, slotEnd, schedule.startTime, schedule.endTime)
  );

  if (directConflict) {
    return {
      status: "reserved",
      reason: "Direct Schedule",
      details: {
        type: "direct",
        subjectName: directConflict.subjectName,
        studentNames: directConflict.studentNames,
        isTemporary: directConflict.isTemporaryChange,
      },
    };
  }

  for (const [patternKey, pattern] of Object.entries(recurringCommitments)) {
    if (
      timeSlotsOverlap(slotStart, slotEnd, pattern.startTime, pattern.endTime)
    ) {
      let matchesPattern = false;

      switch (pattern.recurrencePattern) {
        case "weekly":
          matchesPattern = pattern.days.includes(dayName);
          break;
        case "weekdays":
          matchesPattern = !["Saturday", "Sunday"].includes(dayName);
          break;
        case "custom":
          matchesPattern = pattern.customDays.includes(dayName);
          break;
        default:
          matchesPattern = pattern.days.includes(dayName);
      }

      if (matchesPattern) {
        return {
          status: "reserved",
          reason: "Recurring Class",
          details: {
            type: "recurring",
            recurrencePattern: pattern.recurrencePattern,
            customDays: pattern.customDays,
          },
        };
      }
    }
  }

  return { status: "free" };
};

exports.deleteMultipleSchedules = async (req, res) => {
  try {
    const role = req.user.role;
    const userId = req.user._id;
    const { scheduleIds } = req.body;

    if (role !== "admin") {
      return res.status(403).json({
        message: "Only admin can delete multiple schedules",
      });
    }

    if (
      !scheduleIds ||
      !Array.isArray(scheduleIds) ||
      scheduleIds.length === 0
    ) {
      return res.status(400).json({
        message: "Schedule IDs array is required and cannot be empty",
      });
    }

    const objectIds = scheduleIds.map((id) => {
      if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new Error(`Invalid schedule ID: ${id}`);
      }
      return new mongoose.Types.ObjectId(id);
    });

    const schedulesToDelete = await Schedule.find({
      _id: { $in: objectIds },
    }).lean();

    if (schedulesToDelete.length === 0) {
      return res.status(404).json({
        message: "No schedules found with the provided IDs",
      });
    }

    const nonDeletableSchedules = schedulesToDelete.filter(
      (schedule) =>
        schedule.sessionStatus === "pending" ||
        schedule.sessionStatus === "in_progress"
    );

    if (nonDeletableSchedules.length > 0) {
      return res.status(400).json({
        message: `Cannot delete schedules with pending or in-progress status`,
        nonDeletableCount: nonDeletableSchedules.length,
        nonDeletableSchedules: nonDeletableSchedules.map((s) => ({
          id: s._id,
          sessionStatus: s.sessionStatus,
          studentNames: s.studentNames,
          teacherName: s.teacherName,
          classDate: s.classDate,
        })),
      });
    }

    const scheduleDetails = schedulesToDelete.map((schedule) => ({
      id: schedule._id,
      studentNames: schedule.studentNames,
      teacherName: schedule.teacherName,
      subjectName: schedule.subjectName,
      classDate: schedule.classDate,
      sessionStatus: schedule.sessionStatus,
      day: schedule.day,
      startTime: schedule.startTime,
      endTime: schedule.endTime,
    }));

    const attendanceDeleteResult = await StudentAttendance.deleteMany({
      schedule: { $in: objectIds },
    });

    const scheduleDeleteResult = await Schedule.deleteMany({
      _id: { $in: objectIds },
    });

    return res.status(200).json({
      message: `Successfully deleted ${
        scheduleDeleteResult.deletedCount
      } schedule${scheduleDeleteResult.deletedCount > 1 ? "s" : ""}`,
      deletedCount: scheduleDeleteResult.deletedCount,
      attendanceRecordsDeleted: attendanceDeleteResult.deletedCount,
      deletedSchedules: scheduleDetails,
      deletedBy: {
        id: userId,
        name: req.user.name,
        email: req.user.email,
      },
      deletedAt: new Date().toISOString(),
      summary: {
        requestedDeletions: scheduleIds.length,
        successfulDeletions: scheduleDeleteResult.deletedCount,
        attendanceRecordsAffected: attendanceDeleteResult.deletedCount,
      },
    });
  } catch (err) {
    console.error(
      `❌ Error deleting multiple schedules by ${
        req.user?.name || "unknown"
      } at ${new Date().toISOString()}:`,
      err
    );

    if (err.message.includes("Invalid schedule ID")) {
      return res.status(400).json({
        message: "One or more schedule IDs are invalid",
        error: err.message,
      });
    }

    return res.status(500).json({
      message: "Server error while deleting schedules",
      error: err.message,
    });
  }
};
