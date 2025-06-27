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

const QueryModal = ({
  open,
  onClose,
  onSubmit,
  isLoading,
  formData,
  handleChange,
  errors,
}) => {
  return (
    <Modal
      open={open}
      onClose={onClose}
      aria-labelledby="query-modal"
      disableEnforceFocus
    >
      <Box sx={getModalStyles()}>
        <Typography
          variant="h6"
          component="h2"
          sx={{
            color: "#1e293b",
            fontSize: "1.25rem",
            fontWeight: 500,
            mb: 3,
          }}
        >
          Send Query to Admin
        </Typography>

        <form onSubmit={onSubmit}>
          <FormControl
            fullWidth
            margin="normal"
            error={!!errors.queryType}
            size="small"
            sx={{ minWidth: 200 }}
          >
            <InputLabel id="query-type-label">Query Type</InputLabel>
            <Select
              labelId="query-type-label"
              name="queryType"
              value={formData.queryType}
              onChange={handleChange}
              required
              label="Query Type"
              sx={{
                "& .MuiSelect-select": {
                  padding: "8px 14px",
                  fontSize: "0.875rem",
                },
              }}
            >
              {QUERY_TYPES.map((type) => (
                <MenuItem
                  key={type.value}
                  value={type.value}
                  sx={{
                    fontSize: "0.875rem",
                    padding: "6px 16px",
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
            rows={4}
            label="Description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            error={!!errors.description}
            helperText={errors.description}
            required
            margin="normal"
          />

          <Box
            sx={{
              mt: 4,
              pt: 2,
              display: "flex",
              justifyContent: "flex-end",
              gap: 2,
              borderTop: "1px solid #e2e8f0",
            }}
          >
            <button
              className="clear-filters-btn"
              onClick={onClose}
              disabled={isLoading}
            >
              Cancel
            </button>
            <button className="add-btn" type="submit" disabled={isLoading}>
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
