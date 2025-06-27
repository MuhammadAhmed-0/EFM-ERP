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
  Chip,
  OutlinedInput,
  CircularProgress,
  Avatar,
  Tooltip,
} from "@mui/material";
import axios from "axios";
import "../../../../styles/components/Management.css";
import { getModalStyles } from "../../../../styles/modal/commonModalStyles";
import { io } from "socket.io-client";
import useNotification from "../../../../hooks/useNotification";
import NotificationSnackbar from "../../../../components/common/NotificationSnackbar";
import SyncButton from "../../../../components/common/SyncButton";
const RECIPIENT_OPTIONS = [
  { value: "all", label: "All" },
  { value: "client", label: "Client" },
  { value: "teacher_quran", label: "Quran Teacher" },
  { value: "teacher_subjects", label: "Subject Teacher" },
  { value: "supervisor_quran", label: "Quran Supervisor" },
  { value: "supervisor_subjects", label: "Subject Supervisor" },
];

const ModalContent = ({
  formData,
  handleChange,
  handleSubmit,
  setShowModal,
  modalStyle,
  currentAnnouncement,
  isLoading,
  errors,
}) => {
  const handleRecipientChange = (event) => {
    const {
      target: { value },
    } = event;

    if (value.includes("all")) {
      handleChange({
        target: {
          name: "recipients",
          value: ["all"],
        },
      });
      return;
    }

    const newValue = value.filter((v) => v !== "all");
    handleChange({
      target: {
        name: "recipients",
        value: newValue,
      },
    });
  };

  return (
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
          {currentAnnouncement ? "Edit Announcement" : "Add New Announcement"}
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
          label="Title"
          name="title"
          value={formData.title}
          onChange={handleChange}
          required
          margin="normal"
          size="small"
          error={!!errors.title}
          helperText={errors.title}
        />

        <TextField
          fullWidth
          label="Content"
          name="content"
          value={formData.content}
          onChange={handleChange}
          required
          margin="normal"
          size="small"
          multiline
          rows={4}
          error={!!errors.content}
          helperText={errors.content}
        />

        <FormControl
          fullWidth
          margin="normal"
          size="small"
          error={!!errors.recipients}
        >
          <InputLabel>Recipients</InputLabel>
          <Select
            multiple
            value={formData.recipients}
            onChange={handleRecipientChange}
            input={<OutlinedInput label="Recipients" />}
            renderValue={(selected) => (
              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                {selected.map((value) => (
                  <Chip
                    key={value}
                    label={
                      RECIPIENT_OPTIONS.find((option) => option.value === value)
                        ?.label
                    }
                    size="small"
                  />
                ))}
              </Box>
            )}
          >
            {RECIPIENT_OPTIONS.map((option) => (
              <MenuItem
                key={option.value}
                value={option.value}
                disabled={
                  formData.recipients.includes("all") && option.value !== "all"
                }
              >
                {option.label}
              </MenuItem>
            ))}
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
            ) : currentAnnouncement ? (
              "Update Announcement"
            ) : (
              "Add Announcement"
            )}
          </button>
        </Box>
      </form>
    </Box>
  );
};

