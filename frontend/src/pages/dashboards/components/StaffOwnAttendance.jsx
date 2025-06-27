import { useState, useEffect } from "react";
import { FaFilter, FaQuestionCircle } from "react-icons/fa";
import { CircularProgress, Button } from "@mui/material";
import ReactDatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import axios from "axios";
import "../../../styles/components/Management.css";
import moment from "moment-timezone";
import QueryModal from "./QueryModal";
import useNotification from "../../../hooks/useNotification";
import NotificationSnackbar from "../../../components/common/NotificationSnackbar";
import SyncButton from "../../../components/common/SyncButton";
const StaffOwnAttendance = () => {
  const [attendance, setAttendance] = useState([]);
  const [filteredAttendance, setFilteredAttendance] = useState([]);
  const [dateRange, setDateRange] = useState([null, null]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [showQueryModal, setShowQueryModal] = useState(false);
  const [queryFormData, setQueryFormData] = useState({
    queryType: "attendance_issue",
    description: "",
  });
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [queryErrors, setQueryErrors] = useState({});
  const [stats, setStats] = useState({
    total: 0,
    present: 0,
    absent: 0,
    leave: 0,
    todayPresent: 0,
  });
  const { notification, showNotification, closeNotification } =
    useNotification();

  const BASE_URL = import.meta.env.VITE_BASE_URL;

  const fetchAttendance = async () => {
    setIsSyncing(true);
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(
        `${BASE_URL}/api/staff-attendance/own-view`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      setAttendance(response.data.data);
      setStats({
        total: response.data.totalRecords,
        present: response.data.totals.present,
        absent: response.data.totals.absent,
        leave: response.data.totals.leave,
        todayPresent: response.data.data.filter(
          (record) =>
            moment(record.date).tz("Asia/Karachi").format("YYYY-MM-DD") ===
              moment().tz("Asia/Karachi").format("YYYY-MM-DD") &&
            record.status.toLowerCase() === "present"
        ).length,
      });
      showNotification("Attendance data refreshed successfully");
    } catch (error) {
      showNotification(
        error.response?.data?.message || "Error fetching attendance",
        "error"
      );
    } finally {
      setIsSyncing(false);
    }
  };
  const handleQueryClick = (record) => {
    setSelectedRecord(record);
    setQueryFormData({
      queryType: "attendance_issue",
      description: "",
    });
    setShowQueryModal(true);
  };
  const handleQueryChange = (e) => {
    const { name, value } = e.target;
    setQueryFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    if (queryErrors[name]) {
      setQueryErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  const handleQuerySubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("No authentication token found");
      }

      const attendanceDetails = `Description: ${queryFormData.description} ---
    
Date: ${moment(selectedRecord.date).tz("Asia/Karachi").format("DD/MM/YYYY")}
Check-in Time: ${
        selectedRecord.inTime
          ? moment(selectedRecord.inTime, "HH:mm").format("hh:mm A")
          : "Not marked"
      }
Check-out Time: ${
        selectedRecord.outTime
          ? moment(selectedRecord.outTime, "HH:mm").format("hh:mm A")
          : "Not marked"
      }
Status: ${selectedRecord.status}`;

      await axios.post(
        `${BASE_URL}/api/announcements/query/create`,
        {
          queryType: "attendance_issue",
          description: attendanceDetails,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      showNotification("Query sent successfully");
      setShowQueryModal(false);
      setQueryFormData({
        queryType: "attendance_issue",
        description: "",
      });
      setSelectedRecord(null);
    } catch (error) {
      showNotification(
        error.response?.data?.message || "Error sending query",
        "error"
      );
    }
  };

  useEffect(() => {
    let filtered = [...attendance];

    if (dateRange[0] && dateRange[1]) {
      filtered = filtered.filter((record) => {
        const recordDate = moment(record.date)
          .tz("Asia/Karachi")
          .startOf("day");
        const startDate = moment(dateRange[0])
          .tz("Asia/Karachi")
          .startOf("day");
        const endDate = moment(dateRange[1]).tz("Asia/Karachi").startOf("day");
        return recordDate.isBetween(startDate, endDate, "day", "[]");
      });
    }

    setFilteredAttendance(filtered);
  }, [attendance, dateRange]);

  useEffect(() => {
    fetchAttendance();
  }, []);

  return (
    <div className="management-container">
      <div className="management-header">
        <div>
          <h2>My Attendance</h2>
          <p className="total-count">
            {filteredAttendance.length} Total Records
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
          <h3>Today's Status</h3>
          <p>{stats.todayPresent > 0 ? "Present" : "Not Marked"}</p>
        </div>
        <div className="stat-card total-present">
          <h3>Total Present</h3>
          <p>{stats.present}</p>
        </div>
        <div className="stat-card absent">
          <h3>Total Absent</h3>
          <p>{stats.absent}</p>
        </div>
        <div className="stat-card leave">
          <h3>Total Leave</h3>
          <p>{stats.leave}</p>
        </div>
      </div>

      <div className="filter-section">
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
            timeZone="Asia/Karachi"
            customInput={
              <div className="date-input-wrapper">
                <FaFilter className="filter-icon" />
                <input
                  className="date-range-input"
                  placeholder="Select date range"
                  value={
                    dateRange[0] && dateRange[1]
                      ? `${moment(dateRange[0])
                          .tz("Asia/Karachi")
                          .format("DD/MM/YYYY")} - ${moment(dateRange[1])
                          .tz("Asia/Karachi")
                          .format("DD/MM/YYYY")}`
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
            setDateRange([null, null]);
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
        ) : filteredAttendance.length > 0 ? (
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>In Time</th>
                <th>Out Time</th>
                <th>Duration</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredAttendance.map((record) => (
                <tr key={record._id} style={{ fontWeight: 500 }}>
                  <td>
                    {moment(record.date)
                      .tz("Asia/Karachi")
                      .format("DD/MM/YYYY")}
                  </td>
                  <td>
                    {record.inTime
                      ? moment(record.inTime, "HH:mm").format("hh:mm A")
                      : ""}
                  </td>
                  <td>
                    {record.outTime
                      ? moment(record.outTime, "HH:mm").format("hh:mm A")
                      : ""}
                  </td>
                  <td>{record.totalDuration}</td>
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
                          record.status.toLowerCase() === "present"
                            ? "#15803d"
                            : record.status.toLowerCase() === "leave"
                            ? "#b45309"
                            : "#991b1b",
                        backgroundColor:
                          record.status.toLowerCase() === "present"
                            ? "#dcfce7"
                            : record.status.toLowerCase() === "leave"
                            ? "#fef3c7"
                            : "#fee2e2",
                      }}
                    >
                      {record.status}
                    </span>
                  </td>
                  <td>
                    <button
                      className="attendance-query-btn"
                      onClick={() => handleQueryClick(record)}
                      style={{
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        padding: "5px",
                        borderRadius: "4px",
                        transition: "all 0.2s ease",
                        color: "#1e3a5c",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <FaQuestionCircle
                        className="attendance-query-icon"
                        color="#64748b"
                        style={{
                          width: "16px",
                          height: "16px",
                        }}
                      />
                    </button>
                  </td>
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
      <QueryModal
        open={showQueryModal}
        onClose={() => setShowQueryModal(false)}
        onSubmit={handleQuerySubmit}
        isLoading={false}
        formData={queryFormData}
        handleChange={handleQueryChange}
        errors={queryErrors}
      />
      <NotificationSnackbar
        notification={notification}
        onClose={closeNotification}
      />
    </div>
  );
};

export default StaffOwnAttendance;
