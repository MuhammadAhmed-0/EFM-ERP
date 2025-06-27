const express = require("express");
const router = express.Router();
const adminController = require("../controllers/adminController");
const auth = require("../middleware/auth");
const checkRole = require("../middleware/roleCheck");

router.post("/users", auth, checkRole("admin"), adminController.addUser);
router.put(
  "/users/:userId",
  auth,
  checkRole("admin"),
  adminController.updateUser
);

router.get("/users", auth, checkRole("admin"), adminController.getAllUsers);
router.get(
  "/users/:role",
  auth,
  checkRole("admin"),
  adminController.getUsersByRole
);
router.post(
  "/fees/challan/:userId",
  auth,
  checkRole("admin"),
  adminController.generateFeeChallan
);
router.post(
  "/fees/challan/:challanId/payment",
  auth,
  checkRole("admin"),
  adminController.addPaymentToChalan
);
router.put(
  "/fees/challan/:challanId",
  auth,
  checkRole("admin"),
  adminController.updateFeeChallan
);
router.post(
  "/salary/:userId",
  auth,
  checkRole("admin"),
  adminController.generateSalaryInvoice
);
router.delete(
  "/fees/challan/:challanId",
  auth,
  checkRole("admin"),
  adminController.deleteFeeChallan
);
router.put(
  "/salary/:invoiceId",
  auth,
  checkRole("admin"),
  adminController.updateSalaryInvoice
);
router.patch(
  "/salary/mark-all-paid",
  auth,
  checkRole("admin"),
  adminController.markAllSalariesPaid
);
router.delete(
  "/salary/:invoiceId",
  auth,
  checkRole("admin"),
  adminController.deleteSalaryInvoice
);

router.get(
  "/clients-with-students",
  auth,
  checkRole("admin"),
  adminController.getAllClientsWithStudents
);

router.get(
  "/dashboard-stats",
  auth,
  checkRole("admin"),
  adminController.getDashboardStats
);

router.patch(
  "/:studentId/subjects/:subjectId/deactivate",
  auth,
  checkRole("admin"),
  adminController.deactivateStudentSubject
);

router.patch(
  "/:studentId/subjects/:subjectId/reactivate",
  auth,
  checkRole("admin"),
  adminController.reactivateStudentSubject
);

router.get(
  "/:studentId/subject-history",
  auth,
  checkRole("admin"),
  adminController.getStudentSubjectHistory
);

router.get(
  "/:studentId/active-subjects",
  auth,
  checkRole("admin"),
  adminController.getActiveSubjects
);

router.get(
  "/:studentId/subjects/:subjectId/history",
  auth,
  checkRole("admin"),
  async (req, res) => {
    req.query.subjectId = req.params.subjectId;
    return getStudentSubjectHistory(req, res);
  }
);

router.put(
  "/teachers/:teacherId/toggle-status",
  auth,
  checkRole("admin"),
  adminController.toggleTeacherStatus
);

router.put(
  "/supervisors/:supervisorId/toggle-status",
  auth,
  checkRole("admin"),
  adminController.toggleSupervisorStatus
);

router.put(
  "/clients/:clientId/toggle-status",
  auth,
  checkRole("admin"),
  adminController.toggleClientStatus
);

router.get(
  "/without-managers",
  auth,
  checkRole("admin"),
  adminController.getTeachersWithoutManagers
);

router.put(
  "/assign-manager",
  auth,
  checkRole("admin"),
  adminController.assignManagerToTeachers
);

module.exports = router;
