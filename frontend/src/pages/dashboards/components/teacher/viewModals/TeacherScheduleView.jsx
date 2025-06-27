import React, { useState, useEffect } from "react";
import {
  FaSearch,
  FaFilter,
  FaEye,
  FaBook,
  FaChevronDown,
  FaChevronUp,
  FaUserClock,
  FaClock,
  FaHistory,
} from "react-icons/fa";
import {
  Box,
  Select,
  MenuItem,
  Button,
  Modal,
  Grid,
  IconButton,
  Typography,
  TextField,
  CircularProgress,
} from "@mui/material";
import ReactDatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { format } from "date-fns";
import axios from "axios";
import TeacherViewScheduleModal from "../TeacherViewScheduleModal";
import "../../../../../styles/components/Management.css";
import "../../../../../styles/components/AccordianTeacher.css";
import ViewTeacherLessonModal from "./ViewTeacherLessonModal";
import useNotification from "../../../../../hooks/useNotification";
import NotificationSnackbar from "../../../../../components/common/NotificationSnackbar";
import SyncButton from "../../../../../components/common/SyncButton";
const SESSION_STATUS = {
  PENDING: "pending",
  IN_PROGRESS: "in_progress",
  COMPLETED: "completed",
  AVAILABLE: "available",
  ABSENT: "absent",
  LEAVE: "leave",
};
const commonStyles = {
  fontFamily:
    "'Poppins', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
};

const buttonStyles = {
  available: {
    backgroundColor: "#0ea5e9",
    color: "white",
    "&:hover": {
      backgroundColor: "#0284c7",
    },
  },
  start: {
    backgroundColor: "#22c55e",
    color: "white",
    "&:hover": {
      backgroundColor: "#16a34a",
    },
  },
  end: {
    backgroundColor: "#ef4444",
    color: "white",
    "&:hover": {
      backgroundColor: "#dc2626",
    },
  },
  leave: {
    backgroundColor: "#f97316",
    color: "white",
    "&:hover": {
      backgroundColor: "#ea580c",
    },
  },
  update: {
    backgroundColor: "#6366f1",
    color: "white",
    "&:hover": {
      backgroundColor: "#4f46e5",
    },
  },
};

