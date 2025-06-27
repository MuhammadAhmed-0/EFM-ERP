const express = require("express");
const router = express.Router();
const subjectController = require("../controllers/subjectController");
const auth = require("../middleware/auth");
const checkRole = require("../middleware/roleCheck");

const allowedRoles = ["admin", "supervisor_quran", "supervisor_subjects"];

router.get("/view", auth, subjectController.getSubjects);
router.get("/view/:id", auth, subjectController.getSubjectById);

router.post(
  "/add",
  auth,
  checkRole(...allowedRoles),
  subjectController.addSubject
);
router.put(
  "/update/:id",
  auth,
  checkRole(...allowedRoles),
  subjectController.updateSubject
);
router.delete(
  "/delete/:id",
  auth,
  checkRole(...allowedRoles),
  subjectController.deleteSubject
);
router.get(
  "/supervisor/view",
  auth,
  checkRole("supervisor_quran", "supervisor_subjects"),
  subjectController.getSupervisorSubjects
);
module.exports = router;
