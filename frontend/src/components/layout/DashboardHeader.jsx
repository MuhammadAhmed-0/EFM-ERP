import { useState } from "react";
import { Avatar } from "@mui/material";
import { FaBars, FaTimes } from "react-icons/fa";
import { getAvatarProps } from "../../utils/avatarUtils";
import styles from "../../styles/components/Dashboard.module.css";

const DashboardHeader = ({
  themeColor,
  logo,
  userName,
  profilePicture,
  onClickProfile,
  onToggleSidebar,
  isSidebarOpen,
}) => {
  return (
    <header
      className={styles.dashboardHeader}
      style={{ "--theme-color": themeColor }}
    >
      <div className={styles.headerLeft}>
        <button
          className={styles.hamburgerBtn}
          onClick={onToggleSidebar}
          aria-label="Toggle menu"
        >
          {isSidebarOpen ? <FaTimes /> : <FaBars />}
        </button>
        <div className={`${styles.logoIcon} ${styles.headerLogo}`}>
          <img src={logo} alt="EFM Portal Logo" />
        </div>
        <h1>EFM Portal</h1>
      </div>
      <div className={styles.headerRight}>
        <div
          className={styles.profileSection}
          onClick={onClickProfile}
          style={{ cursor: "pointer" }}
        >
          <span className={styles.username}>{userName}</span>
          <div className={styles.profilePicture}>
            {profilePicture?.trim() ? (
              <Avatar
                src={profilePicture}
                alt={userName}
                sx={{
                  width: 40,
                  height: 40,
                  border: "2px solid #fff",
                }}
              />
            ) : (
              <Avatar
                {...getAvatarProps(userName)}
                sx={{
                  width: 40,
                  height: 40,
                  border: "2px solid #fff",
                  ...getAvatarProps(userName).sx,
                }}
              />
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default DashboardHeader;
