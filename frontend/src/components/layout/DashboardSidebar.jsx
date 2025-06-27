import { FaSignOutAlt } from "react-icons/fa";
import styles from "../../styles/components/Dashboard.module.css";

const DashboardSidebar = ({
  menuItems,
  themeGradient,
  onNavigate,
  badgeKey,
  isOpen,
  onClose,
}) => {
  return (
    <>
      {/* Overlay for mobile */}
      <div
        className={`${styles.sidebarOverlay} ${
          isOpen ? styles.sidebarOverlayActive : ""
        }`}
        onClick={onClose}
      />

      <aside
        className={`${styles.dashboardSidebar} ${
          isOpen ? styles.sidebarOpen : ""
        }`}
        style={{ background: themeGradient }}
      >
        <nav className={styles.sidebarNav}>
          {menuItems.map((item, index) => (
            <a
              key={index}
              href={item.path}
              onClick={(e) => {
                e.preventDefault();
                onNavigate(item.path);
                onClose(); // Close sidebar on mobile after navigation
              }}
              className={`${styles.navItem} ${
                window.location.pathname === item.path ? styles.active : ""
              }`}
            >
              <span className={styles.navIconContainer}>
                {item.icon}
                {item.badge && (
                  <span key={badgeKey} className={styles.navBadge}>
                    {item.badge}
                  </span>
                )}
              </span>
              <span className={styles.navTitle}>{item.title}</span>
            </a>
          ))}
        </nav>
        <div className={styles.sidebarFooter}>
          <button
            className={styles.logoutBtn}
            onClick={() => {
              onNavigate("logout");
              onClose();
            }}
          >
            <FaSignOutAlt /> Logout
          </button>
        </div>
      </aside>
    </>
  );
};

export default DashboardSidebar;
