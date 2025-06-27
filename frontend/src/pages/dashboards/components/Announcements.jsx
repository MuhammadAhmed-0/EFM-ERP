import { useEffect, useState } from "react";
import { FaSearch, FaEye, FaCircle } from "react-icons/fa";
import {
  CircularProgress,
  Modal,
  Box,
  Typography,
  Button,
} from "@mui/material";
import axios from "axios";
import "../../../styles/components/Management.css";
import { getModalStyles } from "../../../styles/modal/commonModalStyles";
import { useAnnouncements } from "../../../context/AnnouncementContext";
import useNotification from "../../../hooks/useNotification";
import NotificationSnackbar from "../../../components/common/NotificationSnackbar";
import SyncButton from "../../../components/common/SyncButton";
const RECIPIENT_OPTIONS = [
  { value: "all", label: "All" },
  { value: "client", label: "Client" },
  { value: "teacher_quran", label: "Quran Teacher" },
  { value: "teacher_subjects", label: "Subject Teacher" },
  { value: "supervisor_quran", label: "Quran Supervisor" },
  { value: "supervisor_subjects", label: "Subject Supervisor" },
];

const formatDateTime = (dateString) => {
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

const ViewModalContent = ({ announcement, onClose }) => {
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
          Announcement Details
        </Typography>
        <Button
          onClick={onClose}
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

      <Box sx={{ mb: 3 }}>
        <Typography
          sx={{
            color: "#64748b",
            fontSize: "0.875rem",
            mb: 1,
          }}
        >
          Title
        </Typography>
        <Typography
          sx={{
            color: "#1e293b",
            fontSize: "1rem",
            fontWeight: 500,
          }}
        >
          {announcement.title}
        </Typography>
      </Box>

      <Box sx={{ mb: 3 }}>
        <Typography
          sx={{
            color: "#64748b",
            fontSize: "0.875rem",
            mb: 1,
          }}
        >
          Content
        </Typography>
        <Typography
          sx={{
            color: "#1e293b",
            fontSize: "1rem",
            whiteSpace: "pre-wrap",
          }}
        >
          {announcement.content}
        </Typography>
      </Box>

      <Box sx={{ mb: 3 }}>
        <Typography
          sx={{
            color: "#64748b",
            fontSize: "0.875rem",
            mb: 1,
          }}
        >
          Recipients
        </Typography>
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
          {Array.isArray(announcement.recipients?.role) ? (
            announcement.recipients.role.map((recipient) => {
              const recipientOption = RECIPIENT_OPTIONS.find(
                (option) => option.value === recipient
              );
              return (
                <span key={recipient} className={`recipient-tag ${recipient}`}>
                  {recipientOption?.label || recipient}
                </span>
              );
            })
          ) : (
            <span className="recipient-tag">No recipients</span>
          )}
        </Box>
      </Box>

      <Box sx={{ borderTop: "1px solid #e2e8f0", pt: 2 }}>
        <Typography
          sx={{
            color: "#333",
            fontSize: "0.95rem",
            fontWeight: 600,
          }}
        >
          Announced At: {formatDateTime(announcement.createdAt)}
        </Typography>
      </Box>
    </Box>
  );
};

