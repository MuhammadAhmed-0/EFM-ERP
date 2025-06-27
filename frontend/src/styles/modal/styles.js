export const modalStyles = {
  container: {
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    width: 400,
    bgcolor: "background.paper",
    borderRadius: "12px",
    boxShadow: 24,
    p: 4,
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    mb: 3,
  },
  closeButton: {
    minWidth: "auto",
    p: 1,
    color: "#64748b",
    "&:hover": {
      bgcolor: "#f1f5f9",
      color: "#3949ab",
    },
  },
  content: {
    mb: 3,
  },
  passwordInput: {
    mb: 2,
  },
  submitButton: {
    bgcolor: "#1f3d61",
    textTransform: "none",
    "&:hover": {
      bgcolor: "#1f3d70",
    },
  },
};

export const tableStyles = {
  viewButton: {
    color: "#2563eb",
    textTransform: "none",
    "&:hover": {
      backgroundColor: "rgba(37, 99, 235, 0.1)",
    },
    fontSize: "0.875rem",
    padding: "4px 8px",
  },
  buttonContainer: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
};
