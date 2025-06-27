import {
  FaHome,
  FaBullhorn,
  FaUserCheck,
  FaCalendarCheck,
  FaBookReader,
  FaFileInvoice,
  FaUsersCog,
  FaQuestionCircle,
} from "react-icons/fa";

export const supervisorMenu = (unreadQueries = 0, unreadAnnouncements = 0) => [
  { icon: <FaHome />, title: "Dashboard", path: "/supervisor-dashboard" },
  {
    icon: <FaBullhorn />,
    title: "Announcements",
    path: "/supervisor-dashboard/announcements",
    badge: unreadAnnouncements > 0 ? unreadAnnouncements : null,
  },
  {
    icon: <FaUserCheck />,
    title: "Student Attendance",
    path: "/supervisor-dashboard/student-attendance",
  },
  {
    icon: <FaCalendarCheck />,
    title: "Schedules",
    path: "/supervisor-dashboard/schedule",
  },
  {
    icon: <FaBookReader />,
    title: "Student Lessons",
    path: "/supervisor-dashboard/lessons",
  },
  {
    icon: <FaFileInvoice />,
    title: "Salary Invoices",
    path: "/supervisor-dashboard/salary",
  },
  {
    icon: <FaUsersCog />,
    title: "My Attendance",
    path: "/supervisor-dashboard/attendance",
  },
  {
    icon: <FaQuestionCircle />,
    title: "Queries",
    path: "/supervisor-dashboard/queries",
    badge: unreadQueries > 0 ? unreadQueries : null,
  },
];
