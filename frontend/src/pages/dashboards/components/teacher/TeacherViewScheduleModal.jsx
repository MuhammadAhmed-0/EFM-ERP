import {
  Box,
  Typography,
  Button,
  useTheme,
  useMediaQuery,
} from "@mui/material";
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

const InfoRow = ({ label, value, icon: Icon, isMobile, isSmallMobile }) => (
  <Box
    sx={{
      display: "flex",
      alignItems: "flex-start",
      gap: isMobile ? 1 : 1.5,
      mb: isMobile ? 1.5 : 2,
      flexDirection: isMobile ? "column" : "row",
    }}
  >
    {Icon && (
      <Icon
        size={isSmallMobile ? 12 : isMobile ? 14 : 16}
        style={{
          color: "#64748b",
          marginTop: isMobile ? "0px" : "4px",
          flexShrink: 0,
        }}
      />
    )}
    <Box sx={{ width: "100%" }}>
      <Typography
        variant="body2"
        sx={{
          fontFamily: POPPINS_FONT,
          color: "#64748b",
          mb: 0.5,
          fontSize: isSmallMobile
            ? "0.6875rem"
            : isMobile
            ? "0.75rem"
            : "0.875rem",
          fontWeight: 500,
        }}
      >
        {label}
      </Typography>
      <Typography
        sx={{
          fontFamily: POPPINS_FONT,
          fontSize: isSmallMobile
            ? "0.8125rem"
            : isMobile
            ? "0.875rem"
            : "1rem",
          wordBreak: "break-word",
          lineHeight: 1.4,
        }}
      >
        {value === true
          ? "Yes"
          : value === false
          ? "No"
          : value || "Not provided"}
      </Typography>
    </Box>
  </Box>
);

const InfoGrid = ({
  label1,
  value1,
  icon1,
  label2,
  value2,
  icon2,
  isMobile,
  isSmallMobile,
}) => {
  const renderStatusBadge = (value) => (
    <Box
      component="span"
      sx={{
        padding: isSmallMobile ? "2px 4px" : isMobile ? "3px 6px" : "4px 8px",
        borderRadius: "4px",
        fontSize: isSmallMobile
          ? "0.6875rem"
          : isMobile
          ? "0.75rem"
          : "0.875rem",
        fontWeight: 500,
        fontFamily: POPPINS_FONT,
        backgroundColor:
          value === "scheduled"
            ? "#e3f2fd"
            : value === "completed"
            ? "#dcfce7"
            : value === "cancelled"
            ? "#fee2e2"
            : value === "pending"
            ? "#fff3e0"
            : value === "in_progress"
            ? "#e8f5e9"
            : value === "available"
            ? "#e3f2fd"
            : "#f1f5f9",
        color:
          value === "scheduled"
            ? "#1565c0"
            : value === "completed"
            ? "#166534"
            : value === "cancelled"
            ? "#991b1b"
            : value === "pending"
            ? "#ef6c00"
            : value === "in_progress"
            ? "#2e7d32"
            : value === "available"
            ? "#1565c0"
            : "#64748b",
        textTransform: "capitalize",
        display: "inline-block",
        whiteSpace: "nowrap",
      }}
    >
      {value?.replace("_", " ")}
    </Box>
  );

  if (isMobile) {
    return (
      <Box sx={{ mb: 2 }}>
        {/* First item */}
        <Box sx={{ mb: label2 ? 2 : 0 }}>
          {label1.toLowerCase().includes("status") ? (
            <Box>
              <Typography
                variant="body2"
                sx={{
                  fontFamily: POPPINS_FONT,
                  color: "#64748b",
                  mb: 0.5,
                  fontSize: isSmallMobile ? "0.6875rem" : "0.75rem",
                  fontWeight: 500,
                }}
              >
                {label1}
              </Typography>
              {renderStatusBadge(value1)}
            </Box>
          ) : (
            <InfoRow
              label={label1}
              value={value1}
              icon={icon1}
              isMobile={isMobile}
              isSmallMobile={isSmallMobile}
            />
          )}
        </Box>

        {/* Second item */}
        {label2 && (
          <Box>
            {label2.toLowerCase().includes("status") ? (
              <Box>
                <Typography
                  variant="body2"
                  sx={{
                    fontFamily: POPPINS_FONT,
                    color: "#64748b",
                    mb: 0.5,
                    fontSize: isSmallMobile ? "0.6875rem" : "0.75rem",
                    fontWeight: 500,
                  }}
                >
                  {label2}
                </Typography>
                {renderStatusBadge(value2)}
              </Box>
            ) : (
              <InfoRow
                label={label2}
                value={value2}
                icon={icon2}
                isMobile={isMobile}
                isSmallMobile={isSmallMobile}
              />
            )}
          </Box>
        )}
      </Box>
    );
  }

  return (
    <Box
      sx={{ display: "flex", justifyContent: "space-between", mb: 2, gap: 2 }}
    >
      <Box sx={{ width: "48%" }}>
        {label1.toLowerCase().includes("status") ? (
          <Box>
            <Typography
              variant="body2"
              sx={{
                fontFamily: POPPINS_FONT,
                color: "#64748b",
                mb: 0.5,
                fontWeight: 500,
              }}
            >
              {label1}
            </Typography>
            {renderStatusBadge(value1)}
          </Box>
        ) : (
          <InfoRow
            label={label1}
            value={value1}
            icon={icon1}
            isMobile={isMobile}
            isSmallMobile={isSmallMobile}
          />
        )}
      </Box>
      <Box sx={{ width: "48%" }}>
        {label2?.toLowerCase().includes("status") ? (
          <Box>
            <Typography
              variant="body2"
              sx={{
                fontFamily: POPPINS_FONT,
                color: "#64748b",
                mb: 0.5,
                fontWeight: 500,
              }}
            >
              {label2}
            </Typography>
            {renderStatusBadge(value2)}
          </Box>
        ) : (
          label2 && (
            <InfoRow
              label={label2}
              value={value2}
              icon={icon2}
              isMobile={isMobile}
              isSmallMobile={isSmallMobile}
            />
          )
        )}
      </Box>
    </Box>
  );
};

