const User = require("../models/User");
const Student = require("../models/Student");
const Client = require("../models/Client");

const getNextStaffId = async () => {
  const lastUser = await User.findOne({
    role: {
      $in: [
        "teacher_quran",
        "teacher_subjects",
        "supervisor_quran",
        "supervisor_subjects",
        "admin",
      ],
    },
  })
    .sort({ staffId: -1 })
    .select("staffId");

  return lastUser ? lastUser.staffId + 1 : 1;
};

const getNextClientId = async () => {
  const lastClient = await Client.findOne()
    .sort({ createdAt: -1 })
    .select("clientId");

  if (!lastClient || !lastClient.clientId) return "efm1001";

  const number = parseInt(lastClient.clientId.replace("efm", ""), 10);
  const next = number + 1;

  return `efm${next}`;
};

const getNextStudentNumber = async (clientId) => {
  const count = await Student.countDocuments({ client: clientId });
  return count + 1;
};

const getNextGlobalStudentId = async () => {
  const lastStudent = await Student.findOne()
    .sort({ studentId: -1 })
    .select("studentId");
  return lastStudent ? lastStudent.studentId + 1 : 1;
};

module.exports = {
  getNextStaffId,
  getNextClientId,
  getNextStudentNumber,
  getNextGlobalStudentId,
};