const TeacherScheduleView = () => {
  const [schedules, setSchedules] = useState([]);
  const [filteredSchedules, setFilteredSchedules] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isSyncing, setIsSyncing] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [dateRange, setDateRange] = useState([null, null]);
  const [timeRange, setTimeRange] = useState({ start: "", end: "" });
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState(null);
  const [expandedRow, setExpandedRow] = useState(null);
  const [attendanceStates, setAttendanceStates] = useState({});
  const [attendanceRemarks, setAttendanceRemarks] = useState({});
  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState("all");
  const [showLessonsModal, setShowLessonsModal] = useState(false);
  const [showActiveStudentSchedules, setShowActiveStudentSchedules] =
    useState(false);
  const [showInactiveStudentSchedules, setShowInactiveStudentSchedules] =
    useState(false);
  const [selectedLessonSchedule, setSelectedLessonSchedule] = useState(null);
  const [lessonInput, setLessonInput] = useState({
    title: "",
    description: "",
  });
  const { notification, showNotification, closeNotification } =
    useNotification();

  const BASE_URL = import.meta.env.VITE_BASE_URL;

  const isAttendanceMarked = (student) => {
    return (
      student.attendance?.status && student.attendance.status !== "not_marked"
    );
  };
  const calculateFilteredSessionStats = (filteredSchedules) => {
    const pending = filteredSchedules.filter(
      (schedule) => schedule.sessionStatus === SESSION_STATUS.PENDING
    ).length;

    const in_progress = filteredSchedules.filter(
      (schedule) => schedule.sessionStatus === SESSION_STATUS.IN_PROGRESS
    ).length;

    const today = new Date();
    const todayString = format(today, "yyyy-MM-dd");

    const todaysClasses = filteredSchedules.filter((schedule) => {
      try {
        if (!schedule.classDate) return false;

        let scheduleDateString;
        if (typeof schedule.classDate === "string") {
          if (schedule.classDate.includes("T")) {
            scheduleDateString = schedule.classDate.split("T")[0];
          } else if (schedule.classDate.match(/^\d{2}\/\d{2}\/\d{4}$/)) {
            const [day, month, year] = schedule.classDate.split("/");
            scheduleDateString = `${year}-${month.padStart(
              2,
              "0"
            )}-${day.padStart(2, "0")}`;
          } else if (schedule.classDate.match(/^\d{2}-\d{2}-\d{4}$/)) {
            const [day, month, year] = schedule.classDate.split("-");
            scheduleDateString = `${year}-${month.padStart(
              2,
              "0"
            )}-${day.padStart(2, "0")}`;
          } else if (schedule.classDate.match(/^\d{4}-\d{2}-\d{2}$/)) {
            scheduleDateString = schedule.classDate;
          } else {
            const date = new Date(schedule.classDate);
            scheduleDateString = format(date, "yyyy-MM-dd");
          }
        } else {
          const date = new Date(schedule.classDate);
          scheduleDateString = format(date, "yyyy-MM-dd");
        }

        return scheduleDateString === todayString;
      } catch (error) {
        console.error("Error comparing dates in stats:", error);
        return false;
      }
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

  const calculateAttendanceStats = (filteredSchedules) => {
    const totalStudentAttendances = filteredSchedules.reduce(
      (total, schedule) => {
        return total + (schedule.studentDetails?.length || 0);
      },
      0
    );

    const presentCount = filteredSchedules.reduce((total, schedule) => {
      return (
        total +
        (schedule.studentDetails?.filter(
          (student) => student.attendance?.status === "present"
        )?.length || 0)
      );
    }, 0);

    const absentCount = filteredSchedules.reduce((total, schedule) => {
      return (
        total +
        (schedule.studentDetails?.filter(
          (student) => student.attendance?.status === "absent"
        )?.length || 0)
      );
    }, 0);

    const leaveCount = filteredSchedules.reduce((total, schedule) => {
      return (
        total +
        (schedule.studentDetails?.filter(
          (student) => student.attendance?.status === "leave"
        )?.length || 0)
      );
    }, 0);

    return {
      totalStudentAttendances,
      presentCount,
      absentCount,
      leaveCount,
    };
  };
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString("en-GB", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };
  const formatTableDate = (dateString) => {
    try {
      if (!dateString) return "";

      if (dateString instanceof Date) {
        return format(dateString, "dd/MM/yyyy");
      }

      if (typeof dateString === "string") {
        if (dateString.match(/^\d{4}-\d{2}-\d{2}/)) {
          const [year, month, day] = dateString.split("-");
          return `${day}/${month}/${year}`;
        }
        if (dateString.match(/^\d{2}-\d{2}-\d{4}$/)) {
          const [day, month, year] = dateString.split("-");
          return `${day}/${month}/${year}`;
        }
      }
      const date = new Date(dateString);
      if (!isNaN(date.getTime())) {
        return format(date, "dd/MM/yyyy");
      }

      return "Not available";
    } catch (error) {
      console.error("Error formatting date:", error);
      return "Not available";
    }
  };

  const convertTo12Hour = (time) => {
    if (!time) return "";
    const [hours, minutes] = time.split(":");
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? "PM" : "AM";
    const hour12 = hour % 12 || 12;
    return `${hour12.toString().padStart(2, "0")}:${minutes} ${ampm}`;
  };

  const handleAttendanceChange = (scheduleId, studentIndex, value) => {
    setAttendanceStates((prev) => ({
      ...prev,
      [`${scheduleId}-${studentIndex}`]: value,
    }));
  };

  const groupStudentsByClient = (schedule) => {
    const clientGroups = {};

    schedule.studentDetails.forEach((detail, index) => {
      const clientKey = detail.clientId.customId;

      if (!clientGroups[clientKey]) {
        clientGroups[clientKey] = {
          clientName: detail.clientName,
          clientId: detail.clientId,
          clientIsActive: detail.clientIsActive,
          students: [],
          parentNames: [],
        };
      }

      clientGroups[clientKey].students.push({
        name: schedule.studentNames[index],
        studentId: detail.studentId,
        studentIsActive: detail.studentIsActive,
        attendance: detail.attendance,
        userId: schedule.students[index],
      });

      if (
        detail.parentName &&
        !clientGroups[clientKey].parentNames.includes(detail.parentName)
      ) {
        clientGroups[clientKey].parentNames.push(detail.parentName);
      }
    });

    return Object.values(clientGroups);
  };
  const fetchStudents = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(
        `${BASE_URL}/api/teachers/their-students`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setStudents(response.data.students || []);
    } catch (error) {
      showNotification(
        error.response?.data?.message || "Error fetching students",
        "error"
      );
    }
  };

  const handleTeacherAvailable = async (schedule) => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.post(
        `${BASE_URL}/api/schedules/available/${schedule._id}`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.data) {
        fetchSchedules();
        showNotification("Marked as available successfully");
      }
    } catch (error) {
      showNotification(
        error.response?.data?.message || "Error marking as available",
        "error"
      );
    }
  };

  const handleStartClass = async (schedule) => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.post(
        `${BASE_URL}/api/schedules/start/${schedule._id}`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.data) {
        fetchSchedules();
        showNotification("Class started successfully");
      }
    } catch (error) {
      showNotification(
        error.response?.data?.message || "Error starting class",
        "error"
      );
    }
  };

  const handleEndClass = async (schedule) => {
    try {
      const hasUnmarkedAttendance = schedule.studentDetails.some(
        (student) =>
          student.attendance?.status === "not_marked" || !student.attendance
      );
      if (hasUnmarkedAttendance) {
        showNotification(
          "Please mark attendance for all students before ending the class",
          "error"
        );
        return;
      }

      const token = localStorage.getItem("token");
      const latestScheduleResponse = await axios.get(
        `${BASE_URL}/api/schedules/${schedule._id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const latestSchedule = latestScheduleResponse.data.schedule;
      const hasNoLessons =
        !latestSchedule.lessons || latestSchedule.lessons.length === 0;

      if (hasNoLessons) {
        showNotification(
          "Please add lesson details before ending the class",
          "error"
        );
        return;
      }

      const hasIncompleteLesson = latestSchedule.lessons.some(
        (lesson) => !lesson.title || !lesson.description
      );
      if (hasIncompleteLesson) {
        showNotification(
          "Please complete lesson details (title and description) before ending the class",
          "error"
        );
        return;
      }

      const response = await axios.post(
        `${BASE_URL}/api/schedules/end/${schedule._id}`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data) {
        fetchSchedules();
        showNotification("Class ended successfully");
      }
    } catch (error) {
      showNotification(
        error.response?.data?.message || "Error ending class",
        "error"
      );
    }
  };

  const handleUpdateAttendance = async (
    scheduleId,
    studentUserId,
    status,
    remarks = ""
  ) => {
    if (!status) {
      showNotification("Please select an attendance status", "error");
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const response = await axios.post(
        `${BASE_URL}/api/student-attendance/mark`,
        {
          scheduleId,
          studentUserId,
          status,
          remarks,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.data) {
        fetchSchedules();
        showNotification("Attendance updated successfully");
      }
    } catch (error) {
      showNotification(
        error.response?.data?.message || "Error updating attendance",
        "error"
      );
    }
  };

  const fetchSchedules = async (showSuccessMessage = false) => {
    setIsSyncing(true);
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(
        `${BASE_URL}/api/schedules/teacher/my-schedule`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
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
    }
  };

  const handleLeaveStudent = async (schedule) => {
    try {
      if (
        schedule.studentDetails.some((student) => isAttendanceMarked(student))
      ) {
        showNotification(
          "Attendance already marked for some students",
          "warning"
        );
        return;
      }

      const promises = schedule.students.map((studentId) =>
        handleUpdateAttendance(schedule._id, studentId, "leave", "")
      );

      await Promise.all(promises);
      showNotification("All students marked as leave successfully");
      fetchSchedules();
    } catch (error) {
      showNotification("Error marking students as leave", "error");
    }
  };

  const handleLessonUpdate = async (scheduleId) => {
    try {
      const token = localStorage.getItem("token");
      await axios.put(
        `${BASE_URL}/api/schedules/lessons/${scheduleId}`,
        {
          lessons: [
            {
              title: lessonInput.title,
              description: lessonInput.description,
              status: "in-progress",
              remarks: "",
            },
          ],
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      showNotification("Lesson updated successfully");
    } catch (error) {
      showNotification(
        error.response?.data?.message || "Error updating lesson",
        "error"
      );
    }
  };

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      showNotification("Authentication required", "error");
      return;
    }
    axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    fetchSchedules();
    fetchStudents();
  }, []);

  useEffect(() => {
    let filtered = [...schedules];

    filtered.sort((a, b) => {
      const statusPriority = {
        in_progress: 0,
        pending: 1,
        available: 2,
        completed: 3,
        absent: 4,
        leave: 5,
      };
      return (
        statusPriority[a.sessionStatus.toLowerCase()] -
        statusPriority[b.sessionStatus.toLowerCase()]
      );
    });
    if (!dateRange[0] && !dateRange[1]) {
      const today = new Date();
      const todayString = format(today, "yyyy-MM-dd");
      filtered = filtered.filter((schedule) => {
        try {
          if (!schedule.classDate) return false;

          let scheduleDateString;
          if (typeof schedule.classDate === "string") {
            if (schedule.classDate.includes("T")) {
              scheduleDateString = schedule.classDate.split("T")[0];
            } else if (schedule.classDate.match(/^\d{2}\/\d{2}\/\d{4}$/)) {
              const [day, month, year] = schedule.classDate.split("/");
              scheduleDateString = `${year}-${month.padStart(
                2,
                "0"
              )}-${day.padStart(2, "0")}`;
            } else if (schedule.classDate.match(/^\d{2}-\d{2}-\d{4}$/)) {
              const [day, month, year] = schedule.classDate.split("-");
              scheduleDateString = `${year}-${month.padStart(
                2,
                "0"
              )}-${day.padStart(2, "0")}`;
            } else if (schedule.classDate.match(/^\d{4}-\d{2}-\d{2}$/)) {
              scheduleDateString = schedule.classDate;
            } else {
              const date = new Date(schedule.classDate);
              if (!isNaN(date.getTime())) {
                scheduleDateString = format(date, "yyyy-MM-dd");
              }
            }
          } else {
            const date = new Date(schedule.classDate);
            if (!isNaN(date.getTime())) {
              scheduleDateString = format(date, "yyyy-MM-dd");
            }
          }

          const isToday = scheduleDateString === todayString;

          return isToday;
        } catch (error) {
          console.error(
            "Error comparing dates for schedule:",
            schedule._id,
            error
          );
          return false;
        }
      });
    }

    if (searchTerm) {
      const isNumericSearch = /^\d+$/.test(searchTerm);
      filtered = filtered.filter(
        (schedule) =>
          schedule.subjectName
            .toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          schedule.studentNames.some((name) =>
            name.toLowerCase().includes(searchTerm.toLowerCase())
          ) ||
          schedule.studentDetails.some((detail) =>
            detail.clientName.toLowerCase().includes(searchTerm.toLowerCase())
          ) ||
          schedule.studentDetails.some((detail) =>
            detail.clientId.customId
              .toLowerCase()
              .includes(searchTerm.toLowerCase())
          ) ||
          schedule.studentDetails.some((detail) =>
            detail.clientId.customId
              .toLowerCase()
              .includes(searchTerm.toLowerCase())
          ) ||
          (isNumericSearch &&
            schedule.studentDetails.some(
              (detail) =>
                detail.studentId &&
                detail.studentId.toString().includes(searchTerm)
            ))
      );
    }

    if (selectedStudent !== "all") {
      filtered = filtered.filter((schedule) =>
        schedule.students.includes(selectedStudent)
      );
    }

    if (selectedStatus !== "all") {
      filtered = filtered.filter(
        (schedule) => schedule.sessionStatus === selectedStatus
      );
    }

    if (dateRange[0] && dateRange[1]) {
      filtered = filtered.filter((schedule) => {
        try {
          let scheduleDate;
          if (
            typeof schedule.classDate === "string" &&
            schedule.classDate.match(/^\d{2}-\d{2}-\d{4}$/)
          ) {
            const [day, month, year] = schedule.classDate.split("-");
            scheduleDate = new Date(`${year}-${month}-${day}`);
          } else {
            scheduleDate = new Date(schedule.classDate);
          }

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
        const getMinutes = (timeStr) => {
          const [hours, minutes] = timeStr.split(":").map(Number);
          return hours * 60 + minutes;
        };

        const filterStart = getMinutes(timeRange.start);
        const filterEnd = getMinutes(timeRange.end);
        const classStart = getMinutes(schedule.startTime);
        const classEnd = getMinutes(schedule.endTime);

        return classStart >= filterStart && classEnd <= filterEnd;
      });
    }
    if (showActiveStudentSchedules && !showInactiveStudentSchedules) {
      filtered = filtered.filter((schedule) => {
        return (
          !schedule.studentNames?.some((name) =>
            name.includes("(Inactive Student)")
          ) &&
          schedule.studentDetails?.every(
            (detail) => detail.studentIsActive !== false
          )
        );
      });
    } else if (!showActiveStudentSchedules && showInactiveStudentSchedules) {
      filtered = filtered.filter((schedule) => {
        return (
          schedule.studentNames?.some((name) =>
            name.includes("(Inactive Student)")
          ) ||
          schedule.studentDetails?.some(
            (detail) => detail.studentIsActive === false
          )
        );
      });
    }
    setFilteredSchedules(filtered);
  }, [
    schedules,
    searchTerm,
    selectedStatus,
    dateRange,
    timeRange,
    selectedStudent,
    showActiveStudentSchedules,
    showInactiveStudentSchedules,
  ]);

  return (
    <div className="management-container">
      <div className="management-header">
        <div>
          <h2>My Class Schedule</h2>
          <p className="total-count">
            {filteredSchedules.length} Total Schedules
          </p>
        </div>
        <div className="header-buttons">
          <SyncButton
            isSyncing={isSyncing}
            onClick={() => fetchSchedules(true)}
          />
        </div>
      </div>
      <div className="stats-cards">
        <div className="stat-card today-present">
          <h3>Today's Classes</h3>
          <p>
            {calculateFilteredSessionStats(filteredSchedules).todaysClasses}
          </p>
        </div>
        <div className="stat-card total-present">
          <h3>Pending Classes</h3>
          <p>{calculateFilteredSessionStats(filteredSchedules).pending}</p>
        </div>
        <div className="stat-card absent">
          <h3>Active Classes</h3>
          <p>{calculateFilteredSessionStats(filteredSchedules).in_progress}</p>
        </div>
        <div className="stat-card leave">
          <h3>Completed Classes</h3>
          <p>{calculateFilteredSessionStats(filteredSchedules).completed}</p>
        </div>
      </div>

      <div className="stats-cards">
        <div className="stat-card today-present">
          <h3>Total Attendance</h3>
          <p>
            {
              calculateAttendanceStats(filteredSchedules)
                .totalStudentAttendances
            }
          </p>
        </div>
        <div className="stat-card total-present">
          <h3>Present</h3>
          <p>{calculateAttendanceStats(filteredSchedules).presentCount}</p>
        </div>
        <div className="stat-card absent">
          <h3>Absent Sessions</h3>
          <p>{calculateFilteredSessionStats(filteredSchedules).absent}</p>
        </div>
        <div className="stat-card leave">
          <h3>Leave Sessions</h3>
          <p>{calculateFilteredSessionStats(filteredSchedules).leave}</p>
        </div>
      </div>
      <div className="filter-section">
        <div className="search-box">
          <FaSearch className="search-icon" />
          <input
            type="text"
            placeholder="Search by Student Name/ID, Subject"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
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
            value={selectedStudent}
            onChange={(e) => setSelectedStudent(e.target.value)}
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
                {student.studentId} - {student.name}
              </MenuItem>
            ))}
          </Select>
        </div>
        <div className="filter-box">
          <FaFilter className="filter-icon" />
          <Select
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
            setDateRange([null, null]);
            setSearchTerm("");
            setTimeRange({ start: "", end: "" });
            setShowActiveStudentSchedules(false);
            setShowInactiveStudentSchedules(false);
          }}
        >
          Clear Filters
        </button>
      </div>

      <div className="table-container">
        {isSyncing ? (
          <div className="loading-container">
            <CircularProgress />
          </div>
        ) : filteredSchedules.length > 0 ? (
          <table>
            <thead>
              <tr>
                <th>Client</th>
                <th>Student</th>
                <th>Subject</th>
                <th>Slot</th>
                <th>
                  Attendance <br /> Status
                </th>
                <th>
                  Session <br /> Status
                </th>
                <th>Actions</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filteredSchedules.map((schedule) => (
                <React.Fragment key={schedule._id}>
                  <tr
                    className={
                      expandedRow === schedule._id ? "expanded-row" : ""
                    }
                  >
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
                            <div style={{ fontWeight: "500", color: "black" }}>
                              {group.clientName}
                            </div>
                            <span
                              style={{
                                fontSize: "0.7rem",
                                fontWeight: "500",
                                color: group.clientIsActive
                                  ? "#22c55e"
                                  : "#dc2626",
                                backgroundColor: group.clientIsActive
                                  ? "#dcfce7"
                                  : "#fee2e2",
                                padding: "2px 6px",
                                borderRadius: "4px",
                              }}
                            >
                              {group.clientIsActive
                                ? "Active Client"
                                : "Inactive Client"}
                            </span>

                            <div
                              style={{
                                color: "#64748b",
                                fontSize: "0.75rem",
                                marginTop: "2px",
                              }}
                            >
                              ID: {group.clientId.customId}
                            </div>
                            {group.parentNames.length > 0 && (
                              <div
                                style={{
                                  color: "#64748b",
                                  fontSize: "0.7rem",
                                  marginTop: "2px",
                                  fontStyle: "italic",
                                }}
                              >
                                Parents: ({group.parentNames.join(", ")})
                              </div>
                            )}
                          </div>
                        )
                      )}
                    </td>
                    <td>
                      {groupStudentsByClient(schedule).map(
                        (group, groupIndex) => (
                          <div
                            key={`student-group-${groupIndex}`}
                            style={{
                              marginBottom:
                                groupIndex !==
                                groupStudentsByClient(schedule).length - 1
                                  ? "8px"
                                  : "0",
                            }}
                          >
                            {group.students.length === 1 ? (
                              <div>
                                <div
                                  style={{ fontWeight: "500", color: "black" }}
                                >
                                  {group.students[0].name.replace(
                                    " (Inactive Student)",
                                    ""
                                  )}
                                </div>
                                {!group.students[0].studentIsActive && (
                                  <div
                                    style={{
                                      color: "#dc2626",
                                      fontSize: "0.75rem",
                                      fontWeight: "500",
                                      marginTop: "2px",
                                    }}
                                  >
                                    (Inactive Student)
                                  </div>
                                )}
                                <div
                                  style={{
                                    color: "#64748b",
                                    fontSize: "0.75rem",
                                    marginTop: "2px",
                                  }}
                                >
                                  ID: {group.students[0].studentId}
                                </div>
                              </div>
                            ) : (
                              <div>
                                {group.students.map((student, studentIndex) => (
                                  <div
                                    key={`student-${studentIndex}`}
                                    style={{
                                      marginBottom:
                                        studentIndex !==
                                        group.students.length - 1
                                          ? "6px"
                                          : "0",
                                    }}
                                  >
                                    <div
                                      style={{
                                        fontWeight: "500",
                                        color: "black",
                                      }}
                                    >
                                      {student.name.replace(
                                        " (Inactive Student)",
                                        ""
                                      )}
                                    </div>
                                    {!student.studentIsActive && (
                                      <div
                                        style={{
                                          color: "#dc2626",
                                          fontSize: "0.75rem",
                                          fontWeight: "500",
                                          marginTop: "2px",
                                        }}
                                      >
                                        (Inactive Student)
                                      </div>
                                    )}
                                    <div
                                      style={{
                                        color: "#64748b",
                                        fontSize: "0.75rem",
                                        marginTop: "2px",
                                      }}
                                    >
                                      ID: {student.studentId}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )
                      )}
                    </td>
                    <td style={{ fontWeight: "500" }}>
                      {schedule.subjectName}
                    </td>
                    <td>
                      <div style={{ fontWeight: "500" }}>{schedule.day}</div>
                      <span style={{ color: "#64748b", fontSize: "0.8125rem" }}>
                        {convertTo12Hour(schedule.startTime)} <br />
                        {convertTo12Hour(schedule.endTime)}
                      </span>
                      <div style={{ color: "#64748b", fontSize: "0.8125rem" }}>
                        {schedule.classDate
                          ? formatTableDate(schedule.classDate)
                          : "Not available"}
                      </div>
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
                                key={`attendance-status-${studentIndex}`}
                                style={{
                                  marginBottom:
                                    studentIndex !== group.students.length - 1
                                      ? "4px"
                                      : "0",
                                  display: "flex",
                                  alignItems: "center",
                                  gap: "4px",
                                }}
                              >
                                {group.students.length > 1 && (
                                  <span
                                    style={{
                                      fontSize: "0.7rem",
                                      color: "#64748b",
                                      minWidth: "60px",
                                    }}
                                  >
                                    {student.name}:
                                  </span>
                                )}
                                <span
                                  style={{
                                    display: "inline-block",
                                    padding: "4px 10px",
                                    fontSize: "0.75rem",
                                    fontWeight: 500,
                                    borderRadius: "5px",
                                    textTransform: "capitalize",
                                    color:
                                      (student.attendance?.status ===
                                        "present" &&
                                        "#15803d") ||
                                      (student.attendance?.status ===
                                        "absent" &&
                                        "#991b1b") ||
                                      (student.attendance?.status === "leave" &&
                                        "#b45309") ||
                                      (student.attendance?.status === "late" &&
                                        "#be123c") ||
                                      (student.attendance?.status ===
                                        "pending" &&
                                        "#92400e") ||
                                      "#475569",
                                    backgroundColor:
                                      (student.attendance?.status ===
                                        "present" &&
                                        "#dcfce7") ||
                                      (student.attendance?.status ===
                                        "absent" &&
                                        "#fee2e2") ||
                                      (student.attendance?.status === "leave" &&
                                        "#fef3c7") ||
                                      (student.attendance?.status === "late" &&
                                        "#fce7f3") ||
                                      (student.attendance?.status ===
                                        "pending" &&
                                        "#fde68a") ||
                                      "#f1f5f9",
                                  }}
                                >
                                  {student.attendance?.status
                                    ? student.attendance.status.replace(
                                        "_",
                                        " "
                                      )
                                    : "Not Marked"}
                                </span>
                              </div>
                            ))}
                          </div>
                        )
                      )}
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
                            (schedule.sessionStatus === "completed" &&
                              "#15803d") ||
                            (schedule.sessionStatus === "in_progress" &&
                              "#0f172a") ||
                            (schedule.sessionStatus === "pending" &&
                              "#92400e") ||
                            (schedule.sessionStatus === "available" &&
                              "#0369a1") ||
                            (schedule.sessionStatus === "absent" &&
                              "#dc2626") ||
                            (schedule.sessionStatus === "leave" && "#ea580c") ||
                            "#475569",
                          backgroundColor:
                            (schedule.sessionStatus === "completed" &&
                              "#dcfce7") ||
                            (schedule.sessionStatus === "in_progress" &&
                              "#e0f2fe") ||
                            (schedule.sessionStatus === "pending" &&
                              "#fef3c7") ||
                            (schedule.sessionStatus === "available" &&
                              "#e0f2fe") ||
                            (schedule.sessionStatus === "absent" &&
                              "#fee2e2") ||
                            (schedule.sessionStatus === "leave" && "#fed7aa") ||
                            "#f1f5f9",
                        }}
                      >
                        {schedule.sessionStatus.replace("_", " ")}
                      </span>
                    </td>
                    <td>
                      <div className="actions">
                        <button
                          onClick={() => {
                            setSelectedSchedule(schedule);
                            setShowViewModal(true);
                          }}
                          size="small"
                        >
                          <FaEye />
                        </button>
                        <button
                          onClick={() => {
                            setSelectedLessonSchedule(schedule);
                            setShowLessonsModal(true);
                          }}
                          size="small"
                        >
                          <FaBook />
                        </button>
                      </div>
                    </td>
                    <td>
                      <IconButton
                        onClick={() => {
                          const newExpandedRow =
                            expandedRow === schedule._id ? null : schedule._id;
                          setExpandedRow(newExpandedRow);
                          if (
                            newExpandedRow &&
                            schedule.lessons &&
                            schedule.lessons[0]
                          ) {
                            setLessonInput({
                              title: schedule.lessons[0].title,
                              description: schedule.lessons[0].description,
                            });
                          } else {
                            setLessonInput({ title: "", description: "" });
                          }
                        }}
                        size="small"
                        sx={{
                          color: "#64748b",
                          "&:hover": {
                            backgroundColor: "#f1f5f9",
                          },
                        }}
                      >
                        {expandedRow === schedule._id ? (
                          <FaChevronUp />
                        ) : (
                          <FaChevronDown />
                        )}
                      </IconButton>
                    </td>
                  </tr>
                  {expandedRow === schedule._id && (
                    <tr className="expanded-content">
                      <td colSpan="6">
                        <Box
                          sx={{
                            p: 1,
                            ...commonStyles,
                            "& .MuiTypography-root": { ...commonStyles },
                            "& .MuiButton-root": { ...commonStyles },
                            "& .MuiSelect-root": { ...commonStyles },
                            "& .MuiTextField-root": { ...commonStyles },
                          }}
                        >
                          <Box sx={{ mb: 3 }}>
                            <Typography
                              variant="subtitle2"
                              sx={{ mb: 2, fontWeight: 600 }}
                            >
                              Actions
                            </Typography>

                            {schedule.sessionStatus === "absent" ||
                            schedule.sessionStatus === "leave" ? (
                              <Box
                                sx={{
                                  p: 2,
                                  backgroundColor: "#fef3c7",
                                  borderRadius: "8px",
                                  border: "1px solid #f59e0b",
                                  mb: 2,
                                }}
                              >
                                <Typography
                                  variant="body2"
                                  sx={{
                                    color: "#92400e",
                                    fontWeight: 500,
                                    textAlign: "center",
                                  }}
                                >
                                  This class is marked as{" "}
                                  {schedule.sessionStatus}. No actions
                                  available.
                                </Typography>
                              </Box>
                            ) : (
                              <Box
                                sx={{
                                  display: "flex",
                                  gap: 2,
                                  flexWrap: "wrap",
                                }}
                              >
                                <Button
                                  variant="contained"
                                  sx={buttonStyles.available}
                                  onClick={() =>
                                    handleTeacherAvailable(schedule)
                                  }
                                  disabled={
                                    schedule.sessionStatus !== "pending" ||
                                    schedule.teacherAvailableAt
                                  }
                                >
                                  {schedule.teacherAvailableAt
                                    ? "Already Available"
                                    : "I am Available"}
                                </Button>
                                <Button
                                  variant="contained"
                                  sx={buttonStyles.start}
                                  onClick={() => handleStartClass(schedule)}
                                  disabled={
                                    schedule.sessionStatus !== "available" ||
                                    schedule.classStartedAt
                                  }
                                >
                                  {schedule.classStartedAt
                                    ? "Class Started"
                                    : "Start Class"}
                                </Button>
                                <Button
                                  variant="contained"
                                  sx={buttonStyles.end}
                                  onClick={() => handleEndClass(schedule)}
                                  disabled={
                                    schedule.sessionStatus !== "in_progress"
                                  }
                                >
                                  End Class
                                </Button>
                                <Button
                                  variant="contained"
                                  sx={buttonStyles.leave}
                                  onClick={() => handleLeaveStudent(schedule)}
                                  disabled={
                                    schedule.sessionStatus === "completed" ||
                                    schedule.studentDetails.some((student) =>
                                      isAttendanceMarked(student)
                                    )
                                  }
                                >
                                  Leave Student
                                </Button>
                              </Box>
                            )}
                          </Box>
                          <Box sx={{ mb: 3 }}>
                            <Typography
                              variant="subtitle2"
                              sx={{
                                mb: 2,
                                fontWeight: 600,
                              }}
                            >
                              Timeline
                            </Typography>
                            <Grid container spacing={2}>
                              <Grid item xs={4}>
                                <Box
                                  sx={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 1,
                                  }}
                                >
                                  <FaUserClock
                                    size={16}
                                    style={{ color: "#1e40af" }}
                                  />
                                  <Box>
                                    <Typography
                                      variant="caption"
                                      sx={{
                                        color: "text.secondary",
                                      }}
                                    >
                                      Available At
                                    </Typography>
                                    <Typography
                                      sx={{
                                        color: "#1e40af",
                                        fontWeight: 600,
                                      }}
                                    >
                                      {schedule.teacherAvailableAt
                                        ? formatDate(
                                            schedule.teacherAvailableAt
                                          )
                                        : "Not available"}
                                    </Typography>
                                  </Box>
                                </Box>
                              </Grid>
                              <Grid item xs={4}>
                                <Box
                                  sx={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 1,
                                  }}
                                >
                                  <FaClock
                                    size={16}
                                    style={{ color: "#15803d" }}
                                  />
                                  <Box>
                                    <Typography
                                      variant="caption"
                                      sx={{ color: "text.secondary" }}
                                    >
                                      Started At
                                    </Typography>
                                    <Typography
                                      sx={{
                                        color: "#15803d",
                                        fontWeight: 600,
                                      }}
                                    >
                                      {schedule.classStartedAt
                                        ? formatDate(schedule.classStartedAt)
                                        : "Not available"}
                                    </Typography>
                                  </Box>
                                </Box>
                              </Grid>
                              <Grid item xs={4}>
                                <Box
                                  sx={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 1,
                                  }}
                                >
                                  <FaHistory
                                    size={16}
                                    style={{ color: "#166534" }}
                                  />
                                  <Box>
                                    <Typography
                                      variant="caption"
                                      sx={{ color: "text.secondary" }}
                                    >
                                      Ended At
                                    </Typography>
                                    <Typography
                                      sx={{
                                        color: "#166534",
                                        fontWeight: 600,
                                      }}
                                    >
                                      {schedule.classEndedAt
                                        ? formatDate(schedule.classEndedAt)
                                        : "Not available"}
                                    </Typography>
                                  </Box>
                                </Box>
                              </Grid>
                            </Grid>
                          </Box>

                          <Box sx={{ mb: 3 }}>
                            <Typography
                              variant="subtitle2"
                              sx={{ mb: 2, fontWeight: 600 }}
                            >
                              Mark Attendance
                            </Typography>
                            {schedule.sessionStatus === "absent" ||
                            schedule.sessionStatus === "leave" ? (
                              <Box
                                sx={{
                                  p: 2,
                                  backgroundColor: "#f1f5f9",
                                  borderRadius: "8px",
                                  border: "1px solid #cbd5e1",
                                }}
                              >
                                <Typography
                                  variant="body2"
                                  sx={{ color: "#64748b", textAlign: "center" }}
                                >
                                  Attendance cannot be modified for{" "}
                                  {schedule.sessionStatus} sessions.
                                </Typography>
                              </Box>
                            ) : (
                              schedule.studentDetails.map((student, index) => (
                                <Box
                                  key={index}
                                  sx={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 2,
                                    mb: 2,
                                  }}
                                >
                                  <Typography sx={{ minWidth: 150 }}>
                                    {schedule.studentNames[index]}
                                  </Typography>
                                  <Box
                                    sx={{
                                      display: "flex",
                                      gap: 2,
                                      alignItems: "flex-start",
                                    }}
                                  >
                                    <TextField
                                      size="small"
                                      value={
                                        attendanceStates[
                                          `${schedule._id}-${index}`
                                        ] ||
                                        student.attendance?.status ||
                                        "not_marked"
                                      }
                                      disabled={isAttendanceMarked(student)}
                                      sx={{
                                        minWidth: 120,
                                        ".MuiOutlinedInput-notchedOutline": {
                                          borderColor: "#e2e8f0",
                                        },
                                        "& .MuiInputBase-input": {
                                          color: isAttendanceMarked(student)
                                            ? "#64748b"
                                            : "#1f3d61",
                                          fontWeight: "500",
                                          textTransform: "capitalize",
                                          cursor: isAttendanceMarked(student)
                                            ? "not-allowed"
                                            : "default",
                                        },
                                        "& .MuiOutlinedInput-root": {
                                          backgroundColor: isAttendanceMarked(
                                            student
                                          )
                                            ? "#f8fafc"
                                            : "white",
                                        },
                                      }}
                                      label="Status"
                                      InputProps={{
                                        readOnly: true,
                                      }}
                                    />

                                    {!isAttendanceMarked(student) && (
                                      <Select
                                        value={
                                          attendanceStates[
                                            `${schedule._id}-${index}`
                                          ] || ""
                                        }
                                        onChange={(e) =>
                                          handleAttendanceChange(
                                            schedule._id,
                                            index,
                                            e.target.value
                                          )
                                        }
                                        size="small"
                                        displayEmpty
                                        sx={{
                                          minWidth: 120,
                                          ".MuiOutlinedInput-notchedOutline": {
                                            borderColor: "#e2e8f0",
                                          },
                                        }}
                                      >
                                        <MenuItem value="" disabled>
                                          Select Status
                                        </MenuItem>
                                        <MenuItem value="present">
                                          Present
                                        </MenuItem>
                                        <MenuItem value="absent">
                                          Absent
                                        </MenuItem>
                                        <MenuItem value="leave">Leave</MenuItem>
                                      </Select>
                                    )}

                                    <TextField
                                      size="small"
                                      placeholder="Add remarks..."
                                      value={
                                        attendanceRemarks[
                                          `${schedule._id}-${index}`
                                        ] ||
                                        student.attendance?.remarks ||
                                        ""
                                      }
                                      onChange={(e) =>
                                        setAttendanceRemarks((prev) => ({
                                          ...prev,
                                          [`${schedule._id}-${index}`]:
                                            e.target.value,
                                        }))
                                      }
                                      disabled={isAttendanceMarked(student)}
                                      sx={{
                                        minWidth: 200,
                                        ".MuiOutlinedInput-notchedOutline": {
                                          borderColor: "#e2e8f0",
                                        },
                                      }}
                                    />

                                    {!isAttendanceMarked(student) && (
                                      <Button
                                        variant="contained"
                                        size="medium"
                                        sx={buttonStyles.update}
                                        disabled={
                                          !attendanceStates[
                                            `${schedule._id}-${index}`
                                          ]
                                        }
                                        onClick={() =>
                                          handleUpdateAttendance(
                                            schedule._id,
                                            schedule.students[index],
                                            attendanceStates[
                                              `${schedule._id}-${index}`
                                            ],
                                            attendanceRemarks[
                                              `${schedule._id}-${index}`
                                            ] || ""
                                          )
                                        }
                                      >
                                        Update
                                      </Button>
                                    )}
                                  </Box>

                                  {isAttendanceMarked(student) && (
                                    <Typography
                                      variant="caption"
                                      sx={{
                                        ml: 2,
                                        color: "text.secondary",
                                        fontStyle: "italic",
                                      }}
                                    >
                                      Updated: {student.attendance.status}
                                      {student.attendance.markedAt &&
                                        ` (${formatDate(
                                          student.attendance.markedAt
                                        )})`}
                                    </Typography>
                                  )}
                                </Box>
                              ))
                            )}
                          </Box>
                          <Box>
                            <Typography
                              variant="subtitle2"
                              sx={{ mb: 2, fontWeight: 600 }}
                            >
                              Update Lesson
                            </Typography>

                            {schedule.sessionStatus === "absent" ||
                            schedule.sessionStatus === "leave" ? (
                              <Box
                                sx={{
                                  p: 2,
                                  backgroundColor: "#f1f5f9",
                                  borderRadius: "8px",
                                  border: "1px solid #cbd5e1",
                                }}
                              >
                                <Typography
                                  variant="body2"
                                  sx={{ color: "#64748b", textAlign: "center" }}
                                >
                                  Lesson updates are not available for{" "}
                                  {schedule.sessionStatus} sessions.
                                </Typography>
                              </Box>
                            ) : (
                              <Box
                                sx={{
                                  display: "flex",
                                  flexDirection: "column",
                                  gap: 2,
                                }}
                              >
                                <TextField
                                  size="small"
                                  fullWidth
                                  label="Lesson Title"
                                  placeholder="e.g., Lesson 1: Introduction to Physics"
                                  value={lessonInput.title}
                                  onChange={(e) =>
                                    setLessonInput((prev) => ({
                                      ...prev,
                                      title: e.target.value,
                                    }))
                                  }
                                  sx={{
                                    ".MuiOutlinedInput-notchedOutline": {
                                      borderColor: "#e2e8f0",
                                    },
                                  }}
                                />
                                <TextField
                                  multiline
                                  rows={3}
                                  fullWidth
                                  label="Lesson Description"
                                  placeholder="Enter detailed lesson description..."
                                  value={lessonInput.description}
                                  onChange={(e) =>
                                    setLessonInput((prev) => ({
                                      ...prev,
                                      description: e.target.value,
                                    }))
                                  }
                                  sx={{
                                    ".MuiOutlinedInput-notchedOutline": {
                                      borderColor: "#e2e8f0",
                                    },
                                  }}
                                />
                                <Box
                                  sx={{
                                    display: "flex",
                                    justifyContent: "flex-end",
                                  }}
                                >
                                  <Button
                                    variant="contained"
                                    sx={buttonStyles.update}
                                    onClick={() => {
                                      handleLessonUpdate(schedule._id);
                                    }}
                                    disabled={
                                      !lessonInput.title ||
                                      !lessonInput.description
                                    }
                                  >
                                    Update Lesson
                                  </Button>
                                </Box>
                              </Box>
                            )}
                          </Box>
                        </Box>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
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
        <TeacherViewScheduleModal
          schedule={selectedSchedule}
          setShowModal={setShowViewModal}
        />
      </Modal>
      <ViewTeacherLessonModal
        schedule={selectedLessonSchedule}
        open={showLessonsModal}
        onClose={() => {
          setShowLessonsModal(false);
          setSelectedLessonSchedule(null);
        }}
      />
      <NotificationSnackbar
        notification={notification}
        onClose={closeNotification}
      />
    </div>
  );
};

export default TeacherScheduleView;
