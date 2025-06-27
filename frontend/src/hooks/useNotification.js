import { useState } from "react";

const useNotification = () => {
  const [notification, setNotification] = useState({
    show: false,
    message: "",
    type: "success",
  });

  const showNotification = (message, type = "success") => {
    setNotification({ show: true, message, type });
  };

  const closeNotification = () => {
    setNotification((prev) => ({ ...prev, show: false }));
  };

  return { notification, showNotification, closeNotification };
};

export default useNotification;
