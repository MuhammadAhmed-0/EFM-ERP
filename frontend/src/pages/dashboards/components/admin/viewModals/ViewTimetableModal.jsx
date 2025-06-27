import React, { useState, useEffect } from "react";
import {
  FaTimes,
  FaSync,
  FaFilter,
  FaChevronDown,
  FaCalendarAlt,
} from "react-icons/fa";
import axios from "axios";
import useNotification from "../../../../../hooks/useNotification";
import NotificationSnackbar from "../../../../../components/common/NotificationSnackbar";
import "../../../../../styles/components/ViewTimetableModal.css";

const ViewTimetableModal = ({ isOpen, onClose, userRole = "admin" }) => {
  const [timetableData, setTimetableData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [subjectTypeFilter, setSubjectTypeFilter] = useState("all");
  const [selectedDate, setSelectedDate] = useState("");
  const { notification, showNotification, closeNotification } =
    useNotification();

  const BASE_URL = import.meta.env.VITE_BASE_URL;

  const getApiEndpoint = (date = null) => {
    const baseEndpoint =
      userRole === "admin"
        ? "/api/schedules/admin/timetable/today"
        : "/api/schedules/supervisor/timetable/today";

    return date ? `${baseEndpoint}?date=${date}` : baseEndpoint;
  };

  const generateTimeSlots = () => {
    const slots = [];
    for (let hour = 7; hour < 19; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const startTime = `${hour.toString().padStart(2, "0")}:${minute
          .toString()
          .padStart(2, "0")}`;
        const endHour = minute === 30 ? hour + 1 : hour;
        const endMinute = minute === 30 ? 0 : 30;
        const endTime = `${endHour.toString().padStart(2, "0")}:${endMinute
          .toString()
          .padStart(2, "0")}`;

        const formatTime = (time) => {
          const [h, m] = time.split(":");
          const hour12 = parseInt(h) > 12 ? parseInt(h) - 12 : parseInt(h);
          const ampm = parseInt(h) >= 12 ? "PM" : "AM";
          const displayHour = hour12 === 0 ? 12 : hour12;
          return `${displayHour}:${m} ${ampm}`;
        };

        slots.push({
          startTime,
          endTime,
          displayText: `${formatTime(startTime)} - ${formatTime(endTime)}`,
        });
      }
    }
    return slots;
  };

  const timeSlots = generateTimeSlots();

  const fetchTimetableData = async (date = null) => {
    if (!isOpen) return;

    setIsLoading(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        showNotification("Authentication required", "error");
        return;
      }

      const url = `${BASE_URL}${getApiEndpoint(date)}`;

      const response = await axios.get(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = response.data.timetable || [];
      setTimetableData(data);
      setFilteredData(data);
    } catch (error) {
      console.error("Error fetching timetable data:", error);
      showNotification("Error fetching timetable data", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDateChange = (event) => {
    const date = event.target.value;
    setSelectedDate(date);
    fetchTimetableData(date);
  };

  const clearDateFilter = () => {
    setSelectedDate("");
    fetchTimetableData();
  };

  const getTodayDate = () => {
    const today = new Date();
    return today.toISOString().split("T")[0];
  };

  const getDisplayDate = () => {
    if (selectedDate) {
      const date = new Date(selectedDate);
      return date.toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    } else {
      return new Date().toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchTimetableData();
    }
  }, [isOpen]);

  useEffect(() => {
    if (subjectTypeFilter === "all") {
      setFilteredData(timetableData);
    } else {
      const filtered = timetableData.filter(
        (schedule) => schedule.subject?.type === subjectTypeFilter
      );
      setFilteredData(filtered);
    }
  }, [subjectTypeFilter, timetableData]);

  const getTeachersWithSchedules = () => {
    const teacherMap = new Map();

    filteredData.forEach((schedule) => {
      const teacherKey = schedule.teacher.name;
      if (!teacherMap.has(teacherKey)) {
        teacherMap.set(teacherKey, {
          name: schedule.teacher.name,
          isActive: schedule.teacher.isActive,
          schedules: [],
        });
      }
      teacherMap.get(teacherKey).schedules.push(schedule);
    });

    return Array.from(teacherMap.values()).sort((a, b) =>
      a.name.localeCompare(b.name)
    );
  };

  const getClassForTimeSlot = (teacher, timeSlot) => {
    return teacher.schedules.find((schedule) => {
      const scheduleStart = schedule.startTime;
      const scheduleEnd = schedule.endTime;
      return (
        scheduleStart <= timeSlot.startTime && scheduleEnd > timeSlot.startTime
      );
    });
  };

  const getCellBackgroundColor = (schedule) => {
    if (!schedule || !schedule.studentAttendances?.length) {
      return "#f3f4f6";
    }

    const statuses = schedule.studentAttendances.map(
      (student) => student.clientStatus
    );
    const uniqueStatuses = [...new Set(statuses)];

    if (uniqueStatuses.length > 1) {
      if (statuses.includes("trial") && statuses.includes("freeze")) {
        return "linear-gradient(45deg, #dcfce7 50%, #fef3c7 50%)";
      }
      if (statuses.includes("trial") && statuses.includes("regular")) {
        return "linear-gradient(45deg, #dcfce7 50%, #dbeafe 50%)";
      }
      if (statuses.includes("freeze") && statuses.includes("regular")) {
        return "linear-gradient(45deg, #fef3c7 50%, #dbeafe 50%)";
      }
      if (
        statuses.includes("trial") &&
        statuses.includes("freeze") &&
        statuses.includes("regular")
      ) {
        return "linear-gradient(120deg, #dcfce7 33%, #fef3c7 33%, #fef3c7 66%, #dbeafe 66%)";
      }
    }

    if (statuses.includes("trial")) {
      return "#dcfce7";
    }
    if (statuses.includes("freeze")) {
      return "#fef3c7";
    }
    if (statuses.every((status) => status === "regular")) {
      return "#dbeafe";
    }

    return "#dbeafe";
  };

  const getClassPatternText = (schedule) => {
    if (!schedule.classPattern) return "";

    const pattern = schedule.classPattern;

    if (
      pattern.recurrencePattern === "custom" &&
      pattern.customDays?.length > 0
    ) {
      return pattern.customDays.join(", ");
    }

    return pattern.displayText || "";
  };

  const formatStudentsForCell = (schedule) => {
    if (!schedule || !schedule.studentAttendances) return "";

    const isQuranSubject = schedule.subject?.type === "quran";

    return schedule.studentAttendances.map((student) => {
      const textColor = student.clientStatus === "freeze" ? "#1e40af" : "#000";

      const classPatternText = getClassPatternText(schedule);
      const studentGrade = student.studentGrade || "N/A";
      const countryInfo = student.country
        ? `${student.country}${student.state ? `, ${student.state}` : ""}`
        : "N/A";

      const tooltipText = isQuranSubject
        ? `Student: ${student.studentName}
      Client: ${student.clientName} (${student.clientId})
      Subject: ${schedule.subject.name}
      Class Pattern: ${classPatternText}
      Country: ${countryInfo}
      Status: ${
        student.clientStatus
          ? student.clientStatus.charAt(0).toUpperCase() +
            student.clientStatus.slice(1)
          : "N/A"
      }`
        : `Student: ${student.studentName}
      Client: ${student.clientName} (${student.clientId})
      Grade: ${studentGrade}
      Subject: ${schedule.subject.name}
      Class Pattern: ${classPatternText}
      Country: ${countryInfo}
      Status: ${
        student.clientStatus
          ? student.clientStatus.charAt(0).toUpperCase() +
            student.clientStatus.slice(1)
          : "N/A"
      }`;

      const displayText = isQuranSubject
        ? `${student.clientName} (${student.clientId})`
        : `${student.clientName} (${student.clientId}) - Grade ${studentGrade}`;

      return (
        <div
          key={student.studentId}
          className="student-info-box"
          data-tooltip={tooltipText}
          style={{
            fontSize: "11px",
            marginBottom: "2px",
            color: textColor,
            cursor: "pointer",
            padding: "3px 4px",
            borderRadius: "3px",
          }}
        >
          <span style={{ fontWeight: "500" }}>{displayText}</span>

          {(!student.studentIsActive || !student.clientIsActive) && (
            <span
              style={{ color: "#dc2626", fontSize: "10px", marginLeft: "4px" }}
            >
              [INACTIVE]
            </span>
          )}
        </div>
      );
    });
  };

  if (!isOpen) return null;

  const teachers = getTeachersWithSchedules();
  const showSubjectFilter = userRole === "admin";

  return (
    <div className="timetable-modal-overlay">
      <div className="timetable-modal">
        <div className="timetable-header">
          <h2>
            {userRole === "admin" ? "Admin " : "Supervisor "}Timetable -{" "}
            <span style={{ color: "#1e3b5d" }}>{getDisplayDate()}</span>
          </h2>
          <div className="timetable-header-buttons">
            <button
              onClick={() => fetchTimetableData(selectedDate)}
              disabled={isLoading}
            >
              <FaSync className={isLoading ? "spinning" : ""} />
              Refresh
            </button>
            <button onClick={onClose}>
              <FaTimes />
              Close
            </button>
          </div>
        </div>

        <div className="timetable-controls">
          <div className="color-legend">
            <div className="legend-title">Status Legend:</div>
            <div className="legend-items">
              <div className="legend-item">
                <div className="legend-color regular"></div>
                <span>Regular</span>
              </div>
              <div className="legend-item">
                <div className="legend-color trial"></div>
                <span>Trial</span>
              </div>
              <div className="legend-item">
                <div className="legend-color freeze"></div>
                <span>Freeze</span>
              </div>
              <div className="legend-item">
                <div className="legend-color mixed"></div>
                <span>Mixed Status</span>
              </div>
              <div className="legend-item">
                <div className="legend-color empty"></div>
                <span>Empty</span>
              </div>
            </div>
          </div>

          <div
            className="filter-section"
            style={{ justifyContent: "flex-end" }}
          >
            {showSubjectFilter && (
              <div className="filter-group">
                <label className="filter-label">
                  <FaFilter className="filter-icon" />
                  Filter by Subject:
                </label>
                <div className="custom-select-wrapper">
                  <select
                    value={subjectTypeFilter}
                    onChange={(e) => setSubjectTypeFilter(e.target.value)}
                    className="subject-filter"
                  >
                    <option value="all">All Subjects</option>
                    <option value="quran">Quran Classes</option>
                    <option value="subjects">Academic Subjects</option>
                  </select>
                  <FaChevronDown className="custom-dropdown-icon" />
                </div>
              </div>
            )}
            <div className="filter-group">
              <label className="filter-label">
                <FaCalendarAlt className="filter-icon" />
                Select Date:
              </label>
              <div className="date-filter-wrapper">
                <input
                  type="date"
                  value={selectedDate}
                  onChange={handleDateChange}
                  className="date-filter-input"
                  max="2030-12-31"
                />
                {selectedDate && (
                  <button onClick={clearDateFilter} className="clear-date-btn">
                    Today
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="timetable-content">
          {isLoading ? (
            <div className="timetable-loading">Loading timetable...</div>
          ) : (
            <div className="timetable-container">
              <table className="timetable-table">
                <thead>
                  <tr>
                    <th className="teacher-column">Teachers</th>
                    {timeSlots.map((slot, index) => (
                      <th key={index} className="time-slot-column-horizontal">
                        <div className="time-slot-text-horizontal">
                          {slot.displayText}
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {teachers.length > 0 ? (
                    teachers.map((teacher, teacherIndex) => (
                      <tr key={teacherIndex}>
                        <td className="teacher-cell">
                          <div className="teacher-info">
                            <span
                              className={`teacher-name ${
                                !teacher.isActive ? "inactive" : ""
                              }`}
                            >
                              {teacher.name}
                            </span>
                            {!teacher.isActive && (
                              <span className="inactive-badge">Inactive</span>
                            )}
                          </div>
                        </td>
                        {timeSlots.map((slot, slotIndex) => {
                          const classInfo = getClassForTimeSlot(teacher, slot);
                          return (
                            <td
                              key={slotIndex}
                              className="time-slot-cell"
                              style={{
                                background: getCellBackgroundColor(classInfo),
                              }}
                            >
                              {classInfo ? (
                                <div className="class-info">
                                  {classInfo.subject?.type !== "quran" && (
                                    <div className="subject-name">
                                      {classInfo.subject.name}
                                    </div>
                                  )}
                                  <div className="students-info">
                                    {formatStudentsForCell(classInfo)}
                                  </div>
                                </div>
                              ) : (
                                <div className="empty-slot">-</div>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={timeSlots.length + 1} className="no-data">
                        {showSubjectFilter && subjectTypeFilter !== "all"
                          ? `No ${
                              subjectTypeFilter === "quran"
                                ? "Quran"
                                : "Academic"
                            } classes scheduled for ${
                              selectedDate ? "selected date" : "today"
                            }`
                          : `No classes scheduled for ${
                              selectedDate ? "selected date" : "today"
                            }`}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <NotificationSnackbar
          notification={notification}
          onClose={closeNotification}
        />
      </div>
    </div>
  );
};

export default ViewTimetableModal;
