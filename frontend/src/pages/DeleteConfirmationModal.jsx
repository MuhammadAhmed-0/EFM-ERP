import { useState } from "react";
import {
  Modal,
  Box,
  Typography,
  Button,
  CircularProgress,
  TextField,
  Alert,
} from "@mui/material";
import { FaTrash, FaLock } from "react-icons/fa";
import { format } from "date-fns";
import { getModalStyles } from "../styles/modal/commonModalStyles";
import { convertTo12Hour, formatTableDate } from "../utils/formatters";

const DeleteConfirmationModal = ({
  open,
  onClose,
  onConfirm,
  isLoading,
  type,
  data,
}) => {
  const [password, setPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [showPasswordField, setShowPasswordField] = useState(false);

  const ADMIN_PASSWORD = "admin123";
  const requiresPassword = type !== "schedule";

  if (!data) return null;

  const handleClose = () => {
    if (!isLoading) {
      setPassword("");
      setPasswordError("");
      setShowPasswordField(false);
      onClose();
    }
  };

  const handleConfirm = () => {
    if (requiresPassword) {
      if (!showPasswordField) {
        setShowPasswordField(true);
        return;
      }

      if (password !== ADMIN_PASSWORD) {
        setPasswordError("Incorrect admin password");
        return;
      }
    }

    setPassword("");
    setPasswordError("");
    setShowPasswordField(false);
    onConfirm();
  };

  const handlePasswordKeyPress = (e) => {
    if (e.key === "Enter") {
      handleConfirm();
    }
  };

  const renderDetails = () => {
    switch (type) {
      case "invoice":
        return (
          <>
            <Typography variant="body2">
              <strong>Staff:</strong> {data.user?.name || "Unknown Staff"} (
              {data.user?.staffId || "N/A"})
            </Typography>
            <Typography variant="body2">
              <strong>Month:</strong>{" "}
              {format(new Date(data.month), "MMMM yyyy")}
            </Typography>
            <Typography variant="body2">
              <strong>Basic Salary:</strong> PKR{" "}
              {data.amount?.toLocaleString() || "0"}
            </Typography>
            <Typography variant="body2">
              <strong>Net Salary:</strong> PKR{" "}
              {data.netSalary?.toLocaleString() || "0"}
            </Typography>
            <Typography variant="body2">
              <strong>Status:</strong>{" "}
              <span
                style={{
                  padding: "2px 8px",
                  borderRadius: "4px",
                  fontSize: "0.75rem",
                  fontWeight: 500,
                  color:
                    data.status === "paid"
                      ? "#15803d"
                      : data.status === "pending"
                      ? "#b45309"
                      : "#be123c",
                  backgroundColor:
                    data.status === "paid"
                      ? "#dcfce7"
                      : data.status === "pending"
                      ? "#fef3c7"
                      : "#fce7f3",
                }}
              >
                {data.status}
              </span>
            </Typography>
            {data.status === "paid" && (
              <Typography variant="body2" sx={{ color: "#dc2626" }}>
                <strong>Warning:</strong> This invoice is marked as paid.
                Deleting it will remove all payment records.
              </Typography>
            )}
          </>
        );
      case "challan":
        return (
          <>
            <Typography variant="body2">
              <strong>Client:</strong> {data.clientName || "Unknown Client"}
            </Typography>
            <Typography variant="body2">
              <strong>Client ID:</strong> {data.clientMainId || "N/A"}
            </Typography>
            <Typography variant="body2">
              <strong>Amount:</strong> {data.clientCurrency || "PKR"}{" "}
              {data.amount || "0"}
            </Typography>
            <Typography variant="body2">
              <strong>Months:</strong>{" "}
              {Array.isArray(data.months)
                ? data.months.join(", ")
                : data.month || "N/A"}
            </Typography>
            <Typography variant="body2">
              <strong>Due Month:</strong> {data.dueMonth || "Not Set"}
            </Typography>
            {data.paymentHistory?.length > 0 && (
              <Typography variant="body2" sx={{ color: "#dc2626" }}>
                <strong>Warning:</strong> This challan has payment history.
                Deleting it will remove all payment records.
              </Typography>
            )}
          </>
        );
      case "schedule":
        return (
          <>
            <Typography variant="body2">
              <strong>Subject:</strong> {data.subjectName || "Unknown Subject"}
            </Typography>
            <Typography variant="body2">
              <strong>Teacher:</strong> {data.teacherName || "Unknown Teacher"}
            </Typography>
            <Typography variant="body2">
              <strong>Date:</strong>{" "}
              {data.classDate
                ? formatTableDate(data.classDate)
                : "Unknown Date"}
            </Typography>
            <Typography variant="body2">
              <strong>Time:</strong>{" "}
              {data.startTime && data.endTime
                ? `${convertTo12Hour(data.startTime)} - ${convertTo12Hour(
                    data.endTime
                  )}`
                : "Unknown Time"}
            </Typography>
            <Typography variant="body2">
              <strong>Students:</strong>{" "}
              {data.studentNames?.join(", ") || "No students"}
            </Typography>
          </>
        );

      default:
        return null;
    }
  };

  const getTitle = () => {
    if (type === "invoice") return "Delete Salary Invoice";
    if (type === "challan") return "Delete Fee Challan";
    if (type === "schedule") return "Delete Schedule";
    return "Confirm Delete";
  };

  return (
    <Modal open={open} onClose={handleClose}>
      <Box sx={getModalStyles()}>
        <Typography
          variant="h6"
          sx={{
            mb: 2,
            color: "#dc2626",
            fontWeight: 600,
            display: "flex",
            alignItems: "center",
            gap: 1,
          }}
        >
          <FaTrash color="#dc2626" />
          {getTitle()}
        </Typography>

        <Typography variant="body1" sx={{ mb: 3, color: "#374151" }}>
          Are you sure you want to delete this {type}? This action cannot be
          undone.
        </Typography>

        <Box
          sx={{
            backgroundColor: "#f9fafb",
            border: "1px solid #e5e7eb",
            borderRadius: "8px",
            p: 2,
            mb: 3,
          }}
        >
          <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
            {getTitle().replace("Delete ", "")} Details:
          </Typography>
          <Box sx={{ display: "grid", gap: 1 }}>{renderDetails()}</Box>
        </Box>

        {/* Password Field for Protected Actions */}
        {requiresPassword && showPasswordField && (
          <Box sx={{ mb: 3 }}>
            <Box
              sx={{
                backgroundColor: "#fef2f2",
                border: "1px solid #fecaca",
                borderRadius: "8px",
                p: 2,
                mb: 2,
              }}
            >
              <Typography
                variant="body2"
                sx={{
                  color: "#dc2626",
                  fontWeight: 600,
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                  mb: 1,
                }}
              >
                <FaLock size={14} />
                Admin Authorization Required
              </Typography>
              <Typography variant="body2" sx={{ color: "#7f1d1d" }}>
                This action requires admin password verification for security.
              </Typography>
            </Box>

            <TextField
              fullWidth
              type="password"
              label="Admin Password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (passwordError) setPasswordError("");
              }}
              onKeyPress={handlePasswordKeyPress}
              error={!!passwordError}
              helperText={passwordError}
              autoFocus
              size="small"
              sx={{
                "& .MuiOutlinedInput-root": {
                  "& fieldset": {
                    borderColor: passwordError ? "#dc2626" : "#d1d5db",
                  },
                  "&:hover fieldset": {
                    borderColor: passwordError ? "#dc2626" : "#9ca3af",
                  },
                  "&.Mui-focused fieldset": {
                    borderColor: passwordError ? "#dc2626" : "#1f3d61",
                  },
                },
              }}
            />

            {passwordError && (
              <Alert severity="error" sx={{ mt: 1 }}>
                {passwordError}
              </Alert>
            )}
          </Box>
        )}

        {/* Security Notice for Protected Actions */}
        {requiresPassword && !showPasswordField && (
          <Box
            sx={{
              backgroundColor: "#fffbeb",
              border: "1px solid #fed7aa",
              borderRadius: "8px",
              p: 2,
              mb: 3,
            }}
          >
            <Typography
              variant="body2"
              sx={{
                color: "#92400e",
                fontWeight: 600,
                display: "flex",
                alignItems: "center",
                gap: 1,
                mb: 1,
              }}
            >
              <FaLock size={14} />
              Protected Action
            </Typography>
            <Typography variant="body2" sx={{ color: "#78350f" }}>
              This action requires admin password verification to proceed.
            </Typography>
          </Box>
        )}

        <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 2 }}>
          <Button
            variant="outlined"
            onClick={handleClose}
            disabled={isLoading}
            sx={{
              borderColor: "#d1d5db",
              color: "#6b7280",
              "&:hover": {
                borderColor: "#9ca3af",
                backgroundColor: "#f9fafb",
              },
            }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleConfirm}
            disabled={isLoading}
            sx={{
              bgcolor:
                requiresPassword && !showPasswordField ? "#dc2626" : "#dc2626",
              color: "white",
              "&:hover": {
                bgcolor: "#b91c1c",
              },
              "&.Mui-disabled": {
                bgcolor: "#fca5a5",
                color: "white",
              },
            }}
          >
            {isLoading ? (
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <CircularProgress size={16} sx={{ color: "white" }} />
                Deleting...
              </Box>
            ) : requiresPassword && !showPasswordField ? (
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <FaLock size={14} />
                Authorize Delete
              </Box>
            ) : (
              `Delete ${type.charAt(0).toUpperCase() + type.slice(1)}`
            )}
          </Button>
        </Box>
      </Box>
    </Modal>
  );
};

export default DeleteConfirmationModal;
