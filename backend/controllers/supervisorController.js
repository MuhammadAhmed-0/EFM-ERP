const Schedule = require("../models/Schedule");
const Student = require("../models/Student");
const Teacher = require("../models/Teacher");
const Client = require("../models/Client");
const User = require("../models/User");
const Subject = require("../models/Subject");
const StudentAttendance = require("../models/StudentAttendance");

exports.getQuranTeachersForSupervisor = async (req, res) => {
  try {
    if (req.user.role !== "supervisor_quran") {
      return res.status(403).json({ msg: "Access denied" });
    }

    const supervisorId = req.user.id;

    const managedTeacherProfiles = await Teacher.find({
      manager: supervisorId,
      department: "quran",
      isActive: true,
    }).lean();

    if (managedTeacherProfiles.length === 0) {
      return res.status(200).json({
        msg: "Quran teachers list",
        count: 0,
        users: [],
      });
    }
    const managedTeacherUserIds = managedTeacherProfiles.map(
      (teacher) => teacher.user
    );

    const teachers = await User.find({
      _id: { $in: managedTeacherUserIds },
      role: "teacher_quran",
      isActive: true,
    }).select("name role gender profilePicture staffId isActive");

    const result = [];

    for (const user of teachers) {
      const teacherProfile = managedTeacherProfiles.find(
        (profile) => profile.user.toString() === user._id.toString()
      );

      if (teacherProfile) {
        const { salary, salaryHistory, ...safeProfile } = teacherProfile;
        result.push({
          ...user.toObject(),
          profile: safeProfile,
        });
      }
    }

    res.status(200).json({
      msg: "Quran teachers list",
      count: result.length,
      users: result,
    });
  } catch (err) {
    console.error("getQuranTeachersForSupervisor error:", err.message);
    res.status(500).json({ msg: "Server error while fetching Quran teachers" });
  }
};

exports.getSubjectTeachersForSupervisor = async (req, res) => {
  try {
    if (req.user.role !== "supervisor_subjects") {
      return res.status(403).json({ msg: "Access denied" });
    }

    const supervisorId = req.user.id;

    const managedTeacherProfiles = await Teacher.find({
      manager: supervisorId,
      department: "subjects",
      isActive: true,
    }).lean();

    if (managedTeacherProfiles.length === 0) {
      return res.status(200).json({
        msg: "Subject teachers list",
        count: 0,
        users: [],
      });
    }
    const managedTeacherUserIds = managedTeacherProfiles.map(
      (teacher) => teacher.user
    );

    const teachers = await User.find({
      _id: { $in: managedTeacherUserIds },
      role: "teacher_subjects",
      isActive: true,
    }).select("name role gender profilePicture staffId isActive");
    const result = [];

    for (const user of teachers) {
      const teacherProfile = managedTeacherProfiles.find(
        (profile) => profile.user.toString() === user._id.toString()
      );

      if (teacherProfile) {
        const { salary, salaryHistory, ...safeProfile } = teacherProfile;
        result.push({
          ...user.toObject(),
          profile: safeProfile,
        });
      }
    }

    res.status(200).json({
      msg: "Subject teachers list",
      count: result.length,
      users: result,
    });
  } catch (err) {
    console.error("getSubjectTeachersForSupervisor error:", err.message);
    res
      .status(500)
      .json({ msg: "Server error while fetching subject teachers" });
  }
};

exports.getStudentsForQuranSupervisor = async (req, res) => {
  try {
    if (req.user.role !== "supervisor_quran") {
      return res.status(403).json({ msg: "Access denied" });
    }

    const supervisorId = req.user.id;

    const managedTeachers = await Teacher.find({
      manager: supervisorId,
      department: "quran",
    }).select("user");

    if (!managedTeachers.length) {
      return res.status(200).json({
        msg: "Students for Quran supervisor",
        count: 0,
        users: [],
      });
    }

    const managedTeacherUserIds = managedTeachers.map((teacher) =>
      teacher.user.toString()
    );

    const users = await User.find({ role: "student" }).select(
      "name role gender profilePicture"
    );

    const result = [];

    for (const user of users) {
      const studentProfile = await Student.findOne({ user: user._id }).lean();
      if (!studentProfile) continue;

      const hasTeacherManagedBySupervisor = (
        studentProfile.assignedTeachers || []
      ).some((assignment) => {
        const teacherId =
          assignment.teacher && assignment.teacher._id
            ? assignment.teacher._id.toString()
            : null;

        return teacherId && managedTeacherUserIds.includes(teacherId);
      });

      if (!hasTeacherManagedBySupervisor) continue;

      const subjectIds = studentProfile.subjects.map((s) => s._id || s);
      const allSubjects = await Subject.find({ _id: { $in: subjectIds } });

      const quranSubjects = allSubjects.filter((s) => s.type === "quran");
      if (quranSubjects.length === 0) continue;

      const quranSubjectIds = quranSubjects.map((s) => s._id.toString());

      const { guardianContact, feeHistory, ...safeProfile } = studentProfile;

      const filteredSubjects = studentProfile.subjects.filter((s) =>
        quranSubjectIds.includes((s._id || s).toString())
      );

      const filteredTeachers = (studentProfile.assignedTeachers || []).filter(
        (assignment) => {
          const teacherId =
            assignment.teacher && assignment.teacher._id
              ? assignment.teacher._id.toString()
              : null;

          const isQuranSubject =
            assignment.subject &&
            quranSubjectIds.includes(
              (assignment.subject._id || assignment.subject).toString()
            );

          return (
            teacherId &&
            managedTeacherUserIds.includes(teacherId) &&
            isQuranSubject
          );
        }
      );

      let clientInfo = null;
      if (studentProfile.client) {
        const clientData = await Client.findOne({
          user: studentProfile.client,
        }).lean();
        if (clientData) {
          clientInfo = {
            clientId: clientData.clientId,
            clientName: clientData.clientName,
            contactNo: clientData.contactNo,
            country: clientData.country,
            state: clientData.state,
            shift: clientData.shift,
            status: clientData.status,
          };
        }
      }

      result.push({
        ...user.toObject(),
        profile: {
          ...safeProfile,
          subjects: filteredSubjects,
          assignedTeachers: filteredTeachers,
          subjectsDetails: quranSubjects,
          clientInfo: clientInfo, 
        },
      });
    }

    res.status(200).json({
      msg: "Students for Quran supervisor",
      count: result.length,
      users: result,
    });
  } catch (err) {
    console.error("getStudentsForQuranSupervisor error:", err.message);
    res.status(500).json({ msg: "Server error while fetching students" });
  }
};

