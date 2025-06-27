import React, { useState, useEffect } from "react";
import {
  Box,
  CircularProgress,
  Paper,
  Modal,
  TextField,
  Button,
  Typography,
  Autocomplete,
  Chip,
} from "@mui/material";
import { formatDistanceToNow, parseISO } from "date-fns";
import { io } from "socket.io-client";
import axios from "axios";
import "../../../../styles/components/AdminQueries.css";
import "../../../../styles/components/Management.css";
import { getModalStyles } from "../../../../styles/modal/commonModalStyles";
import { FaSync, FaTrash } from "react-icons/fa";
import useNotification from "../../../../hooks/useNotification";
import NotificationSnackbar from "../../../../components/common/NotificationSnackbar";
import SyncButton from "../../../../components/common/SyncButton";

const QUERY_TYPE_LABELS = {
  attendance_issue: "Attendance Issue",
  leave_request: "Leave Request",
  salary_query: "Salary Query",
  schedule_change: "Schedule Change",
  technical_issue: "Technical Issue",
  other: "Other",
};

const DeleteQueriesModal = ({
  showModal,
  setShowModal,
  queries,
  onDeleteQueries,
  isLoading,
  formatDate,
  formatRole,
  getQueryType,
}) => {
  const [selectedQueries, setSelectedQueries] = useState([]);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);
  const [password, setPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [searchValue, setSearchValue] = useState(null);

  const formatQueryStatus = (query) => {
    if (query.readBy?.length > 0) {
      return "Responded";
    }
    return "Pending";
  };

  const handleSearchSelect = (event, newValue) => {
    if (newValue) {
      if (!selectedQueries.includes(newValue._id)) {
        setSelectedQueries((prev) => [...prev, newValue._id]);
      }
      setSearchValue(null);
    }
  };

  const handleQuerySelect = (queryId) => {
    setSelectedQueries((prev) =>
      prev.includes(queryId)
        ? prev.filter((id) => id !== queryId)
        : [...prev, queryId]
    );
  };

  const handleSelectAll = () => {
    if (selectedQueries.length === queries.length) {
      setSelectedQueries([]);
    } else {
      setSelectedQueries(queries.map((query) => query._id));
    }
  };

  const handleDeleteClick = () => {
    if (selectedQueries.length === 0) {
      return;
    }
    setShowPasswordConfirm(true);
    setPassword("");
    setPasswordError("");
  };

  const handlePasswordConfirm = async () => {
    if (password !== "admin123") {
      setPasswordError("Incorrect password. Please try again.");
      return;
    }

    setIsDeleting(true);
    try {
      await onDeleteQueries(selectedQueries);
      setSelectedQueries([]);
      setShowPasswordConfirm(false);
      setPassword("");
      setPasswordError("");
      setShowModal(false);
    } catch (error) {
      console.error("Error deleting queries:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCancelPassword = () => {
    setShowPasswordConfirm(false);
    setPassword("");
    setPasswordError("");
  };

  const handleModalClose = () => {
    if (!isDeleting && !showPasswordConfirm) {
      setShowModal(false);
      setSelectedQueries([]);
      setPassword("");
      setPasswordError("");
    }
  };

  const getSelectedQueryTitles = () => {
    return selectedQueries
      .map((id) => {
        const query = queries.find((q) => q._id === id);
        return query
          ? QUERY_TYPE_LABELS[getQueryType(query.title)] ||
              getQueryType(query.title)
          : null;
      })
      .filter(Boolean)
      .join(", ");
  };

  const modalStyle = {
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    width: 700,
    maxHeight: "90vh",
    bgcolor: "background.paper",
    borderRadius: "12px",
    boxShadow:
      "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)",
    p: 4,
    overflow: "hidden",
    display: "flex",
    flexDirection: "column",
    fontFamily:
      "'Poppins', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    "&:focus-visible": {
      outline: "none",
    },
    "& *": {
      fontFamily:
        "'Poppins', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif !important",
    },
  };

  return (
    <Modal
      open={showModal}
      onClose={handleModalClose}
      aria-labelledby="delete-queries-modal"
    >
      <Box sx={modalStyle}>
        {!showPasswordConfirm ? (
          <>
            <Box sx={{ borderBottom: "1px solid #e2e8f0", pb: 2, mb: 3 }}>
              <Typography
                variant="h6"
                component="h2"
                sx={{ color: "#dc2626", fontWeight: 600 }}
              >
                Delete Staff Queries
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Select queries to delete permanently
              </Typography>
              {queries.length === 0 && (
                <Typography variant="body2" sx={{ mt: 1, color: "#f59e0b" }}>
                  ⚠️ No queries found
                </Typography>
              )}
            </Box>

            {queries.length > 0 && (
              <Box sx={{ mb: 2 }}>
                <Autocomplete
                  options={queries}
                  getOptionLabel={(option) =>
                    `${
                      QUERY_TYPE_LABELS[getQueryType(option.title)] ||
                      getQueryType(option.title)
                    } - ${option.sender?.name} - ${option.content.substring(
                      0,
                      50
                    )}...`
                  }
                  value={searchValue}
                  onChange={handleSearchSelect}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Search Query by Type, Staff Name or Content"
                      size="small"
                      placeholder="Type to search and select query..."
                      sx={{
                        fontFamily: "'Poppins', sans-serif",
                        "& .MuiOutlinedInput-root": {
                          backgroundColor: "#fafafa",
                          fontFamily: "'Poppins', sans-serif",
                          "&:hover": {
                            backgroundColor: "#f5f5f5",
                          },
                          "&.Mui-focused": {
                            backgroundColor: "white",
                          },
                        },
                        "& .MuiInputLabel-root": {
                          fontFamily: "'Poppins', sans-serif",
                        },
                        "& .MuiAutocomplete-input": {
                          fontFamily: "'Poppins', sans-serif",
                        },
                      }}
                    />
                  )}
                  renderOption={(props, option) => {
                    const { key, ...restProps } = props;
                    return (
                      <li key={key} {...restProps}>
                        <Box
                          sx={{
                            display: "flex",
                            justifyContent: "space-between",
                            width: "100%",
                            alignItems: "center",
                          }}
                        >
                          <Box sx={{ flex: 1 }}>
                            <Typography variant="body2" fontWeight="500">
                              {QUERY_TYPE_LABELS[getQueryType(option.title)] ||
                                getQueryType(option.title)}
                            </Typography>
                            <Typography
                              variant="caption"
                              color="text.secondary"
                            >
                              {option.sender?.staffId} - {option.sender?.name} |{" "}
                              {option.content.substring(0, 60)}...
                            </Typography>
                          </Box>
                          <Box
                            sx={{
                              display: "flex",
                              flexDirection: "column",
                              alignItems: "flex-end",
                              gap: 0.5,
                            }}
                          >
                            <Chip
                              label={formatQueryStatus(option)}
                              size="small"
                              sx={{
                                fontSize: "0.6rem",
                                height: "16px",
                                backgroundColor:
                                  option.readBy?.length > 0
                                    ? "#dcfce7"
                                    : "#fef3c7",
                                color:
                                  option.readBy?.length > 0
                                    ? "#15803d"
                                    : "#b45309",
                              }}
                            />
                            <Typography
                              variant="caption"
                              sx={{ fontSize: "0.6rem", color: "#64748b" }}
                            >
                              {formatDate(option.createdAt)}
                            </Typography>
                          </Box>
                        </Box>
                      </li>
                    );
                  }}
                  filterOptions={(options, { inputValue }) => {
                    const searchTerm = inputValue.toLowerCase();
                    return options.filter((option) => {
                      const typeMatch = (
                        QUERY_TYPE_LABELS[getQueryType(option.title)] ||
                        getQueryType(option.title)
                      )
                        .toLowerCase()
                        .includes(searchTerm);
                      const nameMatch = option.sender?.name
                        ?.toLowerCase()
                        .includes(searchTerm);
                      const contentMatch = option.content
                        .toLowerCase()
                        .includes(searchTerm);
                      const staffIdMatch = String(
                        option.sender?.staffId || ""
                      ).includes(searchTerm);
                      return (
                        typeMatch || nameMatch || contentMatch || staffIdMatch
                      );
                    });
                  }}
                  noOptionsText="No queries found"
                  clearOnEscape
                  blurOnSelect
                />
              </Box>
            )}

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
                  bgcolor: "#fef2f2",
                  p: 2,
                  borderBottom: "1px solid #e2e8f0",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <Typography
                  variant="subtitle2"
                  fontWeight="600"
                  sx={{ color: "#dc2626" }}
                >
                  Staff Queries ({queries.length} total)
                </Typography>
                <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                  {selectedQueries.length > 0 && (
                    <Typography variant="caption" sx={{ color: "#dc2626" }}>
                      {selectedQueries.length} selected for deletion
                    </Typography>
                  )}
                  {queries.length > 0 && (
                    <Button
                      size="small"
                      onClick={handleSelectAll}
                      sx={{
                        textTransform: "none",
                        color: "#dc2626",
                        "&:hover": { bgcolor: "rgba(220, 38, 38, 0.1)" },
                      }}
                    >
                      {selectedQueries.length === queries.length
                        ? "Deselect All"
                        : "Select All"}
                    </Button>
                  )}
                </Box>
              </Box>

              <Box sx={{ maxHeight: "350px", overflowY: "auto", p: 1 }}>
                {queries.length === 0 ? (
                  <Box
                    sx={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      p: 4,
                      color: "#64748b",
                    }}
                  >
                    <Typography variant="h6" sx={{ mb: 1, color: "#f59e0b" }}>
                      📝 No Queries Found
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{ mb: 1, textAlign: "center" }}
                    >
                      No staff queries available
                    </Typography>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ textAlign: "center" }}
                    >
                      Staff members haven't created any queries yet
                    </Typography>
                  </Box>
                ) : (
                  queries.map((query) => (
                    <Box
                      key={query._id}
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        p: 2,
                        borderRadius: "6px",
                        cursor: "pointer",
                        mb: 1,
                        "&:hover": {
                          bgcolor: "#fef2f2",
                        },
                        bgcolor: selectedQueries.includes(query._id)
                          ? "#fee2e2"
                          : "transparent",
                        border: selectedQueries.includes(query._id)
                          ? "2px solid #dc2626"
                          : "2px solid transparent",
                      }}
                      onClick={() => handleQuerySelect(query._id)}
                    >
                      <input
                        type="checkbox"
                        checked={selectedQueries.includes(query._id)}
                        onChange={() => handleQuerySelect(query._id)}
                        style={{ marginRight: "12px", accentColor: "#dc2626" }}
                      />
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="body2" fontWeight="500">
                          {QUERY_TYPE_LABELS[getQueryType(query.title)] ||
                            getQueryType(query.title)}
                        </Typography>
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          sx={{ display: "block", mt: 0.5 }}
                        >
                          {query.sender?.staffId} - {query.sender?.name} |{" "}
                          {formatRole(query.senderRole)}
                        </Typography>
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          sx={{ display: "block", mt: 0.5 }}
                        >
                          {query.content.substring(0, 80)}...
                        </Typography>
                        <Typography
                          variant="caption"
                          sx={{ color: "#64748b", display: "block", mt: 0.5 }}
                        >
                          📅 {formatDate(query.createdAt)}
                        </Typography>
                      </Box>
                      <Box
                        sx={{
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "flex-end",
                          gap: 1,
                        }}
                      >
                        <Chip
                          label={formatQueryStatus(query)}
                          size="small"
                          sx={{
                            backgroundColor:
                              query.readBy?.length > 0 ? "#dcfce7" : "#fef3c7",
                            color:
                              query.readBy?.length > 0 ? "#15803d" : "#b45309",
                          }}
                        />
                        {query.sender?.isActive === false && (
                          <Typography
                            variant="caption"
                            sx={{
                              color: "#dc2626",
                              fontSize: "0.6rem",
                              backgroundColor: "#fee2e2",
                              padding: "1px 4px",
                              borderRadius: "4px",
                            }}
                          >
                            Inactive Staff
                          </Typography>
                        )}
                      </Box>
                    </Box>
                  ))
                )}
              </Box>
            </Box>

            {selectedQueries.length > 0 && (
              <Box
                sx={{
                  mt: 2,
                  p: 2,
                  bgcolor: "#fef2f2",
                  border: "1px solid #fecaca",
                  borderRadius: "6px",
                }}
              >
                <Typography
                  variant="body2"
                  sx={{ color: "#dc2626", fontWeight: 500 }}
                >
                  ⚠️ Warning: This will permanently delete{" "}
                  <strong>
                    {selectedQueries.length} quer
                    {selectedQueries.length > 1 ? "ies" : "y"}
                  </strong>
                  {selectedQueries.length <= 3 &&
                    `: ${getSelectedQueryTitles()}`}
                  . This action cannot be undone.
                </Typography>
              </Box>
            )}

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
              >
                Cancel
              </button>
              <button
                className="delete-btn"
                onClick={handleDeleteClick}
                disabled={selectedQueries.length === 0 || queries.length === 0}
              >
                {queries.length === 0
                  ? "No Queries to Delete"
                  : `Delete ${selectedQueries.length} Quer${
                      selectedQueries.length > 1 ? "ies" : "y"
                    }`}
              </button>
            </Box>
          </>
        ) : (
          <>
            <Box sx={{ borderBottom: "1px solid #e2e8f0", pb: 2, mb: 3 }}>
              <Typography
                variant="h6"
                component="h2"
                sx={{ color: "#dc2626", fontWeight: 600 }}
              >
                🔒 Confirm Query Deletion
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Enter admin password to confirm deletion of{" "}
                <strong>
                  {selectedQueries.length} quer
                  {selectedQueries.length > 1 ? "ies" : "y"}
                </strong>
              </Typography>
            </Box>

            <Box sx={{ my: 3 }}>
              <TextField
                fullWidth
                type="password"
                label="Admin Password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (passwordError) setPasswordError("");
                }}
                error={!!passwordError}
                helperText={passwordError}
                placeholder="Enter admin password"
                autoFocus
                onKeyPress={(e) => {
                  if (e.key === "Enter" && password) {
                    handlePasswordConfirm();
                  }
                }}
                sx={{
                  fontFamily: "'Poppins', sans-serif",
                  "& .MuiOutlinedInput-root": {
                    fontFamily: "'Poppins', sans-serif",
                    "&.Mui-error": {
                      "& fieldset": {
                        borderColor: "#dc2626",
                      },
                    },
                  },
                  "& .MuiInputLabel-root": {
                    fontFamily: "'Poppins', sans-serif",
                  },
                  "& .MuiFormHelperText-root": {
                    fontFamily: "'Poppins', sans-serif",
                  },
                }}
              />
            </Box>

            <Box
              sx={{
                p: 2,
                bgcolor: "#fef2f2",
                border: "1px solid #fecaca",
                borderRadius: "6px",
                mb: 3,
              }}
            >
              <Typography
                variant="body2"
                sx={{ color: "#dc2626", fontWeight: 500 }}
              >
                ⚠️ Final Warning: You are about to permanently delete{" "}
                <strong>
                  {selectedQueries.length} quer
                  {selectedQueries.length > 1 ? "ies" : "y"}
                </strong>
                {selectedQueries.length <= 3 &&
                  ` (${getSelectedQueryTitles()})`}
                . This action cannot be undone.
              </Typography>
            </Box>

            <Box
              sx={{
                display: "flex",
                justifyContent: "flex-end",
                gap: 2,
                pt: 2,
                borderTop: "1px solid #e2e8f0",
              }}
            >
              <button
                className="clear-filters-btn"
                onClick={handleCancelPassword}
                disabled={isDeleting}
              >
                Cancel
              </button>
              <button
                className="delete-btn"
                onClick={handlePasswordConfirm}
                disabled={!password || isDeleting}
              >
                {isDeleting ? (
                  <span className="spinner"></span>
                ) : (
                  "Confirm Delete"
                )}
              </button>
            </Box>
          </>
        )}
      </Box>
    </Modal>
  );
};

