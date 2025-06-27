export const stringToColor = (string) => {
  let hash = 0;
  if (!string) return "#2c2c2c";

  for (let i = 0; i < string.length; i++) {
    hash = string.charCodeAt(i) + ((hash << 5) - hash);
  }

  const darkColors = [
    "#1a237e",
    "#b71c1c",
    "#1b5e20",
    "#e65100",
    "#4a148c",
    "#0d47a1",
    "#880e4f",
    "#006064",
    "#3e2723",
    "#263238",
    "#1c1c1c",
    "#424242",
    "#37474f",
    "#5d4037",
    "#ad1457",
  ];

  return darkColors[Math.abs(hash) % darkColors.length];
};

export const getInitials = (name) => {
  if (!name) return "?";
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
};

export const getAvatarProps = (name, size = 40) => {
  return {
    sx: {
      bgcolor: stringToColor(name),
      color: "#ffffff",
      fontWeight: 600,
      fontSize: size * 0.4,
      width: size,
      height: size,
    },
    children: getInitials(name),
  };
};
