import React from "react";
import { Box, Button, Typography, Chip } from "@mui/material";
import { format } from "date-fns";
import {
  FaUser,
  FaMoneyBillWave,
  FaCalendarAlt,
  FaClock,
  FaHistory,
  FaRegCreditCard,
  FaRegCommentDots,
} from "react-icons/fa";

const POPPINS_FONT =
  "'Poppins', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";

const typographyStyles = {
  fontFamily: POPPINS_FONT,
};

const sectionHeaderStyles = {
  ...typographyStyles,
  fontWeight: 600,
  mb: 2,
};

const sectionCardStyles = {
  p: 3,
  border: "1px solid #e2e8f0",
  borderRadius: "8px",
  bgcolor: "#f8fafc",
  mb: 4,
};

const textStyles = {
  ...typographyStyles,
  color: "#64748b",
};

const InfoRow = ({ label, value, icon: Icon }) => (
  <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1.5, mb: 2 }}>
    {Icon && <Icon size={16} style={{ color: "#64748b", marginTop: "4px" }} />}
    <Box>
      <Typography variant="body2" sx={{ ...textStyles, mb: 0.5 }}>
        {label}
      </Typography>
      {React.isValidElement(value) ? (
        value
      ) : (
        <Typography sx={typographyStyles}>{value || "Not provided"}</Typography>
      )}
    </Box>
  </Box>
);

const InfoGrid = ({ label1, value1, icon1, label2, value2, icon2 }) => (
  <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}>
    <Box sx={{ width: "48%" }}>
      <InfoRow label={label1} value={value1} icon={icon1} />
    </Box>
    <Box sx={{ width: "48%" }}>
      <InfoRow label={label2} value={value2} icon={icon2} />
    </Box>
  </Box>
);

