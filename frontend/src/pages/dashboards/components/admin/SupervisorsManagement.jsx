import { useState, useEffect, useCallback } from "react";
import {
  FaEdit,
  FaEye,
  FaSearch,
  FaPlus,
  FaFilter,
  FaToggleOn,
  FaToggleOff,
} from "react-icons/fa";
import {
  Modal,
  Box,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Button,
  Typography,
  CircularProgress,
  Chip,
  Autocomplete,
} from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { format } from "date-fns";
import axios from "axios";
import ViewStaffModal from "./viewModals/ViewStaffModal";
import "../../../../styles/components/Management.css";
import InfoModal from "./infoModals/InfoModal";
import { tableStyles } from "../../../../styles/modal/styles";
import { getModalStyles } from "../../../../styles/modal/commonModalStyles";
import { useInfoModal } from "../../../../hooks/useInfoModal";
import { styled } from "@mui/material/styles";
import { uploadToCloudinary } from "../../../../utils/cloudinaryHelper";
import useNotification from "../../../../hooks/useNotification";
import NotificationSnackbar from "../../../../components/common/NotificationSnackbar";
import SyncButton from "../../../../components/common/SyncButton";
const ROLES = [
  { value: "supervisor_quran", label: "Supervisor Quran" },
  { value: "supervisor_subjects", label: "Supervisor Subjects" },
];

const DAYS_OF_WEEK = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

const SHIFTS = ["morning", "night"];
const GENDERS = ["male", "female"];
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
}));

const ImagePreview = styled("img")({
  maxWidth: "100%",
  maxHeight: "200px",
  marginTop: "10px",
  borderRadius: "4px",
});

