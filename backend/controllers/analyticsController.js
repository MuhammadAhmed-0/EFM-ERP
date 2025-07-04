const User = require("../models/User");
const Teacher = require("../models/Teacher");
const Student = require("../models/Student");
const Schedule = require("../models/Schedule");
const mongoose = require("mongoose");

exports.getMonthlyAnalysisReport = async (req, res) => {
  try {
    const { startDate, endDate, teacherId, supervisorId } = req.query;
    const now = new Date();
    const pakistanNow = new Date(now.getTime() + 5 * 60 * 60 * 1000);
    let reportStartDate, reportEndDate;

    if (startDate) {
      reportStartDate = new Date(startDate);
    } else {
      reportStartDate = new Date(
        pakistanNow.getFullYear(),
        pakistanNow.getMonth(),
        1
      );
      reportStartDate = new Date(
        reportStartDate.getTime() - 5 * 60 * 60 * 1000
      );
    }

    if (endDate) {
      reportEndDate = new Date(endDate);
    } else {
      reportEndDate = new Date(
        pakistanNow.getFullYear(),
        pakistanNow.getMonth() + 1,
        0,
        23,
        59,
        59,
        999
      );
      reportEndDate = new Date(reportEndDate.getTime() - 5 * 60 * 60 * 1000);
    }

    // STEP 1: Build query filters
    const scheduleQuery = {
      classDate: { $gte: reportStartDate, $lte: reportEndDate },
    };

    if (teacherId) {
      scheduleQuery.teacherId = mongoose.Types.ObjectId(teacherId);
    } else if (supervisorId) {
      const teachersUnderSupervisor = await Teacher.find({
        manager: mongoose.Types.ObjectId(supervisorId),
      })
        .select("user")
        .lean();

      const teacherIds = teachersUnderSupervisor.map((t) => t.user);

      if (teacherIds.length > 0) {
        scheduleQuery.teacherId = { $in: teacherIds };
      }
    }

    // STEP 2: Get unique teacher-student-subject combinations
    const uniqueCombinations = await Schedule.aggregate([
      { $match: scheduleQuery },
      { $unwind: "$students" },
      {
        $group: {
          _id: {
            teacherId: "$teacherId",
            teacherName: "$teacherName",
            studentId: "$students",
            subjectId: "$subject",
            subjectName: "$subjectName",
          },
          classCount: { $sum: 1 },
          classDates: { $push: "$classDate" },
          subjectTypes: { $first: "$subjectType" },
        },
      },
      {
        $lookup: {
          from: "students",
          localField: "_id.studentId",
          foreignField: "user",
          as: "studentInfo",
        },
      },
      {
        $unwind: {
          path: "$studentInfo",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "_id.teacherId",
          foreignField: "_id",
          as: "teacherInfo",
        },
      },
      {
        $unwind: {
          path: "$teacherInfo",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $project: {
          teacherId: "$_id.teacherId",
          teacherName: "$_id.teacherName",
          staffId: "$teacherInfo.staffId",
          studentId: "$_id.studentId",
          studentName: { $ifNull: ["$studentInfo.name", "Unknown Student"] },
          studentStatus: { $ifNull: ["$studentInfo.status", "unknown"] },
          clientName: {
            $ifNull: ["$studentInfo.clientName", "Unknown Client"],
          },
          studentIdNumber: { $ifNull: ["$studentInfo.studentId", 0] },
          subjectName: "$_id.subjectName",
        },
      },
      {
        $sort: { teacherName: 1, studentName: 1 },
      },
    ]);

    // STEP 3: Group by teacher
    const teacherMap = new Map();
    uniqueCombinations.forEach((combo) => {
      const teacherId = combo.teacherId.toString();

      if (!teacherMap.has(teacherId)) {
        teacherMap.set(teacherId, {
          teacherId,
          teacherName: combo.teacherName,
          staffId: combo.staffId,
          students: [],
          uniqueSubjectStudentCount: 0,
        });
      }

      teacherMap.get(teacherId).students.push({
        studentId: combo.studentId,
        studentName: combo.studentName,
        studentStatus: combo.studentStatus,
        clientName: combo.clientName,
        studentIdNumber: combo.studentIdNumber,
        subjectName: combo.subjectName,
      });

      teacherMap.get(teacherId).uniqueSubjectStudentCount++;
    });

    const classesByTeacher = Array.from(teacherMap.values());

    // STEP 4: Get manager-teacher relationships
    const allTeachers = await Teacher.find({})
      .select("user name department manager managerName")
      .lean();

    const managerIds = [
      ...new Set(allTeachers.map((t) => t.manager).filter(Boolean)),
    ];

    const managers = await User.find({ _id: { $in: managerIds } })
      .select("_id name role isActive staffId")
      .lean();

    const managerMap = new Map();
    managers.forEach((manager) => {
      managerMap.set(manager._id.toString(), {
        _id: manager._id,
        name: manager.name,
        role: manager.role,
        isActive: manager.isActive,
        staffId: manager.staffId,
        teachers: [],
        totalTeachers: 0,
        uniqueSubjectStudentCount: 0,
      });
    });

    const managerCombinations = new Map();

    allTeachers.forEach((teacher) => {
      if (!teacher.manager) return;

      const managerId = teacher.manager.toString();
      const teacherId = teacher.user.toString();

      if (!managerMap.has(managerId)) return;

      const teacherData = classesByTeacher.find(
        (t) => t.teacherId.toString() === teacherId
      );

      const teacherInfo = {
        _id: teacherId,
        name: teacher.name,
        department: teacher.department,
        staffId: teacherData?.staffId,
        uniqueSubjectStudentCount: teacherData
          ? teacherData.uniqueSubjectStudentCount
          : 0,
      };

      managerMap.get(managerId).teachers.push(teacherInfo);
      managerMap.get(managerId).totalTeachers++;
      if (teacherData) {
        if (!managerCombinations.has(managerId)) {
          managerCombinations.set(managerId, new Set());
        }
        if (teacherData.students) {
          teacherData.students.forEach((student) => {
            const combination = `${student.studentId}-${student.subjectName}`;
            managerCombinations.get(managerId).add(combination);
          });
        }
      }
    });

    for (const [managerId, combinations] of managerCombinations.entries()) {
      if (managerMap.has(managerId)) {
        managerMap.get(managerId).uniqueSubjectStudentCount = combinations.size;
      }
    }

    const managersWithTeachers = Array.from(managerMap.values());

    // STEP 5: Calculate active subjects count
    const allStudents = await Student.find({})
      .populate({
        path: "subjectStatus.subject",
        select: "name type",
      })
      .populate({
        path: "assignedTeachers.subject._id",
        select: "name type",
      })
      .lean();

    let totalActiveSubjects = 0;
    let quranActiveSubjects = 0;
    let academicActiveSubjects = 0;

    allStudents.forEach((student) => {
      let activeSubjects = [];
      if (student.subjectStatus && student.subjectStatus.length > 0) {
        activeSubjects = student.subjectStatus
          .filter((status) => status.isActive === true)
          .map((status) => {
            const subjectId = status.subject._id || status.subject;
            const subjectName = status.subject.name || "Unknown Subject";
            const subjectType = status.subject.type || "unknown";

            return {
              subjectId,
              subjectName,
              subjectType,
            };
          });
      } else if (
        student.assignedTeachers &&
        student.assignedTeachers.length > 0
      ) {
        activeSubjects = student.assignedTeachers
          .filter((assignment) => assignment.subject && assignment.subject._id)
          .map((assignment) => {
            const subjectId =
              (assignment.subject._id && assignment.subject._id._id) ||
              assignment.subject._id ||
              assignment.subject;

            const subjectName = assignment.subject.name || "Unknown Subject";
            const subjectType =
              (assignment.subject._id && assignment.subject._id.type) ||
              "unknown";

            return {
              subjectId,
              subjectName,
              subjectType,
            };
          });
      }

      activeSubjects.forEach((subject) => {
        totalActiveSubjects++;

        if (subject.subjectType === "quran") {
          quranActiveSubjects++;
        } else if (subject.subjectType === "subjects") {
          academicActiveSubjects++;
        }
      });
    });

    // STEP 6: Get student status metrics
    const studentsWithStatusChanges = await Student.find({
      $or: [
        {
          "statusDates.trial.date": {
            $gte: reportStartDate,
            $lte: reportEndDate,
          },
        },
        {
          "statusDates.regular.date": {
            $gte: reportStartDate,
            $lte: reportEndDate,
          },
        },
        {
          "statusDates.drop.date": {
            $gte: reportStartDate,
            $lte: reportEndDate,
          },
        },
        {
          "statusDates.freeze.date": {
            $gte: reportStartDate,
            $lte: reportEndDate,
          },
        },
      ],
    })
      .select("statusDates status")
      .lean();

    let trialThisMonthCount = 0;
    let regularThisMonthCount = 0;
    let dropThisMonthCount = 0;
    let freezeThisMonthCount = 0;
    let trialToRegularCount = 0;

    studentsWithStatusChanges.forEach((student) => {
      const statusChanges = [];

      if (
        student.statusDates.trial &&
        student.statusDates.trial.date &&
        new Date(student.statusDates.trial.date) >= reportStartDate &&
        new Date(student.statusDates.trial.date) <= reportEndDate
      ) {
        statusChanges.push({
          type: "trial",
          date: new Date(student.statusDates.trial.date),
        });
      }

      if (
        student.statusDates.regular &&
        student.statusDates.regular.date &&
        new Date(student.statusDates.regular.date) >= reportStartDate &&
        new Date(student.statusDates.regular.date) <= reportEndDate
      ) {
        statusChanges.push({
          type: "regular",
          date: new Date(student.statusDates.regular.date),
        });
      }

      if (
        student.statusDates.drop &&
        student.statusDates.drop.date &&
        new Date(student.statusDates.drop.date) >= reportStartDate &&
        new Date(student.statusDates.drop.date) <= reportEndDate
      ) {
        statusChanges.push({
          type: "drop",
          date: new Date(student.statusDates.drop.date),
        });
      }

      if (
        student.statusDates.freeze &&
        student.statusDates.freeze.date &&
        new Date(student.statusDates.freeze.date) >= reportStartDate &&
        new Date(student.statusDates.freeze.date) <= reportEndDate
      ) {
        statusChanges.push({
          type: "freeze",
          date: new Date(student.statusDates.freeze.date),
        });
      }

      statusChanges.sort((a, b) => a.date - b.date);

      if (statusChanges.length > 0) {
        const firstStatus = statusChanges[0];
        const lastStatus = statusChanges[statusChanges.length - 1];

        if (firstStatus.type === "trial") {
          trialThisMonthCount++;
        }

        if (lastStatus.type === "regular") {
          regularThisMonthCount++;
        } else if (lastStatus.type === "drop") {
          dropThisMonthCount++;
        } else if (lastStatus.type === "freeze") {
          freezeThisMonthCount++;
        }

        const trialIndex = statusChanges.findIndex(
          (status) => status.type === "trial"
        );
        const regularIndex = statusChanges.findIndex(
          (status) => status.type === "regular"
        );

        if (
          trialIndex !== -1 &&
          regularIndex !== -1 &&
          regularIndex > trialIndex
        ) {
          trialToRegularCount++;
        } else if (
          student.statusDates.trial &&
          student.statusDates.trial.date &&
          student.statusDates.regular &&
          student.statusDates.regular.date
        ) {
          const trialDate = new Date(student.statusDates.trial.date);
          const regularDate = new Date(student.statusDates.regular.date);

          if (
            trialDate < reportStartDate &&
            regularDate >= reportStartDate &&
            regularDate <= reportEndDate
          ) {
            trialToRegularCount++;
          }
        }
      }
    });

    const statusMetrics = {
      dropThisMonth: dropThisMonthCount,
      freezeThisMonth: freezeThisMonthCount,
      newTrialsThisMonth: trialThisMonthCount,
      trialToRegularThisMonth: trialToRegularCount,
      regularThisMonth: regularThisMonthCount,
    };

    // STEP 7: Return response
    return res.status(200).json({
      success: true,
      data: {
        reportPeriod: {
          startDate: reportStartDate,
          endDate: reportEndDate,
          generatedAt: now,
          generatedBy: "efm-pvt",
          formattedDateTime: "2025-07-04 07:46:42",
        },
        managersWithTeachers,
        classMetrics: {
          totalUniqueTeacherStudentSubjectCombinations:
            uniqueCombinations.length,
          classesByTeacher,
        },
        activeStudentSubjects: {
          total: totalActiveSubjects,
          quranSubjects: quranActiveSubjects,
          academicSubjects: academicActiveSubjects,
        },
        statusMetrics,
      },
    });
  } catch (error) {
    console.error("Error generating monthly analysis report:", error);
    return res.status(500).json({
      success: false,
      message: "Error generating monthly analysis report",
      error: error.message,
    });
  }
};
