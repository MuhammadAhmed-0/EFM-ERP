import { Box, Button, Typography, Chip } from "@mui/material";
import { format } from "date-fns";
import {
  FaClock,
  FaUser,
  FaBook,
  FaCalendarAlt,
  FaChalkboardTeacher,
  FaCheckCircle,
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

const useResponsive = () => {
  const isMobile = window.innerWidth < 768;
  const isTablet = window.innerWidth >= 768 && window.innerWidth < 1024;
  return { isMobile, isTablet };
};


const convertTo12Hour = (time) => {
  if (!time) return "";
  const [hours, minutes] = time.split(":");
  const hour = parseInt(hours);
  const ampm = hour >= 12 ? "PM" : "AM";
  const hour12 = hour % 12 || 12;
  return `${hour12.toString().padStart(2, "0")}:${minutes} ${ampm}`;
};

const formatDate = (dateString) => {
  if (!dateString) return "Not available";
  const date = new Date(dateString);
  const formattedDate = format(date, "dd/MM/yyyy");
  const formattedTime = format(date, "HH:mm:ss");
  return `${formattedDate} ${convertTo12Hour(formattedTime)}`;
};

const formatTimeRange = (startTime, endTime) => {
  return `${convertTo12Hour(startTime)} - ${convertTo12Hour(endTime)}`;
};

const TimingDetail = ({ label, value, type }) => {
  const { isMobile } = useResponsive();

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
          fontSize: isMobile ? "0.8rem" : "0.875rem",
        }}
      >
        <FaClock size={isMobile ? 10 : 12} />
        {label}: {value}
      </Typography>
    </Box>
  );
};

const InfoRow = ({ label, value, icon: Icon }) => {
  const { isMobile } = useResponsive();

  return (
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
          size={isMobile ? 14 : 16}
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
            fontSize: isMobile ? "0.75rem" : "0.875rem",
          }}
        >
          {label}
        </Typography>
        <Typography
          sx={{
            fontFamily: POPPINS_FONT,
            fontSize: isMobile ? "0.85rem" : "1rem",
            wordBreak: "break-word",
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
};

const InfoGrid = ({ label1, value1, icon1, label2, value2, icon2 }) => {
  const { isMobile } = useResponsive();

  const renderStatusBadge = (value) => (
    <Box
      component="span"
      sx={{
        padding: isMobile ? "3px 6px" : "4px 8px",
        borderRadius: "4px",
        fontSize: isMobile ? "0.75rem" : "0.875rem",
        fontWeight: 500,
        backgroundColor:
          value === "scheduled"
            ? "#e3f2fd"
            : value === "completed"
            ? "#dcfce7"
            : value === "cancelled"
            ? "#fee2e2"
            : value === "rescheduled"
            ? "#f3e8ff"
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
            : value === "rescheduled"
            ? "#6b21a8"
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
                  fontSize: "0.75rem",
                }}
              >
                {label1}
              </Typography>
              {renderStatusBadge(value1)}
            </Box>
          ) : (
            <InfoRow label={label1} value={value1} icon={icon1} />
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
                    fontSize: "0.75rem",
                  }}
                >
                  {label2}
                </Typography>
                {renderStatusBadge(value2)}
              </Box>
            ) : (
              <InfoRow label={label2} value={value2} icon={icon2} />
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
              }}
            >
              {label1}
            </Typography>
            {renderStatusBadge(value1)}
          </Box>
        ) : (
          <InfoRow label={label1} value={value1} icon={icon1} />
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
              }}
            >
              {label2}
            </Typography>
            {renderStatusBadge(value2)}
          </Box>
        ) : (
          label2 && <InfoRow label={label2} value={value2} icon={icon2} />
        )}
      </Box>
    </Box>
  );
};

const LessonCard = ({ lesson }) => {
  const { isMobile } = useResponsive();

  return (
    <Box
      sx={{
        p: isMobile ? 1.5 : 2,
        border: "1px solid #e2e8f0",
        borderRadius: "8px",
        mb: 2,
        bgcolor: "#fff",
      }}
    >
      <Typography
        variant="subtitle2"
        sx={{
          fontFamily: POPPINS_FONT,
          fontWeight: 600,
          mb: 1,
          fontSize: isMobile ? "0.9rem" : "1rem",
        }}
      >
        {lesson.title}
      </Typography>
      <Typography
        variant="body2"
        sx={{
          fontFamily: POPPINS_FONT,
          color: "#374151",
          fontWeight: 500,
          mb: 2,
          fontSize: isMobile ? "0.8rem" : "0.875rem",
          lineHeight: 1.4,
        }}
      >
        {lesson.description}
      </Typography>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          flexDirection: isMobile ? "column" : "row",
          alignItems: isMobile ? "flex-start" : "center",
          gap: isMobile ? 1 : 0,
        }}
      >
        <Typography
          variant="body2"
          sx={{
            fontFamily: POPPINS_FONT,
            color: "#64748b",
            fontSize: isMobile ? "0.75rem" : "0.875rem",
          }}
        >
          Added: {format(new Date(lesson.addedAt), "dd/MM/yyyy")}{" "}
          {convertTo12Hour(format(new Date(lesson.addedAt), "HH:mm"))}
        </Typography>
      </Box>
      {lesson.remarks && (
        <Typography
          variant="body2"
          sx={{
            fontFamily: POPPINS_FONT,
            color: "#64748b",
            mt: 1,
            fontSize: isMobile ? "0.75rem" : "0.875rem",
          }}
        >
          Remarks: {lesson.remarks}
        </Typography>
      )}
    </Box>
  );
};

