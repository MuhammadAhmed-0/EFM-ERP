const Client = require("../models/Client");
const Student = require("../models/Student");
const Schedule = require("../models/Schedule");
const FeeChalan = require("../models/FeeChalan");
const Announcement = require("../models/Announcement");
const MonthlyReport = require("../models/MonthlyReport");
const User = require("../models/User");
exports.getClientStudents = async (req, res) => {
  try {
    const clientUserId = req.user.id;

    const client = await Client.findOne({ user: clientUserId });
    if (!client) {
      return res.status(404).json({ msg: "Client not found" });
    }

    const students = await Student.find({ client: client.user })
      .populate("subjects", "name type")
      .lean();

    const studentUserIds = students.map((student) => student.user);

    const users = await User.find({ _id: { $in: studentUserIds } })
      .select("_id name email gender role enrollmentDate")
      .lean();

    const enrichedStudents = students.map((student) => {
      const user = users.find(
        (u) => u._id.toString() === student.user.toString()
      );
      return {
        ...student,
        user: user || null,
      };
    });

    return res.status(200).json({
      clientName: client.clientName,
      clientId: client.clientId,
      students: enrichedStudents,
    });
  } catch (error) {
    console.error("Error fetching client students:", error.message);
    return res
      .status(500)
      .json({ msg: "Server error while fetching students" });
  }
};

exports.getClientReports = async (req, res) => {
  try {
    if (req.user.role === "client" && req.user.id !== req.params.clientId) {
      return res.status(403).json({
        success: false,
        message: "Access denied. You can only view your own reports",
      });
    }

    const client = await Client.findOne({ user: req.params.clientId });
    if (!client) {
      return res.status(404).json({ message: "Client not found" });
    }

    const reports = await MonthlyReport.aggregate([
      {
        $match: { client: client.user },
      },
      {
        $lookup: {
          from: "users",
          localField: "teacher",
          foreignField: "_id",
          as: "teacher",
          pipeline: [{ $project: { name: 1 } }],
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
        $lookup: {
          from: "users",
          localField: "student",
          foreignField: "_id",
          as: "studentUser",
          pipeline: [
            { $project: { name: 1, email: 1, gender: 1, profilePicture: 1 } },
          ],
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
        $addFields: {
          teacher: { $arrayElemAt: ["$teacher", 0] },
          subject: { $arrayElemAt: ["$subject", 0] },
          student: {
            $mergeObjects: [
              { $arrayElemAt: ["$studentUser", 0] },
              { $arrayElemAt: ["$studentDoc", 0] },
            ],
          },
          studentNameFromUser: { $arrayElemAt: ["$studentUser.name", 0] },
        },
      },
      {
        $unset: ["studentUser", "studentDoc"],
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
    console.error("Error fetching client reports:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching client reports",
      error: error.message,
    });
  }
};

exports.getClientDashboardStats = async (req, res) => {
  try {
    const clientUserId = req.user.id;

    const currentDate = new Date();
    const pakistanOffset = 5;

    const startOfDay = new Date();
    startOfDay.setUTCHours(0 - pakistanOffset, 0, 0, 0);

    const endOfDay = new Date();
    endOfDay.setUTCHours(24 - pakistanOffset, 0, 0, 0);

    const pakistanDate = new Date(
      currentDate.getTime() + pakistanOffset * 60 * 60 * 1000
    );
    const currentMonth = pakistanDate.toLocaleString("default", {
      month: "long",
    });
    const currentYear = pakistanDate.getFullYear();

    const client = await Client.findOne({ user: clientUserId });
    if (!client) {
      return res
        .status(404)
        .json({ success: false, message: "Client not found" });
    }

    const clientStudents = await Student.find({ client: clientUserId })
      .select("user")
      .lean();

    const studentUserIds = clientStudents.map((student) => student.user);
    const studentUsers = await User.find({
      _id: { $in: studentUserIds },
      role: "student",
    })
      .select("_id name email isActive enrollmentDate")
      .lean();

    const unreadAnnouncements = await Announcement.countDocuments({
      $or: [{ "recipients.role": "client" }, { "recipients.role": "all" }],
      "readBy.user": { $ne: clientUserId },
    });

    const totalStudents = studentUsers.length;

    const enrollmentStats = {
      total: totalStudents,
      withEnrollmentDate: studentUsers.filter((user) => user.enrollmentDate)
        .length,
      withoutEnrollmentDate: studentUsers.filter((user) => !user.enrollmentDate)
        .length,
    };

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentEnrollments = studentUsers.filter((user) => {
      if (!user.enrollmentDate) return false;
      const enrollmentDate = new Date(user.enrollmentDate);
      return enrollmentDate >= thirtyDaysAgo;
    });
    const currentMonthFee = await FeeChalan.findOne({
      client: clientUserId,
      months: currentMonth,
      fromDate: {
        $gte: new Date(currentYear, pakistanDate.getMonth(), 1),
        $lte: new Date(currentYear, pakistanDate.getMonth() + 1, 0),
      },
    });

    const todayClasses = await Schedule.find({
      students: { $in: studentUserIds },
      classDate: {
        $gte: startOfDay,
        $lt: endOfDay,
      },
    });

    const classesStats = {
      total: todayClasses.length,
      pending: todayClasses.filter((c) => c.sessionStatus === "pending").length,
      inProgress: todayClasses.filter((c) => c.sessionStatus === "in_progress")
        .length,
      completed: todayClasses.filter((c) => c.sessionStatus === "completed")
        .length,
    };

    const studentsDetails = studentUsers.map((user) => {
      const studentRecord = clientStudents.find(
        (s) => s.user.toString() === user._id.toString()
      );
      return {
        studentId: studentRecord?._id,
        userId: user._id,
        name: user.name,
        enrollmentDate: user.enrollmentDate,
        isActive: user.isActive,
      };
    });
    const response = {
      success: true,
      stats: {
        unreadAnnouncements,
        students: enrollmentStats,
        recentEnrollments: recentEnrollments.length,
        currentMonthFee: {
          amount: currentMonthFee?.amount || 0,
          status: currentMonthFee?.status || "N/A",
          dueMonth: currentMonthFee?.dueMonth || currentMonth,
          currency: client.currency,
        },
        todayClasses: classesStats,
      },
      studentsDetails: studentsDetails,
    };
    return res.status(200).json(response);
  } catch (error) {
    console.error("❌ ERROR in getClientDashboardStats:", error);
    console.error("Error stack:", error.stack);
    return res.status(500).json({
      success: false,
      message: "Error fetching dashboard statistics",
      error: error.message,
    });
  }
};
