const express = require("express");
const router = express.Router();
const { check } = require("express-validator");
const authController = require("../controllers/authController");
const auth = require("../middleware/auth");
const checkRole = require("../middleware/roleCheck");

router.post("/login", authController.loginUser);

router.get("/me", auth, authController.getMe);
router.post("/register-super-admin", authController.registerFirstAdmin);

module.exports = router;
