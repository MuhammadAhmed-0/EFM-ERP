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
      <Typography sx={typographyStyles}>{value || "Not provided"}</Typography>
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

const ViewChallanModal = ({ challan, setShowModal, modalStyle, months }) => {
  const modalBaseStyles = {
    ...modalStyle,
    maxHeight: "90vh",
    display: "flex",
    flexDirection: "column",
    width: "900px",
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

  const formatDate = (date) => {
    return format(new Date(date), "dd/MM/yyyy hh:mm a");
  };

  const formatDateOnly = (date) => {
    return format(new Date(date), "dd/MM/yyyy");
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
        return FaCheckCircle; // Return component reference, not JSX
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
        sx={{
          backgroundColor: statusColor.bg,
          color: statusColor.color,
          fontWeight: 600,
          fontSize: "0.75rem",
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
            Fee Challan Details
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
            fontSize: "18px",
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
          <InfoGrid
            label1="Client Name"
            value1={challan.clientName}
            icon1={FaUser}
            label2="Client ID"
            value2={challan.clientMainId}
            icon2={FaIdBadge}
          />
          <InfoRow
            label="Client Email"
            value={challan.clientEmail}
            icon={FaEnvelope}
          />
        </Box>

        {/* Financial Summary */}
        <Typography variant="subtitle1" sx={sectionHeaderStyles}>
          Financial Summary
        </Typography>
        <Box sx={sectionCardStyles}>
          <InfoGrid
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
          />
          <InfoGrid
            label1="Total Paid"
            value1={
              <span style={{ color: "#15803d", fontWeight: 600 }}>
                {challan.clientCurrency}{" "}
                {challan.totalPaidAmount.toLocaleString()}
              </span>
            }
            icon1={FaCheckCircle}
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
          />
        </Box>

        {/* Challan Details */}
        <Typography variant="subtitle1" sx={sectionHeaderStyles}>
          Challan Details
        </Typography>
        <Box sx={sectionCardStyles}>
          <InfoGrid
            label1="Months"
            value1={getMonthRange()}
            icon1={FaCalendarAlt}
            label2="Payment Status"
            value2={getPaymentStatusChip(challan.paymentStatus)}
            icon2={getStatusIcon(challan.paymentStatus)}
          />
          <InfoGrid
            label1="From Date"
            value1={formatDateOnly(challan.fromDate)}
            icon1={FaCalendarAlt}
            label2="To Date"
            value2={formatDateOnly(challan.toDate)}
            icon2={FaCalendarAlt}
          />
          <InfoGrid
            label1="Due Month"
            value1={challan.dueMonth}
            icon1={FaClock}
            label2="Issue Date"
            value2={formatDate(challan.issueDate)}
            icon2={FaCalendarAlt}
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
                    p: 2,
                    mb: 2,
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
                    }}
                  >
                    <Typography
                      sx={{
                        ...typographyStyles,
                        fontWeight: 600,
                        color: "#15803d",
                      }}
                    >
                      Payment #{index + 1}
                    </Typography>
                    <Typography sx={{ ...typographyStyles, fontWeight: 600 }}>
                      {challan.clientCurrency} {payment.amount.toLocaleString()}
                    </Typography>
                  </Box>
                  <InfoGrid
                    label1="Payment Method"
                    value1={payment.method}
                    icon1={FaRegCreditCard}
                    label2="Payment Date"
                    value2={formatDate(payment.date)}
                    icon2={FaCalendarAlt}
                  />
                  <InfoGrid
                    label1="Received By"
                    value1={payment.receivedByName}
                    icon1={FaUser}
                    label2="Remarks"
                    value2={payment.remarks || "No remarks"}
                    icon2={FaRegCommentDots}
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
          <InfoRow
            label="Remarks"
            value={challan.remarks || "No remarks provided"}
            icon={FaRegCommentDots}
          />
          <InfoGrid
            label1="Created Date"
            value1={formatDate(challan.createdAt)}
            icon1={FaHistory}
            label2="Last Updated"
            value2={formatDate(challan.updatedAt)}
            icon2={FaHistory}
          />
        </Box>
      </Box>
    </Box>
  );
};

export default ViewChallanModal;
