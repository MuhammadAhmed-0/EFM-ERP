import React, { useState, useEffect } from "react";
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

// Custom hook for responsive design
const useResponsive = () => {
  const [screenSize, setScreenSize] = useState({
    isMobile: false,
    isTablet: false,
    isDesktop: false,
    width: 0,
  });

  useEffect(() => {
    const checkScreenSize = () => {
      const width = window.innerWidth;
      setScreenSize({
        isMobile: width < 768,
        isTablet: width >= 768 && width < 1024,
        isDesktop: width >= 1024,
        width,
      });
    };

    checkScreenSize();
    window.addEventListener("resize", checkScreenSize);
    return () => window.removeEventListener("resize", checkScreenSize);
  }, []);

  return screenSize;
};

const POPPINS_FONT =
  "'Poppins', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";

const ResponsiveInfoRow = ({ label, value, icon: Icon, isMobile }) => (
  <Box
    sx={{
      display: "flex",
      alignItems: "flex-start",
      gap: {
        xs: 1,
        sm: 1.5,
      },
      mb: {
        xs: 1.5,
        sm: 2,
      },
    }}
  >
    {Icon && (
      <Icon
        size={isMobile ? 14 : 16}
        style={{
          color: "#64748b",
          marginTop: isMobile ? "2px" : "4px",
          flexShrink: 0,
        }}
      />
    )}
    <Box sx={{ minWidth: 0, width: "100%" }}>
      <Typography
        variant="body2"
        sx={{
          fontFamily: POPPINS_FONT,
          color: "#64748b",
          mb: 0.5,
          fontSize: {
            xs: "0.75rem",
            sm: "0.8rem",
            md: "0.875rem",
          },
          fontWeight: 500,
        }}
      >
        {label}
      </Typography>
      {React.isValidElement(value) ? (
        value
      ) : (
        <Typography
          sx={{
            fontFamily: POPPINS_FONT,
            fontSize: {
              xs: "0.8rem",
              sm: "0.875rem",
              md: "1rem",
            },
            wordBreak: "break-word",
          }}
        >
          {value || "Not provided"}
        </Typography>
      )}
    </Box>
  </Box>
);

const ResponsiveInfoGrid = ({
  label1,
  value1,
  icon1,
  label2,
  value2,
  icon2,
  isMobile,
}) => (
  <Box
    sx={{
      display: "flex",
      justifyContent: "space-between",
      mb: {
        xs: 1.5,
        sm: 2,
      },
      flexDirection: {
        xs: "column",
        sm: "row",
      },
      gap: {
        xs: 1,
        sm: 0,
      },
    }}
  >
    <Box
      sx={{
        width: {
          xs: "100%",
          sm: "48%",
        },
      }}
    >
      <ResponsiveInfoRow
        label={label1}
        value={value1}
        icon={icon1}
        isMobile={isMobile}
      />
    </Box>
    <Box
      sx={{
        width: {
          xs: "100%",
          sm: "48%",
        },
      }}
    >
      <ResponsiveInfoRow
        label={label2}
        value={value2}
        icon={icon2}
        isMobile={isMobile}
      />
    </Box>
  </Box>
);

