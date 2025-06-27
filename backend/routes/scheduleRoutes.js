const express = require("express");
const router = express.Router();
const scheduleController = require("../controllers/scheduleController");
const auth = require("../middleware/auth");
const checkRole = require("../middleware/roleCheck");

router.post(
  "/create",
  auth,
  checkRole("admin", "supervisor_quran", "supervisor_subjects"),
  scheduleController.createSchedule
);

router.get(
  "/list",
  auth,
  checkRole("supervisor_quran", "supervisor_subjects"),
  scheduleController.getSchedulesForSupervisor
);

router.get(
  "/admin/list",
  auth,
  checkRole("admin"),
  scheduleController.getSchedulesForAdmin
);

router.put(
  "/update/:id",
  auth,
  checkRole("supervisor_quran", "supervisor_subjects", "admin"),
  scheduleController.updateSchedule
);

router.delete(
  "/delete/:id",
  auth,
  checkRole("admin"),
  scheduleController.deleteSchedule
);

router.get(
  "/teacher/my-schedule",
  auth,
  checkRole("teacher_quran", "teacher_subjects"),
  scheduleController.getTeacherSchedule
);

router.get(
  "/client/student-schedule",
  auth,
  checkRole("client"),
  scheduleController.getClientStudentsSchedule
);

router.post(
  "/available/:scheduleId",
  auth,
  checkRole("teacher_quran", "teacher_subjects"),
  scheduleController.teacherAvailable
);

router.post(
  "/start/:id",
  auth,
  checkRole("teacher_quran", "teacher_subjects"),
  scheduleController.startClass
);

router.post(
  "/end/:id",
  auth,
  checkRole("teacher_quran", "teacher_subjects"),
  scheduleController.endClass
);

router.put(
  "/lessons/:id",
  auth,
  checkRole("teacher_quran", "teacher_subjects"),
  scheduleController.updateLessons
);

// router.get(
//   "/admin/all",
//   auth,
//   checkRole("admin"),
//   scheduleController.getAllSchedulesForAdmin
// );

router.get(
  "/client/student-lessons",
  auth,
  checkRole("client"),
  scheduleController.getClientStudentLessonsBySubject
);

router.get(
  "/teacher/lessons",
  auth,
  checkRole("teacher_quran", "teacher_subjects"),
  scheduleController.getTeacherLessonsBySubject
);

router.get(
  "/admin/student-lessons",
  auth,
  checkRole("admin"),
  scheduleController.getAllStudentLessonsForAdmin
);

router.get(
  "/supervisor/student-lessons",
  auth,
  checkRole("supervisor_quran", "supervisor_subjects"),
  scheduleController.getAllStudentLessonsForSupervisor
);

router.get(
  "/teacher/student-lessons/:studentId/:subjectId",
  auth,
  checkRole("teacher_quran", "teacher_subjects"),
  scheduleController.getTeacherStudentLessons
);

router.get(
  "/client/student-lessons/:studentId/:teacherId/:subjectId",
  auth,
  checkRole("client"),
  scheduleController.getClientStudentLessons
);

router.get(
  "/:id",
  auth,
  checkRole(
    "admin",
    "supervisor_quran",
    "supervisor_subjects",
    "teacher_quran",
    "teacher_subjects",
    "client"
  ),
  scheduleController.getScheduleById
);

router.get(
  "/admin/timetable/today",
  auth,
  checkRole("admin"),
  scheduleController.getTodaysTimetableForAdmin
);

router.get(
  "/supervisor/timetable/today",
  auth,
  checkRole("supervisor_quran", "supervisor_subjects"),
  scheduleController.getTodaysTimetableForSupervisor
);

router.get(
  "/teacher-availability/:teacherId",
  auth,
  checkRole("admin", "supervisor_quran", "supervisor_subjects"),
  scheduleController.getTeacherAvailability
);

router.delete(
  "/delete-multiple",
  auth,
  checkRole("admin"),
  scheduleController.deleteMultipleSchedules
);

module.exports = router;
