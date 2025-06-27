import {
  FaHome,
  FaUsers,
  FaGraduationCap,
  FaChalkboardTeacher,
  FaUserCog,
  FaBookOpen,
  FaBullhorn,
  FaUsersCog,
  FaUserCheck,
  FaMoneyBill,
  FaFileInvoice,
  FaCalendarCheck,
  FaBookReader,
  FaQuestionCircle,
} from "react-icons/fa";
import styles from "../../styles/components/Dashboard.module.css";

export const adminMenu = (unreadQueries = 0) => [
  { icon: <FaHome />, title: "Dashboard", path: "/admin-dashboard" },
  { icon: <FaUsers />, title: "Clients", path: "/admin-dashboard/clients" },
  {
    icon: <FaGraduationCap />,
    title: "Students",
    path: "/admin-dashboard/students",
  },
  {
    icon: <FaChalkboardTeacher />,
    title: "Teachers",
    path: "/admin-dashboard/teachers",
  },
  {
    icon: <FaUserCog />,
    title: "Supervisors",
    path: "/admin-dashboard/supervisors",
  },
  {
    icon: <FaBookOpen />,
    title: "Subjects",
    path: "/admin-dashboard/subjects",
  },
  {
    icon: <FaBullhorn />,
    title: "Announcements",
    path: "/admin-dashboard/announcements",
  },
  {
    icon: <FaUsersCog />,
    title: "Staff Attendance",
    path: "/admin-dashboard/staff-attendance",
  },
  {
    icon: <FaUserCheck />,
    title: "Student Attendance",
    path: "/admin-dashboard/student-attendance",
  },
  {
    icon: <FaMoneyBill />,
    title: "Fee Challans",
    path: "/admin-dashboard/fee-challans",
  },
  {
    icon: <FaFileInvoice />,
    title: "Salary Invoices",
    path: "/admin-dashboard/salary-invoices",
  },
  {
    icon: <FaCalendarCheck />,
    title: "Schedules",
    path: "/admin-dashboard/schedules",
  },
  {
    icon: <FaBookReader />,
    title: "Student Lessons",
    path: "/admin-dashboard/lessons",
  },
  {
    icon: (
      <div className={styles.navIconContainer}>
        <FaQuestionCircle />
        {unreadQueries > 0 && (
          <span className={styles.navBadge}>{unreadQueries}</span>
        )}
      </div>
    ),
    title: "Staff Queries",
    path: "/admin-dashboard/queries",
  },
];
