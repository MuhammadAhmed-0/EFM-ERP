import { Navigate } from "react-router-dom";

const AuthRedirect = ({ children }) => {
  const token = localStorage.getItem("token");
  const role = localStorage.getItem("role");

  if (token && role) {
    switch (role) {
      case "admin":
        return <Navigate to="/admin-dashboard" replace />;
      case "client":
        return <Navigate to="/client-dashboard" replace />;
      case "teacher_quran":
      case "teacher_subjects":
        return <Navigate to="/teacher-dashboard" replace />;
      case "supervisor_quran":
      case "supervisor_subjects":
        return <Navigate to="/supervisor-dashboard" replace />;
      default:
        localStorage.removeItem("token");
        localStorage.removeItem("role");
        return children;
    }
  }

  return children;
};

export default AuthRedirect;
