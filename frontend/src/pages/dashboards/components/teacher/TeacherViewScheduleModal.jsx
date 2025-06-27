import { Box, Typography, Button } from "@mui/material";
import {
  FaClock,
  FaUser,
  FaBook,
  FaCalendarAlt,
  FaChalkboardTeacher,
  FaHourglass,
  FaHistory,
  FaUserClock,
} from "react-icons/fa";
import { format } from "date-fns";
import { getModalStyles } from "../../../../styles/modal/commonModalStyles";

const POPPINS_FONT =
  "'Poppins', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";

const formatDate = (dateString) => {
  try {
    if (!dateString) return "Not available";
    if (typeof dateString === "string" && dateString.includes("-")) {
      if (dateString.match(/^\d{2}-\d{2}-\d{4}$/)) {
        const [day, month, year] = dateString.split("-");
        return `${day}/${month}/${year}`;
      }
    }
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "Not available";
    return format(date, "dd/MM/yyyy hh:mm a");
  } catch (error) {
    console.error("Error formatting date:", error);
    return "Not available";
  }
};

const convertTo12Hour = (time) => {
  if (!time) return "";
  try {
    const [hours, minutes] = time.split(":");
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? "PM" : "AM";
    const hour12 = hour % 12 || 12;
    return `${hour12.toString().padStart(2, "0")}:${minutes} ${ampm}`;
  } catch (error) {
    console.error("Error converting time:", error);
    return time;
  }
};

const typographyStyles = {
  fontFamily: POPPINS_FONT,
};

const textStyles = {
  ...typographyStyles,
  color: "#64748b",
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

const InfoRow = ({ label, value, icon: Icon }) => (
  <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1.5, mb: 2 }}>
    {Icon && <Icon size={16} style={{ color: "#64748b", marginTop: "4px" }} />}
    <Box>
      <Typography variant="body2" sx={{ ...textStyles, mb: 0.5 }}>
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
          <Typography variant="body2" sx={{ ...textStyles, mb: 0.5 }}>
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
                  : value1 === "pending"
                  ? "#fff3e0"
                  : value1 === "in_progress"
                  ? "#e8f5e9"
                  : value1 === "available"
                  ? "#e3f2fd"
                  : "#f1f5f9",
              color:
                value1 === "scheduled"
                  ? "#1565c0"
                  : value1 === "completed"
                  ? "#166534"
                  : value1 === "cancelled"
                  ? "#991b1b"
                  : value1 === "pending"
                  ? "#ef6c00"
                  : value1 === "in_progress"
                  ? "#2e7d32"
                  : value1 === "available"
                  ? "#1565c0"
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
          <Typography variant="body2" sx={{ ...textStyles, mb: 0.5 }}>
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
                  : value2 === "pending"
                  ? "#fff3e0"
                  : value2 === "in_progress"
                  ? "#e8f5e9"
                  : value2 === "available"
                  ? "#e3f2fd"
                  : "#f1f5f9",
              color:
                value2 === "scheduled"
                  ? "#1565c0"
                  : value2 === "completed"
                  ? "#166534"
                  : value2 === "cancelled"
                  ? "#991b1b"
                  : value2 === "pending"
                  ? "#ef6c00"
                  : value2 === "in_progress"
                  ? "#2e7d32"
                  : value2 === "available"
                  ? "#1565c0"
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

const TeacherViewScheduleModal = ({ schedule, setShowModal }) => {
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

  return (
    <Box sx={[getModalStyles(), { width: "800px" }]}>
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
            Schedule Details
          </Typography>
          <Typography variant="body2" sx={textStyles}>
            Class Date: {formatDate(schedule.classDate)}
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
            "&:hover": {
              bgcolor: "#f1f5f9",
            },
          }}
        >
          ×
        </Button>
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
            label2="Day"
            value2={schedule.day}
            icon2={FaCalendarAlt}
          />
          <InfoGrid
            label1="Time"
            value1={`${convertTo12Hour(schedule.startTime)} - ${convertTo12Hour(
              schedule.endTime
            )}`}
            icon1={FaClock}
            label2="Session Status"
            value2={schedule.sessionStatus}
            icon2={FaHourglass}
          />
          <InfoGrid
            label1="Schedule Status"
            value1={schedule.status}
            icon1={FaCalendarAlt}
          />
        </Box>

        {/* Student Details */}
        <Typography variant="subtitle1" sx={sectionHeaderStyles}>
          Student Information
        </Typography>
        <Box sx={sectionCardStyles}>
          {schedule.studentDetails.map((detail, index) => (
            <Box
              key={index}
              sx={{ mb: index !== schedule.studentDetails.length - 1 ? 3 : 0 }}
            >
              <InfoGrid
                label1="Student Name"
                value1={schedule.studentNames[index]}
                icon1={FaUser}
                label2="Student ID"
                value2={detail.studentId}
                icon2={null}
              />
              <InfoGrid
                label1="Client Name"
                value1={detail.clientName}
                icon1={FaChalkboardTeacher}
                label2="Client ID"
                value2={detail.clientId.customId}
                icon2={null}
              />
              {detail.attendance?.status &&
                detail.attendance.status !== "not_marked" && (
                  <InfoGrid
                    label1="Attendance Status"
                    value1={detail.attendance.status}
                    icon1={null}
                    label2="Marked At"
                    value2={formatDate(detail.attendance.markedAt)}
                    icon2={null}
                  />
                )}
            </Box>
          ))}
        </Box>

        {/* Session Timeline */}
        <Typography variant="subtitle1" sx={sectionHeaderStyles}>
          Session Timeline
        </Typography>
        <Box sx={sectionCardStyles}>
          <InfoGrid
            label1="Teacher Available At"
            value1={
              schedule.teacherAvailableAt
                ? formatDate(schedule.teacherAvailableAt)
                : "Not available"
            }
            icon1={FaUserClock}
            label2="Class Started At"
            value2={
              schedule.classStartedAt
                ? formatDate(schedule.classStartedAt)
                : "Not available"
            }
            icon2={FaClock}
          />
          <InfoRow
            label="Class Ended At"
            value={
              schedule.classEndedAt
                ? formatDate(schedule.classEndedAt)
                : "Not available"
            }
            icon={FaHistory}
          />
          <InfoGrid
            label1="Start Delay"
            value1={`${schedule.startDelay || 0} minutes`}
            icon1={FaClock}
            label2="Early End"
            value2={`${schedule.earlyEnd || 0} minutes`}
            icon2={FaClock}
          />
          <InfoRow
            label="Session Duration"
            value={`${schedule.sessionDurationMinutes || 0} minutes`}
            icon={FaClock}
          />
        </Box>
      </Box>
    </Box>
  );
};

export default TeacherViewScheduleModal;
