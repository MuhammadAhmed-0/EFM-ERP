import React, { useState } from "react";
import {
  Box,
  Button,
  Typography,
  TextField,
  Tooltip,
  Switch,
  FormControlLabel,
  CircularProgress,
  Snackbar,
  Alert,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import { format } from "date-fns";
import axios from "axios";
import {
  FaUser,
  FaEnvelope,
  FaPhone,
  FaMapMarkerAlt,
  FaClock,
  FaMoneyBillWave,
  FaCalendarAlt,
  FaGraduationCap,
  FaUserFriends,
  FaHandshake,
  FaHistory,
  FaInfoCircle,
} from "react-icons/fa";
import "../../../../../styles/components/ViewClient.css";
import {
  formatTimeToAMPM,
  calculateDuration,
} from "../../../../../utils/helpers";

const POPPINS_FONT =
  "'Poppins', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";

const InfoRow = ({ label, value, icon: Icon, isMobile }) => (
  <Box
    sx={{
      display: "flex",
      alignItems: "flex-start",
      gap: isMobile ? 1 : 1.5,
      mb: isMobile ? 1.5 : 2,
    }}
  >
    {Icon && (
      <Icon
        size={isMobile ? 14 : 16}
        style={{ color: "#64748b", marginTop: "4px" }}
      />
    )}
    <Box>
      <Typography
        variant="body2"
        sx={{
          color: "#64748b",
          mb: 0.5,
          fontSize: isMobile ? "0.75rem" : "0.875rem",
          fontFamily: POPPINS_FONT,
        }}
      >
        {label}
      </Typography>
      <Typography
        sx={{
          fontFamily: POPPINS_FONT,
          fontSize: isMobile ? "0.875rem" : "1rem",
        }}
      >
        {value || "Not provided"}
      </Typography>
    </Box>
  </Box>
);

const StudentInfoGrid = ({
  label1,
  value1,
  icon1,
  label2,
  value2,
  icon2,
  isMobile,
}) => (
  <Box
    sx={{
      display: "flex",
      flexDirection: isMobile ? "column" : "row",
      justifyContent: "space-between",
      mb: isMobile ? 1.5 : 2,
      gap: isMobile ? 1 : 0,
    }}
  >
    <Box sx={{ width: label2 && !isMobile ? "48%" : "100%" }}>
      <InfoRow label={label1} value={value1} icon={icon1} isMobile={isMobile} />
    </Box>
    {label2 && value2 && icon2 && (
      <Box sx={{ width: isMobile ? "100%" : "48%" }}>
        <InfoRow
          label={label2}
          value={value2}
          icon={icon2}
          isMobile={isMobile}
        />
      </Box>
    )}
  </Box>
);

const formatRole = (role) => {
  switch (role) {
    case "supervisor_quran":
      return "Quran Supervisor";
    case "supervisor_subjects":
      return "Subjects Supervisor";
    case "teacher_quran":
      return "Quran Teacher";
    case "teacher_subjects":
      return "Subjects Teacher";
    case "admin":
      return "Admin";
    default:
      return role
        .split("_")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");
  }
};

const StatusHistoryTimeline = ({
  statusDateHistory,
  statusDates,
  isMobile,
}) => {
  const statusColors = {
    trial: "#3b82f6",
    regular: "#10b981",
    drop: "#ef4444",
    freeze: "#a855f7",
    completed: "#f59e0b",
  };

  const statusHistory = React.useMemo(() => {
    const result = {
      trial: [],
      regular: [],
      drop: [],
      completed: [],
      freeze: [],
    };

    if (statusDateHistory) {
      Object.entries(statusDateHistory).forEach(([status, dates]) => {
        if (Array.isArray(dates) && dates.length > 0) {
          result[status] = [...dates].sort(
            (a, b) => new Date(b.date) - new Date(a.date)
          );
        }
      });
    }

    if (statusDates) {
      Object.entries(statusDates).forEach(([status, data]) => {
        if (data && data.date) {
          const dateExists = result[status].some(
            (entry) =>
              Math.abs(new Date(entry.date) - new Date(data.date)) < 1000
          );

          if (!dateExists) {
            result[status].push({
              date: data.date,
              addedBy: data.addedBy,
            });
          }
        }
      });
    }

    return result;
  }, [statusDateHistory, statusDates]);

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: isMobile ? "column" : "row",
        flexWrap: isMobile ? "nowrap" : "wrap",
        gap: isMobile ? 2 : "4%",
        mb: isMobile ? 3 : 4,
      }}
    >
      {Object.entries(statusHistory).map(([status, dates]) => (
        <Box
          key={status}
          sx={{
            p: isMobile ? 1.5 : 2,
            border: "1px solid #e2e8f0",
            borderRadius: "8px",
            bgcolor: "#f8fafc",
            mb: isMobile ? 1 : 2,
            width: isMobile ? "100%" : "48%",
          }}
        >
          <Typography
            variant="subtitle2"
            sx={{
              fontFamily: POPPINS_FONT,
              fontWeight: 600,
              mb: 1,
              fontSize: isMobile ? "0.875rem" : "1rem",
            }}
          >
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </Typography>

          {dates.length > 0 ? (
            <Box sx={{ ml: isMobile ? 0.5 : 1 }}>
              {dates.map((entry, idx) => (
                <Box
                  key={`${status}-${idx}`}
                  sx={{
                    display: "flex",
                    alignItems: "flex-start",
                    mb: idx < dates.length - 1 ? 1 : 0,
                    pb: idx < dates.length - 1 ? 1 : 0,
                    borderBottom:
                      idx < dates.length - 1 ? "1px dashed #e2e8f0" : "none",
                  }}
                >
                  <Box sx={{ display: "flex", alignItems: "center", mt: 0.5 }}>
                    <Box
                      sx={{
                        width: isMobile ? "6px" : "8px",
                        height: isMobile ? "6px" : "8px",
                        borderRadius: "50%",
                        bgcolor: statusColors[status],
                        mr: isMobile ? 0.5 : 1,
                      }}
                    />
                  </Box>
                  <Box>
                    <Typography
                      variant="body2"
                      sx={{
                        color: "#64748b",
                        fontSize: isMobile ? "0.75rem" : "0.875rem",
                        fontFamily: POPPINS_FONT,
                      }}
                    >
                      {status === "freeze" ? (
                        <>
                          <Typography
                            variant="body2"
                            sx={{
                              color: "#64748b",
                              fontSize: isMobile ? "0.75rem" : "0.875rem",
                              fontFamily: POPPINS_FONT,
                            }}
                          >
                            <Box
                              component="span"
                              sx={{ fontWeight: "500", color: "#a855f7" }}
                            >
                              Started:
                            </Box>{" "}
                            {format(
                              new Date(entry.date),
                              isMobile ? "dd/MM/yy" : "dd/MM/yyyy hh:mm a"
                            )}
                          </Typography>

                          {entry.endDate ? (
                            <>
                              <Typography
                                variant="body2"
                                sx={{
                                  color: "#64748b",
                                  fontSize: isMobile ? "0.75rem" : "0.875rem",
                                  fontFamily: POPPINS_FONT,
                                }}
                              >
                                <Box
                                  component="span"
                                  sx={{ fontWeight: "500", color: "#a855f7" }}
                                >
                                  Ended:
                                </Box>{" "}
                                {format(
                                  new Date(entry.endDate),
                                  isMobile ? "dd/MM/yy" : "dd/MM/yyyy hh:mm a"
                                )}
                              </Typography>
                              <Typography
                                variant="body2"
                                sx={{
                                  color: "#64748b",
                                  fontSize: isMobile
                                    ? "0.6875rem"
                                    : "0.8125rem",
                                  fontFamily: POPPINS_FONT,
                                }}
                              >
                                Duration:{" "}
                                {calculateDuration(entry.date, entry.endDate)}
                              </Typography>
                              {new Date(entry.endDate) < new Date() ? (
                                <Typography
                                  variant="body2"
                                  sx={{
                                    color: "#10b981",
                                    fontWeight: "500",
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 0.5,
                                    fontSize: isMobile ? "0.75rem" : "0.875rem",
                                    fontFamily: POPPINS_FONT,
                                  }}
                                >
                                  Completed
                                  <Tooltip title="This freeze period has ended">
                                    <Box
                                      component="span"
                                      sx={{ display: "inline-flex" }}
                                    >
                                      <FaInfoCircle size={isMobile ? 10 : 12} />
                                    </Box>
                                  </Tooltip>
                                </Typography>
                              ) : (
                                <Typography
                                  variant="body2"
                                  sx={{
                                    color: "#a855f7",
                                    fontWeight: "500",
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 0.5,
                                    fontSize: isMobile ? "0.75rem" : "0.875rem",
                                    fontFamily: POPPINS_FONT,
                                  }}
                                >
                                  Scheduled to end
                                  <Tooltip title="The freeze will automatically end on the specified date">
                                    <Box
                                      component="span"
                                      sx={{ display: "inline-flex" }}
                                    >
                                      <FaInfoCircle size={isMobile ? 10 : 12} />
                                    </Box>
                                  </Tooltip>
                                </Typography>
                              )}
                            </>
                          ) : (
                            <>
                              <Typography
                                variant="body2"
                                sx={{
                                  color: "#a855f7",
                                  fontWeight: "500",
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: 0.5,
                                  fontSize: isMobile ? "0.75rem" : "0.875rem",
                                  fontFamily: POPPINS_FONT,
                                }}
                              >
                                Active freeze
                                <Box
                                  component="span"
                                  sx={{
                                    display: "inline-block",
                                    width: isMobile ? "6px" : "8px",
                                    height: isMobile ? "6px" : "8px",
                                    borderRadius: "50%",
                                    bgcolor: "#a855f7",
                                    animation: "pulse 1.5s infinite",
                                    "@keyframes pulse": {
                                      "0%": { opacity: 1 },
                                      "50%": { opacity: 0.4 },
                                      "100%": { opacity: 1 },
                                    },
                                  }}
                                />
                                <Tooltip title="This freeze is currently active with no end date">
                                  <Box
                                    component="span"
                                    sx={{ display: "inline-flex", ml: 0.5 }}
                                  >
                                    <FaInfoCircle size={isMobile ? 10 : 12} />
                                  </Box>
                                </Tooltip>
                              </Typography>
                              <Typography
                                variant="body2"
                                sx={{
                                  color: "#64748b",
                                  fontSize: isMobile
                                    ? "0.6875rem"
                                    : "0.8125rem",
                                  fontFamily: POPPINS_FONT,
                                }}
                              >
                                Duration so far: {calculateDuration(entry.date)}
                              </Typography>
                            </>
                          )}
                        </>
                      ) : (
                        format(
                          new Date(entry.date),
                          isMobile ? "dd/MM/yy" : "dd/MM/yyyy hh:mm a"
                        )
                      )}
                    </Typography>
                  </Box>
                </Box>
              ))}
            </Box>
          ) : (
            <Typography
              variant="body2"
              sx={{
                color: "#64748b",
                fontStyle: "italic",
                fontSize: isMobile ? "0.75rem" : "0.875rem",
                fontFamily: POPPINS_FONT,
              }}
            >
              Not set
            </Typography>
          )}
        </Box>
      ))}
    </Box>
  );
};

