import { useState, useEffect } from "react";
import DashboardHeader from "./DashboardHeader";
import DashboardSidebar from "./DashboardSidebar";
import styles from "../../styles/components/Dashboard.module.css";

const BaseDashboardLayout = ({
  themeColor,
  themeGradient,
  logo,
  user,
  profilePicture,
  menuItems,
  badgeKey,
  onNavigate,
  onProfileClick,
  children,
}) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth <= 768);
      if (window.innerWidth > 768) {
        setIsSidebarOpen(false);
      }
    };

    checkIsMobile();
    window.addEventListener("resize", checkIsMobile);
    return () => window.removeEventListener("resize", checkIsMobile);
  }, []);

  useEffect(() => {
    const setVH = () => {
      const vh = window.innerHeight * 0.01;
      document.documentElement.style.setProperty("--vh", `${vh}px`);
    };

    setVH();
    window.addEventListener("resize", setVH);
    window.addEventListener("orientationchange", setVH);

    return () => {
      window.removeEventListener("resize", setVH);
      window.removeEventListener("orientationchange", setVH);
    };
  }, []);

  useEffect(() => {
    if (isMobile && isSidebarOpen) {
      document.body.style.overflow = "hidden";
      document.body.style.position = "fixed";
      document.body.style.width = "100%";
      document.body.style.height = "100%";
    } else {
      document.body.style.overflow = "";
      document.body.style.position = "";
      document.body.style.width = "";
      document.body.style.height = "";
    }

    return () => {
      document.body.style.overflow = "";
      document.body.style.position = "";
      document.body.style.width = "";
      document.body.style.height = "";
    };
  }, [isMobile, isSidebarOpen]);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const closeSidebar = () => {
    setIsSidebarOpen(false);
  };

  return (
    <div
      className={`${styles.dashboard} ${
        isMobile && isSidebarOpen ? styles.dashboardWithOverlay : ""
      }`}
    >
      <DashboardHeader
        themeColor={themeColor}
        logo={logo}
        userName={user.name}
        profilePicture={profilePicture}
        onClickProfile={onProfileClick}
        onToggleSidebar={toggleSidebar}
        isSidebarOpen={isSidebarOpen}
      />
      <DashboardSidebar
        menuItems={menuItems}
        themeGradient={themeGradient}
        badgeKey={badgeKey}
        onNavigate={onNavigate}
        isOpen={isSidebarOpen}
        onClose={closeSidebar}
      />
      <main className={styles.dashboardContent}>{children}</main>
    </div>
  );
};

export default BaseDashboardLayout;
