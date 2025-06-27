import { useState, useEffect } from "react";
import { FaEdit, FaTrash, FaSearch, FaPlus } from "react-icons/fa";
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
} from "@mui/material";
import axios from "axios";
import "../../../../styles/components/Management.css";
import useNotification from "../../../../hooks/useNotification";
import NotificationSnackbar from "../../../../components/common/NotificationSnackbar";
import SyncButton from "../../../../components/common/SyncButton";
import { getModalStyles } from "../../../../styles/modal/commonModalStyles";
const ModalContent = ({
  formData,
  handleChange,
  handleSubmit,
  setShowModal,
  modalStyle,
  currentSubject,
  errors,
  isLoading,
}) => (
  <Box sx={getModalStyles()}>
    <Box
      sx={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        mb: 3,
      }}
    >
      <Typography
        variant="h6"
        component="h2"
        sx={{
          color: "#1e293b",
          fontSize: "1.25rem",
          fontWeight: 500,
        }}
      >
        {currentSubject ? "Edit Subject" : "Add New Subject"}
      </Typography>
      <Button
        onClick={() => setShowModal(false)}
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

    <form onSubmit={handleSubmit}>
      <TextField
        fullWidth
        label="Subject Name"
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
        label="Description"
        name="description"
        value={formData.description}
        onChange={handleChange}
        required
        margin="normal"
        size="small"
        multiline
        rows={3}
        error={!!errors.description}
        helperText={errors.description}
      />

      <FormControl fullWidth margin="normal" size="small" error={!!errors.type}>
        <InputLabel>Type</InputLabel>
        <Select
          value={formData.type}
          label="Type"
          name="type"
          onChange={handleChange}
          required
          sx={{
            "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
              borderColor: "#3949ab",
            },
          }}
        >
          <MenuItem value="quran">Quran</MenuItem>
          <MenuItem value="subjects">Subjects</MenuItem>
        </Select>
      </FormControl>

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
          ) : currentSubject ? (
            "Update Subject"
          ) : (
            "Add Subject"
          )}
        </button>
      </Box>
    </form>
  </Box>
);
const DeleteConfirmationModal = ({
  open,
  onClose,
  subject,
  onConfirm,
  isLoading,
}) => {
  if (!subject) return null;

  const poppinsFont =
    "'Poppins', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";

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
    fontFamily: poppinsFont,
  };

  return (
    <Modal open={open} onClose={() => !isLoading && onClose()}>
      <Box
        sx={{
          ...modalStyle,
          fontFamily: poppinsFont,
          "& *": {
            fontFamily: `${poppinsFont} !important`,
          },
        }}
      >
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mb: 3,
          }}
        >
          <Typography
            variant="h6"
            component="h2"
            sx={{
              color: "#dc2626",
              fontSize: "1.25rem",
              fontWeight: 600,
              display: "flex",
              alignItems: "center",
              gap: 1,
            }}
          >
            <FaTrash color="#dc2626" />
            Delete Subject
          </Typography>
          <Button
            onClick={() => !isLoading && onClose()}
            sx={{
              minWidth: "auto",
              p: 1,
              color: "#64748b",
              "&:hover": {
                bgcolor: "#f1f5f9",
                color: "#dc2626",
              },
            }}
            disabled={isLoading}
          >
            ×
          </Button>
        </Box>

        <Typography variant="body1" sx={{ mb: 3, color: "#374151" }}>
          Are you sure you want to delete this subject? This action cannot be
          undone.
        </Typography>

        <Box
          sx={{
            backgroundColor: "#f9fafb",
            border: "1px solid #e5e7eb",
            borderRadius: "8px",
            p: 2,
            mb: 3,
          }}
        >
          <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
            Subject Details:
          </Typography>

          <Box sx={{ display: "grid", gap: 1 }}>
            <Typography variant="body2">
              <strong>Name:</strong> {subject.name}
            </Typography>
            <Typography variant="body2">
              <strong>Description:</strong> {subject.description}
            </Typography>
            <Typography variant="body2">
              <strong>Type:</strong>{" "}
              {subject.type === "quran" ? "Quran" : "Subjects"}
            </Typography>
          </Box>
        </Box>

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
          <Button
            variant="outlined"
            onClick={onClose}
            disabled={isLoading}
            sx={{
              textTransform: "none",
              borderColor: "#e2e8f0",
              color: "#64748b",
              "&:hover": {
                borderColor: "#d1d5db",
                bgcolor: "transparent",
                color: "#6b7280",
              },
            }}
          >
            Cancel
          </Button>

          <Button
            variant="contained"
            onClick={onConfirm}
            disabled={isLoading}
            sx={{
              bgcolor: "#dc2626",
              color: "white",
              textTransform: "none",
              "&:hover": {
                bgcolor: "#b91c1c",
              },
              "&.Mui-disabled": {
                bgcolor: "#fca5a5",
                color: "white",
              },
            }}
          >
            {isLoading ? (
              <CircularProgress
                size={24}
                sx={{
                  color: "white",
                  "& .MuiCircularProgress-circle": {
                    strokeLinecap: "round",
                  },
                }}
              />
            ) : (
              "Delete Subject"
            )}
          </Button>
        </Box>
      </Box>
    </Modal>
  );
};

