const express = require("express");
const router = express.Router();
const paymentController = require("../controllers/paymentController");
const auth = require("../middleware/auth");
const checkRole = require("../middleware/roleCheck");

router.get("/client/challans", auth, paymentController.getClientOwnChallans);
router.get(
  "/admin/challans",
  auth,
  checkRole("admin"),
  paymentController.getAllChallans
);
router.get(
  "/admin/salary-invoices",
  auth,
  checkRole("admin"),
  paymentController.getAllSalaryInvoices
);
router.get(
  "/employee/salary-invoice",
  auth,
  paymentController.getOwnSalaryInvoices
);

router.get(
  "/challans/:challanId",
  auth,
  checkRole("admin"),
  paymentController.getChallanDetails
);
router.get(
  "/salary/:invoiceId",
  auth,
  checkRole("admin"),
  paymentController.getSalaryInvoiceDetails
);

router.get(
  "/employee/salary-invoice/:invoiceId",
  auth,
  checkRole(
    "supervisor_quran",
    "supervisor_subjects",
    "teacher_quran",
    "teacher_subjects"
  ),
  paymentController.getOwnSalaryInvoiceDetails
);

router.get(
  "/client/challans/:challanId",
  auth,
  checkRole("client", "admin"),
  paymentController.getClientOwnChallanDetails
);

module.exports = router;
