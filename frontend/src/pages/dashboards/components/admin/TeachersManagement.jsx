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
import "../../../../styles/components/Management.css";
import { tableStyles } from "../../../../styles/modal/styles";
import { getModalStyles } from "../../../../styles/modal/commonModalStyles";
import InfoModal from "./infoModals/InfoModal";
import { useInfoModal } from "../../../../hooks/useInfoModal";
import ViewStaffModal from "./viewModals/ViewStaffModal";
import { uploadToCloudinary } from "../../../../utils/cloudinaryHelper";
import { styled } from "@mui/material/styles";
import useNotification from "../../../../hooks/useNotification";
import NotificationSnackbar from "../../../../components/common/NotificationSnackbar";
import SyncButton from "../../../../components/common/SyncButton";
const ROLES = [
  { value: "teacher_quran", label: "Quran Teacher" },
  { value: "teacher_subjects", label: "Subjects Teacher" },
];

const SHIFTS = ["morning", "night"];
const GENDERS = ["male", "female"];
const DAYS_OF_WEEK = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

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

const AssignManagerModal = ({
  showModal,
  setShowModal,
  teachersWithoutManagers,
  managers,
  onAssignManager,
  isLoading,
}) => {
  const [selectedTeachers, setSelectedTeachers] = useState([]);
  const [selectedManager, setSelectedManager] = useState("");
  const [isAssigning, setIsAssigning] = useState(false);

  const handleTeacherSelect = (teacherId) => {
    setSelectedTeachers((prev) =>
      prev.includes(teacherId)
        ? prev.filter((id) => id !== teacherId)
        : [...prev, teacherId]
    );
  };

  const handleSelectAll = () => {
    if (selectedTeachers.length === teachersWithoutManagers.length) {
      setSelectedTeachers([]);
    } else {
      setSelectedTeachers(
        teachersWithoutManagers.map((teacher) => teacher._id)
      );
    }
  };

  const handleAssign = async () => {
    if (selectedTeachers.length === 0 || !selectedManager) {
      return;
    }

    setIsAssigning(true);
    try {
      await onAssignManager(selectedTeachers, selectedManager);
      setSelectedTeachers([]);
      setSelectedManager("");
      setShowModal(false);
    } catch (error) {
      console.error("Error assigning manager:", error);
    } finally {
      setIsAssigning(false);
    }
  };

  const selectedManagerData = managers.find((m) => m._id === selectedManager);

  return (
    <Modal
      open={showModal}
      onClose={() => !isAssigning && setShowModal(false)}
      aria-labelledby="assign-manager-modal"
    >
      <Box
        sx={{
          ...getModalStyles(),
          width: 700,
          maxHeight: "90vh",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <Box sx={{ borderBottom: "1px solid #e2e8f0", pb: 2, mb: 3 }}>
          <Typography variant="h6" component="h2">
            Assign Manager to Teachers
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            {teachersWithoutManagers.length} teachers without managers found
          </Typography>
        </Box>

        {/* Manager Selection */}
        <Box sx={{ mb: 3 }}>
          <FormControl fullWidth size="small" required>
            <Autocomplete
              id="manager-select"
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
              value={selectedManagerData || null}
              onChange={(event, newValue) => {
                setSelectedManager(newValue ? newValue._id : "");
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Select Manager"
                  size="small"
                  required
                />
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
        </Box>

        {/* Teachers List */}
        <Box
          sx={{
            border: "1px solid #e2e8f0",
            borderRadius: "8px",
            overflow: "hidden",
            flex: 1,
            minHeight: 0,
          }}
        >
          <Box
            sx={{
              bgcolor: "#f8fafc",
              p: 2,
              borderBottom: "1px solid #e2e8f0",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <Typography variant="subtitle2" fontWeight="600">
              Teachers Without Managers ({selectedTeachers.length} selected)
            </Typography>
            <Button
              size="small"
              onClick={handleSelectAll}
              sx={{ textTransform: "none" }}
            >
              {selectedTeachers.length === teachersWithoutManagers.length
                ? "Deselect All"
                : "Select All"}
            </Button>
          </Box>

          <Box
            sx={{
              maxHeight: "300px",
              overflowY: "auto",
              p: 1,
            }}
          >
            {teachersWithoutManagers.map((teacher) => (
              <Box
                key={teacher._id}
                sx={{
                  display: "flex",
                  alignItems: "center",
                  p: 2,
                  borderRadius: "6px",
                  cursor: "pointer",
                  "&:hover": {
                    bgcolor: "#f8fafc",
                  },
                  bgcolor: selectedTeachers.includes(teacher._id)
                    ? "#e0f2fe"
                    : "transparent",
                }}
                onClick={() => handleTeacherSelect(teacher._id)}
              >
                <input
                  type="checkbox"
                  checked={selectedTeachers.includes(teacher._id)}
                  onChange={() => handleTeacherSelect(teacher._id)}
                  style={{ marginRight: "12px" }}
                />
                <Box sx={{ flex: 1 }}>
                  <Typography variant="body2" fontWeight="500">
                    {teacher.name}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Staff ID: {teacher.staffId} |{" "}
                    {teacher.role === "teacher_quran"
                      ? "Quran Teacher"
                      : "Subjects Teacher"}
                  </Typography>
                  {teacher.currentManagerName && (
                    <Typography
                      variant="caption"
                      color="error.main"
                      display="block"
                    >
                      Current Manager: {teacher.currentManagerName} (Invalid)
                    </Typography>
                  )}
                </Box>
                <Chip
                  label={teacher.department}
                  size="small"
                  color={
                    teacher.department === "quran" ? "primary" : "secondary"
                  }
                  sx={{ textTransform: "capitalize" }}
                />
              </Box>
            ))}
          </Box>
        </Box>

        {/* Action Buttons */}
        <Box
          sx={{
            display: "flex",
            justifyContent: "flex-end",
            gap: 2,
            mt: 3,
            pt: 2,
            borderTop: "1px solid #e2e8f0",
          }}
        >
          <button
            className="clear-filters-btn"
            onClick={() => setShowModal(false)}
            disabled={isAssigning}
          >
            Cancel
          </button>
          <button
            className="add-btn"
            onClick={handleAssign}
            disabled={
              selectedTeachers.length === 0 || !selectedManager || isAssigning
            }
          >
            {isAssigning ? (
              <div className="loading-spinner"></div>
            ) : (
              `Assign Manager to ${selectedTeachers.length} Teacher${
                selectedTeachers.length !== 1 ? "s" : ""
              }`
            )}
          </button>
        </Box>
      </Box>
    </Modal>
  );
};

const ModalContent = ({
  formData,
  handleChange,
  handleSubmit,
  setShowModal,
  currentTeacher,
  errors,
  isLoading,
  managers,
  subjects,
  handleExpertiseAdd,
  handleDateChange,
  handleExpertiseDelete,
  handleDayToggle,
  expertiseInput,
  setExpertiseInput,
  handleImageUpload,
  imagePreview,
  isUploading,
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
          {currentTeacher ? "Edit Teacher" : "Add New Teacher"}
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
      {currentTeacher && (
        <TextField
          fullWidth
          label="Staff ID"
          value={currentTeacher.staffId}
          margin="normal"
          size="small"
          InputProps={{ readOnly: true }}
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
        label="Phone Number"
        name="phoneNumber"
        value={formData.phoneNumber}
        onChange={handleChange}
        margin="normal"
        size="small"
        placeholder="Enter phone number"
      />
      {(!currentTeacher || currentTeacher) && (
        <TextField
          fullWidth
          label="Password"
          name="password"
          type="password"
          value={formData.password}
          onChange={handleChange}
          required={!currentTeacher}
          margin="normal"
          size="small"
          error={!!errors.password}
          helperText={
            currentTeacher
              ? "Leave blank to keep current password"
              : errors.password
          }
        />
      )}

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

      {currentTeacher ? (
        <TextField
          fullWidth
          label="Role"
          value={
            ROLES.find((r) => r.value === formData.role)?.label || formData.role
          }
          margin="normal"
          size="small"
          InputProps={{ readOnly: true }}
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
          value={formData.dateOfBirth}
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
      <TextField
        fullWidth
        label="Qualification"
        name="qualification"
        value={formData.qualification}
        onChange={handleChange}
        required
        margin="normal"
        size="small"
      />

      <Box sx={{ mb: 2 }}>
        <Typography variant="subtitle2" sx={{ mb: 1 }}>
          Expertise
        </Typography>
        <Box sx={{ display: "flex", gap: 1, mb: 1 }}>
          <TextField
            size="small"
            value={expertiseInput}
            onChange={(e) => setExpertiseInput(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleExpertiseAdd();
              }
            }}
            placeholder="Type and press Enter"
            fullWidth
          />
        </Box>
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
          {formData.expertise.map((exp, index) => (
            <Chip
              key={index}
              label={exp}
              onDelete={() => handleExpertiseDelete(index)}
              size="small"
            />
          ))}
        </Box>
      </Box>

      <FormControl fullWidth margin="normal" size="small" required>
        <Autocomplete
          id="subjects-autocomplete"
          multiple
          options={subjects}
          getOptionLabel={(option) => option.name || ""}
          value={subjects.filter((subject) =>
            formData.subjects.includes(subject._id)
          )}
          onChange={(event, newValue) => {
            handleChange({
              target: {
                name: "subjects",
                value: newValue.map((subject) => subject._id),
              },
            });
          }}
          renderInput={(params) => (
            <TextField {...params} label="Subjects" size="small" />
          )}
          renderOption={(props, option) => {
            const { key, ...restProps } = props;
            return (
              <li key={key} {...restProps}>
                {option.name}
              </li>
            );
          }}
        />
      </FormControl>
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

      <Box sx={{ display: "flex", gap: 2 }}>
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

      {currentTeacher && (
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
          ) : currentTeacher ? (
            "Update Teacher"
          ) : (
            "Add Teacher"
          )}
        </button>
      </Box>
    </form>
  </Box>
);

const TeachersManagement = () => {
  const {
    showInfoModal,
    selectedItem,
    adminPassword,
    passwordError,
    isInfoVisible,
    setAdminPassword,
    handleShowInfo,
    handleAdminPasswordSubmit,
    handleCloseInfoModal,
  } = useInfoModal();
  const [teachers, setTeachers] = useState([]);
  const [managers, setManagers] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [currentTeacher, setCurrentTeacher] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [errors, setErrors] = useState({});
  const [filteredTeachers, setFilteredTeachers] = useState([]);
  const [selectedRole, setSelectedRole] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [isViewMode, setIsViewMode] = useState(false);
  const [imagePreview, setImagePreview] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [showAssignManagerModal, setShowAssignManagerModal] = useState(false);
  const [teachersWithoutManagers, setTeachersWithoutManagers] = useState([]);
  const [teachersWithoutManagersCount, setTeachersWithoutManagersCount] =
    useState(0);
  const [
    isLoadingTeachersWithoutManagers,
    setIsLoadingTeachersWithoutManagers,
  ] = useState(false);
  const [expertiseInput, setExpertiseInput] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    profilePicture: "",
    gender: "male",
    role: "teacher_quran",
    phoneNumber: "",
    fatherName: "",
    qualification: "",
    expertise: [],
    subjects: [],
    manager: "",
    salary: "",
    shift: "morning",
    cnicNumber: "",
    religion: "",
    availability: {
      days: [],
      startTime: "",
      endTime: "",
    },
    isActive: true,
  });
  const { notification, showNotification, closeNotification } =
    useNotification();

  const BASE_URL = import.meta.env.VITE_BASE_URL;

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    }
    fetchTeachers();
    fetchManagers();
    fetchSubjects();
    fetchTeachersWithoutManagers();
  }, []);

  const fetchTeachers = async (showSuccessMessage = false) => {
    setIsSyncing(true);
    setIsLoading(true);
    try {
      const [quranTeachers, subjectsTeachers] = await Promise.all([
        axios.get(`${BASE_URL}/api/admin/users/teacher_quran`),
        axios.get(`${BASE_URL}/api/admin/users/teacher_subjects`),
      ]);
      const allTeachers = [
        ...quranTeachers.data.users,
        ...subjectsTeachers.data.users,
      ];

      setTeachers(allTeachers);
      setFilteredTeachers(allTeachers);
      if (showSuccessMessage) {
        showNotification("Teachers refreshed successfully");
      }
    } catch (error) {
      console.error("Error fetching teachers:", error);
      showNotification(
        error.response?.data?.message || "Error fetching teachers",
        "error"
      );
    } finally {
      setIsSyncing(false);
      setIsLoading(false);
    }
  };

  const fetchTeachersWithoutManagers = async () => {
    setIsLoadingTeachersWithoutManagers(true);
    try {
      const response = await axios.get(
        `${BASE_URL}/api/admin/without-managers`
      );
      if (response.data.success) {
        setTeachersWithoutManagers(response.data.data.teachers);
        setTeachersWithoutManagersCount(response.data.data.totalCount);
      }
    } catch (error) {
      console.error("Error fetching teachers without managers:", error);
      showNotification(
        error.response?.data?.message ||
          "Error fetching teachers without managers",
        "error"
      );
    } finally {
      setIsLoadingTeachersWithoutManagers(false);
    }
  };

  const handleAssignManager = async (teacherIds, managerId) => {
    try {
      const selectedManager = managers.find((m) => m._id === managerId);
      const response = await axios.put(`${BASE_URL}/api/admin/assign-manager`, {
        teacherIds,
        managerId,
        managerName: selectedManager?.name,
      });

      if (response.data.success) {
        showNotification(
          `Successfully assigned manager to ${response.data.data.teachersUpdated} teacher(s)`,
          "success"
        );

        await Promise.all([fetchTeachers(), fetchTeachersWithoutManagers()]);
      }
    } catch (error) {
      console.error("Error assigning manager:", error);
      showNotification(
        error.response?.data?.message || "Error assigning manager",
        "error"
      );
      throw error; // Re-throw to handle in modal
    }
  };
  const handleShowAssignManagerModal = async () => {
    await fetchTeachersWithoutManagers();
    setShowAssignManagerModal(true);
  };

  const fetchManagers = async () => {
    try {
      const response = await axios.get(`${BASE_URL}/api/admin/users`);
      const eligibleManagers = response.data.users.filter(
        (user) =>
          (user.role === "admin" ||
            user.role === "supervisor_quran" ||
            user.role === "supervisor_subjects") &&
          user.isActive === true
      );
      setManagers(eligibleManagers);
    } catch (error) {
      console.error("Error fetching managers:", error);
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

  const fetchSubjects = async () => {
    try {
      const response = await axios.get(`${BASE_URL}/api/subjects/view`);
      setSubjects(response.data.subjects);
    } catch (error) {
      console.error("Error fetching subjects:", error);
    }
  };

  const handleDateChange = (date, field) => {
    setFormData((prev) => ({
      ...prev,
      [field]: date,
    }));
  };

  const handleExpertiseAdd = () => {
    if (expertiseInput.trim()) {
      setFormData((prev) => ({
        ...prev,
        expertise: [...prev.expertise, expertiseInput.trim()],
      }));
      setExpertiseInput("");
    }
  };

  const handleExpertiseDelete = (index) => {
    setFormData((prev) => ({
      ...prev,
      expertise: prev.expertise.filter((_, i) => i !== index),
    }));
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

  const validateForm = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = "Name is required";
    if (!formData.email.trim()) newErrors.email = "Email is required";
    if (!currentTeacher && !formData.password.trim()) {
      newErrors.password = "Password is required for new teachers";
    }
    if (!formData.dateOfBirth)
      newErrors.dateOfBirth = "Date of birth is required";
    if (formData.password && formData.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }
    if (!formData.manager) newErrors.manager = "Manager is required";
    if (!formData.salary) newErrors.salary = "Salary is required";
    if (!formData.cnicNumber) newErrors.cnicNumber = "CNIC number is required";
    if (formData.cnicNumber && formData.cnicNumber.toString().length !== 13) {
      newErrors.cnicNumber = "CNIC must be 13 digits";
    }

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
    setCurrentTeacher(null);
    setFormData({
      name: "",
      profilePicture: "",
      email: "",
      password: "",
      gender: "male",
      role: "teacher_quran",
      phoneNumber: "",
      fatherName: "",
      qualification: "",
      expertise: [],
      subjects: [],
      manager: "",
      salary: "",
      shift: "morning",
      cnicNumber: "",
      religion: "",
      availability: {
        days: [],
        startTime: "",
        endTime: "",
      },
      isActive: true,
    });
    setImagePreview("");
    setErrors({});
    setShowModal(true);
  };

  const handleEdit = (teacher) => {
    setIsViewMode(false);
    setCurrentTeacher({
      ...teacher,
      staffId: teacher.staffId,
    });
    const dateOfBirth = teacher.profile?.dateOfBirth
      ? new Date(teacher.profile.dateOfBirth)
      : null;
    setFormData({
      name: teacher.name,
      profilePicture: teacher.profilePicture || "",
      email: teacher.email,
      password: "",
      gender: teacher.gender,
      role: teacher.role,
      phoneNumber: teacher.phoneNumber || "",
      fatherName: teacher.profile?.fatherName || "",
      qualification: teacher.profile?.qualification || "",
      expertise: teacher.profile?.expertise || [],
      subjects: teacher.profile?.subjects?.map((s) => s._id) || [],
      manager: teacher.profile?.manager?._id || "",
      salary: teacher.profile?.salary || "",
      shift: teacher.profile?.shift || "morning",
      cnicNumber: teacher.profile?.cnicNumber || "",
      religion: teacher.profile?.religion || "",
      dateOfBirth: dateOfBirth,
      availability: {
        days: teacher.profile?.availability?.days || [],
        startTime: teacher.profile?.availability?.startTime || "",
        endTime: teacher.profile?.availability?.endTime || "",
      },
      isActive: teacher.isActive,
    });
    setImagePreview(teacher.profilePicture || "");
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
        subjects: formData.subjects,
        manager: formData.manager,
        phoneNumber: formData.phoneNumber,
        profilePicture: formData.profilePicture || "",
      };

      if (currentTeacher) {
        const { role, staffId, ...updateData } = submissionData;

        await axios.put(
          `${BASE_URL}/api/admin/users/${currentTeacher._id}`,
          updateData
        );
        showNotification("Teacher updated successfully");
      } else {
        await axios.post(`${BASE_URL}/api/admin/users`, submissionData);
        showNotification("Teacher added successfully");
      }

      await fetchTeachers();
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

  const handleStatusToggle = async (teacher) => {
    const newStatus = !teacher.isActive;
    const action = newStatus ? "activate" : "deactivate";

    try {
      setIsLoading(true);

      const response = await axios.put(
        `${BASE_URL}/api/admin/teachers/${teacher._id}/toggle-status`,
        {
          isActive: newStatus,
          reason: `Teacher ${action}d by admin via management interface`,
        }
      );

      if (response.data.success) {
        const { data } = response.data;

        showNotification(
          `Teacher ${teacher.name} ${action}d successfully. ${data.scheduleUpdates.schedulesUpdated} schedules updated.`,
          "success"
        );

        await fetchTeachers();
      }
    } catch (error) {
      console.error("Error toggling teacher status:", error);

      if (error.response?.status === 400) {
        showNotification(
          error.response.data.msg || "Invalid request parameters",
          "error"
        );
      } else if (error.response?.status === 403) {
        showNotification("Access denied. Admin permissions required.", "error");
      } else if (error.response?.status === 404) {
        showNotification("Teacher not found", "error");
      } else {
        showNotification(
          error.response?.data?.msg || "Error updating teacher status",
          "error"
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  const updateFilteredTeachers = useCallback(() => {
    let filtered = [...teachers];

    if (searchTerm) {
      const hasNumbers = /\d/.test(searchTerm);
      const searchTermLower = searchTerm.toLowerCase().trim();
      const searchNumeric = hasNumbers ? searchTerm.replace(/\D/g, "") : "";

      filtered = filtered.filter((teacher) => {
        const nameMatch = teacher.name?.toLowerCase().includes(searchTermLower);
        const emailMatch = teacher.email
          ?.toLowerCase()
          .includes(searchTermLower);
        const staffIdMatch = hasNumbers
          ? String(teacher.staffId || "").includes(searchNumeric)
          : false;

        return nameMatch || emailMatch || staffIdMatch;
      });
    }

    if (selectedRole !== "all") {
      filtered = filtered.filter((teacher) => teacher.role === selectedRole);
    }

    if (selectedStatus !== "all") {
      filtered = filtered.filter((teacher) => {
        if (selectedStatus === "active") {
          return teacher.isActive === true;
        } else if (selectedStatus === "inactive") {
          return teacher.isActive === false;
        }
        return true;
      });
    }

    setFilteredTeachers(filtered);
  }, [teachers, searchTerm, selectedRole, selectedStatus]);

  useEffect(() => {
    updateFilteredTeachers();
  }, [
    teachers,
    searchTerm,
    selectedRole,
    selectedStatus,
    updateFilteredTeachers,
  ]);

  return (
    <div className="management-container">
      <div className="management-header">
        <div>
          <h2>Teachers Management</h2>
          <p className="total-count">
            {filteredTeachers.length} Total Teachers
          </p>
        </div>

        <div className="header-buttons">
          <SyncButton
            isSyncing={isSyncing}
            onClick={() => fetchTeachers(true)}
          />
          <button className="add-btn" onClick={handleAdd}>
            <FaPlus /> Add Teacher
          </button>
          <button
            type="button"
            className={`add-btn ${
              teachersWithoutManagersCount > 0 ? "has-unassigned" : ""
            }`}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleShowAssignManagerModal();
            }}
            disabled={
              isLoadingTeachersWithoutManagers ||
              teachersWithoutManagersCount === 0
            }
            title={`${teachersWithoutManagersCount} teachers need manager assignment`}
          >
            {isLoadingTeachersWithoutManagers ? (
              <CircularProgress size={16} sx={{ color: "white" }} />
            ) : (
              <>
                <FaFilter />
                Teachers Without Manager ({teachersWithoutManagersCount})
              </>
            )}
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
            <MenuItem value="all">All Teachers</MenuItem>
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
            <MenuItem value="active">Active Teachers</MenuItem>
            <MenuItem value="inactive">Inactive Teachers</MenuItem>
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
        ) : filteredTeachers.length > 0 ? (
          <table>
            <thead>
              <tr>
                <th>Staff ID</th>
                <th>Name & Details</th>
                <th>Email & Contact</th>
                <th>Role & Subjects</th>
                <th>Manager</th>
                <th>Status & Shift</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredTeachers.map((teacher) => (
                <tr key={teacher._id}>
                  <td>
                    <div style={{ fontWeight: "500" }}>{teacher.staffId}</div>
                    <div style={{ color: "#64748b", fontSize: "0.8125rem" }}>
                      Since: {format(new Date(teacher.createdAt), "yyyy-MM-dd")}
                    </div>
                  </td>
                  <td>
                    <div style={{ fontWeight: "500" }}>{teacher.name}</div>
                    <div style={{ color: "#64748b", fontSize: "0.8125rem" }}>
                      {teacher.profile?.fatherName || "N/A"}
                    </div>
                  </td>
                  <td>
                    <div style={tableStyles.buttonContainer}>
                      <Button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleShowInfo(teacher, "contact");
                        }}
                        sx={tableStyles.viewButton}
                      >
                        View
                      </Button>
                    </div>
                  </td>
                  <td>
                    <div>
                      {teacher.role === "teacher_quran"
                        ? "Quran Teacher"
                        : "Subjects Teacher"}
                    </div>
                    <div style={{ color: "#64748b", fontSize: "0.8125rem" }}>
                      {teacher.profile?.subjects
                        ?.map((s) => s.name)
                        .join(", ") || "No subjects"}
                    </div>
                  </td>
                  <td>
                    <div style={{ fontWeight: "500" }}>
                      {teacher.profile?.managerName || "N/A"}
                    </div>
                    <div style={{ color: "#64748b", fontSize: "0.8125rem" }}>
                      {teacher.profile?.manager?.role === "admin"
                        ? "Admin"
                        : teacher.profile?.manager?.role === "supervisor_quran"
                        ? "Quran Supervisor"
                        : teacher.profile?.manager?.role ===
                          "supervisor_subjects"
                        ? "Subjects Supervisor"
                        : "N/A"}
                    </div>
                  </td>
                  <td>
                    <div style={{ textAlign: "center" }}>
                      <span
                        className={`status-tag ${
                          teacher.isActive ? "active" : "inactive"
                        }`}
                      >
                        {teacher.isActive ? "Active" : "Inactive"}
                      </span>
                    </div>
                    <div
                      style={{
                        color: "#64748b",
                        fontSize: "0.8125rem",
                        textAlign: "center",
                      }}
                    >
                      {teacher.profile?.shift || "N/A"}
                    </div>
                  </td>
                  <td>
                    <div className="actions">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setIsViewMode(true);
                          setCurrentTeacher(teacher);
                          setShowModal(true);
                        }}
                      >
                        <FaEye />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleStatusToggle(teacher);
                        }}
                        className={`action-btn toggle-btn ${
                          teacher.isActive ? "toggle-active" : "toggle-inactive"
                        }`}
                        disabled={isLoading}
                        title={`${
                          teacher.isActive ? "Deactivate" : "Activate"
                        } teacher ${teacher.name}`}
                      >
                        {isLoading ? (
                          <CircularProgress
                            size={16}
                            sx={{ color: "inherit" }}
                          />
                        ) : teacher.isActive ? (
                          <FaToggleOn />
                        ) : (
                          <FaToggleOff />
                        )}
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEdit(teacher);
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
                ? "No teachers found matching your search criteria"
                : "No teachers found"}
            </p>
          </div>
        )}
      </div>
      <AssignManagerModal
        showModal={showAssignManagerModal}
        setShowModal={setShowAssignManagerModal}
        teachersWithoutManagers={teachersWithoutManagers}
        managers={managers}
        onAssignManager={handleAssignManager}
        isLoading={isLoadingTeachersWithoutManagers}
      />

      <InfoModal
        open={showInfoModal}
        onClose={handleCloseInfoModal}
        selectedItem={selectedItem}
        adminPassword={adminPassword}
        setAdminPassword={setAdminPassword}
        passwordError={passwordError}
        isInfoVisible={isInfoVisible}
        handleAdminPasswordSubmit={handleAdminPasswordSubmit}
        type="teacher"
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
        {currentTeacher ? (
          isViewMode ? (
            <ViewStaffModal
              staff={currentTeacher}
              staffType="teacher"
              setShowModal={setShowModal}
              modalStyle={{
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
              }}
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
              currentTeacher={currentTeacher}
              errors={errors}
              isLoading={isLoading}
              managers={managers}
              subjects={subjects}
              handleExpertiseAdd={handleExpertiseAdd}
              handleExpertiseDelete={handleExpertiseDelete}
              handleDayToggle={handleDayToggle}
              expertiseInput={expertiseInput}
              handleDateChange={handleDateChange}
              setExpertiseInput={setExpertiseInput}
              handleImageUpload={handleImageUpload}
              imagePreview={imagePreview}
              isUploading={isUploading}
            />
          )
        ) : (
          <ModalContent
            formData={formData}
            handleChange={handleChange}
            handleSubmit={handleSubmit}
            setShowModal={setShowModal}
            errors={errors}
            isLoading={isLoading}
            managers={managers}
            subjects={subjects}
            handleExpertiseAdd={handleExpertiseAdd}
            handleExpertiseDelete={handleExpertiseDelete}
            handleDayToggle={handleDayToggle}
            expertiseInput={expertiseInput}
            handleDateChange={handleDateChange}
            setExpertiseInput={setExpertiseInput}
            handleImageUpload={handleImageUpload}
            imagePreview={imagePreview}
            isUploading={isUploading}
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

export default TeachersManagement;
