const checkRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      // console.warn("❌ No user found on request object");
      return res.status(401).json({ msg: "Not authorized" });
    }

    if (!roles.includes(req.user.role)) {
      // console.warn(`❌ Role '${req.user.role}' is not allowed`);
      return res
        .status(403)
        .json({ msg: "Access denied: Not authorized for this action" });
    }
    // console.log(`✅ checkRole passed for role: ${req.user.role}`);

    next();
  };
};

module.exports = checkRole;
