export const showNotification = (
  setNotification,
  message,
  type = "success"
) => {
  setNotification({
    show: true,
    message,
    type,
  });
};

export const validateForm = (formData, requiredFields) => {
  const errors = {};
  requiredFields.forEach((field) => {
    if (!formData[field.name]?.trim()) {
      errors[field.name] = `${field.label} is required`;
    }
  });
  return errors;
};

export const formatDBDateTime = (dateTimeString) => {
  if (!dateTimeString) return "";
  const date = new Date(dateTimeString);
  const datePart = date.toLocaleDateString("en-GB");
  const timePart = date.toLocaleTimeString("en-GB");
  return `${datePart} ${timePart}`;
};

export const formatTimeToAMPM = (time) => {
  if (!time) return "";
  const [hours, minutes] = time.split(":").map(Number);
  const period = hours >= 12 ? "PM" : "AM";
  const hours12 = hours % 12 || 12;
  return `${hours12}:${minutes.toString().padStart(2, "0")} ${period}`;
};

export const calculateDuration = (startDate, endDate) => {
  const start = new Date(startDate);
  const end = endDate ? new Date(endDate) : new Date();

  const diffTime = Math.abs(end - start);
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
    return diffHours === 0
      ? "Less than an hour"
      : `${diffHours} hour${diffHours !== 1 ? "s" : ""}`;
  } else if (diffDays < 30) {
    return `${diffDays} day${diffDays !== 1 ? "s" : ""}`;
  } else if (diffDays < 365) {
    const diffMonths = Math.floor(diffDays / 30);
    return `${diffMonths} month${diffMonths !== 1 ? "s" : ""}`;
  } else {
    const diffYears = Math.floor(diffDays / 365);
    const remainingMonths = Math.floor((diffDays % 365) / 30);
    return remainingMonths > 0
      ? `${diffYears} year${
          diffYears !== 1 ? "s" : ""
        } and ${remainingMonths} month${remainingMonths !== 1 ? "s" : ""}`
      : `${diffYears} year${diffYears !== 1 ? "s" : ""}`;
  }
};
