const FeeChalan = require("../models/FeeChalan");
const Teacher = require("../models/Teacher");
const Client = require("../models/Client");
const Student = require("../models/Student");
const User = require("../models/User");
const SalaryInvoice = require("../models/SalaryInvoice");
const mongoose = require("mongoose");

exports.getClientOwnChallans = async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;
    const { month } = req.query;

    if (userRole !== "client") {
      return res
        .status(403)
        .json({ msg: "Only clients can access this route" });
    }

    const client = await Client.findOne({ user: userId });
    if (!client) {
      return res.status(404).json({ msg: "Client profile not found." });
    }

    const filter = { client: userId };

    if (month) {
      filter.dueMonth = new RegExp(`^${month}$`, "i");
    }

    const challans = await FeeChalan.find(filter)
      .populate("client", "name email")
      .populate("paymentHistory.receivedBy", "name")
      .sort({
        issueDate: -1,
      });

    const enrichedChallans = [];

    for (const challan of challans) {
      const clientData = await Client.findOne({
        user: challan.client._id || challan.client,
      });

      const totalPaidAmount =
        challan.paymentHistory?.reduce(
          (sum, payment) => sum + (payment.amount || 0),
          0
        ) || 0;
      const pendingAmount = Math.max(0, challan.amount - totalPaidAmount);

      let paymentStatus = "pending";
      if (totalPaidAmount >= challan.amount) {
        paymentStatus = "fully_paid";
      } else if (totalPaidAmount > 0) {
        paymentStatus = "partially_paid";
      }

      enrichedChallans.push({
        ...challan.toObject(),
        clientMainId: clientData?.clientId || "N/A",
        clientName: challan.client?.name || challan.clientName,
        clientEmail: challan.client?.email || "N/A",
        totalPaidAmount,
        pendingAmount,
        paymentStatus,
        paymentHistory:
          challan.paymentHistory?.map((payment) => ({
            ...payment.toObject(),
            receivedByName: payment.receivedBy?.name || "Unknown",
          })) || [],
      });
    }

    res.status(200).json({
      msg: "Your fee challans",
      totalChallans: challans.length || 0,
      challans: enrichedChallans,
    });
  } catch (err) {
    console.error("getClientOwnChallans error:", err.message);
    res
      .status(500)
      .json({ msg: "Server error while fetching client challans" });
  }
};

