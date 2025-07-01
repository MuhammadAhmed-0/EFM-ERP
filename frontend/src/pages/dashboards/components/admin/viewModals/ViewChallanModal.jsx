import { useState, useEffect } from "react";
import { Box, Button, Typography, Chip } from "@mui/material";
import { format } from "date-fns";
import {
  FaUser,
  FaMoneyBillWave,
  FaCalendarAlt,
  FaClock,
  FaHistory,
  FaFileInvoice,
  FaRegCreditCard,
  FaRegCommentDots,
  FaCheckCircle,
  FaTimesCircle,
  FaExclamationCircle,
  FaIdBadge,
  FaEnvelope,
} from "react-icons/fa";

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

const ResponsiveInfoRow = ({
  label,
  value,
  icon: Icon,
  isMobile,
  isComponent = false,
}) => (
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
      {/* Use Box instead of Typography for component values */}
      {isComponent ? (
        <Box sx={{ display: "flex", alignItems: "center" }}>
          {value || "Not provided"}
        </Box>
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
  isComponent1 = false,
  label2,
  value2,
  icon2,
  isComponent2 = false,
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
        isComponent={isComponent1}
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
        isComponent={isComponent2}
      />
    </Box>
  </Box>
);

const ViewChallanModal = ({ challan, setShowModal, modalStyle, months }) => {
  const { isMobile, isTablet } = useResponsive();

  const modalBaseStyles = {
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    width: {
      xs: "95vw",
      sm: "90vw",
      md: "800px",
      lg: "900px",
      xl: "1000px",
    },
    maxWidth: {
      xs: "400px",
      sm: "600px",
      md: "800px",
      lg: "900px",
      xl: "1000px",
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

  const formatDate = (date) => {
    return format(
      new Date(date),
      isMobile ? "dd/MM/yy hh:mm a" : "dd/MM/yyyy hh:mm a"
    );
  };

  const formatDateOnly = (date) => {
    return format(new Date(date), isMobile ? "dd/MM/yy" : "dd/MM/yyyy");
  };

  const getMonthRange = () => {
    if (!Array.isArray(challan.months) || challan.months.length === 0) {
      return "N/A";
    }

    const shortMonths = {
      January: "Jan",
      February: "Feb",
      March: "Mar",
      April: "Apr",
      May: "May",
      June: "Jun",
      July: "Jul",
      August: "Aug",
      September: "Sep",
      October: "Oct",
      November: "Nov",
      December: "Dec",
    };

    const monthIndices = challan.months.map((month) => months.indexOf(month));
    const firstMonth = shortMonths[months[Math.min(...monthIndices)]];
    const lastMonth = shortMonths[months[Math.max(...monthIndices)]];

    return monthIndices.length > 1
      ? `${firstMonth} to ${lastMonth}`
      : firstMonth;
  };

  const getStatusIcon = (status) => {
    switch (status.toLowerCase()) {
      case "paid":
      case "fully_paid":
        return FaCheckCircle;
      case "pending":
        return FaExclamationCircle;
      case "overdue":
        return FaTimesCircle;
      case "partial":
      case "partially_paid":
        return FaExclamationCircle;
      default:
        return FaFileInvoice;
    }
  };

  const getPaymentStatusChip = (status) => {
    const statusColors = {
      paid: { bg: "#dcfce7", color: "#166534" },
      pending: { bg: "#fef3c7", color: "#92400e" },
      overdue: { bg: "#fee2e2", color: "#991b1b" },
      partial: { bg: "#dbeafe", color: "#1e40af" },
      fully_paid: { bg: "#dcfce7", color: "#166534" },
      partially_paid: { bg: "#dbeafe", color: "#1e40af" },
    };

    const statusColor = statusColors[status.toLowerCase()] || {
      bg: "#f1f5f9",
      color: "#475569",
    };

    return (
      <Chip
        label={
          status.charAt(0).toUpperCase() +
          status.slice(1).toLowerCase().replace("_", " ")
        }
        size={isMobile ? "small" : "medium"}
        sx={{
          backgroundColor: statusColor.bg,
          color: statusColor.color,
          fontWeight: 600,
          fontSize: {
            xs: "0.7rem",
            sm: "0.75rem",
          },
        }}
      />
    );
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
        }}
      >
        <Box>
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
              textAlign: {
                xs: "center",
                sm: "left",
              },
              flex: 1,
            }}
          >
            Fee Challan Details
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
            "&:hover": {
              bgcolor: "#f1f5f9",
            },
          }}
        >
          ×
        </Button>
      </Box>

      <Box sx={scrollableContentStyles}>
        {/* Client Information */}
        <Typography variant="subtitle1" sx={sectionHeaderStyles}>
          Client Information
        </Typography>
        <Box sx={sectionCardStyles}>
          <ResponsiveInfoGrid
            label1="Client Name"
            value1={challan.clientName}
            icon1={FaUser}
            label2="Client ID"
            value2={challan.clientMainId}
            icon2={FaIdBadge}
            isMobile={isMobile}
          />
          <ResponsiveInfoRow
            label="Client Email"
            value={challan.clientEmail}
            icon={FaEnvelope}
            isMobile={isMobile}
          />
        </Box>

        {/* Financial Summary */}
        <Typography variant="subtitle1" sx={sectionHeaderStyles}>
          Financial Summary
        </Typography>
        <Box sx={sectionCardStyles}>
          <ResponsiveInfoGrid
            label1="Total Amount"
            value1={`${
              challan.clientCurrency
            } ${challan.amount.toLocaleString()}`}
            icon1={FaMoneyBillWave}
            label2="Basic Fee"
            value2={`${
              challan.clientCurrency
            } ${challan.basicFee.toLocaleString()}`}
            icon2={FaMoneyBillWave}
            isMobile={isMobile}
          />
          <ResponsiveInfoGrid
            label1="Total Paid"
            value1={
              <span style={{ color: "#15803d", fontWeight: 600 }}>
                {challan.clientCurrency}{" "}
                {challan.totalPaidAmount.toLocaleString()}
              </span>
            }
            icon1={FaCheckCircle}
            isComponent1={true}
            label2="Pending Amount"
            value2={
              <span
                style={{
                  color: challan.pendingAmount > 0 ? "#991b1b" : "#15803d",
                  fontWeight: 600,
                }}
              >
                {challan.clientCurrency}{" "}
                {challan.pendingAmount.toLocaleString()}
              </span>
            }
            icon2={challan.pendingAmount > 0 ? FaTimesCircle : FaCheckCircle}
            isComponent2={true}
            isMobile={isMobile}
          />
        </Box>

        {/* Challan Details */}
        <Typography variant="subtitle1" sx={sectionHeaderStyles}>
          Challan Details
        </Typography>
        <Box sx={sectionCardStyles}>
          <ResponsiveInfoGrid
            label1="Months"
            value1={getMonthRange()}
            icon1={FaCalendarAlt}
            label2="Payment Status"
            value2={getPaymentStatusChip(challan.paymentStatus)}
            icon2={getStatusIcon(challan.paymentStatus)}
            isComponent2={true}
            isMobile={isMobile}
          />
          <ResponsiveInfoGrid
            label1="From Date"
            value1={formatDateOnly(challan.fromDate)}
            icon1={FaCalendarAlt}
            label2="To Date"
            value2={formatDateOnly(challan.toDate)}
            icon2={FaCalendarAlt}
            isMobile={isMobile}
          />
          <ResponsiveInfoGrid
            label1="Due Month"
            value1={challan.dueMonth}
            icon1={FaClock}
            label2="Issue Date"
            value2={formatDate(challan.issueDate)}
            icon2={FaCalendarAlt}
            isMobile={isMobile}
          />
        </Box>

        {/* Payment History */}
        {challan.paymentHistory && challan.paymentHistory.length > 0 && (
          <>
            <Typography variant="subtitle1" sx={sectionHeaderStyles}>
              Payment History ({challan.paymentHistory.length} payments)
            </Typography>
            <Box sx={sectionCardStyles}>
              {challan.paymentHistory.map((payment, index) => (
                <Box
                  key={payment._id || index}
                  sx={{
                    p: {
                      xs: 1.5,
                      sm: 2,
                    },
                    mb: {
                      xs: 1.5,
                      sm: 2,
                    },
                    border: "1px solid #e2e8f0",
                    borderRadius: "6px",
                    bgcolor: "#ffffff",
                    "&:last-child": { mb: 0 },
                  }}
                >
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                      mb: 1,
                      flexDirection: {
                        xs: "column",
                        sm: "row",
                      },
                      gap: {
                        xs: 0.5,
                        sm: 0,
                      },
                    }}
                  >
                    <Typography
                      sx={{
                        fontFamily: POPPINS_FONT,
                        fontWeight: 600,
                        color: "#15803d",
                        fontSize: {
                          xs: "0.875rem",
                          sm: "1rem",
                        },
                      }}
                    >
                      Payment #{index + 1}
                    </Typography>
                    <Typography
                      sx={{
                        fontFamily: POPPINS_FONT,
                        fontWeight: 600,
                        fontSize: {
                          xs: "0.875rem",
                          sm: "1rem",
                        },
                      }}
                    >
                      {challan.clientCurrency} {payment.amount.toLocaleString()}
                    </Typography>
                  </Box>
                  <ResponsiveInfoGrid
                    label1="Payment Method"
                    value1={payment.method}
                    icon1={FaRegCreditCard}
                    label2="Payment Date"
                    value2={formatDate(payment.date)}
                    icon2={FaCalendarAlt}
                    isMobile={isMobile}
                  />
                  <ResponsiveInfoGrid
                    label1="Received By"
                    value1={payment.receivedByName}
                    icon1={FaUser}
                    label2="Remarks"
                    value2={payment.remarks || "No remarks"}
                    icon2={FaRegCommentDots}
                    isMobile={isMobile}
                  />
                </Box>
              ))}
            </Box>
          </>
        )}

        {/* Additional Information */}
        <Typography variant="subtitle1" sx={sectionHeaderStyles}>
          Additional Information
        </Typography>
        <Box sx={sectionCardStyles}>
          <ResponsiveInfoRow
            label="Remarks"
            value={challan.remarks || "No remarks provided"}
            icon={FaRegCommentDots}
            isMobile={isMobile}
          />
          <ResponsiveInfoGrid
            label1="Created Date"
            value1={formatDate(challan.createdAt)}
            icon1={FaHistory}
            label2="Last Updated"
            value2={formatDate(challan.updatedAt)}
            icon2={FaHistory}
            isMobile={isMobile}
          />
        </Box>
      </Box>
    </Box>
  );
};

export default ViewChallanModal;
