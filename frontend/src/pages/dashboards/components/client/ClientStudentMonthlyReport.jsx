import { useState, useEffect } from "react";
import { FaSearch, FaFilter, FaEye } from "react-icons/fa";
import { Button, Select, MenuItem, CircularProgress } from "@mui/material";
import axios from "axios";
import "../../../../styles/components/Management.css";
import useNotification from "../../../../hooks/useNotification";
import NotificationSnackbar from "../../../../components/common/NotificationSnackbar";
import SyncButton from "../../../../components/common/SyncButton";

const ClientStudentMonthlyReport = () => {
  const [reports, setReports] = useState([]);
  const [filteredReports, setFilteredReports] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState("all");
  const [selectedMonth, setSelectedMonth] = useState("all");
  const [selectedSubject, setSelectedSubject] = useState("all");
  const [uniqueSubjects, setUniqueSubjects] = useState([]);
  const [uniqueStudents, setUniqueStudents] = useState([]);
  const [uniqueMonths, setUniqueMonths] = useState([]);
  const { notification, showNotification, closeNotification } =
    useNotification();
  const BASE_URL = import.meta.env.VITE_BASE_URL;

  const fetchReports = async () => {
    setIsSyncing(true);
    try {
      const token = localStorage.getItem("token");
      const user = JSON.parse(localStorage.getItem("userId"));
      console.log(user);
      const response = await axios.get(
        `${BASE_URL}/api/clients/student-report/${user}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      console.log(response.data.reports);
      setReports(response.data.reports);
      setFilteredReports(response.data.reports);

      const subjects = [
        ...new Set(response.data.reports.map((report) => report.subjectName)),
      ];
      console.log(response.data.reports);
      const uniqueStudentsArray = [
        ...new Map(
          response.data.reports.map((report) => [
            report.student._id,
            {
              id: report.student._id,
              name: report.studentNameFromUser,
              grade: report.grade,
              studentId: report.student.studentId,
            },
          ])
        ).values(),
      ];

      const months = [
        ...new Set(response.data.reports.map((report) => report.classCount)),
      ];

      setUniqueSubjects(subjects);
      setUniqueStudents(uniqueStudentsArray);
      setUniqueMonths(months);

      showNotification("Reports refreshed successfully");
    } catch (error) {
      showNotification(
        error.response?.data?.message || "Error fetching reports",
        "error"
      );
    } finally {
      setIsSyncing(false);
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const generateMonthYearOptions = () => {
    const options = [];
    const currentDate = new Date();
    const lastYear = new Date(currentDate);
    lastYear.setMonth(currentDate.getMonth() - 1);

    for (let i = 0; i < 12; i++) {
      const date = new Date(lastYear);
      date.setMonth(lastYear.getMonth() + i);
      const monthYear = date.toLocaleString("default", {
        month: "long",
        year: "numeric",
      });
      options.push(monthYear);
    }
    return options;
  };

  const handleViewReport = (reportId, clientId) => {
    window.open(
      `/client/monthly-report?reportId=${reportId}&clientId=${clientId}`,
      "_blank"
    );
  };

  useEffect(() => {
    let filtered = [...reports];

    if (searchTerm) {
      const isNumericSearch = /^\d+$/.test(searchTerm);
      filtered = filtered.filter(
        (report) =>
          report.studentNameFromUser
            ?.toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          report.subjectName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (isNumericSearch &&
            String(report.student?.studentId).includes(searchTerm))
      );
    }

    if (selectedStudent !== "all") {
      filtered = filtered.filter(
        (report) => report.student._id === selectedStudent
      );
    }

    if (selectedSubject !== "all") {
      filtered = filtered.filter(
        (report) => report.subjectName === selectedSubject
      );
    }

    if (selectedMonth !== "all") {
      filtered = filtered.filter(
        (report) => report.classCount === selectedMonth
      );
    }

    setFilteredReports(filtered);
  }, [reports, searchTerm, selectedStudent, selectedSubject, selectedMonth]);

  return (
    <div className="management-container">
      <div className="management-header">
        <div>
          <h2>Monthly Reports</h2>
          <p className="total-count">{filteredReports.length} Total Reports</p>
        </div>
        <div className="header-buttons">
          <SyncButton
            isSyncing={isSyncing}
            onClick={() => fetchReports(true)}
          />
        </div>
      </div>

      <div className="filter-section">
        <div className="search-box">
          <FaSearch className="search-icon" />
          <input
            type="text"
            placeholder="Search by student or subject..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="filter-box">
          <FaFilter className="filter-icon" />
          <Select
            className="student-select"
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
            {uniqueStudents.map((student) => (
              <MenuItem key={student.id} value={student.id}>
                {student.studentId} - {student.name}
              </MenuItem>
            ))}
          </Select>
        </div>

        <div className="filter-box">
          <FaFilter className="filter-icon" />
          <Select
            className="subject-select"
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
            {uniqueSubjects.map((subject) => (
              <MenuItem key={subject} value={subject}>
                {subject}
              </MenuItem>
            ))}
          </Select>
        </div>

        <div className="filter-box">
          <FaFilter className="filter-icon" />
          <Select
            className="month-select"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
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
            {generateMonthYearOptions().map((month) => (
              <MenuItem key={month} value={month}>
                {month}
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
            setSearchTerm("");
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
        ) : filteredReports.length > 0 ? (
          <table>
            <thead>
              <tr>
                <th>Student</th>
                <th>Subject</th>
                <th>Month</th>
                <th>Grade</th>
                <th>Teacher</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredReports.map((report) => (
                <tr key={report._id}>
                  <td>
                    <div style={{ fontWeight: "500" }}>
                      {report.studentNameFromUser
                        ?.replace("(Inactive Student)", "")
                        .trim()}
                    </div>
                    {report.studentNameFromUser?.includes(
                      "(Inactive Student)"
                    ) && (
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
                    <span style={{ color: "#64748b", fontSize: "0.8125rem" }}>
                      ID: {report.student.studentId}
                    </span>
                  </td>
                  <td style={{ fontWeight: "500" }}>{report.subjectName}</td>
                  <td style={{ fontWeight: "500" }}>{report.classCount}</td>
                  <td>{report.grade}</td>
                  <td>{report.teacher.name}</td>
                  <td>
                    <span className={`status-tag ${report.status}`}>
                      {report.status}
                    </span>
                  </td>
                  <td>
                    <div className="actions">
                      <button
                        onClick={() =>
                          handleViewReport(report._id, report.client)
                        }
                        title="View Report"
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
            <p>No reports found</p>
          </div>
        )}
      </div>
      <NotificationSnackbar
        notification={notification}
        onClose={closeNotification}
      />
    </div>
  );
};

export default ClientStudentMonthlyReport;