exports.getAllChallans = async (req, res) => {
  try {
    const userRole = req.user.role;
    const { clientId, status, month } = req.query;

    if (userRole !== "admin") {
      return res.status(403).json({ msg: "Only admin can access this route" });
    }

    const filter = {};

    if (clientId) {
      if (!mongoose.Types.ObjectId.isValid(clientId)) {
        return res.status(400).json({ msg: "Invalid clientId format" });
      }

      const clientUser = await User.findById(clientId);
      if (!clientUser || clientUser.role !== "client") {
        return res
          .status(404)
          .json({ msg: "User with provided ID is not a client" });
      }

      filter.client = clientId;
    }

    if (status) {
      filter.status = status;
    }

    if (month) {
      filter.dueMonth = { $regex: `^${month}$`, $options: "i" };
    }

    const challans = await FeeChalan.find(filter)
      .populate("client", "name email isActive phoneNumber") 
      .populate("paymentHistory.receivedBy", "name")
      .sort({
        status: 1,
        issueDate: -1,
      });

    const enrichedChallans = [];

    for (const challan of challans) {
      const clientData = await Client.findOne({
        user: challan.client._id || challan.client,
      });

      const totalPaidAmount =
        challan.paymentHistory?.reduce(
          (sum, payment) => sum + (payment.amount || 0),
          0
        ) || 0;
      const pendingAmount = Math.max(0, challan.amount - totalPaidAmount);

      let paymentStatus = "pending";
      if (totalPaidAmount >= challan.amount) {
        paymentStatus = "fully_paid";
      } else if (totalPaidAmount > 0) {
        paymentStatus = "partially_paid";
      }

      const userPhoneNumber = challan.client?.phoneNumber || null;
      const clientContactNo = clientData?.contactNo || null;

      const primaryPhoneNumber = clientContactNo || userPhoneNumber || "N/A";

      enrichedChallans.push({
        ...challan.toObject(),
        clientMainId: clientData?.clientId || "N/A",
        clientName: challan.client?.name || challan.clientName,
        clientEmail: challan.client?.email || "N/A",
        clientIsActive: challan.client?.isActive !== false,
        clientPhoneNumber: primaryPhoneNumber,
        clientContactDetails: {
          userPhoneNumber: userPhoneNumber,
          clientContactNo: clientContactNo,
          primaryPhone: primaryPhoneNumber,
        },
        totalPaidAmount,
        pendingAmount,
        paymentStatus,
        paymentHistory:
          challan.paymentHistory?.map((payment) => ({
            ...payment.toObject(),
            receivedByName: payment.receivedBy?.name || "Unknown",
          })) || [],
      });
    }

    res.status(200).json({
      msg: "Client fee challans fetched successfully",
      totalChallans: challans.length,
      challans: enrichedChallans,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error(
      "❌ getAllChallans error by hammas-coding at 2025-06-23 04:21:14:",
      err.message
    );
    res.status(500).json({ msg: "Server error while fetching challans" });
  }
};
exports.getChallanDetails = async (req, res) => {
  try {
    const { challanId } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    if (userRole !== "admin") {
      return res.status(403).json({ msg: "Only admin can access this route" });
    }

    if (!mongoose.Types.ObjectId.isValid(challanId)) {
      return res.status(400).json({ msg: "Invalid challan ID format" });
    }

    const challan = await FeeChalan.findById(challanId)
      .populate("client", "name email")
      .populate("paymentHistory.receivedBy", "name");

    if (!challan) {
      return res.status(404).json({ msg: "Challan not found" });
    }

    const client = await Client.findOne({
      user: challan.client._id || challan.client,
    });
    if (!client) {
      return res.status(404).json({ msg: "Client not found" });
    }

    const totalPaidAmount =
      challan.paymentHistory?.reduce(
        (sum, payment) => sum + (payment.amount || 0),
        0
      ) || 0;
    const pendingAmount = Math.max(0, challan.amount - totalPaidAmount);

    let paymentStatus = "pending";
    if (totalPaidAmount >= challan.amount) {
      paymentStatus = "fully_paid";
    } else if (totalPaidAmount > 0) {
      paymentStatus = "partially_paid";
    }

    const currentDate = new Date();
    const dueDate = new Date(challan.toDate);
    const isOverdue = currentDate > dueDate && pendingAmount > 0;

    const responseData = {
      _id: challan._id,
      client: {
        _id: challan.client._id,
        name: challan.client.name,
        email: challan.client.email,
        clientId: client.clientId || "N/A",
      },
      clientName: client.clientName || challan.client.name || "N/A",
      clientMainId: client.clientId || "N/A",
      clientEmail: challan.client.email || "N/A",
      clientCurrency: challan.clientCurrency || "USD",
      country: client.country || "N/A",
      state: client.state || "N/A",
      totalStudents: client.numberOfStudents || 0,

      amount: challan.amount || 0,
      basicFee: challan.basicFee || challan.amount || 0,
      totalPaidAmount,
      pendingAmount,
      paymentStatus,

      months: challan.months || [],
      dueMonth: challan.dueMonth || "N/A",
      fromDate: challan.fromDate ? challan.fromDate.toISOString() : null,
      toDate: challan.toDate ? challan.toDate.toISOString() : null,
      issueDate: challan.issueDate
        ? challan.issueDate.toISOString()
        : challan.createdAt.toISOString(),

      status: challan.status || "pending",
      isOverdue,
      remarks: challan.remarks || "",

      trialStartedDate: client.statusDates?.trial?.date
        ? client.statusDates.trial.date.toISOString()
        : null,
      regularJoiningDate: client.statusDates?.regular?.date
        ? client.statusDates.regular.date.toISOString()
        : null,

      paymentHistory:
        challan.paymentHistory?.map((payment) => ({
          _id: payment._id,
          amount: payment.amount,
          date: payment.date.toISOString(),
          method: payment.method,
          transactionId: payment.transactionId || "",
          remarks: payment.remarks || "",
          receivedBy: payment.receivedBy?._id,
          receivedByName: payment.receivedBy?.name || "Unknown",
        })) || [],

      monthlyFee: challan.basicFee || challan.amount || 0,
      feeForCurrentMonth: challan.amount || 0,
      totalFee: challan.amount || 0,

      createdAt: challan.createdAt.toISOString(),
      updatedAt: challan.updatedAt.toISOString(),
    };

    res.status(200).json({
      msg: "Challan details fetched successfully",
      data: responseData,
    });
  } catch (err) {
    console.error("Error in getChallanDetails:", err.message);
    res.status(500).json({
      msg: "Server error while fetching challan details",
      error: process.env.NODE_ENV === "development" ? err.message : undefined,
    });
  }
};

exports.getAllSalaryInvoices = async (req, res) => {
  try {
    const userRole = req.user.role;

    if (userRole !== "admin") {
      return res.status(403).json({ msg: "Only admin can access this route" });
    }

    const { role, month, status, userId } = req.query;
    const filter = {};

    if (role) filter.role = role;
    if (month) filter.month = { $regex: `^${month}$`, $options: "i" };
    if (status) filter.status = status;

    if (userId) {
      const user = await User.findById(userId);
      if (!user) {
        return res
          .status(404)
          .json({ msg: "User with provided userId not found" });
      }

      const validRoles = ["teacher", "supervisor_quran", "supervisor_subjects"];
      if (!validRoles.includes(user.role)) {
        return res.status(400).json({
          msg: "Provided ID does not belong to a teacher or supervisor",
        });
      }

      filter.user = userId;
    }

    const invoices = await SalaryInvoice.find(filter)
      .populate("user", "name email role staffId")
      .populate("processedBy", "name")
      .sort({ paymentDate: -1 });

    res.status(200).json({
      msg: "All salary invoices fetched successfully",
      count: invoices.length,
      invoices,
    });
  } catch (err) {
    console.error("getAllSalaryInvoices error:", err.message);
    res
      .status(500)
      .json({ msg: "Server error while fetching salary invoices" });
  }
};

exports.getOwnSalaryInvoices = async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;
    const { month } = req.query;

    const allowedRoles = [
      "teacher_quran",
      "teacher_subjects",
      "supervisor_quran",
      "supervisor_subjects",
    ];

    if (!allowedRoles.includes(userRole)) {
      return res
        .status(403)
        .json({ msg: "Only teachers or supervisors can access this route" });
    }
    const filter = {
      user: userId,
      role: userRole,
    };

    if (month) {
      filter.month = new RegExp(`^${month}$`, "i");
    }
    const invoices = await SalaryInvoice.find({
      user: userId,
      role: userRole,
    })
      .populate("processedBy", "name email role")
      .sort({ paymentDate: -1 });

    res.status(200).json({
      msg: "Your salary invoices",
      invoices,
    });
  } catch (err) {
    console.error("getOwnSalaryInvoices error:", err.message);
    res
      .status(500)
      .json({ msg: "Server error while fetching salary invoices" });
  }
};

