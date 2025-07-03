import { useState, useEffect } from "react";
import {
  FaSearch,
  FaFilter,
  FaEye,
  FaPlus,
  FaEdit,
  FaTrash,
  FaDownload,
  FaFilePdf,
} from "react-icons/fa";
import {
  Box,
  Select,
  MenuItem,
  Button,
  CircularProgress,
  Modal,
  Typography,
  FormControl,
  InputLabel,
  TextField,
  Chip,
  Autocomplete,
  useTheme,
  useMediaQuery,
} from "@mui/material";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import ReactDatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { format } from "date-fns";
import axios from "axios";
import ViewScheduleModal from "../supervisor/viewModals/ViewScheduleModal";
import "../../../../styles/components/Management.css";
import ScheduleSummaryModal from "./ScheduleSummaryModal";
import { FaChartBar } from "react-icons/fa";
import { getModalStyles } from "../../../../styles/modal/commonModalStyles";
import DeleteConfirmationModal from "../../../DeleteConfirmationModal";
import { convertTo12Hour, formatTableDate } from "../../../../utils/formatters";
import useNotification from "../../../../hooks/useNotification";
import NotificationSnackbar from "../../../../components/common/NotificationSnackbar";
import SyncButton from "../../../../components/common/SyncButton";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
const SESSION_STATUS = {
  PENDING: "pending",
  IN_PROGRESS: "in_progress",
  COMPLETED: "completed",
  AVAILABLE: "available",
  ABSENT: "absent",
  LEAVE: "leave",
};

const DAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

const RECURRENCE_PATTERNS = {
  WEEKDAYS: "weekdays",
  CUSTOM: "custom",
};

const POPPINS_FONT =
  "'Poppins', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";

const modalStyle = {
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  width: 500,
  bgcolor: "background.paper",
  borderRadius: "12px",
  boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)",
  p: 4,
  maxHeight: "90vh",
  overflowY: "auto",
  "&:focus-visible": {
    outline: "none",
  },
  fontFamily:
    "'Poppins', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
};

