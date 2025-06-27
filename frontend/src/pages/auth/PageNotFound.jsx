import React from "react";
import { useNavigate } from "react-router-dom";
import { FaHome } from "react-icons/fa";
import styles from "../../styles/components/NotFound.module.css";

const NotFound = () => {
  const navigate = useNavigate();

  const handleBackToHome = () => {
    const token = localStorage.getItem("token");
    const role = localStorage.getItem("role");

    if (!token) {
      navigate("/");
      return;
    }

    switch (role) {
      case "admin":
        navigate("/admin-dashboard");
        break;
      case "client":
        navigate("/client-dashboard");
        break;
      case "teacher_quran":
      case "teacher_subjects":
        navigate("/teacher-dashboard");
        break;
      case "supervisor_quran":
      case "supervisor_subjects":
        navigate("/supervisor-dashboard");
        break;
      default:
        localStorage.removeItem("token");
        localStorage.removeItem("role");
        navigate("/");
    }
  };

  return (
    <div className={styles.notFoundContainer}>
      <div className={styles.notFoundContent}>
        <div className={styles.errorCode}>404</div>
        <h1 className={styles.errorTitle}>Page Not Found</h1>
        <p className={styles.errorDescription}>
          The page you are looking for might have been removed, had its name
          changed, or is temporarily unavailable.
        </p>
        <button onClick={handleBackToHome} className={styles.backToHomeBtn}>
          <FaHome className={styles.homeIcon} />
          Back to Home
        </button>
      </div>
    </div>
  );
};

export default NotFound;
