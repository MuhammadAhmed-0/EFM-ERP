import {
  FaHome,
  FaBullhorn,
  FaCalendarCheck,
  FaFileInvoice,
  FaUsersCog,
  FaQuestionCircle,
} from "react-icons/fa";

export const teacherMenu = (
  unreadQueries = 0,
  showReports = false,
  unreadAnnouncements = 0
) => {
  const menu = [
    { icon: <FaHome />, title: "Dashboard", path: "/teacher-dashboard" },
    {
      icon: <FaBullhorn />,
      title: "Announcements",
      path: "/teacher-dashboard/announcements",
      badge: unreadAnnouncements > 0 ? unreadAnnouncements : null,
    },
    {
      icon: <FaCalendarCheck />,
      title: "My Schedule",
      path: "/teacher-dashboard/schedule",
    },
    {
      icon: <FaFileInvoice />,
      title: "Salary Invoices",
      path: "/teacher-dashboard/salary",
    },
    {
      icon: <FaUsersCog />,
      title: "My Attendance",
      path: "/teacher-dashboard/attendance",
    },
    {
      icon: <FaQuestionCircle />,
      title: "Queries",
      path: "/teacher-dashboard/queries",
      badge: unreadQueries > 0 ? unreadQueries : null,
    },
  ];

  if (showReports) {
    menu.push({
      icon: <FaFileInvoice />,
      title: "Student Reports",
      path: "/teacher-dashboard/student-reports",
    });
  }

  return menu;
};
