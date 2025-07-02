import React, { useState, useEffect } from "react";
import { Box, Button, Typography, Modal } from "@mui/material";
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

const POPPINS_FONT =
  "'Poppins', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";

const ResponsiveInfoRow = ({ label, value, icon: Icon, isMobile }) => (
  <Box
    sx={{
      display: "flex",
      alignItems: "flex-start",
      gap: {
        xs: 1,
        sm: 1.5,
      },
      mb: {
        xs: 1.5,
        sm: 2,
      },
    }}
  >
    {Icon && (
      <Icon
        size={isMobile ? 14 : 16}
        style={{
          color: "#64748b",
          marginTop: isMobile ? "2px" : "4px",
          flexShrink: 0,
        }}
      />
    )}
    <Box sx={{ minWidth: 0, width: "100%" }}>
      <Typography
        variant="body2"
        sx={{
          fontFamily: POPPINS_FONT,
          color: "#64748b",
          mb: 0.5,
          fontSize: {
            xs: "0.75rem",
            sm: "0.8rem",
            md: "0.875rem",
          },
          fontWeight: 500,
        }}
      >
        {label}
      </Typography>
      {React.isValidElement(value) ? (
        value
      ) : (
        <Typography
          sx={{
            fontFamily: POPPINS_FONT,
            fontSize: {
              xs: "0.8rem",
              sm: "0.875rem",
              md: "1rem",
            },
            wordBreak: "break-word",
          }}
        >
          {value === true
            ? "Yes"
            : value === false
            ? "No"
            : value || "Not provided"}
        </Typography>
      )}
    </Box>
  </Box>
);