const ViewSalaryModal = ({
  invoice,
  setShowModal,
  modalStyle,
  staffDetails,
}) => {
  const { isMobile, isTablet } = useResponsive();

  const modalBaseStyles = {
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    width: {
      xs: "95vw",
      sm: "90vw",
      md: "700px",
      lg: "800px",
      xl: "850px",
    },
    maxWidth: {
      xs: "400px",
      sm: "600px",
      md: "700px",
      lg: "800px",
      xl: "850px",
    },
    maxHeight: {
      xs: "95vh",
      sm: "90vh",
      md: "85vh",
    },
    bgcolor: "background.paper",
    borderRadius: "12px",
    boxShadow:
      "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)",
    display: "flex",
    flexDirection: "column",
    fontFamily: POPPINS_FONT,
    p: {
      xs: 2,
      sm: 3,
      md: 4,
    },
    "&:focus-visible": {
      outline: "none",
    },
  };

  const scrollableContentStyles = {
    overflowY: "auto",
    flex: 1,
    pr: {
      xs: 1,
      sm: 2,
    },
    mt: {
      xs: 2,
      sm: 2.5,
      md: 3,
    },
    "&::-webkit-scrollbar": {
      width: isMobile ? "4px" : "6px",
    },
    "&::-webkit-scrollbar-track": {
      background: "#f1f5f9",
    },
    "&::-webkit-scrollbar-thumb": {
      background: "#cbd5e1",
      borderRadius: "3px",
    },
  };

  const sectionHeaderStyles = {
    fontFamily: POPPINS_FONT,
    fontWeight: 600,
    mb: {
      xs: 1.5,
      sm: 2,
    },
    fontSize: {
      xs: "1rem",
      sm: "1.1rem",
      md: "1.25rem",
    },
  };

  const sectionCardStyles = {
    p: {
      xs: 2,
      sm: 2.5,
      md: 3,
    },
    border: "1px solid #e2e8f0",
    borderRadius: "8px",
    bgcolor: "#f8fafc",
    mb: {
      xs: 3,
      sm: 3.5,
      md: 4,
    },
  };

  const formatDate = (dateString) => {
    return format(new Date(dateString), isMobile ? "dd/MM/yy" : "dd/MM/yyyy");
  };

  return (
    <Box sx={modalBaseStyles}>
      {/* Header */}
      <Box
        sx={{
          borderBottom: "1px solid #e2e8f0",
          pb: {
            xs: 1.5,
            sm: 2,
          },
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexDirection: {
            xs: "column",
            sm: "row",
          },
          gap: {
            xs: 1,
            sm: 0,
          },
        }}
      >
        <Box
          sx={{
            textAlign: {
              xs: "center",
              sm: "left",
            },
            width: "100%",
          }}
        >
          <Typography
            variant="h5"
            sx={{
              fontFamily: POPPINS_FONT,
              fontWeight: 600,
              fontSize: {
                xs: "1.2rem",
                sm: "1.3rem",
                md: "1.5rem",
              },
            }}
          >
            {invoice.userName}
          </Typography>
          <Typography
            variant="body2"
            sx={{
              fontFamily: POPPINS_FONT,
              color: "#64748b",
              fontSize: {
                xs: "0.8rem",
                sm: "0.875rem",
                md: "0.9rem",
              },
            }}
          >
            Salary Invoice for {format(new Date(invoice.month), "MMMM yyyy")}
          </Typography>
        </Box>
        <Button
          onClick={() => setShowModal(false)}
          sx={{
            minWidth: {
              xs: "28px",
              sm: "32px",
            },
            height: {
              xs: "28px",
              sm: "32px",
            },
            p: 0,
            borderRadius: "50%",
            color: "#64748b",
            fontSize: {
              xs: "16px",
              sm: "18px",
            },
            position: {
              xs: "absolute",
              sm: "static",
            },
            top: {
              xs: "16px",
              sm: "auto",
            },
            right: {
              xs: "16px",
              sm: "auto",
            },
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
          <ResponsiveInfoGrid
            label1="Staff Name"
            value1={invoice.userName}
            icon1={FaUser}
            label2="Role"
            value2={invoice.role
              .split("_")
              .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
              .join(" ")}
            icon2={FaUser}
            isMobile={isMobile}
          />
          <ResponsiveInfoGrid
            label1="Email"
            value1={invoice.user.email}
            icon1={FaUser}
            label2="Staff ID"
            value2={staffDetails?.displayStaffId || "N/A"}
            icon2={FaUser}
            isMobile={isMobile}
          />
        </Box>

        {/* Salary Details */}
        <Typography variant="subtitle1" sx={sectionHeaderStyles}>
          Salary Details
        </Typography>
        <Box sx={sectionCardStyles}>
          <ResponsiveInfoGrid
            label1="Basic Salary"
            value1={`PKR ${invoice.amount.toLocaleString()}`}
            icon1={FaMoneyBillWave}
            label2="Net Salary"
            value2={`PKR ${invoice.netSalary.toLocaleString()}`}
            icon2={FaMoneyBillWave}
            isMobile={isMobile}
          />
          <ResponsiveInfoGrid
            label1="Total Deductions"
            value1={`PKR ${invoice.deduction.toLocaleString()}`}
            icon1={FaMoneyBillWave}
            label2="Late Minutes"
            value2={invoice.lateMinutes}
            icon2={FaClock}
            isMobile={isMobile}
          />
        </Box>

        {/* Bonus Information */}
        <Typography variant="subtitle1" sx={sectionHeaderStyles}>
          Bonus Information
        </Typography>
        <Box sx={sectionCardStyles}>
          <ResponsiveInfoGrid
            label1="Bonus Amount"
            value1={`PKR ${invoice.bonus.amount.toLocaleString()}`}
            icon1={FaMoneyBillWave}
            label2="Bonus Reason"
            value2={invoice.bonus.reason}
            icon2={FaRegCommentDots}
            isMobile={isMobile}
          />
          <ResponsiveInfoGrid
            label1="Referral Bonus"
            value1={`PKR ${invoice.refBonus.toLocaleString()}`}
            icon1={FaMoneyBillWave}
            label2="Student Bonus"
            value2={`PKR ${invoice.studentBonus.toLocaleString()}`}
            icon2={FaMoneyBillWave}
            isMobile={isMobile}
          />
        </Box>

        {/* Attendance & Leaves */}
        <Typography variant="subtitle1" sx={sectionHeaderStyles}>
          Attendance & Leaves
        </Typography>
        <Box sx={sectionCardStyles}>
          <ResponsiveInfoGrid
            label1="Total Leaves"
            value1={invoice.totalLeaves}
            icon1={FaCalendarAlt}
            label2="Approved Leaves"
            value2={invoice.approvedLeave}
            icon2={FaCalendarAlt}
            isMobile={isMobile}
          />
          <ResponsiveInfoGrid
            label1="Absent Fine"
            value1={`PKR ${invoice.absentFine.toLocaleString()}`}
            icon1={FaMoneyBillWave}
            label2="Biometric Fine"
            value2={`PKR ${invoice.biometricFine.toLocaleString()}`}
            icon2={FaMoneyBillWave}
            isMobile={isMobile}
          />
          <ResponsiveInfoRow
            label="Fine Per Minute"
            value={`PKR ${invoice.finePerMinute.toFixed(2)}`}
            icon={FaMoneyBillWave}
            isMobile={isMobile}
          />
        </Box>

        {/* Payment Information */}
        <Typography variant="subtitle1" sx={sectionHeaderStyles}>
          Payment Information
        </Typography>
        <Box sx={sectionCardStyles}>
          <ResponsiveInfoGrid
            label1="Payment Date"
            value1={formatDate(invoice.paymentDate)}
            icon1={FaCalendarAlt}
            label2="Status"
            value2={
              <Box sx={{ display: "inline-block" }}>
                <Chip
                  label={invoice.status.toUpperCase()}
                  color={invoice.status === "paid" ? "success" : "warning"}
                  size={isMobile ? "small" : "medium"}
                  sx={{
                    fontFamily: POPPINS_FONT,
                    fontSize: {
                      xs: "0.7rem",
                      sm: "0.75rem",
                    },
                  }}
                />
              </Box>
            }
            icon2={FaRegCreditCard}
            isMobile={isMobile}
          />
          <ResponsiveInfoGrid
            label1="Processed By"
            value1={invoice.processedBy.name}
            icon1={FaUser}
            label2="Advanced Salary"
            value2={`PKR ${invoice.advancedSalary.toLocaleString()}`}
            icon2={FaMoneyBillWave}
            isMobile={isMobile}
          />
          <ResponsiveInfoGrid
            label1="Created At"
            value1={formatDate(invoice.createdAt)}
            icon1={FaHistory}
            label2="Updated At"
            value2={formatDate(invoice.updatedAt)}
            icon2={FaHistory}
            isMobile={isMobile}
          />
          <ResponsiveInfoRow
            label="Remarks"
            value={invoice.remarks}
            icon={FaRegCommentDots}
            isMobile={isMobile}
          />
        </Box>
      </Box>
    </Box>
  );
};

export default ViewSalaryModal;
