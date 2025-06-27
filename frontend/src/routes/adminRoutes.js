// src/constants/routes/adminRoutes.js
import { lazy } from "react";

export const adminRoutes = [
  {
    path: "/",
    element: lazy(() =>
      import("../pages/dashboards/components/admin/DashboardHome")
    ),
  },
  {
    path: "/clients",
    element: lazy(() =>
      import("../pages/dashboards/components/admin/ClientsManagement")
    ),
  },
  {
    path: "/students",
    element: lazy(() =>
      import("../pages/dashboards/components/admin/StudentsManagement")
    ),
  },
  {
    path: "/teachers",
    element: lazy(() =>
      import("../pages/dashboards/components/admin/TeachersManagement")
    ),
  },
  {
    path: "/supervisors",
    element: lazy(() =>
      import("../pages/dashboards/components/admin/SupervisorsManagement")
    ),
  },
  {
    path: "/subjects",
    element: lazy(() =>
      import("../pages/dashboards/components/admin/SubjectsManagement")
    ),
  },
  {
    path: "/announcements",
    element: lazy(() =>
      import("../pages/dashboards/components/admin/AnnouncementsManagement")
    ),
  },
  {
    path: "/staff-attendance",
    element: lazy(() =>
      import("../pages/dashboards/components/admin/StaffAttendance")
    ),
  },
  {
    path: "/student-attendance",
    element: lazy(() =>
      import("../pages/dashboards/components/admin/StudentAttendance")
    ),
  },
  {
    path: "/fee-challans",
    element: lazy(() =>
      import("../pages/dashboards/components/admin/FeeChallanManagement")
    ),
  },
  {
    path: "/salary-invoices",
    element: lazy(() =>
      import("../pages/dashboards/components/admin/SalaryInvoiceManagement")
    ),
  },
  {
    path: "/schedules",
    element: lazy(() =>
      import("../pages/dashboards/components/admin/AdminScheduleView")
    ),
  },
  {
    path: "/lessons",
    element: lazy(() =>
      import("../pages/dashboards/components/admin/AdminViewLessons")
    ),
  },
  {
    path: "/profile",
    element: lazy(() =>
      import("../pages/dashboards/components/admin/ProfileManagement")
    ),
  },
  {
    path: "/queries",
    element: lazy(() =>
      import("../pages/dashboards/components/admin/AdminQueries")
    ),
  },
  { path: "*", element: lazy(() => import("../pages/auth/PageNotFound")) },
];
