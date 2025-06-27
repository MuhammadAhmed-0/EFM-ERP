import { Suspense, useEffect, useState } from "react";
import { Routes, Route, useNavigate } from "react-router-dom";
import { useProfile } from "../../context/ProfileContext";
import { useAnnouncements } from "../../context/AnnouncementContext";
import useUnreadQueries from "../../hooks/useUnreadQueries";
import { getDashboardLayoutConfig } from "../../utils/dashboardLayoutConfig";
import { handleLogout } from "../../utils/logoutUtils";
import { dashboardRegistry } from "../../constants/dashboardRegistry";
import { DASHBOARD_ROUTES } from "../../constants/roles";
import BaseDashboardLayout from "../../components/layout/BaseDashboardLayout";
import Logo from "../../assets/logo.png";
import styles from "../../styles/components/Dashboard.module.css";

const DashboardShell = () => {
  const { profilePicture } = useProfile();
  const { unreadCount } = useAnnouncements();
  const navigate = useNavigate();
  const BASE_URL = import.meta.env.VITE_BASE_URL;
  const { unreadQueries, badgeKey, resetUnread } = useUnreadQueries(BASE_URL);

  const user = JSON.parse(localStorage.getItem("user")) || { name: "User" };
  const role = localStorage.getItem("role");

  const config = dashboardRegistry[role];
  const [dynamicConditions, setDynamicConditions] = useState({});

  useEffect(() => {
    if (role === "client") {
      const storedValue = localStorage.getItem("showMonthlyReports");

      if (storedValue !== null) {
        const showReports = JSON.parse(storedValue);
        setDynamicConditions({ showMonthlyReports: showReports });
      } else {
        const fetchClientData = async () => {
          try {
            const token = localStorage.getItem("token");
            if (!token) return;

            const res = await fetch(`${BASE_URL}/api/clients/students`, {
              headers: { Authorization: `Bearer ${token}` },
            });
            const data = await res.json();

            let showReports = false;
            for (const student of data.students || []) {
              const types = new Set(student.subjects.map((s) => s.type));
              if (types.size > 1 || types.has("subjects")) {
                showReports = true;
                break;
              }
            }
            setDynamicConditions({ showMonthlyReports: showReports });
            localStorage.setItem(
              "showMonthlyReports",
              JSON.stringify(showReports)
            );
          } catch (err) {
            console.error("Client data fetch error:", err);
          }
        };

        fetchClientData();
      }
    }

    if (role === "teacher_subjects") {
      setDynamicConditions({ isSubjectTeacher: true });
    }
  }, [role, BASE_URL]);
  const layout = getDashboardLayoutConfig(
    config?.layoutRoleKey || "Admin",
    unreadQueries,
    dynamicConditions,
    unreadCount
  );

  const handleNavigation = (path) => {
    if (path === "logout") {
      handleLogout(navigate, config.layoutRoleKey);
    } else {
      if (path === `${DASHBOARD_ROUTES[config.layoutRoleKey]}/queries`) {
        resetUnread();
      }
      navigate(path);
    }
  };

  if (!config) return <div>Invalid role</div>;

  return (
    <BaseDashboardLayout
      themeColor={layout.color}
      themeGradient={layout.gradient}
      logo={Logo}
      user={user}
      profilePicture={profilePicture}
      menuItems={layout.menuItems}
      badgeKey={badgeKey}
      onNavigate={handleNavigation}
      onProfileClick={() =>
        navigate(`${DASHBOARD_ROUTES[config.layoutRoleKey]}/profile`)
      }
    >
      <Suspense fallback={<div className={styles.loading}>Loading...</div>}>
        <Routes>
          {config.routes.map(
            ({ path, element: Component, conditionKey }, idx) => {
              if (conditionKey && !dynamicConditions[conditionKey]) return null;
              return <Route key={idx} path={path} element={<Component />} />;
            }
          )}
        </Routes>
      </Suspense>
    </BaseDashboardLayout>
  );
};

export default DashboardShell;
