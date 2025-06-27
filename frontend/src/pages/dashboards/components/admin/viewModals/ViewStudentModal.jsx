import React, { useEffect, useState } from "react";
import {
  Box,
  Button,
  Typography,
  Tooltip,
  Switch,
  FormControlLabel,
  CircularProgress,
} from "@mui/material";
import { format } from "date-fns";
import {
  FaUser,
  FaCalendarAlt,
  FaGraduationCap,
  FaHistory,
  FaClock,
  FaUserFriends,
  FaInfoCircle,
  FaBook,
} from "react-icons/fa";
import {
  formatTimeToAMPM,
  calculateDuration,
} from "../../../../../utils/helpers";
import axios from "axios";
import useNotification from "../../../../../hooks/useNotification";
import NotificationSnackbar from "../../../../../components/common/NotificationSnackbar";
const POPPINS_FONT =
  "'Poppins', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";

const typographyStyles = {
  fontFamily: POPPINS_FONT,
};

const sectionHeaderStyles = {
  ...typographyStyles,
  fontWeight: 600,
  mb: 2,
};

const sectionCardStyles = {
  p: 3,
  border: "1px solid #e2e8f0",
  borderRadius: "8px",
  bgcolor: "#f8fafc",
  mb: 4,
};

const textStyles = {
  ...typographyStyles,
  color: "#64748b",
};

const InfoRow = ({ label, value, icon: Icon }) => (
  <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1.5, mb: 2 }}>
    {Icon && <Icon size={16} style={{ color: "#64748b", marginTop: "4px" }} />}
    <Box>
      <Typography variant="body2" sx={{ ...textStyles, mb: 0.5 }}>
        {label}
      </Typography>
      <Typography sx={typographyStyles}>{value || "Not provided"}</Typography>
    </Box>
  </Box>
);

const StudentInfoGrid = ({ label1, value1, icon1, label2, value2, icon2 }) => (
  <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}>
    <Box sx={{ width: label2 ? "48%" : "100%" }}>
      <InfoRow label={label1} value={value1} icon={icon1} />
    </Box>
    {label2 && value2 && icon2 && (
      <Box sx={{ width: "48%" }}>
        <InfoRow label={label2} value={value2} icon={icon2} />
      </Box>
    )}
  </Box>
);