const SubjectsManagement = () => {
  const [subjects, setSubjects] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [currentSubject, setCurrentSubject] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [isSyncing, setIsSyncing] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [subjectToDelete, setSubjectToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    type: "subjects",
  });
  const { notification, showNotification, closeNotification } =
    useNotification();

  const BASE_URL = import.meta.env.VITE_BASE_URL;

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    }
  }, []);

  useEffect(() => {
    fetchSubjects();
  }, []);

  const fetchSubjects = async (showSuccessMessage = false) => {
    setIsSyncing(true);
    setIsLoading(true);
    try {
      const response = await axios.get(`${BASE_URL}/api/subjects/view`);
      const subjectsData = response.data.subjects || response.data;
      setSubjects(Array.isArray(subjectsData) ? subjectsData : []);
      if (showSuccessMessage) {
        showNotification("Subjects refreshed successfully");
      }
    } catch (error) {
      console.error("Error fetching subjects:", error);
      showNotification(
        error.response?.data?.message || "Error fetching subjects",
        "error"
      );
      setSubjects([]);
    } finally {
      setIsSyncing(false);
      setIsLoading(false);
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.name.trim()) {
      newErrors.name = "Subject name is required";
    }
    if (!formData.description.trim()) {
      newErrors.description = "Description is required";
    }
    if (!formData.type) {
      newErrors.type = "Type is required";
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
    setCurrentSubject(null);
    setFormData({
      name: "",
      description: "",
      type: "subjects",
    });
    setErrors({});
    setShowModal(true);
  };

  const handleEdit = (subject) => {
    setCurrentSubject(subject);
    setFormData({
      name: subject.name,
      description: subject.description,
      type: subject.type,
    });
    setErrors({});
    setShowModal(true);
  };

  const handleDelete = (subject) => {
    setSubjectToDelete(subject);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!subjectToDelete) return;

    try {
      setIsDeleting(true);

      await axios.delete(
        `${BASE_URL}/api/subjects/delete/${subjectToDelete._id}`
      );

      showNotification("Subject deleted successfully");
      fetchSubjects();
      setShowDeleteModal(false);
      setSubjectToDelete(null);
    } catch (error) {
      showNotification(
        error.response?.data?.message || "Error deleting subject",
        "error"
      );
    } finally {
      setIsDeleting(false);
    }
  };

  const closeDeleteModal = () => {
    if (!isDeleting) {
      setShowDeleteModal(false);
      setSubjectToDelete(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      const submissionData = {
        name: formData.name,
        description: formData.description,
        type: formData.type,
      };

      if (currentSubject) {
        await axios.put(
          `${BASE_URL}/api/subjects/update/${currentSubject._id}`,
          submissionData
        );
        showNotification("Subject updated successfully");
      } else {
        await axios.post(`${BASE_URL}/api/subjects/add`, submissionData);
        showNotification("Subject added successfully");
      }
      await fetchSubjects();
      setShowModal(false);
    } catch (error) {
      console.error("Error details:", error.response?.data);
      showNotification(
        error.response?.data?.msg || "Error saving subject",
        "error"
      );
    } finally {
      setIsLoading(false);
    }
  };

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
          <h2>Subjects Management</h2>
          <p className="total-count">{subjects.length} Total Subjects</p>
        </div>
        <div className="header-buttons">
          <SyncButton
            isSyncing={isSyncing}
            onClick={() => fetchSubjects(true)}
          />
          <button className="add-btn" onClick={handleAdd}>
            <FaPlus /> Add Subject
          </button>
        </div>
      </div>

      <div className="search-container">
        <div className="search-box">
          <FaSearch className="search-icon" />
          <input
            type="text"
            placeholder="Search subjects..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>
      <div className="table-container">
        {isLoading && !showModal ? (
          <div className="loading-container">
            <CircularProgress />
          </div>
        ) : subjects.length > 0 ? (
          (() => {
            const filteredSubjects = subjects.filter((subject) =>
              subject.name?.toLowerCase().includes(searchTerm.toLowerCase())
            );

            return filteredSubjects.length > 0 ? (
              <table>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Description</th>
                    <th>Type</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSubjects.map((subject) => (
                    <tr key={subject._id}>
                      <td style={{ fontWeight: "500" }}>{subject.name}</td>
                      <td>{subject.description}</td>
                      <td>
                        <span
                          className={`type-tag ${subject.type?.toLowerCase()}`}
                        >
                          {subject.type === "quran"
                            ? "Quran"
                            : subject.type === "subjects"
                            ? "Subjects"
                            : subject.type?.charAt(0).toUpperCase() +
                              subject.type?.slice(1)}
                        </span>
                      </td>
                      <td>
                        <div className="actions">
                          <button
                            onClick={() => handleEdit(subject)}
                            disabled={isDeleting}
                          >
                            <FaEdit />
                          </button>
                          <button
                            onClick={() => handleDelete(subject)}
                            disabled={isDeleting}
                          >
                            <FaTrash />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="no-data">
                <p>No subjects found matching your search</p>
              </div>
            );
          })()
        ) : (
          <div className="no-data">
            <p>No subjects found</p>
          </div>
        )}
      </div>
      <DeleteConfirmationModal
        open={showDeleteModal}
        onClose={closeDeleteModal}
        subject={subjectToDelete}
        onConfirm={confirmDelete}
        isLoading={isDeleting}
      />

      <Modal
        open={showModal}
        onClose={() => !isLoading && setShowModal(false)}
        aria-labelledby="modal-title"
        disableEnforceFocus
        disableAutoFocus
      >
        <ModalContent
          formData={formData}
          handleChange={handleChange}
          handleSubmit={handleSubmit}
          setShowModal={setShowModal}
          modalStyle={modalStyle}
          currentSubject={currentSubject}
          errors={errors}
          isLoading={isLoading}
        />
      </Modal>
      <NotificationSnackbar
        notification={notification}
        onClose={closeNotification}
      />
    </div>
  );
};

export default SubjectsManagement;
