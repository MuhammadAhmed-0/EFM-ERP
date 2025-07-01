import { useState, useEffect } from "react";
import {
  FaSearch,
  FaFilter,
  FaUpload,
  FaPlus,
  FaEdit,
  FaFilePdf,
  FaTrash,
} from "react-icons/fa";
import {
  CircularProgress,
  Button,
  Select,
  MenuItem,
  InputLabel,
  FormControl,
  Modal,
  Box,
  Typography,
  TextField,
  Autocomplete,
  Chip,
} from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { TimePicker } from "@mui/x-date-pickers/TimePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import ReactDatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { format } from "date-fns";
import axios from "axios";
import "../../../../styles/components/Management.css";
import moment from "moment-timezone";
import useNotification from "../../../../hooks/useNotification";
import NotificationSnackbar from "../../../../components/common/NotificationSnackbar";
import SyncButton from "../../../../components/common/SyncButton";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

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

const DeleteAttendanceModal = ({
  showModal,
  setShowModal,
  staffMembers,
  onDeleteAttendance,
  isLoading,
  formatRole,
  attendance,
}) => {
  const { isMobile, isTablet } = useResponsive();
  const [selectedStaff, setSelectedStaff] = useState([]);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);
  const [password, setPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [searchValue, setSearchValue] = useState(null);

  const getStaffWithAttendance = () => {
    const staffIdsWithAttendance = [
      ...new Set(attendance.map((record) => record.user._id)),
    ];
    const staffWithRecords = staffMembers.filter((staff) =>
      staffIdsWithAttendance.includes(staff._id)
    );
    const staffWithAttendanceCount = staffWithRecords.map((staff) => {
      const attendanceCount = attendance.filter(
        (record) => record.user._id === staff._id
      ).length;
      return {
        ...staff,
        attendanceCount,
      };
    });

    return staffWithAttendanceCount;
  };

  const handleSearchSelect = (event, newValue) => {
    if (newValue) {
      if (!selectedStaff.includes(newValue._id)) {
        setSelectedStaff((prev) => [...prev, newValue._id]);
      }
      setSearchValue(null);
    }
  };

  const staffWithAttendance = getStaffWithAttendance();

  const handleStaffSelect = (staffId) => {
    setSelectedStaff((prev) =>
      prev.includes(staffId)
        ? prev.filter((id) => id !== staffId)
        : [...prev, staffId]
    );
  };

  const handleSelectAll = () => {
    if (selectedStaff.length === staffWithAttendance.length) {
      setSelectedStaff([]);
    } else {
      setSelectedStaff(staffWithAttendance.map((staff) => staff._id));
    }
  };

  const handleDeleteClick = () => {
    if (selectedStaff.length === 0) {
      return;
    }
    setShowPasswordConfirm(true);
    setPassword("");
    setPasswordError("");
  };

  const handlePasswordConfirm = async () => {
    if (password !== "admin123") {
      setPasswordError("Incorrect password. Please try again.");
      return;
    }

    setIsDeleting(true);
    try {
      await onDeleteAttendance(selectedStaff);
      setSelectedStaff([]);
      setShowPasswordConfirm(false);
      setPassword("");
      setPasswordError("");
      setShowModal(false);
    } catch (error) {
      console.error("Error deleting attendance:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCancelPassword = () => {
    setShowPasswordConfirm(false);
    setPassword("");
    setPasswordError("");
  };

  const handleModalClose = () => {
    if (!isDeleting && !showPasswordConfirm) {
      setShowModal(false);
      setSelectedStaff([]);
      setPassword("");
      setPasswordError("");
    }
  };

  const getSelectedStaffNames = () => {
    return selectedStaff
      .map((id) => staffWithAttendance.find((s) => s._id === id)?.name)
      .filter(Boolean)
      .join(", ");
  };

  return (
    <Modal
      open={showModal}
      onClose={handleModalClose}
      aria-labelledby="delete-attendance-modal"
    >
      <Box
        sx={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: {
            xs: "95vw",
            sm: "90vw",
            md: "700px",
            lg: "800px",
            xl: "900px",
          },
          maxWidth: {
            xs: "400px",
            sm: "600px",
            md: "700px",
            lg: "800px",
            xl: "900px",
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
          p: {
            xs: 2,
            sm: 3,
            md: 4,
          },
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          fontFamily:
            "'Poppins', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
          "&:focus-visible": {
            outline: "none",
          },
          "& *": {
            fontFamily:
              "'Poppins', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif !important",
          },
        }}
      >
        {!showPasswordConfirm ? (
          <>
            <Box
              sx={{
                borderBottom: "1px solid #e2e8f0",
                pb: {
                  xs: 1.5,
                  sm: 2,
                },
                mb: {
                  xs: 2,
                  sm: 3,
                },
              }}
            >
              <Typography
                variant="h6"
                component="h2"
                sx={{
                  color: "#dc2626",
                  fontWeight: 600,
                  fontSize: {
                    xs: "1.1rem",
                    sm: "1.25rem",
                    md: "1.5rem",
                  },
                }}
              >
                Delete Staff Attendance
              </Typography>
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{
                  mt: 1,
                  fontSize: {
                    xs: "0.8rem",
                    sm: "0.875rem",
                  },
                }}
              >
                Select staff members to delete all their attendance records
                permanently
              </Typography>
              {staffWithAttendance.length === 0 && (
                <Typography
                  variant="body2"
                  sx={{
                    mt: 1,
                    color: "#f59e0b",
                    fontSize: {
                      xs: "0.8rem",
                      sm: "0.875rem",
                    },
                  }}
                >
                  ⚠️ No staff members with attendance records found
                </Typography>
              )}
            </Box>

            {staffWithAttendance.length > 0 && (
              <Box
                sx={{
                  mb: {
                    xs: 1.5,
                    sm: 2,
                  },
                }}
              >
                <Autocomplete
                  options={staffWithAttendance}
                  getOptionLabel={(option) =>
                    `${option.staffId} - ${option.name} (${formatRole(
                      option.role
                    )}) - ${option.attendanceCount} records`
                  }
                  value={searchValue}
                  onChange={handleSearchSelect}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Search Staff by Name or ID"
                      size="small"
                      placeholder="Type to search and select staff..."
                      sx={{
                        fontFamily: "'Poppins', sans-serif",
                        "& .MuiOutlinedInput-root": {
                          backgroundColor: "#fafafa",
                          fontFamily: "'Poppins', sans-serif",
                          fontSize: {
                            xs: "0.875rem",
                            sm: "1rem",
                          },
                          "&:hover": {
                            backgroundColor: "#f5f5f5",
                          },
                          "&.Mui-focused": {
                            backgroundColor: "white",
                          },
                        },
                        "& .MuiInputLabel-root": {
                          fontFamily: "'Poppins', sans-serif",
                          fontSize: {
                            xs: "0.875rem",
                            sm: "1rem",
                          },
                        },
                        "& .MuiAutocomplete-input": {
                          fontFamily: "'Poppins', sans-serif",
                        },
                      }}
                    />
                  )}
                  renderOption={(props, option) => {
                    const { key, ...restProps } = props;
                    return (
                      <li key={key} {...restProps}>
                        <Box
                          sx={{
                            display: "flex",
                            justifyContent: "space-between",
                            width: "100%",
                            alignItems: "center",
                          }}
                        >
                          <Box>
                            <Typography
                              variant="body2"
                              fontWeight="500"
                              sx={{
                                fontSize: {
                                  xs: "0.8rem",
                                  sm: "0.875rem",
                                },
                              }}
                            >
                              {option.name}
                            </Typography>
                            <Typography
                              variant="caption"
                              color="text.secondary"
                              sx={{
                                fontSize: {
                                  xs: "0.7rem",
                                  sm: "0.75rem",
                                },
                              }}
                            >
                              ID: {option.staffId} | {formatRole(option.role)}
                            </Typography>
                          </Box>
                          <Box
                            sx={{
                              display: "flex",
                              flexDirection: "column",
                              alignItems: "flex-end",
                            }}
                          >
                            <Chip
                              label={
                                option.role === "admin"
                                  ? "Admin"
                                  : option.role.includes("teacher")
                                  ? "Teacher"
                                  : "Supervisor"
                              }
                              size="small"
                              sx={{
                                fontSize: "0.6rem",
                                height: "16px",
                                backgroundColor:
                                  option.role === "admin"
                                    ? "#fef3c7"
                                    : option.role.includes("teacher")
                                    ? "#dbeafe"
                                    : "#f3e8ff",
                                color:
                                  option.role === "admin"
                                    ? "#b45309"
                                    : option.role.includes("teacher")
                                    ? "#1e40af"
                                    : "#7c3aed",
                              }}
                            />
                            <Typography
                              variant="caption"
                              sx={{
                                fontSize: {
                                  xs: "0.55rem",
                                  sm: "0.6rem",
                                },
                                color: "#dc2626",
                                mt: 0.5,
                              }}
                            >
                              {option.attendanceCount} records
                            </Typography>
                          </Box>
                        </Box>
                      </li>
                    );
                  }}
                  filterOptions={(options, { inputValue }) => {
                    const searchTerm = inputValue.toLowerCase();
                    return options.filter((option) => {
                      const nameMatch = option.name
                        .toLowerCase()
                        .includes(searchTerm);
                      const idMatch = String(option.staffId || "").includes(
                        searchTerm
                      );
                      const roleMatch = formatRole(option.role)
                        .toLowerCase()
                        .includes(searchTerm);
                      return nameMatch || idMatch || roleMatch;
                    });
                  }}
                  noOptionsText="No staff members found"
                  clearOnEscape
                  blurOnSelect
                />
              </Box>
            )}

            <Box
              sx={{
                border: "1px solid #e2e8f0",
                borderRadius: "8px",
                overflow: "hidden",
                flex: 1,
                minHeight: 0,
              }}
            >
              <Box
                sx={{
                  bgcolor: "#fef2f2",
                  p: {
                    xs: 1.5,
                    sm: 2,
                  },
                  borderBottom: "1px solid #e2e8f0",
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
                <Typography
                  variant="subtitle2"
                  fontWeight="600"
                  sx={{
                    color: "#dc2626",
                    fontSize: {
                      xs: "0.9rem",
                      sm: "1rem",
                    },
                  }}
                >
                  Staff Members with Attendance ({staffWithAttendance.length}{" "}
                  total)
                </Typography>
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: {
                      xs: 1,
                      sm: 2,
                    },
                    flexDirection: {
                      xs: "column",
                      sm: "row",
                    },
                  }}
                >
                  {selectedStaff.length > 0 && (
                    <Typography
                      variant="caption"
                      sx={{
                        color: "#dc2626",
                        fontSize: {
                          xs: "0.75rem",
                          sm: "0.8rem",
                        },
                      }}
                    >
                      {selectedStaff.length} selected for deletion
                    </Typography>
                  )}
                  {staffWithAttendance.length > 0 && (
                    <Button
                      size="small"
                      onClick={handleSelectAll}
                      sx={{
                        textTransform: "none",
                        color: "#dc2626",
                        fontSize: {
                          xs: "0.75rem",
                          sm: "0.875rem",
                        },
                        padding: {
                          xs: "4px 8px",
                          sm: "6px 12px",
                        },
                        "&:hover": { bgcolor: "rgba(220, 38, 38, 0.1)" },
                      }}
                    >
                      {selectedStaff.length === staffWithAttendance.length
                        ? "Deselect All"
                        : "Select All"}
                    </Button>
                  )}
                </Box>
              </Box>

              <Box
                sx={{
                  maxHeight: {
                    xs: "250px",
                    sm: "300px",
                    md: "350px",
                  },
                  overflowY: "auto",
                  p: {
                    xs: 0.5,
                    sm: 1,
                  },
                }}
              >
                {staffWithAttendance.length === 0 ? (
                  <Box
                    sx={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      p: {
                        xs: 2,
                        sm: 3,
                        md: 4,
                      },
                      color: "#64748b",
                    }}
                  >
                    <Typography
                      variant="h6"
                      sx={{
                        mb: 1,
                        color: "#f59e0b",
                        fontSize: {
                          xs: "1rem",
                          sm: "1.25rem",
                        },
                      }}
                    >
                      📊 No Records Found
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{
                        mb: 1,
                        textAlign: "center",
                        fontSize: {
                          xs: "0.8rem",
                          sm: "0.875rem",
                        },
                      }}
                    >
                      No staff members with attendance records found
                    </Typography>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{
                        textAlign: "center",
                        fontSize: {
                          xs: "0.7rem",
                          sm: "0.75rem",
                        },
                      }}
                    >
                      Only staff members with existing attendance records can be
                      deleted
                    </Typography>
                  </Box>
                ) : (
                  staffWithAttendance.map((staff) => (
                    <Box
                      key={staff._id}
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        p: {
                          xs: 1,
                          sm: 1.5,
                          md: 2,
                        },
                        borderRadius: "6px",
                        cursor: "pointer",
                        mb: 1,
                        "&:hover": {
                          bgcolor: "#fef2f2",
                        },
                        bgcolor: selectedStaff.includes(staff._id)
                          ? "#fee2e2"
                          : "transparent",
                        border: selectedStaff.includes(staff._id)
                          ? "2px solid #dc2626"
                          : "2px solid transparent",
                      }}
                      onClick={() => handleStaffSelect(staff._id)}
                    >
                      <input
                        type="checkbox"
                        checked={selectedStaff.includes(staff._id)}
                        onChange={() => handleStaffSelect(staff._id)}
                        style={{
                          marginRight: "12px",
                          accentColor: "#dc2626",
                          transform: isMobile ? "scale(0.9)" : "scale(1)",
                        }}
                      />
                      <Box sx={{ flex: 1 }}>
                        <Typography
                          variant="body2"
                          fontWeight="500"
                          sx={{
                            fontSize: {
                              xs: "0.8rem",
                              sm: "0.875rem",
                            },
                          }}
                        >
                          {staff.name}
                        </Typography>
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          sx={{
                            fontSize: {
                              xs: "0.7rem",
                              sm: "0.75rem",
                            },
                          }}
                        >
                          Staff ID: {staff.staffId} | {formatRole(staff.role)}
                        </Typography>
                        <Typography
                          variant="caption"
                          sx={{
                            color: "#dc2626",
                            display: "block",
                            fontWeight: 500,
                            mt: 0.5,
                            fontSize: {
                              xs: "0.7rem",
                              sm: "0.75rem",
                            },
                          }}
                        >
                          📋 {staff.attendanceCount} attendance record
                          {staff.attendanceCount !== 1 ? "s" : ""}
                        </Typography>
                        {staff.isActive === false && (
                          <Typography
                            variant="caption"
                            sx={{
                              color: "#dc2626",
                              backgroundColor: "#fee2e2",
                              padding: "2px 6px",
                              borderRadius: "4px",
                              marginLeft: "8px",
                              fontSize: {
                                xs: "0.6rem",
                                sm: "0.7rem",
                              },
                              display: "inline-block",
                              mt: 0.5,
                            }}
                          >
                            Inactive
                          </Typography>
                        )}
                      </Box>
                      <Box
                        sx={{
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "flex-end",
                          gap: 1,
                        }}
                      >
                        <Chip
                          label={
                            staff.role === "admin"
                              ? "Admin"
                              : staff.role.includes("teacher")
                              ? "Teacher"
                              : "Supervisor"
                          }
                          size="small"
                          sx={{
                            backgroundColor:
                              staff.role === "admin"
                                ? "#fef3c7"
                                : staff.role.includes("teacher")
                                ? "#dbeafe"
                                : "#f3e8ff",
                            color:
                              staff.role === "admin"
                                ? "#b45309"
                                : staff.role.includes("teacher")
                                ? "#1e40af"
                                : "#7c3aed",
                            fontSize: {
                              xs: "0.65rem",
                              sm: "0.75rem",
                            },
                          }}
                        />
                        <Typography
                          variant="caption"
                          sx={{
                            color: "#64748b",
                            fontSize: {
                              xs: "0.65rem",
                              sm: "0.7rem",
                            },
                            backgroundColor: "#f1f5f9",
                            padding: "2px 6px",
                            borderRadius: "4px",
                          }}
                        >
                          {staff.attendanceCount} records
                        </Typography>
                      </Box>
                    </Box>
                  ))
                )}
              </Box>
            </Box>

            {selectedStaff.length > 0 && (
              <Box
                sx={{
                  mt: {
                    xs: 1.5,
                    sm: 2,
                  },
                  p: {
                    xs: 1.5,
                    sm: 2,
                  },
                  bgcolor: "#fef2f2",
                  border: "1px solid #fecaca",
                  borderRadius: "6px",
                }}
              >
                <Typography
                  variant="body2"
                  sx={{
                    color: "#dc2626",
                    fontWeight: 500,
                    fontSize: {
                      xs: "0.8rem",
                      sm: "0.875rem",
                    },
                  }}
                >
                  ⚠️ Warning: This will permanently delete all attendance
                  records for{" "}
                  <strong>
                    {selectedStaff.length} staff member
                    {selectedStaff.length > 1 ? "s" : ""}
                  </strong>
                  {selectedStaff.length <= 3 && `: ${getSelectedStaffNames()}`}.
                  This action cannot be undone.
                </Typography>
              </Box>
            )}

            <Box
              sx={{
                display: "flex",
                justifyContent: "flex-end",
                gap: {
                  xs: 1,
                  sm: 2,
                },
                mt: {
                  xs: 2,
                  sm: 3,
                },
                pt: {
                  xs: 1.5,
                  sm: 2,
                },
                borderTop: "1px solid #e2e8f0",
                flexDirection: {
                  xs: "column",
                  sm: "row",
                },
                "& button": {
                  fontSize: {
                    xs: "0.8rem",
                    sm: "0.875rem",
                  },
                  padding: {
                    xs: "10px 16px",
                    sm: "12px 20px",
                  },
                  width: {
                    xs: "100%",
                    sm: "auto",
                  },
                },
              }}
            >
              <button
                className="clear-filters-btn"
                onClick={() => setShowModal(false)}
              >
                Cancel
              </button>
              <button
                className="delete-btn"
                onClick={handleDeleteClick}
                disabled={
                  selectedStaff.length === 0 || staffWithAttendance.length === 0
                }
              >
                {staffWithAttendance.length === 0
                  ? "No Records to Delete"
                  : `Delete Attendance for ${
                      selectedStaff.length
                    } Staff Member${selectedStaff.length > 1 ? "s" : ""}`}
              </button>
            </Box>
          </>
        ) : (
          <>
            <Box
              sx={{
                borderBottom: "1px solid #e2e8f0",
                pb: {
                  xs: 1.5,
                  sm: 2,
                },
                mb: {
                  xs: 2,
                  sm: 3,
                },
              }}
            >
              <Typography
                variant="h6"
                component="h2"
                sx={{
                  color: "#dc2626",
                  fontWeight: 600,
                  fontSize: {
                    xs: "1.1rem",
                    sm: "1.25rem",
                  },
                }}
              >
                🔒 Confirm Multiple Deletion
              </Typography>
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{
                  mt: 1,
                  fontSize: {
                    xs: "0.8rem",
                    sm: "0.875rem",
                  },
                }}
              >
                Enter admin password to confirm deletion of all attendance
                records for{" "}
                <strong>
                  {selectedStaff.length} staff member
                  {selectedStaff.length > 1 ? "s" : ""}
                </strong>
              </Typography>
            </Box>

            <Box
              sx={{
                my: {
                  xs: 2,
                  sm: 3,
                },
              }}
            >
              <TextField
                fullWidth
                type="password"
                label="Admin Password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (passwordError) setPasswordError("");
                }}
                error={!!passwordError}
                helperText={passwordError}
                placeholder="Enter admin password"
                autoFocus
                onKeyPress={(e) => {
                  if (e.key === "Enter" && password) {
                    handlePasswordConfirm();
                  }
                }}
                sx={{
                  fontFamily: "'Poppins', sans-serif",
                  "& .MuiOutlinedInput-root": {
                    fontFamily: "'Poppins', sans-serif",
                    fontSize: {
                      xs: "0.875rem",
                      sm: "1rem",
                    },
                    "&.Mui-error": {
                      "& fieldset": {
                        borderColor: "#dc2626",
                      },
                    },
                  },
                  "& .MuiInputLabel-root": {
                    fontFamily: "'Poppins', sans-serif",
                    fontSize: {
                      xs: "0.875rem",
                      sm: "1rem",
                    },
                  },
                  "& .MuiFormHelperText-root": {
                    fontFamily: "'Poppins', sans-serif",
                    fontSize: {
                      xs: "0.75rem",
                      sm: "0.875rem",
                    },
                  },
                }}
              />
            </Box>

            <Box
              sx={{
                p: {
                  xs: 1.5,
                  sm: 2,
                },
                bgcolor: "#fef2f2",
                border: "1px solid #fecaca",
                borderRadius: "6px",
                mb: {
                  xs: 2,
                  sm: 3,
                },
              }}
            >
              <Typography
                variant="body2"
                sx={{
                  color: "#dc2626",
                  fontWeight: 500,
                  fontSize: {
                    xs: "0.8rem",
                    sm: "0.875rem",
                  },
                }}
              >
                ⚠️ Final Warning: You are about to permanently delete all
                attendance records for{" "}
                <strong>
                  {selectedStaff.length} staff member
                  {selectedStaff.length > 1 ? "s" : ""}
                </strong>
                {selectedStaff.length <= 3 && ` (${getSelectedStaffNames()})`}.
                This action cannot be undone.
              </Typography>
            </Box>

            <Box
              sx={{
                display: "flex",
                justifyContent: "flex-end",
                gap: {
                  xs: 1,
                  sm: 2,
                },
                pt: {
                  xs: 1.5,
                  sm: 2,
                },
                borderTop: "1px solid #e2e8f0",
                flexDirection: {
                  xs: "column",
                  sm: "row",
                },
                "& button": {
                  fontSize: {
                    xs: "0.8rem",
                    sm: "0.875rem",
                  },
                  padding: {
                    xs: "8px 16px",
                    sm: "10px 20px",
                  },
                  width: {
                    xs: "100%",
                    sm: "auto",
                  },
                },
              }}
            >
              <button
                className="clear-filters-btn"
                onClick={handleCancelPassword}
                disabled={isDeleting}
              >
                Cancel
              </button>
              <button
                className="delete-btn"
                onClick={handlePasswordConfirm}
                disabled={!password || isDeleting}
              >
                {isDeleting ? (
                  <div className="loading-spinner"></div>
                ) : (
                  "Confirm Delete All"
                )}
              </button>
            </Box>
          </>
        )}
      </Box>
    </Modal>
  );
};
const AttendanceModal = ({
  open,
  onClose,
  formData,
  handleChange,
  handleSubmit,
  staffMembers,
  errors,
  isLoading,
  handleDateChange,
  handleTimeChange,
  isEditMode,
}) => {
  const { isMobile, isTablet } = useResponsive();

  return (
    <Modal
      open={open}
      onClose={() => !isLoading && onClose()}
      disableEnforceFocus
      disableAutoFocus
    >
      <Box
        sx={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: {
            xs: "95vw",
            sm: "90vw",
            md: "600px",
            lg: "650px",
            xl: "700px",
          },
          maxWidth: {
            xs: "400px",
            sm: "500px",
            md: "600px",
            lg: "650px",
            xl: "700px",
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
          p: {
            xs: 2,
            sm: 3,
            md: 4,
          },
          overflowY: "auto",
          "&:focus-visible": {
            outline: "none",
          },
          fontFamily:
            "'Poppins', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
        }}
      >
        <Box
          sx={{
            position: "relative",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            mb: {
              xs: 2,
              sm: 2.5,
              md: 3,
            },
          }}
        >
          <Typography
            variant="h6"
            component="h2"
            sx={{
              color: "#1e293b",
              fontSize: {
                xs: "1.1rem",
                sm: "1.2rem",
                md: "1.25rem",
                lg: "1.3rem",
              },
              fontWeight: 500,
              textAlign: "center",
              lineHeight: 1.2,
              flex: 1,
            }}
          >
            {isEditMode ? "Update Staff Attendance" : "Mark Staff Attendance"}
          </Typography>
          <Button
            onClick={onClose}
            sx={{
              position: "absolute",
              right: 0,
              top: "50%",
              transform: "translateY(-50%)",
              minWidth: "auto",
              p: {
                xs: 1,
                sm: 1,
              },
              color: "#64748b",
              fontSize: {
                xs: "1.5rem",
                sm: "1.5rem",
                md: "1.8rem",
              },
              "&:hover": {
                bgcolor: "#f1f5f9",
                color: "#3949ab",
              },
            }}
            disabled={isLoading}
          >
            ×
          </Button>
        </Box>

        <form onSubmit={handleSubmit}>
          <FormControl
            fullWidth
            margin="normal"
            size="small"
            required
            sx={{
              mb: {
                xs: 1.5,
                sm: 2,
                md: 2.5,
              },
            }}
          >
            <Autocomplete
              fullWidth
              options={staffMembers.filter((staff) => staff.isActive !== false)}
              getOptionLabel={(option) =>
                `${option.staffId ? `${option.staffId} - ` : ""}${
                  option.name
                } (${option.role
                  .replace(/_/g, " ")
                  .replace(/\b\w/g, (l) => l.toUpperCase())})`
              }
              value={
                staffMembers.find(
                  (staff) => staff._id === formData.staffUserId
                ) || null
              }
              onChange={(event, newValue) => {
                handleChange({
                  target: {
                    name: "staffUserId",
                    value: newValue ? newValue._id : "",
                  },
                });
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Staff Member (Active Only)"
                  margin="normal"
                  size="small"
                  required
                  error={!!errors.staffUserId}
                  helperText={errors.staffUserId}
                  disabled={isEditMode}
                  sx={{
                    "& .MuiInputBase-root": {
                      fontSize: {
                        xs: "0.875rem",
                        sm: "0.9rem",
                        md: "1rem",
                      },
                    },
                    "& .MuiInputLabel-root": {
                      fontSize: {
                        xs: "0.875rem",
                        sm: "0.9rem",
                        md: "1rem",
                      },
                    },
                  }}
                />
              )}
            />
          </FormControl>

          <LocalizationProvider dateAdapter={AdapterDateFns}>
            <DatePicker
              label="Date"
              value={formData.date}
              onChange={(date) => handleDateChange(date)}
              slotProps={{
                textField: {
                  fullWidth: true,
                  margin: "normal",
                  size: "small",
                  required: true,
                  error: !!errors.date,
                  helperText: errors.date,
                  sx: {
                    mb: {
                      xs: 1.5,
                      sm: 2,
                      md: 2.5,
                    },
                    "& .MuiInputBase-root": {
                      fontSize: {
                        xs: "0.875rem",
                        sm: "0.9rem",
                        md: "1rem",
                      },
                    },
                    "& .MuiInputLabel-root": {
                      fontSize: {
                        xs: "0.875rem",
                        sm: "0.9rem",
                        md: "1rem",
                      },
                    },
                  },
                },
              }}
              maxDate={new Date()}
              disabled={isEditMode}
            />
          </LocalizationProvider>

          <FormControl
            fullWidth
            margin="normal"
            size="small"
            required
            sx={{
              mb: {
                xs: 1.5,
                sm: 2,
                md: 2.5,
              },
            }}
          >
            <InputLabel>Status</InputLabel>
            <Select
              name="status"
              value={formData.status}
              label="Status"
              onChange={handleChange}
              error={!!errors.status}
              sx={{
                "& .MuiSelect-select": {
                  fontSize: {
                    xs: "0.875rem",
                    sm: "0.9rem",
                    md: "1rem",
                  },
                },
              }}
            >
              <MenuItem value="present">Present</MenuItem>
              <MenuItem value="absent">Absent</MenuItem>
              <MenuItem value="leave">Leave</MenuItem>
            </Select>
            {errors.status && (
              <Typography
                color="error"
                variant="caption"
                sx={{
                  fontSize: {
                    xs: "0.75rem",
                    sm: "0.8rem",
                  },
                }}
              >
                {errors.status}
              </Typography>
            )}
          </FormControl>

          {formData.status === "present" && (
            <LocalizationProvider dateAdapter={AdapterDateFns}>
              <Box
                sx={{
                  display: "flex",
                  gap: 2,
                  flexDirection: {
                    xs: "column",
                    sm: "row",
                  },
                }}
              >
                <TimePicker
                  label="In Time"
                  value={
                    formData.inTime
                      ? new Date(`2022-01-01T${formData.inTime}`)
                      : null
                  }
                  onChange={(time) => handleTimeChange(time, "inTime")}
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      margin: "normal",
                      size: "small",
                      error: !!errors.inTime,
                      helperText: errors.inTime,
                      sx: {
                        "& .MuiInputBase-root": {
                          fontSize: {
                            xs: "0.875rem",
                            sm: "0.9rem",
                            md: "1rem",
                          },
                        },
                        "& .MuiInputLabel-root": {
                          fontSize: {
                            xs: "0.875rem",
                            sm: "0.9rem",
                            md: "1rem",
                          },
                        },
                      },
                    },
                  }}
                />
                <TimePicker
                  label="Out Time"
                  value={
                    formData.outTime
                      ? new Date(`2022-01-01T${formData.outTime}`)
                      : null
                  }
                  onChange={(time) => handleTimeChange(time, "outTime")}
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      margin: "normal",
                      size: "small",
                      error: !!errors.outTime,
                      helperText: errors.outTime,
                      sx: {
                        "& .MuiInputBase-root": {
                          fontSize: {
                            xs: "0.875rem",
                            sm: "0.9rem",
                            md: "1rem",
                          },
                        },
                        "& .MuiInputLabel-root": {
                          fontSize: {
                            xs: "0.875rem",
                            sm: "0.9rem",
                            md: "1rem",
                          },
                        },
                      },
                    },
                  }}
                />
              </Box>
            </LocalizationProvider>
          )}

          <TextField
            fullWidth
            label="Remarks"
            name="remarks"
            value={formData.remarks}
            onChange={handleChange}
            margin="normal"
            size="small"
            multiline
            rows={3}
            sx={{
              mb: {
                xs: 2,
                sm: 2.5,
                md: 3,
              },
              "& .MuiInputBase-root": {
                fontSize: {
                  xs: "0.875rem",
                  sm: "0.9rem",
                  md: "1rem",
                },
                minHeight: {
                  xs: "80px",
                  sm: "100px",
                  md: "120px",
                },
              },
              "& .MuiInputLabel-root": {
                fontSize: {
                  xs: "0.875rem",
                  sm: "0.9rem",
                  md: "1rem",
                },
              },
            }}
          />

          <Box
            sx={{
              mt: {
                xs: 3,
                sm: 3.5,
                md: 4,
              },
              pt: {
                xs: 1.5,
                sm: 2,
              },
              display: "flex",
              justifyContent: {
                xs: "center",
                sm: "flex-end",
              },
              gap: {
                xs: 1.5,
                sm: 2,
              },
              borderTop: "1px solid #e2e8f0",
              flexDirection: {
                xs: "column",
                sm: "row",
              },
              "& button": {
                minHeight: {
                  xs: "44px",
                  sm: "40px",
                  md: "44px",
                },
                fontSize: {
                  xs: "0.875rem",
                  sm: "0.9rem",
                  md: "1rem",
                },
                padding: {
                  xs: "12px 20px",
                  sm: "10px 16px",
                  md: "10px 20px",
                },
                width: {
                  xs: "100%",
                  sm: "auto",
                },
                textAlign: "center !important",
                justifyContent: "center !important",
                display: "flex !important",
                alignItems: "center !important",
              },
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
              ) : isEditMode ? (
                "Update Attendance"
              ) : (
                "Mark Attendance"
              )}
            </button>
          </Box>
        </form>
      </Box>
    </Modal>
  );
};
const StaffAttendance = () => {
  const [attendance, setAttendance] = useState([]);
  const [filteredAttendance, setFilteredAttendance] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [dateRange, setDateRange] = useState([null, null]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [staffMembers, setStaffMembers] = useState([]);
  const [selectedStaff, setSelectedStaff] = useState("all");
  const [showAttendanceModal, setShowAttendanceModal] = useState(false);
  const [showActiveStaff, setShowActiveStaff] = useState(false);
  const [showInactiveStaff, setShowInactiveStaff] = useState(false);
  const [staffWithAttendance, setStaffWithAttendance] = useState([]);
  const [attendanceFormData, setAttendanceFormData] = useState({
    staffUserId: "",
    date: new Date(),
    status: "present",
    inTime: "",
    outTime: "",
    remarks: "",
  });
  const [isEditMode, setIsEditMode] = useState(false);
  const [currentAttendance, setCurrentAttendance] = useState(null);
  const [attendanceErrors, setAttendanceErrors] = useState({});
  const [isSubmittingAttendance, setIsSubmittingAttendance] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const { isMobile, isTablet, isDesktop } = useResponsive();

  const [stats, setStats] = useState({
    total: 0,
    present: 0,
    absent: 0,
    leave: 0,
    todayPresent: 0,
  });
  const { notification, showNotification, closeNotification } =
    useNotification();

  const BASE_URL = import.meta.env.VITE_BASE_URL;
  const formatRole = (role) => {
    switch (role) {
      case "admin":
        return "Admin";
      case "teacher_quran":
        return "Quran Teacher";
      case "teacher_subjects":
        return "Subject Teacher";
      case "supervisor_quran":
        return "Quran Supervisor";
      case "supervisor_subjects":
        return "Subject Supervisor";
      default:
        return role.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
    }
  };
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    }
  }, []);

  const handleAttendanceChange = (e) => {
    const { name, value } = e.target;
    setAttendanceFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    if (attendanceErrors[name]) {
      setAttendanceErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };
  const handleAttendanceDateChange = (date) => {
    setAttendanceFormData((prev) => ({
      ...prev,
      date,
    }));
  };

  const handleAttendanceTimeChange = (time, field) => {
    if (!time) {
      setAttendanceFormData((prev) => ({
        ...prev,
        [field]: "",
      }));
      return;
    }

    const formattedTime = format(time, "HH:mm");
    setAttendanceFormData((prev) => ({
      ...prev,
      [field]: formattedTime,
    }));
  };

  const validateAttendanceForm = () => {
    const errors = {};
    if (!attendanceFormData.staffUserId) {
      errors.staffUserId = "Staff member is required";
    }
    if (!attendanceFormData.date) {
      errors.date = "Date is required";
    }
    if (!attendanceFormData.status) {
      errors.status = "Status is required";
    }

    if (attendanceFormData.status === "present") {
      if (attendanceFormData.inTime && attendanceFormData.outTime) {
        const [inHour, inMinute] = attendanceFormData.inTime
          .split(":")
          .map(Number);
        const [outHour, outMinute] = attendanceFormData.outTime
          .split(":")
          .map(Number);

        if (outHour < inHour || (outHour === inHour && outMinute <= inMinute)) {
          errors.outTime = "Out time must be after in time";
        }
      }
    }

    setAttendanceErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleDeleteAttendance = async (staffIds) => {
    try {
      const token = localStorage.getItem("token");

      const idsArray = Array.isArray(staffIds) ? staffIds : [staffIds];

      const response = await axios.delete(
        `${BASE_URL}/api/staff-attendance/delete-multiple`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          data: {
            staffIds: idsArray,
          },
        }
      );

      showNotification(response.data.message, "success");
      await fetchAttendance();
    } catch (error) {
      console.error("Error deleting attendance records:", error);
      showNotification(
        error.response?.data?.message || "Error deleting attendance records",
        "error"
      );
    }
  };
  const handleAttendanceSubmit = async (e) => {
    e.preventDefault();

    if (!validateAttendanceForm()) return;

    setIsSubmittingAttendance(true);
    try {
      const token = localStorage.getItem("token");

      const payload = {
        staffUserId: attendanceFormData.staffUserId,
        date: format(attendanceFormData.date, "yyyy-MM-dd"),
        status: attendanceFormData.status,
        remarks: attendanceFormData.remarks,
      };

      if (attendanceFormData.status === "present") {
        if (attendanceFormData.inTime) {
          payload.inTime = attendanceFormData.inTime;
        }
        if (attendanceFormData.outTime) {
          payload.outTime = attendanceFormData.outTime;
        }
      }

      await axios.post(`${BASE_URL}/api/staff-attendance/mark`, payload, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      showNotification("Attendance marked successfully");
      setShowAttendanceModal(false);
      fetchAttendance();

      setAttendanceFormData({
        staffUserId: "",
        date: new Date(),
        status: "present",
        inTime: "",
        outTime: "",
        remarks: "",
      });
    } catch (error) {
      console.error("Error marking attendance:", error);
      showNotification(
        error.response?.data?.message || "Error marking attendance",
        "error"
      );
    } finally {
      setIsSubmittingAttendance(false);
    }
  };

  const handleEditAttendance = (record) => {
    setCurrentAttendance(record);
    setAttendanceFormData({
      staffUserId: record.user._id,
      date: new Date(record.date),
      status: record.status,
      inTime: record.inTime || "",
      outTime: record.outTime || "",
      remarks: record.remarks || "",
    });
    setIsEditMode(true);
    setShowAttendanceModal(true);
  };
  const handleUpdateAttendance = async (e) => {
    e.preventDefault();

    if (!validateAttendanceForm()) return;

    setIsSubmittingAttendance(true);
    try {
      const token = localStorage.getItem("token");

      const payload = {
        status: attendanceFormData.status,
        remarks: attendanceFormData.remarks,
      };

      if (attendanceFormData.status === "present") {
        if (attendanceFormData.inTime) {
          payload.inTime = attendanceFormData.inTime;
        }
        if (attendanceFormData.outTime) {
          payload.outTime = attendanceFormData.outTime;
        }
      }

      await axios.put(
        `${BASE_URL}/api/staff-attendance/update/${currentAttendance._id}`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      showNotification("Attendance updated successfully");
      setShowAttendanceModal(false);
      fetchAttendance();
      resetAttendanceForm();
    } catch (error) {
      console.error("Error updating attendance:", error);
      showNotification(
        error.response?.data?.message || "Error updating attendance",
        "error"
      );
    } finally {
      setIsSubmittingAttendance(false);
    }
  };

  const getStaffWithAttendance = () => {
    const staffIdsWithAttendance = [
      ...new Set(attendance.map((record) => record.user._id)),
    ];
    const staffWithRecords = staffMembers.filter((staff) =>
      staffIdsWithAttendance.includes(staff._id)
    );
    const staffWithAttendanceCount = staffWithRecords.map((staff) => {
      const attendanceCount = attendance.filter(
        (record) => record.user._id === staff._id
      ).length;
      return {
        ...staff,
        attendanceCount,
      };
    });

    return staffWithAttendanceCount;
  };

  useEffect(() => {
    const staffWithRecords = getStaffWithAttendance();
    setStaffWithAttendance(staffWithRecords);
  }, [attendance, staffMembers]);

  const resetAttendanceForm = () => {
    setAttendanceFormData({
      staffUserId: "",
      date: new Date(),
      status: "present",
      inTime: "",
      outTime: "",
      remarks: "",
    });
    setIsEditMode(false);
    setCurrentAttendance(null);
  };
  const handleSubmit = (e) => {
    if (isEditMode) {
      handleUpdateAttendance(e);
    } else {
      handleAttendanceSubmit(e);
    }
  };
  const handleCloseModal = () => {
    if (!isSubmittingAttendance) {
      resetAttendanceForm();
      setShowAttendanceModal(false);
    }
  };
  const fetchStaffMembers = async () => {
    try {
      const response = await axios.get(`${BASE_URL}/api/admin/users`);
      const filteredStaff = response.data.users.filter(
        (user) => !["client", "student"].includes(user.role)
      );
      setStaffMembers(filteredStaff);
    } catch (error) {
      showNotification("Error fetching staff members", "error");
    }
  };

  const fetchAttendance = async () => {
    setIsSyncing(true);
    setIsLoading(true);
    try {
      const response = await axios.get(
        `${BASE_URL}/api/staff-attendance/admin/view`
      );
      setAttendance(response.data.data);
      calculateStats(response.data.data);
      showNotification("Attendance data refreshed successfully");
    } catch (error) {
      showNotification(
        error.response?.data?.message || "Error fetching attendance",
        "error"
      );
    } finally {
      setIsSyncing(false);
      setIsLoading(false);
    }
  };

  const exportToPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(20);
    doc.text("Staff Attendance Report", 14, 22);
    doc.setFontSize(10);
    doc.text(
      `Generated on: ${moment().tz("Asia/Karachi").format("DD/MM/YYYY HH:mm")}`,
      14,
      32
    );
    doc.text(`Total Records: ${filteredAttendance.length}`, 14, 38);
    let yPosition = 44;
    if (searchTerm) {
      doc.text(`Search Term: ${searchTerm}`, 14, yPosition);
      yPosition += 6;
    }
    if (selectedStaff !== "all") {
      const staffName =
        staffMembers.find((s) => s._id === selectedStaff)?.name || "Unknown";
      doc.text(`Staff Filter: ${staffName}`, 14, yPosition);
      yPosition += 6;
    }
    if (dateRange[0] && dateRange[1]) {
      doc.text(
        `Date Range: ${moment(dateRange[0])
          .tz("Asia/Karachi")
          .format("DD/MM/YYYY")} - ${moment(dateRange[1])
          .tz("Asia/Karachi")
          .format("DD/MM/YYYY")}`,
        14,
        yPosition
      );
      yPosition += 6;
    }

    const tableData = filteredAttendance.map((record) => [
      record.staffId || "",
      record.name || "",
      formatRole(record.role),
      moment(record.date).tz("Asia/Karachi").format("DD/MM/YYYY"),
      record.inTime ? moment(record.inTime, "HH:mm").format("hh:mm A") : "",
      record.outTime ? moment(record.outTime, "HH:mm").format("hh:mm A") : "",
      record.totalDuration || "",
      record.status.charAt(0).toUpperCase() + record.status.slice(1),
      record.isActive === false ? "Inactive" : "Active",
    ]);

    autoTable(doc, {
      head: [
        [
          "ID",
          "Name",
          "Role",
          "Date",
          "In Time",
          "Out Time",
          "Duration",
          "Status",
          "Active",
        ],
      ],
      body: tableData,
      startY: yPosition + 10,
      styles: {
        fontSize: 9,
        cellPadding: 2,
      },
      headStyles: {
        fillColor: [31, 61, 97],
        textColor: 255,
        fontStyle: "bold",
        fontSize: 11,
      },
      columnStyles: {
        0: { cellWidth: 20 },
        1: { cellWidth: 20 },
        2: { cellWidth: 25 },
        3: { cellWidth: 20 },
        4: { cellWidth: 20 },
        5: { cellWidth: 20 },
        6: { cellWidth: 20 },
        7: { cellWidth: 20 },
        8: { cellWidth: 18 },
      },
      alternateRowStyles: {
        fillColor: [245, 245, 245],
      },
    });

    const fileName = `staff-attendance-${moment()
      .tz("Asia/Karachi")
      .format("YYYY-MM-DD-HHmm")}.pdf`;
    doc.save(fileName);

    showNotification("PDF exported successfully");
  };
  const calculateStats = (data) => {
    const today = moment().tz("Asia/Karachi").format("YYYY-MM-DD");

    const stats = data.reduce(
      (acc, curr) => {
        acc.total++;
        const status = curr.status.toLowerCase();
        acc[status] = (acc[status] || 0) + 1;

        const recordDate = moment(curr.date)
          .tz("Asia/Karachi")
          .format("YYYY-MM-DD");
        if (recordDate === today && status === "present") {
          acc.todayPresent++;
        }

        return acc;
      },
      { total: 0, present: 0, absent: 0, leave: 0, todayPresent: 0 }
    );

    setStats(stats);
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    setIsLoading(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        showNotification("Authorization token not found", "error");
        return;
      }

      const response = await axios.post(
        `${BASE_URL}/api/staff-attendance/upload-attendance`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      showNotification(
        response.data.message || "Attendance data uploaded successfully"
      );
      await fetchAttendance();

      event.target.value = "";
    } catch (error) {
      showNotification(
        error.response?.data?.message || "Error uploading attendance",
        "error"
      );
      console.error("Upload error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    let filtered = [...attendance];

    if (!dateRange[0] && !dateRange[1]) {
      const currentMonthStart = moment().tz("Asia/Karachi").startOf("month");
      const currentMonthEnd = moment().tz("Asia/Karachi").endOf("month");

      filtered = filtered.filter((record) => {
        const recordDate = moment(record.date)
          .tz("Asia/Karachi")
          .startOf("day");
        return recordDate.isBetween(
          currentMonthStart,
          currentMonthEnd,
          "day",
          "[]"
        );
      });
    } else if (dateRange[0] && dateRange[1]) {
      filtered = filtered.filter((record) => {
        const recordDate = moment(record.date)
          .tz("Asia/Karachi")
          .startOf("day");
        const startDate = moment(dateRange[0])
          .tz("Asia/Karachi")
          .startOf("day");
        const endDate = moment(dateRange[1]).tz("Asia/Karachi").startOf("day");
        return recordDate.isBetween(startDate, endDate, "day", "[]");
      });
    }

    if (searchTerm) {
      const hasNumbers = /\d/.test(searchTerm);
      const searchTermLower = searchTerm.toLowerCase().trim();
      const searchNumeric = hasNumbers ? searchTerm.replace(/\D/g, "") : "";
      filtered = filtered.filter((record) => {
        const nameMatch = record.name?.toLowerCase().includes(searchTermLower);
        const staffIdMatch = hasNumbers
          ? String(record.staffId || "").includes(searchNumeric)
          : false;
        return nameMatch || staffIdMatch;
      });
    }

    if (selectedStaff !== "all") {
      filtered = filtered.filter((record) => record.user._id === selectedStaff);
    }
    if (showActiveStaff && !showInactiveStaff) {
      filtered = filtered.filter((record) => record.isActive !== false);
    } else if (!showActiveStaff && showInactiveStaff) {
      filtered = filtered.filter((record) => record.isActive === false);
    }
    if (dateRange[0] && dateRange[1]) {
      filtered = filtered.filter((record) => {
        const recordDate = moment(record.date)
          .tz("Asia/Karachi")
          .startOf("day");
        const startDate = moment(dateRange[0])
          .tz("Asia/Karachi")
          .startOf("day");
        const endDate = moment(dateRange[1]).tz("Asia/Karachi").startOf("day");
        return recordDate.isBetween(startDate, endDate, "day", "[]");
      });
    }

    setFilteredAttendance(filtered);
    calculateStats(filtered);
  }, [
    attendance,
    searchTerm,
    selectedStaff,
    dateRange,
    showActiveStaff,
    showInactiveStaff,
  ]);

  useEffect(() => {
    fetchAttendance();
    fetchStaffMembers();
  }, []);

  return (
    <div className="management-container">
      <div className="management-header">
        <div>
          <h2>Staff Attendance</h2>
          <p className="total-count">
            {filteredAttendance.length} Total Records
            {!dateRange[0] && !dateRange[1] && (
              <span
                style={{ color: "#333", marginLeft: "8px", fontWeight: "500" }}
              >
                • Current Month (
                {moment().tz("Asia/Karachi").format("MMMM YYYY")})
              </span>
            )}
            {dateRange[0] && dateRange[1] && (
              <span style={{ color: "#6366f1", marginLeft: "8px" }}>
                • Custom Range (
                {moment(dateRange[0]).tz("Asia/Karachi").format("DD/MM/YYYY")} -{" "}
                {moment(dateRange[1]).tz("Asia/Karachi").format("DD/MM/YYYY")})
              </span>
            )}
          </p>
        </div>
        <div className="header-buttons">
          <SyncButton
            isSyncing={isSyncing}
            onClick={() => fetchAttendance(true)}
          />

          <button
            className="add-btn responsive-add-btn"
            onClick={exportToPDF}
            disabled={isLoading || filteredAttendance.length === 0}
            title="Export PDF"
            style={{ marginRight: "8px" }}
          >
            <FaFilePdf />
            <span className="add-btn-text">Export PDF</span>
          </button>

          <button
            className="add-btn responsive-add-btn"
            onClick={() => setShowDeleteModal(true)}
            disabled={isLoading}
            title="Delete Attendance"
            style={{ marginRight: "8px" }}
          >
            <FaTrash />
            <span className="add-btn-text">Delete Attendance</span>
          </button>

          <input
            type="file"
            id="csv-upload"
            accept=".csv"
            style={{ display: "none" }}
            onChange={handleFileUpload}
          />

          <button
            className="add-btn responsive-add-btn"
            onClick={() => document.getElementById("csv-upload").click()}
            disabled={isLoading}
            title="Upload CSV"
          >
            <FaUpload />
            <span className="add-btn-text">Upload CSV</span>
          </button>

          <button
            className="add-btn responsive-add-btn"
            onClick={() => setShowAttendanceModal(true)}
            title="Mark Attendance"
            style={{ marginRight: "8px" }}
          >
            <FaPlus />
            <span className="add-btn-text">Mark Attendance</span>
          </button>
        </div>
      </div>

      <div className="stats-cards">
        <div className="stat-card today-present">
          <h3>Today's Present</h3>
          <p>{stats.todayPresent}</p>
        </div>
        <div className="stat-card total-present">
          <h3>Total Present</h3>
          <p>{stats.present}</p>
        </div>
        <div className="stat-card absent">
          <h3>Total Absent</h3>
          <p>{stats.absent}</p>
        </div>
        <div className="stat-card leave">
          <h3>Total Leave</h3>
          <p>{stats.leave}</p>
        </div>
      </div>

      <div className="filter-section">
        <div className="search-box">
          <FaSearch className="search-icon" />
          <input
            type="text"
            placeholder="Search by Name/ID"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="filter-box checkbox-filter">
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={showActiveStaff}
              onChange={(e) => setShowActiveStaff(e.target.checked)}
              className="checkbox-input"
            />
            <span className="checkbox-text">Active Staff</span>
          </label>
          <label className="checkbox-label" style={{ marginLeft: "16px" }}>
            <input
              type="checkbox"
              checked={showInactiveStaff}
              onChange={(e) => setShowInactiveStaff(e.target.checked)}
              className="checkbox-input"
            />
            <span className="checkbox-text">Inactive Staff</span>
          </label>
        </div>
        <div className="filter-box">
          <FaFilter className="filter-icon" />
          <Select
            className="staff-select"
            value={selectedStaff}
            onChange={(e) => setSelectedStaff(e.target.value)}
            sx={{
              width: {
                xs: "100%",
                sm: "180px",
                md: "200px",
              },
              minWidth: {
                xs: "100%",
                sm: "150px",
              },
              height: "40px",
              ".MuiSelect-select": {
                padding:
                  window.innerWidth <= 768 ? "6px 25px" : "8px 12px 8px 36px",
                backgroundColor: "white",
                borderRadius: "6px",
                fontSize: "0.875rem",
                color: "#475569",
                marginTop: 0.5,
              },
              ".MuiOutlinedInput-notchedOutline": {
                border: "none",
              },
            }}
          >
            <MenuItem value="all">All Staff</MenuItem>
            {staffMembers.map((staff) => (
              <MenuItem key={staff._id} value={staff._id}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    width: "100%",
                  }}
                >
                  <span>
                    {staff.staffId} - {staff.name} (
                    {staff.role
                      .replace(/_/g, " ")
                      .replace(/\b\w/g, (l) => l.toUpperCase())}
                    )
                  </span>
                  {staff.isActive === false && (
                    <span
                      style={{
                        marginLeft: "8px",
                        color: "#dc2626",
                        fontSize: "0.7rem",
                        fontWeight: "500",
                        backgroundColor: "#fee2e2",
                        padding: "1px 4px",
                        borderRadius: "3px",
                      }}
                    >
                      Inactive
                    </span>
                  )}
                </div>
              </MenuItem>
            ))}
          </Select>
        </div>

        <div className="filter-box">
          <ReactDatePicker
            selectsRange={true}
            startDate={dateRange[0]}
            endDate={dateRange[1]}
            onChange={(update) => {
              setDateRange(update);
            }}
            isClearable={true}
            dateFormat="dd/MM/yyyy"
            timeZone="Asia/Karachi"
            customInput={
              <div
                className="date-input-wrapper"
                style={{
                  position: "relative",
                }}
              >
                {window.innerWidth >= 768 && (
                  <FaFilter
                    className="filter-icon"
                    style={{
                      position: "absolute",
                      left: "12px",
                      top: "50%",
                      transform: "translateY(-50%)",
                      color: "#94a3b8",
                      fontSize: "0.875rem",
                      zIndex: 1,
                    }}
                  />
                )}
                <input
                  className="date-range-input"
                  placeholder="Select custom date range"
                  value={
                    dateRange[0] && dateRange[1]
                      ? `${moment(dateRange[0])
                          .tz("Asia/Karachi")
                          .format("DD/MM/YYYY")} - ${moment(dateRange[1])
                          .tz("Asia/Karachi")
                          .format("DD/MM/YYYY")}`
                      : ""
                  }
                  readOnly
                  style={{
                    width: "100%",
                    height: "44px",
                    padding:
                      window.innerWidth >= 768
                        ? "8px 12px 8px 36px"
                        : "8px 12px",
                    backgroundColor: "white",
                    border: "1px solid #e2e8f0",
                    borderRadius: "8px",
                    fontSize: "0.875rem",
                    color: "#475569",
                    cursor: "pointer",
                    boxSizing: "border-box",
                  }}
                />
              </div>
            }
          />
        </div>
        <button
          className="clear-filters-btn"
          onClick={() => {
            setDateRange([null, null]);
            setSelectedStaff("all");
            setSearchTerm("");
            setShowActiveStaff(false);
            setShowInactiveStaff(false);
          }}
        >
          Clear Filters
        </button>
      </div>
      <div className="table-container">
        {isLoading ? (
          <div className="loading-container">
            <CircularProgress />
          </div>
        ) : filteredAttendance.length > 0 ? (
          <table>
            <thead>
              <tr>
                <th style={{ width: "80px" }}>ID</th>
                <th style={{ width: "240px" }}>Name</th>
                <th style={{ width: "150px" }}>Role</th>
                <th>Date</th>
                <th>In Time</th>
                <th>Out Time</th>
                <th>Duration</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredAttendance.map((record) => (
                <tr key={record._id}>
                  <td style={{ fontWeight: "500" }}>{record.staffId}</td>
                  <td style={{ fontWeight: "500" }}>
                    <div className="name-cell">
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "flex-start",
                          gap: "8px",
                        }}
                      >
                        <div className="primary-text">{record.name}</div>
                        {record.isActive === false && (
                          <span
                            style={{
                              color: "#dc2626",
                              fontSize: "0.7rem",
                              fontWeight: "500",
                              backgroundColor: "#fee2e2",
                              padding: "2px 6px",
                              borderRadius: "4px",
                              alignSelf: "flex-start",
                              display: "inline-block",
                            }}
                          >
                            Inactive
                          </span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td>{formatRole(record.role)}</td>
                  <td>
                    {moment(record.date)
                      .tz("Asia/Karachi")
                      .format("DD/MM/YYYY")}
                  </td>
                  <td>
                    {record.inTime
                      ? moment(record.inTime, "HH:mm").format("hh:mm A")
                      : ""}
                  </td>
                  <td>
                    {record.outTime
                      ? moment(record.outTime, "HH:mm").format("hh:mm A")
                      : ""}
                  </td>
                  <td style={{ fontWeight: "500" }}>{record.totalDuration}</td>
                  <td>
                    <span
                      style={{
                        display: "inline-block",
                        padding: "4px 10px",
                        fontSize: "0.75rem",
                        fontWeight: 500,
                        borderRadius: "5px",
                        textTransform: "capitalize",
                        color:
                          record.status === "present"
                            ? "#15803d"
                            : record.status === "leave"
                            ? "#b45309"
                            : "#991b1b",
                        backgroundColor:
                          record.status === "present"
                            ? "#dcfce7"
                            : record.status === "leave"
                            ? "#fef3c7"
                            : "#fee2e2",
                      }}
                    >
                      {record.status}
                    </span>
                  </td>
                  <td>
                    <div className="actions">
                      <button
                        onClick={() => handleEditAttendance(record)}
                        title="Edit"
                      >
                        <FaEdit />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="no-data">
            <p>No attendance records found</p>
          </div>
        )}
      </div>
      <DeleteAttendanceModal
        showModal={showDeleteModal}
        setShowModal={setShowDeleteModal}
        staffMembers={staffMembers}
        onDeleteAttendance={handleDeleteAttendance}
        isLoading={isLoading}
        formatRole={formatRole}
        attendance={attendance}
      />
      <AttendanceModal
        open={showAttendanceModal}
        onClose={() => !isSubmittingAttendance && setShowAttendanceModal(false)}
        formData={attendanceFormData}
        handleChange={handleAttendanceChange}
        handleSubmit={handleSubmit}
        staffMembers={staffMembers}
        errors={attendanceErrors}
        isLoading={isSubmittingAttendance}
        handleDateChange={handleAttendanceDateChange}
        handleTimeChange={handleAttendanceTimeChange}
        isEditMode={isEditMode}
      />
      <NotificationSnackbar
        notification={notification}
        onClose={closeNotification}
      />
    </div>
  );
};

export default StaffAttendance;
