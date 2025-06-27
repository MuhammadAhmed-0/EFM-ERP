import React, { useState, useEffect } from "react";

const DateTimeDisplay = () => {
  const [dateTime, setDateTime] = useState("");

  useEffect(() => {
    const updateDateTime = () => {
      const now = new Date();
      const formatted = now.toISOString().replace("T", " ").slice(0, 19);
      setDateTime(formatted);
    };

    updateDateTime();
    const timer = setInterval(updateDateTime, 1000);

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="datetime-display">
      <span className="datetime-label">Current UTC Time: </span>
      <span className="datetime-value">{dateTime}</span>
    </div>
  );
};

export default DateTimeDisplay;
