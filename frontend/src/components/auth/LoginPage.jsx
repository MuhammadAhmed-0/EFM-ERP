import { useState } from "react";
import axios from "axios";
import {
  FaUserShield,
  FaUsers,
  FaChalkboardTeacher,
  FaUserCog,
  FaUser,
  FaLock,
  FaEye,
  FaEyeSlash,
} from "react-icons/fa";
import styles from "../../styles/components/LoginPage.module.css";
import Logo from "../../assets/logo-trans.png";

const LoginPage = ({ type }) => {
  const BASE_URL = import.meta.env.VITE_BASE_URL;
  const [credentials, setCredentials] = useState({
    email: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const themes = {
    admin: {
      color: "#1e3a5c",
      gradient: "linear-gradient(135deg, #234b7c 0%, #1e3a5c 100%)",
      icon: <FaUserShield className={styles.roleIcon} />,
      title: "Admin Portal",
      description: "System management and control",
      dashboard: "/admin-dashboard",
      role: "admin",
      roleTypes: ["admin"],
    },
    client: {
      color: "#234b7c",
      gradient: "linear-gradient(135deg, #2d5c94 0%, #234b7c 100%)",
      icon: <FaUsers className={styles.roleIcon} />,
      title: "Client Portal",
      description: "Access student information",
      dashboard: "/client-dashboard",
      role: "client",
      roleTypes: ["client"],
    },
    teacher: {
      color: "#2d5c94",
      gradient: "linear-gradient(135deg, #336699 0%, #2d5c94 100%)",
      icon: <FaChalkboardTeacher className={styles.roleIcon} />,
      title: "Teacher Portal",
      description: "Manage classes and students",
      dashboard: "/teacher-dashboard",
      role: "teacher",
      roleTypes: ["teacher_quran", "teacher_subjects"],
    },
    supervisor: {
      color: "#1e3a5c",
      gradient: "linear-gradient(135deg, #1e3a5c 0%, #152a44 100%)",
      icon: <FaUserCog className={styles.roleIcon} />,
      title: "Supervisor Portal",
      description: "Monitor and oversee activities",
      dashboard: "/supervisor-dashboard",
      role: "supervisor",
      roleTypes: ["supervisor_quran", "supervisor_subjects"],
    },
  };

  const currentTheme = themes[type];
  const roleMapping = {
    admin: ["admin"],
    client: ["client"],
    teacher: ["teacher_quran", "teacher_subjects"],
    supervisor: ["supervisor_quran", "supervisor_subjects"],
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const requestBody = {
        email: credentials.email.toLowerCase(),
        password: credentials.password,
      };

      const response = await axios.post(
        `${BASE_URL}/api/auth/login`,
        requestBody
      );

      const { token, user, result } = response.data;
      if (!roleMapping[type].includes(user.role)) {
        setError(`Invalid portal. Please use the correct login portal.`);
        return;
      }

      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(user));
      localStorage.setItem("userId", JSON.stringify(user._id));
      localStorage.setItem("role", user.role);

      switch (type) {
        case "admin":
          localStorage.setItem("isAdminAuthenticated", "true");
          break;
        case "teacher":
          localStorage.setItem("isTeacherAuthenticated", "true");
          break;
        case "supervisor":
          localStorage.setItem("isSupervisorAuthenticated", "true");
          break;
        case "client":
          localStorage.setItem("isClientAuthenticated", "true");
          break;
        default:
          break;
      }

      axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
      window.location.href = currentTheme.dashboard;
    } catch (err) {
      if (err.response) {
        switch (err.response.status) {
          case 400:
            setError(err.response.data.msg || "Invalid credentials");
            break;
          case 401:
            setError(err.response.data.msg || "Unauthorized access");
            break;
          case 403:
            setError(err.response.data.msg || "Access forbidden");
            break;
          case 404:
            setError("Invalid credentials");
            break;
          case 500:
            setError("Server error. Please try again later");
            break;
          default:
            setError("An error occurred. Please try again");
        }
      } else {
        setError("Network error. Please check your connection");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.loginContainer}>
      <div
        className={styles.loginLeftSection}
        style={{ background: currentTheme.gradient }}
      >
        <div className={styles.leftContent}>
          <div className={`${styles.heroIcon} ${styles.loginPageMain}`}>
            <img src={Logo} alt="EFM Portal Logo" />
          </div>
          <h1>EFM Portal</h1>
          <p className={styles.heroText}>
            Empowering Education
            <br />
            Through Technology
          </p>
          <div className={styles.titleUnderline}></div>
        </div>
      </div>

      <div className={styles.loginRightSection}>
        <div className={styles.loginContent}>
          <div
            className={styles.loginHeader}
            style={{ "--theme-color": currentTheme.color }}
          >
            {currentTheme.icon}
            <h2>{currentTheme.title}</h2>
            <p className={styles.loginDescription}>
              {currentTheme.description}
            </p>
          </div>

          <div className={styles.loginFormContainer}>
            <form onSubmit={handleSubmit}>
              {error && <div className={styles.errorMessage}>{error}</div>}

              <div className={styles.formGroup}>
                <div
                  className={styles.inputIconWrapper}
                  style={{ "--theme-color": currentTheme.color }}
                >
                  <FaUser
                    className={styles.inputIcon}
                    style={{ color: currentTheme.color }}
                  />
                  <input
                    type="text"
                    placeholder="Email"
                    value={credentials.email}
                    onChange={(e) =>
                      setCredentials({ ...credentials, email: e.target.value })
                    }
                    required
                  />
                </div>
              </div>

              <div className={styles.formGroup}>
                <div
                  className={styles.inputIconWrapper}
                  style={{ "--theme-color": currentTheme.color }}
                >
                  <FaLock
                    className={styles.inputIcon}
                    style={{ color: currentTheme.color }}
                  />
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="Password"
                    value={credentials.password}
                    onChange={(e) =>
                      setCredentials({
                        ...credentials,
                        password: e.target.value,
                      })
                    }
                    required
                  />
                  <button
                    type="button"
                    className={styles.passwordToggle}
                    onClick={() => setShowPassword(!showPassword)}
                    style={{ color: currentTheme.color }}
                  >
                    {showPassword ? <FaEyeSlash /> : <FaEye />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                className={styles.loginButton}
                style={{
                  background: currentTheme.gradient,
                  opacity: isLoading ? 0.7 : 1,
                  cursor: isLoading ? "not-allowed" : "pointer",
                }}
                disabled={isLoading}
              >
                {isLoading ? "Logging in..." : "Login"}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