const SubjectToggleButton = ({
  student,
  subject,
  isActive,
  onToggle,
  isLoading,
  loadingStates,
  isMobile,
}) => {
  const toggleId = `${student.user._id}-${subject._id}`;
  const isToggleLoading = loadingStates[toggleId] || false;

  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        flexDirection: isMobile ? "column" : "row",
        gap: isMobile ? 0.5 : 1,
        mt: 1,
        p: isMobile ? 1 : 1.5,
        bgcolor: isActive ? "#f0f9ff" : "#fef2f2",
        border: `1px solid ${isActive ? "#bae6fd" : "#fecaca"}`,
        borderRadius: "6px",
      }}
    >
      <Typography
        variant="body2"
        sx={{
          fontFamily: POPPINS_FONT,
          color: isActive ? "#0369a1" : "#dc2626",
          fontWeight: 500,
          fontSize: isMobile ? "0.75rem" : "0.8125rem",
        }}
      >
        {isActive ? "Active" : "Inactive"}
      </Typography>

      <FormControlLabel
        control={
          <Switch
            checked={isActive}
            onChange={() => onToggle(student.user._id, subject._id, !isActive)}
            disabled={isToggleLoading}
            size="small"
            sx={{
              "& .MuiSwitch-switchBase.Mui-checked": {
                color: "#10b981",
              },
              "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track": {
                backgroundColor: "#10b981",
              },
              "& .MuiSwitch-track": {
                backgroundColor: isToggleLoading ? "#e5e7eb" : "#ef4444",
              },
            }}
          />
        }
        label={
          isToggleLoading ? (
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <CircularProgress size={isMobile ? 12 : 14} />
              <Typography
                variant="caption"
                sx={{
                  color: "#64748b",
                  fontSize: isMobile ? "0.6875rem" : "0.75rem",
                  fontFamily: POPPINS_FONT,
                }}
              >
                {isActive ? "Deactivating..." : "Activating..."}
              </Typography>
            </Box>
          ) : (
            <Typography
              variant="caption"
              sx={{
                color: "#64748b",
                fontSize: isMobile ? "0.6875rem" : "0.75rem",
                fontFamily: POPPINS_FONT,
              }}
            >
              {isActive ? "Deactivate" : "Activate"}
            </Typography>
          )
        }
        sx={{
          ml: isMobile ? 0 : 0.5,
          "& .MuiFormControlLabel-label": {
            fontSize: isMobile ? "0.6875rem" : "0.75rem",
          },
        }}
      />
    </Box>
  );
};

