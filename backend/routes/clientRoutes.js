const express = require("express");
const router = express.Router();
const { check } = require("express-validator");
const clientController = require("../controllers/clientController");
const auth = require("../middleware/auth");
const checkRole = require("../middleware/roleCheck");

router.get(
  "/dashboard-stats",
  auth,
  checkRole("client"),
  clientController.getClientDashboardStats
);

router.get(
  "/students",
  auth,
  checkRole("client"),
  clientController.getClientStudents
);
router.get(
  "/student-report/:clientId",
  auth,
  checkRole("client"),
  clientController.getClientReports
);

module.exports = router;