const ViewScheduleModal = ({ schedule, setShowModal, modalStyle }) => {
  const { isMobile, isTablet } = useResponsive();

  const responsiveModalStyles = {
    ...modalStyle,
    maxHeight: isMobile ? "95vh" : "90vh",
    display: "flex",
    flexDirection: "column",
    width: isMobile ? "95vw" : isTablet ? "85vw" : "800px",
    maxWidth: isMobile ? "400px" : isTablet ? "600px" : "800px",
    fontFamily: POPPINS_FONT,
    p: isMobile ? 2 : isTablet ? 3 : 4,
  };

  const typographyStyles = {
    fontFamily: POPPINS_FONT,
  };

  const sectionHeaderStyles = {
    ...typographyStyles,
    fontWeight: 600,
    mb: isMobile ? 1.5 : 2,
    fontSize: isMobile ? "1rem" : "1.125rem",
  };

  const sectionCardStyles = {
    p: isMobile ? 2 : 3,
    border: "1px solid #e2e8f0",
    borderRadius: "8px",
    bgcolor: "#f8fafc",
    mb: isMobile ? 2 : 4,
  };

  const textStyles = {
    ...typographyStyles,
    color: "#64748b",
  };

  const scrollableContentStyles = {
    overflowY: "auto",
    flex: 1,
    pr: isMobile ? 1 : 2,
    mt: isMobile ? 2 : 3,
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
  };

  return (
    <Box sx={responsiveModalStyles}>
      {/* Header */}
      <Box
        sx={{
          borderBottom: "1px solid #e2e8f0",
          pb: isMobile ? 1.5 : 2,
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
              fontSize: isMobile ? "1.2rem" : "1.5rem",
            }}
          >
            Schedule Details
          </Typography>
          <Typography
            variant="body2"
            sx={{
              ...textStyles,
              fontSize: isMobile ? "0.8rem" : "0.875rem",
            }}
          >
            Class Date: {format(new Date(schedule.classDate), "dd/MM/yyyy")}
          </Typography>
        </Box>
        <Button
          onClick={() => setShowModal(false)}
          sx={{
            minWidth: isMobile ? "28px" : "32px",
            height: isMobile ? "28px" : "32px",
            p: 0,
            borderRadius: "50%",
            color: "#64748b",
            fontSize: isMobile ? "18px" : "20px",
            alignSelf: isMobile ? "flex-end" : "center",
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
                  <FaCheckCircle color="#22c55e" size={isMobile ? 14 : 16} />
                  <Typography sx={{ fontSize: isMobile ? "0.85rem" : "1rem" }}>
                    Completed
                  </Typography>
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
                  <FaCircle size={isMobile ? 14 : 16} />
                  <Typography sx={{ fontSize: isMobile ? "0.85rem" : "1rem" }}>
                    In Progress
                  </Typography>
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
                  <FaClock size={isMobile ? 14 : 16} />
                  <Typography sx={{ fontSize: isMobile ? "0.85rem" : "1rem" }}>
                    Teacher Available
                  </Typography>
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
                  <FaRegClock size={isMobile ? 14 : 16} />
                  <Typography sx={{ fontSize: isMobile ? "0.85rem" : "1rem" }}>
                    Pending
                  </Typography>
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
                        padding: isMobile ? "3px 6px" : "4px 8px",
                        borderRadius: "4px",
                        fontSize: isMobile ? "0.75rem" : "0.875rem",
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

        {/* Attendance Records */}
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
                  flexDirection: isMobile ? "column" : "row",
                  gap: isMobile ? 1 : 0,
                }}
              >
                <Box sx={{ width: isMobile ? "100%" : "auto" }}>
                  <Typography
                    sx={{
                      ...typographyStyles,
                      fontWeight: 500,
                      mb: 0.5,
                      fontSize: isMobile ? "0.9rem" : "1rem",
                    }}
                  >
                    {attendance.studentName}
                  </Typography>
                  <Box
                    sx={{
                      display: "flex",
                      gap: 1,
                      flexDirection: isMobile ? "column" : "row",
                      alignItems: isMobile ? "flex-start" : "center",
                    }}
                  >
                    <Chip
                      label={
                        attendance.status.charAt(0).toUpperCase() +
                        attendance.status.slice(1)
                      }
                      size={isMobile ? "small" : "medium"}
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
                        fontSize: isMobile ? "0.75rem" : "0.875rem",
                      }}
                    />
                    {attendance.remarks && (
                      <Typography
                        variant="body2"
                        sx={{
                          color: "#64748b",
                          fontSize: isMobile ? "0.7rem" : "0.75rem",
                          fontStyle: "italic",
                        }}
                      >
                        "{attendance.remarks}"
                      </Typography>
                    )}
                  </Box>
                </Box>
                {(attendance.markedBy || attendance.markedAt) && (
                  <Box
                    sx={{
                      textAlign: isMobile ? "left" : "right",
                      width: isMobile ? "100%" : "auto",
                    }}
                  >
                    {attendance.markedBy && (
                      <Typography
                        variant="body2"
                        sx={{
                          color: "#64748b",
                          fontSize: isMobile ? "0.7rem" : "0.75rem",
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
                          fontSize: isMobile ? "0.7rem" : "0.75rem",
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
            <Typography
              sx={{
                ...textStyles,
                fontStyle: "italic",
                fontSize: isMobile ? "0.85rem" : "1rem",
              }}
            >
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
              sx={{
                mt: 2,
                mb: 1,
                fontWeight: 600,
                fontSize: isMobile ? "0.9rem" : "1rem",
              }}
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
          <Typography
            sx={{
              ...textStyles,
              fontStyle: "italic",
              fontSize: isMobile ? "0.85rem" : "1rem",
            }}
          >
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
