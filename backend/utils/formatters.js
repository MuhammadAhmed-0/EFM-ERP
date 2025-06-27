exports.formatDate = (date) => {
  if (!date) return null;
  const d = new Date(date);
  return `${String(d.getDate()).padStart(2, "0")}-${String(
    d.getMonth() + 1
  ).padStart(2, "0")}-${d.getFullYear()}`;
};

exports.formatTime = (date) => {
  if (!date) return null;
  const d = new Date(date);
  return `${String(d.getHours()).padStart(2, "0")}:${String(
    d.getMinutes()
  ).padStart(2, "0")}`;
};

exports.parseManualDate = (str) => {
  if (!str || typeof str !== "string") return null;

  const [day, month, year] = str.split("-");
  if (!day || !month || !year) return null;
  return new Date(parseInt(year), parseInt(month) - 1, parseInt(day)); // Fixed missing closing brace
};
