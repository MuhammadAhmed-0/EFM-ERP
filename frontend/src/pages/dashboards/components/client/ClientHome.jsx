import { useState, useEffect } from "react";
import {
  FaBell,
  FaUsers,
  FaMoneyBillWave,
  FaCalendarCheck,
  FaChevronDown,
} from "react-icons/fa";
import axios from "axios";
import styles from "../../../../styles/components/HomeScreens.module.css";
import StatCard from "../../StatCard";
import useNotification from "../../../../hooks/useNotification";
import NotificationSnackbar from "../../../../components/common/NotificationSnackbar";
import SyncButton from "../../../../components/common/SyncButton";

const ClientDashboardHome = () => {
  const [stats, setStats] = useState(null);
  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const { notification, showNotification, closeNotification } =
    useNotification();

  const BASE_URL = import.meta.env.VITE_BASE_URL;

  const fetchStats = async (showSuccessMessage = false) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        showNotification("Authentication required", "error");
        return;
      }

      const response = await axios.get(
        `${BASE_URL}/api/clients/dashboard-stats`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      setStats(response.data.stats);
      if (showSuccessMessage) {
        showNotification("Dashboard data refreshed successfully");
      }
    } catch (error) {
      console.error("Error fetching stats:", error);
      showNotification("Error refreshing dashboard data", "error");
    }
  };

  const fetchStudents = async (showSuccessMessage = false) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      const response = await axios.get(`${BASE_URL}/api/clients/students`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setStudents(response.data.students);
      setSelectedStudent(response.data.students[0]);
      if (showSuccessMessage) {
        showNotification("Student data refreshed successfully");
      }
    } catch (error) {
      console.error("Error fetching students:", error);
      showNotification("Error refreshing student data", "error");
    }
  };

  const refreshAll = async () => {
    setIsSyncing(true);
    try {
      await Promise.all([fetchStats(false), fetchStudents(false)]);
      showNotification("Dashboard refreshed successfully");
    } catch (error) {
      showNotification("Error refreshing dashboard", "error");
    } finally {
      setIsSyncing(false);
    }
  };

  useEffect(() => {
    fetchStats();
    fetchStudents();
  }, []);

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const dashboardStats = [
    {
      title: "Announcements",
      count: stats?.unreadAnnouncements || 0,
      details: [
        {
          label: "Unread",
          value: stats?.unreadAnnouncements || 0,
          color: "#3949ab",
        },
      ],
      icon: <FaBell />,
      color: "#3949ab",
    },
    {
      title: "Students",
      count: stats?.students.total || 0,
      icon: <FaUsers />,
      color: "#16a34a",
    },
    {
      title: "Current Month Fee",
      count: `${stats?.currentMonthFee.currency} ${
        stats?.currentMonthFee.amount || 0
      }`,
      details: [
        {
          label: "Status",
          value: stats?.currentMonthFee.status
            ? stats.currentMonthFee.status.charAt(0).toUpperCase() +
              stats.currentMonthFee.status.slice(1).toLowerCase()
            : "N/A",
          color: getStatusColor(stats?.currentMonthFee.status),
        },
      ],
      icon: <FaMoneyBillWave />,
      color: "#ad1457",
    },
    {
      title: "Today's Classes",
      count: stats?.todayClasses.total || 0,
      details: [
        {
          label: "Pending",
          value: stats?.todayClasses.pending || 0,
          color: "#ea580c",
        },
        {
          label: "Completed",
          value: stats?.todayClasses.completed || 0,
          color: "#16a34a",
        },
      ],
      icon: <FaCalendarCheck />,
      color: "#00838f",
    },
  ];

  function getStatusColor(status) {
    switch (status?.toLowerCase()) {
      case "paid":
        return "#16a34a";
      case "pending":
        return "#ea580c";
      case "overdue":
        return "#dc2626";
      default:
        return "#64748b";
    }
  }

  return (
    <div className={styles.homeContainer}>
      <div className={styles.homeHeader}>
        <div>
          <h2>Dashboard Overview</h2>
        </div>
        <div className={styles.headerButtons}>
          <SyncButton isSyncing={isSyncing} onClick={() => refreshAll()} />
        </div>
      </div>

      <div className={styles.homeStatsGridFour}>
        {dashboardStats.map((stat, index) => (
          <StatCard
            key={index}
            title={stat.title}
            count={stat.count}
            icon={stat.icon}
            color={stat.color}
            details={stat.details}
          />
        ))}
      </div>

      <div className={styles.homeAnalyticsSection}>
        <div className={styles.studentDetailsHeader}>
          <div className={styles.studentDetailsTitle}>
            <FaUsers className={styles.sectionIcon} />
            <h3>Student Details</h3>
          </div>

          <div className={styles.selectContainer}>
            <select
              value={selectedStudent?._id || ""}
              onChange={(e) =>
                setSelectedStudent(
                  students.find((s) => s._id === e.target.value)
                )
              }
              className={styles.studentSelect}
            >
              <option value="" disabled>
                All Students
              </option>
              {students.map((student) => (
                <option key={student._id} value={student._id}>
                  {student.name}
                </option>
              ))}
            </select>
            <div className={styles.selectIcon}>
              <FaChevronDown size={12} />
            </div>
          </div>
        </div>

        {selectedStudent && (
          <div className={styles.studentDetailsGrid}>
            <div className={styles.detailSection}>
              <h4 className={styles.detailSectionTitle}>Basic Information</h4>
              <div className={styles.detailGrid}>
                <div className={styles.detailItem}>
                  <span className={styles.detailLabel}>Name</span>
                  <span className={styles.detailValue}>
                    {selectedStudent.name}
                  </span>
                </div>
                <div className={styles.detailItem}>
                  <span className={styles.detailLabel}>Student ID</span>
                  <span className={styles.detailValue}>
                    {selectedStudent.studentId}
                  </span>
                </div>
                <div className={styles.detailItem}>
                  <span className={styles.detailLabel}>Grade</span>
                  <span className={styles.detailValue}>
                    {selectedStudent.grade}
                  </span>
                </div>
                <div className={styles.detailItem}>
                  <span className={styles.detailLabel}>Status</span>
                  <span
                    className={styles.detailValue}
                    style={{
                      color:
                        selectedStudent.status === "regular"
                          ? "#16a34a"
                          : "#ea580c",
                    }}
                  >
                    {selectedStudent.status.toUpperCase()}
                  </span>
                </div>
              </div>
            </div>

            <div className={styles.detailSection}>
              <h4 className={styles.detailSectionTitle}>Enrollment Details</h4>
              <div className={styles.detailGrid}>
                <div className={styles.detailItem}>
                  <span className={styles.detailLabel}>Enrollment Date</span>
                  <span className={styles.detailValue}>
                    {formatDate(selectedStudent.user.enrollmentDate)}
                  </span>
                </div>
              </div>
            </div>

            <div className={styles.detailSection}>
              <h4 className={styles.detailSectionTitle}>Enrolled Subjects</h4>
              <div className={styles.detailGrid}>
                {selectedStudent.subjects.map((subject) => (
                  <div key={subject._id} className={styles.detailItem}>
                    <span className={styles.detailValue}>{subject.name}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className={styles.detailSection}>
              <h4 className={styles.detailSectionTitle}>Assigned Teachers</h4>
              <div className={styles.detailGrid}>
                {selectedStudent.assignedTeachers.map((assignment) => (
                  <div key={assignment._id} className={styles.detailItem}>
                    <span className={styles.detailLabel}>
                      {assignment.subject.name}
                    </span>
                    <span className={styles.detailValue}>
                      {assignment.teacher.name}
                    </span>
                  </div>
                ))}
              </div>
            </div>
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

export default ClientDashboardHome;