const DeleteSchedulesModal = ({
  showModal,
  setShowModal,
  schedules,
  onDeleteSchedules,
  isLoading,
  students,
  teachers,
  groupStudentsByClient,
  s,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const isSmallMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const POPPINS_FONT =
    "'Poppins', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";

  const [selectedSchedules, setSelectedSchedules] = useState([]);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);
  const [password, setPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [searchValue, setSearchValue] = useState(null);
  const [filteredSchedules, setFilteredSchedules] = useState([]);
  const [dateRange, setDateRange] = useState([null, null]);

  const getDeletableSchedules = (schedulesList) => {
    return schedulesList;
  };

  const getFilterOptions = () => {
    const deletableSchedules = getDeletableSchedules(schedules);
    const clients = [];
    const studentsOptions = [];
    const teachersOptions = [];

    deletableSchedules.forEach((schedule) => {
      const groupedClients = groupStudentsByClient(schedule);
      groupedClients.forEach((group) => {
        const existingClient = clients.find((c) => c.id === group.clientId);
        if (!existingClient) {
          clients.push({
            id: group.clientId,
            name: group.clientName,
            type: "client",
            label: `${group.clientName} (${group.clientId})`,
            scheduleCount: 1,
          });
        } else {
          existingClient.scheduleCount++;
        }
      });

      schedule.studentAttendances?.forEach((attendance) => {
        const existingStudent = studentsOptions.find(
          (s) => s.id === attendance.studentId
        );
        if (!existingStudent) {
          studentsOptions.push({
            id: attendance.studentId,
            name: attendance.studentName,
            type: "student",
            label: `${attendance.studentName}`,
            scheduleCount: 1,
          });
        } else {
          existingStudent.scheduleCount++;
        }
      });

      const existingTeacher = teachersOptions.find(
        (t) => t.id === schedule.teacherId
      );
      if (!existingTeacher && schedule.teacherId) {
        teachersOptions.push({
          id: schedule.teacherId,
          name: schedule.teacherName,
          type: "teacher",
          label: `${schedule.teacherName || "Unknown Teacher"}`,
          scheduleCount: 1,
        });
      } else if (existingTeacher) {
        existingTeacher.scheduleCount++;
      }
    });

    return { clients, studentsOptions, teachersOptions };
  };

  const { clients, studentsOptions, teachersOptions } = getFilterOptions();
  const allOptions = [...clients, ...studentsOptions, ...teachersOptions];

  useEffect(() => {
    let filtered = getDeletableSchedules(schedules);

    if (dateRange[0] && dateRange[1]) {
      filtered = filtered.filter((schedule) => {
        try {
          const scheduleDate = new Date(schedule.classDate);
          scheduleDate.setHours(0, 0, 0, 0);
          const startDate = new Date(dateRange[0]);
          startDate.setHours(0, 0, 0, 0);
          const endDate = new Date(dateRange[1]);
          endDate.setHours(23, 59, 59, 999);

          return scheduleDate >= startDate && scheduleDate <= endDate;
        } catch (error) {
          console.error("Error comparing dates:", error);
          return false;
        }
      });
    }

    setFilteredSchedules(filtered);
  }, [schedules, dateRange]);

  const handleSearchSelect = (event, newValue) => {
    if (newValue) {
      let filtered = [];
      const deletableSchedules = getDeletableSchedules(schedules);

      if (newValue.type === "client") {
        filtered = deletableSchedules.filter((schedule) => {
          const groupedClients = groupStudentsByClient(schedule);
          return groupedClients.some((group) => group.clientId === newValue.id);
        });
      } else if (newValue.type === "student") {
        filtered = deletableSchedules.filter((schedule) =>
          schedule.studentAttendances?.some(
            (attendance) => attendance.studentId === newValue.id
          )
        );
      } else if (newValue.type === "teacher") {
        filtered = deletableSchedules.filter(
          (schedule) => schedule.teacherId === newValue.id
        );
      }

      if (dateRange[0] && dateRange[1]) {
        filtered = filtered.filter((schedule) => {
          try {
            const scheduleDate = new Date(schedule.classDate);
            scheduleDate.setHours(0, 0, 0, 0);
            const startDate = new Date(dateRange[0]);
            startDate.setHours(0, 0, 0, 0);
            const endDate = new Date(dateRange[1]);
            endDate.setHours(23, 59, 59, 999);

            return scheduleDate >= startDate && scheduleDate <= endDate;
          } catch (error) {
            console.error("Error comparing dates:", error);
            return false;
          }
        });
      }

      setFilteredSchedules(filtered);
      setSearchValue(null);
    }
  };

  const handleScheduleSelect = (scheduleId) => {
    setSelectedSchedules((prev) =>
      prev.includes(scheduleId)
        ? prev.filter((id) => id !== scheduleId)
        : [...prev, scheduleId]
    );
  };

  const handleSelectAll = () => {
    if (selectedSchedules.length === filteredSchedules.length) {
      setSelectedSchedules([]);
    } else {
      setSelectedSchedules(filteredSchedules.map((schedule) => schedule._id));
    }
  };

  const handleDeleteClick = () => {
    if (selectedSchedules.length === 0) {
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
      await onDeleteSchedules(selectedSchedules);
      setSelectedSchedules([]);
      setShowPasswordConfirm(false);
      setPassword("");
      setPasswordError("");
      setShowModal(false);
    } catch (error) {
      console.error("Error deleting schedules:", error);
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
      setSelectedSchedules([]);
      setPassword("");
      setPasswordError("");
      setDateRange([null, null]);
      setFilteredSchedules([]);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "completed":
        return { color: "#15803d", backgroundColor: "#dcfce7" };
      case "absent":
        return { color: "#dc2626", backgroundColor: "#fee2e2" };
      case "leave":
        return { color: "#ea580c", backgroundColor: "#fed7aa" };
      case "available":
        return { color: "#0369a1", backgroundColor: "#e0f2fe" };
      case "pending":
        return { color: "#dc2626", backgroundColor: "#fee2e2" };
      case "scheduled":
        return { color: "#0369a1", backgroundColor: "#e0f2fe" };
      default:
        return { color: "#64748b", backgroundColor: "#f1f5f9" };
    }
  };

  const getResponsiveModalStyle = () => ({
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    width: isMobile ? "95vw" : isSmallMobile ? "98vw" : 900,
    maxWidth: isMobile ? "none" : 900,
    maxHeight: isMobile ? "95vh" : "90vh",
    bgcolor: "background.paper",
    borderRadius: isMobile ? "16px" : "12px",
    boxShadow:
      "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)",
    p: isMobile ? 2 : 4,
    overflow: "hidden",
    display: "flex",
    flexDirection: "column",
    fontFamily: POPPINS_FONT,
    "&:focus-visible": {
      outline: "none",
    },
    "& *": {
      fontFamily: `${POPPINS_FONT} !important`,
    },
  });

  const totalDeletableSchedules = getDeletableSchedules(schedules).length;
  const pendingSchedulesCount = schedules.filter(
    (s) => s.sessionStatus === SESSION_STATUS.PENDING
  ).length;
  const selectedPendingSchedules = selectedSchedules.filter((scheduleId) => {
    const schedule = schedules.find((s) => s._id === scheduleId);
    return schedule && schedule.sessionStatus === SESSION_STATUS.PENDING;
  });

  return (
    <Modal
      open={showModal}
      onClose={handleModalClose}
      aria-labelledby="delete-schedules-modal"
    >
      <Box sx={getResponsiveModalStyle()}>
        {!showPasswordConfirm ? (
          <>
            {/* Header */}
            <Box
              sx={{
                borderBottom: "1px solid #e2e8f0",
                pb: isMobile ? 1.5 : 2,
                mb: isMobile ? 2 : 3,
                display: "flex",
                justifyContent: "space-between",
                alignItems: isMobile ? "flex-start" : "center",
                flexDirection: isMobile ? "column" : "row",
                gap: isMobile ? 1 : 0,
              }}
            >
              <Box>
                <Typography
                  variant="h6"
                  component="h2"
                  sx={{
                    color: "#dc2626",
                    fontWeight: 600,
                    fontSize: isMobile ? "1.125rem" : "1.25rem",
                  }}
                >
                  Delete Class Schedules
                </Typography>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{
                    mt: 1,
                    fontSize: isMobile ? "0.875rem" : "1rem",
                  }}
                >
                  Select schedules to delete permanently. Be careful with
                  pending schedules.
                </Typography>
                {pendingSchedulesCount > 0 && (
                  <Typography
                    variant="body2"
                    sx={{
                      mt: 1,
                      color: "#f59e0b",
                      fontSize: isMobile ? "0.8125rem" : "0.875rem",
                    }}
                  >
                    ⚠️ {pendingSchedulesCount} pending schedule
                    {pendingSchedulesCount > 1 ? "s" : ""} found - be cautious
                    when deleting
                  </Typography>
                )}
              </Box>

              {/* Close Button */}
              <Button
                onClick={handleModalClose}
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

            {/* Search and Filter Section */}
            <Box sx={{ mb: isMobile ? 2 : 3 }}>
              <Box
                sx={{
                  display: "flex",
                  gap: isMobile ? 1.5 : 2,
                  mb: isMobile ? 1.5 : 2,
                  flexDirection: isMobile ? "column" : "row",
                }}
              >
                {/* Autocomplete for specific filtering */}
                <Autocomplete
                  options={allOptions}
                  getOptionLabel={(option) => option.label}
                  value={searchValue}
                  onChange={handleSearchSelect}
                  sx={{ flex: 1 }}
                  size={isMobile ? "small" : "medium"}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Filter by Client/Student/Teacher"
                      size={isMobile ? "small" : "medium"}
                      placeholder={
                        isMobile
                          ? "Search..."
                          : "Search and select to filter..."
                      }
                      sx={{
                        fontFamily: POPPINS_FONT,
                        "& .MuiOutlinedInput-root": {
                          backgroundColor: "#fafafa",
                          fontFamily: POPPINS_FONT,
                          fontSize: isMobile ? "0.875rem" : "1rem",
                        },
                        "& .MuiInputLabel-root": {
                          fontSize: isMobile ? "0.875rem" : "1rem",
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
                            flexDirection: isMobile ? "column" : "row",
                            gap: isMobile ? 0.5 : 0,
                          }}
                        >
                          <Box>
                            <Typography
                              variant="body2"
                              fontWeight="500"
                              sx={{
                                fontSize: isMobile ? "0.8125rem" : "0.875rem",
                              }}
                            >
                              {option.name}
                            </Typography>
                            <Typography
                              variant="caption"
                              color="text.secondary"
                              sx={{
                                fontSize: isMobile ? "0.75rem" : "0.8125rem",
                              }}
                            >
                              {option.type.charAt(0).toUpperCase() +
                                option.type.slice(1)}
                              {option.type === "client" &&
                                ` • ID: ${option.id}`}
                            </Typography>
                          </Box>
                          <Chip
                            label={`${option.scheduleCount} schedule${
                              option.scheduleCount !== 1 ? "s" : ""
                            }`}
                            size="small"
                            sx={{
                              fontSize: isMobile ? "0.5rem" : "0.6rem",
                              height: isMobile ? "14px" : "16px",
                              backgroundColor: "#e0f2fe",
                              color: "#0369a1",
                              alignSelf: isMobile ? "flex-start" : "center",
                            }}
                          />
                        </Box>
                      </li>
                    );
                  }}
                  clearOnEscape
                  blurOnSelect
                />

                {/* Date Range Filter */}
                <Box sx={{ width: isMobile ? "100%" : 280 }}>
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
                      <TextField
                        size={isMobile ? "small" : "medium"}
                        label="Date Range Filter"
                        placeholder={
                          isMobile ? "Select dates" : "Select date range"
                        }
                        value={
                          dateRange[0] && dateRange[1]
                            ? `${format(dateRange[0], "dd/MM/yyyy")} - ${format(
                                dateRange[1],
                                "dd/MM/yyyy"
                              )}`
                            : ""
                        }
                        InputProps={{
                          readOnly: true,
                          style: { cursor: "pointer" },
                        }}
                        sx={{
                          width: "100%",
                          fontFamily: POPPINS_FONT,
                          "& .MuiOutlinedInput-root": {
                            backgroundColor: "#fafafa",
                            fontFamily: POPPINS_FONT,
                            fontSize: isMobile ? "0.875rem" : "1rem",
                          },
                          "& .MuiInputLabel-root": {
                            fontSize: isMobile ? "0.875rem" : "1rem",
                          },
                        }}
                      />
                    }
                  />
                </Box>
              </Box>

              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: isMobile ? "flex-start" : "center",
                  flexDirection: isMobile ? "column" : "row",
                  gap: isMobile ? 1 : 0,
                }}
              >
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ fontSize: isMobile ? "0.8125rem" : "0.875rem" }}
                >
                  Showing {filteredSchedules.length} of{" "}
                  {totalDeletableSchedules} schedules
                  {dateRange[0] && dateRange[1] && (
                    <span style={{ marginLeft: "8px", color: "#0369a1" }}>
                      (filtered by date: {format(dateRange[0], "dd/MM/yyyy")} -{" "}
                      {format(dateRange[1], "dd/MM/yyyy")})
                    </span>
                  )}
                </Typography>
                <button
                  className="clear-filters-btn"
                  onClick={() => {
                    setDateRange([null, null]);
                    setFilteredSchedules(getDeletableSchedules(schedules));
                    setSearchValue(null);
                  }}
                  style={{
                    fontSize: isMobile ? "0.8125rem" : "0.875rem",
                    padding: isMobile ? "6px 12px" : "8px 16px",
                  }}
                >
                  Clear Filters
                </button>
              </Box>
            </Box>

            {/* Schedules List */}
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
                  p: isMobile ? 1.5 : 2,
                  borderBottom: "1px solid #e2e8f0",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: isMobile ? "flex-start" : "center",
                  flexDirection: isMobile ? "column" : "row",
                  gap: isMobile ? 1 : 0,
                }}
              >
                <Typography
                  variant="subtitle2"
                  fontWeight="600"
                  sx={{
                    color: "#dc2626",
                    fontSize: isMobile ? "0.9375rem" : "1rem",
                  }}
                >
                  All Schedules ({filteredSchedules.length} total)
                </Typography>
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: isMobile ? 1 : 2,
                    flexDirection: isMobile ? "column" : "row",
                    alignSelf: isMobile ? "stretch" : "auto",
                  }}
                >
                  {selectedSchedules.length > 0 && (
                    <Typography
                      variant="caption"
                      sx={{
                        color: "#dc2626",
                        fontSize: isMobile ? "0.75rem" : "0.8125rem",
                      }}
                    >
                      {selectedSchedules.length} selected for deletion
                    </Typography>
                  )}
                  {filteredSchedules.length > 0 && (
                    <Button
                      size={isMobile ? "small" : "medium"}
                      onClick={handleSelectAll}
                      sx={{
                        textTransform: "none",
                        color: "#dc2626",
                        fontSize: isMobile ? "0.8125rem" : "0.875rem",
                        padding: isMobile ? "4px 8px" : "6px 12px",
                        "&:hover": { bgcolor: "rgba(220, 38, 38, 0.1)" },
                      }}
                    >
                      {selectedSchedules.length === filteredSchedules.length
                        ? "Deselect All"
                        : "Select All"}
                    </Button>
                  )}
                </Box>
              </Box>

              <Box
                sx={{
                  maxHeight: isMobile ? "300px" : "400px",
                  overflowY: "auto",
                  p: isMobile ? 0.5 : 1,
                }}
              >
                {filteredSchedules.length === 0 ? (
                  <Box
                    sx={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      p: isMobile ? 3 : 4,
                      color: "#64748b",
                    }}
                  >
                    <Typography
                      variant="h6"
                      sx={{
                        mb: 1,
                        color: "#f59e0b",
                        fontSize: isMobile ? "1rem" : "1.125rem",
                      }}
                    >
                      📅 No Schedules Found
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{
                        mb: 1,
                        textAlign: "center",
                        fontSize: isMobile ? "0.8125rem" : "0.875rem",
                      }}
                    >
                      {dateRange[0] && dateRange[1]
                        ? "No schedules found in the selected date range"
                        : searchValue
                        ? "No schedules match your search criteria"
                        : "No schedules found"}
                    </Typography>
                  </Box>
                ) : (
                  filteredSchedules.map((schedule) => {
                    const groupedClients = groupStudentsByClient(schedule);
                    const statusStyle = getStatusColor(schedule.sessionStatus);
                    const isPending =
                      schedule.sessionStatus === SESSION_STATUS.PENDING;

                    return (
                      <Box
                        key={schedule._id}
                        sx={{
                          display: "flex",
                          alignItems: "flex-start",
                          p: isMobile ? 1.5 : 2,
                          borderRadius: "6px",
                          cursor: "pointer",
                          mb: isMobile ? 0.5 : 1,
                          "&:hover": { bgcolor: "#fef2f2" },
                          bgcolor: selectedSchedules.includes(schedule._id)
                            ? "#fee2e2"
                            : isPending
                            ? "#fef3c7"
                            : "transparent",
                          border: selectedSchedules.includes(schedule._id)
                            ? "2px solid #dc2626"
                            : isPending
                            ? "2px solid #f59e0b"
                            : "2px solid transparent",
                          flexDirection: isMobile ? "column" : "row",
                          gap: isMobile ? 1 : 0,
                        }}
                        onClick={() => handleScheduleSelect(schedule._id)}
                      >
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: isMobile ? "center" : "flex-start",
                            width: isMobile ? "100%" : "auto",
                            justifyContent: isMobile
                              ? "space-between"
                              : "flex-start",
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={selectedSchedules.includes(schedule._id)}
                            onChange={() => handleScheduleSelect(schedule._id)}
                            style={{
                              marginRight: isMobile ? "8px" : "12px",
                              accentColor: "#dc2626",
                            }}
                          />

                          {/* Status Badge - Mobile */}
                          {isMobile && (
                            <Box
                              sx={{
                                display: "flex",
                                flexDirection: "column",
                                alignItems: "flex-end",
                                gap: 0.5,
                              }}
                            >
                              <Chip
                                label={schedule.sessionStatus.replace("_", " ")}
                                size="small"
                                sx={{
                                  fontSize: "0.6rem",
                                  textTransform: "capitalize",
                                  backgroundColor: statusStyle.backgroundColor,
                                  color: statusStyle.color,
                                }}
                              />
                              <Typography
                                variant="caption"
                                sx={{ color: "#64748b", fontSize: "0.6rem" }}
                              >
                                {schedule.subjectType}
                              </Typography>
                            </Box>
                          )}
                        </Box>

                        <Box
                          sx={{ flex: 1, width: isMobile ? "100%" : "auto" }}
                        >
                          {/* Pending Warning */}
                          {isPending && (
                            <Box
                              sx={{
                                mb: 1,
                                p: 1,
                                bgcolor: "#fef3c7",
                                border: "1px solid #f59e0b",
                                borderRadius: "4px",
                              }}
                            >
                              <Typography
                                variant="caption"
                                sx={{
                                  color: "#92400e",
                                  fontWeight: 500,
                                  fontSize: isMobile ? "0.6875rem" : "0.75rem",
                                }}
                              >
                                ⚠️ PENDING SCHEDULE - Exercise caution when
                                deleting
                              </Typography>
                            </Box>
                          )}

                          {/* Students and Clients */}
                          <Box sx={{ mb: isMobile ? 0.5 : 1 }}>
                            {groupedClients.map((group, groupIndex) => (
                              <Box
                                key={groupIndex}
                                sx={{
                                  mb:
                                    groupIndex < groupedClients.length - 1
                                      ? 1
                                      : 0,
                                }}
                              >
                                <Typography
                                  variant="body2"
                                  fontWeight="500"
                                  sx={{
                                    fontSize: isMobile
                                      ? "0.8125rem"
                                      : "0.875rem",
                                  }}
                                >
                                  Students:{" "}
                                  {group.students
                                    .map((s) =>
                                      s.name
                                        .replace("(Inactive Student)", "")
                                        .trim()
                                    )
                                    .join(", ")}
                                </Typography>
                                <Typography
                                  variant="caption"
                                  color="text.secondary"
                                  sx={{
                                    fontSize: isMobile
                                      ? "0.75rem"
                                      : "0.8125rem",
                                  }}
                                >
                                  Client: {group.clientName} ({group.clientId})
                                </Typography>
                              </Box>
                            ))}
                          </Box>

                          {/* Schedule Details */}
                          <Box
                            sx={{
                              display: "flex",
                              gap: isMobile ? 1 : 2,
                              flexWrap: "wrap",
                              alignItems: isMobile ? "flex-start" : "center",
                              flexDirection: isMobile ? "column" : "row",
                            }}
                          >
                            <Typography
                              variant="caption"
                              sx={{
                                color: "#475569",
                                fontSize: isMobile ? "0.75rem" : "0.8125rem",
                              }}
                            >
                              <strong>Teacher:</strong>{" "}
                              {schedule.teacherName
                                ?.replace("(Inactive Teacher)", "")
                                .replace("(Deleted Teacher)", "") || "N/A"}
                            </Typography>
                            <Typography
                              variant="caption"
                              sx={{
                                color: "#475569",
                                fontSize: isMobile ? "0.75rem" : "0.8125rem",
                              }}
                            >
                              <strong>Subject:</strong> {schedule.subjectName}
                            </Typography>
                            <Typography
                              variant="caption"
                              sx={{
                                color: "#475569",
                                fontSize: isMobile ? "0.75rem" : "0.8125rem",
                              }}
                            >
                              <strong>Schedule:</strong> {schedule.day},{" "}
                              {convertTo12Hour(schedule.startTime)} -{" "}
                              {convertTo12Hour(schedule.endTime)}
                            </Typography>
                            <Typography
                              variant="caption"
                              sx={{
                                color: "#475569",
                                fontSize: isMobile ? "0.75rem" : "0.8125rem",
                              }}
                            >
                              <strong>Date:</strong>{" "}
                              {formatTableDate(schedule.classDate)}
                            </Typography>
                          </Box>
                        </Box>

                        {/* Status Badge - Desktop */}
                        {!isMobile && (
                          <Box
                            sx={{
                              display: "flex",
                              flexDirection: "column",
                              alignItems: "flex-end",
                              gap: 1,
                            }}
                          >
                            <Chip
                              label={schedule.sessionStatus.replace("_", " ")}
                              size="small"
                              sx={{
                                fontSize: "0.7rem",
                                textTransform: "capitalize",
                                backgroundColor: statusStyle.backgroundColor,
                                color: statusStyle.color,
                              }}
                            />
                            <Typography
                              variant="caption"
                              sx={{ color: "#64748b", fontSize: "0.65rem" }}
                            >
                              {schedule.subjectType}
                            </Typography>
                          </Box>
                        )}
                      </Box>
                    );
                  })
                )}
              </Box>
            </Box>

            {/* Warning Messages */}
            {selectedSchedules.length > 0 && (
              <Box sx={{ mt: isMobile ? 1.5 : 2 }}>
                {/* General Warning */}
                <Box
                  sx={{
                    p: isMobile ? 1.5 : 2,
                    bgcolor: "#fef2f2",
                    border: "1px solid #fecaca",
                    borderRadius: "6px",
                    mb: selectedPendingSchedules.length > 0 ? 1 : 0,
                  }}
                >
                  <Typography
                    variant="body2"
                    sx={{
                      color: "#dc2626",
                      fontWeight: 500,
                      fontSize: isMobile ? "0.8125rem" : "0.875rem",
                    }}
                  >
                    ⚠️ Warning: This will permanently delete{" "}
                    {selectedSchedules.length} schedule
                    {selectedSchedules.length > 1 ? "s" : ""}. This action
                    cannot be undone.
                  </Typography>
                </Box>

                {/* Pending Schedules Warning */}
                {selectedPendingSchedules.length > 0 && (
                  <Box
                    sx={{
                      p: isMobile ? 1.5 : 2,
                      bgcolor: "#fef3c7",
                      border: "1px solid #f59e0b",
                      borderRadius: "6px",
                    }}
                  >
                    <Typography
                      variant="body2"
                      sx={{
                        color: "#92400e",
                        fontWeight: 600,
                        fontSize: isMobile ? "0.8125rem" : "0.875rem",
                      }}
                    >
                      🚨 CRITICAL WARNING: You have selected{" "}
                      {selectedPendingSchedules.length} PENDING schedule
                      {selectedPendingSchedules.length > 1 ? "s" : ""} for
                      deletion!
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{
                        color: "#92400e",
                        fontSize: isMobile ? "0.75rem" : "0.8125rem",
                        mt: 0.5,
                      }}
                    >
                      Pending schedules may be actively used by the system.
                      Please verify before proceeding.
                    </Typography>
                  </Box>
                )}
              </Box>
            )}

            {/* Action Buttons */}
            <Box
              sx={{
                display: "flex",
                justifyContent: "flex-end",
                gap: isMobile ? 1.5 : 2,
                mt: isMobile ? 2 : 3,
                pt: isMobile ? 1.5 : 2,
                borderTop: "1px solid #e2e8f0",
                flexDirection: isMobile ? "column-reverse" : "row",
              }}
            >
              <button
                className="clear-filters-btn"
                onClick={() => setShowModal(false)}
                style={{
                  fontSize: isMobile ? "0.875rem" : "1rem",
                  padding: isMobile ? "12px" : "8px 16px",
                  width: isMobile ? "100%" : "auto",
                }}
              >
                Cancel
              </button>
              <button
                className="delete-btn"
                onClick={handleDeleteClick}
                disabled={
                  selectedSchedules.length === 0 ||
                  filteredSchedules.length === 0
                }
                style={{
                  fontSize: isMobile ? "0.875rem" : "1rem",
                  padding: isMobile ? "12px" : "8px 16px",
                  width: isMobile ? "100%" : "auto",
                }}
              >
                {filteredSchedules.length === 0
                  ? "No Schedules to Delete"
                  : `Delete ${selectedSchedules.length} Schedule${
                      selectedSchedules.length > 1 ? "s" : ""
                    }`}
              </button>
            </Box>
          </>
        ) : (
          /* Password Confirmation Screen */
          <>
            <Box
              sx={{
                borderBottom: "1px solid #e2e8f0",
                pb: isMobile ? 1.5 : 2,
                mb: isMobile ? 2 : 3,
                display: "flex",
                justifyContent: "space-between",
                alignItems: isMobile ? "flex-start" : "center",
                flexDirection: isMobile ? "column" : "row",
                gap: isMobile ? 1 : 0,
              }}
            >
              <Box>
                <Typography
                  variant="h6"
                  component="h2"
                  sx={{
                    color: "#dc2626",
                    fontWeight: 600,
                    fontSize: isMobile ? "1.125rem" : "1.25rem",
                  }}
                >
                  🔒 Confirm Schedule Deletion
                </Typography>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{
                    mt: 1,
                    fontSize: isMobile ? "0.875rem" : "1rem",
                  }}
                >
                  Enter admin password to confirm deletion of{" "}
                  {selectedSchedules.length} schedule
                  {selectedSchedules.length > 1 ? "s" : ""}
                </Typography>
              </Box>

              <Button
                onClick={handleCancelPassword}
                disabled={isDeleting}
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

            <Box sx={{ my: isMobile ? 2 : 3 }}>
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
                size={isMobile ? "medium" : "large"}
                onKeyPress={(e) => {
                  if (e.key === "Enter" && password) {
                    handlePasswordConfirm();
                  }
                }}
                sx={{
                  fontFamily: POPPINS_FONT,
                  "& .MuiOutlinedInput-root": {
                    fontFamily: POPPINS_FONT,
                    fontSize: isMobile ? "0.875rem" : "1rem",
                  },
                  "& .MuiInputLabel-root": {
                    fontSize: isMobile ? "0.875rem" : "1rem",
                  },
                  "& .MuiFormHelperText-root": {
                    fontSize: isMobile ? "0.75rem" : "0.875rem",
                  },
                }}
              />
            </Box>

            {/* Final Warning with Pending Details */}
            <Box sx={{ mb: isMobile ? 2 : 3 }}>
              <Box
                sx={{
                  p: isMobile ? 1.5 : 2,
                  bgcolor: "#fef2f2",
                  border: "1px solid #fecaca",
                  borderRadius: "6px",
                  mb: selectedPendingSchedules.length > 0 ? 1 : 0,
                }}
              >
                <Typography
                  variant="body2"
                  sx={{
                    color: "#dc2626",
                    fontWeight: 500,
                    fontSize: isMobile ? "0.8125rem" : "0.875rem",
                  }}
                >
                  ⚠️ Final Warning: You are about to permanently delete{" "}
                  {selectedSchedules.length} schedule
                  {selectedSchedules.length > 1 ? "s" : ""}. This action cannot
                  be undone.
                </Typography>
              </Box>

              {selectedPendingSchedules.length > 0 && (
                <Box
                  sx={{
                    p: isMobile ? 1.5 : 2,
                    bgcolor: "#fef3c7",
                    border: "2px solid #f59e0b",
                    borderRadius: "6px",
                  }}
                >
                  <Typography
                    variant="body2"
                    sx={{
                      color: "#92400e",
                      fontWeight: 600,
                      fontSize: isMobile ? "0.8125rem" : "0.875rem",
                    }}
                  >
                    🚨 FINAL PENDING WARNING: {selectedPendingSchedules.length}{" "}
                    of the selected schedules are PENDING!
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{
                      color: "#92400e",
                      fontSize: isMobile ? "0.75rem" : "0.8125rem",
                      mt: 0.5,
                    }}
                  >
                    Are you absolutely sure you want to delete pending
                    schedules? This may disrupt ongoing operations.
                  </Typography>
                </Box>
              )}
            </Box>

            {/* Password Confirmation Buttons */}
            <Box
              sx={{
                display: "flex",
                justifyContent: "flex-end",
                gap: isMobile ? 1.5 : 2,
                pt: isMobile ? 1.5 : 2,
                borderTop: "1px solid #e2e8f0",
                flexDirection: isMobile ? "column-reverse" : "row",
              }}
            >
              <button
                className="clear-filters-btn"
                onClick={handleCancelPassword}
                disabled={isDeleting}
                style={{
                  fontSize: isMobile ? "0.875rem" : "1rem",
                  padding: isMobile ? "12px" : "8px 16px",
                  width: isMobile ? "100%" : "auto",
                }}
              >
                Cancel
              </button>
              <button
                className="delete-btn"
                onClick={handlePasswordConfirm}
                disabled={!password || isDeleting}
                style={{
                  fontSize: isMobile ? "0.875rem" : "1rem",
                  padding: isMobile ? "12px" : "8px 16px",
                  width: isMobile ? "100%" : "auto",
                  backgroundColor:
                    selectedPendingSchedules.length > 0 ? "#dc2626" : undefined,
                }}
              >
                {isDeleting ? (
                  <div className="loading-spinner"></div>
                ) : (
                  "Confirm Delete"
                )}
              </button>
            </Box>
          </>
        )}
      </Box>
    </Modal>
  );
};

