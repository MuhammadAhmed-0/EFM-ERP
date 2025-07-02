import { useEffect, useState } from "react";
import { FaSearch, FaEye, FaCircle } from "react-icons/fa";
import {
  CircularProgress,
  Modal,
  Box,
  Typography,
  Button,
  useTheme,
  useMediaQuery,
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
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const isSmallMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const getModalStyles = () => ({
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    width: isMobile ? "95vw" : "600px",
    maxWidth: isMobile ? "none" : "600px",
    maxHeight: "90vh",
    bgcolor: "background.paper",
    border: "none",
    borderRadius: "12px",
    boxShadow: 24,
    p: isMobile ? 2 : 4,
    outline: "none",
    display: "flex",
    flexDirection: "column",
    fontFamily:
      "'Poppins', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  });

  const scrollableContentStyles = {
    overflowY: "auto",
    flex: 1,
    pr: isMobile ? 1 : 2,
    "&::-webkit-scrollbar": {
      width: isMobile ? "4px" : "6px",
    },
    "&::-webkit-scrollbar-track": {
      background: "#f1f5f9",
    },
    "&::-webkit-scrollbar-thumb": {
      background: "#cbd5e1",
      borderRadius: "3px",
    },
  };

  return (
    <Box sx={getModalStyles()}>
      {/* Header */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: isMobile ? "flex-start" : "center",
          mb: isMobile ? 2 : 3,
          flexDirection: isMobile ? "column" : "row",
          gap: isMobile ? 1 : 0,
        }}
      >
        <Typography
          variant="h6"
          component="h2"
          sx={{
            color: "#1e293b",
            fontSize: isMobile ? "1.125rem" : "1.25rem",
            fontWeight: 500,
            fontFamily: "'Poppins', sans-serif",
          }}
        >
          Announcement Details
        </Typography>
        <Button
          onClick={onClose}
          sx={{
            minWidth: isMobile ? "28px" : "auto",
            height: isMobile ? "28px" : "auto",
            p: isMobile ? 0 : 1,
            color: "#64748b",
            alignSelf: isMobile ? "flex-end" : "auto",
            fontSize: isMobile ? "1.25rem" : "1.5rem",
            borderRadius: isMobile ? "50%" : "4px",
            "&:hover": {
              bgcolor: "#f1f5f9",
              color: "#3949ab",
            },
          }}
        >
          ×
        </Button>
      </Box>

      {/* Scrollable Content */}
      <Box sx={scrollableContentStyles}>
        {/* Title Section */}
        <Box sx={{ mb: isMobile ? 2 : 3 }}>
          <Typography
            sx={{
              color: "#64748b",
              fontSize: isMobile ? "0.8125rem" : "0.875rem",
              mb: isMobile ? 0.75 : 1,
              fontFamily: "'Poppins', sans-serif",
            }}
          >
            Title
          </Typography>
          <Typography
            sx={{
              color: "#1e293b",
              fontSize: isMobile ? "0.9375rem" : "1rem",
              fontWeight: 500,
              fontFamily: "'Poppins', sans-serif",
              wordBreak: "break-word",
            }}
          >
            {announcement.title}
          </Typography>
        </Box>

        {/* Content Section */}
        <Box sx={{ mb: isMobile ? 2 : 3 }}>
          <Typography
            sx={{
              color: "#64748b",
              fontSize: isMobile ? "0.8125rem" : "0.875rem",
              mb: isMobile ? 0.75 : 1,
              fontFamily: "'Poppins', sans-serif",
            }}
          >
            Content
          </Typography>
          <Typography
            sx={{
              color: "#1e293b",
              fontSize: isMobile ? "0.9375rem" : "1rem",
              whiteSpace: "pre-wrap",
              fontFamily: "'Poppins', sans-serif",
              lineHeight: isMobile ? 1.5 : 1.6,
              wordBreak: "break-word",
            }}
          >
            {announcement.content}
          </Typography>
        </Box>

        {/* Recipients Section */}
        <Box sx={{ mb: isMobile ? 2 : 3 }}>
          <Typography
            sx={{
              color: "#64748b",
              fontSize: isMobile ? "0.8125rem" : "0.875rem",
              mb: isMobile ? 0.75 : 1,
              fontFamily: "'Poppins', sans-serif",
            }}
          >
            Recipients
          </Typography>
          <Box
            sx={{
              display: "flex",
              flexWrap: "wrap",
              gap: isMobile ? 0.75 : 1,
            }}
          >
            {Array.isArray(announcement.recipients?.role) ? (
              announcement.recipients.role.map((recipient) => {
                const recipientOption = RECIPIENT_OPTIONS.find(
                  (option) => option.value === recipient
                );
                return (
                  <span
                    key={recipient}
                    className={`recipient-tag ${recipient}`}
                    style={{
                      fontSize: isMobile ? "0.75rem" : "0.875rem",
                      padding: isMobile ? "4px 8px" : "6px 12px",
                      borderRadius: "6px",
                      fontFamily: "'Poppins', sans-serif",
                    }}
                  >
                    {recipientOption?.label || recipient}
                  </span>
                );
              })
            ) : (
              <span
                className="recipient-tag"
                style={{
                  fontSize: isMobile ? "0.75rem" : "0.875rem",
                  padding: isMobile ? "4px 8px" : "6px 12px",
                  borderRadius: "6px",
                  fontFamily: "'Poppins', sans-serif",
                  color: "#64748b",
                  backgroundColor: "#f1f5f9",
                  border: "1px solid #e2e8f0",
                }}
              >
                No recipients
              </span>
            )}
          </Box>
        </Box>

        {/* Timestamp Section */}
        <Box
          sx={{
            borderTop: "1px solid #e2e8f0",
            pt: isMobile ? 1.5 : 2,
            mt: isMobile ? 1 : 2,
          }}
        >
          <Typography
            sx={{
              color: "#333",
              fontSize: isMobile ? "0.875rem" : "0.95rem",
              fontWeight: 600,
              fontFamily: "'Poppins', sans-serif",
              wordBreak: "break-word",
            }}
          >
            Announced At: {formatDateTime(announcement.createdAt)}
          </Typography>
        </Box>
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
