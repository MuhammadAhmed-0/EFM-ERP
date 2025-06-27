import React from "react";
import { Box, Button, Typography, Chip } from "@mui/material";
import { format } from "date-fns";
import {
  FaBook,
  FaChalkboardTeacher,
  FaUser,
  FaCalendarAlt,
  FaClock,
  FaTasks,
  FaCheckCircle,
  FaCircle,
  FaHistory,
  FaRecycle,
  FaRegClock,
  FaUserClock,
  FaRegCalendarCheck,
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

const formatDate = (dateString) => {
  if (!dateString) return "Not available";
  const date = new Date(dateString);
  return format(date, "dd/MM/yyyy hh:mm a");
};

const convertTo12Hour = (time) => {
  if (!time) return "";
  const [hours, minutes] = time.split(":");
  const hour = parseInt(hours);
  const ampm = hour >= 12 ? "PM" : "AM";
  const hour12 = hour % 12 || 12;
  return `${hour12.toString().padStart(2, "0")}:${minutes} ${ampm}`;
};

const TimingDetail = ({ label, value, type }) => {
  const getTimingStatusColor = (type) => {
    switch (type) {
      case "late":
        return "#ef4444";
      case "early":
        return "#f97316";
      case "onTime":
        return "#22c55e";
      default:
        return "#64748b";
    }
  };

  return (
    <Box sx={{ mb: 1 }}>
      <Typography
        variant="body2"
        sx={{
          color: getTimingStatusColor(type),
          fontWeight: 500,
          display: "flex",
          alignItems: "center",
          gap: 1,
        }}
      >
        <FaClock size={12} />
        {label}: {value}
      </Typography>
    </Box>
  );
};

const InfoRow = ({ label, value, icon: Icon }) => (
  <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1.5, mb: 2 }}>
    {Icon && <Icon size={16} style={{ color: "#64748b", marginTop: "4px" }} />}
    <Box>
      <Typography variant="body2" sx={{ color: "#64748b", mb: 0.5 }}>
        {label}
      </Typography>
      <Typography sx={typographyStyles}>
        {value === true
          ? "Yes"
          : value === false
          ? "No"
          : value || "Not provided"}
      </Typography>
    </Box>
  </Box>
);

const InfoGrid = ({ label1, value1, icon1, label2, value2, icon2 }) => (
  <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}>
    <Box sx={{ width: "48%" }}>
      {label1.toLowerCase().includes("status") ? (
        <Box>
          <Typography variant="body2" sx={{ color: "#64748b", mb: 0.5 }}>
            {label1}
          </Typography>
          <Box
            component="span"
            sx={{
              padding: "4px 8px",
              borderRadius: "4px",
              fontSize: "0.875rem",
              fontWeight: 500,
              backgroundColor:
                value1 === "scheduled"
                  ? "#e3f2fd"
                  : value1 === "completed"
                  ? "#dcfce7"
                  : value1 === "cancelled"
                  ? "#fee2e2"
                  : value1 === "rescheduled"
                  ? "#f3e8ff"
                  : value1 === "pending"
                  ? "#fff3e0"
                  : "#f1f5f9",
              color:
                value1 === "scheduled"
                  ? "#1565c0"
                  : value1 === "completed"
                  ? "#166534"
                  : value1 === "cancelled"
                  ? "#991b1b"
                  : value1 === "rescheduled"
                  ? "#6b21a8"
                  : value1 === "pending"
                  ? "#ef6c00"
                  : "#64748b",
              textTransform: "capitalize",
            }}
          >
            {value1?.replace("_", " ")}
          </Box>
        </Box>
      ) : (
        <InfoRow label={label1} value={value1} icon={icon1} />
      )}
    </Box>
    <Box sx={{ width: "48%" }}>
      {label2?.toLowerCase().includes("status") ? (
        <Box>
          <Typography variant="body2" sx={{ color: "#64748b", mb: 0.5 }}>
            {label2}
          </Typography>
          <Box
            component="span"
            sx={{
              padding: "4px 8px",
              borderRadius: "4px",
              fontSize: "0.875rem",
              fontWeight: 500,
              backgroundColor:
                value2 === "scheduled"
                  ? "#e3f2fd"
                  : value2 === "completed"
                  ? "#dcfce7"
                  : value2 === "cancelled"
                  ? "#fee2e2"
                  : value2 === "rescheduled"
                  ? "#f3e8ff"
                  : value2 === "pending"
                  ? "#fff3e0"
                  : "#f1f5f9",
              color:
                value2 === "scheduled"
                  ? "#1565c0"
                  : value2 === "completed"
                  ? "#166534"
                  : value2 === "cancelled"
                  ? "#991b1b"
                  : value2 === "rescheduled"
                  ? "#6b21a8"
                  : value2 === "pending"
                  ? "#ef6c00"
                  : "#64748b",
              textTransform: "capitalize",
            }}
          >
            {value2?.replace("_", " ")}
          </Box>
        </Box>
      ) : (
        label2 && <InfoRow label={label2} value={value2} icon={icon2} />
      )}
    </Box>
  </Box>
);

