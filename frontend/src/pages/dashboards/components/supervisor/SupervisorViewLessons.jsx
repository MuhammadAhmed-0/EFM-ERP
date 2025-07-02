import { useState, useEffect } from "react";
import { FaSearch, FaEye, FaFilter } from "react-icons/fa";
import {
  Button,
  Modal,
  Select,
  MenuItem,
  CircularProgress,
} from "@mui/material";
import "react-datepicker/dist/react-datepicker.css";
import axios from "axios";
import "../../../../styles/components/Management.css";
import ViewLessonsModal from "../admin/viewModals/ViewLessonsModal";
import useNotification from "../../../../hooks/useNotification";
import NotificationSnackbar from "../../../../components/common/NotificationSnackbar";
import SyncButton from "../../../../components/common/SyncButton";
const SupervisorViewLessons = () => {
  const [lessons, setLessons] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isSyncing, setIsSyncing] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedLesson, setSelectedLesson] = useState(null);
  const [dateRange, setDateRange] = useState([null, null]);
  const [allSubjects, setAllSubjects] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState("all");
  const [isLoading, setIsLoading] = useState(true);
  const [showActiveStudentLessons, setShowActiveStudentLessons] =
    useState(false);
  const [showInactiveStudentLessons, setShowInactiveStudentLessons] =
    useState(false);
  const { notification, showNotification, closeNotification } =
    useNotification();
  const BASE_URL = import.meta.env.VITE_BASE_URL;

  const fetchLessons = async () => {
    setIsSyncing(true);
    setIsLoading(true);
    try {
      const response = await axios.get(
        `${BASE_URL}/api/schedules/supervisor/student-lessons`
      );
      setLessons(response.data.data);
      showNotification("Lessons fetched successfully");
    } catch (error) {
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
      const response = await axios.get(
        `${BASE_URL}/api/subjects/supervisor/view`
      );
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

  const filteredLessons = lessons.filter((lesson) => {
    const matchesSearch =
      lesson.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lesson.subjectName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lesson.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (lesson.studentId &&
        lesson.studentId
          .toString()
          .toLowerCase()
          .includes(searchTerm.toLowerCase()));
    const matchesSubject =
      selectedSubject === "all" || lesson.subjectId === selectedSubject;

    let matchesStudentFilter = true;
    if (showActiveStudentLessons && !showInactiveStudentLessons) {
      matchesStudentFilter = lesson.studentIsActive !== false;
    } else if (!showActiveStudentLessons && showInactiveStudentLessons) {
      matchesStudentFilter = lesson.studentIsActive === false;
    }
    return matchesSearch && matchesSubject && matchesStudentFilter;
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
            placeholder="Search by Student Name/ID, Subject, Client Name"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="filter-box checkbox-filter">
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={showActiveStudentLessons}
              onChange={(e) => setShowActiveStudentLessons(e.target.checked)}
              className="checkbox-input"
            />
            <span className="checkbox-text">Active Students</span>
          </label>
          <label className="checkbox-label" style={{ marginLeft: "16px" }}>
            <input
              type="checkbox"
              checked={showInactiveStudentLessons}
              onChange={(e) => setShowInactiveStudentLessons(e.target.checked)}
              className="checkbox-input"
            />
            <span className="checkbox-text">Inactive Students</span>
          </label>
        </div>
        <div className="filter-box">
          <FaFilter className="filter-icon" />
          <Select
            className="staff-select"
            value={selectedSubject}
            onChange={(e) => setSelectedSubject(e.target.value)}
            sx={{
              width: {
                xs: "100%",
                sm: "180px",
                md: "200px",
              },
              minWidth: {
                xs: "100%",
                sm: "150px",
              },
              height: "40px",
              ".MuiSelect-select": {
                padding:
                  window.innerWidth <= 768 ? "6px 25px" : "8px 12px 8px 36px",
                backgroundColor: "white",
                borderRadius: "6px",
                fontSize: "0.875rem",
                color: "#475569",
                marginTop: 0.5,
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
            setSelectedSubject("all");
            setSearchTerm("");
            setShowActiveStudentLessons(false);
            setShowInactiveStudentLessons(false);
            setShowActiveClientLessons(false);
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
                <th>Subject</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredLessons.map((lesson) => (
                <tr key={`${lesson.studentUserId}-${lesson.scheduleId}`}>
                  <td style={{ fontWeight: "500" }}>{lesson.studentId}</td>
                  <td style={{ fontWeight: "500" }}>
                    {lesson.studentName
                      ?.replace("(Inactive Student)", "")
                      .trim()}
                    {lesson.studentIsActive === false && (
                      <div
                        style={{
                          color: "#dc2626",
                          fontSize: "0.8rem",
                          fontWeight: "500",
                        }}
                      >
                        (Inactive Student)
                      </div>
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
            <p>No lessons found</p>
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

export default SupervisorViewLessons;
