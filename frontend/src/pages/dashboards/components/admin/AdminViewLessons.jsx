import { useState, useEffect } from "react";
import { FaSearch, FaEye, FaFilter } from "react-icons/fa";
import {
  Button,
  CircularProgress,
  Modal,
  Select,
  MenuItem,
} from "@mui/material";
import "react-datepicker/dist/react-datepicker.css";
import axios from "axios";
import "../../../../styles/components/Management.css";
import ViewLessonsModal from "./viewModals/ViewLessonsModal";
import useNotification from "../../../../hooks/useNotification";
import NotificationSnackbar from "../../../../components/common/NotificationSnackbar";
import SyncButton from "../../../../components/common/SyncButton";

const modalStyle = {
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  width: 600,
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

const AdminViewLessons = () => {
  const [lessons, setLessons] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isSyncing, setIsSyncing] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedLesson, setSelectedLesson] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [dateRange, setDateRange] = useState([null, null]);
  const [allSubjects, setAllSubjects] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState("all");
  const [selectedSubjectFilter, setSelectedSubjectFilter] = useState("all");
  const [showActiveStudents, setShowActiveStudents] = useState(false);
  const [showInactiveStudents, setShowInactiveStudents] = useState(false);
  const { notification, showNotification, closeNotification } =
    useNotification();

  const BASE_URL = import.meta.env.VITE_BASE_URL;

  const fetchLessons = async (showSuccessMessage = false) => {
    setIsSyncing(true);
    setIsLoading(true);
    try {
      const response = await axios.get(
        `${BASE_URL}/api/schedules/admin/student-lessons`
      );

      console.log(
        `✅ Lessons fetched by hammas-coding at 2025-06-18 06:06:52:`,
        response.data
      );

      setLessons(response.data.data);
      if (showSuccessMessage) {
        showNotification("Lessons refreshed successfully");
      }
    } catch (error) {
      console.error(
        `❌ Error fetching lessons by hammas-coding at 2025-06-18 06:06:52:`,
        error
      );
      showNotification(
        error.response?.data?.message || "Error fetching lessons",
        "error"
      );
    } finally {
      setIsSyncing(false);
      setIsLoading(false);
    }
  };

  const fetchSubjects = async () => {
    try {
      const response = await axios.get(`${BASE_URL}/api/subjects/view`);
      if (response.data && Array.isArray(response.data.subjects)) {
        setAllSubjects(response.data.subjects);
      }
    } catch (error) {
      showNotification(
        error.response?.data?.message || "Error fetching subjects",
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
    fetchLessons();
    fetchSubjects();
  }, []);

  useEffect(() => {
    const init = async () => {
      try {
        await fetchLessons();
        showNotification("Lessons loaded successfully");
      } catch (error) {
        showNotification(
          error.response?.data?.message || "Error loading lessons",
          "error"
        );
      }
    };

    init();
  }, []);

  const filteredLessons = lessons.filter((lesson) => {
    const searchLower = searchTerm.toLowerCase();

    const matchesSearch =
      lesson.studentName.toLowerCase().includes(searchLower) ||
      lesson.subjectName.toLowerCase().includes(searchLower) ||
      lesson.clientName.toLowerCase().includes(searchLower) ||
      lesson.studentId?.toString().includes(searchTerm);

    const matchesSubjectType =
      selectedSubjectFilter === "all" ||
      lesson.subjectType === selectedSubjectFilter;

    const matchesSubject =
      selectedSubject === "all" || lesson.subjectId === selectedSubject;

    let matchesStudentFilter = true;
    if (showActiveStudents && !showInactiveStudents) {
      matchesStudentFilter = lesson.studentIsActive !== false;
    } else if (!showActiveStudents && showInactiveStudents) {
      matchesStudentFilter = lesson.studentIsActive === false;
    }

    return (
      matchesSearch &&
      matchesSubjectType &&
      matchesSubject &&
      matchesStudentFilter
    );
  });

  return (
    <div className="management-container">
      <div className="management-header">
        <div>
          <h2>Student Lessons Overview</h2>
          <p className="total-count">{filteredLessons.length} Total Records</p>
        </div>
        <div className="header-buttons">
          <SyncButton
            isSyncing={isSyncing}
            onClick={() => fetchLessons(true)}
          />
        </div>
      </div>

      <div className="filter-section">
        <div className="search-box">
          <FaSearch className="search-icon" />
          <input
            type="text"
            placeholder="Search by Student ID, Student Name"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="filter-box checkbox-filter">
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={showActiveStudents}
              onChange={(e) => setShowActiveStudents(e.target.checked)}
              className="checkbox-input"
            />
            <span className="checkbox-text">Active Students</span>
          </label>
          <label className="checkbox-label" style={{ marginLeft: "16px" }}>
            <input
              type="checkbox"
              checked={showInactiveStudents}
              onChange={(e) => setShowInactiveStudents(e.target.checked)}
              className="checkbox-input"
            />
            <span className="checkbox-text">Inactive Students</span>
          </label>
        </div>

        <div
          className="filter-box"
          style={{
            width: window.innerWidth < 768 ? "100%" : "auto",
          }}
        >
          <FaFilter className="filter-icon" />
          <Select
            className="subject-select"
            value={selectedSubjectFilter}
            onChange={(e) => setSelectedSubjectFilter(e.target.value)}
            sx={{
              width: {
                xs: "100%",
                sm: "200px",
              },
              height: "40px",
              ".MuiSelect-select": {
                padding:
                  window.innerWidth <= 768 ? "6px 35px" : "8px 12px 8px 36px",
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
            <MenuItem value="all">All Types</MenuItem>
            <MenuItem value="quran">Quran</MenuItem>
            <MenuItem value="subjects">Subjects</MenuItem>
          </Select>
        </div>

        <div
          className="filter-box"
          style={{
            width: window.innerWidth < 768 ? "100%" : "auto",
          }}
        >
          <FaFilter className="filter-icon" />
          <Select
            className="subject-select"
            value={selectedSubject}
            onChange={(e) => setSelectedSubject(e.target.value)}
            sx={{
              width: {
                xs: "100%",
                sm: "200px",
              },
              height: "40px",
              ".MuiSelect-select": {
                padding:
                  window.innerWidth <= 768 ? "6px 35px" : "8px 12px 8px 36px",
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
            {allSubjects.map((subject) => (
              <MenuItem key={subject._id} value={subject._id}>
                {subject.name}
              </MenuItem>
            ))}
          </Select>
        </div>
        <button
          className="clear-filters-btn"
          onClick={() => {
            setSelectedSubjectFilter("all");
            setSelectedSubject("all");
            setSearchTerm("");
            setShowActiveStudents(false);
            setShowInactiveStudents(false);
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
        ) : filteredLessons.length > 0 ? (
          <table>
            <thead>
              <tr>
                <th>Student ID</th>
                <th>Student Name</th>
                <th>Client Name</th>
                <th>Subject Type</th>
                <th>Subject</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredLessons.map((lesson) => (
                <tr key={`${lesson.studentUserId}-${lesson.scheduleId}`}>
                  <td style={{ fontWeight: "500" }}>{lesson.studentId}</td>
                  <td style={{ fontWeight: "500" }}>
                    {lesson.studentName &&
                    lesson.studentName.includes("(Inactive Student)") ? (
                      <>
                        {lesson.studentName.replace(" (Inactive Student)", "")}
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
                      </>
                    ) : (
                      lesson.studentName
                    )}
                  </td>
                  <td style={{ fontWeight: "500" }}>
                    <div>{lesson.clientName}</div>
                    <div style={{ marginTop: "4px" }}>
                      <span
                        style={{
                          fontSize: "0.7rem",
                          fontWeight: "500",
                          color: lesson.clientIsActive ? "#22c55e" : "#dc2626",
                          backgroundColor: lesson.clientIsActive
                            ? "#dcfce7"
                            : "#fee2e2",
                          padding: "2px 6px",
                          borderRadius: "4px",
                        }}
                      >
                        {lesson.clientIsActive
                          ? "Active Client"
                          : "Inactive Client"}
                      </span>
                    </div>
                  </td>
                  <td>
                    <span
                      style={{
                        display: "inline-block",
                        padding: "4px 10px",
                        fontSize: "0.8rem",
                        fontWeight: 500,
                        borderRadius: "5px",
                        textTransform: "capitalize",
                        color:
                          lesson.subjectType === "quran"
                            ? "#0f172a"
                            : "#15803d",
                        backgroundColor:
                          lesson.subjectType === "quran"
                            ? "#e0f2fe"
                            : "#dcfce7",
                      }}
                    >
                      {lesson.subjectType}
                    </span>
                  </td>
                  <td style={{ fontWeight: "500" }}>{lesson.subjectName}</td>
                  <td>
                    <div className="actions">
                      <button
                        onClick={() => {
                          setSelectedLesson(lesson);
                          setShowViewModal(true);
                        }}
                      >
                        <FaEye />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="no-data">
            <p>
              {showInactiveStudents
                ? "No inactive students found"
                : "No lessons found"}
            </p>
          </div>
        )}
      </div>

      <Modal
        open={showViewModal}
        onClose={() => setShowViewModal(false)}
        aria-labelledby="view-lessons-modal"
      >
        <ViewLessonsModal
          lessons={selectedLesson?.lessons || []}
          studentName={selectedLesson?.studentName}
          subjectName={selectedLesson?.subjectName}
          setShowModal={setShowViewModal}
          modalStyle={modalStyle}
          dateRange={dateRange}
          setDateRange={setDateRange}
        />
      </Modal>

      <NotificationSnackbar
        notification={notification}
        onClose={closeNotification}
      />
    </div>
  );
};

export default AdminViewLessons;
