const express = require("express");
const router = express.Router();
const teacherController = require("../controllers/teacherController");
const auth = require("../middleware/auth");
const checkRole = require("../middleware/roleCheck");

router.get(
  "/their-students",
  auth,
  checkRole("teacher_quran", "teacher_subjects"),
  teacherController.getAssignedStudentsForTeacher
);

router.post(
  "/create-report",
  auth,
  checkRole("teacher_quran", "teacher_subjects"),
  teacherController.createOrUpdateMonthlyReport
);

router.get(
  "/get-report/:id",
  auth,
  checkRole("teacher_quran", "teacher_subjects", "client"),
  teacherController.getMonthlyReport
);

router.get(
  "/all-student-reports",
  auth,
  checkRole("teacher_quran", "teacher_subjects"),
  teacherController.getTeacherReports
);

router.get(
  "/dashboard-stats",
  auth,
  checkRole("teacher_quran", "teacher_subjects"),
  teacherController.getDashboardStats
);
// Get all reports created by a teacher
// router.get("/teacher/:teacherId", getTeacherReports);
module.exports = router;
