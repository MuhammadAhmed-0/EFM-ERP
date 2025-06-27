const express = require("express");
const router = express.Router();
const studentAttendanceController = require("../controllers/studentAttendanceController");
const auth = require("../middleware/auth");
const checkRole = require("../middleware/roleCheck");

router.post(
  "/mark",
  auth,
  checkRole("teacher_quran", "teacher_subjects"),
  studentAttendanceController.markSingleAttendance
);

router.put(
  "/update/:attendanceId",
  auth,
  checkRole("teacher_quran", "teacher_subjects", "admin"),
  studentAttendanceController.updateSingleAttendance
);

router.get(
  "/client/view",
  auth,
  checkRole("client"),
  studentAttendanceController.getClientStudentAttendance
);

router.get(
  "/teacher-marked",
  auth,
  checkRole("teacher_quran", "teacher_subjects"),
  studentAttendanceController.getTeacherMarkedStudentAttendance
);

router.get(
  "/supervisor/view",
  auth,
  checkRole("supervisor_quran", "supervisor_subjects"),
  studentAttendanceController.getSupervisorStudentAttendance
);

router.get(
  "/admin/view",
  auth,
  checkRole("admin"),
  studentAttendanceController.getAllAttendanceForAdmin
);

router.delete(
  "/delete-multiple",
  auth,
  checkRole("admin"),
  studentAttendanceController.deleteMultipleStudentAttendance
);

module.exports = router;
