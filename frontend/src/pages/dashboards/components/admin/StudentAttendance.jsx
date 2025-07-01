import { useState, useEffect } from "react";
import { FaSearch, FaFilter, FaFilePdf, FaTrash } from "react-icons/fa";
import {
  CircularProgress,
  Button,
  Select,
  MenuItem,
  Modal,
  Box,
  Typography,
  TextField,
  Autocomplete,
  Chip,
} from "@mui/material";
import ReactDatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { format } from "date-fns";
import axios from "axios";
import "../../../../styles/components/Management.css";
import useNotification from "../../../../hooks/useNotification";
import NotificationSnackbar from "../../../../components/common/NotificationSnackbar";
import SyncButton from "../../../../components/common/SyncButton";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import moment from "moment-timezone";

const DeleteAttendanceModal = ({
  showModal,
  setShowModal,
  students,
  onDeleteAttendance,
  isLoading,
  attendance,
}) => {
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);
  const [password, setPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [searchValue, setSearchValue] = useState(null);

  const getStudentsWithAttendance = () => {
    const studentIdsWithAttendance = [
      ...new Set(attendance.map((record) => record.user._id)),
    ];
    const studentsWithRecords = students.filter((student) =>
      studentIdsWithAttendance.includes(student._id)
    );
    const studentsWithAttendanceCount = studentsWithRecords.map((student) => {
      const attendanceCount = attendance.filter(
        (record) => record.user._id === student._id
      ).length;
      return {
        ...student,
        attendanceCount,
      };
    });

    return studentsWithAttendanceCount;
  };

  const handleSearchSelect = (event, newValue) => {
    if (newValue) {
      if (!selectedStudents.includes(newValue._id)) {
        setSelectedStudents((prev) => [...prev, newValue._id]);
      }
      setSearchValue(null);
    }
  };

  const studentsWithAttendance = getStudentsWithAttendance();

  const handleStudentSelect = (studentId) => {
    setSelectedStudents((prev) =>
      prev.includes(studentId)
        ? prev.filter((id) => id !== studentId)
        : [...prev, studentId]
    );
  };

  const handleSelectAll = () => {
    if (selectedStudents.length === studentsWithAttendance.length) {
      setSelectedStudents([]);
    } else {
      setSelectedStudents(studentsWithAttendance.map((student) => student._id));
    }
  };

  const handleDeleteClick = () => {
    if (selectedStudents.length === 0) {
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
      await onDeleteAttendance(selectedStudents);
      setSelectedStudents([]);
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
      setSelectedStudents([]);
      setPassword("");
      setPasswordError("");
    }
  };

  const getSelectedStudentNames = () => {
    return selectedStudents
      .map((id) => studentsWithAttendance.find((s) => s._id === id)?.name)
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
                Delete Student Attendance
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
                Select students to delete all their attendance records
                permanently
              </Typography>
              {studentsWithAttendance.length === 0 && (
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
                  ⚠️ No students with attendance records found
                </Typography>
              )}
            </Box>

            {studentsWithAttendance.length > 0 && (
              <Box
                sx={{
                  mb: {
                    xs: 1.5,
                    sm: 2,
                  },
                }}
              >
                <Autocomplete
                  options={studentsWithAttendance}
                  getOptionLabel={(option) =>
                    `${option.profile?.studentId} - ${option.name} - ${option.attendanceCount} records`
                  }
                  value={searchValue}
                  onChange={handleSearchSelect}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Search Student by Name or ID"
                      size="small"
                      placeholder="Type to search and select student..."
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
                              {option.name?.replace(" (Inactive Student)", "")}
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
                              ID: {option.profile?.studentId}
                            </Typography>
                          </Box>
                          <Box
                            sx={{
                              display: "flex",
                              flexDirection: "column",
                              alignItems: "flex-end",
                            }}
                          >
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
                        ?.toLowerCase()
                        .includes(searchTerm);
                      const idMatch = String(
                        option.profile?.studentId || ""
                      ).includes(searchTerm);
                      return nameMatch || idMatch;
                    });
                  }}
                  noOptionsText="No students found"
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
                  Students with Attendance ({studentsWithAttendance.length}{" "}
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
                  {selectedStudents.length > 0 && (
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
                      {selectedStudents.length} selected for deletion
                    </Typography>
                  )}
                  {studentsWithAttendance.length > 0 && (
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
                      {selectedStudents.length === studentsWithAttendance.length
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
                {studentsWithAttendance.length === 0 ? (
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
                      No students with attendance records found
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
                      Only students with existing attendance records can be
                      deleted
                    </Typography>
                  </Box>
                ) : (
                  studentsWithAttendance.map((student) => (
                    <Box
                      key={student._id}
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
                        bgcolor: selectedStudents.includes(student._id)
                          ? "#fee2e2"
                          : "transparent",
                        border: selectedStudents.includes(student._id)
                          ? "2px solid #dc2626"
                          : "2px solid transparent",
                      }}
                      onClick={() => handleStudentSelect(student._id)}
                    >
                      <input
                        type="checkbox"
                        checked={selectedStudents.includes(student._id)}
                        onChange={() => handleStudentSelect(student._id)}
                        style={{
                          marginRight: "12px",
                          accentColor: "#dc2626",
                          transform: {
                            xs: "scale(0.9)",
                            sm: "scale(1)",
                          },
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
                          {student.name?.replace(" (Inactive Student)", "")}
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
                          Student ID: {student.profile?.studentId}
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
                          📋 {student.attendanceCount} attendance record
                          {student.attendanceCount !== 1 ? "s" : ""}
                        </Typography>
                        {student.name?.includes("(Inactive Student)") && (
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
                          {student.attendanceCount} records
                        </Typography>
                      </Box>
                    </Box>
                  ))
                )}
              </Box>
            </Box>

            {selectedStudents.length > 0 && (
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
                    {selectedStudents.length} student
                    {selectedStudents.length > 1 ? "s" : ""}
                  </strong>
                  {selectedStudents.length <= 3 &&
                    `: ${getSelectedStudentNames()}`}
                  . This action cannot be undone.
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
              }}
            >
              <button
                className="clear-filters-btn"
                onClick={() => setShowModal(false)}
                style={{
                  fontSize: window.innerWidth < 768 ? "0.8rem" : "0.875rem",
                  padding: window.innerWidth < 768 ? "10px 16px" : "12px 20px",
                  width: window.innerWidth < 768 ? "100%" : "auto",
                }}
              >
                Cancel
              </button>
              <button
                className="delete-btn"
                onClick={handleDeleteClick}
                disabled={
                  selectedStudents.length === 0 ||
                  studentsWithAttendance.length === 0
                }
                style={{
                  fontSize: window.innerWidth < 768 ? "0.8rem" : "0.875rem",
                  padding: window.innerWidth < 768 ? "10px 16px" : "12px 20px",
                  width: window.innerWidth < 768 ? "100%" : "auto",
                }}
              >
                {studentsWithAttendance.length === 0
                  ? "No Records to Delete"
                  : `Delete Attendance for ${selectedStudents.length} Student${
                      selectedStudents.length > 1 ? "s" : ""
                    }`}
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
                  {selectedStudents.length} student
                  {selectedStudents.length > 1 ? "s" : ""}
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
                  {selectedStudents.length} student
                  {selectedStudents.length > 1 ? "s" : ""}
                </strong>
                {selectedStudents.length <= 3 &&
                  ` (${getSelectedStudentNames()})`}
                . This action cannot be undone.
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
              }}
            >
              <Button
                variant="outlined"
                onClick={handleCancelPassword}
                disabled={isDeleting}
                sx={{
                  borderColor: "#64748b",
                  color: "#64748b",
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
                  "&:hover": {
                    borderColor: "#475569",
                    backgroundColor: "rgba(100, 116, 139, 0.1)",
                  },
                }}
              >
                Cancel
              </Button>
              <Button
                variant="contained"
                onClick={handlePasswordConfirm}
                disabled={!password || isDeleting}
                sx={{
                  bgcolor: "#dc2626",
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
                  "&:hover": {
                    bgcolor: "#b91c1c",
                  },
                  "&.Mui-disabled": {
                    bgcolor: "#dc262680",
                  },
                }}
              >
                {isDeleting ? (
                  <CircularProgress
                    size={window.innerWidth < 768 ? 20 : 24}
                    sx={{ color: "white" }}
                  />
                ) : (
                  "Confirm Delete All"
                )}
              </Button>
            </Box>
          </>
        )}
      </Box>
    </Modal>
  );
};

