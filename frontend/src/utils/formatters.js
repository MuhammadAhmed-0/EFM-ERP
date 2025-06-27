import { format } from "date-fns";

export const formatTableDate = (dateString) => {
  try {
    if (!dateString) return "";
    const date = new Date(dateString);
    return format(date, "dd/MM/yyyy");
  } catch (error) {
    console.error("Error formatting date:", error);
    return dateString;
  }
};

export const convertTo12Hour = (time) => {
  if (!time) return "";
  const [hours, minutes] = time.split(":");
  const hour = parseInt(hours);
  const ampm = hour >= 12 ? "PM" : "AM";
  const hour12 = hour % 12 || 12;
  return `${hour12.toString().padStart(2, "0")}:${minutes} ${ampm}`;
};