exports.getSalaryInvoiceDetails = async (req, res) => {
  try {
    const { invoiceId } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    if (userRole !== "admin") {
      return res.status(403).json({ msg: "Only admin can access this route" });
    }

    if (!mongoose.Types.ObjectId.isValid(invoiceId)) {
      return res.status(400).json({ msg: "Invalid invoice ID format" });
    }

    const salaryInvoice = await SalaryInvoice.findById(invoiceId)
      .populate({
        path: "user",
        select: "_id name email role",
      })
      .populate({
        path: "processedBy",
        select: "_id name __t",
      })
      .populate({
        path: "bonus.approvedBy",
        select: "_id name __t",
      });

    if (!salaryInvoice) {
      return res.status(404).json({ msg: "Salary invoice not found" });
    }

    const responseData = {
      _id: salaryInvoice._id,
      user: {
        _id: salaryInvoice.user._id,
        name: salaryInvoice.user.name,
        email: salaryInvoice.user.email,
        role: salaryInvoice.user.role,
      },
      userName: salaryInvoice.userName,
      role: salaryInvoice.role,
      amount: salaryInvoice.amount,
      bonus: {
        amount: salaryInvoice.bonus.amount,
        reason: salaryInvoice.bonus.reason,
        approvedBy: salaryInvoice.bonus.approvedBy._id,
      },
      month: salaryInvoice.month,
      status: salaryInvoice.status,
      deduction: salaryInvoice.deduction,
      totalLeaves: salaryInvoice.totalLeaves,
      paymentDate: salaryInvoice.paymentDate,
      remarks: salaryInvoice.remarks,
      processedBy: {
        _id: salaryInvoice.processedBy._id,
        name: salaryInvoice.processedBy.name,
        __t: salaryInvoice.processedBy.__t,
      },
      studentBonus: salaryInvoice.studentBonus,
      refBonus: salaryInvoice.refBonus,
      advancedSalary: salaryInvoice.advancedSalary,
      absentFine: salaryInvoice.absentFine,
      approvedLeave: salaryInvoice.approvedLeave,
      biometricFine: salaryInvoice.biometricFine,
      finePerMinute: salaryInvoice.finePerMinute,
      lateMinutes: salaryInvoice.lateMinutes,
      netSalary: salaryInvoice.netSalary,
      createdAt: salaryInvoice.createdAt,
      updatedAt: salaryInvoice.updatedAt,
    };

    res.status(200).json({
      msg: "Salary invoice details fetched successfully",
      data: responseData,
    });
  } catch (err) {
    console.error("Error in getSalaryInvoiceDetails:", err.message);
    res
      .status(500)
      .json({ msg: "Server error while fetching salary invoice details" });
  }
};

