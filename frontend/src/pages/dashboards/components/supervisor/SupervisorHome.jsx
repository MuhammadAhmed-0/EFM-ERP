import { useState, useEffect } from "react";
import {
  FaUsers,
  FaCalendarCheck,
  FaClock,
  FaCalendarAlt,
} from "react-icons/fa";
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import axios from "axios";
import styles from "../../../../styles/components/HomeScreens.module.css";
import StatCard from "../../StatCard";
import useNotification from "../../../../hooks/useNotification";
import NotificationSnackbar from "../../../../components/common/NotificationSnackbar";
import SyncButton from "../../../../components/common/SyncButton";
import ViewTimetableModal from "../admin/viewModals/ViewTimetableModal";

const SupervisorHome = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [showTimetable, setShowTimetable] = useState(false);
  const { notification, showNotification, closeNotification } =
    useNotification();
  const BASE_URL = import.meta.env.VITE_BASE_URL;

  const fetchStats = async (showSuccessMessage = false) => {
    setIsSyncing(true);
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(
        `${BASE_URL}/api/supervisors/dashboard-stats`,
        {
          headers: { Authorization: `Bearer ${token}` },
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

  const classesChartData = stats?.classes
    ? [
        { name: "Completed", value: stats.classes.completed, color: "#16a34a" },
        {
          name: "In Progress",
          value: stats.classes.inProgress,
          color: "#ea580c",
        },
        { name: "Pending", value: stats.classes.pending, color: "#2563eb" },
        { name: "Available", value: stats.classes.available, color: "#0369a1" },
        { name: "Absent", value: stats.classes.absent, color: "#dc2626" },
        { name: "Leave", value: stats.classes.leave, color: "#f59e0b" },
      ]
    : [];

  const attendanceChartData = stats?.attendance
    ? [
        { name: "Present", value: stats.attendance.present, color: "#16a34a" },
        { name: "Leave", value: stats.attendance.leave, color: "#ea580c" },
        { name: "Absent", value: stats.attendance.absent, color: "#dc2626" },
      ]
    : [];

  const timingChartData = stats?.timing
    ? [
        {
          name: "Late Started Classes",
          count: stats.timing.lateStartedClasses,
          minutes: stats.timing.totalLateMinutes,
          color: "#dc2626",
        },
        {
          name: "Early Ended Classes",
          count: stats.timing.earlyEndClasses,
          minutes: stats.timing.totalEarlyMinutes,
          color: "#ea580c",
        },
      ]
    : [];

  const dashboardStats = [
    {
      title: "Today's Classes",
      count: stats?.classes.total || 0,
      details: [
        {
          label: "Completed",
          value: stats?.classes.completed || 0,
          color: "#16a34a",
        },
        {
          label: "In Progress",
          value: stats?.classes.inProgress || 0,
          color: "#ea580c",
        },
        {
          label: "Pending",
          value: stats?.classes.pending || 0,
          color: "#2563eb",
        },
        {
          label: "Available",
          value: stats?.classes.available || 0,
          color: "#0369a1",
        },
        {
          label: "Absent",
          value: stats?.classes.absent || 0,
          color: "#dc2626",
        },
        {
          label: "Leave",
          value: stats?.classes.leave || 0,
          color: "#f59e0b",
        },
      ],
      icon: <FaCalendarCheck />,
      color: "#3949ab",
    },
    {
      title: "Today's Student Attendance",
      count: stats?.attendance.total || 0,
      details: [
        {
          label: "Present",
          value: stats?.attendance.present || 0,
          color: "#16a34a",
        },
        {
          label: "Leave",
          value: stats?.attendance.leave || 0,
          color: "#ea580c",
        },
        {
          label: "Absent",
          value: stats?.attendance.absent || 0,
          color: "#dc2626",
        },
      ],
      icon: <FaUsers />,
      color: "#00838f",
    },
    {
      title: "Timing Statistics",
      count: stats?.timing.totalClasses || 0,
      details: [
        {
          label: "Late Started",
          value: stats?.timing.lateStartedClasses || 0,
          color: "#dc2626",
        },
        {
          label: "Early Ended",
          value: stats?.timing.earlyEndClasses || 0,
          color: "#ea580c",
        },
        {
          label: "Total Late Min",
          value: stats?.timing.totalLateMinutes || 0,
          color: "#2563eb",
        },
      ],
      icon: <FaClock />,
      color: "#ad1457",
    },
  ];

  if (loading) {
    return <div className={styles.loading}>Loading...</div>;
  }

  return (
    <div className={styles.homeContainer}>
      <div className={styles.homeHeader}>
        <div>
          <h2>{stats?.departmentType?.toUpperCase()} Department Overview</h2>
        </div>
        <div className={styles.headerButtons}>
          <button
            className={styles.timetableButton}
            onClick={() => setShowTimetable(true)}
          >
            <FaCalendarAlt />
            <span className={styles.timetableButtonText}>
              Today's Timetable
            </span>
          </button>
          <SyncButton isSyncing={isSyncing} onClick={() => fetchStats(true)} />
        </div>
      </div>

      <div className={styles.homeStatsGridThree}>
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

      <div className={styles.homeChartsSection}>
        <h3>Detailed Analytics</h3>
        <div className={styles.chartsGrid}>
          <div className={styles.chartCard}>
            <h4>Classes Distribution</h4>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={classesChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="value" name="Number of Classes">
                  {classesChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className={styles.chartCard}>
            <h4>Attendance Distribution</h4>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={attendanceChartData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  label
                >
                  {attendanceChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className={styles.chartCard}>
            <h4>Timing Analysis</h4>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={timingChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis yAxisId="left" orientation="left" stroke="#8884d8" />
                <YAxis yAxisId="right" orientation="right" stroke="#82ca9d" />
                <Tooltip />
                <Legend />
                <Bar
                  yAxisId="left"
                  dataKey="count"
                  name="Number of Classes"
                  fill="#8884d8"
                />
                <Bar
                  yAxisId="right"
                  dataKey="minutes"
                  name="Total Minutes"
                  fill="#82ca9d"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <ViewTimetableModal
        isOpen={showTimetable}
        onClose={() => setShowTimetable(false)}
        userRole="supervisor"
      />

      <NotificationSnackbar
        notification={notification}
        onClose={closeNotification}
      />
    </div>
  );
};

export default SupervisorHome;
