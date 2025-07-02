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

  const isMobile = window.innerWidth < 768;
  const isTablet = window.innerWidth >= 768 && window.innerWidth < 1024;

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

  const getResponsiveModalStyle = () => ({
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    width: {
      xs: "95vw",
      sm: "85vw",
      md: "700px",
      lg: "800px",
    },
    maxWidth: {
      xs: "400px",
      sm: "600px",
      md: "700px",
      lg: "800px",
    },
    maxHeight: {
      xs: "95vh",
      sm: "90vh",
      md: "85vh",
    },
    bgcolor: "background.paper",
    borderRadius: {
      xs: "8px",
      sm: "12px",
    },
    boxShadow: 24,
    p: {
      xs: 2,
      sm: 3,
      md: 4,
    },
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
  });

  return (
    <Modal
      open={showModal}
      onClose={handleModalClose}
      aria-labelledby="delete-queries-modal"
    >
      <Box sx={getResponsiveModalStyle()}>
        {!showPasswordConfirm ? (
          <>
            <Box
              sx={{
                borderBottom: "1px solid #e2e8f0",
                pb: { xs: 1.5, sm: 2 },
                mb: { xs: 2, sm: 3 },
              }}
            >
              <Typography
                variant="h6"
                component="h2"
                sx={{
                  color: "#dc2626",
                  fontWeight: 600,
                  fontSize: { xs: "1.1rem", sm: "1.25rem" },
                }}
              >
                Delete Staff Queries
              </Typography>
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{
                  mt: 1,
                  fontSize: { xs: "0.8rem", sm: "0.875rem" },
                }}
              >
                Select queries to delete permanently
              </Typography>
              {queries.length === 0 && (
                <Typography
                  variant="body2"
                  sx={{
                    mt: 1,
                    color: "#f59e0b",
                    fontSize: { xs: "0.8rem", sm: "0.875rem" },
                  }}
                >
                  ⚠️ No queries found
                </Typography>
              )}
            </Box>

            {queries.length > 0 && (
              <Box sx={{ mb: { xs: 1.5, sm: 2 } }}>
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
                      label={
                        isMobile
                          ? "Search Query"
                          : "Search Query by Type, Staff Name or Content"
                      }
                      size="small"
                      placeholder={
                        isMobile
                          ? "Type to search..."
                          : "Type to search and select query..."
                      }
                      sx={{
                        fontFamily: "'Poppins', sans-serif",
                        "& .MuiOutlinedInput-root": {
                          backgroundColor: "#fafafa",
                          fontFamily: "'Poppins', sans-serif",
                          fontSize: { xs: "0.875rem", sm: "1rem" },
                          "&:hover": {
                            backgroundColor: "#f5f5f5",
                          },
                          "&.Mui-focused": {
                            backgroundColor: "white",
                          },
                        },
                        "& .MuiInputLabel-root": {
                          fontFamily: "'Poppins', sans-serif",
                          fontSize: { xs: "0.875rem", sm: "1rem" },
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
                            flexDirection: { xs: "column", sm: "row" },
                            gap: { xs: 0.5, sm: 0 },
                          }}
                        >
                          <Box
                            sx={{ flex: 1, width: { xs: "100%", sm: "auto" } }}
                          >
                            <Typography
                              variant="body2"
                              fontWeight="500"
                              sx={{
                                fontSize: { xs: "0.8rem", sm: "0.875rem" },
                              }}
                            >
                              {QUERY_TYPE_LABELS[getQueryType(option.title)] ||
                                getQueryType(option.title)}
                            </Typography>
                            <Typography
                              variant="caption"
                              color="text.secondary"
                              sx={{ fontSize: { xs: "0.7rem", sm: "0.75rem" } }}
                            >
                              {option.sender?.staffId} - {option.sender?.name} |{" "}
                              {option.content.substring(0, isMobile ? 30 : 60)}
                              ...
                            </Typography>
                          </Box>
                          <Box
                            sx={{
                              display: "flex",
                              flexDirection: { xs: "row", sm: "column" },
                              alignItems: { xs: "center", sm: "flex-end" },
                              gap: { xs: 1, sm: 0.5 },
                              width: { xs: "100%", sm: "auto" },
                              justifyContent: {
                                xs: "space-between",
                                sm: "flex-end",
                              },
                            }}
                          >
                            <Chip
                              label={formatQueryStatus(option)}
                              size="small"
                              sx={{
                                fontSize: { xs: "0.55rem", sm: "0.6rem" },
                                height: { xs: "14px", sm: "16px" },
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
                              sx={{
                                fontSize: { xs: "0.55rem", sm: "0.6rem" },
                                color: "#64748b",
                              }}
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
                  p: { xs: 1.5, sm: 2 },
                  borderBottom: "1px solid #e2e8f0",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  flexDirection: { xs: "column", sm: "row" },
                  gap: { xs: 1, sm: 0 },
                }}
              >
                <Typography
                  variant="subtitle2"
                  fontWeight="600"
                  sx={{
                    color: "#dc2626",
                    fontSize: { xs: "0.875rem", sm: "1rem" },
                  }}
                >
                  Staff Queries ({queries.length} total)
                </Typography>
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: { xs: 1, sm: 2 },
                    flexDirection: { xs: "column", sm: "row" },
                  }}
                >
                  {selectedQueries.length > 0 && (
                    <Typography
                      variant="caption"
                      sx={{
                        color: "#dc2626",
                        fontSize: { xs: "0.7rem", sm: "0.75rem" },
                      }}
                    >
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
                        fontSize: { xs: "0.75rem", sm: "0.875rem" },
                        padding: { xs: "4px 8px", sm: "6px 12px" },
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

              <Box
                sx={{
                  maxHeight: { xs: "250px", sm: "350px" },
                  overflowY: "auto",
                  p: { xs: 0.5, sm: 1 },
                }}
              >
                {queries.length === 0 ? (
                  <Box
                    sx={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      p: { xs: 3, sm: 4 },
                      color: "#64748b",
                    }}
                  >
                    <Typography
                      variant="h6"
                      sx={{
                        mb: 1,
                        color: "#f59e0b",
                        fontSize: { xs: "1rem", sm: "1.25rem" },
                      }}
                    >
                      📝 No Queries Found
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{
                        mb: 1,
                        textAlign: "center",
                        fontSize: { xs: "0.8rem", sm: "0.875rem" },
                      }}
                    >
                      No staff queries available
                    </Typography>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{
                        textAlign: "center",
                        fontSize: { xs: "0.7rem", sm: "0.75rem" },
                      }}
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
                        alignItems: { xs: "flex-start", sm: "center" },
                        p: { xs: 1.5, sm: 2 },
                        borderRadius: "6px",
                        cursor: "pointer",
                        mb: { xs: 0.5, sm: 1 },
                        "&:hover": {
                          bgcolor: "#fef2f2",
                        },
                        bgcolor: selectedQueries.includes(query._id)
                          ? "#fee2e2"
                          : "transparent",
                        border: selectedQueries.includes(query._id)
                          ? "2px solid #dc2626"
                          : "2px solid transparent",
                        flexDirection: { xs: "column", sm: "row" },
                        gap: { xs: 1, sm: 0 },
                      }}
                      onClick={() => handleQuerySelect(query._id)}
                    >
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "flex-start",
                          width: { xs: "100%", sm: "auto" },
                          gap: { xs: 1, sm: 1.5 },
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={selectedQueries.includes(query._id)}
                          onChange={() => handleQuerySelect(query._id)}
                          style={{
                            marginRight: isMobile ? "8px" : "12px",
                            accentColor: "#dc2626",
                            transform: isMobile ? "scale(0.9)" : "scale(1)",
                          }}
                        />
                        <Box sx={{ flex: 1 }}>
                          <Typography
                            variant="body2"
                            fontWeight="500"
                            sx={{ fontSize: { xs: "0.8rem", sm: "0.875rem" } }}
                          >
                            {QUERY_TYPE_LABELS[getQueryType(query.title)] ||
                              getQueryType(query.title)}
                          </Typography>
                          <Typography
                            variant="caption"
                            color="text.secondary"
                            sx={{
                              display: "block",
                              mt: 0.5,
                              fontSize: { xs: "0.7rem", sm: "0.75rem" },
                            }}
                          >
                            {query.sender?.staffId} - {query.sender?.name} |{" "}
                            {formatRole(query.senderRole)}
                          </Typography>
                          <Typography
                            variant="caption"
                            color="text.secondary"
                            sx={{
                              display: "block",
                              mt: 0.5,
                              fontSize: { xs: "0.7rem", sm: "0.75rem" },
                            }}
                          >
                            {query.content.substring(0, isMobile ? 60 : 80)}...
                          </Typography>
                          <Typography
                            variant="caption"
                            sx={{
                              color: "#64748b",
                              display: "block",
                              mt: 0.5,
                              fontSize: { xs: "0.7rem", sm: "0.75rem" },
                            }}
                          >
                            📅 {formatDate(query.createdAt)}
                          </Typography>
                        </Box>
                      </Box>

                      <Box
                        sx={{
                          display: "flex",
                          flexDirection: { xs: "row", sm: "column" },
                          alignItems: { xs: "center", sm: "flex-end" },
                          justifyContent: {
                            xs: "space-between",
                            sm: "flex-start",
                          },
                          gap: 1,
                          width: { xs: "100%", sm: "auto" },
                          mt: { xs: 1, sm: 0 },
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
                            fontSize: { xs: "0.65rem", sm: "0.75rem" },
                          }}
                        />
                        {query.sender?.isActive === false && (
                          <Typography
                            variant="caption"
                            sx={{
                              color: "#dc2626",
                              fontSize: { xs: "0.55rem", sm: "0.6rem" },
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
                  p: { xs: 1.5, sm: 2 },
                  bgcolor: "#fef2f2",
                  border: "1px solid #fecaca",
                  borderRadius: "6px",
                }}
              >
                <Typography
                  variant="body2"
                  sx={{
                    color: "#dc2626",
                    fontWeight: 500,
                    fontSize: { xs: "0.8rem", sm: "0.875rem" },
                  }}
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
                gap: { xs: 1.5, sm: 2 },
                mt: 3,
                pt: 2,
                borderTop: "1px solid #e2e8f0",
                flexDirection: { xs: "column", sm: "row" },
              }}
            >
              <button
                className="clear-filters-btn"
                onClick={() => setShowModal(false)}
                style={{
                  order: isMobile ? 2 : 1,
                  minHeight: isMobile ? "44px" : "auto",
                  fontSize: isMobile ? "0.875rem" : "0.9rem",
                }}
              >
                Cancel
              </button>
              <button
                className="delete-btn"
                onClick={handleDeleteClick}
                disabled={selectedQueries.length === 0 || queries.length === 0}
                style={{
                  order: isMobile ? 1 : 2,
                  minHeight: isMobile ? "44px" : "auto",
                  fontSize: isMobile ? "0.875rem" : "0.9rem",
                }}
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
          /* Password Confirmation Screen */
          <>
            <Box
              sx={{
                borderBottom: "1px solid #e2e8f0",
                pb: { xs: 1.5, sm: 2 },
                mb: { xs: 2, sm: 3 },
              }}
            >
              <Typography
                variant="h6"
                component="h2"
                sx={{
                  color: "#dc2626",
                  fontWeight: 600,
                  fontSize: { xs: "1.1rem", sm: "1.25rem" },
                }}
              >
                🔒 Confirm Query Deletion
              </Typography>
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{
                  mt: 1,
                  fontSize: { xs: "0.8rem", sm: "0.875rem" },
                }}
              >
                Enter admin password to confirm deletion of{" "}
                <strong>
                  {selectedQueries.length} quer
                  {selectedQueries.length > 1 ? "ies" : "y"}
                </strong>
              </Typography>
            </Box>

            <Box sx={{ my: { xs: 2, sm: 3 } }}>
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
                    fontSize: { xs: "0.875rem", sm: "1rem" },
                    "&.Mui-error": {
                      "& fieldset": {
                        borderColor: "#dc2626",
                      },
                    },
                  },
                  "& .MuiInputLabel-root": {
                    fontFamily: "'Poppins', sans-serif",
                    fontSize: { xs: "0.875rem", sm: "1rem" },
                  },
                  "& .MuiFormHelperText-root": {
                    fontFamily: "'Poppins', sans-serif",
                  },
                }}
              />
            </Box>

            <Box
              sx={{
                p: { xs: 1.5, sm: 2 },
                bgcolor: "#fef2f2",
                border: "1px solid #fecaca",
                borderRadius: "6px",
                mb: { xs: 2, sm: 3 },
              }}
            >
              <Typography
                variant="body2"
                sx={{
                  color: "#dc2626",
                  fontWeight: 500,
                  fontSize: { xs: "0.8rem", sm: "0.875rem" },
                }}
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
                gap: { xs: 1.5, sm: 2 },
                pt: 2,
                borderTop: "1px solid #e2e8f0",
                flexDirection: { xs: "column", sm: "row" },
              }}
            >
              <button
                className="clear-filters-btn"
                onClick={handleCancelPassword}
                disabled={isDeleting}
                style={{
                  order: isMobile ? 2 : 1,
                  minHeight: isMobile ? "44px" : "auto",
                  fontSize: isMobile ? "0.875rem" : "0.9rem",
                }}
              >
                Cancel
              </button>
              <button
                className="delete-btn"
                onClick={handlePasswordConfirm}
                disabled={!password || isDeleting}
                style={{
                  order: isMobile ? 1 : 2,
                  minHeight: isMobile ? "44px" : "auto",
                  fontSize: isMobile ? "0.875rem" : "0.9rem",
                }}
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

  const isMobile = window.innerWidth < 768;
  const isTablet = window.innerWidth >= 768 && window.innerWidth < 1024;

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

  const getResponsiveResponseModalStyles = () => ({
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    width: {
      xs: "95vw",
      sm: "85vw",
      md: "600px",
      lg: "700px",
    },
    maxWidth: {
      xs: "400px",
      sm: "500px",
      md: "600px",
      lg: "700px",
    },
    maxHeight: {
      xs: "95vh",
      sm: "90vh",
      md: "85vh",
    },
    bgcolor: "background.paper",
    borderRadius: {
      xs: "8px",
      sm: "12px",
    },
    boxShadow: 24,
    p: {
      xs: 2,
      sm: 3,
      md: 4,
    },
    overflow: "auto",
    "&:focus-visible": {
      outline: "none",
    },
  });

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
        <div
          className="queries-header"
          style={{
            marginBottom: "0px",
            flexDirection: isMobile ? "column" : "row",
            gap: isMobile ? "12px" : "0px",
            alignItems: isMobile ? "flex-start" : "center",
          }}
        >
          <div className="queries-header-content">
            <h2
              className="queries-title"
              style={{
                fontSize: isMobile ? "1.3rem" : "1.5rem",
              }}
            >
              Staff Queries
            </h2>
            <p
              className="queries-subtitle"
              style={{
                fontSize: isMobile ? "0.8rem" : "0.875rem",
              }}
            >
              {queries.length} Total Queries •{" "}
              {queries.filter((q) => !q.readBy?.length).length} Pending
            </p>
          </div>
          <div
            style={{
              display: "flex",
              gap: "8px",
              alignItems: "center",
              width: isMobile ? "100%" : "auto",
              flexDirection: "row",
              justifyContent: "center",
              marginBottom: 15,
            }}
          >
            <SyncButton
              isSyncing={isSyncing}
              onClick={() => fetchQueries(true)}
              style={{
                width: isMobile ? "100%" : "auto",
                minHeight: isMobile ? "44px" : "auto",
              }}
            />
            <button
              className="add-btn responsive-add-btn"
              onClick={() => setShowDeleteModal(true)}
              disabled={isSyncing || isLoading || queries.length === 0}
            >
              <FaTrash />
              <span className="add-btn-text"> Delete Queries</span>
            </button>
          </div>
        </div>

        <div
          className="queries-stats"
          style={{
            padding: isMobile ? "16px" : "24px",
          }}
        >
          <h3
            style={{
              fontSize: isMobile ? "1rem" : "1.125rem",
            }}
          >
            Query Statistics
          </h3>
          <div className="stat-item">
            <span
              className="stat-label"
              style={{
                fontSize: isMobile ? "0.8rem" : "0.875rem",
              }}
            >
              Total Queries
            </span>
            <span
              className="stat-value"
              style={{
                fontSize: isMobile ? "0.9rem" : "1rem",
              }}
            >
              {queries.length}
            </span>
          </div>
          <div className="stat-item">
            <span
              className="stat-label"
              style={{
                fontSize: isMobile ? "0.8rem" : "0.875rem",
              }}
            >
              Pending Responses
            </span>
            <span
              className="stat-value"
              style={{
                fontSize: isMobile ? "0.9rem" : "1rem",
              }}
            >
              {queries.filter((q) => !q.readBy?.length).length}
            </span>
          </div>
          <div className="stat-item">
            <span
              className="stat-label"
              style={{
                fontSize: isMobile ? "0.8rem" : "0.875rem",
              }}
            >
              Responded
            </span>
            <span
              className="stat-value"
              style={{
                fontSize: isMobile ? "0.9rem" : "1rem",
              }}
            >
              {queries.filter((q) => q.readBy?.length).length}
            </span>
          </div>
        </div>

        <div className="admin-queries-grid">
          <div className="queries-list">
            {!queries.length ? (
              <Paper
                className="query-card"
                style={{
                  textAlign: "center",
                  padding: isMobile ? "12px" : "16px",
                }}
              >
                <p
                  className="query-content"
                  style={{
                    fontSize: isMobile ? "0.8rem" : "0.875rem",
                  }}
                >
                  No queries found
                </p>
              </Paper>
            ) : (
              queries.map((query) => (
                <div
                  key={query._id}
                  className="query-card"
                  style={{
                    padding: isMobile ? "12px" : "16px",
                    marginBottom: isMobile ? "12px" : "16px",
                  }}
                >
                  <div
                    className="query-header"
                    style={{
                      flexDirection: isMobile ? "column" : "row",
                      gap: isMobile ? "8px" : "0px",
                      alignItems: isMobile ? "flex-start" : "flex-start",
                    }}
                  >
                    <div className="query-header-left">
                      <div style={{ width: "100%" }}>
                        <span
                          className={`query-type-chip type-${getQueryType(
                            query.title
                          ).replace("_", "-")}`}
                          style={{
                            fontSize: isMobile ? "0.7rem" : "0.75rem",
                            padding: isMobile ? "4px 8px" : "6px 12px",
                          }}
                        >
                          {QUERY_TYPE_LABELS[getQueryType(query.title)] ||
                            getQueryType(query.title)}
                        </span>
                      </div>
                      <div
                        className="sender-info"
                        style={{
                          flexDirection: isMobile ? "column" : "row",
                          alignItems: isMobile ? "flex-start" : "center",
                          gap: isMobile ? "4px" : "8px",
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                            flexWrap: "wrap",
                          }}
                        >
                          <span
                            className="sender-name"
                            style={{
                              fontSize: isMobile ? "0.8rem" : "0.875rem",
                            }}
                          >
                            {query.sender?.staffId} -{" "}
                            {query.sender?.name || "Unknown"}
                          </span>
                          {query.sender?.isActive === false ? (
                            <span
                              style={{
                                color: "#dc2626",
                                fontSize: isMobile ? "0.65rem" : "0.7rem",
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
                                fontSize: isMobile ? "0.65rem" : "0.7rem",
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
                        <span
                          className="sender-role"
                          style={{
                            fontSize: isMobile ? "0.7rem" : "0.75rem",
                          }}
                        >
                          {formatRole(query.senderRole)}
                        </span>
                      </div>
                    </div>
                    <span
                      className="query-timestamp"
                      style={{
                        fontSize: isMobile ? "0.7rem" : "0.75rem",
                        alignSelf: isMobile ? "flex-start" : "flex-start",
                      }}
                    >
                      {formatDate(query.createdAt)}
                    </span>
                  </div>

                  <div
                    className="query-content"
                    style={{
                      fontSize: isMobile ? "0.8rem" : "0.875rem",
                      margin: isMobile ? "8px 0" : "12px 0",
                    }}
                  >
                    {query.content}
                  </div>

                  {!query.readBy?.length ? (
                    <div
                      className="query-footer"
                      style={{
                        flexDirection: isMobile ? "column" : "row",
                        gap: isMobile ? "8px" : "0px",
                        alignItems: isMobile ? "flex-start" : "center",
                      }}
                    >
                      <div className="query-status">
                        <span className="status-indicator status-pending" />
                        <span
                          style={{
                            fontSize: isMobile ? "0.7rem" : "0.75rem",
                          }}
                        >
                          Pending response
                        </span>
                      </div>
                      <button
                        className="add-btn"
                        onClick={() => {
                          setSelectedQuery(query);
                          setShowResponseModal(true);
                        }}
                        style={{
                          width: isMobile ? "100%" : "auto",
                          minHeight: isMobile ? "36px" : "auto",
                          fontSize: isMobile ? "0.8rem" : "0.875rem",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          textAlign: "center",
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
                          <span
                            style={{
                              fontSize: isMobile ? "0.7rem" : "0.75rem",
                            }}
                          >
                            Responded
                          </span>
                        </div>
                      </div>
                      <div
                        className="admin-response"
                        style={{
                          marginTop: isMobile ? "8px" : "12px",
                          paddingTop: isMobile ? "8px" : "12px",
                        }}
                      >
                        <div
                          className="response-header"
                          style={{
                            flexDirection: isMobile ? "column" : "row",
                            alignItems: isMobile ? "flex-start" : "center",
                            gap: isMobile ? "4px" : "0px",
                            marginBottom: isMobile ? "6px" : "8px",
                          }}
                        >
                          <div className="response-label-container">
                            <span
                              className="response-label"
                              style={{
                                fontSize: isMobile ? "0.8rem" : "0.875rem",
                              }}
                            >
                              Admin Response
                            </span>
                          </div>
                          <span
                            className="response-time"
                            style={{
                              fontSize: isMobile ? "0.7rem" : "0.75rem",
                            }}
                          >
                            {formatDate(query.response?.respondedAt)}
                          </span>
                        </div>
                        <p
                          className="response-text"
                          style={{
                            fontSize: isMobile ? "0.8rem" : "0.875rem",
                          }}
                        >
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
        <Box sx={getResponsiveResponseModalStyles()}>
          <h3
            className="modal-title"
            style={{
              fontSize: isMobile ? "1.1rem" : "1.25rem",
              marginBottom: isMobile ? "12px" : "16px",
            }}
          >
            Respond to Query
          </h3>
          {selectedQuery && (
            <div
              className="original-query"
              style={{
                padding: isMobile ? "8px" : "12px",
                marginBottom: isMobile ? "12px" : "16px",
              }}
            >
              <p
                className="query-type-label"
                style={{
                  fontSize: isMobile ? "0.8rem" : "0.875rem",
                  marginBottom: isMobile ? "6px" : "8px",
                }}
              >
                {QUERY_TYPE_LABELS[getQueryType(selectedQuery.title)] ||
                  getQueryType(selectedQuery.title)}
              </p>
              <p
                className="query-text"
                style={{
                  fontSize: isMobile ? "0.8rem" : "0.875rem",
                }}
              >
                {selectedQuery.content}
              </p>
            </div>
          )}
          <form onSubmit={handleResponse}>
            <TextField
              fullWidth
              multiline
              rows={isMobile ? 3 : 4}
              label="Your Response"
              value={response}
              onChange={(e) => setResponse(e.target.value)}
              required
              margin="normal"
              sx={{
                "& .MuiInputBase-root": {
                  fontSize: { xs: "0.875rem", sm: "1rem" },
                },
                "& .MuiInputLabel-root": {
                  fontSize: { xs: "0.875rem", sm: "1rem" },
                },
              }}
            />
            <Box
              sx={{
                mt: { xs: 3, sm: 4 },
                pt: 2,
                display: "flex",
                justifyContent: "flex-end",
                gap: { xs: 1.5, sm: 2 },
                borderTop: "1px solid #e2e8f0",
                flexDirection: { xs: "column", sm: "row" },
              }}
            >
              <button
                className="clear-filters-btn"
                onClick={() => setShowResponseModal(false)}
                disabled={isLoading}
                style={{
                  order: isMobile ? 2 : 1,
                  minHeight: isMobile ? "44px" : "auto",
                  fontSize: isMobile ? "0.875rem" : "0.9rem",
                }}
              >
                Cancel
              </button>
              <button
                className="add-btn"
                type="submit"
                disabled={isLoading}
                style={{
                  order: isMobile ? 1 : 2,
                  minHeight: isMobile ? "44px" : "auto",
                  fontSize: isMobile ? "0.875rem" : "0.9rem",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  textAlign: "center",
                }}
              >
                {isLoading ? (
                  <div
                    className="loading-spinner"
                    style={{
                      margin: "0 auto",
                    }}
                  ></div>
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
