import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import {
  Box,
  Typography,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
} from "@mui/material";
import { styled } from "@mui/material/styles";
import { uploadToCloudinary } from "../../../../utils/cloudinaryHelper";
import LockIcon from "@mui/icons-material/Lock";
import LockOpenIcon from "@mui/icons-material/LockOpen";
import KeyIcon from "@mui/icons-material/Key";
import { InputAdornment, Avatar } from "@mui/material";
import { useProfile } from "../../../../context/ProfileContext";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import { getAvatarProps } from "../../../../utils/avatarUtils";
import useNotification from "../../../../hooks/useNotification";
import NotificationSnackbar from "../../../../components/common/NotificationSnackbar";
import "../../../../styles/components/Management.css";
import { FaLock, FaLockOpen } from "react-icons/fa";
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

const UploadBox = styled(Box)(({ theme }) => ({
  border: "2px dashed #e2e8f0",
  borderRadius: "8px",
  padding: "20px",
  textAlign: "center",
  marginBottom: "20px",
  cursor: "pointer",
  transition: "border-color 0.3s ease",
  "&:hover": {
    borderColor: "#1f3d61",
  },
  [theme.breakpoints.down("sm")]: {
    padding: "15px",
  },
}));

// Optimized Avatar component with lazy loading
const OptimizedAvatar = ({ src, alt, sx, children, ...props }) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  const handleImageLoad = useCallback(() => {
    setImageLoaded(true);
  }, []);

  const handleImageError = useCallback(() => {
    setImageError(true);
    setImageLoaded(false);
  }, []);

  return (
    <Box sx={{ position: "relative", display: "inline-block" }}>
      {src && !imageError && (
        <img
          src={src}
          alt={alt}
          onLoad={handleImageLoad}
          onError={handleImageError}
          style={{ display: "none" }}
          loading="lazy"
        />
      )}

      <Avatar
        {...props}
        src={imageLoaded && !imageError ? src : undefined}
        alt={alt}
        sx={{
          ...sx,
          transition: "opacity 0.3s ease-in-out",
          opacity: src && !imageLoaded && !imageError ? 0.7 : 1,
        }}
      >
        {children}
      </Avatar>

      {src && !imageLoaded && !imageError && (
        <Box
          sx={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            zIndex: 1,
          }}
        >
          <CircularProgress size={20} />
        </Box>
      )}
    </Box>
  );
};