const LessonCard = ({ lesson }) => (
  <Box
    sx={{
      p: 2,
      border: "1px solid #e2e8f0",
      borderRadius: "8px",
      mb: 2,
      bgcolor: "#fff",
    }}
  >
    <Typography variant="subtitle2" sx={{ ...sectionHeaderStyles, mb: 1 }}>
      {lesson.title}
    </Typography>
    <Typography
      variant="body2"
      sx={{ color: "#64748b", mb: 2, fontWeight: 500 }}
    >
      {lesson.description}
    </Typography>
    <Box
      sx={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
      }}
    >
      <Typography variant="body2" sx={{ color: "#64748b" }}>
        Added: {format(new Date(lesson.addedAt), "dd/MM/yyyy hh:mm a")}
      </Typography>
    </Box>
    {lesson.remarks && (
      <Typography
        variant="body2"
        sx={{ color: "#64748b", mt: 1, fontStyle: "italic" }}
      >
        Remarks: {lesson.remarks}
      </Typography>
    )}
  </Box>
);

const ClientViewScheduleModal = ({ schedule, setShowModal, modalStyle }) => {
  const currentTime = new Date("2025-05-21T07:40:46Z");

  const formatTimeAgo = (date) => {
    if (!date) return "";
    const diff = currentTime - new Date(date);
    const minutes = Math.floor(diff / 60000);

    if (minutes < 1) return "just now";
    if (minutes < 60) return `${minutes} minutes ago`;

    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} hours ago`;

    const days = Math.floor(hours / 24);
    return `${days} days ago`;
  };

  return (
    <Box sx={[{ ...modalStyle, maxHeight: "90vh", width: "800px" }]}>
      {/* Header */}
      <Box sx={{ borderBottom: "1px solid #e2e8f0", pb: 2 }}>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
          }}
        >
          <Box>
            <Typography
              variant="h5"
              sx={{ ...typographyStyles, fontWeight: 600 }}
            >
              Class Schedule Details
            </Typography>
            <Typography variant="body2" sx={{ color: "#64748b", mt: 0.5 }}>
              {format(currentTime, "EEEE, MMMM d, yyyy")} at{" "}
              {format(currentTime, "hh:mm a")}
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
              "&:hover": { bgcolor: "#f1f5f9" },
            }}
          >
            ×
          </Button>
        </Box>
      </Box>

      <Box sx={scrollableContentStyles}>
        {/* Basic Information */}
        <Typography variant="subtitle1" sx={sectionHeaderStyles}>
          Class Information
        </Typography>
        <Box sx={sectionCardStyles}>
          <InfoGrid
            label1="Subject"
            value1={schedule.subjectName}
            icon1={FaBook}
            label2="Subject Type"
            value2={
              schedule.subjectType.charAt(0).toUpperCase() +
              schedule.subjectType.slice(1)
            }
            icon2={FaBook}
          />

          <InfoGrid
            label1="Teacher"
            value1={schedule.teacherName}
            icon1={FaChalkboardTeacher}
            label2="Day"
            value2={schedule.day}
            icon2={FaCalendarAlt}
          />
          <InfoGrid
            label1="Student"
            value1={schedule.studentNames.map((s) => s.name).join(", ")}
            icon1={FaUser}
            label2="Time"
            value2={`${convertTo12Hour(schedule.startTime)} - ${convertTo12Hour(
              schedule.endTime
            )}`}
            icon2={FaClock}
          />
        </Box>

        {/* Status Information */}
        <Typography variant="subtitle1" sx={sectionHeaderStyles}>
          Status Information
        </Typography>
        <Box sx={sectionCardStyles}>
          <InfoGrid
            label1="Schedule Status"
            value1={schedule.status}
            icon1={FaCalendarAlt}
            label2="Session Status"
            value2={schedule.sessionStatus}
            icon2={FaTasks}
          />
        </Box>

        {/* Schedule Settings */}
        <Typography variant="subtitle1" sx={sectionHeaderStyles}>
          Schedule Settings
        </Typography>
        <Box sx={sectionCardStyles}>
          <InfoGrid
            label1="Recurring"
            value1={schedule.isRecurring}
            icon1={FaRecycle}
            label2="Pattern"
            value2={schedule.recurrencePattern}
            icon2={FaRegCalendarCheck}
          />
          {schedule.recurrencePattern === "custom" && schedule.customDays && (
            <InfoRow
              label="Custom Days"
              value={
                <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                  {schedule.customDays.map((day) => (
                    <Box
                      key={day}
                      component="span"
                      sx={{
                        padding: "4px 8px",
                        borderRadius: "4px",
                        fontSize: "0.875rem",
                        fontWeight: 500,
                        backgroundColor: "#e3f2fd",
                        color: "#1565c0",
                        textTransform: "capitalize",
                      }}
                    >
                      {day}
                    </Box>
                  ))}
                </Box>
              }
              icon={FaCalendarAlt}
            />
          )}
        </Box>

        {/* Session Timeline */}
        <Typography variant="subtitle1" sx={sectionHeaderStyles}>
          Session Timeline
        </Typography>
        <Box sx={sectionCardStyles}>
          <InfoGrid
            label1="Teacher Available At"
            value1={formatDate(schedule.teacherAvailableAt)}
            icon1={FaUserClock}
            label2="Class Started At"
            value2={formatDate(schedule.classStartedAt)}
            icon2={FaRegClock}
          />
          <InfoRow
            label="Class Ended At"
            value={formatDate(schedule.classEndedAt)}
            icon={FaHistory}
          />
        </Box>

        {/* Lessons */}
        <Typography variant="subtitle1" sx={sectionHeaderStyles}>
          Lessons
        </Typography>
          {schedule.lessons && schedule.lessons.length > 0 ? (
            schedule.lessons.map((lesson) => (
              <LessonCard key={lesson._id} lesson={lesson} />
            ))
          ) : (
            <Typography sx={{ color: "#64748b", fontStyle: "italic" }}>
              No lessons added yet
            </Typography>
          )}

        {/* Duration Information */}
        <Typography variant="subtitle1" sx={sectionHeaderStyles}>
          Duration Details
        </Typography>
        <Box sx={sectionCardStyles}>
          <InfoGrid
            label1="Scheduled Duration"
            value1={`${schedule.scheduledDuration} minutes`}
            icon1={FaClock}
            label2="Actual Duration"
            value2={`${schedule.actualDuration} minutes`}
            icon2={FaClock}
          />
          <InfoGrid
            label1="Start Delay"
            value1={
              schedule.startDelay > 0
                ? `${schedule.startDelay} minutes`
                : "No delay"
            }
            icon1={FaRegClock}
            label2="Early End"
            value2={
              schedule.earlyEnd > 0
                ? `${schedule.earlyEnd} minutes`
                : "No early end"
            }
            icon2={FaRegClock}
          />
        </Box>
      </Box>
    </Box>
  );
};

export default ClientViewScheduleModal;
