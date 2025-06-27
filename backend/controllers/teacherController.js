const Teacher = require("../models/Teacher");
const Schedule = require("../models/Schedule");
const Student = require("../models/Student");
const User = require("../models/User");
const Client = require("../models/Client");
const MonthlyReport = require("../models/MonthlyReport");
const Announcement = require("../models/Announcement");
const mongoose = require("mongoose");
const { Schema } = mongoose;
const moment = require("moment-timezone");

exports.getAssignedStudentsForTeacher = async (req, res) => {
  try {
    const teacherId = req.user.id;

    const teacherUser = await User.findById(teacherId).select("name email");

    if (!teacherUser) {
      return res.status(404).json({ msg: "Teacher not found" });
    }

    const users = await User.find({ role: "student" }).select(
      "name email gender profilePicture"
    );

    const result = [];

    for (const user of users) {
      const studentProfile = await Student.findOne({ user: user._id }).lean();
      if (!studentProfile || !Array.isArray(studentProfile.assignedTeachers)) {
        continue;
      }
      const assignedToThisTeacher = studentProfile.assignedTeachers.filter(
        (a) => a?.teacher?._id?.toString() === teacherId.toString()
      );

      if (assignedToThisTeacher.length === 0) continue;

      result.push({
        _id: user._id,
        name: user.name,
        clientId: studentProfile.client,
        clientName: studentProfile.clientName,
        studentId: studentProfile.studentId,
        email: user.email,
        gender: user.gender,
        profilePicture: user.profilePicture,
        grade: studentProfile.grade,
        isTrailBased: studentProfile.isTrailBased,
        enrollmentDate: studentProfile.enrollmentDate,
        assignedSubjects: assignedToThisTeacher.map((a) => ({
          subject: a.subject,
          isTemporary: a.isTemporary,
          startDate: a.startDate,
          endDate: a.endDate,
        })),
        attendance: studentProfile.attendance || [],
      });
    }

    return res.status(200).json({
      msg: "Students assigned to this teacher",
      teacher: {
        _id: teacherUser._id,
        name: teacherUser.name,
        email: teacherUser.email,
      },
      count: result.length,
      students: result,
    });
  } catch (err) {
    console.error("🔥 Error fetching students for teacher:", err.message);
    res.status(500).json({
      msg: "Server error while fetching students",
      error: err.message,
    });
  }
};

exports.createOrUpdateMonthlyReport = async (req, res) => {
  try {
    const { studentId, subjectId, academicEntries, formData, testScores } =
      req.body;

    const monthYear = formData.classCount.split(" ");
    const month = monthYear[0];
    const year = monthYear[1];

    const student = await Student.findOne({ user: studentId })
      .populate("user")
      .populate("client")
      .populate("assignedTeachers");

    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    const teacherAssignment = student.assignedTeachers.find(
      (assignment) => assignment.subject._id.toString() === subjectId
    );

    if (!teacherAssignment) {
      return res.status(404).json({ message: "Teacher assignment not found" });
    }

    const reportData = {
      student: student.user,
      teacher: teacherAssignment.teacher._id,
      client: student.client,
      subject: subjectId,
      month,
      year,
      familyName: formData.familyName,
      studentName: formData.studentName,
      grade: formData.grade,
      subjectName: formData.subject,
      classCount: formData.classCount,
      tutorName: formData.tutorName,
      teacherRemarks: formData.teacherRemarks,
      notes: formData.notes,
      reportDate: new Date(),
    };

    if (academicEntries && academicEntries.length > 0) {
      reportData.academicEntries = academicEntries.map((entry) => ({
        date1: entry.date1,
        topic1: entry.topic1,
        date2: entry.date2,
        topic2: entry.topic2,
      }));
    }

    if (testScores && testScores.length > 0) {
      reportData.testScores = testScores.map((score) => ({
        testNumber: score.testNumber,
        totalMarks: score.totalMarks,
        passingMarks: score.passingMarks,
        obtainedMarks: score.obtainedMarks,
      }));
    }

    const report = await MonthlyReport.create(reportData);

    res.status(200).json({
      success: true,
      message: "Monthly report saved successfully",
      report,
    });
  } catch (error) {
    console.error("Error in createOrUpdateMonthlyReport:", error);
    res.status(500).json({
      success: false,
      message: "Error saving monthly report",
      error: error.message,
    });
  }
};

