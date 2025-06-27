const express = require("express");
const router = express.Router();
const supervisorController = require("../controllers/supervisorController");
const auth = require("../middleware/auth");
const checkRole = require("../middleware/roleCheck");

const isSupervisor = (req, res, next) => {
  if (!req.user.role.startsWith("supervisor_")) {
    return res.status(403).json({
      success: false,
      message: "Access denied. Only supervisors can access this resource.",
    });
  }
  next();
};

router.get(
  "/dashboard-stats",
  auth,
  isSupervisor,
  checkRole("supervisor_quran", "supervisor_subjects"),
  supervisorController.getSupervisorDashboardStats
);

router.get(
  "/quran-teachers",
  auth,
  checkRole("supervisor_quran"),
  supervisorController.getQuranTeachersForSupervisor
);

router.get(
  "/subject-teachers",
  auth,
  checkRole("supervisor_subjects"),
  supervisorController.getSubjectTeachersForSupervisor
);

router.get(
  "/students/quran",
  auth,
  checkRole("supervisor_quran"),
  supervisorController.getStudentsForQuranSupervisor
);

router.get(
  "/students/subjects",
  auth,
  checkRole("supervisor_subjects"),
  supervisorController.getStudentsForSubjectSupervisor
);
module.exports = router;
