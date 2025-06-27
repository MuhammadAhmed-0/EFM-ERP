import { useState } from "react";

export const useInfoModal = (adminPasswordDefault = "admin123") => {
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [adminPassword, setAdminPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [isInfoVisible, setIsInfoVisible] = useState(false);
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(() => {
    return localStorage.getItem("isAdminAuthenticated") === "true";
  });

  const handleShowInfo = (item, type = "contact") => {
    setSelectedItem({ ...item, infoType: type });
    setShowInfoModal(true);
    setIsInfoVisible(false);
    setPasswordError("");
    setAdminPassword("");
  };

  const handleAdminPasswordSubmit = () => {
    if (adminPassword === adminPasswordDefault) {
      setIsInfoVisible(true);
      setPasswordError("");
      setIsAdminAuthenticated(true);
      localStorage.setItem("isAdminAuthenticated", "true");
    } else {
      setPasswordError("Incorrect password");
    }
  };

  const handleCloseInfoModal = () => {
    setShowInfoModal(false);
    setSelectedItem(null);
    setAdminPassword("");
    setPasswordError("");
  };

  return {
    showInfoModal,
    selectedItem,
    adminPassword,
    passwordError,
    isInfoVisible,
    isAdminAuthenticated,
    setAdminPassword,
    handleShowInfo,
    handleAdminPasswordSubmit,
    handleCloseInfoModal,
  };
};
