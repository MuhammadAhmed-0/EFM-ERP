import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaUserShield,
  FaUsers,
  FaChalkboardTeacher,
  FaUserCog,
} from "react-icons/fa";
import "../styles/pages/SelectionPage.css";
import Logo from "../assets/logo-trans.png";

const SelectionPage = () => {
  const navigate = useNavigate();
  const [currentTime, setCurrentTime] = useState("");

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const pktDate = now.toLocaleString("en-US", {
        timeZone: "Asia/Karachi",
        hour12: false,
      });

      const [date, time] = pktDate.split(", ");
      const [month, day, year] = date.split("/");
      const formattedDate = `${year}-${month.padStart(2, "0")}-${day.padStart(
        2,
        "0"
      )}`;

      setCurrentTime(`${formattedDate} ${time}`);
    };

    updateTime();
    const timer = setInterval(updateTime, 1000);

    return () => clearInterval(timer);
  }, []);

  const cards = [
    {
      title: "Admin",
      icon: <FaUserShield className="card-icon" />,
      path: "/admin-login",
      description: "System management and control",
      gradient: "linear-gradient(135deg, #234b7c 0%, #1e3a5c 100%)",
    },
    {
      title: "Client",
      icon: <FaUsers className="card-icon" />,
      path: "/client-login",
      description: "Access student information",
      gradient: "linear-gradient(135deg, #2d5c94 0%, #234b7c 100%)",
    },
    {
      title: "Teacher",
      icon: <FaChalkboardTeacher className="card-icon" />,
      path: "/teacher-login",
      description: "Manage classes and students",
      gradient: "linear-gradient(135deg, #336699 0%, #2d5c94 100%)",
    },
    {
      title: "Supervisor",
      icon: <FaUserCog className="card-icon" />,
      path: "/supervisor-login",
      description: "Monitor and oversee activities",
      gradient: "linear-gradient(135deg, #1e3a5c 0%, #152a44 100%)",
    },
  ];

  return (
    <div className="app-container">
      <div className="left-section">
        <div className="left-content">
          <div className="hero-icon selection-page-main">
            <img src={Logo} alt="EFM Portal Logo" />
          </div>
          <h1>EFM Portal</h1>
          <p className="hero-text">Empowering Education Through Technology</p>
          <div className="info-bar">
            <div className="info-item">
              <span className="info-label">Current Time (PKT):</span>
              <span className="info-value">{currentTime}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="right-section">
        <div className="right-content">
          <div className="right-header">
            <h2 className="stylish-title">
              <span className="title-decorator"></span>
              Select Your Portal
              <span className="title-decorator"></span>
            </h2>
            <p className="subtitle">Choose your role to access the portal</p>
          </div>

          <div className="cards-grid">
            {cards.map((card, index) => (
              <div
                key={index}
                className="card"
                style={{ background: card.gradient }}
                onClick={() => navigate(card.path)}
              >
                <div className="card-content">
                  {card.icon}
                  <h3>{card.title}</h3>
                  <p>{card.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SelectionPage;
