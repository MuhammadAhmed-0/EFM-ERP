const User = require("../models/User");
const Teacher = require("../models/Teacher");
const Student = require("../models/Student");
const Supervisor = require("../models/Supervisor");
const Schedule = require("../models/Schedule");
const Client = require("../models/Client");
const Subject = require("../models/Subject");
const mongoose = require("mongoose");

// Monthly Analysis Report Controller
exports.getMonthlyAnalysisReport = async (req, res) => {
  try {
    const { startDate, endDate, teacherId, supervisorId } = req.query;

    // Get current month date range if not specified
    const now = new Date();
    const reportStartDate = startDate
      ? new Date(startDate)
      : new Date(now.getFullYear(), now.getMonth(), 1);
    const reportEndDate = endDate
      ? new Date(endDate)
      : new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

    // PART 1: Get all teachers and supervisors for dropdown filters
    const teachers = await User.find({
      role: { $in: ["teacher_quran", "teacher_subjects"] },
      isActive: true,
    })
      .select("_id name role")
      .sort("name")
      .lean();

    const supervisors = await User.find({
      role: { $in: ["supervisor_quran", "supervisor_subjects"] },
      isActive: true,
    })
      .select("_id name role")
      .sort("name")
      .lean();

    // PART 2: Build filters based on user selection
    const scheduleQuery = {
      classDate: { $gte: reportStartDate, $lte: reportEndDate },
    };

    // Apply teacher filter if specified
    if (teacherId) {
      scheduleQuery.teacherId = mongoose.Types.ObjectId(teacherId);
    }

    // If supervisor filter is applied, find all teachers managed by that supervisor
    let teacherIds = [];
    let teachersUnderSupervisor = [];

    if (supervisorId) {
      teachersUnderSupervisor = await Teacher.find({
        manager: mongoose.Types.ObjectId(supervisorId),
      })
        .select("user name department")
        .populate("user", "name email")
        .lean();

      teacherIds = teachersUnderSupervisor.map((teacher) => teacher.user);

      if (teacherIds.length > 0) {
        scheduleQuery.teacherId = { $in: teacherIds };
      }
    }

    // PART 3: Get teacher-student class combinations
    const teacherStudentClasses = await Schedule.aggregate([
      { $match: scheduleQuery },
      { $unwind: "$students" },
      {
        $group: {
          _id: {
            teacherId: "$teacherId",
            teacherName: "$teacherName",
            studentId: "$students",
          },
          classCount: { $sum: 1 },
          classDates: { $addToSet: "$classDate" },
          subjectIds: { $addToSet: "$subject" },
          subjectNames: { $addToSet: "$subjectName" },
          subjectTypes: { $addToSet: "$subjectType" },
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
        $project: {
          teacherId: "$_id.teacherId",
          teacherName: "$_id.teacherName",
          studentId: "$_id.studentId",
          studentName: { $ifNull: ["$studentInfo.name", "Unknown Student"] },
          studentStatus: { $ifNull: ["$studentInfo.status", "unknown"] },
          studentClientName: {
            $ifNull: ["$studentInfo.clientName", "Unknown Client"],
          },
          subjectIds: 1,
          subjectNames: 1,
          subjectTypes: 1,
          classCount: 1,
          classDates: 1,
        },
      },
      {
        $sort: { teacherName: 1, studentName: 1 },
      },
    ]);

    // Group classes by teacher for easier frontend rendering
    const classesByTeacher = {};
    teacherStudentClasses.forEach((cls) => {
      if (!classesByTeacher[cls.teacherId]) {
        classesByTeacher[cls.teacherId] = {
          teacherId: cls.teacherId,
          teacherName: cls.teacherName,
          students: [],
          totalStudents: 0,
        };
      }

      classesByTeacher[cls.teacherId].students.push({
        studentId: cls.studentId,
        studentName: cls.studentName,
        studentStatus: cls.studentStatus,
        studentClientName: cls.studentClientName,
        subjectIds: cls.subjectIds,
        subjectNames: cls.subjectNames,
        subjectTypes: cls.subjectTypes,
        classCount: cls.classCount,
        classDates: cls.classDates,
      });

      classesByTeacher[cls.teacherId].totalStudents++;
    });

    // PART 4: Calculate active subjects count
    // Using the same approach as your frontend function

    // Get all students
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

    // Variables to count active subjects
    let totalActiveSubjects = 0;
    let quranActiveSubjects = 0;
    let academicActiveSubjects = 0;

    // Get active subjects for each student
    allStudents.forEach((student) => {
      // Get active subjects for this student (mimicking your frontend function)
      let activeSubjects = [];

      // Check if student has activeSubjectStats.activeSubjectDetails
      if (student.activeSubjectStats?.activeSubjectDetails) {
        activeSubjects = student.activeSubjectStats.activeSubjectDetails;
      }
      // Otherwise check if student has subjectStatus with active subjects
      else if (student.subjectStatus && student.subjectStatus.length > 0) {
        activeSubjects = student.subjectStatus
          .filter((status) => status.isActive === true)
          .map((status) => ({
            subjectId: status.subject._id || status.subject,
            subjectName: status.subject.name,
            subjectType: status.subject.type,
          }));
      }
      // Otherwise use assignedTeachers if available
      else if (
        student.assignedTeachers &&
        student.assignedTeachers.length > 0
      ) {
        activeSubjects = student.assignedTeachers
          .filter((assignment) => assignment.subject && assignment.subject._id)
          .map((assignment) => ({
            subjectId: assignment.subject._id._id || assignment.subject._id,
            subjectName: assignment.subject.name,
            subjectType: assignment.subject._id.type,
          }));
      }

      // Increment counters for each active subject
      activeSubjects.forEach((subject) => {
        totalActiveSubjects++;

        if (subject.subjectType === "quran") {
          quranActiveSubjects++;
        } else if (subject.subjectType === "subjects") {
          academicActiveSubjects++;
        }
      });
    });

    // PART 5: Get student status metrics
    // Find students whose final status at the end of month is what we're looking for

    // Get all students that had any status changes in this month
    const studentsWithStatusChanges = await Student.find({
      $or: [
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
      ],
    })
      .select("_id name clientName status statusDates statusDateHistory")
      .lean();

    // Process students to determine their final status at the end of the month
    const statusMetrics = {
      dropThisMonth: 0,
      freezeThisMonth: 0,
      newTrialsThisMonth: 0,
      trialToRegularThisMonth: 0,
      droppedStudents: [],
      freezedStudents: [],
      newTrialStudents: [],
      convertedStudents: [],
    };

    studentsWithStatusChanges.forEach((student) => {
      // Get all status changes for this student during the month, sorted by date
      const statusChanges = [];

      // Add all status changes that happened this month to the array
      if (
        student.statusDates.drop &&
        new Date(student.statusDates.drop.date) >= reportStartDate &&
        new Date(student.statusDates.drop.date) <= reportEndDate
      ) {
        statusChanges.push({
          status: "drop",
          date: new Date(student.statusDates.drop.date),
        });
      }

      if (
        student.statusDates.freeze &&
        new Date(student.statusDates.freeze.date) >= reportStartDate &&
        new Date(student.statusDates.freeze.date) <= reportEndDate
      ) {
        statusChanges.push({
          status: "freeze",
          date: new Date(student.statusDates.freeze.date),
        });
      }

      if (
        student.statusDates.trial &&
        new Date(student.statusDates.trial.date) >= reportStartDate &&
        new Date(student.statusDates.trial.date) <= reportEndDate
      ) {
        statusChanges.push({
          status: "trial",
          date: new Date(student.statusDates.trial.date),
        });
      }

      if (
        student.statusDates.regular &&
        new Date(student.statusDates.regular.date) >= reportStartDate &&
        new Date(student.statusDates.regular.date) <= reportEndDate
      ) {
        statusChanges.push({
          status: "regular",
          date: new Date(student.statusDates.regular.date),
        });
      }

      // Sort changes by date, newest first
      statusChanges.sort((a, b) => b.date - a.date);

      // The first item is the latest status change in the month
      if (statusChanges.length > 0) {
        const finalStatus = statusChanges[0].status;

        // Count based on the final status at month end
        if (finalStatus === "drop") {
          statusMetrics.dropThisMonth++;
          statusMetrics.droppedStudents.push({
            id: student._id,
            name: student.name,
            clientName: student.clientName,
            dropDate: statusChanges[0].date,
          });
        } else if (finalStatus === "freeze") {
          statusMetrics.freezeThisMonth++;
          statusMetrics.freezedStudents.push({
            id: student._id,
            name: student.name,
            clientName: student.clientName,
            freezeDate: statusChanges[0].date,
          });
        } else if (finalStatus === "trial") {
          // For trial, we only count if this is a new trial this month
          // (not someone who was already on trial before this month)
          const earlierTrialExists = student.statusDateHistory?.trial?.some(
            (record) => new Date(record.date) < reportStartDate
          );

          if (!earlierTrialExists) {
            statusMetrics.newTrialsThisMonth++;
            statusMetrics.newTrialStudents.push({
              id: student._id,
              name: student.name,
              clientName: student.clientName,
              trialDate: statusChanges[0].date,
            });
          }
        } else if (finalStatus === "regular") {
          // Check if this student converted from trial to regular this month
          const trialDateInHistory = student.statusDateHistory?.trial
            ?.map((record) => new Date(record.date))
            .sort((a, b) => b - a)[0]; // Get the latest trial date

          if (
            trialDateInHistory &&
            trialDateInHistory < statusChanges[0].date &&
            trialDateInHistory >= reportStartDate
          ) {
            // There was a trial status earlier this month, before regular
            statusMetrics.trialToRegularThisMonth++;
            statusMetrics.convertedStudents.push({
              id: student._id,
              name: student.name,
              clientName: student.clientName,
              trialDate: trialDateInHistory,
              conversionDate: statusChanges[0].date,
            });
          }
        }
      }
    });

    // Compile and return the complete report
    return res.status(200).json({
      success: true,
      data: {
        reportPeriod: {
          startDate: reportStartDate,
          endDate: reportEndDate,
          generatedAt: new Date(),
        },
        filterOptions: {
          teachers,
          supervisors,
        },
        appliedFilters: {
          teacherId: teacherId || null,
          supervisorId: supervisorId || null,
        },
        teachersUnderSupervisor,
        classMetrics: {
          totalUniqueTeacherStudentCombinations: teacherStudentClasses.length,
          classesByTeacher: Object.values(classesByTeacher),
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