const ScheduleFormModal = ({
  showModal,
  setShowModal,
  currentSchedule,
  formData,
  handleChange,
  handleSubmit,
  students,
  teachers,
  isLoading,
  allSubjects,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const isSmallMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const [teacherAvailability, setTeacherAvailability] = useState(null);
  const [loadingAvailability, setLoadingAvailability] = useState(false);

  const BASE_URL = import.meta.env.VITE_BASE_URL;

  const DAYS = [
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
    "Sunday",
  ];
  const RECURRENCE_PATTERNS = {
    WEEKDAYS: "weekdays",
    CUSTOM: "custom",
  };

  const convertTo12Hour = (time24) => {
    if (!time24) return "";

    const [hours, minutes] = time24.split(":");
    const hour = parseInt(hours, 10);
    const minute = minutes;

    if (hour === 0) {
      return `12:${minute} AM`;
    } else if (hour < 12) {
      return `${hour}:${minute} AM`;
    } else if (hour === 12) {
      return `12:${minute} PM`;
    } else {
      return `${hour - 12}:${minute} PM`;
    }
  };

  const convertTimeSlotToAMPM = (timeSlot) => {
    const [startTime, endTime] = timeSlot.split(" to ");
    return `${convertTo12Hour(startTime)} to ${convertTo12Hour(endTime)}`;
  };

  useEffect(() => {
    if (formData.teacher && showModal) {
      fetchTeacherAvailability(formData.teacher);
    } else {
      setTeacherAvailability(null);
    }
  }, [formData.teacher, showModal]);

  const fetchTeacherAvailability = async (teacherId) => {
    setLoadingAvailability(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `${BASE_URL}/api/schedules/teacher-availability/${teacherId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setTeacherAvailability(data);
      }
    } catch (error) {
      console.error("Error fetching teacher availability:", error);
    } finally {
      setLoadingAvailability(false);
    }
  };

  const generateTimeSlots = () => {
    const morningSlots = [];
    const afternoonSlots = [];

    for (let hour = 7; hour <= 12; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const startTime = `${String(hour).padStart(2, "0")}:${String(
          minute
        ).padStart(2, "0")}`;
        const endHour = minute === 30 ? hour + 1 : hour;
        const endMinute = minute === 30 ? 0 : 30;
        const endTime = `${String(endHour).padStart(2, "0")}:${String(
          endMinute
        ).padStart(2, "0")}`;

        morningSlots.push({
          startTime,
          endTime,
          timeSlot: `${startTime} to ${endTime}`,
          displayTime: `${convertTo12Hour(startTime)} to ${convertTo12Hour(
            endTime
          )}`,
          slotId: `${startTime}-${endTime}`,
        });
      }
    }
    for (let hour = 13; hour <= 18; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const startTime = `${String(hour).padStart(2, "0")}:${String(
          minute
        ).padStart(2, "0")}`;
        const endHour = minute === 30 ? hour + 1 : hour;
        const endMinute = minute === 30 ? 0 : 30;
        const endTime = `${String(endHour).padStart(2, "0")}:${String(
          endMinute
        ).padStart(2, "0")}`;

        afternoonSlots.push({
          startTime,
          endTime,
          timeSlot: `${startTime} to ${endTime}`,
          displayTime: `${convertTo12Hour(startTime)} to ${convertTo12Hour(
            endTime
          )}`,
          slotId: `${startTime}-${endTime}`,
        });
      }
    }

    return { morningSlots, afternoonSlots };
  };

  const analyzeSlotAvailability = (slot, availabilityData) => {
    if (!availabilityData)
      return { status: "unavailable", days: [], isFullWeek: false };

    const freeSlot = availabilityData.freeSlots?.find(
      (freeSlot) => freeSlot.timeSlot === slot.timeSlot
    );

    if (freeSlot) {
      const days = freeSlot.availableDays || [];
      const isFullWeek =
        days.length >= 5 ||
        (days.includes("Monday") &&
          days.includes("Tuesday") &&
          days.includes("Wednesday") &&
          days.includes("Thursday") &&
          days.includes("Friday"));

      return {
        status: "free",
        days: days,
        daysText: freeSlot.daysText || "",
        isFullWeek: isFullWeek,
      };
    }

    const reservedSlot = availabilityData.reservedSlots?.find(
      (reservedSlot) => reservedSlot.timeSlot === slot.timeSlot
    );

    if (reservedSlot) {
      const days = reservedSlot.reservedDays?.map((d) => d.day) || [];
      const isFullWeek =
        days.length >= 5 ||
        (days.includes("Monday") &&
          days.includes("Tuesday") &&
          days.includes("Wednesday") &&
          days.includes("Thursday") &&
          days.includes("Friday"));

      return {
        status: "reserved",
        days: days,
        daysText: reservedSlot.daysText || "",
        reasons: reservedSlot.reasons || ["Reserved"],
        isFullWeek: isFullWeek,
      };
    }

    return { status: "unavailable", days: [], isFullWeek: false };
  };

  const formatDayLabels = (days, isFullWeek, status) => {
    if (!days || days.length === 0) return "";

    if (isFullWeek) {
      return "";
    }

    const dayAbbreviations = {
      Monday: "Mon",
      Tuesday: "Tue",
      Wednesday: "Wed",
      Thursday: "Thu",
      Friday: "Fri",
      Saturday: "Sat",
      Sunday: "Sun",
    };

    return days
      .map((day) => dayAbbreviations[day] || day.substring(0, 3))
      .join(",");
  };

  const getResponsiveModalStyle = () => ({
    ...getModalStyles(),
    width: isMobile ? "95vw" : isSmallMobile ? "98vw" : "900px",
    maxWidth: isMobile ? "none" : "900px",
    maxHeight: isMobile ? "95vh" : "90vh",
    borderRadius: isMobile ? "16px" : "12px",
    padding: isMobile ? "16px" : "24px",
    overflow: "auto",
    margin: isMobile ? "10px" : "auto",
  });

  if (!formData) return null;

  const getFilteredTeachers = () => {
    const activeTeachers = teachers.filter(
      (teacher) => teacher.isActive !== false
    );

    if (!formData.subject) {
      return activeTeachers;
    }

    return activeTeachers.filter((teacher) =>
      teacher.profile?.subjects?.some(
        (subject) => subject._id === formData.subject
      )
    );
  };

  const getTeacherDisplayName = (teacher) => {
    if (!formData.subject) {
      return `${teacher.staffId || ""} - ${teacher.name}`;
    }
    const teacherSubject = teacher.profile?.subjects?.find(
      (subject) => subject._id === formData.subject
    );
    const subjectName = teacherSubject ? ` (${teacherSubject.name})` : "";
    return `${teacher.staffId || ""} - ${teacher.name}${subjectName}`;
  };

  return (
    <Modal open={showModal} onClose={() => !isLoading && setShowModal(false)}>
      <Box sx={getResponsiveModalStyle()}>
        {/* Header */}
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: isMobile ? "flex-start" : "center",
            mb: isMobile ? 2 : 3,
            borderBottom: "1px solid #e2e8f0",
            pb: isMobile ? 1.5 : 2,
            flexDirection: isMobile ? "column" : "row",
            gap: isMobile ? 1 : 0,
          }}
        >
          <Typography
            variant="h6"
            sx={{
              fontSize: isMobile ? "1.125rem" : "1.25rem",
              fontWeight: 600,
              color: "#1e293b",
            }}
          >
            {currentSchedule ? "Edit Schedule" : "Add New Schedule"}
          </Typography>

          <button
            onClick={() => setShowModal(false)}
            disabled={isLoading}
            style={{
              border: "none",
              background: "none",
              fontSize: isMobile ? "1.25rem" : "1.5rem",
              cursor: "pointer",
              color: "#64748b",
              padding: isMobile ? "4px" : "8px",
              alignSelf: isMobile ? "flex-end" : "auto",
              borderRadius: isMobile ? "50%" : "4px",
              minWidth: isMobile ? "28px" : "auto",
              height: isMobile ? "28px" : "auto",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            ×
          </button>
        </Box>

        <form onSubmit={handleSubmit}>
          {/* Students Selection */}
          <FormControl
            fullWidth
            margin="normal"
            size={isMobile ? "small" : "medium"}
            required
          >
            <Autocomplete
              multiple
              id="students-autocomplete"
              options={students.filter(
                (student) =>
                  !student.name.includes("(Inactive Student)") &&
                  !["freeze", "drop"].includes(student.profile?.status)
              )}
              getOptionLabel={(option) =>
                `${option?.profile?.studentId || ""} - ${option.name}`
              }
              value={students.filter(
                (student) =>
                  formData.students.includes(student._id) &&
                  !student.name.includes("(Inactive Student)") &&
                  !["freeze", "drop"].includes(student.profile?.status)
              )}
              onChange={(event, newValue) => {
                handleChange({
                  target: {
                    name: "students",
                    value: newValue.map((student) => student._id),
                  },
                });
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Students (Active Only)"
                  size={isMobile ? "small" : "medium"}
                  sx={{
                    fontSize: isMobile ? "0.875rem" : "1rem",
                    "& .MuiInputLabel-root": {
                      fontSize: isMobile ? "0.875rem" : "1rem",
                    },
                  }}
                />
              )}
              renderOption={(props, option) => {
                const { key, ...restProps } = props;
                return (
                  <li key={key} {...restProps}>
                    <Typography
                      sx={{ fontSize: isMobile ? "0.8125rem" : "0.875rem" }}
                    >
                      {`${option?.profile?.studentId || ""} - ${option.name}`}
                    </Typography>
                  </li>
                );
              }}
              disabled={!!currentSchedule}
              size={isMobile ? "small" : "medium"}
            />
          </FormControl>

          {/* Subject Selection */}
          <FormControl
            fullWidth
            margin="normal"
            size={isMobile ? "small" : "medium"}
            required
          >
            <Autocomplete
              id="subject-autocomplete"
              options={
                formData.students && formData.students.length > 0
                  ? students
                      .find((s) => s._id === formData.students[0])
                      ?.profile?.subjectsData?.map((subject) => ({
                        id: subject._id,
                        name: subject.name,
                      })) || []
                  : []
              }
              getOptionLabel={(option) => option.name || ""}
              value={
                formData.subject
                  ? {
                      id: formData.subject,
                      name:
                        allSubjects.find((sub) => sub._id === formData.subject)
                          ?.name || "Unknown Subject",
                    }
                  : null
              }
              onChange={(event, newValue) => {
                handleChange({
                  target: {
                    name: "subject",
                    value: newValue ? newValue.id : "",
                  },
                });
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Subject"
                  size={isMobile ? "small" : "medium"}
                  sx={{
                    fontSize: isMobile ? "0.875rem" : "1rem",
                    "& .MuiInputLabel-root": {
                      fontSize: isMobile ? "0.875rem" : "1rem",
                    },
                  }}
                />
              )}
              disabled={!(formData.students && formData.students.length > 0)}
              size={isMobile ? "small" : "medium"}
            />
          </FormControl>

          {/* Teacher Selection */}
          <FormControl
            fullWidth
            margin="normal"
            size={isMobile ? "small" : "medium"}
            required
          >
            <Autocomplete
              id="teacher-autocomplete"
              options={getFilteredTeachers()}
              getOptionLabel={(option) => getTeacherDisplayName(option)}
              value={
                getFilteredTeachers().find(
                  (teacher) => teacher._id === formData.teacher
                ) || null
              }
              onChange={(event, newValue) => {
                handleChange({
                  target: {
                    name: "teacher",
                    value: newValue ? newValue._id : "",
                  },
                });
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Active Teachers Only"
                  required
                  size={isMobile ? "small" : "medium"}
                  sx={{
                    fontSize: isMobile ? "0.875rem" : "1rem",
                    "& .MuiInputLabel-root": {
                      fontSize: isMobile ? "0.875rem" : "1rem",
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
                        alignItems: "center",
                        width: "100%",
                      }}
                    >
                      <Typography
                        sx={{
                          fontSize: isMobile ? "0.8125rem" : "0.875rem",
                          flex: 1,
                        }}
                      >
                        {getTeacherDisplayName(option)}
                      </Typography>
                      <Typography
                        sx={{
                          marginLeft: "8px",
                          color: "#22c55e",
                          fontSize: isMobile ? "0.6875rem" : "0.75rem",
                          fontWeight: "500",
                        }}
                      >
                        ✓ Active
                      </Typography>
                    </Box>
                  </li>
                );
              }}
              disabled={!formData.subject}
              noOptionsText={
                !formData.subject
                  ? "Please select a subject first"
                  : "No active teachers found for this subject"
              }
              size={isMobile ? "small" : "medium"}
            />
          </FormControl>

          {/* Teacher Availability Section */}
          {formData.teacher && (
            <Box sx={{ mt: isMobile ? 1.5 : 2, mb: isMobile ? 1.5 : 2 }}>
              {loadingAvailability ? (
                <Box
                  sx={{
                    p: isMobile ? 1.5 : 2,
                    bgcolor: "#f8fafc",
                    borderRadius: isMobile ? "12px" : "8px",
                    border: "1px solid #e2e8f0",
                  }}
                >
                  <Typography
                    variant="subtitle2"
                    sx={{
                      mb: isMobile ? 1.5 : 2,
                      color: "#475569",
                      fontWeight: 600,
                      fontSize: isMobile ? "0.8125rem" : "0.875rem",
                    }}
                  >
                    📅 Teacher Availability (Mon to Fri):
                  </Typography>

                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 1,
                      mb: isMobile ? 1.5 : 2,
                    }}
                  >
                    <CircularProgress
                      size={isMobile ? 14 : 16}
                      sx={{ color: "#6b7280" }}
                    />
                    <Typography
                      variant="body2"
                      sx={{
                        color: "#6b7280",
                        fontSize: isMobile ? "0.6875rem" : "0.75rem",
                      }}
                    >
                      Analyzing teacher's schedule...
                    </Typography>
                  </Box>

                  {/* Loading skeleton */}
                  {[1, 2, 3, 4].map((dayIndex) => (
                    <Box key={dayIndex} sx={{ mb: isMobile ? 1.5 : 2 }}>
                      <Box
                        sx={{
                          height: isMobile ? 12 : 14,
                          bgcolor: "#cbd5e1",
                          borderRadius: 1,
                          mb: 1,
                          width: `${50 + dayIndex * 8}%`,
                          maxWidth: isMobile ? "150px" : "200px",
                          animation: "pulse 1.5s ease-in-out infinite",
                          animationDelay: `${dayIndex * 0.1}s`,
                        }}
                      />
                      <Box sx={{ pl: 1, mb: 0.5 }}>
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 1,
                            mb: 0.5,
                          }}
                        >
                          <Box
                            sx={{
                              width: isMobile ? 6 : 8,
                              height: isMobile ? 6 : 8,
                              borderRadius: "50%",
                              bgcolor: "#86efac",
                              flexShrink: 0,
                            }}
                          />
                          <Box
                            sx={{
                              height: isMobile ? 6 : 8,
                              bgcolor: "#d1d5db",
                              borderRadius: 1,
                              width: `${60 + dayIndex * 10}%`,
                              maxWidth: isMobile ? "200px" : "300px",
                              animation: "pulse 1.5s ease-in-out infinite",
                              animationDelay: `${dayIndex * 0.1 + 0.2}s`,
                            }}
                          />
                        </Box>
                      </Box>
                    </Box>
                  ))}
                </Box>
              ) : teacherAvailability &&
                (teacherAvailability.freeSlots ||
                  teacherAvailability.reservedSlots) ? (
                <Box
                  sx={{
                    p: isMobile ? 1.5 : 2,
                    bgcolor: "#f8fafc",
                    borderRadius: isMobile ? "12px" : "8px",
                    border: "1px solid #e2e8f0",
                  }}
                >
                  <Typography
                    variant="subtitle2"
                    sx={{
                      mb: isMobile ? 1.5 : 2,
                      color: "#475569",
                      fontWeight: 600,
                      fontSize: isMobile ? "0.8125rem" : "0.875rem",
                    }}
                  >
                    📅 Teacher Availability (Mon to Fri):
                  </Typography>

                  {/* Legend */}
                  <Box
                    sx={{
                      mb: isMobile ? 1.5 : 2,
                      display: "flex",
                      gap: isMobile ? 1.5 : 2,
                      flexWrap: "wrap",
                      justifyContent: "center",
                    }}
                  >
                    <Box
                      sx={{ display: "flex", alignItems: "center", gap: 0.5 }}
                    >
                      <Box
                        sx={{
                          width: isMobile ? 10 : 12,
                          height: isMobile ? 10 : 12,
                          borderRadius: "50%",
                          bgcolor: "#22c55e",
                        }}
                      />
                      <Typography
                        sx={{
                          fontSize: isMobile ? "0.6rem" : "0.65rem",
                          color: "#374151",
                        }}
                      >
                        Free
                      </Typography>
                    </Box>
                    <Box
                      sx={{ display: "flex", alignItems: "center", gap: 0.5 }}
                    >
                      <Box
                        sx={{
                          width: isMobile ? 10 : 12,
                          height: isMobile ? 10 : 12,
                          borderRadius: "50%",
                          bgcolor: "#ef4444",
                        }}
                      />
                      <Typography
                        sx={{
                          fontSize: isMobile ? "0.6rem" : "0.65rem",
                          color: "#374151",
                        }}
                      >
                        Reserved
                      </Typography>
                    </Box>
                    <Box
                      sx={{ display: "flex", alignItems: "center", gap: 0.5 }}
                    >
                      <Box
                        sx={{
                          width: isMobile ? 10 : 12,
                          height: isMobile ? 10 : 12,
                          borderRadius: "50%",
                          bgcolor: "#9ca3af",
                        }}
                      />
                      <Typography
                        sx={{
                          fontSize: isMobile ? "0.6rem" : "0.65rem",
                          color: "#374151",
                        }}
                      >
                        Unavailable
                      </Typography>
                    </Box>
                  </Box>

                  {/* Time Grid */}
                  <Box
                    sx={{
                      display: "flex",
                      gap: isMobile ? 2 : 3,
                      flexDirection: isMobile ? "column" : "row",
                    }}
                  >
                    {/* Morning Column */}
                    <Box sx={{ flex: 1 }}>
                      <Typography
                        sx={{
                          fontSize: isMobile ? "0.65rem" : "0.7rem",
                          fontWeight: 600,
                          mb: 1,
                          color: "#1f2937",
                          textAlign: "center",
                          borderBottom: "1px solid #e5e7eb",
                          pb: 0.5,
                        }}
                      >
                        Morning (7:00 AM - 1:00 PM)
                      </Typography>

                      {generateTimeSlots().morningSlots.map((slot, index) => {
                        const availability = analyzeSlotAvailability(
                          slot,
                          teacherAvailability
                        );
                        const dotColor =
                          availability.status === "free"
                            ? "#22c55e"
                            : availability.status === "reserved"
                            ? "#ef4444"
                            : "#9ca3af";
                        const label = formatDayLabels(
                          availability.days,
                          availability.isFullWeek,
                          availability.status
                        );

                        return (
                          <Box
                            key={index}
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              gap: isMobile ? 0.5 : 1,
                              mb: 0.3,
                              minHeight: isMobile ? "16px" : "20px",
                            }}
                          >
                            <Typography
                              sx={{
                                fontSize: isMobile ? "0.6rem" : "0.65rem",
                                minWidth: isMobile ? "45px" : "55px",
                                color: "#374151",
                                fontFamily: "monospace",
                                textAlign: "right",
                                textDecoration:
                                  availability.status === "reserved"
                                    ? "line-through"
                                    : "none",
                              }}
                            >
                              {slot.displayTime}
                            </Typography>

                            <Box
                              sx={{
                                width: isMobile ? 6 : 8,
                                height: isMobile ? 6 : 8,
                                borderRadius: "50%",
                                bgcolor: dotColor,
                                flexShrink: 0,
                              }}
                            />

                            <Box
                              sx={{
                                minWidth: isMobile ? "35px" : "45px",
                                textAlign: "left",
                              }}
                            >
                              {label && (
                                <Typography
                                  sx={{
                                    fontSize: isMobile ? "0.5rem" : "0.55rem",
                                    color:
                                      availability.status === "free"
                                        ? "#059669"
                                        : availability.status === "reserved"
                                        ? "#dc2626"
                                        : "#6b7280",
                                    fontWeight: 500,
                                    backgroundColor:
                                      availability.status === "free"
                                        ? "#ecfdf5"
                                        : availability.status === "reserved"
                                        ? "#fef2f2"
                                        : "#f9fafb",
                                    px: isMobile ? 0.3 : 0.5,
                                    py: 0.1,
                                    borderRadius: 0.5,
                                    textDecoration:
                                      availability.status === "reserved"
                                        ? "line-through"
                                        : "none",
                                    display: "inline-block",
                                  }}
                                >
                                  {label}
                                </Typography>
                              )}
                            </Box>
                          </Box>
                        );
                      })}
                    </Box>

                    {/* Afternoon Column */}
                    <Box sx={{ flex: 1 }}>
                      <Typography
                        sx={{
                          fontSize: isMobile ? "0.65rem" : "0.7rem",
                          fontWeight: 600,
                          mb: 1,
                          color: "#1f2937",
                          textAlign: "center",
                          borderBottom: "1px solid #e5e7eb",
                          pb: 0.5,
                        }}
                      >
                        Afternoon (1:00 PM - 7:00 PM)
                      </Typography>

                      {generateTimeSlots().afternoonSlots.map((slot, index) => {
                        const availability = analyzeSlotAvailability(
                          slot,
                          teacherAvailability
                        );
                        const dotColor =
                          availability.status === "free"
                            ? "#22c55e"
                            : availability.status === "reserved"
                            ? "#ef4444"
                            : "#9ca3af";
                        const label = formatDayLabels(
                          availability.days,
                          availability.isFullWeek,
                          availability.status
                        );

                        return (
                          <Box
                            key={index}
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              gap: isMobile ? 0.5 : 1,
                              mb: 0.3,
                              minHeight: isMobile ? "16px" : "20px",
                            }}
                          >
                            <Typography
                              sx={{
                                fontSize: isMobile ? "0.6rem" : "0.65rem",
                                minWidth: isMobile ? "45px" : "55px",
                                color: "#374151",
                                fontFamily: "monospace",
                                textAlign: "right",
                                textDecoration:
                                  availability.status === "reserved"
                                    ? "line-through"
                                    : "none",
                              }}
                            >
                              {slot.displayTime}
                            </Typography>

                            <Box
                              sx={{
                                width: isMobile ? 6 : 8,
                                height: isMobile ? 6 : 8,
                                borderRadius: "50%",
                                bgcolor: dotColor,
                                flexShrink: 0,
                              }}
                            />

                            <Box
                              sx={{
                                minWidth: isMobile ? "35px" : "45px",
                                textAlign: "left",
                              }}
                            >
                              {label && (
                                <Typography
                                  sx={{
                                    fontSize: isMobile ? "0.5rem" : "0.55rem",
                                    color:
                                      availability.status === "free"
                                        ? "#059669"
                                        : availability.status === "reserved"
                                        ? "#dc2626"
                                        : "#6b7280",
                                    fontWeight: 500,
                                    backgroundColor:
                                      availability.status === "free"
                                        ? "#ecfdf5"
                                        : availability.status === "reserved"
                                        ? "#fef2f2"
                                        : "#f9fafb",
                                    px: isMobile ? 0.3 : 0.5,
                                    py: 0.1,
                                    borderRadius: 0.5,
                                    textDecoration:
                                      availability.status === "reserved"
                                        ? "line-through"
                                        : "none",
                                    display: "inline-block",
                                  }}
                                >
                                  {label}
                                </Typography>
                              )}
                            </Box>
                          </Box>
                        );
                      })}
                    </Box>
                  </Box>

                  {/* Summary */}
                  <Box
                    sx={{
                      mt: isMobile ? 1.5 : 2,
                      pt: 1,
                      borderTop: "1px solid #e2e8f0",
                      display: "flex",
                      gap: isMobile ? 1.5 : 2,
                      flexWrap: "wrap",
                      justifyContent: "center",
                    }}
                  >
                    <Typography
                      variant="caption"
                      sx={{
                        color: "#059669",
                        fontSize: isMobile ? "0.6rem" : "0.65rem",
                        fontWeight: 500,
                      }}
                    >
                      🟢 Free:{" "}
                      {teacherAvailability.summary?.totalFreeSlots || 0} slots
                    </Typography>
                    <Typography
                      variant="caption"
                      sx={{
                        color: "#dc2626",
                        fontSize: isMobile ? "0.6rem" : "0.65rem",
                        fontWeight: 500,
                      }}
                    >
                      🔴 Reserved:{" "}
                      {teacherAvailability.summary?.totalReservedSlots || 0}{" "}
                      slots
                    </Typography>
                    <Typography
                      variant="caption"
                      sx={{
                        color: "#6b7280",
                        fontSize: isMobile ? "0.6rem" : "0.65rem",
                      }}
                    >
                      Total: {teacherAvailability.summary?.totalTimeSlots || 0}{" "}
                      slots
                    </Typography>
                  </Box>
                </Box>
              ) : null}
            </Box>
          )}

          {/* Day Selection */}
          <FormControl
            fullWidth
            margin="normal"
            size={isMobile ? "small" : "medium"}
            required
          >
            <InputLabel sx={{ fontSize: isMobile ? "0.875rem" : "1rem" }}>
              Day
            </InputLabel>
            <Select
              name="day"
              value={formData.day}
              label="Day"
              onChange={handleChange}
              sx={{
                fontSize: isMobile ? "0.875rem" : "1rem",
              }}
            >
              {DAYS.map((day) => (
                <MenuItem key={day} value={day}>
                  <Typography
                    sx={{ fontSize: isMobile ? "0.8125rem" : "0.875rem" }}
                  >
                    {day}
                  </Typography>
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* Time Selection */}
          <Box
            sx={{
              display: "flex",
              gap: isMobile ? 1.5 : 2,
              mb: isMobile ? 1.5 : 2,
              flexDirection: isMobile ? "column" : "row",
            }}
          >
            <TextField
              label="Start Time"
              name="startTime"
              type="time"
              value={formData.startTime}
              onChange={handleChange}
              required
              fullWidth
              size={isMobile ? "small" : "medium"}
              InputLabelProps={{ shrink: true }}
              inputProps={{ step: 300 }}
              sx={{
                mt: 2,
                fontSize: isMobile ? "0.875rem" : "1rem",
                "& .MuiInputLabel-root": {
                  fontSize: isMobile ? "0.875rem" : "1rem",
                },
              }}
            />

            <TextField
              label="End Time"
              name="endTime"
              type="time"
              value={formData.endTime}
              onChange={handleChange}
              required
              fullWidth
              size={isMobile ? "small" : "medium"}
              InputLabelProps={{ shrink: true }}
              inputProps={{ step: 300 }}
              sx={{
                mt: 2,
                fontSize: isMobile ? "0.875rem" : "1rem",
                "& .MuiInputLabel-root": {
                  fontSize: isMobile ? "0.875rem" : "1rem",
                },
              }}
            />
          </Box>

          {/* Date Picker */}
          <LocalizationProvider dateAdapter={AdapterDateFns}>
            <DatePicker
              label="Class Date"
              value={formData.classDate ? new Date(formData.classDate) : null}
              onChange={(newValue) => {
                handleChange({
                  target: { name: "classDate", value: newValue },
                });
              }}
              slotProps={{
                textField: {
                  fullWidth: true,
                  size: isMobile ? "small" : "medium",
                  required: true,
                  sx: {
                    mt: 2,
                    fontSize: isMobile ? "0.875rem" : "1rem",
                    "& .MuiInputLabel-root": {
                      fontSize: isMobile ? "0.875rem" : "1rem",
                    },
                  },
                },
              }}
              minDate={new Date()}
            />
          </LocalizationProvider>

          {/* Recurring Schedule */}
          <FormControl
            fullWidth
            margin="normal"
            size={isMobile ? "small" : "medium"}
          >
            <InputLabel sx={{ fontSize: isMobile ? "0.875rem" : "1rem" }}>
              Recurring Schedule
            </InputLabel>
            <Select
              name="isRecurring"
              value={formData.isRecurring}
              label="Recurring Schedule"
              onChange={handleChange}
              sx={{ fontSize: isMobile ? "0.875rem" : "1rem" }}
            >
              <MenuItem value={true}>
                <Typography
                  sx={{ fontSize: isMobile ? "0.8125rem" : "0.875rem" }}
                >
                  Yes
                </Typography>
              </MenuItem>
              <MenuItem value={false}>
                <Typography
                  sx={{ fontSize: isMobile ? "0.8125rem" : "0.875rem" }}
                >
                  No
                </Typography>
              </MenuItem>
            </Select>
          </FormControl>

          {/* Recurrence Pattern */}
          {currentSchedule ? (
            <TextField
              fullWidth
              label="Recurrence Pattern"
              value={
                formData.recurrencePattern === "weekdays"
                  ? "Weekdays (Mon-Fri)"
                  : "Custom Days"
              }
              margin="normal"
              size={isMobile ? "small" : "medium"}
              InputProps={{
                readOnly: true,
              }}
              sx={{
                "& .MuiInputBase-input": {
                  backgroundColor: "#f8fafc",
                  color: "#64748b",
                  fontSize: isMobile ? "0.875rem" : "1rem",
                },
                "& .MuiInputLabel-root": {
                  fontSize: isMobile ? "0.875rem" : "1rem",
                },
              }}
            />
          ) : (
            <FormControl
              fullWidth
              margin="normal"
              size={isMobile ? "small" : "medium"}
            >
              <InputLabel sx={{ fontSize: isMobile ? "0.875rem" : "1rem" }}>
                Recurrence Pattern
              </InputLabel>
              <Select
                name="recurrencePattern"
                value={formData.recurrencePattern}
                label="Recurrence Pattern"
                onChange={handleChange}
                disabled={!formData.isRecurring}
                sx={{ fontSize: isMobile ? "0.875rem" : "1rem" }}
              >
                <MenuItem value={RECURRENCE_PATTERNS.WEEKDAYS}>
                  <Typography
                    sx={{ fontSize: isMobile ? "0.8125rem" : "0.875rem" }}
                  >
                    Weekdays (Mon-Fri)
                  </Typography>
                </MenuItem>
                <MenuItem value={RECURRENCE_PATTERNS.CUSTOM}>
                  <Typography
                    sx={{ fontSize: isMobile ? "0.8125rem" : "0.875rem" }}
                  >
                    Custom Days
                  </Typography>
                </MenuItem>
              </Select>
            </FormControl>
          )}

          {/* Custom Days Selection */}
          {formData.isRecurring && formData.recurrencePattern === "custom" && (
            <>
              {currentSchedule ? (
                <TextField
                  fullWidth
                  label="Selected Days"
                  value={
                    Array.isArray(formData.customDays)
                      ? formData.customDays.join(", ")
                      : ""
                  }
                  margin="normal"
                  size={isMobile ? "small" : "medium"}
                  InputProps={{
                    readOnly: true,
                  }}
                  sx={{
                    "& .MuiInputBase-input": {
                      backgroundColor: "#f8fafc",
                      color: "#64748b",
                      fontSize: isMobile ? "0.875rem" : "1rem",
                    },
                    "& .MuiInputLabel-root": {
                      fontSize: isMobile ? "0.875rem" : "1rem",
                    },
                  }}
                />
              ) : (
                <FormControl
                  fullWidth
                  margin="normal"
                  size={isMobile ? "small" : "medium"}
                  required
                >
                  <InputLabel sx={{ fontSize: isMobile ? "0.875rem" : "1rem" }}>
                    Select Days
                  </InputLabel>
                  <Select
                    multiple
                    name="customDays"
                    value={
                      Array.isArray(formData.customDays)
                        ? formData.customDays
                        : []
                    }
                    label="Select Days"
                    onChange={(e) => {
                      handleChange({
                        target: {
                          name: "customDays",
                          value: e.target.value,
                        },
                      });
                    }}
                    renderValue={(selected) => (
                      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                        {selected.map((day) => (
                          <Chip
                            key={day}
                            label={day}
                            size={isMobile ? "small" : "medium"}
                            sx={{
                              fontSize: isMobile ? "0.6875rem" : "0.75rem",
                              height: isMobile ? "20px" : "24px",
                            }}
                          />
                        ))}
                      </Box>
                    )}
                    sx={{ fontSize: isMobile ? "0.875rem" : "1rem" }}
                  >
                    {DAYS.map((day) => (
                      <MenuItem key={day} value={day}>
                        <Typography
                          sx={{ fontSize: isMobile ? "0.8125rem" : "0.875rem" }}
                        >
                          {day}
                        </Typography>
                      </MenuItem>
                    ))}
                  </Select>
                  <Typography
                    variant="caption"
                    sx={{
                      mt: 1,
                      color: "text.secondary",
                      fontSize: isMobile ? "0.6875rem" : "0.75rem",
                    }}
                  >
                    Next schedule will be created on the next selected day after
                    attendance is marked
                  </Typography>
                </FormControl>
              )}
            </>
          )}

          {/* Reschedule Type (for edit mode) */}
          {currentSchedule && (
            <FormControl
              fullWidth
              margin="normal"
              size={isMobile ? "small" : "medium"}
              required
            >
              <InputLabel sx={{ fontSize: isMobile ? "0.875rem" : "1rem" }}>
                Reschedule Type
              </InputLabel>
              <Select
                name="rescheduleType"
                value={formData.rescheduleType}
                label="Reschedule Type"
                onChange={handleChange}
                sx={{ fontSize: isMobile ? "0.875rem" : "1rem" }}
              >
                <MenuItem value="temporary">
                  <Typography
                    sx={{ fontSize: isMobile ? "0.8125rem" : "0.875rem" }}
                  >
                    Temporary
                  </Typography>
                </MenuItem>
                <MenuItem value="permanent">
                  <Typography
                    sx={{ fontSize: isMobile ? "0.8125rem" : "0.875rem" }}
                  >
                    Permanent
                  </Typography>
                </MenuItem>
              </Select>
            </FormControl>
          )}

          {/* Action Buttons */}
          <Box
            sx={{
              mt: isMobile ? 2 : 3,
              display: "flex",
              justifyContent: "flex-end",
              gap: isMobile ? 1.5 : 2,
              pt: isMobile ? 1.5 : 2,
              borderTop: "1px solid #e2e8f0",
              flexDirection: isMobile ? "column-reverse" : "row",
            }}
          >
            <button
              className="clear-filters-btn"
              onClick={() => setShowModal(false)}
              disabled={isLoading}
              style={{
                fontSize: isMobile ? "0.875rem" : "1rem",
                padding: isMobile ? "12px" : "8px 16px",
                width: isMobile ? "100%" : "auto",
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
                padding: isMobile ? "12px" : "8px 16px",
                width: isMobile ? "100%" : "auto",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              {isLoading ? (
                <div className="loading-spinner"></div>
              ) : currentSchedule ? (
                "Update Schedule"
              ) : (
                "Add Schedule"
              )}
            </button>
          </Box>
        </form>
      </Box>
    </Modal>
  );
};

const AdminScheduleView = () => {
  const [schedules, setSchedules] = useState([]);
  const [filteredSchedules, setFilteredSchedules] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isSyncing, setIsSyncing] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [dateRange, setDateRange] = useState([null, null]);
  const [selectedSubjectFilter, setSelectedSubjectFilter] = useState("all");
  const [selectedStudentFilter, setSelectedStudentFilter] = useState("all");
  const [isLoadingSchedules, setIsLoadingSchedules] = useState(true);
  const [allSubjects, setAllSubjects] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState("all");
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState(null);
  const [showSummaryModal, setShowSummaryModal] = useState(false);
  const [summaryData, setSummaryData] = useState(null);
  const [timeRange, setTimeRange] = useState({ start: "", end: "" });
  const [showModal, setShowModal] = useState(false);
  const [currentSchedule, setCurrentSchedule] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [students, setStudents] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [scheduleToDelete, setScheduleToDelete] = useState(null);
  const [showDeleteSchedulesModal, setShowDeleteSchedulesModal] =
    useState(false);

  const [showActiveTeacherSchedules, setShowActiveTeacherSchedules] =
    useState(false);
  const [showInactiveTeacherSchedules, setShowInactiveTeacherSchedules] =
    useState(false);
  const [showActiveStudentSchedules, setShowActiveStudentSchedules] =
    useState(false);
  const [showInactiveStudentSchedules, setShowInactiveStudentSchedules] =
    useState(false);
  useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [formData, setFormData] = useState({
    students: [],
    teacher: "",
    subject: "",
    day: "",
    startTime: "",
    endTime: "",
    classDate: null,
    isRecurring: true,
    recurrencePattern: "weekdays",
    customDays: [],
  });
  const [sessionStatusCounts, setSessionStatusCounts] = useState({
    pending: 0,
    available: 0,
    in_progress: 0,
    completed: 0,
  });
  const { notification, showNotification, closeNotification } =
    useNotification();

  const BASE_URL = import.meta.env.VITE_BASE_URL;

  const calculateSummary = () => {
    const today = new Date();
    const todayString = format(today, "yyyy-MM-dd");

    const todaysSchedules = schedules.filter((schedule) => {
      let scheduleDateString;
      if (typeof schedule.classDate === "string") {
        if (schedule.classDate.includes("T")) {
          scheduleDateString = schedule.classDate.split("T")[0];
        } else {
          scheduleDateString = schedule.classDate;
        }
      } else {
        scheduleDateString = format(new Date(schedule.classDate), "yyyy-MM-dd");
      }
      return scheduleDateString === todayString;
    });

    const summary = {
      totalClasses: todaysSchedules.length,
      completedClasses: todaysSchedules.filter(
        (s) => s.sessionStatus === SESSION_STATUS.COMPLETED
      ).length,
      activeClasses: todaysSchedules.filter(
        (s) => s.sessionStatus === SESSION_STATUS.IN_PROGRESS
      ).length,
      pendingClasses: todaysSchedules.filter(
        (s) => s.sessionStatus === SESSION_STATUS.PENDING
      ).length,
      leaveClasses: todaysSchedules.filter(
        (s) => s.sessionStatus === SESSION_STATUS.LEAVE
      ).length,
      absentClasses: todaysSchedules.filter(
        (s) => s.sessionStatus === SESSION_STATUS.ABSENT
      ).length,
      availableClasses: todaysSchedules.filter(
        (s) => s.sessionStatus === SESSION_STATUS.AVAILABLE
      ).length,
      lateStartedClasses: todaysSchedules.filter((s) => s.startDelay > 0)
        .length,
      totalLateMinutes: todaysSchedules.reduce(
        (total, s) => total + (s.startDelay || 0),
        0
      ),
      earlyEndedClasses: todaysSchedules.filter((s) => s.earlyEnd > 0).length,
      totalEarlyMinutes: todaysSchedules.reduce(
        (total, s) => total + (s.earlyEnd || 0),
        0
      ),
    };

    setSummaryData(summary);
    setShowSummaryModal(true);
  };
  const calculateFilteredSessionStats = () => {
    const pending = filteredSchedules.filter(
      (schedule) => schedule.sessionStatus === SESSION_STATUS.PENDING
    ).length;

    const in_progress = filteredSchedules.filter(
      (schedule) => schedule.sessionStatus === SESSION_STATUS.IN_PROGRESS
    ).length;

    const today = new Date();
    const todayString = format(today, "yyyy-MM-dd");

    const todaysClasses = filteredSchedules.filter((schedule) => {
      const scheduleDate = new Date(schedule.classDate);
      const scheduleDateString = format(scheduleDate, "yyyy-MM-dd");
      return scheduleDateString === todayString;
    }).length;

    const completed = filteredSchedules.filter(
      (schedule) => schedule.sessionStatus === SESSION_STATUS.COMPLETED
    ).length;

    const absent = filteredSchedules.filter(
      (schedule) => schedule.sessionStatus === SESSION_STATUS.ABSENT
    ).length;

    const leave = filteredSchedules.filter(
      (schedule) => schedule.sessionStatus === SESSION_STATUS.LEAVE
    ).length;

    return {
      pending,
      in_progress,
      todaysClasses,
      completed,
      absent,
      leave,
    };
  };
  const calculateAttendanceStats = () => {
    const totalStudentAttendances = filteredSchedules.reduce(
      (total, schedule) => {
        return total + (schedule.studentAttendances?.length || 0);
      },
      0
    );

    const presentCount = filteredSchedules.reduce((total, schedule) => {
      return (
        total +
        (schedule.studentAttendances?.filter((att) => att.status === "present")
          ?.length || 0)
      );
    }, 0);

    const absentCount = filteredSchedules.reduce((total, schedule) => {
      return (
        total +
        (schedule.studentAttendances?.filter((att) => att.status === "absent")
          ?.length || 0)
      );
    }, 0);

    const leaveCount = filteredSchedules.reduce((total, schedule) => {
      return (
        total +
        (schedule.studentAttendances?.filter((att) => att.status === "leave")
          ?.length || 0)
      );
    }, 0);

    return {
      totalStudentAttendances,
      presentCount,
      absentCount,
      leaveCount,
    };
  };
  const generateSchedulePDF = async () => {
    setIsGeneratingPDF(true);
    try {
      const doc = new jsPDF("l", "mm", "a4");

      doc.setFontSize(16);
      doc.setFont("helvetica", "bold");
      doc.text("Class Schedule Report with Lessons", 20, 20);
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      const currentDate = new Date().toLocaleDateString("en-GB");
      let dateRangeText = `Generated on: ${currentDate}`;

      if (dateRange[0] && dateRange[1]) {
        dateRangeText += ` | Date Range: ${format(
          dateRange[0],
          "dd/MM/yyyy"
        )} - ${format(dateRange[1], "dd/MM/yyyy")}`;
      } else {
        dateRangeText += ` | Showing: Today's classes only`;
      }

      doc.text(dateRangeText, 20, 30);
      const stats = calculateFilteredSessionStats();
      const summaryText = `Total: ${filteredSchedules.length} | Pending: ${stats.pending} | In Progress: ${stats.in_progress} | Completed: ${stats.completed} | Leave: ${stats.leave} | Absent: ${stats.absent}`;
      doc.text(summaryText, 20, 38);
      const tableData = [];

      for (const schedule of filteredSchedules) {
        const groupedClients = groupStudentsByClient(schedule);
        const lessonsText =
          schedule.lessons && schedule.lessons.length > 0
            ? schedule.lessons
                .map((lesson) => `${lesson.title}: ${lesson.description}`)
                .join(" | ")
            : "No lessons recorded";
        let timingDetails = "";
        if (schedule.sessionStatus === "completed") {
          const details = [];
          if (schedule.startDelay > 0)
            details.push(`${schedule.startDelay}m late`);
          if (schedule.earlyEnd > 0)
            details.push(`${schedule.earlyEnd}m early`);
          if (schedule.actualDuration)
            details.push(`${schedule.actualDuration}m duration`);
          timingDetails =
            details.length > 0 ? details.join(", ") : "Completed on time";
        } else if (schedule.sessionStatus === "in_progress") {
          timingDetails =
            schedule.startDelay > 0
              ? `${schedule.startDelay}m late`
              : "Started on time";
        } else {
          timingDetails = schedule.sessionStatus.replace("_", " ");
        }

        groupedClients.forEach((group, groupIndex) => {
          let studentsText = "";
          if (group.students.length === 1) {
            const studentName =
              schedule.studentAttendances[0]?.studentName ||
              group.students[0].name;
            studentsText = studentName.replace("(Inactive Student)", "").trim();
          } else {
            studentsText = group.students
              .map((student) =>
                student.name.replace("(Inactive Student)", "").trim()
              )
              .join(", ");
          }

          const clientInfo = `${group.clientName} (${group.clientId})`;

          tableData.push([
            studentsText,
            clientInfo,
            schedule.teacherName
              ?.replace("(Inactive Teacher)", "")
              .replace("(Deleted Teacher)", "") || "N/A",
            schedule.subjectName || "N/A",
            schedule.subjectType
              ? schedule.subjectType.charAt(0).toUpperCase() +
                schedule.subjectType.slice(1).toLowerCase()
              : "N/A",
            `${schedule.day}\n${convertTo12Hour(
              schedule.startTime
            )} - ${convertTo12Hour(schedule.endTime)}\n${formatTableDate(
              schedule.classDate
            )}`,
            schedule.sessionStatus.replace(/_/g, " ").charAt(0).toUpperCase() +
              schedule.sessionStatus.replace(/_/g, " ").slice(1),
            timingDetails,
            lessonsText,
          ]);
        });
      }

      autoTable(doc, {
        head: [
          [
            "Students",
            "Client",
            "Teacher",
            "Subject",
            "Type",
            "Schedule",
            "Status",
            "Timing",
            "Lessons",
          ],
        ],
        body: tableData,
        startY: 45,
        styles: {
          fontSize: 9,
          cellPadding: 3,
          overflow: "linebreak",
          halign: "left",
          valign: "top",
        },
        headStyles: {
          fillColor: [31, 61, 97],
          textColor: 255,
          fontStyle: "bold",
          fontSize: 11,
        },
        columnStyles: {
          0: { cellWidth: 25 },
          1: { cellWidth: 40 },
          2: { cellWidth: 35 },
          3: { cellWidth: 30 },
          4: { cellWidth: 27 },
          5: { cellWidth: 27 },
          6: { cellWidth: 25 },
          7: { cellWidth: 27 },
          8: { cellWidth: 35 },
        },
        margin: { left: 8, right: 8 },
        alternateRowStyles: {
          fillColor: [245, 245, 245],
        },
        didDrawPage: function (data) {
          const pageCount = doc.internal.getNumberOfPages();
          const pageSize = doc.internal.pageSize;
          doc.setFontSize(8);
          doc.text(
            `Page ${data.pageNumber} of ${pageCount}`,
            pageSize.width - 30,
            pageSize.height - 10
          );
          doc.text(
            `Generated by: ${
              localStorage.getItem("user")
                ? JSON.parse(localStorage.getItem("user")).name
                : "Admin"
            }`,
            20,
            pageSize.height - 10
          );
        },
      });

      const fileName = `schedule_report_with_lessons_${
        new Date().toISOString().split("T")[0]
      }.pdf`;
      doc.save(fileName);

      showNotification("PDF downloaded successfully");
    } catch (error) {
      console.error("Error generating PDF:", error);
      showNotification("Error generating PDF", "error");
    } finally {
      setIsGeneratingPDF(false);
    }
  };
  const handleDeleteSchedules = async (scheduleIds) => {
    try {
      setIsDeleting(true);

      const response = await axios.delete(
        `${BASE_URL}/api/schedules/delete-multiple`,
        {
          data: { scheduleIds },
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.data) {
        showNotification(
          response.data.message ||
            `${scheduleIds.length} schedule${
              scheduleIds.length > 1 ? "s" : ""
            } deleted successfully`,
          "success"
        );
        await fetchSchedules();
        return response.data;
      }
    } catch (error) {
      console.error("Error deleting schedules:", error);

      if (error.response?.status === 403) {
        showNotification(
          "You don't have permission to delete schedules",
          "error"
        );
      } else if (error.response?.status === 400) {
        const errorData = error.response.data;
        if (errorData.nonDeletableCount > 0) {
          showNotification(
            `Cannot delete ${errorData.nonDeletableCount} schedule${
              errorData.nonDeletableCount > 1 ? "s" : ""
            } with pending/in-progress status`,
            "error"
          );
        } else {
          showNotification(errorData.message || "Invalid request", "error");
        }
      } else if (error.response?.status === 404) {
        showNotification("Selected schedules not found", "error");
      } else {
        showNotification(
          error.response?.data?.message || "Error deleting schedules",
          "error"
        );
      }

      throw error;
    } finally {
      setIsDeleting(false);
    }
  };
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      showNotification("Authentication required", "error");
      return;
    }
    axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;

    const fetchInitialData = async () => {
      try {
        await Promise.all([
          fetchSchedules(),
          fetchSubjects(),
          fetchStudents(),
          fetchTeachers(),
        ]);
      } catch (error) {
        console.error("Error fetching initial data:", error);
        showNotification("Error loading data", "error");
      }
    };

    fetchInitialData();
  }, []);

  const fetchStudents = async () => {
    try {
      const response = await axios.get(`${BASE_URL}/api/admin/users/student`);
      const studentsWithDetails = response.data.users.map((student) => ({
        _id: student._id,
        name: student.name,
        profile: {
          ...student.profile,
          subjects: student.profile?.subjects?.map((sub) => sub._id) || [],
          subjectsData: student.profile?.subjects || [],
          assignedTeachers: student.profile?.assignedTeachers || [],
          studentId: student.profile?.studentId,
        },
      }));
      setStudents(studentsWithDetails);
    } catch (error) {
      showNotification(
        error.response?.data?.message || "Error fetching students",
        "error"
      );
    }
  };

  const fetchTeachers = async () => {
    try {
      const [quranTeachersResponse, subjectTeachersResponse] =
        await Promise.all([
          axios.get(`${BASE_URL}/api/admin/users/teacher_quran`),
          axios.get(`${BASE_URL}/api/admin/users/teacher_subjects`),
        ]);

      const quranTeachers = quranTeachersResponse.data.users || [];
      const subjectTeachers = subjectTeachersResponse.data.users || [];
      const allTeachers = [...quranTeachers, ...subjectTeachers];

      const activeTeachers = allTeachers.filter(
        (teacher) => teacher.isActive === true
      );

      setTeachers(activeTeachers);
    } catch (error) {
      showNotification(
        error.response?.data?.message || "Error fetching active teachers",
        "error"
      );
    }
  };

  const handleChange = async (e) => {
    const { name, value } = e.target;

    if (name === "students") {
      const selectedStudents = students.filter((s) => value.includes(s._id));
      const inactiveStudents = selectedStudents.filter((s) =>
        s.name.includes("(Inactive Student)")
      );

      if (inactiveStudents.length > 0) {
        showNotification(
          `Cannot select inactive student(s): ${inactiveStudents
            .map((s) => s.name)
            .join(", ")}`,
          "error"
        );
        return;
      }

      const selectedStudent = students.find((s) => s._id === value[0]);
      const selectedSubject = selectedStudent?.profile?.subjectsData?.[0]?._id;

      const firstAssignedTeacher =
        selectedStudent?.profile?.assignedTeachers?.[0];

      const assignedTeacherIsActive = teachers.find(
        (t) =>
          t._id === firstAssignedTeacher?.teacher?._id._id &&
          t.isActive !== false
      );

      setFormData((prev) => ({
        ...prev,
        students: value,
        subject: selectedSubject || "",
        teacher: assignedTeacherIsActive
          ? firstAssignedTeacher?.teacher?._id._id || ""
          : "",
      }));

      if (firstAssignedTeacher && !assignedTeacherIsActive) {
        showNotification(
          "The assigned teacher for this student is currently inactive. Please select another active teacher.",
          "warning"
        );
      }
    } else if (name === "subject") {
      const selectedStudent = students.find(
        (s) => s._id === formData.students[0]
      );
      const assignedTeacher = selectedStudent?.profile?.assignedTeachers?.find(
        (at) => {
          return at.subject._id === value;
        }
      );

      const teacherIsActive = teachers.find(
        (t) =>
          t._id === assignedTeacher?.teacher?._id._id && t.isActive !== false
      );

      setFormData((prev) => ({
        ...prev,
        [name]: value,
        teacher: teacherIsActive ? assignedTeacher?.teacher?._id._id || "" : "",
      }));

      if (assignedTeacher && !teacherIsActive) {
        showNotification(
          "The assigned teacher for this subject is currently inactive. Please select another active teacher.",
          "warning"
        );
      }
    } else if (name === "teacher") {
      const selectedTeacher = teachers.find((t) => t._id === value);
      if (selectedTeacher && selectedTeacher.isActive === false) {
        showNotification(
          "This teacher is currently inactive and cannot be assigned to schedules.",
          "error"
        );
        return;
      }

      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    } else if (name === "recurrencePattern") {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
        customDays: value === "custom" ? [] : [],
      }));
    } else if (name === "customDays") {
      setFormData((prev) => ({
        ...prev,
        customDays: Array.isArray(value) ? value : [],
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };
  useEffect(() => {
    if (schedules.length > 0 && teachers.length > 0) {
      const schedulesWithInactiveTeachers = schedules.filter((schedule) => {
        const teacher = teachers.find((t) => t._id === schedule.teacherId);
        return teacher && teacher.isActive === false;
      });
    }
  }, [schedules, teachers]);

  useEffect(() => {
    const init = async () => {
      try {
        await fetchSchedules();
        showNotification("Schedules loaded successfully");
      } catch (error) {
        showNotification(
          error.response?.data?.message || "Error loading schedules",
          "error"
        );
      }
    };

    init();
  }, []);
  const handleDelete = (schedule) => {
    setScheduleToDelete(schedule);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!scheduleToDelete) return;

    try {
      setIsDeleting(true);

      await axios.delete(
        `${BASE_URL}/api/schedules/delete/${scheduleToDelete._id}`
      );

      showNotification("Schedule deleted successfully");
      fetchSchedules();
      setShowDeleteModal(false);
      setScheduleToDelete(null);
    } catch (error) {
      showNotification(
        error.response?.data?.message || "Error deleting schedule",
        "error"
      );
    } finally {
      setIsDeleting(false);
    }
  };

  const closeDeleteModal = () => {
    if (!isDeleting) {
      setShowDeleteModal(false);
      setScheduleToDelete(null);
    }
  };
  const groupStudentsByClient = (schedule) => {
    const clientGroups = {};

    schedule.studentAttendances?.forEach((attendance, index) => {
      let clientKey;
      let clientIdDisplay;

      if (
        typeof attendance.clientId === "object" &&
        attendance.clientId?.customId
      ) {
        clientKey = attendance.clientId.customId;
        clientIdDisplay = attendance.clientId.customId;
      } else if (typeof attendance.clientId === "string") {
        clientKey = attendance.clientId;
        clientIdDisplay = attendance.clientId;
      } else {
        clientKey = `client-${index}`;
        clientIdDisplay = attendance.clientId?.toString() || "N/A";
      }

      if (!clientGroups[clientKey]) {
        clientGroups[clientKey] = {
          clientName: attendance.clientName,
          clientId: clientIdDisplay,
          students: [],
          attendances: [],
        };
      }
      clientGroups[clientKey].students.push({
        name: schedule.studentNames[index],
        studentId: attendance.studentId,
        attendance: attendance,
        parentName: attendance.parentName || null,
      });
      clientGroups[clientKey].attendances.push(attendance);
    });

    return Object.values(clientGroups);
  };

  const handleEdit = (schedule) => {
    const studentIds = Array.isArray(schedule.students)
      ? schedule.students
      : [schedule.students].filter(Boolean);
    let classDate = null;
    if (schedule.classDate) {
      if (schedule.classDate.includes("T")) {
        classDate = new Date(schedule.classDate);
      } else {
        classDate = new Date(schedule.classDate.split("-").reverse().join("-"));
      }
    }
    setCurrentSchedule(schedule);
    setFormData({
      students: studentIds,
      teacher: schedule.teacherId,
      subject: schedule.subject,
      day: schedule.day,
      startTime: schedule.startTime,
      endTime: schedule.endTime,
      classDate: classDate,
      rescheduleType: "temporary",
      isRecurring: schedule.isRecurring || false,
      recurrencePattern: schedule.recurrencePattern || "weekdays",
      customDays: schedule.customDays || [],
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const payload = {
        students: formData.students,
        teacher: formData.teacher,
        subject: formData.subject,
        day: formData.day,
        startTime: formData.startTime,
        endTime: formData.endTime,
        classDate: format(new Date(formData.classDate), "yyyy-MM-dd"),
        rescheduleType: formData.rescheduleType,
        isRecurring: formData.isRecurring,
        recurrencePattern: formData.recurrencePattern,
        customDays: formData.customDays,
      };

      if (currentSchedule) {
        await axios.put(
          `${BASE_URL}/api/schedules/update/${currentSchedule._id}`,
          payload
        );
        showNotification("Schedule updated successfully");
      } else {
        await axios.post(`${BASE_URL}/api/schedules/create`, payload);
        showNotification("Schedule created successfully");
      }

      fetchSchedules();
      setShowModal(false);
      setCurrentSchedule(null);
    } catch (error) {
      showNotification(
        error.response?.data?.message || "Error saving schedule",
        "error"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const fetchSchedules = async (showSuccessMessage = false) => {
    setIsSyncing(true);
    setIsLoadingSchedules(true);
    try {
      const response = await axios.get(`${BASE_URL}/api/schedules/admin/list`);
      setSchedules(response.data.schedules);
      setFilteredSchedules(response.data.schedules);
      setSessionStatusCounts(response.data.sessionStatusCounts);

      if (showSuccessMessage) {
        showNotification("Schedules refreshed successfully");
      }
    } catch (error) {
      showNotification(
        error.response?.data?.message || "Error fetching schedules",
        "error"
      );
    } finally {
      setIsSyncing(false);
      setIsLoadingSchedules(false);
    }
  };

  const fetchSubjects = async () => {
    try {
      const response = await axios.get(`${BASE_URL}/api/subjects/view`);
      if (response.data && Array.isArray(response.data.subjects)) {
        setAllSubjects(response.data.subjects);
      }
    } catch (error) {
      showNotification(
        error.response?.data?.message || "Error fetching subjects",
        "error"
      );
    }
  };

  useEffect(() => {
    let filtered = [...schedules];

    if (!dateRange[0] && !dateRange[1]) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const endOfToday = new Date(today);
      endOfToday.setHours(23, 59, 59, 999);

      filtered = filtered.filter((schedule) => {
        try {
          const scheduleDate = new Date(schedule.classDate);
          scheduleDate.setHours(0, 0, 0, 0);

          return scheduleDate >= today && scheduleDate <= endOfToday;
        } catch (error) {
          console.error("Error comparing dates:", error);
          return false;
        }
      });
    }

    if (searchTerm) {
      filtered = filtered.filter((schedule) => {
        const basicMatch =
          schedule.teacherName
            .toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          schedule.subjectName
            .toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          schedule.studentNames.some((name) =>
            name.toLowerCase().includes(searchTerm.toLowerCase())
          );

        if (basicMatch) return true;

        const groupedData = groupStudentsByClient(schedule);
        return groupedData.some(
          (group) =>
            group.clientName
              ?.toLowerCase()
              .includes(searchTerm.toLowerCase()) ||
            group.clientId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            group.students.some(
              (student) =>
                student.name
                  ?.toLowerCase()
                  .includes(searchTerm.toLowerCase()) ||
                student.studentId
                  ?.toString()
                  .toLowerCase()
                  .includes(searchTerm.toLowerCase()) ||
                student.parentName
                  ?.toLowerCase()
                  .includes(searchTerm.toLowerCase())
            )
        );
      });
    }
    if (selectedStatus !== "all") {
      filtered = filtered.filter(
        (schedule) => schedule.sessionStatus === selectedStatus
      );
    }

    if (selectedSubjectFilter !== "all") {
      filtered = filtered.filter(
        (schedule) => schedule.subjectType === selectedSubjectFilter
      );
    }
    if (selectedSubject !== "all") {
      filtered = filtered.filter(
        (schedule) => schedule.subject === selectedSubject
      );
    }
    if (dateRange[0] && dateRange[1]) {
      filtered = filtered.filter((schedule) => {
        try {
          const scheduleDate = new Date(schedule.classDate);
          scheduleDate.setHours(0, 0, 0, 0);
          const startDate = new Date(dateRange[0]);
          startDate.setHours(0, 0, 0, 0);
          const endDate = new Date(dateRange[1]);
          endDate.setHours(23, 59, 59, 999);

          return scheduleDate >= startDate && scheduleDate <= endDate;
        } catch (error) {
          console.error("Error comparing dates:", error);
          return false;
        }
      });
    }
    if (timeRange.start && timeRange.end) {
      filtered = filtered.filter((schedule) => {
        const scheduleStart = schedule.startTime;
        const scheduleEnd = schedule.endTime;
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
    if (showActiveTeacherSchedules && !showInactiveTeacherSchedules) {
      filtered = filtered.filter(
        (schedule) => !schedule.teacherName?.includes("(Inactive Teacher)")
      );
    } else if (!showActiveTeacherSchedules && showInactiveTeacherSchedules) {
      filtered = filtered.filter((schedule) =>
        schedule.teacherName?.includes("(Inactive Teacher)")
      );
    }

    if (showActiveStudentSchedules && !showInactiveStudentSchedules) {
      filtered = filtered.filter(
        (schedule) =>
          schedule.studentAttendances?.every(
            (attendance) => attendance.studentIsActive !== false
          ) &&
          !schedule.studentNames?.some((name) =>
            name.includes("(Inactive Student)")
          )
      );
    } else if (!showActiveStudentSchedules && showInactiveStudentSchedules) {
      filtered = filtered.filter(
        (schedule) =>
          schedule.studentAttendances?.some(
            (attendance) => attendance.studentIsActive === false
          ) ||
          schedule.studentNames?.some((name) =>
            name.includes("(Inactive Student)")
          )
      );
    }
    setFilteredSchedules(filtered);
  }, [
    schedules,
    searchTerm,
    selectedStatus,
    selectedSubjectFilter,
    selectedSubject,
    dateRange,
    timeRange,
    showActiveTeacherSchedules,
    showInactiveTeacherSchedules,
    showActiveStudentSchedules,
    showInactiveStudentSchedules,
  ]);

  return (
    <div className="management-container">
      <div className="management-header">
        <div>
          <h2>Class Schedule Overview</h2>
          <p className="total-count">
            {filteredSchedules.length} Total Schedules
          </p>
        </div>
        <div className="header-buttons">
          <SyncButton
            isSyncing={isSyncing}
            onClick={() => fetchSchedules(true)}
          />

          <button
            className="add-btn responsive-add-btn"
            onClick={calculateSummary}
            title="View Today's Summary"
          >
            <FaChartBar />
            <span className="add-btn-text">Summary</span>
          </button>

          <button
            className="add-btn responsive-add-btn"
            onClick={() => setShowDeleteSchedulesModal(true)}
            disabled={isLoading}
          >
            <FaTrash />
            <span className="add-btn-text">Delete Schedules</span>
          </button>

          <button
            className="add-btn responsive-add-btn"
            onClick={generateSchedulePDF}
            disabled={isGeneratingPDF || filteredSchedules.length === 0}
            title="Download Schedule Report with Lessons"
          >
            <FaFilePdf />

            <span className="add-btn-text">Download PDF</span>
          </button>

          <button
            className="add-btn responsive-add-btn"
            onClick={() => {
              setCurrentSchedule(null);
              setFormData({
                students: [],
                teacher: "",
                subject: "",
                day: "",
                startTime: "",
                endTime: "",
                classDate: null,
                isRecurring: true,
                recurrencePattern: "weekdays",
              });
              setShowModal(true);
            }}
          >
            <FaPlus />
            <span className="add-btn-text"> Add Schedule</span>
          </button>
        </div>
      </div>
      <div className="stats-cards">
        <div className="stat-card today-present">
          <h3>Today's Classes</h3>
          <p>{calculateFilteredSessionStats().todaysClasses}</p>
        </div>
        <div className="stat-card total-present">
          <h3>Pending Classes</h3>
          <p>{calculateFilteredSessionStats().pending}</p>
        </div>
        <div className="stat-card absent">
          <h3>Active Classes</h3>
          <p>{calculateFilteredSessionStats().in_progress}</p>
        </div>
        <div className="stat-card leave">
          <h3>Completed Classes</h3>
          <p>{calculateFilteredSessionStats().completed}</p>
        </div>
      </div>

      <div className="stats-cards">
        <div className="stat-card today-present">
          <h3>Total Attendance</h3>
          <p>{calculateAttendanceStats().totalStudentAttendances}</p>
        </div>
        <div className="stat-card total-present">
          <h3>Present</h3>
          <p>{calculateAttendanceStats().presentCount}</p>
        </div>
        <div className="stat-card absent">
          <h3>Absent Sessions</h3>
          <p>{calculateFilteredSessionStats().absent}</p>
        </div>
        <div className="stat-card leave">
          <h3>Leave Sessions</h3>
          <p>{calculateFilteredSessionStats().leave}</p>
        </div>
      </div>

      <div className="filter-section">
        <div className="search-box">
          <FaSearch className="search-icon" />
          <input
            type="text"
            placeholder="Search by Client Name/ID, Student Name, Subject, Teacher Name"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="filter-box checkbox-filter">
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={showActiveTeacherSchedules}
              onChange={(e) => setShowActiveTeacherSchedules(e.target.checked)}
              className="checkbox-input"
            />
            <span className="checkbox-text">Active Teachers</span>
          </label>
          <label className="checkbox-label" style={{ marginLeft: "16px" }}>
            <input
              type="checkbox"
              checked={showInactiveTeacherSchedules}
              onChange={(e) =>
                setShowInactiveTeacherSchedules(e.target.checked)
              }
              className="checkbox-input"
            />
            <span className="checkbox-text">Inactive Teachers</span>
          </label>
        </div>

        <div className="filter-box checkbox-filter">
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={showActiveStudentSchedules}
              onChange={(e) => setShowActiveStudentSchedules(e.target.checked)}
              className="checkbox-input"
            />
            <span className="checkbox-text">Active Students</span>
          </label>
          <label className="checkbox-label" style={{ marginLeft: "16px" }}>
            <input
              type="checkbox"
              checked={showInactiveStudentSchedules}
              onChange={(e) =>
                setShowInactiveStudentSchedules(e.target.checked)
              }
              className="checkbox-input"
            />
            <span className="checkbox-text">Inactive Students</span>
          </label>
        </div>

        <div className="filter-box">
          <FaFilter className="filter-icon" />
          <Select
            className="subject-select"
            value={selectedSubjectFilter}
            onChange={(e) => setSelectedSubjectFilter(e.target.value)}
            sx={{
              width: {
                xs: "100%",
                sm: "180px",
                md: "200px",
              },
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
            <MenuItem value="all">All Types</MenuItem>
            <MenuItem value="quran">Quran</MenuItem>
            <MenuItem value="subjects">Subjects</MenuItem>
          </Select>
        </div>

        <div className="filter-box">
          <FaFilter className="filter-icon" />
          <Select
            className="subject-select"
            value={selectedSubject}
            onChange={(e) => setSelectedSubject(e.target.value)}
            sx={{
              width: {
                xs: "100%",
                sm: "180px",
                md: "200px",
              },
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

        <div className="filter-box">
          <FaFilter className="filter-icon" />
          <Select
            className="status-select"
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            sx={{
              width: {
                xs: "100%",
                sm: "180px",
                md: "200px",
              },
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
            <MenuItem value="all">All Status</MenuItem>
            <MenuItem value={SESSION_STATUS.PENDING}>Pending</MenuItem>
            <MenuItem value={SESSION_STATUS.IN_PROGRESS}>In Progress</MenuItem>
            <MenuItem value={SESSION_STATUS.COMPLETED}>Completed</MenuItem>
            <MenuItem value={SESSION_STATUS.AVAILABLE}>Available</MenuItem>
            <MenuItem value={SESSION_STATUS.ABSENT}>Absent</MenuItem>
            <MenuItem value={SESSION_STATUS.LEAVE}>Leave</MenuItem>
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
            customInput={
              <div
                className="date-input-wrapper"
                style={{
                  position: "relative",
                  width: window.innerWidth <= 768 && "100%",
                }}
              >
                {window.innerWidth >= 768 && (
                  <FaFilter className="filter-icon" />
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
                  style={{
                    paddingLeft: window.innerWidth >= 768 ? "36px" : "12px",
                  }}
                  readOnly
                />
              </div>
            }
          />
        </div>
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
        <button
          className="clear-filters-btn"
          onClick={() => {
            setSelectedStatus("all");
            setSelectedSubjectFilter("all");
            setSelectedSubject("all");
            setDateRange([null, null]);
            setSearchTerm("");
            setTimeRange({ start: "", end: "" });
            setShowActiveTeacherSchedules(false);
            setShowInactiveTeacherSchedules(false);
            setShowActiveStudentSchedules(false);
            setShowInactiveStudentSchedules(false);
          }}
        >
          Clear Filters
        </button>
      </div>

      <div className="table-container">
        {isLoadingSchedules ? (
          <div className="loading-container">
            <CircularProgress />
          </div>
        ) : filteredSchedules.length > 0 ? (
          <table>
            <thead>
              <tr>
                <th>
                  Students & <br /> Clients
                </th>
                <th>Teacher</th>
                <th>Subject</th>
                <th>
                  Subject <br /> Type
                </th>
                <th>Slot</th>
                {/* <th>Status</th> */}
                <th>
                  Session <br /> Status
                </th>
                <th>
                  Attendance <br />
                </th>
                <th>
                  Timing <br />
                  Details
                </th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredSchedules.map((schedule) => (
                <tr key={schedule._id}>
                  <td>
                    {groupStudentsByClient(schedule).map(
                      (group, groupIndex) => (
                        <div
                          key={`client-group-${groupIndex}`}
                          style={{
                            marginBottom:
                              groupIndex !==
                              groupStudentsByClient(schedule).length - 1
                                ? "8px"
                                : "0",
                          }}
                        >
                          <div style={{ fontWeight: "500" }}>
                            {group.students.length === 1 ? (
                              <div>
                                {(
                                  schedule.studentAttendances[0]?.studentName ||
                                  group.students[0].name
                                )
                                  .replace("(Inactive Student)", "")
                                  .trim()}
                              </div>
                            ) : (
                              <div>
                                {group.students.map((student, idx) => (
                                  <div
                                    key={idx}
                                    style={{
                                      marginBottom:
                                        idx < group.students.length - 1
                                          ? "6px"
                                          : "0",
                                    }}
                                  >
                                    {student.name
                                      .replace("(Inactive Student)", "")
                                      .trim()}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                          <div style={{ marginTop: "8px" }}>
                            <div
                              style={{
                                color: "#475569",
                                fontSize: "0.8rem",
                                fontWeight: "500",
                              }}
                            >
                              {group.clientName}
                            </div>
                            <div
                              style={{
                                color: "#64748b",
                                fontSize: "0.75rem",
                                marginTop: "2px",
                              }}
                            >
                              {group.clientId}
                            </div>
                          </div>
                          {(!schedule.studentAttendances[0]?.studentIsActive ||
                            !schedule.studentAttendances[0]
                              ?.clientIsActive) && (
                            <div style={{ marginTop: "6px" }}>
                              <span
                                style={{
                                  fontSize: "0.7rem",
                                  fontWeight: "500",
                                  color: "#dc2626",
                                  backgroundColor: "#fee2e2",
                                  padding: "2px 6px",
                                  borderRadius: "4px",
                                }}
                              >
                                Inactive
                              </span>
                            </div>
                          )}

                          {group.students.some(
                            (student) => student.parentName
                          ) && (
                            <div
                              style={{
                                color: "#64748b",
                                fontSize: "0.7rem",
                                marginTop: "2px",
                                fontStyle: "italic",
                              }}
                            >
                              Parents: (
                              {group.students
                                .filter((student) => student.parentName)
                                .map((student) => student.parentName)
                                .join(", ")}
                              )
                            </div>
                          )}
                        </div>
                      )
                    )}
                  </td>
                  <td style={{ fontWeight: "500" }}>
                    {schedule.teacherName &&
                    schedule.teacherName.includes("(Inactive Teacher)") ? (
                      <>
                        {schedule.teacherName.replace(
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
                    ) : schedule.teacherName &&
                      schedule.teacherName.includes("(Deleted Teacher)") ? (
                      <>
                        {schedule.teacherName.replace(" (Deleted Teacher)", "")}
                        <div
                          style={{
                            color: "#dc2626",
                            fontSize: "0.75rem",
                            fontWeight: "500",
                          }}
                        >
                          (Deleted Teacher)
                        </div>
                      </>
                    ) : (
                      schedule.teacherName
                    )}
                  </td>
                  <td style={{ fontWeight: "500" }}>{schedule.subjectName}</td>
                  <td
                    style={{ fontWeight: "500", textTransform: "capitalize" }}
                  >
                    {schedule.subjectType}
                  </td>
                  <td>
                    <div style={{ fontWeight: "500" }}>{schedule.day}</div>
                    <span style={{ color: "#64748b", fontSize: "0.8125rem" }}>
                      <>
                        {convertTo12Hour(schedule.startTime)} <br />
                        {convertTo12Hour(schedule.endTime)}
                      </>
                    </span>
                    <div style={{ color: "#64748b", fontSize: "0.8125rem" }}>
                      {formatTableDate(schedule.classDate)}
                    </div>
                  </td>
                  {/* <td>
                    <span
                      className={`status-tag ${schedule.status.toLowerCase()}`}
                    >
                      {schedule.status}
                    </span>
                  </td> */}
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
                          schedule.sessionStatus === "completed"
                            ? "#15803d"
                            : schedule.sessionStatus === "in_progress"
                            ? "#0f172a"
                            : schedule.sessionStatus === "pending"
                            ? "#b45309"
                            : "#991b1b",

                        backgroundColor:
                          schedule.sessionStatus === "completed"
                            ? "#dcfce7"
                            : schedule.sessionStatus === "in_progress"
                            ? "#e0f2fe"
                            : schedule.sessionStatus === "pending"
                            ? "#fef3c7"
                            : "#fee2e2",
                      }}
                    >
                      {schedule.sessionStatus.replace("_", " ")}
                    </span>
                  </td>
                  <td>
                    {groupStudentsByClient(schedule).map(
                      (group, groupIndex) => (
                        <div
                          key={`attendance-group-${groupIndex}`}
                          style={{
                            marginBottom:
                              groupIndex !==
                              groupStudentsByClient(schedule).length - 1
                                ? "8px"
                                : "0",
                          }}
                        >
                          {group.students.map((student, studentIndex) => (
                            <div
                              key={`attendance-${studentIndex}`}
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "4px",
                                marginBottom:
                                  studentIndex !== group.students.length - 1
                                    ? "4px"
                                    : 0,
                              }}
                            >
                              {/* {group.students.length > 1 && (
                                <span
                                  style={{
                                    fontSize: "0.7rem",
                                    color: "#64748b",
                                    minWidth: "60px",
                                    fontWeight: "500",
                                  }}
                                >
                                  {student.name}:
                                </span>
                              )} */}
                              <span
                                style={{
                                  display: "inline-block",
                                  padding: "4px 10px",
                                  fontSize: "0.75rem",
                                  fontWeight: 500,
                                  borderRadius: "5px",
                                  textTransform: "capitalize",
                                  color:
                                    schedule.sessionStatus === "completed"
                                      ? "#15803d"
                                      : schedule.sessionStatus === "in_progress"
                                      ? "#0f172a"
                                      : schedule.sessionStatus === "pending"
                                      ? "#b45309"
                                      : schedule.sessionStatus === "available"
                                      ? "#0369a1"
                                      : schedule.sessionStatus === "absent"
                                      ? "#dc2626"
                                      : schedule.sessionStatus === "leave"
                                      ? "#ea580c"
                                      : "#991b1b",

                                  backgroundColor:
                                    schedule.sessionStatus === "completed"
                                      ? "#dcfce7"
                                      : schedule.sessionStatus === "in_progress"
                                      ? "#e0f2fe"
                                      : schedule.sessionStatus === "pending"
                                      ? "#fef3c7"
                                      : schedule.sessionStatus === "available"
                                      ? "#e0f2fe"
                                      : schedule.sessionStatus === "absent"
                                      ? "#fee2e2"
                                      : schedule.sessionStatus === "leave"
                                      ? "#fed7aa"
                                      : "#fee2e2",
                                }}
                              >
                                {schedule.sessionStatus.replace("_", " ")}
                              </span>
                            </div>
                          ))}
                        </div>
                      )
                    )}
                  </td>
                  <td>
                    {schedule.sessionStatus === SESSION_STATUS.PENDING ? (
                      <div style={{ color: "#94a3b8", fontSize: "0.75rem" }}>
                        Class not started yet
                      </div>
                    ) : schedule.sessionStatus === SESSION_STATUS.AVAILABLE ? (
                      <div style={{ color: "#94a3b8", fontSize: "0.75rem" }}>
                        Teacher available, waiting to start
                      </div>
                    ) : schedule.sessionStatus === SESSION_STATUS.ABSENT ? (
                      <div style={{ color: "#dc2626", fontSize: "0.75rem" }}>
                        Session marked as absent
                      </div>
                    ) : schedule.sessionStatus === SESSION_STATUS.LEAVE ? (
                      <div style={{ color: "#ea580c", fontSize: "0.75rem" }}>
                        Session marked as leave
                      </div>
                    ) : schedule.sessionStatus ===
                      SESSION_STATUS.IN_PROGRESS ? (
                      <div>
                        {schedule.startDelay > 0 ? (
                          <div
                            style={{ color: "#ef4444", fontSize: "0.75rem" }}
                          >
                            {schedule.startDelay}m late
                          </div>
                        ) : (
                          <div
                            style={{ color: "#22c55e", fontSize: "0.75rem" }}
                          >
                            Started on time
                          </div>
                        )}
                        <div style={{ color: "#64748b", fontSize: "0.75rem" }}>
                          Class in progress...
                        </div>
                      </div>
                    ) : schedule.sessionStatus === SESSION_STATUS.COMPLETED ? (
                      <div>
                        {schedule.startDelay > 0 && (
                          <div
                            style={{
                              color: "#ef4444",
                              fontSize: "0.85rem",
                              fontWeight: 400,
                            }}
                          >
                            {schedule.startDelay}m late
                          </div>
                        )}
                        {schedule.earlyEnd > 0 ? (
                          <div
                            style={{
                              color: "#f97316",
                              fontSize: "0.85rem",
                              fontWeight: 400,
                            }}
                          >
                            {schedule.earlyEnd}m early
                          </div>
                        ) : (
                          <div
                            style={{ color: "#22c55e", fontSize: "0.75rem" }}
                          >
                            Completed on time
                          </div>
                        )}
                        {typeof schedule.actualDuration === "number" && (
                          <div
                            style={{
                              color: "#475569",
                              fontSize: "0.75rem",
                              marginTop: "4px",
                            }}
                          >
                            Duration: {schedule.actualDuration} mins
                          </div>
                        )}
                      </div>
                    ) : (
                      <div style={{ color: "#94a3b8", fontSize: "0.75rem" }}>
                        No timing data available
                      </div>
                    )}
                  </td>
                  <td>
                    <div className="actions">
                      <button
                        onClick={() => {
                          setSelectedSchedule(schedule);
                          setShowViewModal(true);
                        }}
                      >
                        <FaEye />
                      </button>
                      <button onClick={() => handleEdit(schedule)}>
                        <FaEdit />
                      </button>
                      <button
                        onClick={() => handleDelete(schedule)}
                        title="Delete Schedule"
                        disabled={isLoading || isDeleting}
                      >
                        <FaTrash />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="no-data">
            <p>No schedules found</p>
          </div>
        )}
      </div>
      <Modal
        open={showViewModal}
        onClose={() => setShowViewModal(false)}
        aria-labelledby="view-schedule-modal"
      >
        <ViewScheduleModal
          schedule={selectedSchedule}
          setShowModal={setShowViewModal}
          modalStyle={modalStyle}
        />
      </Modal>
      <Modal
        open={showSummaryModal}
        onClose={() => setShowSummaryModal(false)}
        aria-labelledby="summary-modal"
      >
        <ScheduleSummaryModal
          summary={summaryData || {}}
          setShowModal={setShowSummaryModal}
          modalStyle={modalStyle}
        />
      </Modal>
      <ScheduleFormModal
        showModal={showModal}
        setShowModal={setShowModal}
        currentSchedule={currentSchedule}
        formData={formData}
        handleChange={handleChange}
        handleSubmit={handleSubmit}
        students={students}
        teachers={teachers}
        isLoading={isLoading}
        allSubjects={allSubjects}
      />
      <DeleteConfirmationModal
        open={showDeleteModal}
        onClose={closeDeleteModal}
        onConfirm={confirmDelete}
        isLoading={isDeleting}
        type="schedule"
        data={scheduleToDelete}
        formatTableDate={formatTableDate}
        convertTo12Hour={convertTo12Hour}
      />
      <DeleteSchedulesModal
        showModal={showDeleteSchedulesModal}
        setShowModal={setShowDeleteSchedulesModal}
        schedules={schedules}
        onDeleteSchedules={handleDeleteSchedules}
        isLoading={isLoading}
        students={students}
        teachers={teachers}
        groupStudentsByClient={groupStudentsByClient}
      />
      <NotificationSnackbar
        notification={notification}
        onClose={closeNotification}
      />
    </div>
  );
};

export default AdminScheduleView;
