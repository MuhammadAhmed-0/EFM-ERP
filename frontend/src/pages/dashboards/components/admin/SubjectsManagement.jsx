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

// Custom hook for responsive design
const useResponsive = () => {
  const [screenSize, setScreenSize] = useState({
    isMobile: false,
    isTablet: false,
    isDesktop: false,
    width: 0,
  });

  useEffect(() => {
    const checkScreenSize = () => {
      const width = window.innerWidth;
      setScreenSize({
        isMobile: width < 768,
        isTablet: width >= 768 && width < 1024,
        isDesktop: width >= 1024,
        width,
      });
    };

    checkScreenSize();
    window.addEventListener("resize", checkScreenSize);
    return () => window.removeEventListener("resize", checkScreenSize);
  }, []);

  return screenSize;
};

const ModalContent = ({
  formData,
  handleChange,
  handleSubmit,
  setShowModal,
  modalStyle,
  currentSubject,
  errors,
  isLoading,
}) => {
  const { isMobile, isTablet } = useResponsive();

  return (
    <Box
      sx={{
        position: "absolute",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        width: {
          xs: "95vw",
          sm: "90vw",
          md: "500px",
          lg: "550px",
          xl: "600px",
        },
        maxWidth: {
          xs: "400px",
          sm: "450px",
          md: "500px",
          lg: "550px",
          xl: "600px",
        },
        maxHeight: {
          xs: "95vh",
          sm: "90vh",
          md: "85vh",
        },
        bgcolor: "background.paper",
        borderRadius: "12px",
        boxShadow:
          "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)",
        p: {
          xs: 2,
          sm: 3,
          md: 4,
        },
        overflowY: "auto",
        "&:focus-visible": {
          outline: "none",
        },
        fontFamily:
          "'Poppins', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      }}
    >
      <Box
        sx={{
          position: "relative",
          mb: {
            xs: 2,
            sm: 2.5,
            md: 3,
          },
        }}
      >
        <Typography
          variant="h6"
          component="h2"
          sx={{
            color: "#1e293b",
            fontSize: {
              xs: "1.1rem",
              sm: "1.2rem",
              md: "1.25rem",
              lg: "1.3rem",
            },
            fontWeight: 500,
            textAlign: "center",
            lineHeight: 1.2,
            margin: 0,
            padding: "0 50px",
          }}
        >
          {currentSubject ? "Edit Subject" : "Add New Subject"}
        </Typography>
        <Button
          onClick={() => setShowModal(false)}
          sx={{
            position: "absolute",
            right: 0,
            top: "50%",
            transform: "translateY(-50%)",
            minWidth: "auto",
            p: {
              xs: 1,
              sm: 1,
            },
            color: "#64748b",
            fontSize: {
              xs: "1.5rem",
              sm: "1.5rem",
              md: "1.8rem",
            },
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
          sx={{
            mb: {
              xs: 1.5,
              sm: 2,
              md: 2.5,
            },
            "& .MuiInputBase-root": {
              fontSize: {
                xs: "0.875rem",
                sm: "0.9rem",
                md: "1rem",
              },
            },
            "& .MuiInputLabel-root": {
              fontSize: {
                xs: "0.875rem",
                sm: "0.9rem",
                md: "1rem",
              },
            },
          }}
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
          sx={{
            mb: {
              xs: 1.5,
              sm: 2,
              md: 2.5,
            },
            "& .MuiInputBase-root": {
              fontSize: {
                xs: "0.875rem",
                sm: "0.9rem",
                md: "1rem",
              },
              minHeight: {
                xs: "80px",
                sm: "100px",
                md: "120px",
              },
            },
            "& .MuiInputLabel-root": {
              fontSize: {
                xs: "0.875rem",
                sm: "0.9rem",
                md: "1rem",
              },
            },
          }}
        />

        <FormControl
          fullWidth
          margin="normal"
          size="small"
          error={!!errors.type}
          sx={{
            mb: {
              xs: 1.5,
              sm: 2,
              md: 2.5,
            },
          }}
        >
          <InputLabel
            sx={{
              fontSize: {
                xs: "0.875rem",
                sm: "0.9rem",
                md: "1rem",
              },
            }}
          >
            Type
          </InputLabel>
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
              "& .MuiSelect-select": {
                fontSize: {
                  xs: "0.875rem",
                  sm: "0.9rem",
                  md: "1rem",
                },
              },
            }}
          >
            <MenuItem value="quran">Quran</MenuItem>
            <MenuItem value="subjects">Subjects</MenuItem>
          </Select>
        </FormControl>

        <Box
          sx={{
            mt: {
              xs: 3,
              sm: 3.5,
              md: 4,
            },
            pt: {
              xs: 1.5,
              sm: 2,
            },
            display: "flex",
            justifyContent: {
              xs: "center",
              sm: "flex-end",
            },
            gap: {
              xs: 1.5,
              sm: 2,
            },
            borderTop: "1px solid #e2e8f0",
            flexDirection: {
              xs: "column",
              sm: "row",
            },
            "& button": {
              minHeight: {
                xs: "44px",
                sm: "40px",
                md: "44px",
              },
              fontSize: {
                xs: "0.875rem",
                sm: "0.9rem",
                md: "1rem",
              },
              padding: {
                xs: "12px 20px",
                sm: "10px 16px",
                md: "10px 20px",
              },
              width: {
                xs: "100%",
                sm: "auto",
              },
              textAlign: "center",
              justifyContent: "center",
              display: "flex",
              alignItems: "center",
            },
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
};

const DeleteConfirmationModal = ({
  open,
  onClose,
  subject,
  onConfirm,
  isLoading,
}) => {
  const { isMobile, isTablet } = useResponsive();

  if (!subject) return null;

  const poppinsFont =
    "'Poppins', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";

  return (
    <Modal open={open} onClose={() => !isLoading && onClose()}>
      <Box
        sx={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: {
            xs: "95vw",
            sm: "90vw",
            md: "500px",
            lg: "550px",
            xl: "600px",
          },
          maxWidth: {
            xs: "400px",
            sm: "450px",
            md: "500px",
            lg: "550px",
            xl: "600px",
          },
          maxHeight: {
            xs: "95vh",
            sm: "90vh",
            md: "85vh",
          },
          bgcolor: "background.paper",
          borderRadius: "12px",
          boxShadow:
            "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)",
          p: {
            xs: 2,
            sm: 3,
            md: 4,
          },
          overflowY: "auto",
          "&:focus-visible": {
            outline: "none",
          },
          fontFamily: poppinsFont,
          "& *": {
            fontFamily: `${poppinsFont} !important`,
          },
        }}
      >
        <Box
          sx={{
            position: "relative",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            mb: {
              xs: 2,
              sm: 2.5,
              md: 3,
            },
          }}
        >
          <Typography
            variant="h6"
            component="h2"
            sx={{
              color: "#dc2626",
              fontSize: {
                xs: "1.1rem",
                sm: "1.2rem",
                md: "1.25rem",
              },
              fontWeight: 600,
              display: "flex",
              alignItems: "center",
              gap: 1,
              textAlign: "center",
              flex: 1,
              justifyContent: "center",
            }}
          >
            <FaTrash
              color="#dc2626"
              style={{
                fontSize: isMobile ? "1rem" : "1.1rem",
              }}
            />
            Delete Subject
          </Typography>
          <Button
            onClick={() => !isLoading && onClose()}
            sx={{
              position: "absolute",
              right: 0,
              top: "50%",
              transform: "translateY(-50%)",
              minWidth: "auto",
              p: {
                xs: 1,
                sm: 1,
              },
              color: "#64748b",
              fontSize: {
                xs: "1.5rem",
                sm: "1.5rem",
                md: "1.8rem",
              },
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

        <Typography
          variant="body1"
          sx={{
            mb: {
              xs: 2,
              sm: 2.5,
              md: 3,
            },
            color: "#374151",
            fontSize: {
              xs: "0.875rem",
              sm: "0.9rem",
              md: "1rem",
            },
            textAlign: "center",
          }}
        >
          Are you sure you want to delete this subject? This action cannot be
          undone.
        </Typography>

        <Box
          sx={{
            backgroundColor: "#f9fafb",
            border: "1px solid #e5e7eb",
            borderRadius: "8px",
            p: {
              xs: 1.5,
              sm: 2,
            },
            mb: {
              xs: 2,
              sm: 2.5,
              md: 3,
            },
          }}
        >
          <Typography
            variant="body2"
            sx={{
              fontWeight: 600,
              mb: 1,
              fontSize: {
                xs: "0.8rem",
                sm: "0.875rem",
              },
            }}
          >
            Subject Details:
          </Typography>

          <Box sx={{ display: "grid", gap: 1 }}>
            <Typography
              variant="body2"
              sx={{
                fontSize: {
                  xs: "0.75rem",
                  sm: "0.8rem",
                  md: "0.875rem",
                },
              }}
            >
              <strong>Name:</strong> {subject.name}
            </Typography>
            <Typography
              variant="body2"
              sx={{
                fontSize: {
                  xs: "0.75rem",
                  sm: "0.8rem",
                  md: "0.875rem",
                },
              }}
            >
              <strong>Description:</strong> {subject.description}
            </Typography>
            <Typography
              variant="body2"
              sx={{
                fontSize: {
                  xs: "0.75rem",
                  sm: "0.8rem",
                  md: "0.875rem",
                },
              }}
            >
              <strong>Type:</strong>{" "}
              {subject.type === "quran" ? "Quran" : "Subjects"}
            </Typography>
          </Box>
        </Box>

        <Box
          sx={{
            mt: {
              xs: 3,
              sm: 3.5,
              md: 4,
            },
            pt: {
              xs: 1.5,
              sm: 2,
            },
            display: "flex",
            justifyContent: {
              xs: "center",
              sm: "flex-end",
            },
            gap: {
              xs: 1.5,
              sm: 2,
            },
            borderTop: "1px solid #e2e8f0",
            flexDirection: {
              xs: "column",
              sm: "row",
            },
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
              fontSize: {
                xs: "0.875rem",
                sm: "0.9rem",
                md: "1rem",
              },
              padding: {
                xs: "12px 20px",
                sm: "10px 16px",
                md: "10px 20px",
              },
              width: {
                xs: "100%",
                sm: "auto",
              },
              minHeight: {
                xs: "44px",
                sm: "40px",
                md: "44px",
              },
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
              fontSize: {
                xs: "0.875rem",
                sm: "0.9rem",
                md: "1rem",
              },
              padding: {
                xs: "12px 20px",
                sm: "10px 16px",
                md: "10px 20px",
              },
              width: {
                xs: "100%",
                sm: "auto",
              },
              minHeight: {
                xs: "44px",
                sm: "40px",
                md: "44px",
              },
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
                size={isMobile ? 20 : 24}
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
  const { isMobile, isTablet, isDesktop } = useResponsive();

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

          {/* Responsive Add Subject Button */}
          <button
            className="add-btn responsive-add-btn"
            onClick={handleAdd}
            title="Add Subject"
          >
            <FaPlus />
            <span className="add-btn-text">Add Subject</span>
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
              <div style={{ overflowX: "auto" }}>
                <table style={{ minWidth: isMobile ? "600px" : "auto" }}>
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
                              title="Edit Subject"
                            >
                              <FaEdit />
                            </button>
                            <button
                              onClick={() => handleDelete(subject)}
                              disabled={isDeleting}
                              title="Delete Subject"
                            >
                              <FaTrash />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
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