const ViewSalaryModal = ({
  invoice,
  setShowModal,
  modalStyle,
  staffDetails,
}) => {
  const modalBaseStyles = {
    ...modalStyle,
    maxHeight: "90vh",
    display: "flex",
    flexDirection: "column",
    width: "800px",
    fontFamily: POPPINS_FONT,
  };

  const scrollableContentStyles = {
    overflowY: "auto",
    flex: 1,
    pr: 2,
    mt: 3,
    "&::-webkit-scrollbar": {
      width: "6px",
    },
    "&::-webkit-scrollbar-track": {
      background: "#f1f5f9",
    },
    "&::-webkit-scrollbar-thumb": {
      background: "#cbd5e1",
      borderRadius: "3px",
    },
  };

  const formatDate = (dateString) => {
    return format(new Date(dateString), "dd/MM/yyyy");
  };

  return (
    <Box sx={modalBaseStyles}>
      {/* Header */}
      <Box
        sx={{
          borderBottom: "1px solid #e2e8f0",
          pb: 2,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Box>
          <Typography
            variant="h5"
            sx={{ ...typographyStyles, fontWeight: 600 }}
          >
            {invoice.userName}
          </Typography>
          <Typography variant="body2" sx={textStyles}>
            Salary Invoice for {format(new Date(invoice.month), "MMMM yyyy")}
          </Typography>
        </Box>
        <Button
          onClick={() => setShowModal(false)}
          sx={{
            minWidth: "32px",
            height: "32px",
            p: 0,
            borderRadius: "50%",
            color: "#64748b",
            "&:hover": {
              bgcolor: "#f1f5f9",
            },
          }}
        >
          ×
        </Button>
      </Box>

      <Box sx={scrollableContentStyles}>
        {/* Staff Information */}
        <Typography variant="subtitle1" sx={sectionHeaderStyles}>
          Staff Information
        </Typography>
        <Box sx={sectionCardStyles}>
          <InfoGrid
            label1="Staff Name"
            value1={invoice.userName}
            icon1={FaUser}
            label2="Role"
            value2={invoice.role
              .split("_")
              .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
              .join(" ")}
            icon2={FaUser}
          />
          <InfoGrid
            label1="Email"
            value1={invoice.user.email}
            icon1={FaUser}
            label2="Staff ID"
            value2={staffDetails?.displayStaffId || "N/A"}
            icon2={FaUser}
          />
        </Box>

        {/* Salary Details */}
        <Typography variant="subtitle1" sx={sectionHeaderStyles}>
          Salary Details
        </Typography>
        <Box sx={sectionCardStyles}>
          <InfoGrid
            label1="Basic Salary"
            value1={`PKR ${invoice.amount.toLocaleString()}`}
            icon1={FaMoneyBillWave}
            label2="Net Salary"
            value2={`PKR ${invoice.netSalary.toLocaleString()}`}
            icon2={FaMoneyBillWave}
          />
          <InfoGrid
            label1="Total Deductions"
            value1={`PKR ${invoice.deduction.toLocaleString()}`}
            icon1={FaMoneyBillWave}
            label2="Late Minutes"
            value2={invoice.lateMinutes}
            icon2={FaClock}
          />
        </Box>

        {/* Bonus Information */}
        <Typography variant="subtitle1" sx={sectionHeaderStyles}>
          Bonus Information
        </Typography>
        <Box sx={sectionCardStyles}>
          <InfoGrid
            label1="Bonus Amount"
            value1={`PKR ${invoice.bonus.amount.toLocaleString()}`}
            icon1={FaMoneyBillWave}
            label2="Bonus Reason"
            value2={invoice.bonus.reason}
            icon2={FaRegCommentDots}
          />
          <InfoGrid
            label1="Referral Bonus"
            value1={`PKR ${invoice.refBonus.toLocaleString()}`}
            icon1={FaMoneyBillWave}
            label2="Student Bonus"
            value2={`PKR ${invoice.studentBonus.toLocaleString()}`}
            icon2={FaMoneyBillWave}
          />
        </Box>

        {/* Attendance & Leaves */}
        <Typography variant="subtitle1" sx={sectionHeaderStyles}>
          Attendance & Leaves
        </Typography>
        <Box sx={sectionCardStyles}>
          <InfoGrid
            label1="Total Leaves"
            value1={invoice.totalLeaves}
            icon1={FaCalendarAlt}
            label2="Approved Leaves"
            value2={invoice.approvedLeave}
            icon2={FaCalendarAlt}
          />
          <InfoGrid
            label1="Absent Fine"
            value1={`PKR ${invoice.absentFine.toLocaleString()}`}
            icon1={FaMoneyBillWave}
            label2="Biometric Fine"
            value2={`PKR ${invoice.biometricFine.toLocaleString()}`}
            icon2={FaMoneyBillWave}
          />
          <InfoRow
            label="Fine Per Minute"
            value={`PKR ${invoice.finePerMinute.toFixed(2)}`}
            icon={FaMoneyBillWave}
          />
        </Box>

        {/* Payment Information */}
        <Typography variant="subtitle1" sx={sectionHeaderStyles}>
          Payment Information
        </Typography>
        <Box sx={sectionCardStyles}>
          <InfoGrid
            label1="Payment Date"
            value1={formatDate(invoice.paymentDate)}
            icon1={FaCalendarAlt}
            label2="Status"
            value2={
              <Box sx={{ display: "inline-block" }}>
                <Chip
                  label={invoice.status.toUpperCase()}
                  color={invoice.status === "paid" ? "success" : "warning"}
                  size="small"
                  sx={{ fontFamily: POPPINS_FONT }}
                />
              </Box>
            }
            icon2={FaRegCreditCard}
          />
          <InfoGrid
            label1="Processed By"
            value1={invoice.processedBy.name}
            icon1={FaUser}
            label2="Advanced Salary"
            value2={`PKR ${invoice.advancedSalary.toLocaleString()}`}
            icon2={FaMoneyBillWave}
          />
          <InfoGrid
            label1="Created At"
            value1={formatDate(invoice.createdAt)}
            icon1={FaHistory}
            label2="Updated At"
            value2={formatDate(invoice.updatedAt)}
            icon2={FaHistory}
          />
          <InfoRow
            label="Remarks"
            value={invoice.remarks}
            icon={FaRegCommentDots}
          />
        </Box>
      </Box>
    </Box>
  );
};

export default ViewSalaryModal;
