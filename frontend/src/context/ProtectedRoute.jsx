import { Navigate, useLocation } from "react-router-dom";
import PageNotFound from "../pages/auth/PageNotFound";

const ProtectedRoute = ({ element: Element, allowedRoles }) => {
  const token = localStorage.getItem("token");
  const role = localStorage.getItem("role");
  const location = useLocation();

  if (!token) {
    return <Navigate to="/" replace />;
  }

  if (!role) {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    return <Navigate to="/" replace />;
  }

  const isDashboardRoute = location.pathname.includes("dashboard");
  const isPrintRoute = location.pathname.includes("print");
  const isReportRoute = location.pathname.includes("monthly-report");

  if (isPrintRoute) {
    if (location.pathname.startsWith("/challan/print/") && role !== "admin") {
      return <PageNotFound />;
    }
    if (
      location.pathname.startsWith("/client/challan/print/") &&
      role !== "client"
    ) {
      return <PageNotFound />;
    }
    if (location.pathname.startsWith("/salary/print/") && role !== "admin") {
      return <PageNotFound />;
    }
    if (location.pathname.startsWith("/supervisor/salary/print/")) {
      const allowedPrintRoles = [
        "supervisor_quran",
        "supervisor_subjects",
        "teacher_quran",
        "teacher_subjects",
      ];
      if (!allowedPrintRoles.includes(role)) {
        return <PageNotFound />;
      }
    }
  }

  if (isDashboardRoute) {
    const dashboardRole = location.pathname.split("-")[0].substring(1);

    if (dashboardRole === "admin" && role !== "admin") {
      return <PageNotFound />;
    }
    if (dashboardRole === "client" && role !== "client") {
      return <PageNotFound />;
    }
    if (dashboardRole === "teacher" && !role.includes("teacher")) {
      return <PageNotFound />;
    }
    if (dashboardRole === "supervisor" && !role.includes("supervisor")) {
      return <PageNotFound />;
    }
  }

  if (isReportRoute) {
    if (location.pathname.startsWith("/teacher/monthly-report")) {
      const allowedTeacherRoles = ["teacher_quran", "teacher_subjects"];
      if (!allowedTeacherRoles.includes(role)) {
        return <PageNotFound />;
      }
    }
    if (
      location.pathname.startsWith("/client/monthly-report") &&
      role !== "client"
    ) {
      return <PageNotFound />;
    }
  }

  if (allowedRoles && !allowedRoles.includes(role)) {
    return <PageNotFound />;
  }

  return <Element />;
};

export default ProtectedRoute;
