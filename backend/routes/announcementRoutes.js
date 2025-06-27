const express = require("express");
const router = express.Router();
const announcementController = require("../controllers/announcementController");
const auth = require("../middleware/auth");
const checkRole = require("../middleware/roleCheck");

router.post(
  "/add",
  auth,
  checkRole("admin"),
  announcementController.createAnnouncement
);

router.get("/view", auth, announcementController.getAnnouncements);

router.put(
  "/update/:id",
  auth,
  checkRole("admin"),
  announcementController.updateAnnouncement
);

router.delete(
  "/delete/:id",
  auth,
  checkRole("admin"),
  announcementController.deleteAnnouncement
);

router.post(
  "/mark-read/:announcementId",
  auth,
  announcementController.markAsRead
);
router.get("/unread-count", auth, announcementController.getUnreadCount);

// Query Routes
router.post("/query/create", auth, announcementController.createRoleQuery);

router.get(
  "/queries",
  auth,
  checkRole("admin"),
  announcementController.getQueries
);

router.get("/my-queries", auth, announcementController.getMyQueries);

router.post(
  "/query/respond/:queryId",
  auth,
  checkRole("admin"),
  announcementController.respondToQuery
);

router.delete(
  "/queries/delete-multiple",
  auth,
  checkRole("admin"),
  announcementController.deleteMultipleQueries
);

module.exports = router;
