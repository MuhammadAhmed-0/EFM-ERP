import { useState, useEffect } from "react";
import axios from "axios";
import {
  Box,
  Typography,
  TextField,
  CircularProgress,
  Avatar,
} from "@mui/material";
import { styled } from "@mui/material/styles";
import { useProfile } from "../../../../context/ProfileContext";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import NotificationSnackbar from "../../../../components/common/NotificationSnackbar";
import useNotification from "../../../../hooks/useNotification";
import {
  stringToColor,
  getInitials,
  getAvatarProps,
} from "../../../../utils/avatarUtils";

const theme = createTheme({
  typography: {
    fontFamily: "'Poppins', sans-serif",
    button: {
      textTransform: "none",
    },
  },
  components: {
    MuiInputBase: {
      styleOverrides: {
        root: {
          fontFamily: "'Poppins', sans-serif",
        },
      },
    },
    MuiInputLabel: {
      styleOverrides: {
        root: {
          fontFamily: "'Poppins', sans-serif",
        },
      },
    },
  },
});

const textFieldStyle = {
  "& .MuiInputBase-input.Mui-disabled": {
    WebkitTextFillColor: "#000000",
    color: "#000000",
    fontSize: "1rem",
  },
  "& .MuiInputLabel-root.Mui-disabled": {
    color: "#666666",
  },
  "& .MuiOutlinedInput-root.Mui-disabled": {
    "& > fieldset": {
      borderColor: "#e0e0e0",
    },
  },
};

const formatCurrency = (amount, currency) => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency || "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

const ClientProfileManagement = () => {
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState(null);
  const { notification, showNotification, closeNotification } =
    useNotification();

  const { updateProfilePicture } = useProfile();
  const BASE_URL = import.meta.env.VITE_BASE_URL;

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(`${BASE_URL}/api/auth/me`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setUserData({
        ...response.data.user,
        ...response.data.details,
      });
      updateProfilePicture(response.data.user.profilePicture || "");
    } catch (error) {
      showNotification("Error fetching user data", "error");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  if (loading) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  const capitalizeFirstLetter = (string) => {
    return string?.charAt(0).toUpperCase() + string?.slice(1);
  };

  return (
    <ThemeProvider theme={theme}>
      <Box
        sx={{
          maxWidth: "800px",
          margin: { xs: "16px auto", sm: "24px auto", md: "32px auto" },
          padding: { xs: "16px", sm: "24px", md: "32px" },
          backgroundColor: "white",
          borderRadius: "12px",
          boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
        }}
      >
        <Typography
          variant="h5"
          sx={{
            mb: 3,
            fontSize: { xs: "1.25rem", sm: "1.5rem" },
            textAlign: { xs: "center", sm: "left" },
          }}
        >
          Profile Details
        </Typography>

        <Box sx={{ textAlign: "center", mb: 4 }}>
          {userData?.profilePicture ? (
            <Avatar
              src={userData.profilePicture}
              alt={userData?.clientName}
              sx={{
                width: { xs: 80, sm: 100, md: 120 },
                height: { xs: 80, sm: 100, md: 120 },
                margin: "0 auto",
                boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                border: "4px solid #fff",
              }}
            />
          ) : (
            <Avatar
              sx={{
                width: { xs: 80, sm: 100, md: 120 },
                height: { xs: 80, sm: 100, md: 120 },
                margin: "0 auto",
                bgcolor: stringToColor(userData?.clientName),
                fontSize: { xs: "1.5rem", sm: "2rem", md: "2.5rem" },
                boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                border: "4px solid #fff",
              }}
            >
              {getInitials(userData?.clientName)}
            </Avatar>
          )}
        </Box>

        <Box
          sx={{
            display: "flex",
            flexWrap: "wrap",
            gap: { xs: 1, sm: 2 },
          }}
        >
          {[
            { label: "Client ID", value: userData?.clientId },
            { label: "Name", value: userData?.clientName },
            { label: "Email", value: userData?.email },
            { label: "Contact Number", value: userData?.contactNo },
            { label: "Gender", value: capitalizeFirstLetter(userData?.gender) },
            { label: "Country", value: userData?.country },
            { label: "State", value: userData?.state },
            { label: "Shift", value: capitalizeFirstLetter(userData?.shift) },
            { label: "Number of Students", value: userData?.numberOfStudents },
            {
              label: "Total Fee",
              value: formatCurrency(userData?.totalFee, userData?.currency),
              customStyle: {
                "& .MuiInputBase-input.Mui-disabled": {
                  WebkitTextFillColor: "#1e3a5c",
                  color: "#1e3a5c",
                  fontWeight: 600,
                },
              },
            },
            { label: "Currency", value: userData?.currency },
            {
              label: "Status",
              value: capitalizeFirstLetter(userData?.status),
              customStyle: {
                "& .MuiInputBase-input.Mui-disabled": {
                  WebkitTextFillColor: "#22c55e",
                  color: "#22c55e",
                  fontWeight: 600,
                },
              },
            },
            {
              label: "Account Status",
              value: userData?.isActive ? "Active" : "Inactive",
              customStyle: {
                "& .MuiInputBase-input.Mui-disabled": {
                  WebkitTextFillColor: userData?.isActive
                    ? "#22c55e"
                    : "#ef4444",
                  color: userData?.isActive ? "#22c55e" : "#ef4444",
                  fontWeight: 600,
                },
              },
            },
            { label: "Total Referrals", value: userData?.totalReferrals },
            {
              label: "Registration Date",
              value: formatDate(userData?.registrationDate),
            },
            {
              label: "Status Change Date",
              value: userData?.statusDates?.[userData?.status]?.date
                ? formatDate(userData?.statusDates[userData?.status].date)
                : "N/A",
            },
            { label: "Remarks", value: userData?.remarks || "N/A" },
            {
              label: "Referred By",
              value: userData?.referredByClient || "N/A",
            },
          ].map((field, index) => (
            <Box
              key={index}
              sx={{
                flex: {
                  xs: "1 1 100%",
                  sm: "1 1 calc(50% - 8px)",
                  md: "1 1 300px",
                },
                minWidth: 0,
              }}
            >
              <TextField
                fullWidth
                label={field.label}
                value={field.value || ""}
                disabled
                size="small"
                sx={{
                  mb: { xs: 1, sm: 2 },
                  ...textFieldStyle,
                  ...(field.customStyle || {}),
                }}
              />
            </Box>
          ))}
        </Box>
        <NotificationSnackbar
          notification={notification}
          onClose={closeNotification}
        />
      </Box>
    </ThemeProvider>
  );
};

export default ClientProfileManagement;