const ResponsiveInfoGrid = ({
  label1,
  value1,
  icon1,
  label2,
  value2,
  icon2,
  isMobile,
}) => (
  <Box
    sx={{
      display: "flex",
      justifyContent: "space-between",
      mb: {
        xs: 1.5,
        sm: 2,
      },
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
    <Box
      sx={{
        width: {
          xs: "100%",
          sm: "48%",
        },
      }}
    >
      {label1.toLowerCase().includes("status") ? (
        <Box>
          <Typography
            variant="body2"
            sx={{
              fontFamily: POPPINS_FONT,
              color: "#64748b",
              mb: 0.5,
              fontSize: {
                xs: "0.75rem",
                sm: "0.8rem",
                md: "0.875rem",
              },
              fontWeight: 500,
            }}
          >
            {label1}
          </Typography>
          <Box
            component="span"
            sx={{
              padding: {
                xs: "3px 6px",
                sm: "4px 8px",
              },
              borderRadius: "4px",
              fontSize: {
                xs: "0.75rem",
                sm: "0.8rem",
                md: "0.875rem",
              },
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
              display: "inline-block",
            }}
          >
            {value1?.replace("_", " ")}
          </Box>
        </Box>
      ) : (
        <ResponsiveInfoRow
          label={label1}
          value={value1}
          icon={icon1}
          isMobile={isMobile}
        />
      )}
    </Box>
    <Box
      sx={{
        width: {
          xs: "100%",
          sm: "48%",
        },
      }}
    >
      {label2?.toLowerCase().includes("status") ? (
        <Box>
          <Typography
            variant="body2"
            sx={{
              fontFamily: POPPINS_FONT,
              color: "#64748b",
              mb: 0.5,
              fontSize: {
                xs: "0.75rem",
                sm: "0.8rem",
                md: "0.875rem",
              },
              fontWeight: 500,
            }}
          >
            {label2}
          </Typography>
          <Box
            component="span"
            sx={{
              padding: {
                xs: "3px 6px",
                sm: "4px 8px",
              },
              borderRadius: "4px",
              fontSize: {
                xs: "0.75rem",
                sm: "0.8rem",
                md: "0.875rem",
              },
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
              display: "inline-block",
            }}
          >
            {value2?.replace("_", " ")}
          </Box>
        </Box>
      ) : (
        label2 && (
          <ResponsiveInfoRow
            label={label2}
            value={value2}
            icon={icon2}
            isMobile={isMobile}
          />
        )
      )}
    </Box>
  </Box>
);

const ResponsiveLessonCard = ({ lesson, isMobile }) => (
  <Box
    sx={{
      p: {
        xs: 1.5,
        sm: 2,
        md: 2.5,
      },
      border: "1px solid #e2e8f0",
      borderRadius: "8px",
      mb: {
        xs: 1.5,
        sm: 2,
      },
      bgcolor: "#fff",
      transition: "all 0.2s ease",
      "&:hover": {
        borderColor: "#cbd5e1",
        boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
        transform: "translateY(-1px)",
      },
    }}
  >
    <Typography
      variant="subtitle2"
      sx={{
        fontFamily: POPPINS_FONT,
        fontWeight: 600,
        mb: {
          xs: 1,
          sm: 1.5,
        },
        fontSize: {
          xs: "0.9rem",
          sm: "1rem",
          md: "1.1rem",
        },
        color: "#1e293b",
      }}
    >
      {lesson.title}
    </Typography>
    <Typography
      variant="body2"
      sx={{
        fontFamily: POPPINS_FONT,
        color: "#64748b",
        mb: {
          xs: 1.5,
          sm: 2,
        },
        fontWeight: 500,
        fontSize: {
          xs: "0.8rem",
          sm: "0.875rem",
        },
        lineHeight: 1.5,
      }}
    >
      {lesson.description}
    </Typography>
    <Box
      sx={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: {
          xs: "flex-start",
          sm: "center",
        },
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
        variant="body2"
        sx={{
          fontFamily: POPPINS_FONT,
          color: "#64748b",
          fontSize: {
            xs: "0.75rem",
            sm: "0.8rem",
          },
        }}
      >
        Added:{" "}
        {format(
          new Date(lesson.addedAt),
          isMobile ? "dd/MM/yy HH:mm" : "dd/MM/yyyy hh:mm a"
        )}
      </Typography>
    </Box>
    {lesson.remarks && (
      <Typography
        variant="body2"
        sx={{
          fontFamily: POPPINS_FONT,
          color: "#64748b",
          mt: {
            xs: 1,
            sm: 1.5,
          },
          fontStyle: "italic",
          fontSize: {
            xs: "0.75rem",
            sm: "0.8rem",
          },
          pt: {
            xs: 1,
            sm: 1.5,
          },
          borderTop: "1px solid #e2e8f0",
        }}
      >
        <strong>Remarks:</strong> {lesson.remarks}
      </Typography>
    )}
  </Box>
);

const TimingDetail = ({ label, value, type, isMobile }) => {
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
          fontFamily: POPPINS_FONT,
          color: getTimingStatusColor(type),
          fontWeight: 500,
          display: "flex",
          alignItems: "center",
          gap: 1,
          fontSize: {
            xs: "0.75rem",
            sm: "0.8rem",
          },
        }}
      >
        <FaClock size={isMobile ? 10 : 12} />
        {label}: {value}
      </Typography>
    </Box>
  );
};