exports.getMonthlyReport = async (req, res) => {
  try {
    const report = await MonthlyReport.findById(req.params.id)
      .populate("student", "name grade")
      .populate("teacher", "name")
      .populate("client", "clientName")
      .populate("subject", "name");

    if (!report) {
      return res.status(404).json({ message: "Report not found" });
    }

    res.status(200).json({
      success: true,
      report,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching report",
      error: error.message,
    });
  }
};

exports.getTeacherReports = async (req, res) => {
  try {
    const teacherId = req.user.id;

    const reports = await MonthlyReport.aggregate([
      {
        $match: { teacher: new mongoose.Types.ObjectId(teacherId) },
      },
      {
        $lookup: {
          from: "users",
          localField: "student",
          foreignField: "_id",
          as: "studentUser",
          pipeline: [{ $project: { name: 1, email: 1, gender: 1 } }],
        },
      },
      {
        $lookup: {
          from: "students",
          localField: "student",
          foreignField: "user",
          as: "studentDoc",
          pipeline: [
            { $project: { studentId: 1, grade: 1, studentNumber: 1 } },
          ],
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "client",
          foreignField: "_id",
          as: "clientUser",
          pipeline: [{ $project: { name: 1 } }],
        },
      },
      {
        $lookup: {
          from: "clients",
          localField: "client",
          foreignField: "user",
          as: "clientDoc",
          pipeline: [{ $project: { clientName: 1, clientId: 1 } }],
        },
      },
      {
        $lookup: {
          from: "subjects",
          localField: "subject",
          foreignField: "_id",
          as: "subject",
          pipeline: [{ $project: { name: 1 } }],
        },
      },
      {
        $addFields: {
          student: {
            $mergeObjects: [
              { $arrayElemAt: ["$studentUser", 0] },
              { $arrayElemAt: ["$studentDoc", 0] },
            ],
          },
          client: {
            $mergeObjects: [
              { $arrayElemAt: ["$clientUser", 0] },
              { $arrayElemAt: ["$clientDoc", 0] },
            ],
          },
          subject: { $arrayElemAt: ["$subject", 0] },
          studentNameFromUser: { $arrayElemAt: ["$studentUser.name", 0] },
        },
      },
      {
        $unset: ["studentUser", "studentDoc", "clientUser", "clientDoc"],
      },
      {
        $sort: { createdAt: -1 },
      },
    ]);

    res.status(200).json({
      success: true,
      reports,
    });
  } catch (error) {
    console.error("Error fetching teacher reports:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching teacher reports",
      error: error.message,
    });
  }
};