const ProfileManagement = () => {
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [user, setUser] = useState(null);
  const [showPasswordField, setShowPasswordField] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phoneNumber: "",
    address: "",
    gender: "",
    profilePicture: "",
    password: "",
  });

  const [imagePreview, setImagePreview] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const { notification, showNotification, closeNotification } =
    useNotification();

  const BASE_URL = import.meta.env.VITE_BASE_URL;
  const { updateProfilePicture } = useProfile();

  // Image compression utility
  const compressImage = useCallback(
    (file, quality = 0.7, maxWidth = 800, maxHeight = 800) => {
      return new Promise((resolve) => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        const img = new Image();

        img.onload = () => {
          // Calculate new dimensions
          let { width, height } = img;

          if (width > height) {
            if (width > maxWidth) {
              height = (height * maxWidth) / width;
              width = maxWidth;
            }
          } else {
            if (height > maxHeight) {
              width = (width * maxHeight) / height;
              height = maxHeight;
            }
          }

          canvas.width = width;
          canvas.height = height;

          // Draw and compress
          ctx.drawImage(img, 0, 0, width, height);

          canvas.toBlob(resolve, "image/jpeg", quality);
        };

        img.src = URL.createObjectURL(file);
      });
    },
    []
  );

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

      const userData = response.data.user;
      setUser(userData);
      setFormData({
        name: userData.name || "",
        email: userData.email || "",
        phoneNumber: userData.phoneNumber || "",
        address: userData.address || "",
        gender: userData.gender || "",
        staffId: userData.staffId || "",
        fatherName: userData.fatherName || "",
        role: userData.role || "",
        profilePicture: userData.profilePicture || "",
      });
      setImagePreview(userData.profilePicture || "");
      updateProfilePicture(userData.profilePicture || "");
    } catch (error) {
      showNotification("Error fetching user data", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      showNotification("Image size should be less than 5MB", "error");
      return;
    }

    if (!file.type.startsWith("image/")) {
      showNotification("Please upload an image file", "error");
      return;
    }

    try {
      setIsUploading(true);

      // Compress image before upload
      const compressedFile = await compressImage(file, 0.7, 800, 800);

      // Show preview immediately with compressed image
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(compressedFile);

      // Upload compressed image
      const imageUrl = await uploadToCloudinary(compressedFile);

      setFormData((prev) => ({
        ...prev,
        profilePicture: imageUrl,
      }));
      updateProfilePicture(imageUrl);
      showNotification("Image uploaded successfully");
    } catch (error) {
      console.error("Error uploading image:", error);
      showNotification("Error uploading image", "error");
      // Reset preview on error
      setImagePreview(formData.profilePicture || "");
    } finally {
      setIsUploading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const token = localStorage.getItem("token");
      const requestData = {
        name: formData.name,
        email: formData.email,
        phoneNumber: formData.phoneNumber,
        address: formData.address,
        gender: formData.gender,
        profilePicture: formData.profilePicture,
      };

      if (showPasswordField && formData.password) {
        requestData.password = formData.password;
      }

      Object.keys(requestData).forEach(
        (key) =>
          !requestData[key] &&
          requestData[key] !== false &&
          delete requestData[key]
      );

      const response = await axios.put(
        `${BASE_URL}/api/admin/users/${user._id}`,
        requestData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.status === 200) {
        showNotification("Profile updated successfully");
        if (formData.profilePicture) {
          updateProfilePicture(formData.profilePicture);
        }
        setShowPasswordField(false);
        await fetchUserData();
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      showNotification(
        error.response?.data?.msg || "Error updating profile",
        "error"
      );
    } finally {
      setIsSubmitting(false);
    }
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
          Profile Management
        </Typography>

        <form onSubmit={handleSubmit}>
          <input
            type="file"
            id="profile-image"
            accept="image/*"
            style={{ display: "none" }}
            onChange={handleImageUpload}
          />

          <Box sx={{ textAlign: "center", mb: 4 }}>
            <UploadBox
              onClick={() => document.getElementById("profile-image").click()}
              sx={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 2,
              }}
            >
              {imagePreview ? (
                <Box>
                  <OptimizedAvatar
                    src={imagePreview}
                    alt="Profile"
                    sx={{
                      width: { xs: 80, sm: 100, md: 120 },
                      height: { xs: 80, sm: 100, md: 120 },
                      margin: "0 auto",
                      border: "4px solid #fff",
                      boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                    }}
                  />
                  <Typography
                    variant="caption"
                    display="block"
                    sx={{
                      mt: 1,
                      fontSize: { xs: "0.7rem", sm: "0.75rem" },
                    }}
                  >
                    Click to change image
                  </Typography>
                </Box>
              ) : (
                <Box>
                  <OptimizedAvatar
                    {...getAvatarProps(formData.name, {
                      xs: 80,
                      sm: 100,
                      md: 120,
                    })}
                    sx={{
                      margin: "0 auto",
                      border: "4px solid #fff",
                      boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                      width: { xs: 80, sm: 100, md: 120 },
                      height: { xs: 80, sm: 100, md: 120 },
                      fontSize: { xs: "1.5rem", sm: "2rem", md: "2.5rem" },
                      ...getAvatarProps(formData.name).sx,
                    }}
                  />
                  <Typography
                    variant="body1"
                    color="textSecondary"
                    sx={{
                      mt: 2,
                      fontSize: { xs: "0.9rem", sm: "1rem" },
                    }}
                  >
                    Click to upload profile picture
                  </Typography>
                  <Typography
                    variant="caption"
                    color="textSecondary"
                    sx={{ fontSize: { xs: "0.7rem", sm: "0.75rem" } }}
                  >
                    Supported formats: JPG, PNG (Max 5MB)
                  </Typography>
                </Box>
              )}
            </UploadBox>

            {isUploading && (
              <Box sx={{ mt: 1 }}>
                <CircularProgress size={24} />
                <Typography
                  variant="caption"
                  display="block"
                  sx={{ fontSize: { xs: "0.7rem", sm: "0.75rem" } }}
                >
                  Compressing and uploading image...
                </Typography>
              </Box>
            )}
          </Box>

          <Box
            sx={{
              display: "flex",
              flexWrap: "wrap",
              gap: { xs: 1, sm: 2 },
            }}
          >
            <Box
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
                label="Staff ID"
                value={formData.staffId}
                disabled
                size="small"
                sx={{ mb: { xs: 1, sm: 2 } }}
              />
            </Box>

            <Box
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
                label="Name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                size="small"
                sx={{ mb: { xs: 1, sm: 2 } }}
              />
            </Box>

            <Box
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
                label="Email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                required
                size="small"
                sx={{ mb: { xs: 1, sm: 2 } }}
              />
            </Box>

            <Box
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
                label="Phone Number"
                name="phoneNumber"
                value={formData.phoneNumber}
                onChange={handleChange}
                size="small"
                sx={{ mb: { xs: 1, sm: 2 } }}
              />
            </Box>

            <Box
              sx={{
                flex: {
                  xs: "1 1 100%",
                  sm: "1 1 calc(50% - 8px)",
                  md: "1 1 300px",
                },
                minWidth: 0,
              }}
            >
              <FormControl fullWidth size="small" sx={{ mb: { xs: 1, sm: 2 } }}>
                <InputLabel>Gender</InputLabel>
                <Select
                  name="gender"
                  value={formData.gender}
                  label="Gender"
                  onChange={handleChange}
                  required
                >
                  <MenuItem value="male">Male</MenuItem>
                  <MenuItem value="female">Female</MenuItem>
                </Select>
              </FormControl>
            </Box>

            <Box
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
                label="Role"
                value={
                  formData.role
                    ? formData.role.charAt(0).toUpperCase() +
                      formData.role.slice(1)
                    : ""
                }
                disabled
                size="small"
                sx={{ mb: { xs: 1, sm: 2 } }}
              />
            </Box>

            <Box
              sx={{
                flex: "1 1 100%",
                minWidth: 0,
                border: showPasswordField ? "1px solid #e2e8f0" : "none",
                borderRadius: "8px",
                padding: showPasswordField ? { xs: 1, sm: 2 } : 0,
                mt: { xs: 1, sm: 2 },
                mb: { xs: 1, sm: 2 },
                bgcolor: showPasswordField ? "#f8fafc" : "transparent",
              }}
            >
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  mb: showPasswordField ? { xs: 1, sm: 2 } : 0,
                  flexDirection: { xs: "column", sm: "row" },
                  gap: { xs: 1, sm: 0 },
                }}
              >
                <Typography
                  variant="subtitle2"
                  color="textSecondary"
                  sx={{ fontSize: { xs: "0.8rem", sm: "0.875rem" } }}
                >
                  Password Settings
                </Typography>
                <button
                  type="button"
                  className={`add-btn${showPasswordField ? " danger" : ""}`}
                  onClick={() => {
                    setShowPasswordField(!showPasswordField);
                    if (!showPasswordField) {
                      setFormData((prev) => ({ ...prev, password: "" }));
                    }
                  }}
                >
                  {showPasswordField ? (
                    <>
                      <FaLockOpen style={{ marginRight: 8 }} />
                      Cancel Password Change
                    </>
                  ) : (
                    <>
                      <FaLock style={{ marginRight: 8 }} />
                      Change Password
                    </>
                  )}
                </button>
              </Box>

              {showPasswordField && (
                <Box
                  sx={{
                    display: "flex",
                    flexDirection: "column",
                    gap: { xs: 1, sm: 2 },
                  }}
                >
                  <TextField
                    fullWidth
                    label="New Password"
                    name="password"
                    type="password"
                    value={formData.password || ""}
                    onChange={handleChange}
                    required
                    size="small"
                    placeholder="Enter new password"
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <KeyIcon sx={{ color: "text.secondary" }} />
                        </InputAdornment>
                      ),
                    }}
                  />
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ fontSize: { xs: "0.7rem", sm: "0.75rem" } }}
                  >
                    Password must be at least 6 characters long
                  </Typography>
                </Box>
              )}
            </Box>
          </Box>

          <Box sx={{ mt: { xs: 1, sm: 2 } }}>
            <TextField
              fullWidth
              label="Address"
              name="address"
              value={formData.address}
              onChange={handleChange}
              multiline
              rows={3}
              size="small"
              sx={{ mb: { xs: 1, sm: 2 } }}
            />
          </Box>

          <Box
            sx={{
              mt: { xs: 3, sm: 4 },
              pt: { xs: 1.5, sm: 2 },
              display: "flex",
              justifyContent: { xs: "center", sm: "flex-end" },
              borderTop: "1px solid #e2e8f0",
            }}
          >
            <button
              type="submit"
              className="add-btn"
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                textAlign: "center",
              }}
            >
              Update Profile
            </button>
          </Box>
        </form>
        <NotificationSnackbar
          notification={notification}
          onClose={closeNotification}
        />
      </Box>
    </ThemeProvider>
  );
};

export default ProfileManagement;