const ClientViewScheduleModal = ({
  schedule,
  setShowModal,
  modalStyle,
  open = true,
}) => {
  const { isMobile, isTablet } = useResponsive();
  const currentTime = new Date("2025-05-21T07:40:46Z");

  const getResponsiveModalStyles = () => ({
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
    fontFamily: POPPINS_FONT,
    "&:focus-visible": {
      outline: "none",
    },
    "& *": {
      fontFamily: `${POPPINS_FONT} !important`,
    },
  });

  const sectionHeaderStyles = {
    fontFamily: POPPINS_FONT,
    fontWeight: 600,
    mb: {
      xs: 1.5,
      sm: 2,
    },
    fontSize: {
      xs: "1rem",
      sm: "1.1rem",
      md: "1.25rem",
    },
  };

  const sectionCardStyles = {
    p: {
      xs: 2,
      sm: 2.5,
      md: 3,
    },
    border: "1px solid #e2e8f0",
    borderRadius: "8px",
    bgcolor: "#f8fafc",
    mb: {
      xs: 3,
      sm: 3.5,
      md: 4,
    },
  };

  const scrollableContentStyles = {
    overflowY: "auto",
    flex: 1,
    pr: {
      xs: 1,
      sm: 2,
    },
    mt: {
      xs: 2,
      sm: 2.5,
      md: 3,
    },
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

  const formatDate = (dateString) => {
    if (!dateString) return "Not available";
    const date = new Date(dateString);
    return format(date, isMobile ? "dd/MM/yy HH:mm" : "dd/MM/yyyy hh:mm a");
  };

  const convertTo12Hour = (time) => {
    if (!time) return "";
    const [hours, minutes] = time.split(":");
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? "PM" : "AM";
    const hour12 = hour % 12 || 12;
    return `${hour12.toString().padStart(2, "0")}:${minutes} ${ampm}`;
  };

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
    <Modal
      open={open}
      onClose={() => setShowModal(false)}
      aria-labelledby="view-schedule-modal"
    >
      <Box sx={getResponsiveModalStyles()}>
        {/* Header */}
        <Box
          sx={{
            borderBottom: "1px solid #e2e8f0",
            pb: {
              xs: 1.5,
              sm: 2,
            },
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
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
          <Box
            sx={{
              flex: 1,
              width: "100%",
            }}
          >
            <Typography
              variant="h5"
              sx={{
                fontFamily: POPPINS_FONT,
                fontWeight: 600,
                fontSize: {
                  xs: "1.2rem",
                  sm: "1.3rem",
                  md: "1.5rem",
                },
                textAlign: {
                  xs: "center",
                  sm: "left",
                },
                color: "#1e293b",
              }}
            >
              Class Schedule Details
            </Typography>
            <Typography
              variant="body2"
              sx={{
                fontFamily: POPPINS_FONT,
                color: "#64748b",
                mt: 0.5,
                fontSize: {
                  xs: "0.8rem",
                  sm: "0.875rem",
                },
                textAlign: {
                  xs: "center",
                  sm: "left",
                },
              }}
            >
              {format(
                currentTime,
                isMobile ? "EEE, MMM d, yyyy" : "EEEE, MMMM d, yyyy"
              )}{" "}
              at {format(currentTime, "hh:mm a")}
            </Typography>
          </Box>
          <Button
            onClick={() => setShowModal(false)}
            sx={{
              minWidth: {
                xs: "28px",
                sm: "32px",
              },
              height: {
                xs: "28px",
                sm: "32px",
              },
              p: 0,
              borderRadius: "50%",
              color: "#64748b",
              fontSize: {
                xs: "16px",
                sm: "18px",
              },
              position: {
                xs: "absolute",
                sm: "static",
              },
              top: {
                xs: "16px",
                sm: "auto",
              },
              right: {
                xs: "16px",
                sm: "auto",
              },
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
            <ResponsiveInfoGrid
              label1="Subject"
              value1={schedule.subjectName}
              icon1={FaBook}
              label2="Subject Type"
              value2={
                schedule.subjectType.charAt(0).toUpperCase() +
                schedule.subjectType.slice(1)
              }
              icon2={FaBook}
              isMobile={isMobile}
            />

            <ResponsiveInfoGrid
              label1="Teacher"
              value1={schedule.teacherName}
              icon1={FaChalkboardTeacher}
              label2="Day"
              value2={schedule.day}
              icon2={FaCalendarAlt}
              isMobile={isMobile}
            />
            <ResponsiveInfoGrid
              label1="Student"
              value1={schedule.studentNames.map((s) => s.name).join(", ")}
              icon1={FaUser}
              label2="Time"
              value2={`${convertTo12Hour(
                schedule.startTime
              )} - ${convertTo12Hour(schedule.endTime)}`}
              icon2={FaClock}
              isMobile={isMobile}
            />
          </Box>

          {/* Status Information */}
          <Typography variant="subtitle1" sx={sectionHeaderStyles}>
            Status Information
          </Typography>
          <Box sx={sectionCardStyles}>
            <ResponsiveInfoGrid
              label1="Schedule Status"
              value1={schedule.status}
              icon1={FaCalendarAlt}
              label2="Session Status"
              value2={schedule.sessionStatus}
              icon2={FaTasks}
              isMobile={isMobile}
            />
          </Box>

          {/* Schedule Settings */}
          <Typography variant="subtitle1" sx={sectionHeaderStyles}>
            Schedule Settings
          </Typography>
          <Box sx={sectionCardStyles}>
            <ResponsiveInfoGrid
              label1="Recurring"
              value1={schedule.isRecurring}
              icon1={FaRecycle}
              label2="Pattern"
              value2={schedule.recurrencePattern}
              icon2={FaRegCalendarCheck}
              isMobile={isMobile}
            />
            {schedule.recurrencePattern === "custom" && schedule.customDays && (
              <ResponsiveInfoRow
                label="Custom Days"
                value={
                  <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                    {schedule.customDays.map((day) => (
                      <Box
                        key={day}
                        component="span"
                        sx={{
                          padding: {
                            xs: "3px 6px",
                            sm: "4px 8px",
                          },
                          borderRadius: "4px",
                          fontSize: {
                            xs: "0.75rem",
                            sm: "0.8rem",
                            md: "0.875rem",
                          },
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
                isMobile={isMobile}
              />
            )}
          </Box>

          {/* Session Timeline */}
          <Typography variant="subtitle1" sx={sectionHeaderStyles}>
            Session Timeline
          </Typography>
          <Box sx={sectionCardStyles}>
            <ResponsiveInfoGrid
              label1="Teacher Available At"
              value1={formatDate(schedule.teacherAvailableAt)}
              icon1={FaUserClock}
              label2="Class Started At"
              value2={formatDate(schedule.classStartedAt)}
              icon2={FaRegClock}
              isMobile={isMobile}
            />
            <ResponsiveInfoRow
              label="Class Ended At"
              value={formatDate(schedule.classEndedAt)}
              icon={FaHistory}
              isMobile={isMobile}
            />
          </Box>

          {/* Lessons */}
          <Typography variant="subtitle1" sx={sectionHeaderStyles}>
            Lessons
          </Typography>
          <Box sx={{ mb: { xs: 3, sm: 3.5, md: 4 } }}>
            {schedule.lessons && schedule.lessons.length > 0 ? (
              schedule.lessons.map((lesson) => (
                <ResponsiveLessonCard
                  key={lesson._id}
                  lesson={lesson}
                  isMobile={isMobile}
                />
              ))
            ) : (
              <Box
                sx={{
                  textAlign: "center",
                  p: {
                    xs: 2,
                    sm: 3,
                  },
                  color: "#64748b",
                  fontStyle: "italic",
                  border: "1px solid #e2e8f0",
                  borderRadius: "8px",
                  bgcolor: "#f8fafc",
                }}
              >
                <Typography
                  sx={{
                    fontFamily: POPPINS_FONT,
                    fontSize: {
                      xs: "0.9rem",
                      sm: "1rem",
                    },
                    mb: 0.5,
                  }}
                >
                  📚 No Lessons Added Yet
                </Typography>
                <Typography
                  sx={{
                    fontFamily: POPPINS_FONT,
                    fontSize: {
                      xs: "0.8rem",
                      sm: "0.875rem",
                    },
                    color: "#94a3b8",
                  }}
                >
                  Lessons will appear here once the teacher adds them
                </Typography>
              </Box>
            )}
          </Box>

          {/* Duration Information */}
          <Typography variant="subtitle1" sx={sectionHeaderStyles}>
            Duration Details
          </Typography>
          <Box sx={sectionCardStyles}>
            <ResponsiveInfoGrid
              label1="Scheduled Duration"
              value1={`${schedule.scheduledDuration} minutes`}
              icon1={FaClock}
              label2="Actual Duration"
              value2={`${schedule.actualDuration} minutes`}
              icon2={FaClock}
              isMobile={isMobile}
            />
            <ResponsiveInfoGrid
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
              isMobile={isMobile}
            />
          </Box>
        </Box>
      </Box>
    </Modal>
  );
};

export default ClientViewScheduleModal;