exports.getDashboardStats = async (req, res) => {
  try {
    const teacherId = req.user.id;

    const currentDate = new Date();
    const pakistanTime = moment.tz(currentDate, "Asia/Karachi");
    const startOfDay = pakistanTime.clone().startOf("day").toDate();
    const endOfDay = pakistanTime.clone().endOf("day").toDate();

    const unreadAnnouncements = await Announcement.countDocuments({
      $or: [
        { "recipients.role": "teacher_quran" },
        { "recipients.role": "teacher_subjects" },
        { "recipients.role": "all" },
      ],
      "readBy.user": { $ne: teacherId },
    });

    const uniqueStudents = await Schedule.distinct("students", {
      teacherId: teacherId,
    });

    const todayClasses = await Schedule.find({
      teacherId: teacherId,
      classDate: {
        $gte: startOfDay,
        $lt: endOfDay,
      },
    })
      .populate("students", "name")
      .populate("subject", "name");

    const studentUserIds = todayClasses.flatMap((todayClass) =>
      todayClass.students.map((student) => student._id)
    );

    const studentDetails = await mongoose
      .model("Student")
      .find({
        user: { $in: studentUserIds },
      })
      .select("user studentId");

    const studentDetailsMap = {};
    studentDetails.forEach((student) => {
      studentDetailsMap[student.user.toString()] = student.studentId;
    });

    const classesStats = {
      total: todayClasses.length,
      pending: todayClasses.filter((c) => c.sessionStatus === "pending").length,
      available: todayClasses.filter((c) => c.sessionStatus === "available")
        .length,
      inProgress: todayClasses.filter((c) => c.sessionStatus === "in_progress")
        .length,
      completed: todayClasses.filter((c) => c.sessionStatus === "completed")
        .length,
      leave: todayClasses.filter((c) => c.sessionStatus === "leave").length,
      absent: todayClasses.filter((c) => c.sessionStatus === "absent").length,
    };

    const additionalStats = {
      activeClasses: classesStats.available + classesStats.inProgress,
      finishedClasses:
        classesStats.completed + classesStats.leave + classesStats.absent,
      successfulClasses: classesStats.completed,
      missedClasses: classesStats.leave + classesStats.absent,
      completionRate:
        classesStats.total > 0
          ? ((classesStats.completed / classesStats.total) * 100).toFixed(2)
          : "0.00",
      attendanceRate:
        classesStats.total > 0
          ? (
              ((classesStats.total - classesStats.absent) /
                classesStats.total) *
              100
            ).toFixed(2)
          : "100.00",
    };

    const teacher = await User.findById(teacherId).select(
      "name email role profilePicture"
    );

    const formattedTodayClasses = todayClasses.map((todayClass) => {
      const classDate = moment
        .tz(todayClass.classDate, "Asia/Karachi")
        .toDate();

      const studentsDetails = todayClass.students.map((student) => ({
        name: student.name || "",
        studentId: studentDetailsMap[student._id.toString()] || "",
      }));

      const getStatusInfo = (status) => {
        const statusMap = {
          pending: {
            color: "#f59e0b",
            backgroundColor: "#fef3c7",
            label: "Pending",
          },
          available: {
            color: "#0369a1",
            backgroundColor: "#e0f2fe",
            label: "Available",
          },
          in_progress: {
            color: "#059669",
            backgroundColor: "#d1fae5",
            label: "In Progress",
          },
          completed: {
            color: "#065f46",
            backgroundColor: "#d1fae5",
            label: "Completed",
          },
          leave: {
            color: "#ea580c",
            backgroundColor: "#fed7aa",
            label: "Leave",
          },
          absent: {
            color: "#dc2626",
            backgroundColor: "#fee2e2",
            label: "Absent",
          },
        };
        return (
          statusMap[status] || {
            color: "#64748b",
            backgroundColor: "#f1f5f9",
            label: "Unknown",
          }
        );
      };

      return {
        subject: todayClass.subject ? todayClass.subject.name : "",
        time: todayClass.startTime,
        endTime: todayClass.endTime,
        students: todayClass.students.map((s) => s.name || "").join(", "),
        studentsIds: todayClass.students
          .map((s) => studentDetailsMap[s._id.toString()] || "")
          .join(", "),
        studentsDetails: studentsDetails,
        date: classDate,
        status: todayClass.sessionStatus || "unknown",
        statusInfo: getStatusInfo(todayClass.sessionStatus),
        scheduleId: todayClass._id,
        teacherAvailableAt: todayClass.teacherAvailableAt,
        classStartedAt: todayClass.classStartedAt,
        classEndedAt: todayClass.classEndedAt,
      };
    });

    const classesByStatus = {
      pending: formattedTodayClasses.filter((c) => c.status === "pending"),
      available: formattedTodayClasses.filter((c) => c.status === "available"),
      inProgress: formattedTodayClasses.filter(
        (c) => c.status === "in_progress"
      ),
      completed: formattedTodayClasses.filter((c) => c.status === "completed"),
      leave: formattedTodayClasses.filter((c) => c.status === "leave"),
      absent: formattedTodayClasses.filter((c) => c.status === "absent"),
    };

    const response = {
      success: true,
      stats: {
        teacher: {
          name: teacher.name,
          email: teacher.email,
          role: teacher.role,
          profilePicture: teacher.profilePicture,
        },
        unreadAnnouncements,
        totalStudents: uniqueStudents.length,
        todayClasses: classesStats,
        additionalStats,
        detailedTodayClasses: formattedTodayClasses,
        classesByStatus,
        quickActions: {
          needsAttention: classesStats.pending + classesStats.available,
          readyToStart: classesStats.available,
          inSession: classesStats.inProgress,
          needsReview: classesStats.leave + classesStats.absent,
        },
      },
      metadata: {
        generatedAt: new Date().toISOString(),
        generatedBy: "hammas-coding",
        timezone: "Asia/Karachi",
        dateRange: {
          startOfDay: startOfDay.toISOString(),
          endOfDay: endOfDay.toISOString(),
        },
      },
    };

    return res.status(200).json(response);
  } catch (error) {
    console.error("Error in getDashboardStats:", error);
    return res.status(500).json({
      success: false,
      message: "Error fetching dashboard statistics",
      error: error.message,
    });
  }
};
