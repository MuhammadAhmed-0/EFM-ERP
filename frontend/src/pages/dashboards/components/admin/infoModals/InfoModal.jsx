import {
  Modal,
  Box,
  Button,
  Typography,
  TextField,
  Alert,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import { FaLock, FaEye, FaTimes } from "react-icons/fa";
import { format } from "date-fns";
import "../../../../../styles/components/InfoModal.css";
import "../../../../../styles/components/Management.css";
const InfoModal = ({
  open,
  onClose,
  selectedItem,
  adminPassword,
  setAdminPassword,
  passwordError,
  isInfoVisible,
  handleAdminPasswordSubmit,
  type = "client",
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const isSmallMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const isExtraSmall = useMediaQuery(theme.breakpoints.down("xs"));

  // Responsive modal styles
  const getResponsiveModalStyles = () => ({
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    width: isMobile ? "95vw" : "90vw",
    maxWidth: isMobile ? "none" : "500px",
    bgcolor: "background.paper",
    borderRadius: isMobile ? "8px" : "12px",
    boxShadow:
      "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)",
    p: isMobile ? 2 : 3,
    maxHeight: "95vh",
    overflowY: "auto",
    "&:focus-visible": {
      outline: "none",
    },
    fontFamily:
      "'Poppins', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  });

  const renderSensitiveInfo = () => {
    const textStyle = {
      mb: isMobile ? 0.5 : 1,
      fontWeight: "600",
      fontSize: isMobile ? "0.875rem" : "1rem",
      lineHeight: isMobile ? 1.4 : 1.5,
    };

    switch (type) {
      case "client":
        return (
          <>
            <Typography variant="body1" sx={textStyle}>
              Email: {selectedItem.user?.email}
            </Typography>
            <Typography variant="body1" sx={textStyle}>
              Contact: {selectedItem.contactNo || "Not provided"}
            </Typography>
            {selectedItem.infoType === "password" && (
              <Typography variant="body1" sx={textStyle}>
                Password: {`efm@${selectedItem.clientId.replace("efm", "")}`}
              </Typography>
            )}
          </>
        );
      case "teacher":
      case "supervisor":
        return (
          <>
            <Typography variant="body1" sx={textStyle}>
              Email: {selectedItem.email}
            </Typography>
            <Typography variant="body1" sx={textStyle}>
              Phone: {selectedItem.phoneNumber || "Not provided"}
            </Typography>
            <Typography variant="body1" sx={textStyle}>
              CNIC: {selectedItem.profile?.cnicNumber || "Not provided"}
            </Typography>
          </>
        );
      case "feechallan":
        return (
          <>
            <Typography variant="body1" sx={textStyle}>
              Amount: Rs. {selectedItem.amount}
            </Typography>
            {selectedItem.status === "paid" && (
              <>
                <Typography variant="body1" sx={textStyle}>
                  Amount Paid: Rs.{" "}
                  {selectedItem.amountPaid || selectedItem.amount}
                </Typography>
                <Typography variant="body1" sx={textStyle}>
                  Payment Method: {selectedItem.paymentMethod || "N/A"}
                </Typography>
                <Typography variant="body1" sx={textStyle}>
                  Transaction ID: {selectedItem.transactionId || "N/A"}
                </Typography>
                {selectedItem.paymentDate && (
                  <Typography variant="body1" sx={textStyle}>
                    Payment Date:{" "}
                    {format(new Date(selectedItem.paymentDate), "dd/MM/yyyy")}
                  </Typography>
                )}
              </>
            )}
          </>
        );
      default:
        return null;
    }
  };

  const renderBasicDetails = () => {
    const textStyle = {
      mb: isMobile ? 0.5 : 1,
      fontWeight: "600",
      fontSize: isMobile ? "0.875rem" : "1rem",
      lineHeight: isMobile ? 1.4 : 1.5,
    };

    return (
      <>
        <Typography variant="body1" sx={textStyle}>
          Name: {getName()}
        </Typography>
        {type !== "feechallan" && (
          <Typography variant="body1" sx={textStyle}>
            {type === "client" ? "Client ID" : "Staff ID"}: {getId()}
          </Typography>
        )}
        {type === "teacher" || type === "supervisor" ? (
          <>
            <Typography variant="body1" sx={textStyle}>
              Role:{" "}
              {selectedItem.role === "teacher_quran"
                ? "Quran Teacher"
                : selectedItem.role === "teacher_subjects"
                ? "Subjects Teacher"
                : selectedItem.role === "supervisor_quran"
                ? "Quran Supervisor"
                : selectedItem.role === "supervisor_subjects"
                ? "Subjects Supervisor"
                : selectedItem.role}
            </Typography>
            <Typography variant="body1" sx={textStyle}>
              Status:{" "}
              <span
                style={{
                  padding: isMobile ? "1px 6px" : "2px 8px",
                  borderRadius: "4px",
                  fontSize: isMobile ? "0.6875rem" : "0.75rem",
                  fontWeight: 500,
                  textTransform: "capitalize",
                  color: selectedItem.isActive ? "#15803d" : "#991b1b",
                  backgroundColor: selectedItem.isActive
                    ? "#dcfce7"
                    : "#fee2e2",
                }}
              >
                {selectedItem.isActive ? "Active" : "Inactive"}
              </span>
            </Typography>
          </>
        ) : null}
      </>
    );
  };

  const getTitle = () => {
    if (type === "client" && selectedItem?.infoType === "password") {
      return "Password Information";
    }
    if (type === "feechallan") {
      return "Payment Details";
    }
    return "Contact Information";
  };

  const getDetailsTitle = () => {
    switch (type) {
      case "feechallan":
        return "Fee Challan Details";
      case "teacher":
        return "Teacher Details";
      case "supervisor":
        return "Supervisor Details";
      case "client":
        return "Client Details";
      default:
        return "Details";
    }
  };

  const getName = () => {
    if (type === "client") {
      return selectedItem?.clientName;
    }
    if (type === "feechallan") {
      return selectedItem?.clientName;
    }
    return selectedItem?.name;
  };

  const getId = () => {
    if (type === "client") {
      return selectedItem?.clientId;
    }
    return selectedItem?.staffId;
  };

  return (
    <Modal open={open} onClose={onClose} aria-labelledby="info-modal">
      <Box sx={getResponsiveModalStyles()}>
        {/* Header */}
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mb: isMobile ? 2 : 3,
            pb: isMobile ? 1 : 0,
            borderBottom: isMobile ? "1px solid #e5e7eb" : "none",
          }}
        >
          <Typography
            variant={isMobile ? "h6" : "h5"}
            sx={{
              color: "#1f3d61",
              fontWeight: 600,
              fontSize: isMobile ? "1.125rem" : "1.25rem",
              display: "flex",
              alignItems: "center",
              gap: 1,
            }}
          >
            <FaEye color="#1f3d61" size={isMobile ? 16 : 18} />
            {isMobile && isSmallMobile ? getTitle().split(" ")[0] : getTitle()}
          </Typography>
          <Button
            onClick={onClose}
            sx={{
              minWidth: "auto",
              width: isMobile ? "32px" : "40px",
              height: isMobile ? "32px" : "40px",
              p: 0,
              color: "#6b7280",
              borderRadius: "50%",
              "&:hover": {
                bgcolor: "#f9fafb",
                color: "#374151",
              },
            }}
          >
            <FaTimes size={isMobile ? 14 : 16} />
          </Button>
        </Box>

        {selectedItem && (
          <Box>
            {/* Description */}
            <Typography
              variant="body1"
              sx={{
                mb: isMobile ? 2 : 3,
                color: "#374151",
                fontSize: isMobile ? "0.875rem" : "1rem",
                lineHeight: isMobile ? 1.4 : 1.5,
              }}
            >
              {selectedItem?.infoType === "password"
                ? "Enter admin password to view password information."
                : "Enter admin password to view contact details."}
            </Typography>

            {/* Details Box */}
            <Box
              sx={{
                backgroundColor: "#f9fafb",
                border: "1px solid #e5e7eb",
                borderRadius: isMobile ? "6px" : "8px",
                p: isMobile ? 1.5 : 2,
                mb: isMobile ? 2 : 3,
              }}
            >
              <Typography
                variant="body2"
                sx={{
                  fontWeight: 600,
                  mb: 1,
                  fontSize: isMobile ? "0.8125rem" : "0.875rem",
                  color: "#1f3d61",
                }}
              >
                {getDetailsTitle()}:
              </Typography>
              <Box sx={{ display: "grid", gap: isMobile ? 0.5 : 1 }}>
                {renderBasicDetails()}

                {isInfoVisible && (
                  <Box
                    sx={{
                      mt: isMobile ? 1.5 : 2,
                      pt: isMobile ? 1.5 : 2,
                      borderTop: "1px solid #e5e7eb",
                    }}
                  >
                    <Typography
                      variant="body2"
                      sx={{
                        fontWeight: 600,
                        mb: 1,
                        fontSize: isMobile ? "0.8125rem" : "0.875rem",
                        color: "#1f3d61",
                      }}
                    >
                      {selectedItem?.infoType === "password"
                        ? "Password Information:"
                        : "Contact Information:"}
                    </Typography>
                    {renderSensitiveInfo()}
                  </Box>
                )}
              </Box>
            </Box>

            {/* Password Field or Success Message */}
            {!isInfoVisible ? (
              <Box sx={{ mb: isMobile ? 2 : 3 }}>
                <Alert
                  severity="info"
                  sx={{
                    mb: 2,
                    "& .MuiAlert-message": {
                      fontSize: isMobile ? "0.8125rem" : "0.875rem",
                    },
                  }}
                >
                  <Typography
                    variant="body2"
                    sx={{
                      fontWeight: 600,
                      fontSize: isMobile ? "0.8125rem" : "0.875rem",
                      display: "flex",
                      alignItems: "center",
                      gap: 1,
                    }}
                  >
                    <FaLock size={isMobile ? 12 : 14} />
                    Admin Authorization Required
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{
                      fontSize: isMobile ? "0.75rem" : "0.8125rem",
                      mt: 0.5,
                    }}
                  >
                    This action requires admin password verification for
                    security.
                  </Typography>
                </Alert>

                <TextField
                  fullWidth
                  type="password"
                  label="Admin Password"
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  error={!!passwordError}
                  helperText={passwordError}
                  placeholder="Enter admin password"
                  size={isMobile ? "small" : "medium"}
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      bgcolor: "#fff",
                      fontSize: isMobile ? "0.875rem" : "1rem",
                    },
                    "& .MuiInputLabel-root": {
                      fontSize: isMobile ? "0.875rem" : "1rem",
                    },
                    "& .MuiFormHelperText-root": {
                      fontSize: isMobile ? "0.75rem" : "0.8125rem",
                    },
                  }}
                />
              </Box>
            ) : null}

            {/* Footer Buttons */}
            <Box
              sx={{
                display: "flex",
                flexDirection: isMobile ? "column" : "row",
                justifyContent: "flex-end",
                gap: isMobile ? 1.5 : 2,
                mt: 2,
              }}
            >
              <button className="clear-filters-btn" onClick={onClose}>
                {isInfoVisible ? "Close" : "Cancel"}
              </button>

              {!isInfoVisible && (
                <button
                className="add-btn"
                  onClick={handleAdminPasswordSubmit}
                >
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <FaEye size={isMobile ? 16 : 14} />
                    {isMobile
                      ? "View"
                      : `View ${
                          selectedItem?.infoType === "password"
                            ? "Password"
                            : "Contact Info"
                        }`}
                  </Box>
                </button>
              )}
            </Box>
          </Box>
        )}
      </Box>
    </Modal>
  );
};

export default InfoModal;
