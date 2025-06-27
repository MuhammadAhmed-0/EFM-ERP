// styles/modalStyles.js
export const baseModalStyle = {
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  width: 500,
  bgcolor: "background.paper",
  borderRadius: "12px",
  boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)",
  p: 4,
  maxHeight: "90vh",
  overflowY: "auto",
  "&:focus-visible": {
    outline: "none",
  },
  fontFamily: "'Poppins', sans-serif",
};
