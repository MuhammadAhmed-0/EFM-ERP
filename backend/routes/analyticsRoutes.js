const express = require("express");
const analyticsController = require("../controllers/analyticsController");
const auth = require("../middleware/auth");
const checkRole = require("../middleware/roleCheck");
const router = express.Router();
router.get(
  "/monthly-report",
  auth,
  checkRole("admin"),
  analyticsController.getMonthlyAnalysisReport
);

module.exports = router;
