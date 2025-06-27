import { useState, useEffect } from "react";
import { FaUsers, FaCalendarCheck, FaClock, FaBell } from "react-icons/fa";
import axios from "axios";
import styles from "../../../../styles/components/HomeScreens.module.css";
import StatCard from "../../StatCard";
import useNotification from "../../../../hooks/useNotification";
import NotificationSnackbar from "../../../../components/common/NotificationSnackbar";
import SyncButton from "../../../../components/common/SyncButton";

const TeacherHome = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const { notification, showNotification, closeNotification } =
    useNotification();

  const BASE_URL = import.meta.env.VITE_BASE_URL;

  const fetchStats = async (showSuccessMessage = false) => {
    setIsSyncing(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        showNotification("Authentication required", "error");
        return;
      }

      const response = await axios.get(
        `${BASE_URL}/api/teachers/dashboard-stats`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      setStats(response.data.stats);
      setLoading(false);
      if (showSuccessMessage) {
        showNotification("Dashboard refreshed successfully");
      }
    } catch (error) {
      console.error("Error fetching stats:", error);
      showNotification("Error refreshing dashboard", "error");
      setLoading(false);
    } finally {
      setIsSyncing(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const formatTime = (timeString) => {
    const [hours, minutes] = timeString.split(":");
    const date = new Date();
    date.setHours(parseInt(hours));
    date.setMinutes(parseInt(minutes));

    return date
      .toLocaleString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      })
      .toUpperCase();
  };

  const formatDateTime = (dateString) => {
    return new Date(dateString).toLocaleString("en-GB", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  const getStatusStyle = (status) => {
    const statusMap = {
      pending: {
        color: "#f59e0b",
        backgroundColor: "#fef3c7",
        label: "Pending",
      },
      available: {
        color: "#0369a1",
        backgroundColor: "#e0f2fe",
        label: "Available",
      },
      in_progress: {
        color: "#059669",
        backgroundColor: "#d1fae5",
        label: "In Progress",
      },
      completed: {
        color: "#065f46",
        backgroundColor: "#d1fae5",
        label: "Completed",
      },
      leave: { color: "#ea580c", backgroundColor: "#fed7aa", label: "Leave" },
      absent: { color: "#dc2626", backgroundColor: "#fee2e2", label: "Absent" },
    };
    return (
      statusMap[status] || {
        color: "#64748b",
        backgroundColor: "#f1f5f9",
        label: "Unknown",
      }
    );
  };

  const dashboardStats = [
    {
      title: "Unread Announcements",
      count: stats?.unreadAnnouncements || 0,
      icon: <FaBell />,
      color: "#3949ab",
    },
    {
      title: "Assigned Students",
      count: stats?.totalStudents || 0,
      icon: <FaUsers />,
      color: "#3949ab",
    },
    {
      title: "Today's Classes",
      count: stats?.todayClasses?.total || 0,
      details: [
        {
          label: "Pending",
          value: stats?.todayClasses?.pending || 0,
          color: "#f59e0b",
        },
        {
          label: "Available",
          value: stats?.todayClasses?.available || 0,
          color: "#0369a1",
        },
        {
          label: "In Progress",
          value: stats?.todayClasses?.inProgress || 0,
          color: "#059669",
        },
        {
          label: "Completed",
          value: stats?.todayClasses?.completed || 0,
          color: "#065f46",
        },
        {
          label: "Leave",
          value: stats?.todayClasses?.leave || 0,
          color: "#ea580c",
        },
        {
          label: "Absent",
          value: stats?.todayClasses?.absent || 0,
          color: "#dc2626",
        },
      ],
      icon: <FaCalendarCheck />,
      color: "#00838f",
    },
  ];

  return (
    <div className={styles.homeContainer}>
      <div className={styles.homeHeader}>
        <div>
          <h2>Dashboard Overview</h2>
        </div>
        <div className={styles.headerButtons}>
          <SyncButton isSyncing={isSyncing} onClick={() => fetchStats(true)} />
        </div>
      </div>

      <div className={styles.homeStatsGrid}>
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
        <h3 className={styles.sectionTitle}>
          <FaClock className={styles.sectionIcon} />
          Today's Classes Details
        </h3>
        <div className={styles.detailSection}>
          {stats?.detailedTodayClasses &&
          stats.detailedTodayClasses.length > 0 ? (
            <div className={styles.todayClassesGrid}>
              {stats.detailedTodayClasses.map((todayClass, index) => {
                const statusStyle = getStatusStyle(todayClass.status);

                return (
                  <div key={index} className={styles.todayClassCard}>
                    <div className={styles.detailGrid}>
                      <div className={styles.detailItem}>
                        <span className={styles.detailLabel}>Subject</span>
                        <span className={styles.detailValue}>
                          {todayClass.subject}
                        </span>
                      </div>
                      <div className={styles.detailItem}>
                        <span className={styles.detailLabel}>Students</span>
                        <span className={styles.detailValue}>
                          {todayClass.studentsDetails
                            .map((student) => {
                              const isInactive =
                                student.name.includes("(Inactive Student)");
                              const cleanName = student.name
                                .replace("(Inactive Student)", "")
                                .trim();
                              const displayText = `${student.studentId} - ${cleanName}`;

                              return isInactive ? (
                                <span key={student.studentId}>
                                  <span>{displayText}</span>
                                  <span className={styles.inactiveStudentLabel}>
                                    (Inactive Student)
                                  </span>
                                </span>
                              ) : (
                                <span key={student.studentId}>
                                  {displayText}
                                </span>
                              );
                            })
                            .reduce(
                              (prev, curr, index) =>
                                index === 0 ? [curr] : [...prev, ", ", curr],
                              []
                            )}
                        </span>
                      </div>
                      <div className={styles.detailItem}>
                        <span className={styles.detailLabel}>Time</span>
                        <span className={styles.detailValue}>
                          {formatTime(todayClass.time)}
                          {todayClass.endTime && (
                            <span> - {formatTime(todayClass.endTime)}</span>
                          )}
                        </span>
                      </div>
                      <div className={styles.detailItem}>
                        <span className={styles.detailLabel}>Date</span>
                        <span className={styles.detailValue}>
                          {formatDateTime(todayClass.date)}
                        </span>
                      </div>
                      <div className={styles.detailItem}>
                        <span className={styles.detailLabel}>Status</span>
                        <span
                          className={styles.detailValue}
                          style={{
                            color: statusStyle.color,
                            backgroundColor: statusStyle.backgroundColor,
                            padding: "4px 8px",
                            borderRadius: "4px",
                            fontSize: "0.8rem",
                            fontWeight: "600",
                            textTransform: "capitalize",
                            display: "inline-block",
                            width: "fit-content",
                            maxWidth: "max-content",
                          }}
                        >
                          {statusStyle.label}
                        </span>
                      </div>

                      {(todayClass.teacherAvailableAt ||
                        todayClass.classStartedAt ||
                        todayClass.classEndedAt) && (
                        <div
                          className={styles.detailItem}
                          style={{ gridColumn: "1 / -1" }}
                        >
                          <span className={styles.detailLabel}>Timeline</span>
                          <div
                            style={{
                              display: "flex",
                              gap: "12px",
                              flexWrap: "wrap",
                              fontSize: "0.9rem",
                            }}
                          >
                            {todayClass.teacherAvailableAt && (
                              <span
                                style={{
                                  color: "#1e40af",
                                  fontWeight: "600",
                                }}
                              >
                                Available:{" "}
                                {formatDateTime(todayClass.teacherAvailableAt)}
                              </span>
                            )}
                            {todayClass.classStartedAt && (
                              <span
                                style={{
                                  color: "#15803d",
                                  fontWeight: "600",
                                }}
                              >
                                Started:{" "}
                                {formatDateTime(todayClass.classStartedAt)}
                              </span>
                            )}
                            {todayClass.classEndedAt && (
                              <span
                                style={{
                                  color: "#166534",
                                  fontWeight: "600",
                                }}
                              >
                                Ended: {formatDateTime(todayClass.classEndedAt)}
                              </span>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className={styles.emptyState}>
              <FaCalendarCheck className={styles.emptyStateIcon} />
              <p className={styles.emptyStateTitle}>
                No classes scheduled for today
              </p>
              <p className={styles.emptyStateText}>
                Your today's classes will appear here when scheduled
              </p>
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

export default TeacherHome;