const StudentAttendance = () => {
  const [attendance, setAttendance] = useState([]);
  const [filteredAttendance, setFilteredAttendance] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [dateRange, setDateRange] = useState([null, null]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [allSubjects, setAllSubjects] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState("all");
  const [allStudents, setAllStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState("all");
  const [subjects, setSubjects] = useState([]);
  const [showActiveStudents, setShowActiveStudents] = useState(false);
  const [showInactiveStudents, setShowInactiveStudents] = useState(false);
  const [timeRange, setTimeRange] = useState({ start: "", end: "" });
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    present: 0,
    absent: 0,
    leave: 0,
    todayPresent: 0,
    attendancePercentage: "0.00%",
  });
  const BASE_URL = import.meta.env.VITE_BASE_URL;

  const convertTo12Hour = (time) => {
    if (!time) return "";
    const [hours, minutes] = time.split(":");
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? "PM" : "AM";
    const hour12 = hour % 12 || 12;
    return `${hour12.toString().padStart(2, "0")}:${minutes} ${ampm}`;
  };

  const { notification, showNotification, closeNotification } =
    useNotification();

  const exportToPDF = () => {
    const doc = new jsPDF();

    doc.setFontSize(20);
    doc.text("Student Attendance Report", 14, 22);

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
    if (selectedStudent !== "all") {
      const studentName =
        allStudents.find((s) => s._id === selectedStudent)?.name || "Unknown";
      doc.text(`Student Filter: ${studentName}`, 14, yPosition);
      yPosition += 6;
    }
    if (selectedSubject !== "all") {
      const subjectName =
        allSubjects.find((s) => s._id === selectedSubject)?.name || "Unknown";
      doc.text(`Subject Filter: ${subjectName}`, 14, yPosition);
      yPosition += 6;
    }
    if (dateRange[0] && dateRange[1]) {
      doc.text(
        `Date Range: ${format(dateRange[0], "dd/MM/yyyy")} - ${format(
          dateRange[1],
          "dd/MM/yyyy"
        )}`,
        14,
        yPosition
      );
      yPosition += 6;
    }

    const tableData = filteredAttendance.map((record) => [
      record.user.name?.replace(" (Inactive Student)", "") || "",
      record.studentId || "",
      record.subjectName || "",
      record.schedule.teacherName
        ?.replace(" (Inactive Teacher)", "")
        .replace(" (Deleted Teacher)", "") || "",
      record.date || "",
      `${convertTo12Hour(record.schedule.startTime)} - ${convertTo12Hour(
        record.schedule.endTime
      )}`,
      record.status
        ? record.status.charAt(0).toUpperCase() +
          record.status.slice(1).toLowerCase()
        : "",
      record.remarks || "",
    ]);

    autoTable(doc, {
      head: [
        [
          "Student",
          "ID",
          "Subject",
          "Teacher",
          "Date",
          "Time",
          "Status",
          "Remarks",
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
        1: { cellWidth: 10 },
        2: { cellWidth: 25 },
        3: { cellWidth: 30 },
        4: { cellWidth: 20 },
        5: { cellWidth: 35 },
        6: { cellWidth: 20 },
        7: { cellWidth: 20 },
      },
      alternateRowStyles: {
        fillColor: [245, 245, 245],
      },
    });

    const fileName = `student-attendance-${moment()
      .tz("Asia/Karachi")
      .format("YYYY-MM-DD-HHmm")}.pdf`;
    doc.save(fileName);

    showNotification("PDF exported successfully");
  };

  const handleDeleteAttendance = async (studentIds) => {
    try {
      const token = localStorage.getItem("token");

      const idsArray = Array.isArray(studentIds) ? studentIds : [studentIds];

      const response = await axios.delete(
        `${BASE_URL}/api/student-attendance/delete-multiple`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          data: {
            studentIds: idsArray,
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

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    }
    fetchAttendance();
    fetchSubjects();
    fetchStudents();
  }, []);

  const fetchSubjects = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(`${BASE_URL}/api/subjects/view`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setAllSubjects(response.data.subjects);
    } catch (error) {
      console.error("Error fetching subjects:", error);
      showNotification("Error fetching subjects", "error");
    }
  };

  const fetchStudents = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(`${BASE_URL}/api/admin/users/student`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setAllStudents(response.data.users);
    } catch (error) {
      console.error("Error fetching students:", error);
      showNotification("Error fetching students", "error");
    }
  };

  const fetchAttendance = async () => {
    setIsSyncing(true);
    setIsLoading(true);
    try {
      const response = await axios.get(
        `${BASE_URL}/api/student-attendance/admin/view`
      );

      const { data } = response.data;
      const uniqueSubjects = [...new Set(data.map((item) => item.subjectName))];
      setSubjects(uniqueSubjects);
      setAttendance(data);
      setFilteredAttendance(data);
      setStats(calculateStats(data));
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

  const calculateStats = (filteredData) => {
    const today = new Date()
      .toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      })
      .split("/")
      .join("-");

    const stats = {
      total: filteredData.length,
      present: filteredData.filter(
        (record) => record.status.toLowerCase() === "present"
      ).length,
      absent: filteredData.filter(
        (record) => record.status.toLowerCase() === "absent"
      ).length,
      leave: filteredData.filter(
        (record) => record.status.toLowerCase() === "leave"
      ).length,
      todayPresent: filteredData.filter((record) => {
        return (
          record.status.toLowerCase() === "present" && record.date === today
        );
      }).length,
    };

    const attendancePercentage =
      filteredData.length > 0
        ? ((stats.present / filteredData.length) * 100).toFixed(2)
        : "0.00";

    return {
      ...stats,
      attendancePercentage: `${attendancePercentage}%`,
    };
  };

  useEffect(() => {
    let filtered = [...attendance];

    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter((record) => {
        const matchesName = record.studentName
          ?.toLowerCase()
          .includes(searchLower);
        const matchesId =
          record.studentId && record.studentId.toString().includes(searchTerm);
        return matchesName || matchesId;
      });
    }

    if (selectedStudent !== "all") {
      filtered = filtered.filter(
        (record) => record.user._id === selectedStudent
      );
    }

    if (selectedSubject !== "all") {
      filtered = filtered.filter(
        (record) => record.subject === selectedSubject
      );
    }

    if (showActiveStudents && !showInactiveStudents) {
      filtered = filtered.filter(
        (record) =>
          !record.user.name?.includes("(Inactive Student)") &&
          record.user.isActive !== false
      );
    } else if (!showActiveStudents && showInactiveStudents) {
      filtered = filtered.filter(
        (record) =>
          record.user.name?.includes("(Inactive Student)") ||
          record.user.isActive === false
      );
    }

    if (dateRange[0] && dateRange[1]) {
      filtered = filtered.filter((record) => {
        const [day, month, year] = record.date.split("-");
        const recordDate = new Date(year, month - 1, day);
        return recordDate >= dateRange[0] && recordDate <= dateRange[1];
      });
    }
    if (timeRange.start && timeRange.end) {
      filtered = filtered.filter((record) => {
        const scheduleStart = record.schedule.startTime;
        const scheduleEnd = record.schedule.endTime;

        const getMinutes = (timeStr) => {
          const [hours, minutes] = timeStr.split(":").map(Number);
          return hours * 60 + minutes;
        };

        const filterStart = getMinutes(timeRange.start);
        const filterEnd = getMinutes(timeRange.end);
        const classStart = getMinutes(scheduleStart);
        const classEnd = getMinutes(scheduleEnd);

        return classStart >= filterStart && classEnd <= filterEnd;
      });
    }
    setFilteredAttendance(filtered);
    setStats(calculateStats(filtered));
  }, [
    attendance,
    searchTerm,
    selectedStudent,
    selectedSubject,
    dateRange,
    timeRange,
    showActiveStudents,
    showInactiveStudents,
  ]);

  return (
    <div className="management-container">
      <div
        className="management-header"
        style={{
          flexDirection: window.innerWidth < 768 ? "column" : "row",
          gap: window.innerWidth < 768 ? "16px" : "0",
          alignItems: window.innerWidth < 768 ? "stretch" : "flex-start",
        }}
      >
        <div>
          <h2>Student Attendance</h2>
          <p className="total-count">
            {filteredAttendance.length} Total Records | Attendance Rate:{" "}
            {stats.attendancePercentage}
          </p>
        </div>
        <div
          className="header-buttons"
          style={{
            width: window.innerWidth < 768 ? "100%" : "auto",
            justifyContent: window.innerWidth < 768 ? "center" : "flex-end",
            gap: window.innerWidth < 768 ? "8px" : "12px",
          }}
        >
          <SyncButton
            isSyncing={isSyncing}
            onClick={() => fetchAttendance(true)}
          />
          <button
            className="add-btn responsive-btn"
            onClick={exportToPDF}
            disabled={isLoading || filteredAttendance.length === 0}
            title="Export PDF"
            style={{
              marginRight: "8px",
              padding: window.innerWidth < 1024 ? "12px" : "10px 20px",
              minWidth: window.innerWidth < 1024 ? "44px" : "auto",
              width: window.innerWidth < 1024 ? "44px" : "auto",
              justifyContent: "center",
            }}
          >
            <FaFilePdf />
            {window.innerWidth >= 1024 && (
              <span style={{ marginLeft: "8px" }}>Export PDF</span>
            )}
          </button>
          <button
            className="add-btn responsive-btn"
            onClick={() => setShowDeleteModal(true)}
            disabled={isLoading}
            title="Delete Attendance"
            style={{
              marginRight: "8px",
              padding: window.innerWidth < 1024 ? "12px" : "10px 20px",
              minWidth: window.innerWidth < 1024 ? "44px" : "auto",
              width: window.innerWidth < 1024 ? "44px" : "auto",
              justifyContent: "center",
            }}
          >
            <FaTrash />
            {window.innerWidth >= 1024 && (
              <span style={{ marginLeft: "8px" }}>Delete Attendance</span>
            )}
          </button>
        </div>
      </div>

      {/* Stats cards with responsive layout */}
      <div
        className="stats-cards"
        style={{
          flexDirection: window.innerWidth < 768 ? "column" : "row",
          gap: window.innerWidth < 768 ? "12px" : "20px",
        }}
      >
        <div className="stat-card today-present">
          <h3>Today's Present</h3>
          <p>{stats.todayPresent}</p>
          <span className="percentage">
            {filteredAttendance.length > 0
              ? `${(
                  (stats.todayPresent / filteredAttendance.length) *
                  100
                ).toFixed(1)}%`
              : "0.0%"}
          </span>
        </div>
        <div className="stat-card absent">
          <h3>Total Absent</h3>
          <p>{stats.absent}</p>
          <span className="percentage">
            {filteredAttendance.length > 0
              ? `${((stats.absent / filteredAttendance.length) * 100).toFixed(
                  1
                )}%`
              : "0.0%"}
          </span>
        </div>
        <div className="stat-card leave">
          <h3>Total Leave</h3>
          <p>{stats.leave}</p>
          <span className="percentage">
            {filteredAttendance.length > 0
              ? `${((stats.leave / filteredAttendance.length) * 100).toFixed(
                  1
                )}%`
              : "0.0%"}
          </span>
        </div>
      </div>

      {/* Responsive filter section */}
      <div
        className="filter-section"
        style={{
          flexDirection: window.innerWidth < 768 ? "column" : "row",
          gap: window.innerWidth < 768 ? "12px" : "16px",
          alignItems: window.innerWidth < 768 ? "stretch" : "center",
        }}
      >
        <div
          className="search-box"
          style={{
            maxWidth: window.innerWidth < 768 ? "none" : "300px",
            width: window.innerWidth < 768 ? "100%" : "300px",
          }}
        >
          <FaSearch className="search-icon" />
          <input
            type="text"
            placeholder="Search by Name or ID"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Rest of filters with responsive styling */}
        <div
          className="filter-box checkbox-filter"
          style={{
            minWidth: window.innerWidth < 768 ? "auto" : "320px",
            width: window.innerWidth < 768 ? "100%" : "auto",
            justifyContent: window.innerWidth < 768 ? "flex-start" : "center",
          }}
        >
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={showActiveStudents}
              onChange={(e) => setShowActiveStudents(e.target.checked)}
              className="checkbox-input"
            />
            <span className="checkbox-text">Active Students</span>
          </label>
          <label className="checkbox-label" style={{ marginLeft: "16px" }}>
            <input
              type="checkbox"
              checked={showInactiveStudents}
              onChange={(e) => setShowInactiveStudents(e.target.checked)}
              className="checkbox-input"
            />
            <span className="checkbox-text">Inactive Students</span>
          </label>
        </div>

        {/* Student Select with responsive width */}
        <div className="filter-box">
          <FaFilter className="filter-icon" />
          <Select
            className="student-select"
            value={selectedStudent}
            onChange={(e) => setSelectedStudent(e.target.value)}
            sx={{
              width: window.innerWidth < 768 ? "100%" : "200px",
              height: "40px",
              ".MuiSelect-select": {
                padding: "8px 12px 8px 36px",
                backgroundColor: "white",
                border: "1px solid #e2e8f0",
                borderRadius: "6px",
                fontSize: "0.875rem",
                color: "#475569",
              },
              ".MuiOutlinedInput-notchedOutline": {
                border: "none",
              },
            }}
          >
            <MenuItem value="all">All Students</MenuItem>
            {allStudents.map((student) => (
              <MenuItem key={student._id} value={student._id}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    width: "100%",
                  }}
                >
                  <span>
                    {student.profile?.studentId} - {student.name}
                  </span>
                  {student.name &&
                    student.name.includes("(Inactive Student)") && (
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

        {/* Subject Select with responsive width */}
        <div className="filter-box">
          <FaFilter className="filter-icon" />
          <Select
            className="subject-select"
            value={selectedSubject}
            onChange={(e) => setSelectedSubject(e.target.value)}
            sx={{
              width: window.innerWidth < 768 ? "100%" : "200px",
              height: "40px",
              ".MuiSelect-select": {
                padding: "8px 12px 8px 36px",
                backgroundColor: "white",
                border: "1px solid #e2e8f0",
                borderRadius: "6px",
                fontSize: "0.875rem",
                color: "#475569",
              },
              ".MuiOutlinedInput-notchedOutline": {
                border: "none",
              },
            }}
          >
            <MenuItem value="all">All Subjects</MenuItem>
            {allSubjects.map((subject) => (
              <MenuItem key={subject._id} value={subject._id}>
                {subject.name}
              </MenuItem>
            ))}
          </Select>
        </div>

        {/* Date picker with responsive styling */}
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
            customInput={
              <div
                className="date-input-wrapper"
                style={{
                  width: window.innerWidth < 768 ? "100%" : "200px",
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
                  placeholder="Select date range"
                  value={
                    dateRange[0] && dateRange[1]
                      ? `${format(dateRange[0], "dd/MM/yyyy")} - ${format(
                          dateRange[1],
                          "dd/MM/yyyy"
                        )}`
                      : ""
                  }
                  readOnly
                  style={{
                    width: "100%",
                    height: "44px",
                    padding:
                      window.innerWidth < 768
                        ? "8px 12px"
                        : "8px 12px 8px 36px",
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

        {/* Time range with responsive layout */}
        <div className="filter-box">
          <div
            style={{
              display: "flex",
              gap: "8px",
              alignItems: "center",
              flexDirection: "row",
            }}
          >
            <input
              type="time"
              value={timeRange.start}
              onChange={(e) =>
                setTimeRange((prev) => ({ ...prev, start: e.target.value }))
              }
              style={{
                padding: "8px",
                border: "1px solid #e2e8f0",
                borderRadius: "6px",
                fontSize: "0.875rem",
                color: "#475569",
                width: window.innerWidth < 768 ? "100%" : "130px",
              }}
            />
            <span
              style={{
                color: "#64748b",
                textAlign: window.innerWidth < 768 ? "center" : "left",
              }}
            >
              to
            </span>
            <input
              type="time"
              value={timeRange.end}
              onChange={(e) =>
                setTimeRange((prev) => ({ ...prev, end: e.target.value }))
              }
              style={{
                padding: "8px",
                border: "1px solid #e2e8f0",
                borderRadius: "6px",
                fontSize: "0.875rem",
                color: "#475569",
                width: window.innerWidth < 768 ? "100%" : "130px",
              }}
            />
          </div>
        </div>

        {/* Clear filters button with responsive styling */}
        <button
          className="clear-filters-btn"
          onClick={() => {
            setDateRange([null, null]);
            setSelectedSubject("all");
            setSelectedStudent("all");
            setSearchTerm("");
            setTimeRange({ start: "", end: "" });
            setShowActiveStudents(false);
            setShowInactiveStudents(false);
          }}
          style={{
            width: window.innerWidth < 768 ? "100%" : "auto",
            fontSize: window.innerWidth < 768 ? "0.875rem" : "1rem",
            padding: window.innerWidth < 768 ? "12px 20px" : "10px 20px",
          }}
        >
          Clear Filters
        </button>
      </div>

      {/* Responsive table container */}
      <div className="table-container">
        {isLoading ? (
          <div className="loading-container">
            <CircularProgress />
          </div>
        ) : filteredAttendance.length > 0 ? (
          <div style={{ overflowX: "auto" }}>
            <table
              style={{ minWidth: window.innerWidth < 768 ? "600px" : "auto" }}
            >
              <thead>
                <tr>
                  <th style={{ width: "200px" }}>Student</th>
                  <th style={{ width: "200px" }}>Subject</th>
                  <th>Teacher</th>
                  <th>Date</th>
                  <th>Time</th>
                  <th>Status</th>
                  <th>Remarks</th>
                  <th>Marked By</th>
                </tr>
              </thead>
              <tbody>
                {filteredAttendance.map((record) => (
                  <tr key={record._id}>
                    <td>
                      <div style={{ fontWeight: "500" }}>
                        {record.user.name &&
                        record.user.name.includes("(Inactive Student)") ? (
                          <>
                            {record.user.name.replace(
                              " (Inactive Student)",
                              ""
                            )}
                            <div
                              style={{
                                color: "#dc2626",
                                fontSize: "0.75rem",
                                fontWeight: "500",
                                marginTop: "2px",
                              }}
                            >
                              (Inactive Student)
                            </div>
                          </>
                        ) : (
                          record.user.name
                        )}
                      </div>
                      <span style={{ color: "#64748b", fontSize: "0.8125rem" }}>
                        ID: {record.studentId}
                      </span>
                    </td>
                    <td>{record.subjectName}</td>
                    <td>
                      {record.schedule.teacherName &&
                      record.schedule.teacherName.includes(
                        "(Inactive Teacher)"
                      ) ? (
                        <>
                          {record.schedule.teacherName.replace(
                            " (Inactive Teacher)",
                            ""
                          )}
                          <div
                            style={{
                              color: "#dc2626",
                              fontSize: "0.75rem",
                              fontWeight: "500",
                              marginTop: "2px",
                            }}
                          >
                            (Inactive Teacher)
                          </div>
                        </>
                      ) : record.schedule.teacherName &&
                        record.schedule.teacherName.includes(
                          "(Deleted Teacher)"
                        ) ? (
                        <>
                          {record.schedule.teacherName.replace(
                            " (Deleted Teacher)",
                            ""
                          )}
                          <div
                            style={{
                              color: "#dc2626",
                              fontSize: "0.75rem",
                              fontWeight: "500",
                              marginTop: "2px",
                            }}
                          >
                            (Deleted Teacher)
                          </div>
                        </>
                      ) : (
                        <div style={{ fontWeight: "500" }}>
                          {record.schedule.teacherName}
                        </div>
                      )}
                    </td>
                    <td>{record.date}</td>
                    <td>
                      <>
                        {convertTo12Hour(record.schedule.startTime)}
                        <br />
                        {convertTo12Hour(record.schedule.endTime)}
                      </>
                    </td>
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
                              : record.status === "absent"
                              ? "#be123c"
                              : "#991b1b",
                          backgroundColor:
                            record.status === "present"
                              ? "#dcfce7"
                              : record.status === "leave"
                              ? "#fef3c7"
                              : record.status === "absent"
                              ? "#fce7f3"
                              : "#fee2e2",
                        }}
                      >
                        {record.status}
                      </span>
                    </td>
                    <td>{record.remarks}</td>
                    <td>{record.markedByName}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="no-data">
            <p>No attendance records found</p>
          </div>
        )}
      </div>

      <DeleteAttendanceModal
        showModal={showDeleteModal}
        setShowModal={setShowDeleteModal}
        students={allStudents}
        onDeleteAttendance={handleDeleteAttendance}
        isLoading={isLoading}
        attendance={attendance}
      />

      <NotificationSnackbar
        notification={notification}
        onClose={closeNotification}
      />
    </div>
  );
};

export default StudentAttendance;
