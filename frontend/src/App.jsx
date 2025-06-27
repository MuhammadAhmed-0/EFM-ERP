import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import SelectionPage from "./pages/SelectionPage";
import AdminLogin from "./pages/auth/AdminLogin";
import ClientLogin from "./pages/auth/ClientLogin";
import TeacherLogin from "./pages/auth/TeacherLogin";
import SupervisorLogin from "./pages/auth/SupervisorLogin";
import ChallanInvoicePrint from "./pages/dashboards/components/admin/payroll/ChallanInvoicePrint";
import "bootstrap/dist/css/bootstrap.min.css";
import "./App.css";
import { ProfileProvider } from "./context/ProfileContext";
import { AnnouncementProvider } from "./context/AnnouncementContext";
import SalaryInvoicePrint from "./pages/dashboards/components/admin/payroll/SalaryInvoicePrint";
import StaffSalaryPrint from "./pages/dashboards/components/StaffSalaryPrint";
import MonthlyReport from "./pages/dashboards/components/teacher/MonthlyReport";
import PageNotFound from "./pages/auth/PageNotFound";
import ProtectedRoute from "./context/ProtectedRoute";
import ClientChallanInvoicePrint from "./pages/dashboards/components/client/payroll/ClientChallanInvoicePrint";
import AuthRedirect from "./context/AuthRedirect";
import DashboardShell from "./pages/dashboards/DashboardShell";
function App() {
  return (
    <AnnouncementProvider>
      <ProfileProvider>
        <Router>
          <Routes>
            <Route
              path="/"
              element={
                <AuthRedirect>
                  <SelectionPage />
                </AuthRedirect>
              }
            />
            <Route
              path="/admin-login"
              element={
                <AuthRedirect>
                  <AdminLogin />
                </AuthRedirect>
              }
            />
            <Route
              path="/client-login"
              element={
                <AuthRedirect>
                  <ClientLogin />
                </AuthRedirect>
              }
            />
            <Route
              path="/teacher-login"
              element={
                <AuthRedirect>
                  <TeacherLogin />
                </AuthRedirect>
              }
            />
            <Route
              path="/supervisor-login"
              element={
                <AuthRedirect>
                  <SupervisorLogin />
                </AuthRedirect>
              }
            />
            <Route
              path="/admin-dashboard/*"
              element={
                <ProtectedRoute
                  element={DashboardShell}
                  allowedRoles={["admin"]}
                />
              }
            />
            <Route
              path="/client-dashboard/*"
              element={
                <ProtectedRoute
                  element={DashboardShell}
                  allowedRoles={["client"]}
                />
              }
            />
            <Route
              path="/teacher-dashboard/*"
              element={
                <ProtectedRoute
                  element={DashboardShell}
                  allowedRoles={["teacher_quran", "teacher_subjects"]}
                />
              }
            />
            <Route
              path="/supervisor-dashboard/*"
              element={
                <ProtectedRoute
                  element={DashboardShell}
                  allowedRoles={["supervisor_quran", "supervisor_subjects"]}
                />
              }
            />
            <Route
              path="/challan/print/:id"
              element={
                <ProtectedRoute
                  element={ChallanInvoicePrint}
                  allowedRoles={["admin"]}
                />
              }
            />
            <Route
              path="/client/challan/print/:id"
              element={
                <ProtectedRoute
                  element={ClientChallanInvoicePrint}
                  allowedRoles={["client"]}
                />
              }
            />
            <Route
              path="/salary/print/:id"
              element={
                <ProtectedRoute
                  element={SalaryInvoicePrint}
                  allowedRoles={["admin"]}
                />
              }
            />
            <Route
              path="/supervisor/salary/print/:id"
              element={
                <ProtectedRoute
                  element={StaffSalaryPrint}
                  allowedRoles={[
                    "supervisor_quran",
                    "supervisor_subjects",
                    "teacher_quran",
                    "teacher_subjects",
                  ]}
                />
              }
            />
            <Route
              path="/teacher/monthly-report"
              element={
                <ProtectedRoute
                  element={MonthlyReport}
                  allowedRoles={["teacher_quran", "teacher_subjects"]}
                />
              }
            />
            <Route
              path="/client/monthly-report"
              element={
                <ProtectedRoute
                  element={MonthlyReport}
                  allowedRoles={["client"]}
                />
              }
            />
            <Route path="*" element={<PageNotFound />} />
          </Routes>
        </Router>
      </ProfileProvider>
    </AnnouncementProvider>
  );
}

export default App;