const StatusHistoryTimeline = ({ statusDateHistory, statusDates }) => {
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
              addedByName: data.addedByName,
            });
          }
        }
      });
    }

    return result;
  }, [statusDateHistory, statusDates]);

  const getScheduledStatusChanges = () => {
    const scheduledChanges = [];
    Object.entries(statusDateHistory || {}).forEach(([status, entries]) => {
      if (Array.isArray(entries)) {
        entries.forEach((entry) => {
          if (
            entry.scheduledBy &&
            entry.scheduledAt &&
            new Date(entry.date) > new Date()
          ) {
            scheduledChanges.push({
              status,
              date: new Date(entry.date),
              scheduledAt: new Date(entry.scheduledAt),
              scheduledBy: entry.scheduledBy,
            });
          }
        });
      }
    });
    return scheduledChanges.sort((a, b) => a.date - b.date);
  };

  const scheduledChanges = React.useMemo(
    () => getScheduledStatusChanges(),
    [statusDateHistory]
  );

  return (
    <>
      {scheduledChanges.length > 0 && (
        <Box
          sx={{
            p: 2,
            border: "1px solid #e2e8f0",
            borderRadius: "8px",
            bgcolor: "#fff8e6",
            mb: 4,
            width: "100%",
          }}
        >
          <Typography
            variant="subtitle2"
            sx={{ ...sectionHeaderStyles, mb: 1, color: "#f59e0b" }}
          >
            Scheduled Status Changes
          </Typography>

          {scheduledChanges.map((change, idx) => (
            <Box
              key={idx}
              sx={{
                display: "flex",
                alignItems: "flex-start",
                mb: 1,
              }}
            >
              <Box
                sx={{
                  width: "8px",
                  height: "8px",
                  borderRadius: "50%",
                  bgcolor: statusColors[change.status],
                  mr: 1,
                  mt: 1,
                }}
              />
              <Box>
                <Typography
                  variant="body2"
                  sx={{ ...textStyles, fontWeight: 500 }}
                >
                  Will change to{" "}
                  {change.status.charAt(0).toUpperCase() +
                    change.status.slice(1)}{" "}
                  on {format(change.date, "dd/MM/yyyy hh:mm a")}
                </Typography>
                <Typography variant="caption" sx={textStyles}>
                  Scheduled on {format(change.scheduledAt, "dd/MM/yyyy")}
                </Typography>
              </Box>
            </Box>
          ))}
        </Box>
      )}
      <Box sx={{ display: "flex", flexWrap: "wrap", gap: "4%", mb: 4 }}>
        {Object.entries(statusHistory).map(([status, dates]) => (
          <Box
            key={status}
            sx={{
              p: 2,
              border: "1px solid #e2e8f0",
              borderRadius: "8px",
              bgcolor: "#f8fafc",
              mb: 2,
              width: "48%",
            }}
          >
            <Typography
              variant="subtitle2"
              sx={{ ...sectionHeaderStyles, mb: 1 }}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </Typography>

            {dates.length > 0 ? (
              <Box sx={{ ml: 1 }}>
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
                    <Box
                      sx={{ display: "flex", alignItems: "center", mt: 0.5 }}
                    >
                      <Box
                        sx={{
                          width: "8px",
                          height: "8px",
                          borderRadius: "50%",
                          bgcolor: statusColors[status],
                          mr: 1,
                        }}
                      />
                    </Box>
                    <Box>
                      {status === "freeze" ? (
                        <>
                          <Typography variant="body2" sx={textStyles}>
                            <Box
                              component="span"
                              sx={{ fontWeight: "500", color: "#a855f7" }}
                            >
                              Started:
                            </Box>{" "}
                            {format(new Date(entry.date), "dd/MM/yyyy hh:mm a")}
                          </Typography>

                          {entry.endDate ? (
                            <>
                              <Typography variant="body2" sx={textStyles}>
                                <Box
                                  component="span"
                                  sx={{ fontWeight: "500", color: "#a855f7" }}
                                >
                                  Ended:
                                </Box>{" "}
                                {format(
                                  new Date(entry.endDate),
                                  "dd/MM/yyyy hh:mm a"
                                )}
                              </Typography>
                              <Typography
                                variant="body2"
                                sx={{
                                  ...textStyles,
                                  color: "#64748b",
                                  fontSize: "0.8125rem",
                                }}
                              >
                                Duration:{" "}
                                {calculateDuration(entry.date, entry.endDate)}
                              </Typography>
                              {new Date(entry.endDate) < new Date() ? (
                                <Typography
                                  variant="body2"
                                  sx={{
                                    ...textStyles,
                                    color: "#10b981",
                                    fontWeight: "500",
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 0.5,
                                  }}
                                >
                                  Completed
                                  <Tooltip title="This freeze period has ended">
                                    <Box
                                      component="span"
                                      sx={{ display: "inline-flex" }}
                                    >
                                      <FaInfoCircle size={12} />
                                    </Box>
                                  </Tooltip>
                                </Typography>
                              ) : (
                                <Typography
                                  variant="body2"
                                  sx={{
                                    ...textStyles,
                                    color: "#a855f7",
                                    fontWeight: "500",
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 0.5,
                                  }}
                                >
                                  Scheduled to end
                                  <Tooltip title="The freeze will automatically end on the specified date">
                                    <Box
                                      component="span"
                                      sx={{ display: "inline-flex" }}
                                    >
                                      <FaInfoCircle size={12} />
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
                                  ...textStyles,
                                  color: "#a855f7",
                                  fontWeight: "500",
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: 0.5,
                                }}
                              >
                                Active freeze
                                <Box
                                  component="span"
                                  sx={{
                                    display: "inline-block",
                                    width: "8px",
                                    height: "8px",
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
                                    <FaInfoCircle size={12} />
                                  </Box>
                                </Tooltip>
                              </Typography>
                              <Typography
                                variant="body2"
                                sx={{
                                  ...textStyles,
                                  color: "#64748b",
                                  fontSize: "0.8125rem",
                                }}
                              >
                                Duration so far: {calculateDuration(entry.date)}
                              </Typography>
                            </>
                          )}
                        </>
                      ) : (
                        <Typography variant="body2" sx={textStyles}>
                          {format(new Date(entry.date), "dd/MM/yyyy hh:mm a")}
                        </Typography>
                      )}
                    </Box>
                  </Box>
                ))}
              </Box>
            ) : (
              <Typography
                variant="body2"
                sx={{ ...textStyles, fontStyle: "italic" }}
              >
                Not set
              </Typography>
            )}
          </Box>
        ))}
      </Box>
    </>
  );
};

