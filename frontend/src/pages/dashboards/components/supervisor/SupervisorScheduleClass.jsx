import { useState, useEffect } from "react";
import { FaEdit, FaSearch, FaPlus, FaFilter, FaEye } from "react-icons/fa";
import {
  Modal,
  Box,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Button,
  Typography,
  CircularProgress,
  Chip,
  Tooltip,
  Autocomplete,
} from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import ReactDatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { format } from "date-fns";
import axios from "axios";
import "../../../../styles/components/Management.css";
import { getModalStyles } from "../../../../styles/modal/commonModalStyles";
import useNotification from "../../../../hooks/useNotification";
import NotificationSnackbar from "../../../../components/common/NotificationSnackbar";
import ViewScheduleModal from "./viewModals/ViewScheduleModal";
import SyncButton from "../../../../components/common/SyncButton";
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
const SESSION_STATUS = {
  PENDING: "pending",
  IN_PROGRESS: "in_progress",
  COMPLETED: "completed",
  AVAILABLE: "available",
  ABSENT: "absent",
  LEAVE: "leave",
};
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
}) => {
  const [teacherAvailability, setTeacherAvailability] = useState(null);
  const [loadingAvailability, setLoadingAvailability] = useState(false);
  const BASE_URL = import.meta.env.VITE_BASE_URL;
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

  useEffect(() => {
    if (formData.teacher && showModal) {
      fetchTeacherAvailability(formData.teacher);
    } else {
      setTeacherAvailability(null);
    }
  }, [formData.teacher, showModal]);

  if (!formData) return null;
  const getFilteredTeachers = () => {
    if (!formData.subject) {
      return teachers.filter((teacher) => teacher.isActive !== false);
    }

    return teachers.filter(
      (teacher) =>
        teacher.isActive !== false &&
        teacher.subjects.some((subject) => subject._id === formData.subject)
    );
  };

  const getTeacherDisplayName = (teacher) => {
    if (!formData.subject) {
      return `${teacher.staffId || ""} - ${teacher.name}`;
    }

    const teacherSubject = teacher.subjects.find(
      (subject) => subject._id === formData.subject
    );
    const subjectName = teacherSubject ? ` (${teacherSubject.name})` : "";
    return `${teacher.staffId || ""} - ${teacher.name}${subjectName}`;
  };

  return (
    <Modal open={showModal} onClose={() => !isLoading && setShowModal(false)}>
      <Box sx={getModalStyles()}>
        <Typography variant="h6" sx={{ mb: 2 }}>
          {currentSchedule ? "Edit Schedule" : "Add New Schedule"}
        </Typography>

        <form onSubmit={handleSubmit}>
          <FormControl fullWidth margin="normal" size="small">
            <Autocomplete
              multiple
              id="students-autocomplete"
              options={students}
              getOptionLabel={(option) => {
                const studentId =
                  option.profile?.studentId || option.studentId || "";
                const studentName = option.name || "";
                const clientInfo = option.profile?.clientInfo;

                if (
                  clientInfo &&
                  clientInfo.clientId &&
                  clientInfo.clientName
                ) {
                  return `${studentId} - ${studentName} (${clientInfo.clientId}-${clientInfo.clientName})`;
                }

                return `${studentId} - ${studentName}`;
              }}
              value={students.filter((student) =>
                formData.students.includes(student._id)
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
                  label="Students"
                  required={false}
                  size="small"
                />
              )}
              renderOption={(props, option) => {
                const { key, ...restProps } = props;

                const studentId =
                  option.profile?.studentId || option.studentId || "";
                const studentName = option.name || "";
                const clientInfo = option.profile?.clientInfo;

                return (
                  <li key={key} {...restProps}>
                    <Box
                      sx={{
                        display: "flex",
                        flexDirection: "column",
                        width: "100%",
                      }}
                    >
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {`${studentId} - ${studentName}`}
                      </Typography>
                      {clientInfo &&
                        clientInfo.clientId &&
                        clientInfo.clientName && (
                          <Typography
                            variant="caption"
                            sx={{
                              color: "#333",
                              fontSize: "0.85rem",
                              marginTop: "2px",
                              fontWeight: "600",
                            }}
                          >
                            Client: {clientInfo.clientId} -{" "}
                            {clientInfo.clientName}
                          </Typography>
                        )}
                    </Box>
                  </li>
                );
              }}
              disabled={!!currentSchedule}
              sx={{
                "& .MuiAutocomplete-tag": {
                  maxWidth: "400px",
                },
              }}
            />
          </FormControl>
          <FormControl fullWidth margin="normal" size="small" required>
            <Autocomplete
              id="subject-autocomplete"
              options={
                formData.students && formData.students.length > 0
                  ? students.find((s) => s._id === formData.students[0])
                      ?.subjects || []
                  : []
              }
              getOptionLabel={(option) => option.name || ""}
              value={
                formData.subject
                  ? students
                      .find((student) => student._id === formData.students[0])
                      ?.subjects.find(
                        (subject) => subject._id === formData.subject
                      ) || null
                  : null
              }
              onChange={(event, newValue) => {
                handleChange({
                  target: {
                    name: "subject",
                    value: newValue ? newValue._id : "",
                  },
                });
              }}
              renderInput={(params) => (
                <TextField {...params} label="Subject" required size="small" />
              )}
              disabled={!(formData.students && formData.students.length > 0)}
            />
          </FormControl>

          <FormControl fullWidth margin="normal" size="small" required>
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
                  size="small"
                />
              )}
              renderOption={(props, option) => {
                const { key, ...restProps } = props;
                return (
                  <li key={key} {...restProps}>
                    {getTeacherDisplayName(option)}
                    <span
                      style={{
                        marginLeft: "8px",
                        color: "#22c55e",
                        fontSize: "0.75rem",
                        fontWeight: "500",
                      }}
                    >
                      ✓ Active
                    </span>
                  </li>
                );
              }}
              disabled={!formData.subject}
              noOptionsText={
                !formData.subject
                  ? "Please select a subject first"
                  : "No active teachers found for this subject"
              }
            />
          </FormControl>
          {formData.teacher && (
            <Box sx={{ mt: 2, mb: 2 }}>
              {loadingAvailability ? (
                <Box
                  sx={{
                    p: 2,
                    bgcolor: "#f8fafc",
                    borderRadius: 1,
                    border: "1px solid #e2e8f0",
                  }}
                >
                  <Typography
                    variant="subtitle2"
                    sx={{
                      mb: 2,
                      color: "#475569",
                      fontWeight: 600,
                    }}
                  >
                    📅 Teacher Availability (Mon to Fri):
                  </Typography>

                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 1,
                      mb: 2,
                    }}
                  >
                    <CircularProgress size={16} sx={{ color: "#6b7280" }} />
                    <Typography
                      variant="body2"
                      sx={{ color: "#6b7280", fontSize: "0.75rem" }}
                    >
                      Analyzing teacher's schedule...
                    </Typography>
                  </Box>

                  {[1, 2, 3, 4].map((dayIndex) => (
                    <Box key={dayIndex} sx={{ mb: 2 }}>
                      <Box
                        sx={{
                          height: 14,
                          bgcolor: "#cbd5e1",
                          borderRadius: 1,
                          mb: 1,
                          width: `${50 + dayIndex * 8}%`,
                          maxWidth: "200px",
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
                              width: 8,
                              height: 8,
                              borderRadius: "50%",
                              bgcolor: "#86efac",
                              flexShrink: 0,
                            }}
                          />
                          <Box
                            sx={{
                              height: 8,
                              bgcolor: "#d1d5db",
                              borderRadius: 1,
                              width: `${60 + dayIndex * 10}%`,
                              maxWidth: "300px",
                              animation: "pulse 1.5s ease-in-out infinite",
                              animationDelay: `${dayIndex * 0.1 + 0.2}s`,
                            }}
                          />
                        </Box>
                      </Box>
                      {dayIndex % 2 === 0 && (
                        <Box sx={{ pl: 1 }}>
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              gap: 1,
                            }}
                          >
                            <Box
                              sx={{
                                width: 8,
                                height: 8,
                                borderRadius: "50%",
                                bgcolor: "#fca5a5",
                                flexShrink: 0,
                              }}
                            />
                            <Box
                              sx={{
                                height: 8,
                                bgcolor: "#d1d5db",
                                borderRadius: 1,
                                width: `${40 + dayIndex * 5}%`,
                                maxWidth: "250px",
                                animation: "pulse 1.5s ease-in-out infinite",
                                animationDelay: `${dayIndex * 0.1 + 0.4}s`,
                              }}
                            />
                          </Box>
                        </Box>
                      )}
                    </Box>
                  ))}
                </Box>
              ) : teacherAvailability &&
                (teacherAvailability.freeSlots ||
                  teacherAvailability.reservedSlots) ? (
                <Box
                  sx={{
                    p: 2,
                    bgcolor: "#f8fafc",
                    borderRadius: 1,
                    border: "1px solid #e2e8f0",
                  }}
                >
                  <Typography
                    variant="subtitle2"
                    sx={{
                      mb: 2,
                      color: "#475569",
                      fontWeight: 600,
                    }}
                  >
                    📅 Teacher Availability (Mon to Fri):
                  </Typography>

                  <Box
                    sx={{
                      mb: 2,
                      display: "flex",
                      gap: 2,
                      flexWrap: "wrap",
                      justifyContent: "center",
                    }}
                  >
                    <Box
                      sx={{ display: "flex", alignItems: "center", gap: 0.5 }}
                    >
                      <Box
                        sx={{
                          width: 12,
                          height: 12,
                          borderRadius: "50%",
                          bgcolor: "#22c55e",
                        }}
                      />
                      <Typography
                        sx={{ fontSize: "0.65rem", color: "#374151" }}
                      >
                        Free
                      </Typography>
                    </Box>
                    <Box
                      sx={{ display: "flex", alignItems: "center", gap: 0.5 }}
                    >
                      <Box
                        sx={{
                          width: 12,
                          height: 12,
                          borderRadius: "50%",
                          bgcolor: "#ef4444",
                        }}
                      />
                      <Typography
                        sx={{ fontSize: "0.65rem", color: "#374151" }}
                      >
                        Reserved
                      </Typography>
                    </Box>
                    <Box
                      sx={{ display: "flex", alignItems: "center", gap: 0.5 }}
                    >
                      <Box
                        sx={{
                          width: 12,
                          height: 12,
                          borderRadius: "50%",
                          bgcolor: "#9ca3af",
                        }}
                      />
                      <Typography
                        sx={{ fontSize: "0.65rem", color: "#374151" }}
                      >
                        Unavailable
                      </Typography>
                    </Box>
                  </Box>

                  {/* Time Grid */}
                  <Box sx={{ display: "flex", gap: 3 }}>
                    {/* Morning Column */}
                    <Box sx={{ flex: 1 }}>
                      <Typography
                        sx={{
                          fontSize: "0.7rem",
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
                              gap: 1,
                              mb: 0.3,
                              minHeight: "20px",
                            }}
                          >
                            <Typography
                              sx={{
                                fontSize: "0.65rem",
                                minWidth: "80px",
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
                                width: 8,
                                height: 8,
                                borderRadius: "50%",
                                bgcolor: dotColor,
                                flexShrink: 0,
                              }}
                            />

                            <Box sx={{ minWidth: "45px", textAlign: "left" }}>
                              {label && (
                                <Typography
                                  sx={{
                                    fontSize: "0.55rem",
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
                                    px: 0.5,
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
                          fontSize: "0.7rem",
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
                              gap: 1,
                              mb: 0.3,
                              minHeight: "20px",
                            }}
                          >
                            <Typography
                              sx={{
                                fontSize: "0.65rem",
                                minWidth: "80px",
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
                                width: 8,
                                height: 8,
                                borderRadius: "50%",
                                bgcolor: dotColor,
                                flexShrink: 0,
                              }}
                            />

                            <Box sx={{ minWidth: "45px", textAlign: "left" }}>
                              {label && (
                                <Typography
                                  sx={{
                                    fontSize: "0.55rem",
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
                                    px: 0.5,
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
                      mt: 2,
                      pt: 1,
                      borderTop: "1px solid #e2e8f0",
                      display: "flex",
                      gap: 2,
                      flexWrap: "wrap",
                      justifyContent: "center",
                    }}
                  >
                    <Typography
                      variant="caption"
                      sx={{
                        color: "#059669",
                        fontSize: "0.65rem",
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
                        fontSize: "0.65rem",
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
                        fontSize: "0.65rem",
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
          <FormControl fullWidth margin="normal" size="small" required>
            <InputLabel>Day</InputLabel>
            <Select
              name="day"
              value={formData.day}
              label="Day"
              onChange={handleChange}
            >
              {DAYS.map((day) => (
                <MenuItem key={day} value={day}>
                  {day}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <Box sx={{ display: "flex", gap: 2, mb: 2 }}>
            <TextField
              label="Start Time"
              name="startTime"
              type="time"
              value={formData.startTime}
              onChange={handleChange}
              required
              fullWidth
              size="small"
              InputLabelProps={{ shrink: true }}
              inputProps={{ step: 300 }}
              sx={{ mt: 2 }}
            />

            <TextField
              label="End Time"
              name="endTime"
              type="time"
              value={formData.endTime}
              onChange={handleChange}
              required
              fullWidth
              size="small"
              InputLabelProps={{ shrink: true }}
              inputProps={{ step: 300 }}
              sx={{ mt: 2 }}
            />
          </Box>
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
                  size: "small",
                  required: true,
                  sx: { mt: 2 },
                },
              }}
              minDate={new Date()}
            />
          </LocalizationProvider>
          <FormControl fullWidth margin="normal" size="small">
            <InputLabel>Recurring Schedule</InputLabel>
            <Select
              name="isRecurring"
              value={formData.isRecurring}
              label="Recurring Schedule"
              onChange={handleChange}
            >
              <MenuItem value={true}>Yes</MenuItem>
              <MenuItem value={false}>No</MenuItem>
            </Select>
          </FormControl>
          <FormControl fullWidth margin="normal" size="small">
            <InputLabel>Recurrence Pattern</InputLabel>
            <Select
              name="recurrencePattern"
              value={formData.recurrencePattern}
              label="Recurrence Pattern"
              onChange={handleChange}
              disabled={!formData.isRecurring}
            >
              <MenuItem value={RECURRENCE_PATTERNS.WEEKDAYS}>
                Weekdays (Mon-Fri)
              </MenuItem>

              <MenuItem value={RECURRENCE_PATTERNS.CUSTOM}>
                Custom Days
              </MenuItem>
            </Select>
          </FormControl>
          {formData.isRecurring && formData.recurrencePattern === "custom" && (
            <FormControl fullWidth margin="normal" size="small" required>
              <InputLabel>Select Days</InputLabel>
              <Select
                multiple
                name="customDays"
                value={
                  Array.isArray(formData.customDays) ? formData.customDays : []
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
                      <Chip key={day} label={day} size="small" />
                    ))}
                  </Box>
                )}
              >
                {DAYS.map((day) => (
                  <MenuItem key={day} value={day}>
                    {day}
                  </MenuItem>
                ))}
              </Select>
              <Typography
                variant="caption"
                sx={{
                  mt: 1,
                  color: "text.secondary",
                  fontSize: "0.75rem",
                }}
              >
                Next schedule will be created on the next selected day after
                attendance is marked
              </Typography>
            </FormControl>
          )}
          {currentSchedule && (
            <FormControl fullWidth margin="normal" size="small" required>
              <InputLabel>Reschedule Type</InputLabel>
              <Select
                name="rescheduleType"
                value={formData.rescheduleType}
                label="Reschedule Type"
                onChange={handleChange}
              >
                <MenuItem value="temporary">Temporary</MenuItem>
                <MenuItem value="permanent">Permanent</MenuItem>
              </Select>
            </FormControl>
          )}
          <Box
            sx={{
              mt: 3,
              display: "flex",
              justifyContent: "flex-end",
              gap: 2,
            }}
          >
            <button
              className="clear-filters-btn"
              onClick={() => setShowModal(false)}
              disabled={isLoading}
            >
              Cancel
            </button>
            <button className="add-btn" type="submit" disabled={isLoading}>
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
const SupervisorScheduleClass = () => {
  const [schedules, setSchedules] = useState([]);
  const [filteredSchedules, setFilteredSchedules] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [currentSchedule, setCurrentSchedule] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [dateRange, setDateRange] = useState([null, null]);
  const [students, setStudents] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [assignedTeachers, setAssignedTeachers] = useState({});
  const [allSubjects, setAllSubjects] = useState([]);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState(null);
  const [timeRange, setTimeRange] = useState({ start: "", end: "" });
  const [selectedSubjectFilter, setSelectedSubjectFilter] = useState("all");
  const [selectedStudentFilter, setSelectedStudentFilter] = useState("all");
  const [showActiveTeacherSchedules, setShowActiveTeacherSchedules] =
    useState(false);
  const [showInactiveTeacherSchedules, setShowInactiveTeacherSchedules] =
    useState(false);
  const [showActiveStudentSchedules, setShowActiveStudentSchedules] =
    useState(false);
  const [showInactiveStudentSchedules, setShowInactiveStudentSchedules] =
    useState(false);
  const [isLoadingSchedules, setIsLoadingSchedules] = useState(true);
  const { notification, showNotification, closeNotification } =
    useNotification();
  const BASE_URL = import.meta.env.VITE_BASE_URL;

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
    rescheduleType: "temporary",
  });
  const convertTo12Hour = (time) => {
    if (!time) return "";
    const [hours, minutes] = time.split(":");
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? "PM" : "AM";
    const hour12 = hour % 12 || 12;
    return `${hour12.toString().padStart(2, "0")}:${minutes} ${ampm}`;
  };

  useEffect(() => {
    const token = localStorage.getItem("token");
    const role = localStorage.getItem("role");

    if (!token || !role) {
      showNotification("Authentication required", "error");
      return;
    }

    axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      await Promise.all([
        fetchStudents(),
        fetchTeachers(),
        fetchSchedules(),
        fetchSubjects(),
      ]);
    } catch (error) {
      console.error("Error fetching initial data:", error);
      showNotification("Error fetching data", "error");
    }
  };

  const fetchSubjects = async () => {
    try {
      const response = await axios.get(
        `${BASE_URL}/api/subjects/supervisor/view`
      );
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
  const fetchStudents = async () => {
    try {
      const role = localStorage.getItem("role");
      let endpoint = "";

      if (role === "supervisor_quran") {
        endpoint = `${BASE_URL}/api/supervisors/students/quran`;
      } else if (role === "supervisor_subjects") {
        endpoint = `${BASE_URL}/api/supervisors/students/subjects`;
      } else {
        throw new Error("Invalid supervisor role");
      }

      const response = await axios.get(endpoint);

      if (response.data && Array.isArray(response.data.users)) {
        const studentsWithAssignedTeachers = response.data.users.map(
          (student) => ({
            _id: student._id,
            name: student.name,
            profile: student.profile,
            assignedTeachers: student.profile?.assignedTeachers || [],
            subjects: student.profile?.subjectsDetails || [],
            studentId: student.profile?.studentId,
          })
        );

        setStudents(studentsWithAssignedTeachers);
      }
    } catch (error) {
      showNotification(
        error.response?.data?.message || "Error fetching students",
        "error"
      );
    }
  };

  const fetchTeachers = async () => {
    try {
      const role = localStorage.getItem("role");
      const endpoint =
        role === "supervisor_quran"
          ? `${BASE_URL}/api/supervisors/quran-teachers`
          : `${BASE_URL}/api/supervisors/subject-teachers`;

      const response = await axios.get(endpoint);
      if (response.data && Array.isArray(response.data.users)) {
        const activeTeachers = response.data.users.filter(
          (teacher) => teacher.isActive === true
        );

        setTeachers(
          activeTeachers.map((teacher) => ({
            _id: teacher._id,
            name: teacher.name,
            staffId: teacher.staffId,
            subjects: teacher.profile?.subjects || [],
            availability: teacher.profile?.availability || {},
            isActive: teacher.isActive,
          }))
        );
      }
    } catch (error) {
      showNotification(
        error.response?.data?.message || "Error fetching active teachers",
        "error"
      );
    }
  };
  const fetchSchedules = async (showSuccessMessage = false) => {
    setIsSyncing(true);
    setIsLoadingSchedules(true);
    try {
      const response = await axios.get(`${BASE_URL}/api/schedules/list`);
      setSchedules(response.data.schedules);
      setFilteredSchedules(response.data.schedules);
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

  const groupStudentsByClient = (schedule) => {
    const clientGroups = {};

    schedule.studentAttendances?.forEach((attendance, index) => {
      const clientKey =
        attendance.clientId?.customId ||
        attendance.clientId ||
        `client-${index}`;

      if (!clientGroups[clientKey]) {
        clientGroups[clientKey] = {
          clientName: attendance.clientName,
          clientId: attendance.clientId,
          clientIsActive: attendance.clientIsActive,
          students: [],
          attendances: [],
        };
      }

      clientGroups[clientKey].students.push({
        name: schedule.studentNames[index],
        studentIsActive: attendance.studentIsActive,
        attendance: attendance,
        clientname: attendance.clientname || null,
      });
      clientGroups[clientKey].attendances.push(attendance);
    });

    return Object.values(clientGroups);
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
  const formatTableDate = (dateString) => {
    try {
      if (!dateString) return "";
      const date = new Date(dateString);
      return format(date, "dd/MM/yyyy");
    } catch (error) {
      console.error("Error formatting date:", error);
      return dateString;
    }
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
  const handleEditSubmit = async (e) => {
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
      };

      await axios.put(
        `${BASE_URL}/api/schedules/update/${currentSchedule._id}`,
        payload
      );

      showNotification("Schedule updated successfully");
      fetchSchedules();
      setShowModal(false);
      setCurrentSchedule(null);
    } catch (error) {
      showNotification(
        error.response?.data?.message || "Error updating schedule",
        "error"
      );
    } finally {
      setIsLoading(false);
    }
  };
  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      if (
        formData.recurrencePattern === "custom" &&
        (!Array.isArray(formData.customDays) ||
          formData.customDays.length === 0)
      ) {
        showNotification(
          "Please select at least one day for custom pattern",
          "error"
        );
        return;
      }
      const payload = {
        students: formData.students,
        teacher: formData.teacher,
        subject: formData.subject,
        day: formData.day,
        startTime: formData.startTime,
        endTime: formData.endTime,
        classDate: formData.classDate
          ? format(new Date(formData.classDate), "yyyy-MM-dd'T'HH:mm:ss.SSSxxx")
          : null,
        isRecurring: formData.isRecurring,
        recurrencePattern: formData.isRecurring
          ? formData.recurrencePattern
          : undefined,
        customDays:
          formData.recurrencePattern === "custom"
            ? Array.isArray(formData.customDays)
              ? formData.customDays
              : []
            : undefined,
        ...(currentSchedule ? { rescheduleType: formData.rescheduleType } : {}),
      };

      if (formData.isRecurring) {
        if (formData.recurrencePattern === "weekdays") {
          const selectedDate = new Date(formData.classDate);
          const dayOfWeek = selectedDate.getDay();

          if (dayOfWeek === 0 || dayOfWeek === 6) {
            showNotification(
              "Weekday schedules cannot start on weekends. Please select a weekday.",
              "error"
            );
            return;
          }
        }
      }
      if (currentSchedule) {
        await axios.put(
          `${BASE_URL}/api/schedules/update/${currentSchedule._id}`,
          payload
        );
        showNotification("Schedule updated successfully");
      } else {
        await axios.post(`${BASE_URL}/api/schedules/create`, payload);

        const message = formData.isRecurring
          ? `Schedule created successfully. Next schedule will be created automatically after attendance marking ${
              formData.recurrencePattern === "weekdays"
                ? "(Monday-Friday)"
                : "(Custom Days)"
            }`
          : "Schedule created successfully";

        showNotification(message);
      }

      fetchSchedules();
      setShowModal(false);
      setCurrentSchedule(null);
    } catch (error) {
      showNotification(
        error.response?.data?.message ||
          `Error ${currentSchedule ? "updating" : "creating"} schedule`,
        "error"
      );
    }
  };
  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === "students") {
      const selectedStudent = students.find((s) => s._id === value[0]);
      const selectedSubject = selectedStudent?.subjects[0];
      const assignedTeacher = selectedStudent?.assignedTeachers.find(
        (at) => at.subject._id === selectedSubject?._id
      );

      const teacherIsActive = teachers.find(
        (t) => t._id === assignedTeacher?.teacher._id && t.isActive !== false
      );

      setFormData((prev) => ({
        ...prev,
        students: value,
        subject: selectedSubject?._id || "",
        teacher: teacherIsActive ? assignedTeacher?.teacher._id || "" : "",
      }));

      if (assignedTeacher && !teacherIsActive) {
        showNotification(
          "The assigned teacher for this subject is currently inactive. Please select another teacher.",
          "warning"
        );
      }
    } else if (name === "subject") {
      const selectedStudent = students.find(
        (s) => s._id === formData.students[0]
      );
      const assignedTeacher = selectedStudent?.assignedTeachers.find(
        (at) => at.subject._id === value
      );

      const teacherIsActive = teachers.find(
        (t) => t._id === assignedTeacher?.teacher._id && t.isActive !== false
      );

      setFormData((prev) => ({
        ...prev,
        [name]: value,
        teacher: teacherIsActive ? assignedTeacher?.teacher._id || "" : "",
      }));

      if (assignedTeacher && !teacherIsActive) {
        showNotification(
          "The assigned teacher for this subject is currently inactive. Please select another teacher.",
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
      filtered = filtered.filter(
        (schedule) =>
          schedule.teacherName
            .toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          schedule.subjectName
            .toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          schedule.studentNames.some((name) =>
            name.toLowerCase().includes(searchTerm.toLowerCase())
          ) ||
          schedule.studentAttendances?.some((attendance) =>
            attendance.clientName
              ?.toLowerCase()
              .includes(searchTerm.toLowerCase())
          ) ||
          schedule.studentAttendances?.some((attendance) =>
            attendance.clientId?.customId
              ?.toLowerCase()
              .includes(searchTerm.toLowerCase())
          ) ||
          schedule.studentAttendances?.some(
            (attendance) =>
              typeof attendance.clientId === "string" &&
              attendance.clientId
                .toLowerCase()
                .includes(searchTerm.toLowerCase())
          )
      );
    }

    if (selectedStatus !== "all") {
      filtered = filtered.filter(
        (schedule) => schedule.sessionStatus === selectedStatus
      );
    }

    if (selectedSubjectFilter !== "all") {
      filtered = filtered.filter(
        (schedule) => schedule.subject === selectedSubjectFilter
      );
    }

    if (selectedStudentFilter !== "all") {
      filtered = filtered.filter((schedule) =>
        schedule.students.includes(selectedStudentFilter)
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
    selectedStudentFilter,
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
          <h2>Class Schedule Management</h2>
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
            className="add-btn"
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
            <FaPlus /> Add Schedule
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
            placeholder="Search by teacher, client, subject or student..."
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
              width: "200px",
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
            className="student-select"
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            sx={{
              width: "200px",
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
          <FaFilter className="filter-icon" />
          <Select
            className="student-select"
            value={selectedStudentFilter}
            onChange={(e) => setSelectedStudentFilter(e.target.value)}
            sx={{
              width: "200px",
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
            {students.map((student) => (
              <MenuItem key={student._id} value={student._id}>
                {`${student?.profile?.studentId || ""} - ${student.name}`}
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
            customInput={
              <div className="date-input-wrapper">
                <FaFilter className="filter-icon" />
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
                />
              </div>
            }
          />
        </div>
        <div className="filter-box">
          <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
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
                width: "130px",
              }}
            />
            <span style={{ color: "#64748b" }}>to</span>
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
                width: "130px",
              }}
            />
          </div>
        </div>
        <button
          className="clear-filters-btn"
          onClick={() => {
            setSelectedStatus("all");
            setSelectedSubjectFilter("all");
            setSelectedStudentFilter("all");
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
                <th>Slot</th>
                {/* <th>Status</th> */}
                <th>Session Status</th>
                <th>Attendance</th>
                <th>Timing Details</th>
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
                                {group.students[0].name
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

                          <div
                            style={{
                              color: "#475569",
                              fontSize: "0.8rem",
                              marginTop: "4px",
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
                            {typeof group.clientId === "object" &&
                            group.clientId?.customId
                              ? group.clientId.customId
                              : group.clientId}
                          </div>

                          <div style={{ marginTop: "6px" }}>
                            {(() => {
                              const hasInactiveStudent = group.students.some(
                                (student) => student.studentIsActive === false
                              );
                              const hasInactiveClient =
                                group.clientIsActive === false;

                              if (hasInactiveStudent && hasInactiveClient) {
                                return (
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
                                );
                              } else if (hasInactiveStudent) {
                                return (
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
                                    Inactive Student
                                  </span>
                                );
                              } else if (hasInactiveClient) {
                                return (
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
                                    Inactive Client
                                  </span>
                                );
                              }
                              return null;
                            })()}
                          </div>
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
                  <td>
                    <div style={{ fontWeight: "500" }}>{schedule.day}</div>
                    <span style={{ color: "#64748b", fontSize: "0.8125rem" }}>
                      {convertTo12Hour(schedule.startTime)} <br />
                      {convertTo12Hour(schedule.endTime)}
                    </span>
                    <div style={{ color: "#64748b", fontSize: "0.8125rem" }}>
                      {formatTableDate(schedule.classDate)}{" "}
                    </div>
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
                  </td>
                  <td>
                    {schedule.studentAttendances?.map((attendance, index) => (
                      <div
                        key={index}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                          marginBottom:
                            index !== schedule.studentAttendances.length - 1
                              ? "4px"
                              : 0,
                        }}
                      >
                        <span
                          style={{
                            display: "inline-block",
                            padding: "4px 10px",
                            fontSize: "0.75rem",
                            fontWeight: 500,
                            borderRadius: "5px",
                            textTransform: "capitalize",
                            color:
                              attendance.status === "present"
                                ? "#15803d"
                                : attendance.status === "leave"
                                ? "#b45309"
                                : attendance.status === "late"
                                ? "#be123c"
                                : attendance.status === "pending"
                                ? "#92400e"
                                : attendance.status === "absent"
                                ? "#991b1b"
                                : "#374151",

                            backgroundColor:
                              attendance.status === "present"
                                ? "#dcfce7"
                                : attendance.status === "leave"
                                ? "#fef3c7"
                                : attendance.status === "late"
                                ? "#fce7f3"
                                : attendance.status === "pending"
                                ? "#fde68a"
                                : attendance.status === "absent"
                                ? "#fee2e2"
                                : "#f3f4f6",
                          }}
                        >
                          {attendance.status}
                        </span>
                      </div>
                    ))}
                    {(!schedule.studentAttendances ||
                      schedule.studentAttendances.length === 0) && (
                      <span className="status-tag pending">pending</span>
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
                          <Tooltip
                            title={`Class started ${schedule.startDelay} minutes late`}
                          >
                            <div
                              style={{ color: "#ef4444", fontSize: "0.75rem" }}
                            >
                              {schedule.startDelay}m late
                            </div>
                          </Tooltip>
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
      />

      <Modal
        open={showViewModal}
        onClose={() => setShowViewModal(false)}
        aria-labelledby="view-schedule-modal"
      >
        <ViewScheduleModal
          schedule={selectedSchedule}
          setShowModal={setShowViewModal}
          modalStyle={modalStyle}
          convertTo12Hour={convertTo12Hour}
        />
      </Modal>
      <NotificationSnackbar
        notification={notification}
        onClose={closeNotification}
      />
    </div>
  );
};

export default SupervisorScheduleClass;
