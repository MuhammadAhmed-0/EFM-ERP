import {
  FaHome,
  FaBullhorn,
  FaMoneyBill,
  FaUserCheck,
  FaCalendarCheck,
  FaFileAlt,
} from "react-icons/fa";

export const clientMenu = (
  unreadQueries = 0,
  showMonthlyReports = false,
  unreadAnnouncements = 0
) => {
  const menu = [
    { icon: <FaHome />, title: "Dashboard", path: "/client-dashboard" },
    {
      icon: <FaBullhorn />,
      title: "Announcements",
      path: "/client-dashboard/announcements",
      badge: unreadAnnouncements > 0 ? unreadAnnouncements : null,
    },
    {
      icon: <FaMoneyBill />,
      title: "Fee Challans",
      path: "/client-dashboard/challans",
    },
    {
      icon: <FaUserCheck />,
      title: "Attendance",
      path: "/client-dashboard/attendance",
    },
    {
      icon: <FaCalendarCheck />,
      title: "Schedule",
      path: "/client-dashboard/schedule",
    },
  ];

  if (showMonthlyReports) {
    menu.push({
      icon: <FaFileAlt />,
      title: "Monthly Reports",
      path: "/client-dashboard/reports",
    });
  }

  return menu;
};
