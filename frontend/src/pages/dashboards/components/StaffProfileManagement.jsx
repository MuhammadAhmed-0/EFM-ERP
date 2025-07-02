import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import {
  Box,
  Typography,
  TextField,
  CircularProgress,
  Avatar,
} from "@mui/material";
import { styled } from "@mui/material/styles";
import { useProfile } from "../../../context/ProfileContext";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import { getAvatarProps } from "../../../utils/avatarUtils";
import useNotification from "../../../hooks/useNotification";
import NotificationSnackbar from "../../../components/common/NotificationSnackbar";

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

const OptimizedAvatar = ({ src, alt, sx, children, ...props }) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  const handleImageLoad = useCallback(() => {
    setImageLoaded(true);
  }, []);

  const handleImageError = useCallback(() => {
    setImageError(true);
  }, []);

  if (src && !imageError) {
    return (
      <>
        <img
          src={src}
          alt={alt}
          onLoad={handleImageLoad}
          onError={handleImageError}
          style={{ display: "none" }}
          loading="lazy"
        />
        <Avatar
          {...props}
          src={imageLoaded ? src : undefined}
          alt={alt}
          sx={{
            ...sx,
            opacity: imageLoaded ? 1 : 0.7,
          }}
        >
          {!imageLoaded && children}
        </Avatar>
      </>
    );
  }

  return (
    <Avatar {...props} alt={alt} sx={sx}>
      {children}
    </Avatar>
  );
};

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

const formatSalary = (salary) => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "PKR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(salary);
};

const StaffProfileManagement = () => {
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState(null);
  const { notification, showNotification, closeNotification } =
    useNotification();

  const { updateProfilePicture } = useProfile();
  const BASE_URL = import.meta.env.VITE_BASE_URL;

  useEffect(() => {
    fetchUserData();
  }, []);

  const formatRole = useCallback((role) => {
    if (!role) return "";

    if (role.startsWith("supervisor_")) {
      const department = role.split("_")[1];
      return `${
        department.charAt(0).toUpperCase() + department.slice(1)
      } Supervisor`;
    }

    return role
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  }, []);

  const fetchUserData = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(`${BASE_URL}/api/auth/me`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const userData = {
        ...response.data.user,
        ...response.data.details,
      };

      setUserData(userData);
      updateProfilePicture(response.data.user.profilePicture || "");
      localStorage.setItem("user", JSON.stringify(response.data.user));
    } catch (error) {
      showNotification("Error fetching user data", "error");
    } finally {
      setLoading(false);
    }
  };

  const capitalizeFirst = useCallback(
    (text) =>
      text ? text.charAt(0).toUpperCase() + text.slice(1).toLowerCase() : "",
    []
  );

  const formatDate = useCallback((dateString) => {
    if (!dateString) return "";
    try {
      return new Date(dateString).toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });
    } catch (error) {
      return "";
    }
  }, []);

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

  const profileFields = [
    { label: "Staff ID", value: userData?.staffId },
    { label: "Name", value: userData?.name },
    { label: "Father Name", value: userData?.fatherName },
    { label: "Email", value: userData?.email },
    { label: "Phone Number", value: userData?.phoneNumber },
    { label: "Gender", value: capitalizeFirst(userData?.gender) },
    { label: "Role", value: formatRole(userData?.role) },
    {
      label: "Department",
      value: userData?.department
        ? userData.department.charAt(0).toUpperCase() +
          userData.department.slice(1)
        : "",
    },
    {
      label: "Date of Birth",
      value: formatDate(userData?.dateOfBirth),
    },
    { label: "CNIC Number", value: userData?.cnicNumber },
    { label: "Religion", value: userData?.religion },
    { label: "Shift", value: capitalizeFirst(userData?.shift) },
    { label: "Manager Name", value: userData?.managerName },
    {
      label: "Joining Date",
      value: formatDate(userData?.joiningDate),
    },
    {
      label: "Status",
      value: userData?.isActive ? "Active" : "Inactive",
      customStyle: {
        "& .MuiInputBase-input.Mui-disabled": {
          WebkitTextFillColor: userData?.isActive ? "#22c55e" : "#ef4444",
          color: userData?.isActive ? "#22c55e" : "#ef4444",
          fontWeight: 600,
        },
      },
    },
    {
      label: "Basic Salary",
      value: userData?.salary ? formatSalary(userData.salary) : "Not Available",
      customStyle: {
        "& .MuiInputBase-input.Mui-disabled": {
          WebkitTextFillColor: "#1e3a5c",
          color: "#1e3a5c",
          fontWeight: 600,
        },
      },
    },
  ];

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
            <OptimizedAvatar
              src={userData.profilePicture}
              alt={userData?.name || "Profile"}
              sx={{
                width: { xs: 80, sm: 100, md: 120 },
                height: { xs: 80, sm: 100, md: 120 },
                margin: "0 auto",
                border: "4px solid #fff",
                boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
              }}
            >
              {getAvatarProps(userData?.name).children}
            </OptimizedAvatar>
          ) : (
            <Avatar
              {...getAvatarProps(userData?.name)}
              sx={{
                margin: "0 auto",
                border: "4px solid #fff",
                boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                width: { xs: 80, sm: 100, md: 120 },
                height: { xs: 80, sm: 100, md: 120 },
                fontSize: { xs: "1.5rem", sm: "2rem", md: "2.5rem" },
                ...getAvatarProps(userData?.name).sx,
              }}
            />
          )}
        </Box>

        <Box
          sx={{
            display: "flex",
            flexWrap: "wrap",
            gap: { xs: 1, sm: 2 },
          }}
        >
          {profileFields.map((field, index) => (
            <Box
              key={`${field.label}-${index}`}
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

export default StaffProfileManagement;
