const User = require("../models/User");
const Client = require("../models/Client");
const Student = require("../models/Student");
const Teacher = require("../models/Teacher");
const Supervisor = require("../models/Supervisor");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { validationResult } = require("express-validator");
const Admin = require("../models/Admin");
const { getNextStaffId } = require("../helpers/idGenerators");

exports.loginUser = async (req, res) => {
  const { email, password, clientId } = req.body;
  const loginTimestamp = new Date().toISOString();

  try {
    let user;
    let client;

    if (email) {
      user = await User.findOne({ email });
    }

    if (!user && clientId) {
      client = await Client.findOne({ clientId }).populate("user");
      if (client) {
        user = client.user;
      }
    }

    if (!user) {
      console.log(
        `Failed login attempt at ${loginTimestamp} - Invalid credentials (${
          email || clientId
        })`
      );
      return res.status(400).json({ msg: "Invalid credentials" });
    }

    if (!password) {
      console.log(
        `Failed login attempt at ${loginTimestamp} - No password provided for user ${user.email}`
      );
      return res.status(400).json({ msg: "Password is required" });
    }

    if (user.role === "student") {
      console.log(
        `Failed login attempt at ${loginTimestamp} - Student login attempted for ${user.email}`
      );
      return res
        .status(403)
        .json({ msg: "Students are not allowed to log in." });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      console.log(
        `Failed login attempt at ${loginTimestamp} - Invalid password for ${user.email}`
      );
      return res.status(400).json({ msg: "Invalid credentials" });
    }

    // CHECK 1: Account Active Status
    if (!user.isActive) {
      console.log(
        `Failed login attempt at ${loginTimestamp} - Inactive account ${user.email}`
      );
      return res.status(401).json({
        msg: "Account is inactive. Please contact administrator.",
        code: "ACCOUNT_DEACTIVATED",
      });
    }

    // CHECK 2: Portal Access for Teachers and Supervisors
    if (
      [
        "teacher_quran",
        "teacher_subjects",
        "supervisor_quran",
        "supervisor_subjects",
      ].includes(user.role)
    ) {
      if (user.portalAccess === false) {
        console.log(
          `Failed login attempt at ${loginTimestamp} - Portal access denied for ${user.email} (${user.role})`
        );
        return res.status(403).json({
          msg: "Portal access has been disabled. Please contact administrator.",
          code: "PORTAL_ACCESS_DENIED",
          deactivatedAt: user.lastDeactivatedAt,
          reason: user.deactivationReason || "Access disabled by administrator",
        });
      }
    }

    if (user.role === "client" && !client) {
      client = await Client.findOne({ user: user._id });
    }

    const payload = {
      user: {
        id: user.id,
        role: user.role,
        email: user.email,
        loginTime: loginTimestamp,
      },
    };

    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: "24h" },
      (err, token) => {
        if (err) throw err;

        console.log(
          `Successful login at ${loginTimestamp} - ${user.email} (${
            user.role
          }) - Portal access: ${
            user.portalAccess !== false ? "ENABLED" : "DISABLED"
          }`
        );

        res.json({
          token,
          user: {
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            gender: user.gender,
            isActive: user.isActive,
            portalAccess: user.portalAccess !== false, // Add portal access status
            clientId: client?.clientId,
            clientStatus: client?.status,
          },
          meta: {
            loginTimestamp,
            expiresIn: "24h",
            lastLogin: user.lastLogin || null,
          },
          result: "Logged In Successfully!",
        });

        User.findByIdAndUpdate(user._id, {
          lastLogin: loginTimestamp,
          lastLoginIP: req.ip,
        }).catch((err) => console.error("Error updating last login:", err));
      }
    );
  } catch (err) {
    console.error(`Error in loginUser at ${loginTimestamp}:`, err.message);
    res.status(500).json({
      msg: "Server error",
      timestamp: loginTimestamp,
    });
  }
};

exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    if (!user) {
      return res.status(404).json({ msg: "User not found" });
    }

    let roleData = null;

    switch (user.role) {
      case "student":
        roleData = await Student.findOne({ user: user._id }).populate().lean();
        break;

      case "teacher_quran":
      case "teacher_subjects":
        roleData = await Teacher.findOne({ user: user._id }).populate().lean();
        break;

      case "supervisor_quran":
      case "supervisor_subjects":
        roleData = await Supervisor.findOne({ user: user._id })
          .populate()
          .lean();
        break;

      case "client":
        roleData = await Client.findOne({ user: user._id }).lean();
        break;

      default:
        break;
    }

    res.json({
      user,
      ...(roleData && { details: roleData }),
    });
  } catch (err) {
    console.error("Error in getMe:", err.message);
    res.status(500).json({ msg: "Server error" });
  }
};

exports.registerFirstAdmin = async (req, res) => {
  const {
    name,
    email,
    password,
    gender,
    phoneNumber,
    address,
    profilePicture,
    permissions,
  } = req.body;

  if (!name || !email || !password || !gender) {
    return res
      .status(400)
      .json({ msg: "Name, email, password, and gender are required." });
  }

  try {
    let existing = await Admin.findOne({ email });
    if (existing) {
      return res.status(400).json({ msg: "Admin already exists" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // 👉 Add this: generate the first staffId
    const staffId = await getNextStaffId();

    const newAdmin = new Admin({
      name,
      email,
      password: hashedPassword,
      gender,
      role: "admin",
      phoneNumber,
      address,
      profilePicture,
      permissions,
      staffId, // 👈 assign generated staffId
    });

    await newAdmin.save();

    const payload = {
      user: {
        id: newAdmin.id,
        role: newAdmin.role,
      },
    };

    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: "24h" },
      (err, token) => {
        if (err) throw err;
        res.status(201).json({
          token,
          user: newAdmin,
          msg: "Super admin registered successfully",
        });
      }
    );
  } catch (err) {
    console.error("Error in registerFirstAdmin:", err.message);
    res.status(500).send("Server error");
  }
};