const Announcements = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState(null);
  const [showUnreadOnly, setShowUnreadOnly] = useState(false);
  const { notification, showNotification, closeNotification } =
    useNotification();

  const {
    announcements,
    markAsRead,
    unreadCount,
    fetchAnnouncements: contextFetchAnnouncements,
  } = useAnnouncements();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    }
    contextFetchAnnouncements();
  }, []);

  const handleSync = async () => {
    setIsSyncing(true);
    await contextFetchAnnouncements();
    showNotification("Announcements refreshed successfully");
    setIsSyncing(false);
  };

  const handleViewAnnouncement = (announcement) => {
    setSelectedAnnouncement(announcement);
    if (!announcement.isRead) {
      markAsRead(announcement._id);
    }
  };

  return (
    <div className="management-container">
      <div className="management-header">
        <div>
          <h2>Announcements</h2>
          <p className="total-count">
            {announcements.length} Total Announcements
          </p>
        </div>
        <div className="header-buttons">
          <SyncButton isSyncing={isSyncing} onClick={() => handleSync(true)} />
        </div>
      </div>
      <div className="announcement-filter-section">
        <div className="announcement-search-wrapper">
          <div className="announcement-search-box">
            <FaSearch className="announcement-search-icon" />
            <input
              type="text"
              placeholder="Search announcements..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="announcement-filter-wrapper">
            <label className="announcement-unread-filter">
              <input
                type="checkbox"
                checked={showUnreadOnly}
                onChange={(e) => setShowUnreadOnly(e.target.checked)}
              />
              <span className="announcement-checkbox-custom"></span>
              <span>Show unread only</span>
            </label>
          </div>
        </div>
      </div>
      <div className="table-container">
        {isLoading ? (
          <div className="loading-container">
            <CircularProgress />
          </div>
        ) : (
          <>
            {announcements.length === 0 ? (
              <div className="no-data">
                <p>No announcements found</p>
              </div>
            ) : (
              <>
                {announcements.filter((announcement) => {
                  const matchesSearch = announcement.title
                    .toLowerCase()
                    .includes(searchTerm.toLowerCase());
                  const matchesUnreadFilter = showUnreadOnly
                    ? !announcement.isRead
                    : true;
                  return matchesSearch && matchesUnreadFilter;
                }).length === 0 ? (
                  <div className="no-data">
                    <p>No announcements match your filters</p>
                  </div>
                ) : (
                  <table>
                    <thead>
                      <tr>
                        <th>Title</th>
                        <th>Content</th>
                        <th>Recipients</th>
                        <th>Announced At</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {announcements
                        .filter((announcement) => {
                          const matchesSearch = announcement.title
                            .toLowerCase()
                            .includes(searchTerm.toLowerCase());
                          const matchesUnreadFilter = showUnreadOnly
                            ? !announcement.isRead
                            : true;
                          return matchesSearch && matchesUnreadFilter;
                        })
                        .map((announcement) => (
                          <tr key={announcement._id}>
                            <td style={{ fontWeight: "500" }}>
                              {!announcement.isRead && (
                                <FaCircle
                                  size={8}
                                  color="#1e3a5c"
                                  style={{ marginRight: 8 }}
                                />
                              )}
                              {announcement.title}
                            </td>
                            <td>
                              {announcement.content.length > 100
                                ? `${announcement.content.substring(0, 100)}...`
                                : announcement.content}
                            </td>
                            <td>
                              <div className="recipients-container">
                                {Array.isArray(
                                  announcement.recipients?.role
                                ) ? (
                                  announcement.recipients.role.map(
                                    (recipient) => {
                                      const recipientOption =
                                        RECIPIENT_OPTIONS.find(
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
                                    }
                                  )
                                ) : (
                                  <span className="recipient-tag">
                                    No recipients
                                  </span>
                                )}
                              </div>
                            </td>
                            <td>{formatDateTime(announcement.createdAt)}</td>
                            <td>
                              <div className="actions">
                                <button
                                  onClick={() =>
                                    handleViewAnnouncement(announcement)
                                  }
                                  className="view-btn"
                                >
                                  <FaEye />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                )}
              </>
            )}
          </>
        )}
      </div>

      <Modal
        open={!!selectedAnnouncement}
        onClose={() => setSelectedAnnouncement(null)}
        aria-labelledby="view-announcement-modal"
      >
        <ViewModalContent
          announcement={selectedAnnouncement || {}}
          onClose={() => setSelectedAnnouncement(null)}
        />
      </Modal>
      <NotificationSnackbar
        notification={notification}
        onClose={closeNotification}
      />
    </div>
  );
};

export default Announcements;