exports.getOwnSalaryInvoiceDetails = async (req, res) => {
  try {
    const { invoiceId } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    const allowedRoles = [
      "teacher_quran",
      "teacher_subjects",
      "supervisor_quran",
      "supervisor_subjects",
    ];

    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({
        msg: "Only teachers or supervisors can access this route",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(invoiceId)) {
      return res.status(400).json({ msg: "Invalid invoice ID format" });
    }

    const salaryInvoice = await SalaryInvoice.findOne({
      _id: invoiceId,
      user: userId,
      role: userRole,
    })
      .populate({
        path: "user",
        select: "_id name email role",
      })
      .populate({
        path: "processedBy",
        select: "_id name __t",
      })
      .populate({
        path: "bonus.approvedBy",
        select: "_id name __t",
      });

    if (!salaryInvoice) {
      return res.status(404).json({ msg: "Salary invoice not found" });
    }

    const responseData = {
      _id: salaryInvoice._id,
      user: {
        _id: salaryInvoice.user._id,
        name: salaryInvoice.user.name,
        email: salaryInvoice.user.email,
        role: salaryInvoice.user.role,
      },
      userName: salaryInvoice.userName,
      role: salaryInvoice.role,
      amount: salaryInvoice.amount,
      bonus: {
        amount: salaryInvoice.bonus.amount,
        reason: salaryInvoice.bonus.reason,
        approvedBy: salaryInvoice.bonus.approvedBy._id,
      },
      month: salaryInvoice.month,
      status: salaryInvoice.status,
      deduction: salaryInvoice.deduction,
      totalLeaves: salaryInvoice.totalLeaves,
      paymentDate: salaryInvoice.paymentDate,
      remarks: salaryInvoice.remarks,
      processedBy: {
        _id: salaryInvoice.processedBy._id,
        name: salaryInvoice.processedBy.name,
        __t: salaryInvoice.processedBy.__t,
      },
      studentBonus: salaryInvoice.studentBonus,
      refBonus: salaryInvoice.refBonus,
      advancedSalary: salaryInvoice.advancedSalary,
      absentFine: salaryInvoice.absentFine,
      approvedLeave: salaryInvoice.approvedLeave,
      biometricFine: salaryInvoice.biometricFine,
      lateMinutes: salaryInvoice.lateMinutes,
      netSalary: salaryInvoice.netSalary,
      createdAt: salaryInvoice.createdAt,
      updatedAt: salaryInvoice.updatedAt,
    };

    res.status(200).json({
      msg: "Salary invoice details fetched successfully",
      data: responseData,
    });
  } catch (err) {
    console.error("Error in getOwnSalaryInvoiceDetails:", err.message);
    res.status(500).json({
      msg: "Server error while fetching salary invoice details",
    });
  }
};

exports.getClientOwnChallanDetails = async (req, res) => {
  try {
    const { challanId } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    if (userRole !== "client" && userRole !== "admin") {
      return res.status(403).json({
        msg: "Only clients and admins can access this route",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(challanId)) {
      return res.status(400).json({
        msg: "Invalid challan ID format",
      });
    }

    const query = {
      _id: challanId,
    };

    if (userRole === "client") {
      query.client = userId;
    }

    const challan = await FeeChalan.findOne(query)
      .populate("client", "name email")
      .populate("paymentHistory.receivedBy", "name");

    if (!challan) {
      return res.status(404).json({
        msg: "Fee challan not found",
      });
    }

    const client = await Client.findOne({
      user: challan.client._id || challan.client,
    });

    if (!client) {
      return res.status(404).json({ msg: "Client not found" });
    }

    const totalPaidAmount =
      challan.paymentHistory?.reduce(
        (sum, payment) => sum + (payment.amount || 0),
        0
      ) || 0;
    const pendingAmount = Math.max(0, challan.amount - totalPaidAmount);

    let paymentStatus = "pending";
    if (totalPaidAmount >= challan.amount) {
      paymentStatus = "fully_paid";
    } else if (totalPaidAmount > 0) {
      paymentStatus = "partially_paid";
    }

    const currentDate = new Date();
    const dueDate = new Date(challan.toDate);
    const isOverdue = currentDate > dueDate && pendingAmount > 0;

    const responseData = {
      _id: challan._id,
      client: {
        _id: challan.client._id,
        name: challan.client.name,
        email: challan.client.email,
        clientId: client.clientId || "N/A",
      },
      clientName: client.clientName || challan.client.name || "N/A",
      clientMainId: client.clientId || "N/A",
      clientEmail: challan.client.email || "N/A",
      clientCurrency: challan.clientCurrency || "USD",
      country: client.country || "N/A",
      state: client.state || "N/A",
      totalStudents: client.numberOfStudents || 0,

      amount: challan.amount || 0,
      basicFee: challan.basicFee || challan.amount || 0,
      totalPaidAmount,
      pendingAmount,
      paymentStatus,

      months: Array.isArray(challan.months) ? challan.months : [],
      dueMonth: challan.dueMonth || "N/A",
      fromDate: challan.fromDate ? challan.fromDate.toISOString() : null,
      toDate: challan.toDate ? challan.toDate.toISOString() : null,
      issueDate: challan.issueDate
        ? challan.issueDate.toISOString()
        : challan.createdAt.toISOString(),

      status: challan.status || "pending",
      isOverdue,
      remarks: challan.remarks || "",

      trialStartedDate: client.statusDates?.trial?.date
        ? client.statusDates.trial.date.toISOString()
        : null,
      regularJoiningDate: client.statusDates?.regular?.date
        ? client.statusDates.regular.date.toISOString()
        : null,

      paymentHistory:
        challan.paymentHistory?.map((payment) => ({
          _id: payment._id,
          amount: payment.amount,
          date: payment.date.toISOString(),
          method: payment.method,
          transactionId: payment.transactionId || "",
          remarks: payment.remarks || "",
          receivedBy: payment.receivedBy?._id,
          receivedByName: payment.receivedBy?.name || "Unknown",
        })) || [],

      paymentDetails:
        challan.status === "paid" || paymentStatus === "fully_paid"
          ? {
              paymentMethod:
                challan.paymentMethod ||
                (challan.paymentHistory && challan.paymentHistory.length > 0
                  ? challan.paymentHistory[challan.paymentHistory.length - 1]
                      .method
                  : "N/A"),
              transactionId:
                challan.transactionId ||
                (challan.paymentHistory && challan.paymentHistory.length > 0
                  ? challan.paymentHistory[challan.paymentHistory.length - 1]
                      .transactionId
                  : "N/A"),
              paymentDate: challan.paymentDate
                ? challan.paymentDate.toISOString()
                : challan.paymentHistory && challan.paymentHistory.length > 0
                ? challan.paymentHistory[
                    challan.paymentHistory.length - 1
                  ].date.toISOString()
                : null,
              amountPaid: totalPaidAmount,
            }
          : null,

      monthlyFee: challan.basicFee || challan.amount || 0,
      feeForCurrentMonth: challan.amount || 0,
      totalFee: challan.amount || 0,
      createdAt: challan.createdAt.toISOString(),
      updatedAt: challan.updatedAt.toISOString(),
    };

    res.status(200).json({
      msg: "Fee challan details fetched successfully",
      data: responseData,
    });
  } catch (err) {
    console.error("Error in getClientOwnChallanDetails:", err.message);
    res.status(500).json({
      msg: "Server error while fetching fee challan details",
      error: process.env.NODE_ENV === "development" ? err.message : undefined,
    });
  }
};
