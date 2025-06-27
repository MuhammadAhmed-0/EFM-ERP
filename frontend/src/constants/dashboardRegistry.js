import { adminRoutes } from "../routes/adminRoutes";
import { clientRoutes } from "../routes/clientRoutes";
import { teacherRoutes } from "../routes/teacherRoutes";
import { supervisorRoutes } from "../routes/supervisorRoutes";

export const dashboardRegistry = {
  admin: {
    role: "admin",
    title: "Admin",
    routes: adminRoutes,
    layoutRoleKey: "Admin",
  },
  client: {
    role: "client",
    title: "Client",
    routes: clientRoutes,
    layoutRoleKey: "Client",
  },
  teacher_quran: {
    role: "teacher_quran",
    title: "Teacher",
    routes: teacherRoutes,
    layoutRoleKey: "Teacher",
  },
  teacher_subjects: {
    role: "teacher_subjects",
    title: "Teacher",
    routes: teacherRoutes,
    layoutRoleKey: "Teacher",
  },
  supervisor_quran: {
    role: "supervisor_quran",
    title: "Supervisor",
    routes: supervisorRoutes,
    layoutRoleKey: "Supervisor",
  },
  supervisor_subjects: {
    role: "supervisor_subjects",
    title: "Supervisor",
    routes: supervisorRoutes,
    layoutRoleKey: "Supervisor",
  },
};