exports.getStudentsForSubjectSupervisor = async (req, res) => {
  try {
    if (req.user.role !== "supervisor_subjects") {
      return res.status(403).json({ msg: "Access denied" });
    }

    const supervisorId = req.user.id;

    const managedTeachers = await Teacher.find({
      manager: supervisorId,
      department: "subjects",
    }).select("user");

    if (!managedTeachers.length) {
      return res.status(200).json({
        msg: "Students for Subject supervisor",
        count: 0,
        users: [],
      });
    }

    const managedTeacherUserIds = managedTeachers.map((teacher) =>
      teacher.user.toString()
    );

    const users = await User.find({ role: "student" }).select(
      "name role gender profilePicture"
    );

    const result = [];

    for (const user of users) {
      const studentProfile = await Student.findOne({ user: user._id }).lean();
      if (!studentProfile) continue;

      const hasTeacherManagedBySupervisor = (
        studentProfile.assignedTeachers || []
      ).some((assignment) => {
        const teacherId =
          assignment.teacher && assignment.teacher._id
            ? assignment.teacher._id.toString()
            : null;

        return teacherId && managedTeacherUserIds.includes(teacherId);
      });

      if (!hasTeacherManagedBySupervisor) continue;

      const subjectIds = studentProfile.subjects.map((s) => s._id || s);
      const allSubjects = await Subject.find({ _id: { $in: subjectIds } });

      const subjectSubjects = allSubjects.filter((s) => s.type === "subjects");
      if (subjectSubjects.length === 0) continue;

      const subjectIdsOnly = subjectSubjects.map((s) => s._id.toString());

      const { guardianContact, feeHistory, ...safeProfile } = studentProfile;

      const filteredSubjects = studentProfile.subjects.filter((s) =>
        subjectIdsOnly.includes((s._id || s).toString())
      );

      const filteredTeachers = (studentProfile.assignedTeachers || []).filter(
        (assignment) => {
          const teacherId =
            assignment.teacher && assignment.teacher._id
              ? assignment.teacher._id.toString()
              : null;

          const isSubjectType =
            assignment.subject &&
            subjectIdsOnly.includes(
              (assignment.subject._id || assignment.subject).toString()
            );

          return (
            teacherId &&
            managedTeacherUserIds.includes(teacherId) &&
            isSubjectType
          );
        }
      );

      let clientInfo = null;
      if (studentProfile.client) {
        const clientData = await Client.findOne({
          user: studentProfile.client,
        }).lean();
        if (clientData) {
          clientInfo = {
            clientId: clientData.clientId,
            clientName: clientData.clientName,
            contactNo: clientData.contactNo,
            country: clientData.country,
            state: clientData.state,
            shift: clientData.shift,
            status: clientData.status,
          };
        }
      }

      result.push({
        ...user.toObject(),
        profile: {
          ...safeProfile,
          subjects: filteredSubjects,
          assignedTeachers: filteredTeachers,
          subjectsDetails: subjectSubjects,
          clientInfo: clientInfo, 
        },
      });
    }

    res.status(200).json({
      msg: "Students for Subject supervisor",
      count: result.length,
      users: result,
    });
  } catch (err) {
    console.error("getStudentsForSubjectSupervisor error:", err.message);
    res.status(500).json({ msg: "Server error while fetching students" });
  }
};

