import { lazy } from "react";

export const teacherRoutes = [
  {
    path: "/",
    element: lazy(() =>
      import("../pages/dashboards/components/teacher/TeacherHome")
    ),
  },
  {
    path: "/announcements",
    element: lazy(() => import("../pages/dashboards/components/Announcements")),
  },
  {
    path: "/schedule",
    element: lazy(() =>
      import(
        "../pages/dashboards/components/teacher/viewModals/TeacherScheduleView"
      )
    ),
  },
  {
    path: "/profile",
    element: lazy(() =>
      import("../pages/dashboards/components/StaffProfileManagement")
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
    path: "/student-reports",
    element: lazy(() =>
      import("../pages/dashboards/components/teacher/TeacherStudentLists")
    ),
    conditionKey: "isSubjectTeacher",
  },
  {
    path: "*",
    element: lazy(() => import("../pages/auth/PageNotFound")),
  },
];
