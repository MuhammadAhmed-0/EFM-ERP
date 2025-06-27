// src/constants/routes/clientRoutes.js
import { lazy } from "react";

export const clientRoutes = [
  {
    path: "/",
    element: lazy(() =>
      import("../pages/dashboards/components/client/ClientHome")
    ),
  },
  {
    path: "/announcements",
    element: lazy(() =>
      import("../pages/dashboards/components/Announcements")
    ),
  },
  {
    path: "/profile",
    element: lazy(() =>
      import("../pages/dashboards/components/client/ClientProfileManagement")
    ),
  },
  {
    path: "/challans",
    element: lazy(() =>
      import("../pages/dashboards/components/client/ClientFeeChallans")
    ),
  },
  {
    path: "/attendance",
    element: lazy(() =>
      import(
        "../pages/dashboards/components/client/ClientStudentAttendanceView"
      )
    ),
  },
  {
    path: "/schedule",
    element: lazy(() =>
      import("../pages/dashboards/components/client/ClientScheduleView")
    ),
  },
  {
    path: "/reports",
    element: lazy(() =>
      import(
        "../pages/dashboards/components/client/ClientStudentMonthlyReport"
      )
    ),
    conditionKey: "showMonthlyReports", 
  },
  {
    path: "*",
    element: lazy(() => import("../pages/auth/PageNotFound")),
  },
];
