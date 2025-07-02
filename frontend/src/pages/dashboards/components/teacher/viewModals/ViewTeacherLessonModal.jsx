import { useState, useEffect } from "react";
import {
  Box,
  Button,
  Typography,
  Modal,
  useTheme,
  useMediaQuery,
  CircularProgress,
} from "@mui/material";
import ReactDatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { format } from "date-fns";
import { FaFilter, FaCalendarAlt, FaBook } from "react-icons/fa";
import axios from "axios";
import { getModalStyles } from "../../../../../styles/modal/commonModalStyles";
import useNotification from "../../../../../hooks/useNotification";
import NotificationSnackbar from "../../../../../components/common/NotificationSnackbar";

const ViewTeacherLessonModal = ({ schedule, open, onClose }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const isSmallMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const isTablet = useMediaQuery(theme.breakpoints.between("md", "lg"));

  const [dateRange, setDateRange] = useState([null, null]);
  const [lessons, setLessons] = useState([]);
  const [loading, setLoading] = useState(false);
  const { notification, showNotification, closeNotification } =
    useNotification();
  const BASE_URL = import.meta.env.VITE_BASE_URL;

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
    overflow: "auto",
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    margin: 0,

    ...(isSmallMobile && {
      left: "1vw",
      right: "1vw",
      transform: "translateY(-50%)",
      width: "98vw",
    }),
  });
  const getCustomStyles = () => ({
    dateInputWrapper: {
      position: "relative",
      width: "100%",
    },
    filterIcon: {
      position: "absolute",
      left: isSmallMobile ? "8px" : isMobile ? "10px" : "12px",
      top: "50%",
      transform: "translateY(-50%)",
      color: "#64748b",
      zIndex: 1,
      fontSize: isSmallMobile ? "12px" : isMobile ? "14px" : "16px",
    },
    dateInput: {
      width: "100%",
      padding: isSmallMobile
        ? "6px 8px 6px 28px"
        : isMobile
        ? "7px 10px 7px 32px"
        : "8px 12px 8px 36px",
      border: "1px solid #e2e8f0",
      borderRadius: isSmallMobile ? "4px" : "6px",
      fontSize: isSmallMobile ? "0.75rem" : isMobile ? "0.8125rem" : "0.875rem",
      color: "#475569",
      backgroundColor: "white",
      cursor: "pointer",
      outline: "none",
      transition: "border-color 0.2s",
    },
  });

  const customStyles = getCustomStyles();

  const fetchStudentLessons = async () => {
    if (!schedule) return;

    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const studentId = schedule.students[0];
      const subjectId = schedule.subject;

      const response = await axios.get(
        `${BASE_URL}/api/schedules/teacher/student-lessons/${studentId}/${subjectId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.data.success) {
        setLessons(response.data.data);
      }
    } catch (error) {
      showNotification(
        error.response?.data?.message || "Error fetching lessons",
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open && schedule) {
      fetchStudentLessons();
    }
  }, [open, schedule]);

  const filteredLessons =
    dateRange[0] && dateRange[1]
      ? lessons.lessons?.filter((lesson) => {
          const lessonDate = new Date(lesson.classDate);
          return lessonDate >= dateRange[0] && lessonDate <= dateRange[1];
        })
      : lessons.lessons || [];

  const handleClose = () => {
    setDateRange([null, null]);
    onClose();
  };

  if (!schedule) return null;

  return (
    <Modal
      open={open}
      onClose={handleClose}
      aria-labelledby="view-lessons-modal"
    >
      <Box sx={getResponsiveModalStyle()}>
        {/* Header */}
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: isMobile ? "flex-start" : "center",
            mb: isSmallMobile ? 2 : isMobile ? 2.5 : 3,
            borderBottom: "1px solid #e2e8f0",
            pb: isSmallMobile ? 1 : isMobile ? 1.5 : 2,
            flexDirection: isMobile ? "column" : "row",
            gap: isMobile ? 1 : 0,
          }}
        >
          <Box sx={{ width: isMobile ? "100%" : "auto" }}>
            <Typography
              variant="h6"
              sx={{
                fontSize: isSmallMobile
                  ? "1rem"
                  : isMobile
                  ? "1.125rem"
                  : "1.25rem",
                fontWeight: 600,
                color: "#1e293b",
                lineHeight: 1.3,
                mb: isMobile ? 0.5 : 0,
              }}
            >
              📚 Student Lessons
            </Typography>
            {lessons.studentName && lessons.subjectName && (
              <Typography
                variant="body2"
                sx={{
                  color: "#64748b",
                  fontSize: isSmallMobile
                    ? "0.75rem"
                    : isMobile
                    ? "0.8125rem"
                    : "0.875rem",
                  mt: 0.5,
                }}
              >
                {lessons.studentName} - {lessons.subjectName}
              </Typography>
            )}
          </Box>

          <Button
            onClick={handleClose}
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

        {/* Date Filter */}
        <Box
          sx={{
            mb: isSmallMobile ? 2 : isMobile ? 2.5 : 3,
            width: "100%",
          }}
        >
          <Typography
            variant="body2"
            sx={{
              mb: 1,
              color: "#64748b",
              fontSize: isSmallMobile
                ? "0.75rem"
                : isMobile
                ? "0.8125rem"
                : "0.875rem",
              fontWeight: 500,
            }}
          >
            📅 Filter by Date Range
          </Typography>
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
              <div style={customStyles.dateInputWrapper}>
                <FaFilter style={customStyles.filterIcon} />
                <input
                  style={customStyles.dateInput}
                  placeholder={
                    isSmallMobile
                      ? "Select dates"
                      : isMobile
                      ? "Filter dates"
                      : "Filter by date range"
                  }
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
        </Box>

        {/* Content Area */}
        <Box
          sx={{
            maxHeight: isMobile ? "calc(95vh - 200px)" : "400px",
            overflowY: "auto",
            pr: isMobile ? 0.5 : 1,
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
          }}
        >
          {loading ? (
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                py: isSmallMobile ? 3 : isMobile ? 4 : 6,
                gap: 2,
              }}
            >
              <CircularProgress
                size={isSmallMobile ? 32 : isMobile ? 40 : 48}
                sx={{ color: "#3949ab" }}
              />
              <Typography
                sx={{
                  textAlign: "center",
                  color: "#64748b",
                  fontSize: isSmallMobile
                    ? "0.8125rem"
                    : isMobile
                    ? "0.875rem"
                    : "1rem",
                }}
              >
                Loading lessons...
              </Typography>
            </Box>
          ) : (
            <>
              {/* Lessons List */}
              {filteredLessons.map((lesson, index) => (
                <Box
                  key={index}
                  sx={{
                    mb: isSmallMobile ? 1.5 : isMobile ? 2 : 2,
                    p: isSmallMobile ? 1.5 : isMobile ? 2 : 2,
                    border: "1px solid #e2e8f0",
                    borderRadius: isSmallMobile ? "6px" : "8px",
                    bgcolor: "#f8fafc",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                    transition: "all 0.2s ease",
                    "&:hover": {
                      boxShadow: "0 2px 6px rgba(0,0,0,0.15)",
                      borderColor: "#cbd5e1",
                    },
                  }}
                >
                  {/* Lesson Header */}
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "flex-start",
                      gap: isSmallMobile ? 0.75 : 1,
                      mb: isSmallMobile ? 1 : 1.5,
                    }}
                  >
                    <FaBook
                      size={isSmallMobile ? 14 : isMobile ? 16 : 18}
                      style={{
                        color: "#3949ab",
                        marginTop: isSmallMobile ? "2px" : "3px",
                        flexShrink: 0,
                      }}
                    />
                    <Typography
                      variant="subtitle1"
                      sx={{
                        fontWeight: 600,
                        fontSize: isSmallMobile
                          ? "0.875rem"
                          : isMobile
                          ? "0.9375rem"
                          : "1rem",
                        color: "#1e293b",
                        lineHeight: 1.4,
                        wordBreak: "break-word",
                      }}
                    >
                      {lesson.title}
                    </Typography>
                  </Box>

                  {/* Lesson Description */}
                  <Typography
                    variant="body2"
                    sx={{
                      mb: isSmallMobile ? 1 : 1.5,
                      color: "#374151",
                      fontSize: isSmallMobile
                        ? "0.75rem"
                        : isMobile
                        ? "0.8125rem"
                        : "0.875rem",
                      lineHeight: 1.5,
                      wordBreak: "break-word",
                    }}
                  >
                    {lesson.description}
                  </Typography>

                  {/* Lesson Footer */}
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: isMobile ? "flex-start" : "center",
                      flexDirection: isMobile ? "column" : "row",
                      gap: isMobile ? 0.5 : 0,
                      pt: isSmallMobile ? 1 : 1.5,
                      borderTop: "1px solid #e2e8f0",
                    }}
                  >
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 0.5,
                      }}
                    >
                      <FaCalendarAlt
                        size={isSmallMobile ? 10 : isMobile ? 12 : 14}
                        style={{ color: "#64748b" }}
                      />
                      <Typography
                        sx={{
                          color: "#64748b",
                          fontSize: isSmallMobile
                            ? "0.6875rem"
                            : isMobile
                            ? "0.75rem"
                            : "0.8125rem",
                          fontWeight: 500,
                        }}
                      >
                        Class Date:{" "}
                        {format(new Date(lesson.classDate), "dd/MM/yyyy")}
                      </Typography>
                    </Box>

                    {/* Lesson Index */}
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        px: isSmallMobile ? 0.75 : 1,
                        py: isSmallMobile ? 0.25 : 0.5,
                        backgroundColor: "#e0f2fe",
                        borderRadius: "12px",
                        alignSelf: isMobile ? "flex-start" : "auto",
                      }}
                    >
                      <Typography
                        sx={{
                          color: "#0369a1",
                          fontSize: isSmallMobile
                            ? "0.6875rem"
                            : isMobile
                            ? "0.75rem"
                            : "0.8125rem",
                          fontWeight: 600,
                        }}
                      >
                        Lesson #{index + 1}
                      </Typography>
                    </Box>
                  </Box>

                  {/* Optional: Lesson remarks if available */}
                  {lesson.remarks && (
                    <Box
                      sx={{
                        mt: isSmallMobile ? 1 : 1.5,
                        p: isSmallMobile ? 1 : 1.5,
                        backgroundColor: "#f1f5f9",
                        borderRadius: "4px",
                        border: "1px solid #e2e8f0",
                      }}
                    >
                      <Typography
                        sx={{
                          color: "#64748b",
                          fontSize: isSmallMobile
                            ? "0.6875rem"
                            : isMobile
                            ? "0.75rem"
                            : "0.8125rem",
                          fontStyle: "italic",
                        }}
                      >
                        💭 Remarks: {lesson.remarks}
                      </Typography>
                    </Box>
                  )}
                </Box>
              ))}

              {/* Empty State */}
              {filteredLessons.length === 0 && !loading && (
                <Box
                  sx={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    py: isSmallMobile ? 4 : isMobile ? 6 : 8,
                    gap: 2,
                  }}
                >
                  <Box
                    sx={{
                      width: isSmallMobile ? 48 : isMobile ? 56 : 64,
                      height: isSmallMobile ? 48 : isMobile ? 56 : 64,
                      borderRadius: "50%",
                      backgroundColor: "#f1f5f9",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      mb: 1,
                    }}
                  >
                    <FaBook
                      size={isSmallMobile ? 20 : isMobile ? 24 : 28}
                      style={{ color: "#94a3b8" }}
                    />
                  </Box>
                  <Typography
                    sx={{
                      textAlign: "center",
                      color: "#64748b",
                      fontSize: isSmallMobile
                        ? "0.875rem"
                        : isMobile
                        ? "0.9375rem"
                        : "1rem",
                      fontWeight: 500,
                    }}
                  >
                    📚 No lessons found
                  </Typography>
                  <Typography
                    sx={{
                      textAlign: "center",
                      color: "#94a3b8",
                      fontSize: isSmallMobile
                        ? "0.75rem"
                        : isMobile
                        ? "0.8125rem"
                        : "0.875rem",
                      maxWidth: "280px",
                    }}
                  >
                    {dateRange[0] && dateRange[1]
                      ? "Try adjusting your date range filter"
                      : "No lessons have been added for this student yet"}
                  </Typography>
                </Box>
              )}

              {/* Summary */}
              {filteredLessons.length > 0 && (
                <Box
                  sx={{
                    mt: isSmallMobile ? 2 : isMobile ? 2.5 : 3,
                    p: isSmallMobile ? 1.5 : isMobile ? 2 : 2,
                    backgroundColor: "#f0f9ff",
                    borderRadius: isSmallMobile ? "6px" : "8px",
                    border: "1px solid #bae6fd",
                  }}
                >
                  <Typography
                    sx={{
                      textAlign: "center",
                      color: "#0369a1",
                      fontSize: isSmallMobile
                        ? "0.75rem"
                        : isMobile
                        ? "0.8125rem"
                        : "0.875rem",
                      fontWeight: 500,
                    }}
                  >
                    📊 Total Lessons: {filteredLessons.length}
                    {dateRange[0] && dateRange[1] && (
                      <>
                        {" "}
                        ({format(dateRange[0], "dd/MM")} -{" "}
                        {format(dateRange[1], "dd/MM")})
                      </>
                    )}
                  </Typography>
                </Box>
              )}
            </>
          )}
        </Box>

        {/* Notification */}
        <NotificationSnackbar
          notification={notification}
          onClose={closeNotification}
        />
      </Box>
    </Modal>
  );
};

export default ViewTeacherLessonModal;
