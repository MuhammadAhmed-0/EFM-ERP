import axios from "axios";

export const handleLogout = (navigate, roleKey) => {
  localStorage.removeItem("token");
  localStorage.removeItem("role");
  localStorage.removeItem("user");
  localStorage.removeItem("userId");

  localStorage.removeItem(`is${roleKey}Authenticated`);

  if (roleKey === "Client") {
    localStorage.removeItem("showMonthlyReports");
  }

  delete axios.defaults.headers.common["Authorization"];
  navigate("/");
};