const getAvatarColor = (name) => {
  const colors = [
    "#1e3a5c",
    "#2E7D32",
    "#C62828",
    "#7B1FA2",
    "#F57C00",
    "#0277BD",
  ];

  if (!name) return colors[0];

  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }

  return colors[Math.abs(hash) % colors.length];
};
const AnnouncementManagement = () => {
  const [announcements, setAnnouncements] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [currentAnnouncement, setCurrentAnnouncement] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [errors, setErrors] = useState({});
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);
  const [socket, setSocket] = useState(null);
  const { notification, showNotification, closeNotification } =
    useNotification();

  const [formData, setFormData] = useState({
    title: "",
    content: "",
    recipients: [],
  });
  const BASE_URL = import.meta.env.VITE_BASE_URL;

  useEffect(() => {
    if (!hasLoadedOnce) {
      fetchAnnouncements(true);
      setHasLoadedOnce(true);
    }
  }, [hasLoadedOnce]);

  const formatDBDateTime = (dateString) => {
    if (!dateString) return "";

    try {
      const date = new Date(dateString);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");

      let hours = date.getHours();
      const ampm = hours >= 12 ? "PM" : "AM";
      hours = hours % 12;
      hours = hours ? hours : 12;
      hours = String(hours).padStart(2, "0");

      const minutes = String(date.getMinutes()).padStart(2, "0");
      const seconds = String(date.getSeconds()).padStart(2, "0");

      return `${year}-${month}-${day} ${hours}:${minutes}:${seconds} ${ampm}`;
    } catch (error) {
      console.error("Date formatting error:", error);
      return dateString;
    }
  };

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    }
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const newSocket = io(BASE_URL, {
      auth: { token },
    });

    newSocket.on("connect", () => {
      console.log("Connected to socket server");
    });

    newSocket.on("announcement_read", (data) => {
      console.log("Received announcement_read event:", data);
      setAnnouncements((prevAnnouncements) => {
        return prevAnnouncements.map((announcement) => {
          if (announcement._id === data.announcementId) {
            return {
              ...announcement,
              readBy: [
                ...(announcement.readBy || []),
                {
                  user: data.userId,
                  readAt: data.readAt,
                },
              ],
            };
          }
          return announcement;
        });
      });
    });

    setSocket(newSocket);

    return () => {
      if (newSocket) {
        console.log("Closing socket connection");
        newSocket.close();
      }
    };
  }, []);

  useEffect(() => {
    fetchAnnouncements(true);
  }, []);

  const fetchAnnouncements = async (showSuccessMessage = false) => {
    setIsSyncing(true);
    try {
      const response = await axios.get(`${BASE_URL}/api/announcements/view`);
      const announcementsData = response.data.announcements || response.data;
      setAnnouncements(
        Array.isArray(announcementsData) ? announcementsData : []
      );
      if (showSuccessMessage) {
        showNotification("Announcements refreshed successfully");
      }
    } catch (error) {
      console.error("Error fetching announcements:", error);
      showNotification(
        error.response?.data?.message || "Error fetching announcements",
        "error"
      );
      setAnnouncements([]);
    } finally {
      setIsSyncing(false);
    }
  };

  const renderReadByTooltip = (readBy) => {
    if (!readBy || readBy.length === 0) return "No readers yet";

    return readBy
      .map(
        (reader) => `${reader.user.name} - ${formatDBDateTime(reader.readAt)}`
      )
      .join("\n");
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.title.trim()) {
      newErrors.title = "Title is required";
    }
    if (!formData.content.trim()) {
      newErrors.content = "Content is required";
    }
    if (!formData.recipients.length) {
      newErrors.recipients = "At least one recipient is required";
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
    setCurrentAnnouncement(null);
    setFormData({
      title: "",
      content: "",
      recipients: [],
    });
    setErrors({});
    setShowModal(true);
  };

  const handleEdit = (announcement) => {
    setCurrentAnnouncement(announcement);
    setFormData({
      title: announcement.title,
      content: announcement.content,
      recipients: announcement.recipients?.role || [],
    });
    setErrors({});
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this announcement?")) {
      try {
        await axios.delete(`${BASE_URL}/api/announcements/delete/${id}`);
        showNotification("Announcement deleted successfully");
        await fetchAnnouncements();
      } catch (error) {
        showNotification(
          error.response?.data?.message || "Error deleting announcement",
          "error"
        );
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      const submissionData = {
        title: formData.title,
        content: formData.content,
        recipients: {
          role: formData.recipients,
        },
      };

      if (currentAnnouncement) {
        await axios.put(
          `${BASE_URL}/api/announcements/update/${currentAnnouncement._id}`,
          submissionData
        );
        showNotification("Announcement updated successfully");
      } else {
        await axios.post(`${BASE_URL}/api/announcements/add`, submissionData);
        showNotification("Announcement added successfully");
      }
      await fetchAnnouncements();
      setShowModal(false);
    } catch (error) {
      console.error("Error details:", error.response?.data);
      showNotification(
        error.response?.data?.msg || "Error saving announcement",
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
          <h2>Announcements Management</h2>
          <p className="total-count">
            {announcements.length} Total Announcements
          </p>
        </div>
        <div className="header-buttons">
          <SyncButton
            isSyncing={isSyncing}
            onClick={() => fetchAnnouncements(true)}
          />

          <button className="add-btn" onClick={handleAdd}>
            <FaPlus /> Add Announcement
          </button>
        </div>
      </div>

      <div className="search-container">
        <div className="search-box">
          <FaSearch className="search-icon" />
          <input
            type="text"
            placeholder="Search announcements..."
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
        ) : announcements.length === 0 ? (
          <div className="no-data">
            <p>No announcements found</p>
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Title</th>
                <th>Content</th>
                <th>Recipients</th>
                <th>Created At</th>
                <th>Read By</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {announcements
                .filter((announcement) =>
                  announcement.title
                    .toLowerCase()
                    .includes(searchTerm.toLowerCase())
                )
                .map((announcement) => (
                  <tr key={announcement._id}>
                    <td style={{ fontWeight: "500" }}>{announcement.title}</td>
                    <td>{announcement.content}</td>
                    <td>
                      <div className="recipients-container">
                        {Array.isArray(announcement.recipients?.role) ? (
                          announcement.recipients.role.map((recipient) => {
                            const recipientOption = RECIPIENT_OPTIONS.find(
                              (option) => option.value === recipient
                            );
                            return (
                              <span
                                key={recipient}
                                className={`recipient-tag ${recipient}`}
                              >
                                {recipientOption?.label || recipient}
                              </span>
                            );
                          })
                        ) : (
                          <span className="recipient-tag">No recipients</span>
                        )}
                      </div>
                    </td>
                    <td>{formatDBDateTime(announcement.createdAt)}</td>
                    <td>
                      <div
                        className="read-by-container"
                        title={renderReadByTooltip(announcement.readBy)}
                      >
                        <span className="read-count">
                          {announcement.readBy?.length || 0} readers
                        </span>
                        {announcement.readBy &&
                          announcement.readBy.length > 0 && (
                            <div className="reader-avatars">
                              {announcement.readBy
                                .slice(0, 3)
                                .map((reader, index) => (
                                  <Tooltip
                                    key={index}
                                    title={`${reader.user?.name || "Unknown"}
${formatDBDateTime(reader.readAt)}`}
                                    placement="top"
                                  >
                                    <Avatar
                                      sx={{
                                        width: 24,
                                        height: 24,
                                        margin: "-4px",
                                        bgcolor: getAvatarColor(
                                          reader.user?.name
                                        ),
                                      }}
                                      alt={reader.user?.name || "Unknown"}
                                      src={reader.user?.profilePicture}
                                    >
                                      {reader.user?.name
                                        ? reader.user.name[0].toUpperCase()
                                        : "U"}
                                    </Avatar>
                                  </Tooltip>
                                ))}
                              {announcement.readBy.length > 3 && (
                                <Tooltip
                                  title={`${
                                    announcement.readBy.length - 3
                                  } more readers`}
                                  placement="top"
                                >
                                  <Avatar
                                    sx={{
                                      width: 24,
                                      height: 24,
                                      margin: "-4px",
                                      bgcolor: "grey.400",
                                      fontSize: "0.75rem",
                                    }}
                                  >
                                    +{announcement.readBy.length - 3}
                                  </Avatar>
                                </Tooltip>
                              )}
                            </div>
                          )}
                      </div>
                    </td>
                    <td>
                      <div className="actions">
                        <button onClick={() => handleEdit(announcement)}>
                          <FaEdit />
                        </button>
                        <button onClick={() => handleDelete(announcement._id)}>
                          <FaTrash />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        )}
      </div>
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
          currentAnnouncement={currentAnnouncement}
          isLoading={isLoading}
          errors={errors}
        />
      </Modal>

      <NotificationSnackbar
        notification={notification}
        onClose={closeNotification}
      />
    </div>
  );
};

export default AnnouncementManagement;
