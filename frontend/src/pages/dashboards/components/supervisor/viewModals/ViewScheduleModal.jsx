import React from "react";
import { Box, Button, Typography, Chip } from "@mui/material";
import { format } from "date-fns";
import {
  FaClock,
  FaUser,
  FaBook,
  FaCalendarAlt,
  FaChalkboardTeacher,
  FaTasks,
  FaCheckCircle,
  FaHourglassHalf,
  FaHistory,
  FaRecycle,
  FaRegClock,
  FaUserClock,
  FaRegCalendarCheck,
  FaHourglass,
  FaCircle,
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

const formatTimeAgo = (date) => {
  if (!date) return "";
  const now = new Date("2025-05-15 09:39:43"); // Use your current time
  const diff = now - new Date(date);
  const minutes = Math.floor(diff / 60000);

  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes} minutes ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hours ago`;

  const days = Math.floor(hours / 24);
  return `${days} days ago`;
};
const textStyles = {
  ...typographyStyles,
  color: "#64748b",
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
                  : value1 === "rescheduled"
                  ? "#f3e8ff"
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
                  : value1 === "rescheduled"
                  ? "#6b21a8"
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
      {label2?.toLowerCase().includes("status") ? ( // Changed condition and added optional chaining
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
                  : value2 === "rescheduled"
                  ? "#f3e8ff"
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
                  : value2 === "rescheduled"
                  ? "#6b21a8"
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
const formatDate = (dateString) => {
  if (!dateString) return "Not available";
  const date = new Date(dateString);
  const formattedDate = format(date, "dd/MM/yyyy");
  const formattedTime = format(date, "HH:mm:ss");
  return `${formattedDate} ${convertTo12Hour(formattedTime)}`;
};
const convertTo12Hour = (time) => {
  if (!time) return "";
  const [hours, minutes] = time.split(":");
  const hour = parseInt(hours);
  const ampm = hour >= 12 ? "PM" : "AM";
  const hour12 = hour % 12 || 12;
  return `${hour12.toString().padStart(2, "0")}:${minutes} ${ampm}`;
};
const formatTimeRange = (startTime, endTime) => {
  return `${convertTo12Hour(startTime)} - ${convertTo12Hour(endTime)}`;
};

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
      sx={{ ...textStyles, mb: 2, color: "#374151", fontWeight: 500 }}
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
      <Typography variant="body2" sx={textStyles}>
        Added: {format(new Date(lesson.addedAt), "dd/MM/yyyy")}{" "}
        {convertTo12Hour(format(new Date(lesson.addedAt), "HH:mm"))}
      </Typography>
    </Box>
    {lesson.remarks && (
      <Typography variant="body2" sx={{ ...textStyles, mt: 1 }}>
        Remarks: {lesson.remarks}
      </Typography>
    )}
  </Box>
);

const ViewScheduleModal = ({ schedule, setShowModal, modalStyle }) => {
  const modalBaseStyles = {
    ...modalStyle,
    maxHeight: "90vh",
    display: "flex",
    flexDirection: "column",
    width: "800px",
    fontFamily: POPPINS_FONT,
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

  return (
    <Box sx={modalBaseStyles}>
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
            Class Date: {format(new Date(schedule.classDate), "dd/MM/yyyy")}
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
            label2="Teacher"
            value2={schedule.teacherName}
            icon2={FaChalkboardTeacher}
          />
          <InfoGrid
            label1="Students"
            value1={schedule.studentNames.join(", ")}
            icon1={FaUser}
            label2="Day"
            value2={schedule.day}
            icon2={FaCalendarAlt}
          />
          <InfoGrid
            label1="Time"
            value1={formatTimeRange(schedule.startTime, schedule.endTime)}
            icon1={FaClock}
            label2="Session Status"
            value2={schedule.sessionStatus}
            icon2={FaHourglass}
          />
          <InfoGrid
            label1="Schedule Status"
            value1={schedule.status}
            icon1={FaCalendarAlt}
            label2=""
            value2=""
            icon2={null}
          />
        </Box>
        <Box sx={sectionCardStyles}>
          <InfoRow
            label="Session Progress"
            value={
              schedule.sessionStatus === "completed" ? (
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <FaCheckCircle color="#22c55e" />
                  Completed
                </Box>
              ) : schedule.sessionStatus === "in_progress" ? (
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 1,
                    color: "#2563eb",
                  }}
                >
                  <FaCircle />
                  In Progress
                </Box>
              ) : schedule.sessionStatus === "available" ? (
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 1,
                    color: "#f59e0b",
                  }}
                >
                  <FaClock />
                  Teacher Available
                </Box>
              ) : (
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 1,
                    color: "#64748b",
                  }}
                >
                  <FaRegClock />
                  Pending
                </Box>
              )
            }
          />
        </Box>
        {/* Recurring Information */}
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
          <InfoRow
            label="Subject Type"
            value={
              schedule.subjectType.charAt(0).toUpperCase() +
              schedule.subjectType.slice(1)
            }
            icon={FaBook}
          />
        </Box>
        <Typography variant="subtitle1" sx={sectionHeaderStyles}>
          Attendance Records
        </Typography>
        <Box sx={sectionCardStyles}>
          {schedule.studentAttendances &&
          schedule.studentAttendances.length > 0 ? (
            schedule.studentAttendances.map((attendance, index) => (
              <Box
                key={index}
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  mb: index !== schedule.studentAttendances.length - 1 ? 2 : 0,
                  pb: index !== schedule.studentAttendances.length - 1 ? 2 : 0,
                  borderBottom:
                    index !== schedule.studentAttendances.length - 1
                      ? "1px solid #e2e8f0"
                      : "none",
                }}
              >
                <Box>
                  <Typography
                    sx={{ ...typographyStyles, fontWeight: 500, mb: 0.5 }}
                  >
                    {attendance.studentName}
                  </Typography>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <Chip
                      label={
                        attendance.status.charAt(0).toUpperCase() +
                        attendance.status.slice(1)
                      }
                      size="medium"
                      sx={{
                        backgroundColor:
                          attendance.status === "present"
                            ? "#dcfce7"
                            : attendance.status === "absent"
                            ? "#fee2e2"
                            : attendance.status === "leave"
                            ? "#fef3c7"
                            : attendance.status === "pending"
                            ? "#e0f2fe"
                            : "#f1f5f9",

                        color:
                          attendance.status === "present"
                            ? "#166534"
                            : attendance.status === "absent"
                            ? "#991b1b"
                            : attendance.status === "leave"
                            ? "#92400e"
                            : attendance.status === "pending"
                            ? "#075985"
                            : "#475569",

                        textTransform: "capitalize",
                        fontWeight: 500,
                        fontSize: "0.875rem",
                      }}
                    />
                    {attendance.remarks && (
                      <Typography
                        variant="body2"
                        sx={{
                          color: "#64748b",
                          fontSize: "0.75rem",
                          fontStyle: "italic",
                        }}
                      >
                        "{attendance.remarks}"
                      </Typography>
                    )}
                  </Box>
                </Box>
                {(attendance.markedBy || attendance.markedAt) && (
                  <Box sx={{ textAlign: "right" }}>
                    {attendance.markedBy && (
                      <Typography
                        variant="body2"
                        sx={{
                          color: "#64748b",
                          fontSize: "0.75rem",
                        }}
                      >
                        Marked by: {attendance.markedBy}
                      </Typography>
                    )}
                    {attendance.markedAt && (
                      <Typography
                        variant="body2"
                        sx={{
                          color: "#94a3b8",
                          fontSize: "0.75rem",
                        }}
                      >
                        {formatDate(attendance.markedAt)}
                      </Typography>
                    )}
                  </Box>
                )}
              </Box>
            ))
          ) : (
            <Typography sx={{ ...textStyles, fontStyle: "italic" }}>
              No attendance records available
            </Typography>
          )}
        </Box>
        {/* Session Timings */}
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
        {schedule.sessionStatus === "completed" && (
          <Box>
            <Typography
              variant="subtitle2"
              sx={{ mt: 2, mb: 1, fontWeight: 600 }}
            >
              Timing Analysis
            </Typography>

            {schedule.startDelay > 0 ? (
              <TimingDetail
                label="Started"
                value={`${schedule.startDelay} minutes late`}
                type="late"
              />
            ) : (
              <TimingDetail label="Started" value="On time" type="onTime" />
            )}

            {schedule.earlyEnd > 0 ? (
              <TimingDetail
                label="Ended"
                value={`${schedule.earlyEnd} minutes early`}
                type="early"
              />
            ) : (
              <TimingDetail label="Ended" value="On schedule" type="onTime" />
            )}
          </Box>
        )}
        {/* Lessons */}
        <Typography variant="subtitle1" sx={sectionHeaderStyles}>
          Lessons
        </Typography>
        {schedule.lessons && schedule.lessons.length > 0 ? (
          schedule.lessons.map((lesson) => (
            <LessonCard key={lesson._id} lesson={lesson} />
          ))
        ) : (
          <Typography sx={{ ...textStyles, fontStyle: "italic" }}>
            No lessons added yet
          </Typography>
        )}
        {/* System Information */}
        <Typography variant="subtitle1" sx={sectionHeaderStyles}>
          System Details
        </Typography>
        <Box sx={sectionCardStyles}>
          <InfoGrid
            label1="Created At"
            value1={formatDate(schedule.createdAt)}
            icon1={FaHistory}
            label2="Updated At"
            value2={formatDate(schedule.updatedAt)}
            icon2={FaHistory}
          />
        </Box>
      </Box>
    </Box>
  );
};

export default ViewScheduleModal;
