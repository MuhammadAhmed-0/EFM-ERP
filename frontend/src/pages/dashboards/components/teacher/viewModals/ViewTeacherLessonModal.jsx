import  { useState, useEffect } from "react";
import { Box, Button, Typography, Modal } from "@mui/material";
import ReactDatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { format } from "date-fns";
import { FaFilter } from "react-icons/fa";
import axios from "axios";
import { getModalStyles } from "../../../../../styles/modal/commonModalStyles";
import useNotification from "../../../../../hooks/useNotification";
import NotificationSnackbar from "../../../../../components/common/NotificationSnackbar";
const customStyles = {
  dateInputWrapper: {
    position: "relative",
    width: "100%",
  },
  filterIcon: {
    position: "absolute",
    left: "12px",
    top: "50%",
    transform: "translateY(-50%)",
    color: "#64748b",
    zIndex: 1,
  },
  dateInput: {
    width: "100%",
    padding: "8px 12px 8px 36px",
    border: "1px solid #e2e8f0",
    borderRadius: "6px",
    fontSize: "0.875rem",
    color: "#475569",
    backgroundColor: "white",
  },
};

const ViewTeacherLessonModal = ({ schedule, open, onClose }) => {
  const [dateRange, setDateRange] = useState([null, null]);
  const [lessons, setLessons] = useState([]);
  const [loading, setLoading] = useState(false);
  const { notification, showNotification, closeNotification } =
    useNotification();
  const BASE_URL = import.meta.env.VITE_BASE_URL;

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
      <Box sx={getModalStyles()}>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mb: 3,
          }}
        >
          <Typography variant="h6">
            Lessons for {lessons.studentName} - {lessons.subjectName}
          </Typography>
          <Button onClick={handleClose}>×</Button>
        </Box>

        <Box sx={{ mb: 3, width: "100%" }}>
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
                  placeholder="Filter by date range"
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

        {loading ? (
          <Typography sx={{ textAlign: "center", color: "#64748b" }}>
            Loading lessons...
          </Typography>
        ) : (
          <>
            {filteredLessons.map((lesson, index) => (
              <Box
                key={index}
                sx={{
                  mb: 2,
                  p: 2,
                  border: "1px solid #e2e8f0",
                  borderRadius: "8px",
                  bgcolor: "#f8fafc",
                }}
              >
                <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
                  {lesson.title}
                </Typography>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  {lesson.description}
                </Typography>
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    color: "#64748b",
                    fontSize: "0.875rem",
                    mt: 1,
                  }}
                >
                  <span>
                    Class Date:{" "}
                    {format(new Date(lesson.classDate), "dd/MM/yyyy")}
                  </span>
                </Box>
              </Box>
            ))}

            {filteredLessons.length === 0 && (
              <Typography sx={{ textAlign: "center", color: "#64748b" }}>
                No lessons found
              </Typography>
            )}
          </>
        )}
        <NotificationSnackbar
          notification={notification}
          onClose={closeNotification}
        />
      </Box>
    </Modal>
  );
};

export default ViewTeacherLessonModal;
