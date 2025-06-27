import { adminMenu } from "../constants/menus/adminMenu";
import { clientMenu } from "../constants/menus/clientMenu";
import { teacherMenu } from "../constants/menus/teacherMenu";
import { supervisorMenu } from "../constants/menus/supervisorMenu";

export const getDashboardLayoutConfig = (
  role,
  unreadQueries = 0,
  options = {},
  unreadAnnouncements = 0
) => {
  switch (role) {
    case "Admin":
      return {
        color: "#1e3a5c",
        gradient: "linear-gradient(180deg, #234b7c 0%, #1e3a5c 100%)",
        menuItems: adminMenu(unreadQueries),
      };
    case "Supervisor":
      return {
        color: "#1e3a5c",
        gradient: "linear-gradient(135deg, #1e3a5c 0%, #152a44 100%)",
        menuItems: supervisorMenu(unreadQueries, unreadAnnouncements),
      };
    case "Teacher":
      return {
        color: "#2d5c94",
        gradient: "linear-gradient(135deg, #336699 0%, #2d5c94 100%)",
        menuItems: teacherMenu(
          unreadQueries,
          options.isSubjectTeacher,
          unreadAnnouncements
        ),
      };
    case "Client":
      return {
        color: "#234b7c",
        gradient: "linear-gradient(135deg, #2d5c94 0%, #234b7c 100%)",
        menuItems: clientMenu(
          unreadQueries,
          options.showMonthlyReports,
          unreadAnnouncements
        ),
      };
    default:
      return {
        color: "#333",
        gradient: "linear-gradient(#333, #111)",
        menuItems: [],
      };
  }
};
