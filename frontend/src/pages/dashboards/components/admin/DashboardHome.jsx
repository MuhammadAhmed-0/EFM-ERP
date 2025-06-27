import React, { useState, useEffect } from "react";
import {
  FaUsers,
  FaUserGraduate,
  FaChalkboardTeacher,
  FaBookReader,
  FaCalendarAlt,
} from "react-icons/fa";
import {
  LineChart,
  Line,
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
import ViewTimetableModal from "./viewModals/ViewTimetableModal";

const DashboardHome = () => {
  const [stats, setStats] = useState(null);
  const [studentGrowthData, setStudentGrowthData] = useState([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [showTimetable, setShowTimetable] = useState(false);
  const { notification, showNotification, closeNotification } =
    useNotification();

  const BASE_URL = import.meta.env.VITE_BASE_URL;

  const fetchData = async (showSuccessMessage = false) => {
    setIsSyncing(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        showNotification("Authentication required", "error");
        return;
      }

      const statsResponse = await axios.get(
        `${BASE_URL}/api/admin/dashboard-stats`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      setStats(statsResponse.data.stats);

      const studentsResponse = await axios.get(
        `${BASE_URL}/api/admin/users/student`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      const processedData = processStudentData(studentsResponse.data.users);
      setStudentGrowthData(processedData);

      if (showSuccessMessage) {
        showNotification("Dashboard refreshed successfully");
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      showNotification("Error refreshing dashboard", "error");
    } finally {
      setIsSyncing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const processStudentData = (students) => {
    if (!students || students.length === 0) return [];

    const monthlyData = new Map();
    const currentDate = new Date();
    const firstDate = new Date(
      Math.min(
        ...students.map((student) => new Date(student.profile.enrollmentDate))
      )
    );

    let currentMonth = new Date(firstDate);
    currentMonth.setDate(1);
    currentMonth.setHours(0, 0, 0, 0);

    while (currentMonth <= currentDate) {
      const monthKey = currentMonth.toLocaleString("default", {
        month: "short",
        year: "numeric",
      });

      monthlyData.set(monthKey, {
        month: monthKey,
        totalStudents: 0,
        regularStudents: 0,
        trialStudents: 0,
      });

      const nextMonth = new Date(currentMonth);
      nextMonth.setMonth(nextMonth.getMonth() + 1);
      currentMonth = nextMonth;
    }

    monthlyData.forEach((data, monthKey) => {
      const monthDate = new Date(monthKey);
      const monthEnd = new Date(
        monthDate.getFullYear(),
        monthDate.getMonth() + 1,
        0
      );

      students.forEach((student) => {
        const enrollmentDate = new Date(student.profile.enrollmentDate);

        if (enrollmentDate <= monthEnd) {
          data.totalStudents++;
          const currentStatus = student.profile.status;
          let statusAtMonth = "trial";
          if (student.profile.statusDateHistory) {
            let latestStatusChange = null;
            Object.keys(student.profile.statusDateHistory).forEach((status) => {
              if (
                student.profile.statusDateHistory[status] &&
                student.profile.statusDateHistory[status].length > 0
              ) {
                student.profile.statusDateHistory[status].forEach((entry) => {
                  const statusDate = new Date(entry.date);
                  if (statusDate <= monthEnd) {
                    if (
                      !latestStatusChange ||
                      statusDate > new Date(latestStatusChange.date)
                    ) {
                      latestStatusChange = {
                        status: status,
                        date: statusDate,
                      };
                    }
                  }
                });
              }
            });

            if (latestStatusChange) {
              statusAtMonth = latestStatusChange.status;
            }
          } else if (student.profile.statusDates) {
            if (
              student.profile.statusDates.regular?.date &&
              new Date(student.profile.statusDates.regular.date) <= monthEnd
            ) {
              statusAtMonth = "regular";
            } else if (
              student.profile.statusDates.trial?.date &&
              new Date(student.profile.statusDates.trial.date) <= monthEnd
            ) {
              statusAtMonth = "trial";
            }
          }

          if (statusAtMonth === "regular") {
            data.regularStudents++;
          } else if (statusAtMonth === "trial") {
            data.trialStudents++;
          }
        }
      });
    });

    const result = Array.from(monthlyData.values()).sort((a, b) => {
      const dateA = new Date(a.month);
      const dateB = new Date(b.month);
      return dateA - dateB;
    });

    return result;
  };

  const dashboardStats = [
    {
      title: "Student Statistics",
      count: stats?.students.total || 0,
      details: [
        {
          label: "Regular",
          value: stats?.students.regular || 0,
          color: "#16a34a",
        },
        { label: "Trial", value: stats?.students.trial || 0, color: "#ea580c" },
        {
          label: "Freeze",
          value: stats?.students.freeze || 0,
          color: "#2563eb",
        },
      ],
      icon: <FaUsers />,
      color: "#3949ab",
    },
    {
      title: "Student Subjects",
      count: stats?.subjects.total || 0,
      details: [
        {
          label: "Regular",
          value: stats?.subjects.regular || 0,
          color: "#16a34a",
        },
        {
          label: "Trial",
          value: stats?.subjects.trial || 0,
          color: "#ea580c",
        },
        {
          label: "Freeze",
          value: stats?.subjects.freeze || 0,
          color: "#2563eb",
        },
      ],
      icon: <FaBookReader />,
      color: "#7c3aed",
    },
    {
      title: "Quran Department",
      count: stats?.quranDepartment.total || 0,
      details: [
        {
          label: "Teachers",
          value: stats?.quranDepartment.teachers || 0,
          color: "#16a34a",
        },
        {
          label: "Supervisors",
          value: stats?.quranDepartment.supervisors || 0,
          color: "#ea580c",
        },
      ],
      icon: <FaChalkboardTeacher />,
      color: "#00838f",
    },
    {
      title: "Subjects Department",
      count: stats?.subjectsDepartment.total || 0,
      details: [
        {
          label: "Teachers",
          value: stats?.subjectsDepartment.teachers || 0,
          color: "#16a34a",
        },
        {
          label: "Supervisors",
          value: stats?.subjectsDepartment.supervisors || 0,
          color: "#ea580c",
        },
      ],
      icon: <FaUserGraduate />,
      color: "#ad1457",
    },
  ];

  return (
    <div className={styles.homeContainer}>
      <div className={styles.homeHeader}>
        <div>
          <h2>Dashboard Overview</h2>
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
          <SyncButton isSyncing={isSyncing} onClick={() => fetchData(true)} />
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
            customStyle={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(70px, 1fr))",
              gap: "8px",
              marginTop: "12px",
            }}
          />
        ))}
      </div>
      <div className={styles.homeAnalyticsSection}>
        <h3>Student Growth Analytics</h3>
        <div className={styles.homeChartContainer}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={studentGrowthData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="month"
                angle={-45}
                textAnchor="end"
                height={50}
                tick={{ fontSize: window.innerWidth < 480 ? 10 : 12 }}
              />
              <YAxis tick={{ fontSize: window.innerWidth < 480 ? 10 : 12 }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "white",
                  border: "1px solid #e2e8f0",
                  borderRadius: "8px",
                  padding: "8px",
                  fontSize: window.innerWidth < 480 ? "10px" : "12px",
                }}
                formatter={(value, name) => [`${value} Students`, name]}
                labelFormatter={(label) => `Month: ${label}`}
              />
              <Legend
                wrapperStyle={{
                  fontSize: window.innerWidth < 480 ? "10px" : "12px",
                  paddingTop: "10px",
                }}
              />
              <Line
                type="monotone"
                dataKey="totalStudents"
                name="Total Students"
                stroke="#234b7c"
                strokeWidth={2}
                dot={{ r: window.innerWidth < 480 ? 3 : 4 }}
              />
              <Line
                type="monotone"
                dataKey="regularStudents"
                name="Regular Students"
                stroke="#16a34a"
                strokeWidth={2}
                dot={{ r: window.innerWidth < 480 ? 3 : 4 }}
              />
              <Line
                type="monotone"
                dataKey="trialStudents"
                name="Trial Students"
                stroke="#ea580c"
                strokeWidth={2}
                dot={{ r: window.innerWidth < 480 ? 3 : 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
      <ViewTimetableModal
        isOpen={showTimetable}
        onClose={() => setShowTimetable(false)}
        userRole="admin"
      />
      <NotificationSnackbar
        notification={notification}
        onClose={closeNotification}
      />
    </div>
  );
};

export default DashboardHome;