const TeacherViewScheduleModal = ({ schedule, setShowModal }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const isSmallMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const isTablet = useMediaQuery(theme.breakpoints.between("md", "lg"));

  const getResponsiveModalStyle = () => ({
    ...getModalStyles(),
    width: isSmallMobile
      ? "98vw"
      : isMobile
      ? "95vw"
      : isTablet
      ? "85vw"
      : "800px",
    maxWidth: isSmallMobile
      ? "100%"
      : isMobile
      ? "500px"
      : isTablet
      ? "700px"
      : "800px",
    maxHeight: isMobile ? "95vh" : "90vh",
    borderRadius: isSmallMobile ? "12px" : isMobile ? "16px" : "12px",
    padding: isSmallMobile ? "12px" : isMobile ? "16px" : "24px",
    overflow: "hidden",
    display: "flex",
    flexDirection: "column",
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    margin: 0,
  });

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
    mb: isMobile ? 1.5 : 2,
    fontSize: isSmallMobile ? "0.9375rem" : isMobile ? "1rem" : "1.125rem",
    color: "#1e293b",
  };

  const sectionCardStyles = {
    p: isSmallMobile ? 1.5 : isMobile ? 2 : 3,
    border: "1px solid #e2e8f0",
    borderRadius: isSmallMobile ? "6px" : "8px",
    bgcolor: "#f8fafc",
    mb: isSmallMobile ? 2 : isMobile ? 3 : 4,
    boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
  };

  const scrollableContentStyles = {
    overflowY: "auto",
    flex: 1,
    pr: isSmallMobile ? 0.5 : isMobile ? 1 : 2,
    mt: isSmallMobile ? 1.5 : isMobile ? 2 : 3,
    "&::-webkit-scrollbar": {
      width: isSmallMobile ? "3px" : isMobile ? "4px" : "6px",
    },
    "&::-webkit-scrollbar-track": {
      background: "#f1f5f9",
      borderRadius: "3px",
    },
    "&::-webkit-scrollbar-thumb": {
      background: "#cbd5e1",
      borderRadius: "3px",
      "&:hover": {
        background: "#94a3b8",
      },
    },
  };

  return (
    <Box sx={getResponsiveModalStyle()}>
      {/* Header */}
      <Box
        sx={{
          borderBottom: "1px solid #e2e8f0",
          pb: isSmallMobile ? 1 : isMobile ? 1.5 : 2,
          display: "flex",
          justifyContent: "space-between",
          alignItems: isMobile ? "flex-start" : "center",
          flexDirection: isMobile ? "column" : "row",
          gap: isMobile ? 1 : 0,
        }}
      >
        <Box sx={{ width: isMobile ? "100%" : "auto" }}>
          <Typography
            variant="h5"
            sx={{
              ...typographyStyles,
              fontWeight: 600,
              fontSize: isSmallMobile
                ? "1.125rem"
                : isMobile
                ? "1.25rem"
                : "1.5rem",
              color: "#1e293b",
            }}
          >
            Schedule Details
          </Typography>
          <Typography
            variant="body2"
            sx={{
              ...textStyles,
              fontSize: isSmallMobile
                ? "0.75rem"
                : isMobile
                ? "0.8125rem"
                : "0.875rem",
              mt: 0.5,
            }}
          >
            Class Date: {formatDate(schedule.classDate)}
          </Typography>
        </Box>
        <Button
          onClick={() => setShowModal(false)}
          sx={{
            minWidth: isSmallMobile ? "24px" : isMobile ? "28px" : "32px",
            height: isSmallMobile ? "24px" : isMobile ? "28px" : "32px",
            p: 0,
            borderRadius: "50%",
            color: "#64748b",
            fontSize: isSmallMobile ? "16px" : isMobile ? "18px" : "20px",
            alignSelf: isMobile ? "flex-end" : "center",
            "&:hover": {
              bgcolor: "#f1f5f9",
              color: "#3949ab",
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
            isMobile={isMobile}
            isSmallMobile={isSmallMobile}
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
            isMobile={isMobile}
            isSmallMobile={isSmallMobile}
          />
          <InfoGrid
            label1="Schedule Status"
            value1={schedule.status}
            icon1={FaCalendarAlt}
            label2=""
            value2=""
            icon2={null}
            isMobile={isMobile}
            isSmallMobile={isSmallMobile}
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
              sx={{
                mb:
                  index !== schedule.studentDetails.length - 1
                    ? isMobile
                      ? 2
                      : 3
                    : 0,
                pb:
                  index !== schedule.studentDetails.length - 1
                    ? isMobile
                      ? 1.5
                      : 2
                    : 0,
                borderBottom:
                  index !== schedule.studentDetails.length - 1
                    ? "1px solid #e2e8f0"
                    : "none",
              }}
            >
              <InfoGrid
                label1="Student Name"
                value1={schedule.studentNames[index]}
                icon1={FaUser}
                label2="Student ID"
                value2={detail.studentId}
                icon2={null}
                isMobile={isMobile}
                isSmallMobile={isSmallMobile}
              />
              <InfoGrid
                label1="Client Name"
                value1={detail.clientName}
                icon1={FaChalkboardTeacher}
                label2="Client ID"
                value2={detail.clientId.customId}
                icon2={null}
                isMobile={isMobile}
                isSmallMobile={isSmallMobile}
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
                    isMobile={isMobile}
                    isSmallMobile={isSmallMobile}
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
            isMobile={isMobile}
            isSmallMobile={isSmallMobile}
          />
          <InfoRow
            label="Class Ended At"
            value={
              schedule.classEndedAt
                ? formatDate(schedule.classEndedAt)
                : "Not available"
            }
            icon={FaHistory}
            isMobile={isMobile}
            isSmallMobile={isSmallMobile}
          />
          <InfoGrid
            label1="Start Delay"
            value1={`${schedule.startDelay || 0} minutes`}
            icon1={FaClock}
            label2="Early End"
            value2={`${schedule.earlyEnd || 0} minutes`}
            icon2={FaClock}
            isMobile={isMobile}
            isSmallMobile={isSmallMobile}
          />
          <InfoRow
            label="Session Duration"
            value={`${schedule.sessionDurationMinutes || 0} minutes`}
            icon={FaClock}
            isMobile={isMobile}
            isSmallMobile={isSmallMobile}
          />
        </Box>
      </Box>
    </Box>
  );
};

export default TeacherViewScheduleModal;
