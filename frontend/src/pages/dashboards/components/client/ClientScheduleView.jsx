import { useState, useEffect } from "react";
import { FaFilter, FaEye, FaBook } from "react-icons/fa";
import {
  Select,
  MenuItem,
  Button,
  Modal,
  CircularProgress,
} from "@mui/material";
import ReactDatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { format } from "date-fns";
import axios from "axios";
import "../../../../styles/components/Management.css";
import ClientViewScheduleModal from "./viewModals/ClientViewScheduleModal";
import ViewClientLessonModal from "./viewModals/ViewClientLessonModal";
import useNotification from "../../../../hooks/useNotification";
import NotificationSnackbar from "../../../../components/common/NotificationSnackbar";
import SyncButton from "../../../../components/common/SyncButton";
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

const ClientScheduleView = () => {
  const [schedules, setSchedules] = useState([]);
  const [filteredSchedules, setFilteredSchedules] = useState([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [dateRange, setDateRange] = useState([null, null]);
  const [selectedSubject, setSelectedSubject] = useState("all");
  const [selectedStudent, setSelectedStudent] = useState("all");
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState(null);
  const [showLessonsModal, setShowLessonsModal] = useState(false);
  const [selectedLessonSchedule, setSelectedLessonSchedule] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const { notification, showNotification, closeNotification } =
    useNotification();

  const BASE_URL = import.meta.env.VITE_BASE_URL;
  const badgeBaseStyle = {
    padding: "6px 12px",
    borderRadius: "5px",
    fontSize: "0.75rem",
    fontWeight: "600",
    display: "flex",
    alignItems: "center",
    gap: "3px",
  };

  const statusConfigs = [
    {
      key: "todayCompleted",
      label: "Completed",
      backgroundColor: "#dcfce7",
      color: "#15803d",
    },
    {
      key: "todayInProgress",
      label: "In Progress",
      backgroundColor: "#e0f2fe",
      color: "#0369a1",
    },
    {
      key: "todayPending",
      label: "Pending",
      backgroundColor: "#fef3c7",
      color: "#92400e",
    },
    {
      key: "todayAvailable",
      label: "Available",
      backgroundColor: "#e0f2fe",
      color: "#0369a1",
    },
    {
      key: "todayAbsent",
      label: "Absent",
      backgroundColor: "#fee2e2",
      color: "#dc2626",
    },
    {
      key: "todayLeave",
      label: "Leave",
      backgroundColor: "#fed7aa",
      color: "#ea580c",
    },
  ];
  const fetchSchedules = async (showSuccessMessage = false) => {
    setIsSyncing(true);
    setIsLoading(true);
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(
        `${BASE_URL}/api/schedules/client/student-schedule`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
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
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const initializePage = async () => {
      try {
        setIsSyncing(true);
        setIsLoading(true);
        const token = localStorage.getItem("token");
        const response = await axios.get(
          `${BASE_URL}/api/schedules/client/student-schedule`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        setSchedules(response.data.schedules);
        setFilteredSchedules(response.data.schedules);
        showNotification("Class schedules loaded successfully");
      } catch (error) {
        showNotification(
          error.response?.data?.message || "Error loading schedules",
          "error"
        );
      } finally {
        setIsSyncing(false);
        setIsLoading(false);
      }
    };

    initializePage();
  }, []);

  const formatDate = (dateString) => {
    if (!dateString) return "";
    const [day, month, year] = dateString.split("-");
    return `${day}/${month}/${year}`;
  };

  const convertTo12Hour = (time) => {
    if (!time) return "";
    const [hours, minutes] = time.split(":");
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? "PM" : "AM";
    const hour12 = hour % 12 || 12;
    return `${hour12.toString().padStart(2, "0")}:${minutes} ${ampm}`;
  };

  const getUniqueStudents = () => {
    const studentsMap = new Map();

    schedules.forEach((schedule) => {
      schedule.studentNames.forEach((student) => {
        studentsMap.set(student.name, {
          name: student.name,
          id: student.studentId,
        });
      });
    });

    return Array.from(studentsMap.values());
  };

  const getUniqueSubjects = () => {
    const subjects = new Set(schedules.map((schedule) => schedule.subjectName));
    return Array.from(subjects);
  };

  useEffect(() => {
    let filtered = [...schedules];
    if (!dateRange[0] && !dateRange[1]) {
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(today.getDate() - 1);
      yesterday.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(today.getDate() + 1);
      tomorrow.setHours(23, 59, 59, 999);
      filtered = filtered.filter((schedule) => {
        try {
          const [day, month, year] = schedule.classDate.split("-");
          const scheduleDate = new Date(`${year}-${month}-${day}`);
          scheduleDate.setHours(0, 0, 0, 0);

          return scheduleDate >= yesterday && scheduleDate <= tomorrow;
        } catch (error) {
          console.error("Error comparing dates:", error);
          return false;
        }
      });
    }

    if (selectedStatus !== "all") {
      filtered = filtered.filter(
        (schedule) => schedule.sessionStatus === selectedStatus
      );
    }

    if (selectedSubject !== "all") {
      filtered = filtered.filter(
        (schedule) => schedule.subjectName === selectedSubject
      );
    }

    if (selectedStudent !== "all") {
      filtered = filtered.filter((schedule) =>
        schedule.studentNames.some(
          (student) => student.name === selectedStudent
        )
      );
    }

    if (dateRange[0] && dateRange[1]) {
      filtered = filtered.filter((schedule) => {
        const [day, month, year] = schedule.classDate.split("-");
        const scheduleDate = new Date(`${year}-${month}-${day}`);

        const startDate = new Date(dateRange[0]);
        startDate.setHours(0, 0, 0, 0);

        const endDate = new Date(dateRange[1]);
        endDate.setHours(23, 59, 59, 999);

        return scheduleDate >= startDate && scheduleDate <= endDate;
      });
    }

    setFilteredSchedules(filtered);
  }, [schedules, selectedStatus, selectedSubject, selectedStudent, dateRange]);

  const calculateStats = () => {
    const total = filteredSchedules.length;
    const completed = filteredSchedules.filter(
      (s) => s.sessionStatus === "completed"
    ).length;
    const pending = filteredSchedules.filter(
      (s) => s.sessionStatus === "pending"
    ).length;
    const inProgress = filteredSchedules.filter(
      (s) => s.sessionStatus === "in_progress"
    ).length;
    const available = filteredSchedules.filter(
      (s) => s.sessionStatus === "available"
    ).length;
    const absent = filteredSchedules.filter(
      (s) => s.sessionStatus === "absent"
    ).length;
    const leave = filteredSchedules.filter(
      (s) => s.sessionStatus === "leave"
    ).length;

    const today = new Date().toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });

    const todayClasses = filteredSchedules.filter(
      (schedule) => formatDate(schedule.classDate) === today
    );

    const todayTotal = todayClasses.length;
    const todayPending = todayClasses.filter(
      (s) => s.sessionStatus === "pending"
    ).length;
    const todayCompleted = todayClasses.filter(
      (s) => s.sessionStatus === "completed"
    ).length;
    const todayAbsent = todayClasses.filter(
      (s) => s.sessionStatus === "absent"
    ).length;
    const todayLeave = todayClasses.filter(
      (s) => s.sessionStatus === "leave"
    ).length;

    return {
      total,
      completed,
      pending,
      inProgress,
      available,
      absent,
      leave,
      todayTotal,
      todayPending,
      todayCompleted,
      todayAbsent,
      todayLeave,
    };
  };

  const stats = calculateStats();

  return (
    <div className="management-container">
      <div className="management-header">
        <div>
          <h2>My Class Schedule</h2>
          <p className="total-count">
            {filteredSchedules.length} Total Classes
            {!dateRange[0] && !dateRange[1] && (
              <span
                style={{
                  fontSize: "0.75rem",
                  color: "#64748b",
                  fontWeight: "normal",
                  marginLeft: "8px",
                }}
              >
                (Yesterday, Today & Tomorrow)
              </span>
            )}
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
        <div className="stat-card info">
          <h3>Today's Classes</h3>
          <p>{stats.todayTotal}</p>
          <div className="stat-details">
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: "6px",
                marginTop: "8px",
                justifyContent: "flex-start",
              }}
            >
              {statusConfigs.map((config, index) => (
                <div
                  key={index}
                  style={{
                    ...badgeBaseStyle,
                    backgroundColor: config.backgroundColor,
                    color: config.color,
                  }}
                >
                  <span style={{ fontSize: "0.75rem", fontWeight: "600" }}>
                    {stats[config.key] || 0}
                  </span>
                  <span>{config.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="stat-card total-amount">
          <h3>Total Classes</h3>
          <p>{stats.total}</p>
        </div>
      </div>

      <div className="stats-cards">
        <div className="stat-card absent">
          <h3>Absent Sessions</h3>
          <p>{stats.absent}</p>
        </div>

        <div className="stat-card leave">
          <h3>Leave Sessions</h3>
          <p>{stats.leave}</p>
        </div>

        <div className="stat-card total-amount">
          <h3>In Progress</h3>
          <p>{stats.inProgress}</p>
        </div>
        <div className="stat-card pending-amount">
          <h3>Pending Classes</h3>
          <p>{stats.pending}</p>
        </div>

        <div className="stat-card paid-amount">
          <h3>Completed Classes</h3>
          <p>{stats.completed}</p>
        </div>
      </div>

      <div className="filter-section">
        <div className="filter-box">
          <FaFilter className="filter-icon" />
          <Select
            value={selectedSubject}
            onChange={(e) => setSelectedSubject(e.target.value)}
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
            {getUniqueSubjects().map((subject) => (
              <MenuItem key={subject} value={subject}>
                {subject}
              </MenuItem>
            ))}
          </Select>
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
            {getUniqueStudents().map((student) => (
              <MenuItem key={student.name} value={student.name}>
                {student.id} - {student.name}
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
            <MenuItem value="pending">Pending</MenuItem>
            <MenuItem value="in_progress">In Progress</MenuItem>
            <MenuItem value="completed">Completed</MenuItem>
            <MenuItem value="available">Available</MenuItem>
            <MenuItem value="absent">Absent</MenuItem>
            <MenuItem value="leave">Leave</MenuItem>
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
        <button
          className="clear-filters-btn"
          onClick={() => {
            setSelectedStatus("all");
            setSelectedSubject("all");
            setSelectedStudent("all");
            setDateRange([null, null]);
          }}
        >
          Clear Filters
        </button>
      </div>

      <div className="table-container">
        {isLoading ? (
          <div className="loading-container">
            <CircularProgress />
          </div>
        ) : filteredSchedules.length > 0 ? (
          <table>
            <thead>
              <tr>
                <th>Student</th>
                <th>Teacher</th>
                <th>Subject</th>
                <th>Day & Time</th>
                <th>Date</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredSchedules.map((schedule) => (
                <tr key={schedule._id}>
                  <td>
                    <div style={{ fontWeight: "500" }}>
                      {schedule.studentNames
                        .map((student) => {
                          if (
                            student.name &&
                            student.name.includes("(Inactive Student)")
                          ) {
                            return student.name.replace(
                              " (Inactive Student)",
                              ""
                            );
                          }
                          return student.name;
                        })
                        .join(", ")}
                    </div>
                    <span style={{ color: "#64748b", fontSize: "0.8125rem" }}>
                      ID:{" "}
                      {schedule.studentNames
                        .map((student) => student.studentId)
                        .join(", ")}{" "}
                    </span>
                  </td>
                  <td style={{ fontWeight: "500" }}>
                    {schedule.teacherName
                      ?.replace(" (Inactive Teacher)", "")
                      ?.replace(" (Deleted Teacher)", "") ||
                      schedule.teacherName}
                  </td>
                  <td>{schedule.subjectName}</td>
                  <td>
                    <div style={{ fontWeight: "500" }}>{schedule.day}</div>
                    <span style={{ color: "#64748b", fontSize: "0.8125rem" }}>
                      <>
                        {convertTo12Hour(schedule.startTime)} <br />
                        {convertTo12Hour(schedule.endTime)}
                      </>
                    </span>
                  </td>
                  <td>{formatDate(schedule.classDate)}</td>
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
                            ? "#92400e"
                            : schedule.sessionStatus === "available"
                            ? "#0369a1"
                            : schedule.sessionStatus === "absent"
                            ? "#dc2626"
                            : schedule.sessionStatus === "leave"
                            ? "#ea580c"
                            : "#92400e",
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
                            : "#fef3c7",
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
                      >
                        <FaEye />
                      </button>
                      <button
                        onClick={() => {
                          setSelectedLessonSchedule(schedule);
                          setShowLessonsModal(true);
                        }}
                      >
                        <FaBook />
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

      <Modal
        open={showViewModal}
        onClose={() => setShowViewModal(false)}
        aria-labelledby="view-schedule-modal"
      >
        <ClientViewScheduleModal
          schedule={selectedSchedule}
          setShowModal={setShowViewModal}
          modalStyle={modalStyle}
        />
      </Modal>
      <ViewClientLessonModal
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

export default ClientScheduleView;
