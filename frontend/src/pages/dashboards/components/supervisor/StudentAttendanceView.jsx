import { useState, useEffect } from "react";
import { FaSearch, FaFilter } from "react-icons/fa";
import { CircularProgress, Button, Select, MenuItem } from "@mui/material";
import ReactDatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { format } from "date-fns";
import axios from "axios";
import "../../../../styles/components/Management.css";
import useNotification from "../../../../hooks/useNotification";
import NotificationSnackbar from "../../../../components/common/NotificationSnackbar";
import SyncButton from "../../../../components/common/SyncButton";
const StudentAttendanceView = () => {
  const [attendance, setAttendance] = useState([]);
  const [filteredAttendance, setFilteredAttendance] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [dateRange, setDateRange] = useState([null, null]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState("all");
  const [selectedStudent, setSelectedStudent] = useState("all");
  const [allStudents, setAllStudents] = useState([]);
  const [uniqueSubjects, setUniqueSubjects] = useState([]);
  const [timeRange, setTimeRange] = useState({ start: "", end: "" });
  const [showActiveStudentAttendance, setShowActiveStudentAttendance] =
    useState(false);
  const [showInactiveStudentAttendance, setShowInactiveStudentAttendance] =
    useState(false);
  const [stats, setStats] = useState({
    totalRecords: 0,
    attendancePercentage: "0.00%",
    totals: {
      present: 0,
      absent: 0,
      leave: 0,
      todayPresent: 0,
    },
  });
  const { notification, showNotification, closeNotification } =
    useNotification();

  const BASE_URL = import.meta.env.VITE_BASE_URL;

  const convertTo12Hour = (time) => {
    if (!time) return "";
    const [hours, minutes] = time.split(":");
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? "PM" : "AM";
    const hour12 = hour % 12 || 12;
    return `${hour12.toString().padStart(2, "0")}:${minutes} ${ampm}`;
  };

  const calculateStats = (data) => {
    const today = new Date()
      .toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      })
      .split("/")
      .join("-");

    const totals = {
      present: data.filter(
        (record) => record.status.toLowerCase() === "present"
      ).length,
      absent: data.filter((record) => record.status.toLowerCase() === "absent")
        .length,
      leave: data.filter((record) => record.status.toLowerCase() === "leave")
        .length,
      todayPresent: data.filter((record) => {
        return (
          record.status.toLowerCase() === "present" && record.date === today
        );
      }).length,
    };

    const totalRecords = data.length;
    const attendancePercentage =
      totalRecords > 0
        ? `${((totals.present / totalRecords) * 100).toFixed(2)}%`
        : "0.00%";

    return {
      totalRecords,
      attendancePercentage,
      totals,
    };
  };

  useEffect(() => {
    const token = localStorage.getItem("token");
    const user = JSON.parse(localStorage.getItem("user"));
    const role = localStorage.getItem("role");

    if (!token || !user || !role) {
      showNotification("Authentication required", "error");
      return;
    }

    axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      await Promise.all([fetchStudents(), fetchAttendance()]);
    } catch (error) {
      console.error("Error fetching initial data:", error);
    }
  };

  const fetchStudents = async () => {
    try {
      const role = localStorage.getItem("role");
      let endpoint = "";
      if (role === "supervisor_quran") {
        endpoint = `${BASE_URL}/api/supervisors/students/quran`;
      } else if (role === "supervisor_subjects") {
        endpoint = `${BASE_URL}/api/supervisors/students/subjects`;
      } else {
        throw new Error("Invalid supervisor role");
      }

      const response = await axios.get(endpoint);
      if (response.data && Array.isArray(response.data.users)) {
        setAllStudents(response.data.users);
      }
    } catch (error) {
      showNotification(
        error.response?.data?.message || "Error fetching students",
        "error"
      );
    }
  };
  const parseDate = (dateString) => {
    const [day, month, year] = dateString.split("-");
    return new Date(year, month - 1, day);
  };
  const fetchAttendance = async () => {
    setIsSyncing(true);
    try {
      const response = await axios.get(
        `${BASE_URL}/api/student-attendance/supervisor/view`
      );

      const { data } = response.data;

      const formattedData = data.map((record) => ({
        ...record,
        date: record.date,
        formattedDate: format(parseDate(record.date), "dd-MM-yyyy"),
      }));

      setAttendance(formattedData);
      setFilteredAttendance(formattedData);
      setStats(calculateStats(formattedData));

      const subjects = Array.from(
        new Set(
          data.map((record) =>
            JSON.stringify({
              id: record.subject,
              name: record.subjectName,
            })
          )
        )
      ).map((str) => JSON.parse(str));

      setUniqueSubjects(subjects);
      showNotification("Attendance data refreshed successfully");
    } catch (error) {
      showNotification(
        error.response?.data?.message || "Error fetching attendance",
        "error"
      );
    } finally {
      setIsSyncing(false);
      setIsLoading(false);
    }
  };
  useEffect(() => {
    let filtered = [...attendance];

    if (searchTerm) {
      const isNumericSearch = /^\d+$/.test(searchTerm);
      filtered = filtered.filter(
        (record) =>
          record.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          record.subjectName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (isNumericSearch &&
            record.user &&
            record.user.studentId &&
            record.user.studentId.toString().includes(searchTerm))
      );
    }

    if (showActiveStudentAttendance && !showInactiveStudentAttendance) {
      filtered = filtered.filter((record) => record.user.isActive !== false);
    } else if (!showActiveStudentAttendance && showInactiveStudentAttendance) {
      filtered = filtered.filter((record) => record.user.isActive === false);
    }

    if (selectedStudent !== "all") {
      filtered = filtered.filter(
        (record) => record.user._id === selectedStudent
      );
    }

    if (selectedSubject !== "all") {
      filtered = filtered.filter(
        (record) => record.subject === selectedSubject
      );
    }

    if (dateRange[0] && dateRange[1]) {
      filtered = filtered.filter((record) => {
        const recordDate = parseDate(record.date);
        return recordDate >= dateRange[0] && recordDate <= dateRange[1];
      });
    }
    if (timeRange.start && timeRange.end) {
      filtered = filtered.filter((record) => {
        const scheduleStart = record.schedule.startTime;
        const scheduleEnd = record.schedule.endTime;

        const getMinutes = (timeStr) => {
          const [hours, minutes] = timeStr.split(":").map(Number);
          return hours * 60 + minutes;
        };

        const filterStart = getMinutes(timeRange.start);
        const filterEnd = getMinutes(timeRange.end);
        const classStart = getMinutes(scheduleStart);
        const classEnd = getMinutes(scheduleEnd);

        return classStart >= filterStart && classEnd <= filterEnd;
      });
    }
    setFilteredAttendance(filtered);
    setStats(calculateStats(filtered));
  }, [
    attendance,
    searchTerm,
    selectedStudent,
    selectedSubject,
    dateRange,
    timeRange,
    showActiveStudentAttendance,
    showInactiveStudentAttendance,
  ]);
  return (
    <div className="management-container">
      <div className="management-header">
        <div>
          <h2>Student Attendance</h2>
          <p className="total-count">
            {stats.totalRecords} Total Records | Attendance Rate:{" "}
            {stats.attendancePercentage}
          </p>
        </div>
        <div className="header-buttons">
          <SyncButton
            isSyncing={isSyncing}
            onClick={() => fetchAttendance(true)}
          />
        </div>
      </div>
      <div className="stats-cards">
        <div className="stat-card today-present">
          <h3>Today's Present</h3>
          <p>{stats.totals.todayPresent}</p>
          <span className="percentage">
            {filteredAttendance.length > 0
              ? `${(
                  (stats.totals.todayPresent / filteredAttendance.length) *
                  100
                ).toFixed(1)}%`
              : "0.0%"}
          </span>
        </div>
        {/* <div className="stat-card total-present">
          <h3>Total Present</h3>
          <p>{stats.totals.present}</p>
          <span className="percentage">{stats.attendancePercentage}</span>
        </div> */}
        <div className="stat-card absent">
          <h3>Total Absent</h3>
          <p>{stats.totals.absent}</p>
          <span className="percentage">
            {stats.totalRecords > 0
              ? `${((stats.totals.absent / stats.totalRecords) * 100).toFixed(
                  1
                )}%`
              : "0.0%"}
          </span>
        </div>
        <div className="stat-card leave">
          <h3>Total Leave</h3>
          <p>{stats.totals.leave}</p>
          <span className="percentage">
            {stats.totalRecords > 0
              ? `${((stats.totals.leave / stats.totalRecords) * 100).toFixed(
                  1
                )}%`
              : "0.0%"}
          </span>
        </div>
      </div>
      <div className="filter-section">
        <div className="search-box">
          <FaSearch className="search-icon" />
          <input
            type="text"
            placeholder="Search by Student Name/ID or Subject"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="filter-box checkbox-filter">
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={showActiveStudentAttendance}
              onChange={(e) => setShowActiveStudentAttendance(e.target.checked)}
              className="checkbox-input"
            />
            <span className="checkbox-text">Active Students</span>
          </label>
          <label className="checkbox-label" style={{ marginLeft: "16px" }}>
            <input
              type="checkbox"
              checked={showInactiveStudentAttendance}
              onChange={(e) =>
                setShowInactiveStudentAttendance(e.target.checked)
              }
              className="checkbox-input"
            />
            <span className="checkbox-text">Inactive Students</span>
          </label>
        </div>
        <div className="filter-box">
          <FaFilter className="filter-icon" />
          <Select
            className="staff-select"
            value={selectedStudent}
            onChange={(e) => setSelectedStudent(e.target.value)}
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
            <MenuItem value="all">All Students</MenuItem>
            {allStudents.map((student) => (
              <MenuItem key={student._id} value={student._id}>
                {student.profile.studentId} - {student.name}
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
            {uniqueSubjects.map((subject) => (
              <MenuItem key={subject.id} value={subject.id}>
                {subject.name}
              </MenuItem>
            ))}
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
              <div
                className="date-input-wrapper"
                style={{
                  position: "relative",
                  width: window.innerWidth <= 768 && "100%",
                }}
              >
                {window.innerWidth >= 768 && (
                  <FaFilter
                    className="filter-icon"
                    style={{
                      position: "absolute",
                      left: "12px",
                      top: "50%",
                      transform: "translateY(-50%)",
                      color: "#94a3b8",
                      fontSize: "0.875rem",
                      zIndex: 1,
                    }}
                  />
                )}
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
                  style={{
                    width: "100%",
                    height: "44px",
                    padding:
                      window.innerWidth >= 768
                        ? "8px 12px 8px 36px"
                        : "8px 12px",
                    backgroundColor: "white",
                    border: "1px solid #e2e8f0",
                    borderRadius: "8px",
                    fontSize: "0.875rem",
                    color: "#475569",
                    cursor: "pointer",
                    boxSizing: "border-box",
                  }}
                />
              </div>
            }
          />
        </div>
        <div className="filter-box">
          <div
            style={{
              display: "flex",
              gap: "8px",
              alignItems: "center",
              flexDirection: "row",
            }}
          >
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
                width: window.innerWidth < 768 ? "100%" : "130px",
              }}
            />
            <span
              style={{
                color: "#64748b",
                textAlign: window.innerWidth < 768 ? "center" : "left",
              }}
            >
              to
            </span>
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
                width: window.innerWidth < 768 ? "100%" : "130px",
              }}
            />
          </div>
        </div>
        <button
          className="clear-filters-btn"
          onClick={() => {
            setDateRange([null, null]);
            setSelectedSubject("all");
            setSelectedStudent("all");
            setSearchTerm("");
            setTimeRange({ start: "", end: "" });
            setShowActiveStudentAttendance(false);
            setShowInactiveStudentAttendance(false);
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
        ) : filteredAttendance.length > 0 ? (
          <table>
            <thead>
              <tr>
                <th style={{ width: "200px" }}>Student Name</th>
                <th style={{ width: "200px" }}>Subject</th>
                <th>Date</th>
                <th>Time</th>
                <th>Status</th>
                <th>Remarks</th>
                <th>Marked By</th>
              </tr>
            </thead>
            <tbody>
              {filteredAttendance.map((record) => (
                <tr key={record._id}>
                  <td>
                    <div style={{ fontWeight: "500" }}>
                      <div>
                        {record.user.name &&
                        record.user.name.includes("(Inactive Student)")
                          ? record.user.name.replace(" (Inactive Student)", "")
                          : record.user.name}
                      </div>
                      {record.user.isActive === false && (
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
                    </div>
                    <span style={{ color: "#64748b", fontSize: "0.8125rem" }}>
                      ID: {record.user.studentId}
                    </span>
                  </td>
                  <td>{record.subjectName}</td>
                  <td>{record.date}</td>
                  <td>
                    <>
                      {`${convertTo12Hour(record.schedule.startTime)}`} <br />
                      {`${convertTo12Hour(record.schedule.endTime)}`}
                    </>
                  </td>
                  <td>
                    <span
                      className={`status-tag student-attendance ${record.status.toLowerCase()}`}
                    >
                      {record.status}
                    </span>
                  </td>
                  <td>{record.remarks}</td>
                  <td>
                    <div>
                      <div style={{ fontWeight: "500" }}>
                        {record.schedule.teacherName &&
                        record.schedule.teacherName.includes(
                          "(Inactive Teacher)"
                        )
                          ? record.schedule.teacherName.replace(
                              " (Inactive Teacher)",
                              ""
                            )
                          : record.schedule.teacherName}
                      </div>
                      {record.schedule.teacherName &&
                        record.schedule.teacherName.includes(
                          "(Inactive Teacher)"
                        ) && (
                          <div
                            style={{
                              color: "#dc2626",
                              fontSize: "0.75rem",
                              fontWeight: "500",
                              marginTop: "2px",
                            }}
                          >
                            (Inactive Teacher)
                          </div>
                        )}
                    </div>
                  </td>{" "}
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="no-data">
            <p>No attendance records found</p>
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

export default StudentAttendanceView;