const ViewClientModal = ({
  client,
  setShowModal,
  modalStyle,
  adminPassword,
  setAdminPassword,
  passwordError,
  isInfoVisible,
  handleAdminPasswordSubmit,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const isSmallMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const [clientData, setClientData] = useState(client);
  const [loadingStates, setLoadingStates] = useState({});
  const [notification, setNotification] = useState({
    show: false,
    message: "",
    type: "success",
  });

  const BASE_URL = import.meta.env.VITE_BASE_URL;

  // Get subject status for a student and subject
  const getSubjectStatus = (student, subjectId) => {
    if (!student.subjectStatus || student.subjectStatus.length === 0) {
      return true; // Default to active if no status found
    }

    const status = student.subjectStatus.find(
      (status) => status.subject.toString() === subjectId.toString()
    );

    return status ? status.isActive : true; // Default to active if no specific status found
  };

  const showNotification = (message, type = "success") => {
    setNotification({
      show: true,
      message,
      type,
    });
  };

  const handleSubjectToggle = async (studentId, subjectId, shouldActivate) => {
    const toggleId = `${studentId}-${subjectId}`;

    setLoadingStates((prev) => ({
      ...prev,
      [toggleId]: true,
    }));

    try {
      const endpoint = shouldActivate ? "reactivate" : "deactivate";
      const token = localStorage.getItem("token");

      const response = await axios.patch(
        `${BASE_URL}/api/admin/${studentId}/subjects/${subjectId}/${endpoint}`,
        {
          reason: shouldActivate
            ? "Subject reactivated from client management"
            : "Subject deactivated from client management",
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.data.success) {
        // Update the client data with new subject status
        setClientData((prevClient) => {
          const updatedClient = { ...prevClient };
          const studentIndex = updatedClient.students.findIndex(
            (s) => s.user._id === studentId
          );

          if (studentIndex !== -1) {
            const student = { ...updatedClient.students[studentIndex] };

            // Update or create subject status
            if (!student.subjectStatus) {
              student.subjectStatus = [];
            }

            const statusIndex = student.subjectStatus.findIndex(
              (status) => status.subject.toString() === subjectId.toString()
            );

            if (statusIndex !== -1) {
              student.subjectStatus[statusIndex] = {
                ...student.subjectStatus[statusIndex],
                isActive: shouldActivate,
              };
            } else {
              student.subjectStatus.push({
                subject: subjectId,
                isActive: shouldActivate,
                activationHistory: [],
                deactivationHistory: [],
                currentStatus: {},
              });
            }

            updatedClient.students[studentIndex] = student;
          }

          return updatedClient;
        });

        showNotification(
          `Subject ${
            shouldActivate ? "activated" : "deactivated"
          } successfully`,
          "success"
        );
      }
    } catch (error) {
      console.error("Error toggling subject status:", error);
      showNotification(
        error.response?.data?.message ||
          `Error ${shouldActivate ? "activating" : "deactivating"} subject`,
        "error"
      );
    } finally {
      setLoadingStates((prev) => ({
        ...prev,
        [toggleId]: false,
      }));
    }
  };

  const modalBaseStyles = {
    ...modalStyle,
    width: isMobile ? "95vw" : "800px",
    maxWidth: isMobile ? "none" : "800px",
    maxHeight: "90vh",
    display: "flex",
    flexDirection: "column",
    fontFamily: POPPINS_FONT,
    p: isMobile ? 2 : 4,
  };

  const scrollableContentStyles = {
    overflowY: "auto",
    flex: 1,
    pr: isMobile ? 1 : 2,
    mt: isMobile ? 2 : 3,
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

  const sectionHeaderStyles = {
    fontFamily: POPPINS_FONT,
    fontWeight: 600,
    mb: isMobile ? 1.5 : 2,
    fontSize: isMobile ? "1rem" : "1.125rem",
  };

  const sectionCardStyles = {
    p: isMobile ? 2 : 3,
    border: "1px solid #e2e8f0",
    borderRadius: "8px",
    bgcolor: "#f8fafc",
    mb: isMobile ? 3 : 4,
  };

  return (
    <Box sx={modalBaseStyles}>
      {/* Header */}
      <Box
        sx={{
          borderBottom: "1px solid #e2e8f0",
          pb: isMobile ? 1.5 : 2,
          display: "flex",
          flexDirection: isMobile ? "column" : "row",
          justifyContent: "space-between",
          alignItems: isMobile ? "flex-start" : "center",
          gap: isMobile ? 1 : 0,
        }}
      >
        <Box>
          <Typography
            variant="h5"
            sx={{
              fontFamily: POPPINS_FONT,
              fontWeight: 600,
              fontSize: isMobile ? "1.25rem" : "1.5rem",
            }}
          >
            {clientData.clientName}
          </Typography>
          <Typography
            variant="body2"
            sx={{
              color: "#64748b",
              fontSize: isMobile ? "0.75rem" : "0.875rem",
              fontFamily: POPPINS_FONT,
            }}
          >
            Client ID: {clientData.clientId}
          </Typography>
        </Box>
        <Button
          onClick={() => {
            setShowModal(false);
            setAdminPassword("");
          }}
          sx={{
            minWidth: isMobile ? "28px" : "32px",
            height: isMobile ? "28px" : "32px",
            p: 0,
            borderRadius: "50%",
            color: "#64748b",
            alignSelf: isMobile ? "flex-end" : "auto",
            fontSize: isMobile ? "1.25rem" : "1.5rem",
            "&:hover": {
              bgcolor: "#f1f5f9",
            },
          }}
        >
          ×
        </Button>
      </Box>

      <Box sx={scrollableContentStyles}>
        <Typography variant="subtitle1" sx={sectionHeaderStyles}>
          Basic Information
        </Typography>
        <Box sx={sectionCardStyles}>
          {isInfoVisible ? (
            <>
              <StudentInfoGrid
                label1="Email"
                value1={clientData.user?.email}
                icon1={FaEnvelope}
                label2="Contact"
                value2={clientData.contactNo || "Not provided"}
                icon2={FaPhone}
                isMobile={isMobile}
              />
            </>
          ) : (
            <Box sx={{ mt: 2, mb: 2 }}>
              <Typography
                variant="subtitle2"
                sx={{
                  mb: 2,
                  fontWeight: "bold",
                  fontSize: isMobile ? "0.875rem" : "1rem",
                  fontFamily: POPPINS_FONT,
                }}
              >
                Enter Admin Password to View Sensitive Information
              </Typography>
              <TextField
                fullWidth
                type="password"
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                error={!!passwordError}
                helperText={passwordError}
                placeholder="Enter password"
                size={isMobile ? "small" : "medium"}
                sx={{
                  mb: 2,
                  "& .MuiOutlinedInput-root": {
                    bgcolor: "#fff",
                    fontSize: isMobile ? "0.875rem" : "1rem",
                  },
                  "& .MuiFormHelperText-root": {
                    fontSize: isMobile ? "0.75rem" : "0.875rem",
                  },
                }}
              />
              <Button
                fullWidth
                variant="contained"
                onClick={handleAdminPasswordSubmit}
                size={isMobile ? "medium" : "large"}
                sx={{
                  bgcolor: "#1f3d61",
                  fontSize: isMobile ? "0.875rem" : "1rem",
                  py: isMobile ? 1.25 : 1.5,
                  "&:hover": {
                    bgcolor: "#1f3d70",
                  },
                }}
              >
                View Sensitive Information
              </Button>
            </Box>
          )}

          <StudentInfoGrid
            label1="Country"
            value1={clientData.country}
            icon1={FaMapMarkerAlt}
            label2="State"
            value2={clientData.state}
            icon2={FaMapMarkerAlt}
            isMobile={isMobile}
          />
          <StudentInfoGrid
            label1="Total Fee"
            value1={`${clientData.totalFee} ${clientData.currency}`}
            icon1={FaMoneyBillWave}
            label2="Shift"
            value2={clientData.shift}
            icon2={FaClock}
            isMobile={isMobile}
          />
        </Box>

        <Typography variant="subtitle1" sx={sectionHeaderStyles}>
          Referral Information
        </Typography>
        <Box sx={sectionCardStyles}>
          {clientData.referredByClient ? (
            <>
              <StudentInfoGrid
                label1="Referred By"
                value1={clientData.referredByClient.name}
                icon1={FaUserFriends}
                label2="Referred On"
                value2={
                  clientData.referralRecords?.[0]?.referredOn
                    ? format(
                        new Date(clientData.referralRecords[0].referredOn),
                        "dd/MM/yyyy"
                      )
                    : "Not specified"
                }
                icon2={FaCalendarAlt}
                isMobile={isMobile}
              />
              <InfoRow
                label="Referral Handled By"
                value={
                  clientData.referralHandledBy
                    ? `${clientData.referralHandledBy.name} (${formatRole(
                        clientData.referralHandledBy.role
                      )})`
                    : "Not specified"
                }
                icon={FaHandshake}
                isMobile={isMobile}
              />
              <InfoRow
                label="Total Referrals"
                value={clientData.totalReferrals || 0}
                icon={FaUserFriends}
                isMobile={isMobile}
              />
            </>
          ) : (
            <Typography
              sx={{
                color: "#64748b",
                fontStyle: "italic",
                fontSize: isMobile ? "0.875rem" : "1rem",
                fontFamily: POPPINS_FONT,
              }}
            >
              No referral information
            </Typography>
          )}
        </Box>

        <Typography variant="subtitle1" sx={sectionHeaderStyles}>
          Status History
        </Typography>
        <StatusHistoryTimeline
          statusDateHistory={clientData.statusDateHistory}
          statusDates={clientData.statusDates}
          isMobile={isMobile}
        />

        {clientData.remarks && (
          <>
            <Typography variant="subtitle1" sx={sectionHeaderStyles}>
              Remarks
            </Typography>
            <Box
              sx={{
                p: isMobile ? 1.5 : 2,
                border: "1px solid #e2e8f0",
                borderRadius: "8px",
                bgcolor: "#f8fafc",
                mb: isMobile ? 3 : 4,
              }}
            >
              <Typography
                sx={{
                  fontFamily: POPPINS_FONT,
                  fontSize: isMobile ? "0.875rem" : "1rem",
                }}
              >
                {clientData.remarks}
              </Typography>
            </Box>
          </>
        )}

        <Typography variant="subtitle1" sx={sectionHeaderStyles}>
          System Information
        </Typography>
        <Box sx={sectionCardStyles}>
          <StudentInfoGrid
            label1="Registration Date"
            value1={format(new Date(clientData.registrationDate), "dd/MM/yyyy")}
            icon1={FaCalendarAlt}
            label2="Number of Students"
            value2={clientData.numberOfStudents || 0}
            icon2={FaGraduationCap}
            isMobile={isMobile}
          />
          <StudentInfoGrid
            label1="Created At"
            value1={format(
              new Date(clientData.createdAt),
              isMobile ? "dd/MM/yy HH:mm" : "dd/MM/yyyy HH:mm"
            )}
            icon1={FaHistory}
            label2="Last Updated"
            value2={format(
              new Date(clientData.updatedAt),
              isMobile ? "dd/MM/yy HH:mm" : "dd/MM/yyyy HH:mm"
            )}
            icon2={FaHistory}
            isMobile={isMobile}
          />
        </Box>

        <Typography variant="subtitle1" sx={sectionHeaderStyles}>
          Students ({clientData.numberOfStudents || 0})
        </Typography>
        {clientData.students?.length > 0 ? (
          clientData.students.map((student) => (
            <Box
              key={student._id}
              sx={{
                p: isMobile ? 2 : 3,
                border: "1px solid #e2e8f0",
                borderRadius: "8px",
                mb: 2,
                "&:last-child": { mb: 0 },
              }}
            >
              <Box
                sx={{
                  display: "flex",
                  flexDirection: isMobile ? "column" : "row",
                  justifyContent: "space-between",
                  alignItems: isMobile ? "flex-start" : "center",
                  mb: 2,
                  gap: isMobile ? 1 : 0,
                }}
              >
                <Typography
                  variant="h6"
                  sx={{
                    fontFamily: POPPINS_FONT,
                    fontWeight: 600,
                    fontSize: isMobile ? "1rem" : "1.125rem",
                  }}
                >
                  {student.name}
                </Typography>
                <span
                  className={`status-tag ${student.status || "trial"}`}
                  style={{
                    fontSize: isMobile ? "0.75rem" : "0.875rem",
                    padding: isMobile ? "2px 6px" : "4px 8px",
                  }}
                >
                  {(student.status || "trial").charAt(0).toUpperCase() +
                    (student.status || "trial").slice(1)}
                </span>
              </Box>

              <StudentInfoGrid
                label1="Student ID"
                value1={student.studentId}
                icon1={FaUser}
                label2="Grade"
                value2={`Grade ${student.grade}`}
                icon2={FaGraduationCap}
                isMobile={isMobile}
              />

              <StudentInfoGrid
                label1="Enrollment Date"
                value1={format(new Date(student.enrollmentDate), "dd/MM/yyyy")}
                icon1={FaCalendarAlt}
                isMobile={isMobile}
              />

              {/* Subjects and Teachers Section with Toggle */}
              {student.assignedTeachers?.length > 0 && (
                <Box sx={{ mt: 2 }}>
                  <Typography
                    variant="body2"
                    sx={{
                      ...sectionHeaderStyles,
                      fontSize: isMobile ? "0.875rem" : "1rem",
                    }}
                  >
                    Subjects & Teachers
                  </Typography>
                  <Box
                    sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}
                  >
                    {student.assignedTeachers.map((assignment) => {
                      const isActive = getSubjectStatus(
                        student,
                        assignment.subject._id._id
                      );

                      return (
                        <Box
                          key={assignment._id}
                          sx={{
                            p: isMobile ? 1.5 : 2,
                            border: "1px solid #e2e8f0",
                            borderRadius: "6px",
                            bgcolor: "#f8fafc",
                          }}
                        >
                          <Box
                            sx={{
                              display: "flex",
                              flexDirection: isMobile ? "column" : "row",
                              justifyContent: "space-between",
                              mb: 1,
                              alignItems: isMobile ? "flex-start" : "center",
                              gap: isMobile ? 0.5 : 0,
                            }}
                          >
                            <Typography
                              sx={{
                                fontFamily: POPPINS_FONT,
                                fontWeight: 500,
                                fontSize: isMobile ? "0.875rem" : "1rem",
                              }}
                            >
                              {assignment.subject.name}
                            </Typography>
                            <Typography
                              sx={{
                                fontFamily: POPPINS_FONT,
                                fontSize: isMobile ? "0.8125rem" : "0.875rem",
                                color: isMobile ? "#64748b" : "inherit",
                              }}
                            >
                              {assignment.teacher.name}
                            </Typography>
                          </Box>

                          <Box
                            sx={{
                              display: "flex",
                              flexDirection: isMobile ? "column" : "row",
                              justifyContent: "space-between",
                              alignItems: isMobile ? "flex-start" : "center",
                              gap: isMobile ? 0.5 : 0,
                            }}
                          >
                            <Typography
                              variant="body2"
                              sx={{
                                color: "#64748b",
                                fontSize: isMobile ? "0.75rem" : "0.875rem",
                                fontFamily: POPPINS_FONT,
                              }}
                            >
                              Started:{" "}
                              {format(
                                new Date(assignment.startDate),
                                "dd/MM/yyyy"
                              )}
                            </Typography>
                            {assignment.isTemporary && (
                              <Typography
                                variant="caption"
                                sx={{
                                  color: "#9333ea",
                                  bgcolor: "#f3e8ff",
                                  px: isMobile ? 1 : 1.5,
                                  py: 0.5,
                                  borderRadius: "4px",
                                  fontWeight: 500,
                                  fontSize: isMobile ? "0.6875rem" : "0.75rem",
                                  fontFamily: POPPINS_FONT,
                                }}
                              >
                                Temporary Teacher
                              </Typography>
                            )}
                          </Box>

                          {/* Subject Status Toggle */}
                          <SubjectToggleButton
                            student={student}
                            subject={assignment.subject._id}
                            isActive={isActive}
                            onToggle={handleSubjectToggle}
                            loadingStates={loadingStates}
                            isMobile={isMobile}
                          />

                          {/* Add class schedule information */}
                          {assignment.classSchedule && (
                            <Box
                              sx={{
                                mt: 2,
                                pt: 2,
                                borderTop: "1px dashed #e2e8f0",
                              }}
                            >
                              <Box
                                sx={{
                                  display: "flex",
                                  flexDirection: isMobile ? "column" : "row",
                                  justifyContent: "space-between",
                                  alignItems: isMobile
                                    ? "flex-start"
                                    : "center",
                                  mb: 1.5,
                                  gap: isMobile ? 0.5 : 0,
                                }}
                              >
                                <Typography
                                  sx={{
                                    fontFamily: POPPINS_FONT,
                                    fontWeight: 500,
                                    color: "#1f3d61",
                                    fontSize: isMobile ? "0.875rem" : "1rem",
                                  }}
                                >
                                  Class Timings
                                </Typography>

                                {assignment.classSchedule.isPermanentChange && (
                                  <Box
                                    sx={{
                                      display: "inline-block",
                                      px: isMobile ? 1 : 1.5,
                                      py: 0.5,
                                      borderRadius: "4px",
                                      bgcolor: "#e0f2fe",
                                      color: "#0284c7",
                                      fontSize: isMobile
                                        ? "0.6875rem"
                                        : "0.75rem",
                                      fontWeight: 500,
                                      fontFamily: POPPINS_FONT,
                                    }}
                                  >
                                    Permanent Change
                                  </Box>
                                )}
                              </Box>

                              <Box
                                sx={{
                                  display: "grid",
                                  gridTemplateColumns: "1fr",
                                  gap: 2,
                                }}
                              >
                                <Box>
                                  <Typography
                                    variant="body2"
                                    sx={{
                                      color: "#64748b",
                                      mb: 0.5,
                                      fontSize: isMobile
                                        ? "0.75rem"
                                        : "0.875rem",
                                      fontFamily: POPPINS_FONT,
                                    }}
                                  >
                                    Time
                                  </Typography>
                                  <Typography
                                    sx={{
                                      fontFamily: POPPINS_FONT,
                                      fontSize: isMobile ? "0.875rem" : "1rem",
                                    }}
                                  >
                                    {formatTimeToAMPM(
                                      assignment.classSchedule.startTime
                                    )}{" "}
                                    -{" "}
                                    {formatTimeToAMPM(
                                      assignment.classSchedule.endTime
                                    )}
                                  </Typography>
                                </Box>
                              </Box>
                            </Box>
                          )}
                        </Box>
                      );
                    })}
                  </Box>
                </Box>
              )}
            </Box>
          ))
        ) : (
          <Typography
            sx={{
              color: "#64748b",
              fontStyle: "italic",
              fontSize: isMobile ? "0.875rem" : "1rem",
              fontFamily: POPPINS_FONT,
            }}
          >
            No students enrolled
          </Typography>
        )}
      </Box>

      {/* Notification Snackbar */}
      <Snackbar
        open={notification.show}
        autoHideDuration={6000}
        onClose={() => setNotification({ ...notification, show: false })}
        anchorOrigin={{
          vertical: "top",
          horizontal: isMobile ? "center" : "right",
        }}
      >
        <Alert
          onClose={() => setNotification({ ...notification, show: false })}
          severity={notification.type}
          sx={{
            width: "100%",
            fontSize: isMobile ? "0.875rem" : "1rem",
          }}
        >
          {notification.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default ViewClientModal;