exports.getSupervisorDashboardStats = async (req, res) => {
  try {
    const supervisorId = req.user.id;
    const department = req.user.role.split("_")[1];

    const currentDate = new Date();
    const pakistanOffset = 5;

    const startOfDay = new Date(currentDate);
    startOfDay.setUTCHours(0 - pakistanOffset, 0, 0, 0);

    const endOfDay = new Date(currentDate);
    endOfDay.setUTCHours(24 - pakistanOffset, 0, 0, 0);

    const todaySchedules = await Schedule.find({
      subjectType: department,
      classDate: {
        $gte: startOfDay,
        $lt: endOfDay,
      },
    });

    const classStats = {
      total: todaySchedules.length,
      pending: todaySchedules.filter((s) => s.sessionStatus === "pending")
        .length,
      available: todaySchedules.filter((s) => s.sessionStatus === "available")
        .length,
      inProgress: todaySchedules.filter(
        (s) => s.sessionStatus === "in_progress"
      ).length,
      completed: todaySchedules.filter((s) => s.sessionStatus === "completed")
        .length,
      absent: todaySchedules.filter((s) => s.sessionStatus === "absent").length,
      leave: todaySchedules.filter((s) => s.sessionStatus === "leave").length,
    };

    const scheduleIds = todaySchedules.map((s) => s._id);
    const attendanceRecords = await StudentAttendance.find({
      schedule: { $in: scheduleIds },
      date: {
        $gte: startOfDay,
        $lt: endOfDay,
      },
    });

    const attendanceStats = {
      total: attendanceRecords.length,
      present: attendanceRecords.filter((a) => a.status === "present").length,
      leave: attendanceRecords.filter((a) => a.status === "leave").length,
      absent: attendanceRecords.filter((a) => a.status === "absent").length,
      late: attendanceRecords.filter((a) => a.status === "late").length,
    };

    const timingStats = {
      totalClasses: todaySchedules.length,
      lateStartedClasses: 0,
      earlyEndClasses: 0,
      totalLateMinutes: 0,
      totalEarlyMinutes: 0,
    };

    todaySchedules.forEach((schedule) => {
      if (schedule.startDelay > 0) {
        timingStats.lateStartedClasses++;
        timingStats.totalLateMinutes += schedule.startDelay;
      }

      if (schedule.earlyEnd > 0) {
        timingStats.earlyEndClasses++;
        timingStats.totalEarlyMinutes += schedule.earlyEnd;
      }
    });

    const uniqueTeachers = new Set(
      todaySchedules.map((s) => s.teacherId.toString())
    );

    const teacherStats = {
      total: uniqueTeachers.size,
      activeNow: new Set(
        todaySchedules
          .filter((s) => s.sessionStatus === "in_progress")
          .map((s) => s.teacherId.toString())
      ).size,
      available: new Set(
        todaySchedules
          .filter((s) => s.sessionStatus === "available")
          .map((s) => s.teacherId.toString())
      ).size,
    };

    const uniqueStudents = new Set(
      todaySchedules.flatMap((s) => s.students.map((st) => st.toString()))
    );

    const studentStats = {
      total: uniqueStudents.size,
      presentToday: new Set(
        attendanceRecords
          .filter((a) => a.status === "present")
          .map((a) => a.user.toString())
      ).size,
      onLeaveToday: new Set(
        attendanceRecords
          .filter((a) => a.status === "leave")
          .map((a) => a.user.toString())
      ).size,
      absentToday: new Set(
        attendanceRecords
          .filter((a) => a.status === "absent")
          .map((a) => a.user.toString())
      ).size,
      lateToday: new Set(
        attendanceRecords
          .filter((a) => a.status === "late")
          .map((a) => a.user.toString())
      ).size,
    };

    const sessionStats = {
      totalSessions: classStats.total,
      activeSessions: classStats.inProgress,
      completedSessions: classStats.completed,
      absentSessions: classStats.absent,
      leaveSessions: classStats.leave,
      pendingSessions: classStats.pending,
      availableSessions: classStats.available,
    };

    return res.status(200).json({
      success: true,
      departmentType: department,
      stats: {
        classes: classStats,
        sessions: sessionStats,
        attendance: attendanceStats,
        timing: timingStats,
        teachers: teacherStats,
        students: studentStats,
        summary: {
          totalClassesScheduled: classStats.total,
          totalStudentsPresent: studentStats.presentToday,
          totalStudentsOnLeave: studentStats.onLeaveToday,
          totalStudentsAbsent: studentStats.absentToday,
          totalStudentsLate: studentStats.lateToday,
          totalSessionsAbsent: classStats.absent,
          totalSessionsLeave: classStats.leave,
          totalActiveTeachers: teacherStats.activeNow,
          totalAvailableTeachers: teacherStats.available,
          attendanceRate:
            attendanceRecords.length > 0
              ? (
                  (attendanceStats.present / attendanceRecords.length) *
                  100
                ).toFixed(2) + "%"
              : "0%",
          sessionCompletionRate:
            classStats.total > 0
              ? (
                  ((classStats.completed + classStats.inProgress) /
                    classStats.total) *
                  100
                ).toFixed(2) + "%"
              : "0%",
        },
      },
    });
  } catch (error) {
    console.error("❌ Error in getSupervisorDashboardStats:", error);
    return res.status(500).json({
      success: false,
      message: "Error fetching supervisor dashboard stats",
      error: error.message,
    });
  }
};