const ModalContent = ({
  formData,
  handleChange,
  handleSubmit,
  setShowModal,
  modalStyle,
  currentSupervisor,
  errors,
  isLoading,
  managers,
  handleDateChange,
  adminPassword,
  setAdminPassword,
  passwordError,
  isInfoVisible,
  handleAdminPasswordSubmit,
  handleImageUpload,
  imagePreview,
  isUploading,
  handleDayToggle,
}) => (
  <Box sx={getModalStyles()}>
    <Box sx={{ borderBottom: "1px solid #e2e8f0", pb: 2, mb: 3 }}>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 2,
        }}
      >
        <Typography variant="h6" component="h2">
          {currentSupervisor ? "Edit Supervisor" : "Add New Supervisor"}
        </Typography>
        <Button
          onClick={() => !isLoading && setShowModal(false)}
          sx={{
            minWidth: "auto",
            p: 1,
            color: "#64748b",
            "&:hover": {
              bgcolor: "#f1f5f9",
              color: "#3949ab",
            },
          }}
        >
          ×
        </Button>
      </Box>
    </Box>
    <form onSubmit={handleSubmit}>
      <input
        type="file"
        id="profile-image"
        accept="image/*"
        style={{ display: "none" }}
        onChange={handleImageUpload}
      />
      <UploadBox
        onClick={() => document.getElementById("profile-image").click()}
      >
        {imagePreview ? (
          <Box>
            <ImagePreview src={imagePreview} alt="Profile preview" />
            <Typography variant="caption" display="block" sx={{ mt: 1 }}>
              Click to change image
            </Typography>
          </Box>
        ) : (
          <Box>
            <Typography variant="body1" color="textSecondary">
              Click to upload profile picture
            </Typography>
            <Typography variant="caption" color="textSecondary">
              Supported formats: JPG, PNG (Max 5MB)
            </Typography>
          </Box>
        )}
      </UploadBox>
      {isUploading && (
        <Box sx={{ textAlign: "center", mt: 1 }}>
          <CircularProgress size={24} />
          <Typography variant="caption" display="block">
            Uploading image...
          </Typography>
        </Box>
      )}
      {currentSupervisor && (
        <TextField
          label="Staff ID"
          margin="normal"
          fullWidth
          value={currentSupervisor.staffId}
          size="small"
          InputProps={{
            readOnly: true,
          }}
        />
      )}
      <TextField
        fullWidth
        label="Name"
        name="name"
        value={formData.name}
        onChange={handleChange}
        required
        margin="normal"
        size="small"
        error={!!errors.name}
        helperText={errors.name}
      />
      {isInfoVisible ? (
        <>
          <TextField
            fullWidth
            label="Email"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            required
            margin="normal"
            size="small"
            error={!!errors.email}
            helperText={errors.email}
          />

          <TextField
            fullWidth
            label="Password"
            name="password"
            type="password"
            value={formData.password}
            onChange={handleChange}
            required={!currentSupervisor}
            margin="normal"
            size="small"
            error={!!errors.password}
            helperText={
              currentSupervisor
                ? "Leave blank to keep current password"
                : errors.password
            }
          />

          <TextField
            fullWidth
            label="Phone Number"
            name="phoneNumber"
            value={formData.phoneNumber}
            onChange={handleChange}
            margin="normal"
            size="small"
          />

          <TextField
            fullWidth
            label="CNIC Number"
            name="cnicNumber"
            type="number"
            value={formData.cnicNumber}
            onChange={handleChange}
            required
            margin="normal"
            size="small"
            error={!!errors.cnicNumber}
            helperText={errors.cnicNumber}
          />
        </>
      ) : (
        <>
          {currentSupervisor ? (
            <Box sx={{ mt: 2, mb: 2 }}>
              <Typography
                variant="subtitle2"
                sx={{ mb: 2, fontWeight: "bold" }}
              >
                Enter Admin Password to Edit Sensitive Information
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
                sx={{
                  mb: 2,
                  "& .MuiOutlinedInput-root": {
                    bgcolor: "#fff",
                  },
                }}
              />
              <Button
                fullWidth
                variant="contained"
                onClick={handleAdminPasswordSubmit}
                sx={{
                  bgcolor: "#1f3d61",
                  "&:hover": {
                    bgcolor: "#1f3d70",
                  },
                }}
              >
                View Sensitive Information
              </Button>
            </Box>
          ) : (
            <>
              <TextField
                fullWidth
                label="Email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                required
                margin="normal"
                size="small"
                error={!!errors.email}
                helperText={errors.email}
              />

              <TextField
                fullWidth
                label="Password"
                name="password"
                type="password"
                value={formData.password}
                onChange={handleChange}
                required={!currentSupervisor}
                margin="normal"
                size="small"
                error={!!errors.password}
                helperText={
                  errors.password || "Enter password for new supervisor"
                }
              />

              <TextField
                fullWidth
                label="Phone Number"
                name="phoneNumber"
                value={formData.phoneNumber}
                onChange={handleChange}
                margin="normal"
                size="small"
              />

              <TextField
                fullWidth
                label="CNIC Number"
                name="cnicNumber"
                type="number"
                value={formData.cnicNumber}
                onChange={handleChange}
                required
                margin="normal"
                size="small"
                error={!!errors.cnicNumber}
                helperText={errors.cnicNumber}
              />
            </>
          )}
        </>
      )}
      <TextField
        fullWidth
        label="Father's Name"
        name="fatherName"
        value={formData.fatherName}
        onChange={handleChange}
        required
        margin="normal"
        size="small"
      />
      <LocalizationProvider dateAdapter={AdapterDateFns}>
        <DatePicker
          label="Date of Birth"
          value={formData.dateOfBirth ? new Date(formData.dateOfBirth) : null}
          onChange={(date) => handleDateChange(date, "dateOfBirth")}
          renderInput={(params) => (
            <TextField
              {...params}
              fullWidth
              margin="normal"
              size="small"
              required
              error={!!errors.dateOfBirth}
              helperText={errors.dateOfBirth}
            />
          )}
        />
      </LocalizationProvider>
      <FormControl fullWidth margin="normal" size="small">
        <InputLabel>Gender</InputLabel>
        <Select
          name="gender"
          value={formData.gender}
          label="Gender"
          onChange={handleChange}
          required
        >
          {GENDERS.map((gender) => (
            <MenuItem key={gender} value={gender}>
              {gender.charAt(0).toUpperCase() + gender.slice(1)}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
      {currentSupervisor ? (
        <TextField
          fullWidth
          label="Role"
          value={
            ROLES.find((r) => r.value === formData.role)?.label || formData.role
          }
          margin="normal"
          size="small"
          disabled
        />
      ) : (
        <FormControl fullWidth margin="normal" size="small">
          <InputLabel>Role</InputLabel>
          <Select
            name="role"
            value={formData.role}
            label="Role"
            onChange={handleChange}
            required
          >
            {ROLES.map((role) => (
              <MenuItem key={role.value} value={role.value}>
                {role.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      )}

      <FormControl fullWidth margin="normal" size="small" required>
        <Autocomplete
          id="manager-autocomplete"
          options={managers}
          getOptionLabel={(option) =>
            `${option.staffId} - ${option.name} (${
              option.role === "admin"
                ? "Admin"
                : option.role === "supervisor_quran"
                ? "Quran Supervisor"
                : option.role === "supervisor_subjects"
                ? "Subjects Supervisor"
                : "N/A"
            })`
          }
          value={
            managers.find((manager) => manager._id === formData.manager) || null
          }
          onChange={(event, newValue) => {
            handleChange({
              target: {
                name: "manager",
                value: newValue ? newValue._id : "",
              },
            });
          }}
          renderInput={(params) => (
            <TextField {...params} label="Manager" size="small" required />
          )}
          renderOption={(props, option) => {
            const { key, ...restProps } = props;
            return (
              <li key={key} {...restProps}>
                {`${option.staffId} - ${option.name} (${
                  option.role === "admin"
                    ? "Admin"
                    : option.role === "supervisor_quran"
                    ? "Quran Supervisor"
                    : option.role === "supervisor_subjects"
                    ? "Subjects Supervisor"
                    : "N/A"
                })`}
              </li>
            );
          }}
        />
      </FormControl>
      <TextField
        fullWidth
        label="Salary"
        name="salary"
        type="number"
        value={formData.salary}
        onChange={handleChange}
        required
        margin="normal"
        size="small"
        error={!!errors.salary}
        helperText={errors.salary}
      />
      <FormControl fullWidth margin="normal" size="small">
        <InputLabel>Shift</InputLabel>
        <Select
          name="shift"
          value={formData.shift}
          label="Shift"
          onChange={handleChange}
          required
        >
          {SHIFTS.map((shift) => (
            <MenuItem key={shift} value={shift}>
              {shift.charAt(0).toUpperCase() + shift.slice(1)}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
      <TextField
        fullWidth
        label="Religion"
        name="religion"
        value={formData.religion}
        onChange={handleChange}
        required
        margin="normal"
        size="small"
      />
      <Box sx={{ mb: 2 }}>
        <Typography variant="subtitle2" sx={{ mb: 1 }}>
          Availability
        </Typography>
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
          {DAYS_OF_WEEK.map((day) => (
            <Chip
              key={day}
              label={day}
              onClick={() => handleDayToggle(day)}
              color={
                formData.availability.days.includes(day) ? "primary" : "default"
              }
              sx={{ cursor: "pointer" }}
            />
          ))}
        </Box>
      </Box>

      <Box sx={{ display: "flex", gap: 2, mt: 2 }}>
        <TextField
          label="Start Time"
          name="startTime"
          type="time"
          value={formData.availability.startTime}
          onChange={(e) =>
            handleChange({
              target: {
                name: "availability",
                value: { ...formData.availability, startTime: e.target.value },
              },
            })
          }
          InputLabelProps={{ shrink: true }}
          inputProps={{ step: 300 }}
          size="small"
          sx={{ flex: 1 }}
        />
        <TextField
          label="End Time"
          name="endTime"
          type="time"
          value={formData.availability.endTime}
          onChange={(e) =>
            handleChange({
              target: {
                name: "availability",
                value: { ...formData.availability, endTime: e.target.value },
              },
            })
          }
          InputLabelProps={{ shrink: true }}
          inputProps={{ step: 300 }}
          size="small"
          sx={{ flex: 1 }}
        />
      </Box>
      {currentSupervisor && (
        <FormControl fullWidth margin="normal" size="small">
          <InputLabel>Status</InputLabel>
          <Select
            name="isActive"
            value={formData.isActive}
            label="Status"
            onChange={handleChange}
          >
            <MenuItem value={true}>Active</MenuItem>
            <MenuItem value={false}>Inactive</MenuItem>
          </Select>
        </FormControl>
      )}
      <Box
        sx={{
          mt: 4,
          pt: 2,
          display: "flex",
          justifyContent: "flex-end",
          gap: 2,
          borderTop: "1px solid #e2e8f0",
        }}
      >
        <button
          className="clear-filters-btn"
          onClick={() => setShowModal(false)}
          disabled={isLoading}
        >
          Cancel
        </button>
        <button className="add-btn" type="submit" disabled={isLoading}>
          {isLoading ? (
            <div className="loading-spinner"></div>
          ) : currentSupervisor ? (
            "Update Supervisor"
          ) : (
            "Add Supervisor"
          )}
        </button>
      </Box>
    </form>
  </Box>
);

const SupervisorsManagement = () => {
  const {
    showInfoModal,
    selectedItem,
    adminPassword,
    passwordError,
    isInfoVisible,
    isAdminAuthenticated,
    setAdminPassword,
    handleShowInfo,
    handleAdminPasswordSubmit,
    handleCloseInfoModal,
  } = useInfoModal();
  const [supervisors, setSupervisors] = useState([]);
  const [managers, setManagers] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [currentSupervisor, setCurrentSupervisor] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [errors, setErrors] = useState({});
  const [filteredSupervisors, setFilteredSupervisors] = useState([]);
  const [selectedRole, setSelectedRole] = useState("all");
  const [isViewMode, setIsViewMode] = useState(false);
  const [imagePreview, setImagePreview] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    gender: "male",
    role: "supervisor_quran",
    phoneNumber: "",
    dateOfBirth: null,
    fatherName: "",
    manager: "",
    salary: "",
    shift: "morning",
    cnicNumber: "",
    religion: "",
    isActive: true,
    availability: {
      days: [],
      startTime: "",
      endTime: "",
    },
  });
  const { notification, showNotification, closeNotification } =
    useNotification();

  const BASE_URL = import.meta.env.VITE_BASE_URL;

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    }
    fetchSupervisors();
    fetchManagers();
  }, []);

  const fetchSupervisors = async (showSuccessMessage = false) => {
    setIsSyncing(true);
    try {
      const [quranSups, subjectsSups] = await Promise.all([
        axios.get(`${BASE_URL}/api/admin/users/supervisor_quran`),
        axios.get(`${BASE_URL}/api/admin/users/supervisor_subjects`),
      ]);

      const allSupervisors = [
        ...quranSups.data.users,
        ...subjectsSups.data.users,
      ];
      setSupervisors(allSupervisors);
      setFilteredSupervisors(allSupervisors);
      if (showSuccessMessage) {
        showNotification("Supervisors refreshed successfully");
      }
    } catch (error) {
      console.error("Error fetching supervisors:", error);
      showNotification(
        error.response?.data?.message || "Error fetching supervisors",
        "error"
      );
    } finally {
      setIsSyncing(false);
    }
  };

  const fetchManagers = async () => {
    try {
      const response = await axios.get(`${BASE_URL}/api/admin/users`);
      const eligibleManagers = response.data.users.filter(
        (user) => user.role === "admin" || user.role.startsWith("supervisor_")
      );
      setManagers(eligibleManagers);
    } catch (error) {
      console.error("Error fetching managers:", error);
    }
  };

  const handleDateChange = (date, field) => {
    setFormData((prev) => ({
      ...prev,
      [field]: date,
    }));
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
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);

      const imageUrl = await uploadToCloudinary(file);

      setFormData((prev) => ({
        ...prev,
        profilePicture: imageUrl,
      }));

      showNotification("Image uploaded successfully");
    } catch (error) {
      console.error("Error uploading image:", error);
      showNotification("Error uploading image", "error");
    } finally {
      setIsUploading(false);
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = "Name is required";
    if (!formData.email.trim()) newErrors.email = "Email is required";
    if (!currentSupervisor && !formData.password.trim()) {
      newErrors.password = "Password is required for new supervisors";
    }
    if (formData.password && formData.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }
    if (!formData.fatherName.trim())
      newErrors.fatherName = "Father's name is required";
    if (!formData.dateOfBirth)
      newErrors.dateOfBirth = "Date of birth is required";
    if (!formData.manager) newErrors.manager = "Manager is required";
    if (!formData.salary) newErrors.salary = "Salary is required";
    if (!formData.cnicNumber) newErrors.cnicNumber = "CNIC number is required";
    if (formData.cnicNumber && formData.cnicNumber.toString().length !== 13) {
      newErrors.cnicNumber = "CNIC must be 13 digits";
    }
    if (!formData.religion.trim()) newErrors.religion = "Religion is required";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  const handleAdd = () => {
    setCurrentSupervisor(null);
    setFormData({
      name: "",
      email: "",
      password: "",
      profilePicture: "",
      gender: "male",
      role: "supervisor_quran",
      phoneNumber: "",
      dateOfBirth: null,
      fatherName: "",
      manager: "",
      salary: "",
      shift: "morning",
      cnicNumber: "",
      religion: "",
      isActive: true,
      availability: {
        days: [],
        startTime: "",
        endTime: "",
      },
    });
    setImagePreview("");

    setErrors({});
    setShowModal(true);
  };

  const handleEdit = (supervisor) => {
    setCurrentSupervisor({
      ...supervisor,
      staffId: supervisor.staffId,
    });
    setFormData({
      name: supervisor.name,
      email: supervisor.email,
      profilePicture: supervisor.profilePicture || "",
      password: "",
      gender: supervisor.gender,
      role: supervisor.role,
      phoneNumber: supervisor.phoneNumber || "",
      dateOfBirth: supervisor.profile?.dateOfBirth,
      fatherName: supervisor.profile?.fatherName,
      manager:
        supervisor.profile?.manager?._id || supervisor.profile?.manager || "",
      salary: supervisor.profile?.salary,
      shift: supervisor.profile?.shift || "morning",
      cnicNumber: supervisor.profile?.cnicNumber,
      religion: supervisor.profile?.religion,
      isActive: supervisor.isActive,
      availability: {
        days: supervisor.profile?.availability?.days || [],
        startTime: supervisor.profile?.availability?.startTime || "",
        endTime: supervisor.profile?.availability?.endTime || "",
      },
    });
    setImagePreview(supervisor.profilePicture || "");
    setErrors({});
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      const submissionData = {
        ...formData,
        email: formData.email?.toLowerCase(),
        dateOfBirth: format(new Date(formData.dateOfBirth), "yyyy-MM-dd"),
        manager: formData.manager,
        profilePicture: formData.profilePicture,
      };

      if (currentSupervisor) {
        const { role, staffId, ...updateData } = submissionData;
        await axios.put(
          `${BASE_URL}/api/admin/users/${currentSupervisor._id}`,
          updateData
        );
        showNotification("Supervisor updated successfully");
      } else {
        await axios.post(`${BASE_URL}/api/admin/users`, submissionData);
        showNotification("Supervisor added successfully");
      }

      await fetchSupervisors();
      setShowModal(false);
    } catch (error) {
      console.error("Error:", error);
      showNotification(
        error.response?.data?.msg || "Error processing request",
        "error"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusToggle = async (supervisor) => {
    try {
      const response = await axios.put(
        `${BASE_URL}/api/admin/supervisors/${supervisor._id}/toggle-status`,
        {
          isActive: !supervisor.isActive,
          reason: `Supervisor ${
            !supervisor.isActive ? "activated" : "deactivated"
          } by admin via management interface`,
        }
      );

      if (response.data.success) {
        const managerInfo = response.data.data.managerRelationshipUpdates;
        let notificationMessage = `Supervisor ${supervisor.name} ${
          !supervisor.isActive ? "activated" : "deactivated"
        } successfully`;

        if (!supervisor.isActive && managerInfo.totalTeachersAffected > 0) {
          notificationMessage += `. ${managerInfo.totalTeachersAffected} teacher(s) manager fields cleared.`;
        }

        showNotification(notificationMessage);
        await fetchSupervisors();
      }
    } catch (error) {
      console.error("❌ Error toggling supervisor status:", error);
      showNotification(
        error.response?.data?.msg || "Error updating supervisor status",
        "error"
      );
    }
  };

  const handleDayToggle = (day) => {
    setFormData((prev) => {
      const days = prev.availability.days.includes(day)
        ? prev.availability.days.filter((d) => d !== day)
        : [...prev.availability.days, day];
      return {
        ...prev,
        availability: {
          ...prev.availability,
          days,
        },
      };
    });
  };

  const updateFilteredSupervisors = useCallback(() => {
    let filtered = [...supervisors];

    if (searchTerm) {
      const hasNumbers = /\d/.test(searchTerm);
      const searchTermLower = searchTerm.toLowerCase().trim();
      const searchNumeric = hasNumbers ? searchTerm.replace(/\D/g, "") : "";

      filtered = filtered.filter((supervisor) => {
        const nameMatch = supervisor.name
          ?.toLowerCase()
          .includes(searchTermLower);
        const emailMatch = supervisor.email
          ?.toLowerCase()
          .includes(searchTermLower);
        const staffIdMatch = hasNumbers
          ? String(supervisor.staffId || "").includes(searchNumeric)
          : false;

        return nameMatch || emailMatch || staffIdMatch;
      });
    }

    if (selectedRole !== "all") {
      filtered = filtered.filter(
        (supervisor) => supervisor.role === selectedRole
      );
    }

    if (selectedStatus !== "all") {
      filtered = filtered.filter((supervisor) => {
        if (selectedStatus === "active") {
          return supervisor.isActive === true;
        } else if (selectedStatus === "inactive") {
          return supervisor.isActive === false;
        }
        return true;
      });
    }

    setFilteredSupervisors(filtered);
  }, [supervisors, searchTerm, selectedRole, selectedStatus]);

  useEffect(() => {
    updateFilteredSupervisors();
  }, [supervisors, searchTerm, selectedRole, updateFilteredSupervisors]);

  const modalStyle = {
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    width: 500,
    bgcolor: "background.paper",
    borderRadius: "12px",
    boxShadow:
      "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)",
    p: 4,
    maxHeight: "90vh",
    overflowY: "auto",
    "&:focus-visible": {
      outline: "none",
    },
    fontFamily:
      "'Poppins', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  };
  return (
    <div className="management-container">
      <div className="management-header">
        <div>
          <h2>Supervisors Management</h2>
          <p className="total-count">
            {filteredSupervisors.length} Total Supervisors
          </p>
        </div>
        <div className="header-buttons">
          <SyncButton
            isSyncing={isSyncing}
            onClick={() => fetchSupervisors(true)}
          />
          <button className="add-btn" onClick={handleAdd}>
            <FaPlus /> Add Supervisor
          </button>
        </div>
      </div>
      <div className="filter-section">
        <div className="search-box">
          <FaSearch className="search-icon" />
          <input
            type="text"
            placeholder="Search by Name or ID"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="filter-box">
          <FaFilter className="filter-icon" />
          <Select
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value)}
            displayEmpty
            sx={{
              width: "200px",
              height: "40px",
              ".MuiSelect-select": {
                padding: "8px 12px 8px 36px",
                backgroundColor: "white",
                border: "1px solid #e2e8f0",
                borderRadius: "6px",
                fontSize: "0.875rem",
                color: "#475569",
              },
              ".MuiOutlinedInput-notchedOutline": {
                border: "none",
              },
            }}
          >
            <MenuItem value="all">All Supervisors</MenuItem>
            {ROLES.map((role) => (
              <MenuItem key={role.value} value={role.value}>
                {role.label}
              </MenuItem>
            ))}
          </Select>
        </div>
        <div className="filter-box">
          <FaFilter className="filter-icon" />
          <Select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            displayEmpty
            sx={{
              width: "200px",
              height: "40px",
              ".MuiSelect-select": {
                padding: "8px 12px 8px 36px",
                backgroundColor: "white",
                border: "1px solid #e2e8f0",
                borderRadius: "6px",
                fontSize: "0.875rem",
                color: "#475569",
              },
              ".MuiOutlinedInput-notchedOutline": {
                border: "none",
              },
            }}
          >
            <MenuItem value="all">All Status</MenuItem>
            <MenuItem value="active">Active Supervisors</MenuItem>
            <MenuItem value="inactive">Inactive Supervisors</MenuItem>
          </Select>
        </div>
        <button
          className="clear-filters-btn"
          onClick={() => {
            setSelectedRole("all");
            setSelectedStatus("all");
            setSearchTerm("");
          }}
        >
          Clear Filters
        </button>
      </div>
      <div className="table-container">
        {isLoading && !showModal ? (
          <div className="loading-container">
            <CircularProgress />
          </div>
        ) : filteredSupervisors.length > 0 ? (
          <table>
            <thead>
              <tr>
                <th>Staff ID</th>
                <th>Name & Details</th>
                <th>Email & Contact</th>
                <th>Role & Department</th>
                <th>Manager</th>
                <th>Status & Shift</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredSupervisors.map((supervisor) => (
                <tr key={supervisor._id}>
                  <td>
                    <div style={{ fontWeight: "500" }}>
                      {supervisor.staffId}
                    </div>
                    <div style={{ color: "#64748b", fontSize: "0.8125rem" }}>
                      Since:{" "}
                      {format(new Date(supervisor.createdAt), "yyyy-MM-dd")}
                    </div>
                  </td>
                  <td>
                    <div style={{ fontWeight: "500" }}>{supervisor.name}</div>
                    <div style={{ color: "#64748b", fontSize: "0.8125rem" }}>
                      {supervisor.profile?.fatherName || "N/A"}
                    </div>
                  </td>

                  <td>
                    <div style={tableStyles.buttonContainer}>
                      <Button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleShowInfo(supervisor, "contact");
                        }}
                        sx={tableStyles.viewButton}
                      >
                        View
                      </Button>
                    </div>
                  </td>
                  <td>
                    <div>
                      {supervisor.role === "supervisor_quran"
                        ? "Quran Supervisor"
                        : "Subjects Supervisor"}
                    </div>
                    <div style={{ color: "#64748b", fontSize: "0.8125rem" }}>
                      {supervisor.profile?.department || "N/A"}
                    </div>
                  </td>
                  <td>
                    <div style={{ fontWeight: "500" }}>
                      {supervisor.profile?.managerName || "N/A"}
                    </div>
                    <div style={{ color: "#64748b", fontSize: "0.8125rem" }}>
                      {supervisor.profile?.manager?.role === "admin"
                        ? "Admin"
                        : supervisor.profile?.manager?.role ===
                          "supervisor_quran"
                        ? "Quran Supervisor"
                        : supervisor.profile?.manager?.role ===
                          "supervisor_subjects"
                        ? "Subjects Supervisor"
                        : "N/A"}
                    </div>
                  </td>
                  <td>
                    <div style={{ textAlign: "center" }}>
                      <span
                        className={`status-tag ${
                          supervisor.isActive ? "active" : "inactive"
                        }`}
                      >
                        {supervisor.isActive ? "Active" : "Inactive"}
                      </span>
                    </div>
                    <div
                      style={{
                        color: "#64748b",
                        fontSize: "0.8125rem",
                        textAlign: "center",
                      }}
                    >
                      {supervisor.profile?.shift || "N/A"}
                    </div>
                  </td>
                  <td>
                    <div className="actions">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setIsViewMode(true);
                          setCurrentSupervisor(supervisor);
                          setShowModal(true);
                        }}
                      >
                        <FaEye />
                      </button>
                      <button
                        onClick={() => handleStatusToggle(supervisor)}
                        className={`action-btn toggle-btn ${
                          supervisor.isActive
                            ? "toggle-active"
                            : "toggle-inactive"
                        }`}
                      >
                        {supervisor.isActive ? <FaToggleOn /> : <FaToggleOff />}
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setIsViewMode(false);
                          handleEdit(supervisor);
                        }}
                      >
                        <FaEdit />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="no-data">
            <p>
              {searchTerm || selectedRole !== "all"
                ? "No supervisors found matching your search criteria"
                : "No supervisors found"}
            </p>
          </div>
        )}
      </div>
      <InfoModal
        open={showInfoModal}
        onClose={handleCloseInfoModal}
        selectedItem={selectedItem}
        adminPassword={adminPassword}
        setAdminPassword={setAdminPassword}
        passwordError={passwordError}
        isInfoVisible={isInfoVisible}
        handleAdminPasswordSubmit={handleAdminPasswordSubmit}
        type="supervisor"
      />
      <Modal
        open={showModal}
        onClose={() => {
          if (!isLoading) {
            setShowModal(false);
            setIsViewMode(false);
          }
        }}
        aria-labelledby="modal-title"
        aria-describedby="modal-description"
      >
        {currentSupervisor ? (
          isViewMode ? (
            <ViewStaffModal
              staff={currentSupervisor}
              staffType="supervisor"
              setShowModal={setShowModal}
              modalStyle={modalStyle}
              adminPassword={adminPassword}
              setAdminPassword={setAdminPassword}
              passwordError={passwordError}
              isInfoVisible={isInfoVisible}
              handleAdminPasswordSubmit={handleAdminPasswordSubmit}
            />
          ) : (
            <ModalContent
              formData={formData}
              handleChange={handleChange}
              handleSubmit={handleSubmit}
              setShowModal={setShowModal}
              modalStyle={modalStyle}
              currentSupervisor={currentSupervisor}
              errors={errors}
              isLoading={isLoading}
              managers={managers}
              handleDateChange={handleDateChange}
              adminPassword={adminPassword}
              setAdminPassword={setAdminPassword}
              passwordError={passwordError}
              isInfoVisible={isAdminAuthenticated}
              handleAdminPasswordSubmit={handleAdminPasswordSubmit}
              handleImageUpload={handleImageUpload}
              imagePreview={imagePreview}
              isUploading={isUploading}
              handleDayToggle={handleDayToggle}
            />
          )
        ) : (
          <ModalContent
            formData={formData}
            handleChange={handleChange}
            handleSubmit={handleSubmit}
            setShowModal={setShowModal}
            modalStyle={modalStyle}
            errors={errors}
            isLoading={isLoading}
            managers={managers}
            handleDateChange={handleDateChange}
            handleImageUpload={handleImageUpload}
            imagePreview={imagePreview}
            isUploading={isUploading}
            currentSupervisor={null}
            isInfoVisible={true}
            handleDayToggle={handleDayToggle}
          />
        )}
      </Modal>
      <NotificationSnackbar
        notification={notification}
        onClose={closeNotification}
      />
    </div>
  );
};

export default SupervisorsManagement;
