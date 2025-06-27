import { lazy } from "react";

export const supervisorRoutes = [
  {
    path: "/",
    element: lazy(() =>
      import("../pages/dashboards/components/supervisor/SupervisorHome")
    ),
  },
  {
    path: "/announcements",
    element: lazy(() => import("../pages/dashboards/components/Announcements")),
  },
  {
    path: "/profile",
    element: lazy(() =>
      import("../pages/dashboards/components/StaffProfileManagement")
    ),
  },
  {
    path: "/student-attendance",
    element: lazy(() =>
      import("../pages/dashboards/components/supervisor/StudentAttendanceView")
    ),
  },
  {
    path: "/schedule",
    element: lazy(() =>
      import(
        "../pages/dashboards/components/supervisor/SupervisorScheduleClass"
      )
    ),
  },
  {
    path: "/lessons",
    element: lazy(() =>
      import("../pages/dashboards/components/supervisor/SupervisorViewLessons")
    ),
  },
  {
    path: "/salary",
    element: lazy(() =>
      import("../pages/dashboards/components/StaffSalaryInvoices")
    ),
  },
  {
    path: "/attendance",
    element: lazy(() =>
      import("../pages/dashboards/components/StaffOwnAttendance")
    ),
  },
  {
    path: "/queries",
    element: lazy(() => import("../pages/dashboards/components/StaffQueries")),
  },
  {
    path: "*",
    element: lazy(() => import("../pages/auth/PageNotFound")),
  },
];
