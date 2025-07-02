import React from "react";
import {
  Modal,
  Box,
  TextField,
  Button,
  Typography,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  useTheme,
  useMediaQuery,
} from "@mui/material";
import { getModalStyles } from "../../../styles/modal/commonModalStyles";

const QUERY_TYPES = [
  { value: "attendance_issue", label: "Attendance Issue" },
  { value: "leave_request", label: "Leave Request" },
  { value: "salary_query", label: "Salary Query" },
  { value: "schedule_change", label: "Schedule Change" },
  { value: "technical_issue", label: "Technical Issue" },
  { value: "other", label: "Other" },
];

const POPPINS_FONT =
  "'Poppins', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";

const QueryModal = ({
  open,
  onClose,
  onSubmit,
  isLoading,
  formData,
  handleChange,
  errors,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const isSmallMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const getResponsiveModalStyles = () => ({
    ...getModalStyles(),
    width: isMobile ? "95vw" : "500px",
    maxWidth: isMobile ? "none" : "500px",
    maxHeight: "90vh",
    p: isMobile ? 2 : 4,
    fontFamily: POPPINS_FONT,
    overflowY: "auto",
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
  });

  return (
    <Modal
      open={open}
      onClose={onClose}
      aria-labelledby="query-modal"
      disableEnforceFocus
    >
      <Box sx={getResponsiveModalStyles()}>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: isMobile ? "flex-start" : "center",
            mb: isMobile ? 2 : 3,
            flexDirection: isMobile ? "column" : "row",
            gap: isMobile ? 1 : 0,
          }}
        >
          <Typography
            variant="h6"
            component="h2"
            sx={{
              color: "#1e293b",
              fontSize: isMobile ? "1.125rem" : "1.25rem",
              fontWeight: 500,
              fontFamily: POPPINS_FONT,
            }}
          >
            Send Query to Admin
          </Typography>
          <Button
            onClick={onClose}
            sx={{
              minWidth: isMobile ? "28px" : "auto",
              height: isMobile ? "28px" : "auto",
              p: isMobile ? 0 : 1,
              color: "#64748b",
              alignSelf: isMobile ? "flex-end" : "auto",
              fontSize: isMobile ? "1.25rem" : "1.5rem",
              borderRadius: isMobile ? "50%" : "4px",
              "&:hover": {
                bgcolor: "#f1f5f9",
                color: "#3949ab",
              },
            }}
          >
            ×
          </Button>
        </Box>

        <form onSubmit={onSubmit}>
          <FormControl
            fullWidth
            margin="normal"
            error={!!errors.queryType}
            size={isMobile ? "small" : "medium"}
            sx={{
              minWidth: isMobile ? "100%" : 200,
              mb: isMobile ? 2 : 1,
            }}
          >
            <InputLabel
              id="query-type-label"
              sx={{
                fontSize: isMobile ? "0.875rem" : "1rem",
                fontFamily: POPPINS_FONT,
              }}
            >
              Query Type
            </InputLabel>
            <Select
              labelId="query-type-label"
              name="queryType"
              value={formData.queryType}
              onChange={handleChange}
              required
              label="Query Type"
              sx={{
                fontFamily: POPPINS_FONT,
                "& .MuiSelect-select": {
                  padding: isMobile ? "8px 14px" : "12px 14px",
                  fontSize: isMobile ? "0.875rem" : "1rem",
                },
                "& .MuiInputLabel-root": {
                  fontSize: isMobile ? "0.875rem" : "1rem",
                },
              }}
            >
              {QUERY_TYPES.map((type) => (
                <MenuItem
                  key={type.value}
                  value={type.value}
                  sx={{
                    fontSize: isMobile ? "0.875rem" : "1rem",
                    padding: isMobile ? "8px 16px" : "12px 16px",
                    fontFamily: POPPINS_FONT,
                  }}
                >
                  {type.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <TextField
            fullWidth
            multiline
            rows={isMobile ? 3 : 4}
            label="Description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            error={!!errors.description}
            helperText={errors.description}
            required
            margin="normal"
            size={isMobile ? "small" : "medium"}
            sx={{
              mb: isMobile ? 2 : 1,
              "& .MuiInputBase-root": {
                fontFamily: POPPINS_FONT,
                fontSize: isMobile ? "0.875rem" : "1rem",
              },
              "& .MuiInputLabel-root": {
                fontSize: isMobile ? "0.875rem" : "1rem",
                fontFamily: POPPINS_FONT,
              },
              "& .MuiFormHelperText-root": {
                fontSize: isMobile ? "0.75rem" : "0.875rem",
                fontFamily: POPPINS_FONT,
              },
            }}
          />

          <Box
            sx={{
              mt: isMobile ? 3 : 4,
              pt: isMobile ? 1.5 : 2,
              display: "flex",
              flexDirection: isMobile ? "column" : "row",
              justifyContent: isMobile ? "stretch" : "flex-end",
              gap: isMobile ? 1.5 : 2,
              borderTop: "1px solid #e2e8f0",
            }}
          >
            <button
              className="clear-filters-btn"
              onClick={onClose}
              disabled={isLoading}
              style={{
                fontSize: isMobile ? "0.875rem" : "1rem",
                padding: isMobile ? "10px 16px" : "8px 16px",
                fontFamily: POPPINS_FONT,
                order: isMobile ? 2 : 1,
              }}
            >
              Cancel
            </button>
            <button
              className="add-btn"
              type="submit"
              disabled={isLoading}
              style={{
                fontSize: isMobile ? "0.875rem" : "1rem",
                padding: isMobile ? "10px 16px" : "8px 16px",
                fontFamily: POPPINS_FONT,
                order: isMobile ? 1 : 2,
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              {isLoading ? (
                <div className="loading-spinner"></div>
              ) : (
                "Send Query"
              )}
            </button>
          </Box>
        </form>
      </Box>
    </Modal>
  );
};

export default QueryModal;