const AdminQueries = () => {
  const [queries, setQueries] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedQuery, setSelectedQuery] = useState(null);
  const [response, setResponse] = useState("");
  const [showResponseModal, setShowResponseModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [socket, setSocket] = useState(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const { notification, showNotification, closeNotification } =
    useNotification();

  const BASE_URL = import.meta.env.VITE_BASE_URL;

  const formatDate = (dateString) => {
    try {
      if (!dateString) return "Date unavailable";
      const date = parseISO(dateString);
      return formatDistanceToNow(date, { addSuffix: true });
    } catch (error) {
      console.error("Date formatting error:", error);
      return "Date unavailable";
    }
  };

  const formatRole = (role) => {
    if (!role) return "Unknown Role";
    return role
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  const getQueryType = (title) => {
    if (!title) return "other";
    const type = title.replace("QUERY: ", "").trim().toLowerCase();
    return type || "other";
  };

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      const newSocket = io(BASE_URL, {
        auth: { token },
      });

      newSocket.on("connect", () => {
        console.log("Connected to socket server");
      });

      newSocket.on("new_query", (data) => {
        setQueries((prev) => [data.announcement, ...prev]);
        showNotification("New query received");
      });

      setSocket(newSocket);

      return () => {
        if (newSocket) newSocket.disconnect();
      };
    }
  }, []);

  const fetchQueries = async (showSuccessMessage = false) => {
    setIsSyncing(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("No authentication token found");

      const response = await axios.get(
        `${BASE_URL}/api/announcements/queries`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setQueries(response.data.queries || []);
      if (showSuccessMessage) {
        showNotification("Queries refreshed successfully");
      }
    } catch (error) {
      showNotification(
        error.response?.data?.message || "Error fetching queries",
        "error"
      );
    } finally {
      setIsSyncing(false);
    }
  };

  useEffect(() => {
    fetchQueries();
  }, []);

  const handleResponse = async (e) => {
    e.preventDefault();
    if (!response.trim()) return;

    setIsLoading(true);
    try {
      const token = localStorage.getItem("token");
      await axios.post(
        `${BASE_URL}/api/announcements/query/respond/${selectedQuery._id}`,
        { response },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      showNotification("Response sent successfully");
      setShowResponseModal(false);
      setResponse("");
      await fetchQueries();
    } catch (error) {
      showNotification(
        error.response?.data?.message || "Error sending response",
        "error"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteQueries = async (queryIds) => {
    try {
      const token = localStorage.getItem("token");

      const idsArray = Array.isArray(queryIds) ? queryIds : [queryIds];

      const response = await axios.delete(
        `${BASE_URL}/api/announcements/queries/delete-multiple`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          data: {
            queryIds: idsArray,
          },
        }
      );
      showNotification(response.data.message, "success");
      await fetchQueries();
    } catch (error) {
      console.error("Error deleting queries:", error);
      showNotification(
        error.response?.data?.message || "Error deleting queries",
        "error"
      );
    }
  };

  if (isLoading && !queries.length) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", p: 3 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <div className="queries-container">
      <div className="queries-container">
        <div className="queries-header" style={{ marginBottom: "0px" }}>
          <div className="queries-header-content">
            <h2 className="queries-title">Staff Queries</h2>
            <p className="queries-subtitle">
              {queries.length} Total Queries •{" "}
              {queries.filter((q) => !q.readBy?.length).length} Pending
            </p>
          </div>
          <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
            <button
              className="add-btn"
              onClick={() => setShowDeleteModal(true)}
              disabled={isSyncing || isLoading || queries.length === 0}
            >
              <FaTrash /> Delete Queries
            </button>
            <SyncButton
              isSyncing={isSyncing}
              onClick={() => fetchQueries(true)}
            />
          </div>
        </div>

        <div className="queries-stats">
          <h3>Query Statistics</h3>
          <div className="stat-item">
            <span className="stat-label">Total Queries</span>
            <span className="stat-value">{queries.length}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Pending Responses</span>
            <span className="stat-value">
              {queries.filter((q) => !q.readBy?.length).length}
            </span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Responded</span>
            <span className="stat-value">
              {queries.filter((q) => q.readBy?.length).length}
            </span>
          </div>
        </div>

        <div className="admin-queries-grid">
          <div className="queries-list">
            {!queries.length ? (
              <Paper className="query-card" style={{ textAlign: "center" }}>
                <p className="query-content">No queries found</p>
              </Paper>
            ) : (
              queries.map((query) => (
                <div key={query._id} className="query-card">
                  <div className="query-header">
                    <div className="query-header-left">
                      <div
                        style={{
                          width: "100%",
                        }}
                      >
                        <span
                          className={`query-type-chip type-${getQueryType(
                            query.title
                          ).replace("_", "-")}`}
                        >
                          {QUERY_TYPE_LABELS[getQueryType(query.title)] ||
                            getQueryType(query.title)}
                        </span>
                      </div>
                      <div className="sender-info">
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                          }}
                        >
                          <span className="sender-name">
                            {query.sender?.staffId} -{" "}
                            {query.sender?.name || "Unknown"}
                          </span>
                          {query.sender?.isActive === false ? (
                            <span
                              style={{
                                color: "#dc2626",
                                fontSize: "0.7rem",
                                fontWeight: "500",
                                backgroundColor: "#fee2e2",
                                padding: "2px 6px",
                                borderRadius: "4px",
                              }}
                            >
                              Inactive
                            </span>
                          ) : query.sender?.isActive === true ? (
                            <span
                              style={{
                                color: "#15803d",
                                fontSize: "0.7rem",
                                fontWeight: "500",
                                backgroundColor: "#dcfce7",
                                padding: "2px 6px",
                                borderRadius: "4px",
                              }}
                            >
                              Active
                            </span>
                          ) : null}
                        </div>
                        <span className="sender-role">
                          {formatRole(query.senderRole)}
                        </span>
                      </div>
                    </div>
                    <span className="query-timestamp">
                      {formatDate(query.createdAt)}
                    </span>
                  </div>

                  <div className="query-content">{query.content}</div>

                  {!query.readBy?.length ? (
                    <div className="query-footer">
                      <div className="query-status">
                        <span className="status-indicator status-pending" />
                        <span>Pending response</span>
                      </div>
                      <button
                        className="add-btn"
                        onClick={() => {
                          setSelectedQuery(query);
                          setShowResponseModal(true);
                        }}
                      >
                        Respond
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className="query-footer">
                        <div className="query-status">
                          <span className="status-indicator status-read" />
                          <span>Responded</span>
                        </div>
                      </div>
                      <div className="admin-response">
                        <div className="response-header">
                          <div className="response-label-container">
                            <span className="response-label">
                              Admin Response
                            </span>
                          </div>
                          <span className="response-time">
                            {formatDate(query.response?.respondedAt)}
                          </span>
                        </div>
                        <p className="response-text">
                          {query.response?.content}
                        </p>
                      </div>
                    </>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <Modal
        open={showResponseModal}
        onClose={() => !isLoading && setShowResponseModal(false)}
        aria-labelledby="response-modal"
      >
        <Box sx={getModalStyles()}>
          <h3 className="modal-title">Respond to Query</h3>
          {selectedQuery && (
            <div className="original-query">
              <p className="query-type-label">
                {QUERY_TYPE_LABELS[getQueryType(selectedQuery.title)] ||
                  getQueryType(selectedQuery.title)}
              </p>
              <p className="query-text">{selectedQuery.content}</p>
            </div>
          )}
          <form onSubmit={handleResponse}>
            <TextField
              fullWidth
              multiline
              rows={4}
              label="Your Response"
              value={response}
              onChange={(e) => setResponse(e.target.value)}
              required
              margin="normal"
            />
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
                onClick={() => setShowResponseModal(false)}
                disabled={isLoading}
              >
                Cancel
              </button>
              <button className="add-btn" type="submit" disabled={isLoading}>
                {isLoading ? (
                  <div className="loading-spinner"></div>
                ) : (
                  "Send Response"
                )}
              </button>
            </Box>
          </form>
        </Box>
      </Modal>

      <DeleteQueriesModal
        showModal={showDeleteModal}
        setShowModal={setShowDeleteModal}
        queries={queries}
        onDeleteQueries={handleDeleteQueries}
        isLoading={isLoading}
        formatDate={formatDate}
        formatRole={formatRole}
        getQueryType={getQueryType}
      />

      <NotificationSnackbar
        notification={notification}
        onClose={closeNotification}
      />
    </div>
  );
};

export default AdminQueries;
