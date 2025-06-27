const express = require("express");
const router = express.Router();
const staffAttendanceController = require("../controllers/staffAttendanceController");
const auth = require("../middleware/auth");
const checkRole = require("../middleware/roleCheck");
const upload = require("../middleware/uploadMiddleware");

router.post(
  "/mark",
  auth,
  checkRole("admin"),
  staffAttendanceController.markStaffAttendance
);

router.put(
  "/update/:attendanceId",
  auth,
  checkRole("admin"),
  staffAttendanceController.updateStaffAttendance
);

router.delete(
  "/delete-multiple",
  auth,
  checkRole("admin"),
  staffAttendanceController.deleteMultipleStaffAttendance
);

router.get(
  "/admin/view",
  auth,
  checkRole("admin"),
  staffAttendanceController.getAllStaffAttendance
);

router.get(
  "/own-view",
  auth,
  checkRole(
    "teacher_quran",
    "teacher_subjects",
    "supervisor_quran",
    "supervisor_subjects",
    "admin"
  ),
  staffAttendanceController.getOwnStaffAttendance
);

router.get(
  "/supervisor/view-teachers",
  auth,
  checkRole("supervisor_quran", "supervisor_subjects"),
  staffAttendanceController.getTeachersAttendanceForSupervisor
);

router.post(
  "/upload-attendance",
  auth,
  checkRole("admin"),
  upload.single("file"),
  staffAttendanceController.uploadAttendanceFromCSV
);

module.exports = router;