const SubjectToggleButton = ({
  student,
  subject,
  isActive,
  onToggle,
  loadingStates,
}) => {
  const toggleId = `${student._id}-${subject._id}`;
  const isToggleLoading = loadingStates[toggleId] || false;

  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 1,
        mt: 1,
        p: 1.5,
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
          fontSize: "0.8125rem",
        }}
      >
        {isActive ? "Active" : "Inactive"}
      </Typography>

      <FormControlLabel
        control={
          <Switch
            checked={isActive}
            onChange={() => onToggle(student._id, subject._id, !isActive)}
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
              <CircularProgress size={14} />
              <Typography variant="caption" sx={textStyles}>
                {isActive ? "Deactivating..." : "Activating..."}
              </Typography>
            </Box>
          ) : (
            <Typography variant="caption" sx={textStyles}>
              {isActive ? "Deactivate" : "Activate"}
            </Typography>
          )
        }
        sx={{
          ml: 0.5,
          "& .MuiFormControlLabel-label": {
            fontSize: "0.75rem",
          },
        }}
      />
    </Box>
  );
};

const ViewStudentModal = ({
  student,
  setShowModal,
  modalStyle,
  adminPassword,
  setAdminPassword,
  passwordError,
  isInfoVisible,
  handleAdminPasswordSubmit,
}) => {
  const [studentData, setStudentData] = useState(student || {});
  const [loadingStates, setLoadingStates] = useState({});
  const { notification, showNotification, closeNotification } =
    useNotification();

  const BASE_URL = import.meta.env.VITE_BASE_URL;

  useEffect(() => {
    setStudentData(student);
  }, [student]);

  const isFreezeCompleted = () => {
    if (student.profile.status !== "freeze") return false;

    if (student.profile.statusDateHistory?.freeze) {
      return student.profile.statusDateHistory.freeze.some(
        (entry) => entry.endDate && new Date(entry.endDate) < new Date()
      );
    }

    return false;
  };
  const modalBaseStyles = {
    ...modalStyle,
    maxHeight: "90vh",
    display: "flex",
    flexDirection: "column",
    width: "800px",
    fontFamily: POPPINS_FONT,
  };

  const scrollableContentStyles = {
    overflowY: "auto",
    flex: 1,
    pr: 2,
    mt: 3,
    "&::-webkit-scrollbar": {
      width: "6px",
    },
    "&::-webkit-scrollbar-track": {
      background: "#f1f5f9",
    },
    "&::-webkit-scrollbar-thumb": {
      background: "#cbd5e1",
      borderRadius: "3px",
    },
  };
  const getSubjectStatus = (subjectId) => {
    if (
      studentData.profile.subjectStatus &&
      studentData.profile.subjectStatus.length > 0
    ) {
      const status = studentData.profile.subjectStatus.find((status) => {
        const statusSubjectId = status.subject._id || status.subject;
        return statusSubjectId.toString() === subjectId.toString();
      });

      if (status) {
        return status.isActive;
      }
    }
    const hasAssignment = studentData.profile.assignedTeachers?.some(
      (assignment) => {
        const assignmentSubjectId =
          assignment.subject._id._id || assignment.subject._id;
        return assignmentSubjectId.toString() === subjectId.toString();
      }
    );
    return hasAssignment;
  };
  const handleSubjectToggle = async (studentId, subjectId, shouldActivate) => {
    const toggleId = `${studentId}-${subjectId}`;

    const currentStatus = getSubjectStatus(subjectId);
    if (currentStatus === shouldActivate) {
      showNotification(
        `Subject is already ${shouldActivate ? "active" : "inactive"}`,
        "warning"
      );
      return;
    }

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
            ? "Subject reactivated from student modal"
            : "Subject deactivated from student modal",
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.data.success) {
        if (response.data.updatedSubjectStatus) {
          setStudentData((prevStudent) => ({
            ...prevStudent,
            profile: {
              ...prevStudent.profile,
              subjectStatus: response.data.updatedSubjectStatus,
            },
          }));
        } else {
          setStudentData((prevStudent) => {
            const updatedStudent = { ...prevStudent };

            if (!updatedStudent.profile.subjectStatus) {
              updatedStudent.profile.subjectStatus = [];
            }

            const statusIndex = updatedStudent.profile.subjectStatus.findIndex(
              (status) => {
                const statusSubjectId = status.subject._id || status.subject;
                return statusSubjectId.toString() === subjectId.toString();
              }
            );

            if (statusIndex !== -1) {
              updatedStudent.profile.subjectStatus[statusIndex] = {
                ...updatedStudent.profile.subjectStatus[statusIndex],
                isActive: shouldActivate,
              };
            } else {
              updatedStudent.profile.subjectStatus.push({
                subject: subjectId,
                isActive: shouldActivate,
                activationHistory: [],
                deactivationHistory: [],
                currentStatus: {},
              });
            }

            return updatedStudent;
          });
        }

        showNotification(
          `Subject ${
            shouldActivate ? "activated" : "deactivated"
          } successfully`,
          "success"
        );
      }
    } catch (error) {
      console.error("Error toggling subject status:", error);

      if (
        error.response?.status === 400 &&
        error.response?.data?.message?.includes("already")
      ) {
        showNotification(
          `Subject is already ${shouldActivate ? "active" : "inactive"}`,
          "warning"
        );
      } else {
        showNotification(
          error.response?.data?.message ||
            `Error ${shouldActivate ? "activating" : "deactivating"} subject`,
          "error"
        );
      }
    } finally {
      setLoadingStates((prev) => ({
        ...prev,
        [toggleId]: false,
      }));
    }
  };
  return (
    <Box sx={modalBaseStyles}>
      {/* Header */}
      <Box
        sx={{
          borderBottom: "1px solid #e2e8f0",
          pb: 2,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Box>
          <Typography
            variant="h5"
            sx={{ ...typographyStyles, fontWeight: 600 }}
          >
            {student.name}
          </Typography>
          <Typography variant="body2" sx={textStyles}>
            Student ID: {student.profile.studentId}
          </Typography>
        </Box>
        <Button
          onClick={() => {
            setShowModal(false);
            setAdminPassword("");
          }}
          sx={{
            minWidth: "32px",
            height: "32px",
            p: 0,
            borderRadius: "50%",
            color: "#64748b",
            "&:hover": {
              bgcolor: "#f1f5f9",
            },
          }}
        >
          ×
        </Button>
      </Box>

      <Box sx={scrollableContentStyles}>
        {/* Basic Information */}
        <Typography variant="subtitle1" sx={sectionHeaderStyles}>
          Basic Information
        </Typography>
        <Box sx={sectionCardStyles}>
          <StudentInfoGrid
            label1="Name"
            value1={student.name}
            icon1={FaUser}
            label2="Gender"
            value2={student.gender}
            icon2={FaUser}
          />
          <StudentInfoGrid
            label1="Grade"
            value1={`Grade ${student.profile.grade}`}
            icon1={FaGraduationCap}
            label2="Client"
            value2={student.profile.clientName}
            icon2={FaUserFriends}
          />
          <StudentInfoGrid
            label1="Date of Birth"
            value1={format(new Date(student.profile.dateOfBirth), "dd/MM/yyyy")}
            icon1={FaCalendarAlt}
          />
        </Box>

        {/* Status History */}
        <Typography variant="subtitle1" sx={sectionHeaderStyles}>
          Status History
        </Typography>
        <StatusHistoryTimeline
          statusDateHistory={student.profile.statusDateHistory}
          statusDates={student.profile.statusDates}
        />

        {/* ✅ Updated Subjects and Teachers section with toggle functionality */}
        <Typography variant="subtitle1" sx={sectionHeaderStyles}>
          Subjects and Teachers
        </Typography>
        <Box sx={sectionCardStyles}>
          {studentData.profile.assignedTeachers.map((assignment) => {
            const subjectId = assignment.subject._id._id;
            const isActive = getSubjectStatus(subjectId);

            return (
              <Box
                key={assignment._id}
                sx={{
                  p: 2,
                  border: "1px solid #e2e8f0",
                  borderRadius: "8px",
                  mb: 2,
                  "&:last-child": { mb: 0 },
                  opacity: isActive ? 1 : 0.7,
                  transition: "opacity 0.3s ease",
                }}
              >
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    mb: 1,
                  }}
                >
                  <Typography sx={{ ...typographyStyles, fontWeight: 500 }}>
                    {assignment.subject.name}
                  </Typography>
                  <Typography sx={typographyStyles}>
                    {assignment.teacher.name}
                  </Typography>
                </Box>

                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    mb: 1,
                  }}
                >
                  <Typography variant="body2" sx={textStyles}>
                    Started on:{" "}
                    {format(new Date(assignment.startDate), "dd/MM/yyyy")}
                  </Typography>
                  {assignment.isTemporary && (
                    <Typography
                      variant="caption"
                      sx={{
                        color: "#9333ea",
                        bgcolor: "#f3e8ff",
                        px: 1.5,
                        py: 0.5,
                        borderRadius: "4px",
                        fontWeight: 500,
                      }}
                    >
                      Temporary Teacher
                    </Typography>
                  )}
                </Box>

                {/* ✅ Subject Status Toggle */}
                <SubjectToggleButton
                  student={studentData}
                  subject={assignment.subject._id}
                  isActive={isActive}
                  onToggle={handleSubjectToggle}
                  loadingStates={loadingStates}
                />

                {/* Class schedule information */}
                {assignment.classSchedule && (
                  <Box sx={{ mt: 2, pt: 2, borderTop: "1px dashed #e2e8f0" }}>
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        mb: 1.5,
                      }}
                    >
                      <Typography
                        sx={{
                          ...typographyStyles,
                          fontWeight: 500,
                          color: "#1f3d61",
                        }}
                      >
                        Class Schedule
                      </Typography>

                      {assignment.classSchedule.isPermanentChange && (
                        <Box
                          sx={{
                            bgcolor: "#f0f9ff",
                            px: 1,
                            py: 0.5,
                            borderRadius: "4px",
                            display: "inline-flex",
                            alignItems: "center",
                          }}
                        >
                          <Typography
                            variant="caption"
                            sx={{ color: "#0284c7", fontWeight: 500 }}
                          >
                            Permanent Change
                          </Typography>
                        </Box>
                      )}
                    </Box>

                    <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2 }}>
                      <Box>
                        <Typography
                          variant="body2"
                          sx={{ ...textStyles, color: "#64748b" }}
                        >
                          Time:
                        </Typography>
                        <Typography sx={typographyStyles}>
                          {formatTimeToAMPM(assignment.classSchedule.startTime)}{" "}
                          - {formatTimeToAMPM(assignment.classSchedule.endTime)}
                        </Typography>
                      </Box>
                    </Box>
                  </Box>
                )}
              </Box>
            );
          })}
        </Box>
        {/* ✅ Subject Status History Section (Enhanced version) */}
        {/* ✅ Subject Status History Section (Enhanced version) */}
        {studentData.profile.subjectStatus &&
          studentData.profile.subjectStatus.length > 0 && (
            <>
              <Typography variant="subtitle1" sx={sectionHeaderStyles}>
                Subject Status History
              </Typography>
              <Box sx={sectionCardStyles}>
                {studentData.profile.subjectStatus.map((subjectStatus) => {
                  // ✅ FIXED: Better subject matching logic
                  const subjectInfo = studentData.profile.assignedTeachers.find(
                    (assignment) => {
                      // Get the subject ID from subjectStatus (it can be an object or string)
                      const statusSubjectId =
                        subjectStatus.subject._id || subjectStatus.subject;

                      // Get the subject ID from assignment
                      const assignmentSubjectId =
                        assignment.subject._id._id || assignment.subject._id;

                      return (
                        statusSubjectId.toString() ===
                        assignmentSubjectId.toString()
                      );
                    }
                  );

                  // ✅ ALTERNATIVE: Use the subject data directly from subjectStatus
                  const subjectName =
                    subjectStatus.subject.name ||
                    subjectInfo?.subject.name ||
                    "Unknown Subject";

                  return (
                    <Box
                      key={subjectStatus._id}
                      sx={{
                        p: 2,
                        border: "1px solid #e2e8f0",
                        borderRadius: "8px",
                        mb: 2,
                        "&:last-child": { mb: 0 },
                      }}
                    >
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          gap: 2,
                          mb: 2,
                        }}
                      >
                        <FaBook size={16} style={{ color: "#64748b" }} />
                        <Typography
                          sx={{ ...typographyStyles, fontWeight: 500 }}
                        >
                          {/* ✅ FIXED: Use subject name from subjectStatus or fallback */}
                          {subjectName}
                        </Typography>
                        <Box
                          sx={{
                            px: 1,
                            py: 0.5,
                            borderRadius: "12px",
                            bgcolor: subjectStatus.isActive
                              ? "#dcfce7"
                              : "#fee2e2",
                            color: subjectStatus.isActive
                              ? "#166534"
                              : "#dc2626",
                            fontSize: "11px",
                            fontWeight: 500,
                          }}
                        >
                          {subjectStatus.isActive ? "Active" : "Inactive"}
                        </Box>
                        {/* ✅ ADDED: Subject type indicator */}
                        {subjectStatus.subject.type && (
                          <Box
                            sx={{
                              px: 1,
                              py: 0.5,
                              borderRadius: "12px",
                              bgcolor:
                                subjectStatus.subject.type === "quran"
                                  ? "#e0f2fe"
                                  : "#f3e8ff",
                              color:
                                subjectStatus.subject.type === "quran"
                                  ? "#0c4a6e"
                                  : "#581c87",
                              fontSize: "10px",
                              fontWeight: 500,
                            }}
                          >
                            {subjectStatus.subject.type === "quran"
                              ? "Quran"
                              : "Subject"}
                          </Box>
                        )}
                      </Box>

                      {/* ✅ ENHANCED: Show subject description if available */}
                      {subjectStatus.subject.description && (
                        <Typography
                          variant="caption"
                          sx={{ ...textStyles, mb: 2, display: "block" }}
                        >
                          {subjectStatus.subject.description}
                        </Typography>
                      )}

                      {/* Current Status */}
                      {subjectStatus.currentStatus && (
                        <Box sx={{ mb: 2 }}>
                          <Typography
                            variant="body2"
                            sx={{ ...textStyles, fontWeight: 500, mb: 1 }}
                          >
                            Current Status:
                          </Typography>
                          {subjectStatus.currentStatus.lastActivatedAt && (
                            <Typography variant="body2" sx={textStyles}>
                              Last Activated:{" "}
                              {format(
                                new Date(
                                  subjectStatus.currentStatus.lastActivatedAt
                                ),
                                "dd/MM/yyyy hh:mm a"
                              )}
                            </Typography>
                          )}
                          {subjectStatus.currentStatus.lastDeactivatedAt && (
                            <Typography variant="body2" sx={textStyles}>
                              Last Deactivated:{" "}
                              {format(
                                new Date(
                                  subjectStatus.currentStatus.lastDeactivatedAt
                                ),
                                "dd/MM/yyyy hh:mm a"
                              )}
                            </Typography>
                          )}
                        </Box>
                      )}

                      {/* Recent Activity */}
                      <Box sx={{ display: "flex", gap: 4 }}>
                        {/* Activation History */}
                        {subjectStatus.activationHistory &&
                          subjectStatus.activationHistory.length > 0 && (
                            <Box sx={{ flex: 1 }}>
                              <Typography
                                variant="body2"
                                sx={{ ...textStyles, fontWeight: 500, mb: 1 }}
                              >
                                Recent Activations:
                              </Typography>
                              {subjectStatus.activationHistory
                                .slice(-2)
                                .map((activation, idx) => (
                                  <Typography
                                    key={idx}
                                    variant="caption"
                                    sx={{ ...textStyles, display: "block" }}
                                  >
                                    {format(
                                      new Date(activation.activatedAt),
                                      "dd/MM/yyyy"
                                    )}{" "}
                                    - {activation.reason}
                                  </Typography>
                                ))}
                            </Box>
                          )}

                        {/* Deactivation History */}
                        {subjectStatus.deactivationHistory &&
                          subjectStatus.deactivationHistory.length > 0 && (
                            <Box sx={{ flex: 1 }}>
                              <Typography
                                variant="body2"
                                sx={{ ...textStyles, fontWeight: 500, mb: 1 }}
                              >
                                Recent Deactivations:
                              </Typography>
                              {subjectStatus.deactivationHistory
                                .slice(-2)
                                .map((deactivation, idx) => (
                                  <Typography
                                    key={idx}
                                    variant="caption"
                                    sx={{ ...textStyles, display: "block" }}
                                  >
                                    {format(
                                      new Date(deactivation.deactivatedAt),
                                      "dd/MM/yyyy"
                                    )}{" "}
                                    - {deactivation.reason}
                                  </Typography>
                                ))}
                            </Box>
                          )}
                      </Box>
                    </Box>
                  );
                })}
              </Box>
            </>
          )}
        {/* System Information */}
        <Typography variant="subtitle1" sx={sectionHeaderStyles}>
          System Information
        </Typography>
        <Box sx={sectionCardStyles}>
          <StudentInfoGrid
            label1="Enrollment Date"
            value1={format(
              new Date(student.profile.enrollmentDate),
              "dd/MM/yyyy"
            )}
            icon1={FaCalendarAlt}
            label2="Current Status"
            value2={
              <Tooltip
                title={
                  student.profile.status === "freeze" &&
                  student.profile.statusDateHistory?.freeze?.some(
                    (entry) =>
                      entry.endDate && new Date(entry.endDate) < new Date()
                  )
                    ? "This freeze period has ended but the status hasn't been updated"
                    : student.profile.status === "freeze" &&
                      !student.profile.statusDateHistory?.freeze?.some(
                        (entry) => !entry.endDate
                      )
                    ? "All freeze periods have ended"
                    : `Current status is ${student.profile.status}`
                }
              >
                <span
                  className={`status-tag ${student.profile.status} ${
                    student.profile.status === "freeze" &&
                    student.profile.statusDateHistory?.freeze?.some(
                      (entry) =>
                        entry.endDate && new Date(entry.endDate) < new Date()
                    )
                      ? "completed-freeze"
                      : ""
                  }`}
                >
                  {student.profile.status.charAt(0).toUpperCase() +
                    student.profile.status.slice(1)}
                  {student.profile.status === "freeze" &&
                    student.profile.statusDateHistory?.freeze?.some(
                      (entry) =>
                        entry.endDate && new Date(entry.endDate) < new Date()
                    ) &&
                    " (Completed)"}
                </span>
              </Tooltip>
            }
            icon2={FaClock}
          />
          <StudentInfoGrid
            label1="Created At"
            value1={format(new Date(student.createdAt), "dd/MM/yyyy HH:mm")}
            icon1={FaHistory}
            label2="Last Updated"
            value2={format(new Date(student.updatedAt), "dd/MM/yyyy HH:mm")}
            icon2={FaHistory}
          />
        </Box>
      </Box>
      <NotificationSnackbar
        notification={notification}
        onClose={closeNotification}
      />
    </Box>
  );
};

export default ViewStudentModal;
