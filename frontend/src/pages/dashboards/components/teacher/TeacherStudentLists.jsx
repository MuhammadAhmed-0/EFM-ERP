import { useState, useEffect } from "react";
import { FaSearch, FaFileAlt, FaEye, FaFilter } from "react-icons/fa";
import { Select, MenuItem, Button, CircularProgress } from "@mui/material";
import axios from "axios";
import "../../../../styles/components/Management.css";
import "../../../../styles/components/TeacherStudentLists.css";
import NotificationSnackbar from "../../../../components/common/NotificationSnackbar";
import useNotification from "../../../../hooks/useNotification";
import SyncButton from "../../../../components/common/SyncButton";

const TeacherStudentList = () => {
  const [students, setStudents] = useState([]);
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isSyncing, setIsSyncing] = useState(false);
  const [reports, setReports] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState("all");
  const [selectedMonth, setSelectedMonth] = useState("all");
  const [selectedSubject, setSelectedSubject] = useState("all");
  const [allSubjects, setAllSubjects] = useState([]);
  const [allMonths, setAllMonths] = useState([]);
  const [filteredReports, setFilteredReports] = useState([]);
  const [initialLoad, setInitialLoad] = useState(true);
  const [isReportsSyncing, setIsReportsSyncing] = useState(false);
  const [studentSearchTerm, setStudentSearchTerm] = useState("");
  const [reportSearchTerm, setReportSearchTerm] = useState("");
  const [showActiveStudents, setShowActiveStudents] = useState(false);
  const [showInactiveStudents, setShowInactiveStudents] = useState(false);
  const [showActiveStudentReports, setShowActiveStudentReports] =
    useState(false);
  const [showInactiveStudentReports, setShowInactiveStudentReports] =
    useState(false);

  const { notification, showNotification, closeNotification } =
    useNotification();

  const BASE_URL = import.meta.env.VITE_BASE_URL;

  useEffect(() => {
    const months = [];
    const currentDate = new Date();
    for (let i = 0; i < 12; i++) {
      const date = new Date(currentDate);
      date.setMonth(currentDate.getMonth() - i);
      const monthYear = date.toLocaleString("default", {
        month: "long",
        year: "numeric",
      });
      months.push(monthYear);
    }
    setAllMonths(months);
  }, []);

  const fetchAllReports = async (showSuccessMessage = false) => {
    setIsReportsSyncing(true);
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(
        `${BASE_URL}/api/teachers/all-student-reports`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setReports(response.data.reports);
      setFilteredReports(response.data.reports);

      const subjects = [
        ...new Set(response.data.reports.map((report) => report.subjectName)),
      ];
      setAllSubjects(subjects);

      if (showSuccessMessage) {
        showNotification("Reports refreshed successfully");
      } else if (initialLoad) {
        showNotification("Reports loaded successfully");
        setInitialLoad(false);
      }
    } catch (error) {
      showNotification(
        error.response?.data?.message || "Error fetching reports",
        "error"
      );
    } finally {
      setIsReportsSyncing(false);
    }
  };

  const fetchStudents = async (showSuccessMessage = false) => {
    setIsSyncing(true);
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(
        `${BASE_URL}/api/teachers/their-students`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setStudents(response.data.students);
      setFilteredStudents(response.data.students);

      if (showSuccessMessage) {
        showNotification("Students list refreshed successfully");
      } else if (initialLoad) {
        showNotification("Students loaded successfully");
      }
    } catch (error) {
      showNotification(
        error.response?.data?.message || "Error fetching students",
        "error"
      );
    } finally {
      setIsSyncing(false);
    }
  };

  useEffect(() => {
    const loadInitialData = async () => {
      await Promise.all([fetchStudents(), fetchAllReports()]);
    };
    loadInitialData();
  }, []);

  useEffect(() => {
    if (students.length > 0) {
      let filtered = [...students];
      if (studentSearchTerm) {
        filtered = filtered.filter(
          (student) =>
            student.name
              .toLowerCase()
              .includes(studentSearchTerm.toLowerCase()) ||
            (student.studentId &&
              student.studentId
                .toString()
                .toLowerCase()
                .includes(studentSearchTerm.toLowerCase()))
        );
      }
      if (showActiveStudents && !showInactiveStudents) {
        filtered = filtered.filter(
          (student) => !student.name?.includes("(Inactive Student)")
        );
      } else if (!showActiveStudents && showInactiveStudents) {
        filtered = filtered.filter((student) =>
          student.name?.includes("(Inactive Student)")
        );
      }
      const sortedStudents = filtered.sort((a, b) => {
        const aIsInactive = a.name && a.name.includes("(Inactive Student)");
        const bIsInactive = b.name && b.name.includes("(Inactive Student)");
        if (aIsInactive && !bIsInactive) return 1;
        if (!aIsInactive && bIsInactive) return -1;
        if (a.name && b.name) {
          const aName = a.name.replace("(Inactive Student)", "").trim();
          const bName = b.name.replace("(Inactive Student)", "").trim();
          return aName.localeCompare(bName);
        }

        return 0;
      });

      setFilteredStudents(sortedStudents);
    }
  }, [students, studentSearchTerm, showActiveStudents, showInactiveStudents]);

  useEffect(() => {
    let filtered = [...reports];

    if (reportSearchTerm) {
      const isNumericSearch = /^\d+$/.test(reportSearchTerm);
      filtered = filtered.filter(
        (report) =>
          report.studentNameFromUser
            ?.toLowerCase()
            .includes(reportSearchTerm.toLowerCase()) ||
          (isNumericSearch &&
            String(report.student?.studentId).includes(reportSearchTerm))
      );
    }

    if (selectedStudent !== "all") {
      filtered = filtered.filter(
        (report) =>
          report.student.studentId &&
          report.student.studentId.toString() === selectedStudent
      );
    }

    if (selectedMonth !== "all") {
      filtered = filtered.filter(
        (report) => report.classCount === selectedMonth
      );
    }

    if (selectedSubject !== "all") {
      filtered = filtered.filter(
        (report) => report.subjectName === selectedSubject
      );
    }

    if (showActiveStudentReports && !showInactiveStudentReports) {
      filtered = filtered.filter(
        (report) => !report.studentNameFromUser?.includes("(Inactive Student)")
      );
    } else if (!showActiveStudentReports && showInactiveStudentReports) {
      filtered = filtered.filter((report) =>
        report.studentNameFromUser?.includes("(Inactive Student)")
      );
    }

    const sortedReports = filtered.sort((a, b) => {
      const aIsInactive =
        a.studentNameFromUser &&
        a.studentNameFromUser.includes("(Inactive Student)");
      const bIsInactive =
        b.studentNameFromUser &&
        b.studentNameFromUser.includes("(Inactive Student)");
      if (aIsInactive && !bIsInactive) return 1;
      if (!aIsInactive && bIsInactive) return -1;
      return new Date(b.createdAt) - new Date(a.createdAt);
    });

    setFilteredReports(sortedReports);
  }, [
    selectedStudent,
    selectedMonth,
    selectedSubject,
    reportSearchTerm, // Added to dependencies
    reports,
    showActiveStudentReports,
    showInactiveStudentReports,
  ]);

  const handleGenerateReport = (student) => {
    const user = JSON.parse(localStorage.getItem("user"));
    const queryParams = new URLSearchParams({
      studentId: student._id,
      clientId: student.clientId,
      familyName: student.clientName,
      studentName: student.studentNameFromUser,
      grade: student.grade,
      subject: student.assignedSubjects[0]?.subject.name || "",
      tutorName: user?.name || "",
      subjectId: student.assignedSubjects[0]?.subject._id || "",
    }).toString();
    window.open(`/teacher/monthly-report?${queryParams}`, "_blank");
  };

  const handleViewReport = (reportId) => {
    window.open(
      `/teacher/monthly-report?reportId=${reportId}&clientId=${selectedStudent.clientId}`,
      "_blank"
    );
  };

  return (
    <div className="split-container">
      <div className="students-section">
        <div
          className="section-header"
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
          }}
        >
          <h2>My Students</h2>
          <SyncButton
            isSyncing={isSyncing}
            onClick={() => fetchStudents(true)}
          />
        </div>

        <div className="search-box">
          <FaSearch className="search-icon" />
          <input
            type="text"
            placeholder="Search by Student Name/ID."
            value={studentSearchTerm}
            onChange={(e) => setStudentSearchTerm(e.target.value)}
          />
        </div>

        <div className="students-list">
          {isSyncing ? (
            <div className="loading-container">
              <CircularProgress />
            </div>
          ) : filteredStudents.length > 0 ? (
            filteredStudents.map((student) => {
              const isInactive = student.name.includes("(Inactive Student)");
              return (
                <div
                  key={student._id}
                  className={`student-card ${isInactive ? "disabled" : ""}`}
                >
                  <div className="student-info">
                    <div className="student-name">
                      {student.name.replace("(Inactive Student)", "").trim()}
                    </div>
                    {isInactive && (
                      <div
                        style={{
                          color: "#dc2626",
                          fontSize: "0.8rem",
                          fontWeight: "500",
                          marginTop: "2px",
                        }}
                      >
                        (Inactive Student)
                      </div>
                    )}
                    <div className="student-details">
                      {student.studentId} | {student.clientName}
                    </div>
                  </div>
                  <div className="actions">
                    <button
                      onClick={() => handleGenerateReport(student)}
                      className="generate-report-btn"
                      title={
                        isInactive
                          ? "Cannot generate report for inactive student"
                          : "Generate New Report"
                      }
                      disabled={isInactive}
                    >
                      <FaFileAlt />
                    </button>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="no-data">
              <p>No students found</p>
            </div>
          )}
        </div>
      </div>

      <div className="reports-section">
        <div className="section-header">
          <div
            style={{
              display: "flex",
              gap: "1rem",
              justifyContent: "space-between",
            }}
          >
            <h2>Reports</h2>
            <SyncButton
              isSyncing={isSyncing}
              onClick={() => fetchAllReports(true)}
            />
          </div>
          <div
            className="filter-box checkbox-filter"
            style={{
              margin: "10px 0",
              padding: "10px 16px",
              backgroundColor: "white",
              border: "1px solid #e2e8f0",
              borderRadius: "6px",
            }}
          >
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={showActiveStudentReports}
                onChange={(e) => setShowActiveStudentReports(e.target.checked)}
                className="checkbox-input"
              />
              <span className="checkbox-text">Active Student Reports</span>
            </label>
            <label className="checkbox-label" style={{ marginLeft: "16px" }}>
              <input
                type="checkbox"
                checked={showInactiveStudentReports}
                onChange={(e) =>
                  setShowInactiveStudentReports(e.target.checked)
                }
                className="checkbox-input"
              />
              <span className="checkbox-text">Inactive Student Reports</span>
            </label>
          </div>
          <div className="filter-section">
            <div className="search-box" style={{ margin: "10px 0" }}>
              <FaSearch className="search-icon" />
              <input
                type="text"
                placeholder="Search by Student Name/ID"
                value={reportSearchTerm}
                onChange={(e) => setReportSearchTerm(e.target.value)}
              />
            </div>

            <div className="filter-box">
              <FaFilter className="filter-icon" />
              <Select
                className="staff-select"
                value={selectedStudent}
                onChange={(e) => setSelectedStudent(e.target.value)}
                label="Student"
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
                  <MenuItem
                    key={student._id}
                    value={
                      student.studentId ? student.studentId.toString() : ""
                    }
                  >
                    {student.studentId} - {student.name}
                  </MenuItem>
                ))}
              </Select>
            </div>
            <div className="filter-box">
              <FaFilter className="filter-icon" />
              <Select
                className="staff-select"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                label="Month"
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
                <MenuItem value="all">All Months</MenuItem>
                {allMonths.map((month) => (
                  <MenuItem key={month} value={month}>
                    {month}
                  </MenuItem>
                ))}
              </Select>
            </div>
            <div className="filter-box">
              <FaFilter className="filter-icon" />
              <Select
                className="staff-select"
                value={selectedSubject}
                onChange={(e) => setSelectedSubject(e.target.value)}
                label="Subject"
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
                {allSubjects.map((subject) => (
                  <MenuItem key={subject} value={subject}>
                    {subject}
                  </MenuItem>
                ))}
              </Select>
            </div>
            <button
              className="clear-filters-btn"
              onClick={() => {
                setSelectedSubject("all");
                setSelectedStudent("all");
                setSelectedMonth("all");
                setReportSearchTerm("");
                setShowActiveStudentReports(false);
                setShowInactiveStudentReports(false);
              }}
            >
              Clear Filters
            </button>
          </div>
        </div>

        <div className="reports-list">
          {isReportsSyncing ? (
            <div className="loading-container">
              <CircularProgress />
            </div>
          ) : filteredReports.length > 0 ? (
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Student</th>
                  <th>Subject</th>
                  <th>Month</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredReports.map((report) => {
                  const isInactiveStudent =
                    report.studentNameFromUser.includes("(Inactive Student)");
                  return (
                    <tr key={report._id}>
                      <td style={{ fontWeight: "500" }}>
                        {new Date(report.createdAt).toLocaleDateString()}
                      </td>
                      <td>
                        <div style={{ fontWeight: "500" }}>
                          {report.studentNameFromUser
                            .replace("(Inactive Student)", "")
                            .trim()}
                        </div>
                        {isInactiveStudent && (
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
                        <span
                          style={{ color: "#64748b", fontSize: "0.8125rem" }}
                        >
                          ID: {report.student.studentId}
                        </span>
                      </td>
                      <td>{report.subjectName}</td>
                      <td>{report.classCount}</td>
                      <td>
                        <span className={`status-tag ${report.status}`}>
                          {report.status}
                        </span>
                      </td>
                      <td>
                        <div className="actions">
                          <button
                            onClick={() => handleViewReport(report._id)}
                            title="View Report"
                          >
                            <FaEye />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : (
            <div className="no-data">
              <p>No reports found</p>
            </div>
          )}
        </div>
      </div>
      <NotificationSnackbar
        notification={notification}
        onClose={closeNotification}
      />
    </div>
  );
};

export default TeacherStudentList;
