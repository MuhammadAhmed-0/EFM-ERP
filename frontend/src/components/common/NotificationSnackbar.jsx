import { Snackbar, Alert } from "@mui/material";

const NotificationSnackbar = ({ notification, onClose }) => {
  return (
    <Snackbar
      open={notification.show}
      autoHideDuration={6000}
      onClose={onClose}
      anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
    >
      <Alert
        onClose={onClose}
        severity={notification.type}
        sx={{ width: "100%" }}
      >
        {notification.message}
      </Alert>
    </Snackbar>
  );
};

export default NotificationSnackbar;
