import { Modal, Box, Button, Typography, TextField } from "@mui/material";
import { modalStyles } from "../../../../../styles/modal/styles";
import { getModalStyles } from "../../../../../styles/modal/commonModalStyles";

const SupervisorInfoModal = ({
  open,
  onClose,
  selectedSupervisor,
  adminPassword,
  setAdminPassword,
  passwordError,
  isInfoVisible,
  handleAdminPasswordSubmit,
}) => {
  return (
    <Modal open={open} onClose={onClose} aria-labelledby="info-modal">
      <Box sx={[modalStyles.container, getModalStyles()]}>
        <Box sx={modalStyles.header}>
          <Typography variant="h6" component="h2">
            Contact Information
          </Typography>
          <Button onClick={onClose} sx={modalStyles.closeButton}>
            ×
          </Button>
        </Box>

        {selectedSupervisor && (
          <>
            <Box sx={modalStyles.content}>
              <Typography
                variant="subtitle2"
                color="textSecondary"
                sx={{ mb: 1, fontWeight: "bold" }}
              >
                Supervisor Details
              </Typography>
              <Typography variant="body1" sx={{ mb: 1, fontWeight: "bold" }}>
                Name: {selectedSupervisor.name}
              </Typography>
              <Typography variant="body1" sx={{ mb: 1, fontWeight: "bold" }}>
                Staff ID: {selectedSupervisor.staffId}
              </Typography>

              {isInfoVisible ? (
                <Box sx={{ mt: 2 }}>
                  <Typography
                    variant="body1"
                    sx={{ mb: 1, fontWeight: "bold" }}
                  >
                    Email: {selectedSupervisor.email}
                  </Typography>
                  <Typography
                    variant="body1"
                    sx={{ mb: 1, fontWeight: "bold" }}
                  >
                    Phone: {selectedSupervisor.phoneNumber || "Not provided"}
                  </Typography>
                </Box>
              ) : (
                <Box sx={{ mt: 2 }}>
                  <Typography
                    variant="subtitle2"
                    sx={{ mb: 2, fontWeight: "bold" }}
                  >
                    Enter Admin Password to View Contact Details
                  </Typography>
                  <TextField
                    fullWidth
                    type="password"
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    error={!!passwordError}
                    helperText={passwordError}
                    placeholder="Enter password"
                    size="small"
                    sx={modalStyles.passwordInput}
                  />
                  <Button
                    fullWidth
                    variant="contained"
                    onClick={handleAdminPasswordSubmit}
                    sx={modalStyles.submitButton}
                  >
                    View Contact Information
                  </Button>
                </Box>
              )}
            </Box>
          </>
        )}
      </Box>
    </Modal>
  );
};

export default SupervisorInfoModal;
