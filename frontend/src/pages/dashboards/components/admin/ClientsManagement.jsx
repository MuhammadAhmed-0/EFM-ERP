import React, { useState, useEffect, useCallback } from "react";
import {
  FaEdit,
  FaEye,
  FaSearch,
  FaPlus,
  FaFilter,
  FaToggleOn,
  FaToggleOff,
  FaTimes,
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
  Autocomplete,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import ReactDatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { format } from "date-fns";
import axios from "axios";
import ViewClientModal from "./viewModals/ViewClientModal";
import "../../../../styles/components/Management.css";
import InfoModal from "./infoModals/InfoModal";
import { tableStyles } from "../../../../styles/modal/styles";
import { getModalStyles } from "../../../../styles/modal/commonModalStyles";
import { useInfoModal } from "../../../../hooks/useInfoModal";
import useNotification from "../../../../hooks/useNotification";
import NotificationSnackbar from "../../../../components/common/NotificationSnackbar";
import SyncButton from "../../../../components/common/SyncButton";

const CURRENCIES = [
  "AUD",
  "NZD",
  "USD",
  "CAD",
  "JPY",
  "PKR",
  "INR",
  "OMR",
  "QAR",
  "SAR",
  "AED",
  "HKD",
  "EUR",
  "GBP",
  "TRY",
  "KWD",
  "EGP",
  "FJD",
  "BHD",
];
const STATUS_OPTIONS = ["trial", "regular", "drop", "freeze", "completed"];
const SHIFT_OPTIONS = ["morning", "night"];
const GENDERS = ["male", "female"];

const ModalContent = ({
  formData,
  handleChange,
  handleSubmit,
  setShowModal,
  currentClient,
  errors,
  isLoading,
  clients,
  referralHandlers,
  handleDateChange,
  formatRole,
  adminPassword,
  setAdminPassword,
  passwordError,
  isInfoVisible,
  handleAdminPasswordSubmit,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const isSmallMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const [freezeStartDate, setFreezeStartDate] = React.useState(
    formData.freezeStartDate ? new Date(formData.freezeStartDate) : new Date()
  );
  const [freezeEndDate, setFreezeEndDate] = React.useState(
    formData.freezeEndDate ? new Date(formData.freezeEndDate) : null
  );

  const handleFreezeStartDateChange = (date) => {
    setFreezeStartDate(date);
    handleChange({
      target: {
        name: "freezeStartDate",
        value: date,
      },
    });
  };

  const handleFreezeEndDateChange = (date) => {
    setFreezeEndDate(date);
    handleChange({
      target: {
        name: "freezeEndDate",
        value: date,
      },
    });
  };

  return (
    <Box
      sx={{
        ...getModalStyles(),
        width: isMobile ? "95vw" : "90vw",
        maxWidth: isMobile ? "none" : "600px",
        p: isMobile ? 2 : 4,
      }}
    >
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          mb: isMobile ? 2 : 3,
          alignItems: "center",
        }}
      >
        <Typography
          variant="h6"
          sx={{
            fontSize: isMobile ? "1.125rem" : "1.25rem",
            fontWeight: 600,
          }}
        >
          {currentClient ? "Edit Client" : "Add New Client"}
        </Typography>
        <Button
          onClick={() => !isLoading && setShowModal(false)}
          sx={{
            minWidth: "auto",
            width: isMobile ? "32px" : "40px",
            height: isMobile ? "32px" : "40px",
            p: 0,
          }}
        >
          ×
        </Button>
      </Box>

      <form onSubmit={handleSubmit}>
        {currentClient && (
          <TextField
            fullWidth
            label="Client ID"
            value={currentClient.clientId}
            margin="normal"
            size="small"
            InputProps={{
              readOnly: true,
            }}
            sx={{
              "& .MuiInputBase-input": {
                fontSize: isMobile ? "0.875rem" : "1rem",
              },
            }}
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
          sx={{
            "& .MuiInputBase-input": {
              fontSize: isMobile ? "0.875rem" : "1rem",
            },
            "& .MuiFormHelperText-root": {
              fontSize: isMobile ? "0.75rem" : "0.875rem",
            },
          }}
        />

        {isInfoVisible ? (
          <>
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
              sx={{
                "& .MuiInputBase-input": {
                  fontSize: isMobile ? "0.875rem" : "1rem",
                },
                "& .MuiFormHelperText-root": {
                  fontSize: isMobile ? "0.75rem" : "0.875rem",
                },
              }}
            />

            <TextField
              fullWidth
              label="Password"
              name="password"
              type="password"
              value={formData.password}
              onChange={handleChange}
              required={!currentClient}
              margin="normal"
              size="small"
              error={!!errors.password}
              helperText={
                currentClient
                  ? "Leave blank to keep current password"
                  : errors.password || "Enter password for new client"
              }
              sx={{
                "& .MuiInputBase-input": {
                  fontSize: isMobile ? "0.875rem" : "1rem",
                },
                "& .MuiFormHelperText-root": {
                  fontSize: isMobile ? "0.75rem" : "0.875rem",
                },
              }}
            />

            <TextField
              fullWidth
              label="Contact Number"
              name="contactNo"
              value={formData.contactNo}
              onChange={handleChange}
              margin="normal"
              size="small"
              sx={{
                "& .MuiInputBase-input": {
                  fontSize: isMobile ? "0.875rem" : "1rem",
                },
              }}
            />
          </>
        ) : (
          <>
            {currentClient ? (
              <Box sx={{ mt: 2, mb: 2 }}>
                <Typography
                  variant="subtitle2"
                  sx={{
                    mb: 2,
                    fontWeight: "bold",
                    fontSize: isMobile ? "0.875rem" : "1rem",
                  }}
                >
                  Enter Admin Password to Edit Sensitive Information
                </Typography>
                <TextField
                  fullWidth
                  type="password"
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  error={!!passwordError}
                  helperText={passwordError}
                  placeholder="Enter admin password"
                  size="small"
                  sx={{
                    mb: 2,
                    "& .MuiInputBase-input": {
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
            ) : (
              <>
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
                  sx={{
                    "& .MuiInputBase-input": {
                      fontSize: isMobile ? "0.875rem" : "1rem",
                    },
                    "& .MuiFormHelperText-root": {
                      fontSize: isMobile ? "0.75rem" : "0.875rem",
                    },
                  }}
                />

                <TextField
                  fullWidth
                  label="Password"
                  name="password"
                  type="password"
                  value={formData.password}
                  onChange={handleChange}
                  required={!currentClient}
                  margin="normal"
                  size="small"
                  error={!!errors.password}
                  helperText={
                    errors.password || "Enter password for new client"
                  }
                  sx={{
                    "& .MuiInputBase-input": {
                      fontSize: isMobile ? "0.875rem" : "1rem",
                    },
                    "& .MuiFormHelperText-root": {
                      fontSize: isMobile ? "0.75rem" : "0.875rem",
                    },
                  }}
                />

                <TextField
                  fullWidth
                  label="Contact Number"
                  name="contactNo"
                  value={formData.contactNo}
                  onChange={handleChange}
                  margin="normal"
                  size="small"
                  sx={{
                    "& .MuiInputBase-input": {
                      fontSize: isMobile ? "0.875rem" : "1rem",
                    },
                  }}
                />
              </>
            )}
          </>
        )}

        <Box
          sx={{
            display: "flex",
            gap: isMobile ? 1 : 1,
            mb: 1,
            flexDirection: isMobile ? "column" : "row",
          }}
        >
          <FormControl fullWidth margin="normal" size="small">
            <InputLabel
              sx={{
                fontSize: isMobile ? "0.875rem" : "1rem",
              }}
            >
              Gender
            </InputLabel>
            <Select
              name="gender"
              value={formData.gender}
              label="Gender"
              onChange={handleChange}
              required
              sx={{
                "& .MuiSelect-select": {
                  fontSize: isMobile ? "0.875rem" : "1rem",
                },
              }}
            >
              {GENDERS.map((gender) => (
                <MenuItem key={gender} value={gender}>
                  {gender.charAt(0).toUpperCase() + gender.slice(1)}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl fullWidth margin="normal" size="small">
            <InputLabel
              sx={{
                fontSize: isMobile ? "0.875rem" : "1rem",
              }}
            >
              Shift
            </InputLabel>
            <Select
              name="shift"
              value={formData.shift}
              label="Shift"
              onChange={handleChange}
              required
              sx={{
                "& .MuiSelect-select": {
                  fontSize: isMobile ? "0.875rem" : "1rem",
                },
              }}
            >
              {SHIFT_OPTIONS.map((shift) => (
                <MenuItem key={shift} value={shift}>
                  {shift.charAt(0).toUpperCase() + shift.slice(1)}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>

        <Box
          sx={{
            display: "flex",
            gap: isMobile ? 1 : 1,
            mb: 1,
            flexDirection: isMobile ? "column" : "row",
          }}
        >
          <TextField
            fullWidth
            label="Country"
            name="country"
            value={formData.country}
            onChange={handleChange}
            margin="normal"
            size="small"
            sx={{
              "& .MuiInputBase-input": {
                fontSize: isMobile ? "0.875rem" : "1rem",
              },
            }}
          />

          <TextField
            fullWidth
            label="State"
            name="state"
            value={formData.state}
            onChange={handleChange}
            margin="normal"
            size="small"
            sx={{
              "& .MuiInputBase-input": {
                fontSize: isMobile ? "0.875rem" : "1rem",
              },
            }}
          />
        </Box>

        <FormControl fullWidth margin="normal" size="small">
          <InputLabel
            sx={{
              fontSize: isMobile ? "0.875rem" : "1rem",
            }}
          >
            Status
          </InputLabel>
          <Select
            name="status"
            value={formData.status}
            label="Status"
            onChange={handleChange}
            sx={{
              "& .MuiSelect-select": {
                fontSize: isMobile ? "0.875rem" : "1rem",
              },
            }}
          >
            {STATUS_OPTIONS.map((status) => (
              <MenuItem key={status} value={status}>
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </MenuItem>
            ))}
          </Select>

          {formData.status === "freeze" && (
            <>
              <Typography
                variant="caption"
                sx={{
                  mt: 0.5,
                  color: "#a855f7",
                  fontSize: isMobile ? "0.75rem" : "0.875rem",
                }}
              >
                {currentClient && currentClient.status === "freeze"
                  ? "Client is already in freeze status."
                  : "Setting status to freeze will start tracking the freeze period. The freeze will remain active until changed to another status."}
              </Typography>

              <Box
                sx={{
                  mt: 2,
                  border: "1px solid #e2e8f0",
                  borderRadius: "8px",
                  p: isMobile ? 1.5 : 2,
                  bgcolor: "#f8fafc",
                }}
              >
                <Typography
                  variant="subtitle2"
                  sx={{
                    mb: 1,
                    color: "#a855f7",
                    fontWeight: 600,
                    fontSize: isMobile ? "0.875rem" : "1rem",
                  }}
                >
                  Freeze Period
                </Typography>

                <LocalizationProvider dateAdapter={AdapterDateFns}>
                  <Box sx={{ mb: 2 }}>
                    <DatePicker
                      label="Freeze Start Date"
                      value={freezeStartDate}
                      onChange={handleFreezeStartDateChange}
                      slotProps={{
                        textField: {
                          fullWidth: true,
                          size: isMobile ? "small" : "medium",
                          margin: "dense",
                          error: !!errors.freezeStartDate,
                          helperText: errors.freezeStartDate,
                          sx: {
                            "& .MuiInputBase-input": {
                              fontSize: isMobile ? "0.875rem" : "1rem",
                            },
                            "& .MuiFormHelperText-root": {
                              fontSize: isMobile ? "0.75rem" : "0.875rem",
                            },
                          },
                        },
                      }}
                    />
                  </Box>

                  <Box>
                    <DatePicker
                      label="Freeze End Date (Optional)"
                      value={freezeEndDate}
                      onChange={handleFreezeEndDateChange}
                      minDate={freezeStartDate}
                      slotProps={{
                        textField: {
                          fullWidth: true,
                          size: isMobile ? "small" : "medium",
                          margin: "dense",
                          error: !!errors.freezeEndDate,
                          helperText:
                            errors.freezeEndDate ||
                            "Leave empty for indefinite freeze",
                          sx: {
                            "& .MuiInputBase-input": {
                              fontSize: isMobile ? "0.875rem" : "1rem",
                            },
                            "& .MuiFormHelperText-root": {
                              fontSize: isMobile ? "0.75rem" : "0.875rem",
                            },
                          },
                        },
                      }}
                    />
                  </Box>
                </LocalizationProvider>

                <Typography
                  variant="caption"
                  sx={{
                    display: "block",
                    mt: 1,
                    color: "#64748b",
                    fontSize: isMobile ? "0.75rem" : "0.875rem",
                  }}
                >
                  {freezeEndDate
                    ? "The freeze will automatically end on the specified date."
                    : "If no end date is set, the freeze will be active until changed to another status."}
                </Typography>
              </Box>
            </>
          )}

          {currentClient &&
            currentClient.status === "freeze" &&
            formData.status !== "freeze" && (
              <Typography
                variant="caption"
                sx={{
                  mt: 0.5,
                  color: "#10b981",
                  fontSize: isMobile ? "0.75rem" : "0.875rem",
                }}
              >
                Changing from freeze to {formData.status} will end the current
                freeze period and record the end date.
              </Typography>
            )}
        </FormControl>

        <Box
          sx={{
            display: "flex",
            gap: 2,
            mb: 1,
            flexDirection: "column",
          }}
        >
          <TextField
            fullWidth
            label="Total Fee"
            name="totalFee"
            type="number"
            value={formData.totalFee}
            onChange={handleChange}
            margin="normal"
            size="small"
            sx={{
              "& .MuiInputBase-input": {
                fontSize: isMobile ? "0.875rem" : "1rem",
              },
            }}
          />

          <FormControl fullWidth margin="normal" size="small">
            <Autocomplete
              id="currency-autocomplete"
              options={CURRENCIES}
              getOptionLabel={(option) => option}
              value={formData.currency || ""}
              onChange={(event, newValue) => {
                handleChange({
                  target: {
                    name: "currency",
                    value: newValue || "",
                  },
                });
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Currency"
                  size="small"
                  sx={{
                    "& .MuiInputBase-input": {
                      fontSize: isMobile ? "0.875rem" : "1rem",
                    },
                  }}
                />
              )}
            />
          </FormControl>
        </Box>

        <TextField
          fullWidth
          label="Remarks"
          name="remarks"
          value={formData.remarks}
          onChange={handleChange}
          multiline
          rows={isMobile ? 2 : 3}
          margin="normal"
          size="small"
          sx={{
            "& .MuiInputBase-input": {
              fontSize: isMobile ? "0.875rem" : "1rem",
            },
          }}
        />

        {!currentClient && (
          <>
            <FormControl fullWidth margin="normal" size="small">
              <Autocomplete
                id="referred-by-client-autocomplete"
                options={clients.sort((a, b) => {
                  if (a.user?.isActive && !b.user?.isActive) return -1;
                  if (!a.user?.isActive && b.user?.isActive) return 1;
                  return 0;
                })}
                groupBy={(option) =>
                  option.user?.isActive ? "Active Clients" : "Inactive Clients"
                }
                getOptionLabel={(option) =>
                  `${option.clientId} - ${option.clientName}`
                }
                value={
                  clients.find(
                    (client) =>
                      client.user?._id === formData.referredByClientUserId
                  ) || null
                }
                onChange={(event, newValue) => {
                  handleChange({
                    target: {
                      name: "referredByClientUserId",
                      value: newValue ? newValue.user?._id : "",
                    },
                  });
                }}
                renderGroup={(params) => (
                  <li key={params.key}>
                    <Typography
                      component="div"
                      sx={{
                        position: "sticky",
                        top: 0,
                        backgroundColor: "#f8fafc",
                        color: "#374151",
                        fontWeight: 600,
                        fontSize: "0.875rem",
                        padding: "12px 16px 8px 16px",
                        borderBottom: "1px solid #e5e7eb",
                        zIndex: 1,
                        textTransform: "uppercase",
                        letterSpacing: "0.025em",
                      }}
                    >
                      {params.group}
                    </Typography>
                    <ul style={{ padding: 0, margin: 0 }}>{params.children}</ul>
                  </li>
                )}
                renderOption={(props, option) => (
                  <li {...props} key={option._id}>
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        width: "100%",
                        padding: "8px 16px",
                      }}
                    >
                      <Box
                        sx={{
                          flexGrow: 1,
                          display: "flex",
                          alignItems: "center",
                          gap: 2,
                        }}
                      >
                        <Typography
                          variant="body2"
                          sx={{
                            fontWeight: 500,
                            color: "#374151",
                            fontSize: "0.875rem",
                          }}
                        >
                          {option.clientId} - {option.clientName}
                        </Typography>
                        <Box
                          sx={{
                            backgroundColor: option.user?.isActive
                              ? "#dcfce7"
                              : "#fee2e2",
                            color: option.user?.isActive
                              ? "#22c55e"
                              : "#dc2626",
                            fontSize: "0.75rem",
                            fontWeight: 600,
                            padding: "2px 8px",
                            borderRadius: "12px",
                            textTransform: "uppercase",
                            letterSpacing: "0.025em",
                            minWidth: "60px",
                            textAlign: "center",
                          }}
                        >
                          {option.user?.isActive ? "Active" : "Inactive"}
                        </Box>
                      </Box>
                    </Box>
                  </li>
                )}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Referred By Client"
                    size="small"
                    sx={{
                      "& .MuiInputBase-input": {
                        fontSize: isMobile ? "0.875rem" : "1rem",
                      },
                    }}
                  />
                )}
                sx={{
                  "& .MuiAutocomplete-listbox": {
                    maxHeight: "300px",
                    padding: 0,
                  },
                  "& .MuiAutocomplete-option": {
                    padding: "0 !important",
                    "&:hover": {
                      backgroundColor: "#f3f4f6",
                    },
                    "&[aria-selected='true']": {
                      backgroundColor: "#e0e7ff",
                    },
                  },
                  "& .MuiAutocomplete-groupLabel": {
                    display: "none",
                  },
                }}
              />
            </FormControl>

            <LocalizationProvider dateAdapter={AdapterDateFns}>
              <DatePicker
                label="Referred On Date"
                value={
                  formData.referredOnDate
                    ? parseFormattedDate(formData.referredOnDate)
                    : null
                }
                onChange={(newValue) => handleDateChange(newValue)}
                disabled={!formData.referredByClientUserId}
                slotProps={{
                  textField: {
                    fullWidth: true,
                    margin: "normal",
                    size: isMobile ? "small" : "medium",
                    error: !!errors.referredOnDate,
                    helperText: errors.referredOnDate,
                    required: !!formData.referredByClientUserId,
                    sx: {
                      "& .MuiInputBase-input": {
                        fontSize: isMobile ? "0.875rem" : "1rem",
                      },
                      "& .MuiFormHelperText-root": {
                        fontSize: isMobile ? "0.75rem" : "0.875rem",
                      },
                    },
                  },
                }}
              />
            </LocalizationProvider>

            <FormControl
              fullWidth
              margin="normal"
              size="small"
              disabled={!formData.referredByClientUserId}
            >
              <Autocomplete
                id="referral-handled-by-autocomplete"
                options={referralHandlers.filter(
                  (handler) => handler.isActive !== false
                )}
                getOptionLabel={(option) =>
                  `${option.staffId} - ${option.name} (${formatRole(
                    option.role
                  )})`
                }
                value={
                  referralHandlers.find(
                    (handler) =>
                      handler._id === formData.referralHandledByUserId
                  ) || null
                }
                onChange={(event, newValue) => {
                  handleChange({
                    target: {
                      name: "referralHandledByUserId",
                      value: newValue ? newValue._id : "",
                    },
                  });
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Referral Handled By"
                    size="small"
                    sx={{
                      "& .MuiInputBase-input": {
                        fontSize: isMobile ? "0.875rem" : "1rem",
                      },
                    }}
                  />
                )}
                disabled={!formData.referredByClientUserId}
              />
            </FormControl>
          </>
        )}

        <Box
          sx={{
            mt: isMobile ? 3 : 4,
            pt: isMobile ? 1.5 : 2,
            display: "flex",
            flexDirection: isMobile ? "column" : "row",
            justifyContent: "flex-end",
            gap: isMobile ? 1.5 : 2,
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
            ) : currentClient ? (
              "Update Client"
            ) : (
              "Add Client"
            )}
          </button>
        </Box>
      </form>
    </Box>
  );
};
const parseFormattedDate = (dateString) => {
  if (!dateString) return null;
  const [day, month, year] = dateString.split("-");
  return new Date(year, month - 1, day);
};

const ClientsManagement = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const isSmallMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const {
    showInfoModal,
    setShowInfoModal,
    selectedItem,
    adminPassword,
    passwordError,
    isInfoVisible,
    isAdminAuthenticated,
    setAdminPassword,
    handleShowInfo,
    handleAdminPasswordSubmit,
    handleCloseInfoModal,
  } = useInfoModal();

  const [clients, setClients] = useState([]);
  const [referralClients, setReferralClients] = useState([]);
  const [referralHandlers, setReferralHandlers] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [currentClient, setCurrentClient] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [errors, setErrors] = useState({});
  const [filteredClients, setFilteredClients] = useState([]);
  const [isEditMode, setIsEditMode] = useState(false);
  const [dateRange, setDateRange] = useState([null, null]);
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [toggleLoading, setToggleLoading] = useState({});
  const [selectedActiveStatus, setSelectedActiveStatus] = useState("all");
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    gender: "male",
    role: "client",
    contactNo: "",
    country: "",
    state: "",
    shift: "morning",
    status: "trial",
    totalFee: 0,
    currency: "PKR",
    remarks: "",
    referredByClientUserId: "",
    referralHandledByUserId: "",
    referredOnDate: "",
  });

  const { notification, showNotification, closeNotification } =
    useNotification();
  const BASE_URL = import.meta.env.VITE_BASE_URL;

  useEffect(() => {
    const handleStorageChange = () => {
      const isAuth = localStorage.getItem("isAdminAuthenticated") === "true";
      setIsAdminAuthenticated(isAuth);
      setIsInfoVisible(isAuth);
    };

    window.addEventListener("storage", handleStorageChange);
    return () => {
      window.removeEventListener("storage", handleStorageChange);
    };
  }, []);
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    }
    fetchClients();
    fetchReferralHandlers();
  }, [selectedStatus, dateRange]);

  useEffect(() => {
    const rootElement = document.getElementById("root");
    if (showModal) {
      rootElement.setAttribute("inert", "");
    } else {
      rootElement.removeAttribute("inert");
    }
  }, [showModal]);

  const handleToggleStatus = async (client) => {
    const newStatus = !client.user?.isActive;
    const action = newStatus ? "activate" : "deactivate";

    const reason = `Client ${action}d by admin via management interface at 2025-06-18 04:56:03`;

    setToggleLoading((prev) => ({ ...prev, [client._id]: true }));

    try {
      const response = await axios.put(
        `${BASE_URL}/api/admin/clients/${client.user._id}/toggle-status`,
        {
          isActive: newStatus,
          reason: reason,
        }
      );

      if (response.data.success) {
        const { data } = response.data;

        showNotification(
          `Client ${client.clientName} ${action}d successfully. ${data.scheduleUpdates.studentsAffected} students affected.`,
          "success"
        );
        await fetchClients();
      }
    } catch (error) {
      console.error("❌ Error toggling client status:", error);

      if (error.response?.status === 400) {
        showNotification(
          error.response.data.msg || "Invalid request parameters",
          "error"
        );
      } else if (error.response?.status === 403) {
        showNotification("Access denied. Admin permissions required.", "error");
      } else if (error.response?.status === 404) {
        showNotification("Client not found", "error");
      } else {
        showNotification(
          error.response?.data?.msg || "Error updating client status",
          "error"
        );
      }
    } finally {
      setToggleLoading((prev) => ({ ...prev, [client._id]: false }));
    }
  };
  const fetchClients = async (showSuccessMessage = false) => {
    setIsSyncing(true);
    setIsLoading(true);
    try {
      let url = `${BASE_URL}/api/admin/clients-with-students?`;

      if (selectedStatus !== "all") {
        url += `status=${selectedStatus}&`;
      }

      if (dateRange[0] && dateRange[1]) {
        url += `startDate=${format(
          dateRange[0],
          "yyyy-MM-dd"
        )}&endDate=${format(dateRange[1], "yyyy-MM-dd")}`;
      }

      const response = await axios.get(url);
      setClients(response.data.clients || []);
      console.log(response.data.clients);
      setReferralClients(response.data.clients || []);
      if (showSuccessMessage) {
        showNotification("Clients refreshed successfully");
      }
    } catch (error) {
      console.error("Error fetching clients:", error);
      showNotification(
        error.response?.data?.message || "Error fetching clients",
        "error"
      );
    } finally {
      setIsSyncing(false);
      setIsLoading(false);
    }
  };

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

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  };

  const fetchReferralHandlers = async () => {
    try {
      const response = await axios.get(`${BASE_URL}/api/admin/users`);
      const handlers = response.data.users.filter((user) =>
        [
          "admin",
          "supervisor_quran",
          "supervisor_subjects",
          "teacher_quran",
          "teacher_subjects",
        ].includes(user.role)
      );
      setReferralHandlers(handlers);
    } catch (error) {
      console.error("Error fetching referral handlers:", error);
    }
  };

  const handleDateChange = (date) => {
    if (date) {
      const day = String(date.getDate()).padStart(2, "0");
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const year = date.getFullYear();
      const formattedDate = `${day}-${month}-${year}`;

      setFormData((prev) => ({
        ...prev,
        referredOnDate: formattedDate,
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        referredOnDate: "",
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!(formData.name || "").trim()) newErrors.name = "Name is required";
    if (!(formData.email || "").trim()) newErrors.email = "Email is required";
    if (!currentClient && !(formData.password || "").trim()) {
      newErrors.password = "Password is required for new clients";
    }
    if (currentClient && formData.password && formData.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }

    if (!formData.gender) newErrors.gender = "Gender is required";
    if (!formData.shift) newErrors.shift = "Shift is required";
    if (formData.totalFee < 0)
      newErrors.totalFee = "Total fee cannot be negative";

    if (formData.referredByClientUserId) {
      if (!formData.referralHandledByUserId) {
        newErrors.referralHandledByUserId =
          "Referral handler is required when client is referred";
      }
      if (!formData.referredOnDate) {
        newErrors.referredOnDate =
          "Referral date is required when client is referred";
      }
    }
    if (formData.status === "freeze") {
      if (!formData.freezeStartDate) {
        newErrors.freezeStartDate = "Freeze start date is required";
      }

      if (formData.freezeEndDate && formData.freezeStartDate) {
        if (
          new Date(formData.freezeEndDate) < new Date(formData.freezeStartDate)
        ) {
          newErrors.freezeEndDate = "End date must be after start date";
        }
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === "referredByClientUserId" && !value) {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
        referralHandledByUserId: "",
        referredOnDate: "",
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }

    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  const handleAdd = () => {
    setCurrentClient(null);
    setFormData({
      name: "",
      email: "",
      password: "",
      gender: "male",
      role: "client",
      contactNo: "",
      country: "",
      state: "",
      shift: "morning",
      status: "trial",
      totalFee: 0,
      currency: "PKR",
      remarks: "",
      referredByClientUserId: "",
      referralHandledByUserId: "",
      referredOnDate: "",
      freezeStartDate: new Date(),
      freezeEndDate: null,
    });
    setErrors({});
    setShowModal(true);
  };

  const handleEdit = (client) => {
    setIsEditMode(true);
    setCurrentClient(client);
    let freezeStartDate = new Date();
    let freezeEndDate = null;

    if (
      client.statusDateHistory &&
      client.statusDateHistory.freeze &&
      client.statusDateHistory.freeze.length > 0
    ) {
      const activeFreeze = [...client.statusDateHistory.freeze]
        .filter((entry) => !entry.endDate)
        .sort((a, b) => new Date(b.date) - new Date(a.date))[0];

      if (activeFreeze) {
        freezeStartDate = new Date(activeFreeze.date);
        freezeEndDate = activeFreeze.endDate
          ? new Date(activeFreeze.endDate)
          : null;
      }
    }
    setFormData({
      name: client.clientName || "",
      email: client.user.email || "",
      password: "",
      gender: client.user.gender || "male",
      contactNo: client.contactNo || "",
      country: client.country || "",
      state: client.state || "",
      shift: client.shift || "morning",
      status: client.status || "trial",
      totalFee: client.totalFee || 0,
      currency: client.currency || "PKR",
      remarks: client.remarks || "",
      referredByClientUserId: client.referredByClient?.user || "",
      referralHandledByUserId: client.referralHandledBy?._id || "",
      referredOnDate: client.referralRecords?.[0]?.referredOn || "",
      freezeStartDate: freezeStartDate,
      freezeEndDate: freezeEndDate,
    });
    setErrors({});
    setShowModal(true);
  };
  const handleAddSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      const currentDate = new Date();
      let currentUserId = "hammas-coding";
      try {
        const userStr = localStorage.getItem("user");
        if (userStr) {
          const userObj = JSON.parse(userStr);
          currentUserId = userObj._id || currentUserId;
        } else {
          currentUserId = localStorage.getItem("userId") || currentUserId;
        }
      } catch (e) {
        console.error("Error parsing user from localStorage:", e);
      }
      const statusDateHistory = {
        trial: [],
        regular: [],
        drop: [],
        freeze: [],
        completed: [],
      };
      if (formData.status === "freeze") {
        statusDateHistory.freeze.push({
          date: currentDate,
          endDate: formData.freezeEndDate || null,
          addedBy: currentUserId,
          endedBy: formData.freezeEndDate ? currentUserId : null,
        });
      } else {
        statusDateHistory[formData.status].push({
          date: currentDate,
          addedBy: currentUserId,
        });
      }

      const submissionData = {
        name: formData.name,
        email: formData.email?.toLowerCase(),
        password: formData.password,
        gender: formData.gender,
        role: "client",
        contactNo: formData.contactNo,
        shift: formData.shift,
        country: formData.country,
        state: formData.state,
        remarks: formData.remarks,
        status: formData.status,
        totalFee: parseFloat(formData.totalFee || 0),
        currency: formData.currency,
        referredByClientUserId: formData.referredByClientUserId || null,
        referralHandledByUserId: formData.referralHandledByUserId || null,
        referredOnDate: formData.referredOnDate || null,
        statusDateHistory: statusDateHistory,
      };
      if (formData.status === "freeze") {
        submissionData.freezeStartDate = formData.freezeStartDate || new Date();
        submissionData.freezeEndDate = formData.freezeEndDate;
      }
      const response = await axios.post(
        `${BASE_URL}/api/admin/users`,
        submissionData
      );
      showNotification("Client added successfully");
      await fetchClients();
      setShowModal(false);
    } catch (error) {
      console.error("Error details:", error.response?.data);
      showNotification(
        error.response?.data?.msg || "Error adding client",
        "error"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    const statusChanged = formData.status !== currentClient.status;
    const currentDate = new Date();
    let currentUserId = "hammas-coding";
    try {
      const userStr = localStorage.getItem("user");
      if (userStr) {
        const userObj = JSON.parse(userStr);
        currentUserId = userObj._id || currentUserId;
      } else {
        currentUserId = localStorage.getItem("userId") || currentUserId;
      }
    } catch (e) {
      console.error("Error parsing user from localStorage:", e);
    }

    setIsLoading(true);
    try {
      const submissionData = {
        name: formData.name,
        email: formData.email?.toLowerCase(),
        gender: formData.gender,
        contactNo: formData.contactNo,
        shift: formData.shift,
        country: formData.country,
        state: formData.state,
        remarks: formData.remarks,
        status: formData.status,
        totalFee: parseFloat(formData.totalFee || 0),
        currency: formData.currency,
        referredByClientUserId: formData.referredByClientUserId || null,
        referralHandledByUserId: formData.referralHandledByUserId || null,
        referredOnDate: formData.referredOnDate || null,
      };
      if (formData.status === "freeze") {
        submissionData.freezeStartDate = formData.freezeStartDate || new Date();
        submissionData.freezeEndDate = formData.freezeEndDate;
      }
      if (formData.password) {
        submissionData.password = formData.password;
      }
      if (statusChanged) {
        submissionData.statusDates = {
          ...(currentClient.statusDates || {}),
          [formData.status]: {
            date: currentDate,
            addedBy: currentUserId,
          },
        };
        let statusDateHistory = currentClient.statusDateHistory || {
          trial: [],
          regular: [],
          drop: [],
          freeze: [],
          completed: [],
        };
        if (formData.status === "freeze") {
          statusDateHistory.freeze = statusDateHistory.freeze || [];
          statusDateHistory.freeze.push({
            date: currentDate,
            endDate: formData.freezeEndDate || null,
            addedBy: currentUserId,
            endedBy: formData.freezeEndDate ? currentUserId : null,
          });
        } else if (currentClient.status === "freeze") {
          if (statusDateHistory.freeze && statusDateHistory.freeze.length > 0) {
            const activeFreeze = [...statusDateHistory.freeze]
              .filter((entry) => !entry.endDate)
              .sort((a, b) => new Date(b.date) - new Date(a.date))[0];

            if (activeFreeze) {
              activeFreeze.endDate = formData.freezeEndDate || currentDate;
              activeFreeze.endedBy = currentUserId;
            }
          }
          statusDateHistory[formData.status] =
            statusDateHistory[formData.status] || [];
          statusDateHistory[formData.status].push({
            date: currentDate,
            addedBy: currentUserId,
          });
        } else {
          statusDateHistory[formData.status] =
            statusDateHistory[formData.status] || [];
          statusDateHistory[formData.status].push({
            date: currentDate,
            addedBy: currentUserId,
          });
        }

        submissionData.statusDateHistory = statusDateHistory;
      }

      const userId = currentClient.user._id;
      await axios.put(`${BASE_URL}/api/admin/users/${userId}`, submissionData);
      showNotification("Client updated successfully");
      await fetchClients();
      setShowModal(false);
    } catch (error) {
      console.error("Error details:", error.response?.data);
      showNotification(
        error.response?.data?.msg || "Error updating client",
        "error"
      );
    } finally {
      setIsLoading(false);
    }
  };
  const updateFilteredClients = useCallback(() => {
    let filtered = [...clients];

    if (searchTerm) {
      const searchTermLower = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (client) =>
          client.clientName.toLowerCase().includes(searchTermLower) ||
          client.clientId.toLowerCase().includes(searchTermLower)
      );
    }

    if (selectedStatus !== "all") {
      filtered = filtered.filter((client) => client.status === selectedStatus);
    }

    if (selectedActiveStatus !== "all") {
      filtered = filtered.filter((client) => {
        if (selectedActiveStatus === "active") {
          return client.user?.isActive === true;
        } else if (selectedActiveStatus === "inactive") {
          return client.user?.isActive === false;
        }
        return true;
      });
    }

    if (dateRange[0] && dateRange[1]) {
      filtered = filtered.filter((client) => {
        const clientDate = new Date(client.registrationDate);
        return clientDate >= dateRange[0] && clientDate <= dateRange[1];
      });
    }

    setFilteredClients(filtered);
  }, [clients, searchTerm, selectedStatus, dateRange, selectedActiveStatus]);

  useEffect(() => {
    updateFilteredClients();
  }, [clients, searchTerm, selectedStatus, dateRange, updateFilteredClients]);

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
          <h2>Clients Management</h2>
          <p className="total-count">{filteredClients.length} Total Clients</p>
        </div>
        <div className="header-buttons">
          <SyncButton
            isSyncing={isSyncing}
            onClick={() => fetchClients(true)}
          />
          <button className="add-btn" onClick={handleAdd}>
            <FaPlus />
            <span className="add-btn-text">Add Client</span>
          </button>
        </div>
      </div>

      {/* Mobile Filter Toggle Button */}
      {isMobile && (
        <div className="mobile-filter-toggle">
          <button
            className="filter-toggle-btn"
            onClick={() => setShowMobileFilters(!showMobileFilters)}
          >
            <FaFilter />
            Filters
            {(searchTerm ||
              selectedStatus !== "all" ||
              selectedActiveStatus !== "all" ||
              (dateRange[0] && dateRange[1])) && (
              <span className="filter-active-indicator"></span>
            )}
          </button>
        </div>
      )}

      {/* Filter Section */}
      <div
        className={`filter-section ${
          isMobile
            ? showMobileFilters
              ? "mobile-filters-open"
              : "mobile-filters-closed"
            : ""
        }`}
      >
        <div className="search-box">
          <FaSearch className="search-icon" />
          <input
            type="text"
            placeholder={isSmallMobile ? "Search..." : "Search by Name or ID"}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="filter-box">
          <FaFilter className="filter-icon" />
          <Select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            displayEmpty
            size="small"
            sx={{
              width: "100%",
              minWidth: isMobile ? "auto" : "200px",
              height: isMobile ? "36px" : "40px",
              ".MuiSelect-select": {
                padding: isMobile ? "6px 10px 6px 32px" : "8px 12px 8px 36px",
                backgroundColor: "white",
                border: "1px solid #e2e8f0",
                borderRadius: "6px",
                fontSize: isMobile ? "0.75rem" : "0.875rem",
                color: "#475569",
              },
              ".MuiOutlinedInput-notchedOutline": {
                border: "none",
              },
            }}
          >
            <MenuItem value="all">All Status</MenuItem>
            {STATUS_OPTIONS.map((status) => (
              <MenuItem key={status} value={status}>
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </MenuItem>
            ))}
          </Select>
        </div>

        <div className="filter-box">
          <FaFilter className="filter-icon" />
          <Select
            value={selectedActiveStatus}
            onChange={(e) => setSelectedActiveStatus(e.target.value)}
            displayEmpty
            size="small"
            sx={{
              width: "100%",
              minWidth: isMobile ? "auto" : "200px",
              height: isMobile ? "36px" : "40px",
              ".MuiSelect-select": {
                padding: isMobile ? "6px 10px 6px 32px" : "8px 12px 8px 36px",
                backgroundColor: "white",
                border: "1px solid #e2e8f0",
                borderRadius: "6px",
                fontSize: isMobile ? "0.75rem" : "0.875rem",
                color: "#475569",
              },
              ".MuiOutlinedInput-notchedOutline": {
                border: "none",
              },
            }}
          >
            <MenuItem value="all">All Activity Status</MenuItem>
            <MenuItem value="active">Active Clients</MenuItem>
            <MenuItem value="inactive">Inactive Clients</MenuItem>
          </Select>
        </div>

        <div className="filter-box">
          <ReactDatePicker
            selectsRange={true}
            startDate={dateRange[0]}
            endDate={dateRange[1]}
            onChange={(update) => {
              setDateRange(update);
            }}
            isClearable={true}
            dateFormat="dd/MM/yyyy"
            customInput={
              <div className="date-input-wrapper">
                <FaFilter className="filter-icon" />
                <input
                  className="date-range-input"
                  placeholder={
                    isSmallMobile ? "Date range" : "Select date range"
                  }
                  value={
                    dateRange[0] && dateRange[1]
                      ? `${format(dateRange[0], "dd/MM/yyyy")} - ${format(
                          dateRange[1],
                          "dd/MM/yyyy"
                        )}`
                      : ""
                  }
                  readOnly
                  style={{
                    fontSize: isMobile ? "0.75rem" : "0.875rem",
                    height: isMobile ? "36px" : "40px",
                    padding: isMobile
                      ? "6px 8px 6px 28px"
                      : "8px 12px 8px 36px",
                  }}
                />
              </div>
            }
          />
        </div>
        <button
          className="clear-filters-btn"
          onClick={() => {
            setDateRange([null, null]);
            setSelectedStatus("all");
            setSelectedActiveStatus("all");
            setSearchTerm("");
            if (isMobile) setShowMobileFilters(false);
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
        ) : filteredClients.length > 0 ? (
          <table>
            <thead>
              <tr>
                <th>Client ID</th>
                <th>Name</th>
                <th>Email & Contact</th>
                <th>Location</th>
                <th>Students & Fee</th>
                <th>Status & Shift</th>
                <th>Registration</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredClients.map((client) => (
                <tr key={client._id} className="client-row">
                  <td style={{ fontWeight: "500" }}>{client.clientId}</td>
                  <td>
                    <div style={{ fontWeight: "500" }}>
                      {client.user?.isActive ? (
                        client.clientName
                      ) : (
                        <>
                          {client.clientName}
                          <div
                            style={{
                              color: "#dc2626",
                              fontSize: "0.75rem",
                              fontWeight: "500",
                              marginTop: "2px",
                            }}
                          >
                            (Inactive Client)
                          </div>
                        </>
                      )}
                    </div>
                    <span style={{ color: "#64748b", fontSize: "0.8125rem" }}>
                      {client.user?.gender || "Not specified"}
                    </span>
                  </td>
                  <td>
                    <div style={tableStyles.buttonContainer}>
                      <Button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleShowInfo(client, "contact");
                        }}
                        sx={tableStyles.viewButton}
                      >
                        View
                      </Button>
                    </div>
                  </td>
                  <td>
                    <div>{client.country}</div>
                    <span style={{ color: "#64748b", fontSize: "0.8125rem" }}>
                      {client.state}
                    </span>
                  </td>
                  <td>
                    <div style={{ textAlign: "center" }}>
                      <span className="students-count">
                        {client.numberOfStudents} Students
                      </span>
                    </div>
                    <div style={{ marginTop: "4px", textAlign: "center" }}>
                      {client.totalFee} {client.currency}
                    </div>
                  </td>
                  <td>
                    <div style={{ textAlign: "center" }}>
                      <span className={`status-tag ${client.status}`}>
                        {client.status}
                      </span>
                      <div style={{ marginTop: "4px" }}>
                        <span
                          style={{
                            fontSize: "0.75rem",
                            fontWeight: "500",
                            color: client.user?.isActive
                              ? "#22c55e"
                              : "#dc2626",
                            backgroundColor: client.user?.isActive
                              ? "#dcfce7"
                              : "#fee2e2",
                            padding: "2px 6px",
                            borderRadius: "4px",
                          }}
                        >
                          {client.user?.isActive ? "Active" : "Inactive"}
                        </span>
                      </div>
                    </div>
                    <span
                      style={{
                        color: "#64748b",
                        fontSize: "0.8125rem",
                        display: "block",
                        marginTop: "4px",
                        textAlign: "center",
                      }}
                    >
                      {client.shift}
                    </span>
                  </td>
                  <td>{formatDate(client.registrationDate)}</td>
                  <td>
                    <div className="actions">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setIsEditMode(false);
                          setCurrentClient(client);
                          setShowModal(true);
                        }}
                      >
                        <FaEye />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEdit(client);
                        }}
                      >
                        <FaEdit />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleStatus(client);
                        }}
                        className={`action-btn toggle-btn ${
                          client.user?.isActive
                            ? "toggle-active"
                            : "toggle-inactive"
                        }`}
                        disabled={toggleLoading[client._id]}
                        title={`${
                          client.user?.isActive ? "Deactivate" : "Activate"
                        } client ${client.clientName}`}
                      >
                        {toggleLoading[client._id] ? (
                          <CircularProgress
                            size={16}
                            sx={{ color: "inherit" }}
                          />
                        ) : client.user?.isActive ? (
                          <FaToggleOn />
                        ) : (
                          <FaToggleOff />
                        )}
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
              {searchTerm ||
              selectedStatus !== "all" ||
              (dateRange[0] && dateRange[1])
                ? "No clients found matching your search criteria"
                : "No clients found"}
            </p>
          </div>
        )}
      </div>
      <InfoModal
        open={showInfoModal}
        onClose={handleCloseInfoModal}
        selectedItem={selectedItem}
        adminPassword={adminPassword}
        setAdminPassword={setAdminPassword}
        passwordError={passwordError}
        isInfoVisible={isInfoVisible}
        handleAdminPasswordSubmit={handleAdminPasswordSubmit}
      />
      <Modal
        open={showModal}
        onClose={() => {
          if (!isLoading) {
            setShowModal(false);
            setIsEditMode(false);
          }
        }}
        aria-labelledby="modal-title"
        aria-describedby="modal-description"
      >
        {currentClient ? (
          isEditMode ? (
            <ModalContent
              formData={formData}
              handleChange={handleChange}
              handleSubmit={handleEditSubmit}
              setShowModal={setShowModal}
              modalStyle={modalStyle}
              currentClient={currentClient}
              errors={errors}
              isLoading={isLoading}
              clients={referralClients}
              referralHandlers={referralHandlers}
              handleDateChange={handleDateChange}
              formatRole={formatRole}
              adminPassword={adminPassword}
              setAdminPassword={setAdminPassword}
              passwordError={passwordError}
              isInfoVisible={isAdminAuthenticated}
              handleAdminPasswordSubmit={handleAdminPasswordSubmit}
            />
          ) : (
            <ViewClientModal
              client={currentClient}
              setShowModal={setShowModal}
              modalStyle={{
                position: "absolute",
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%)",
                width: isMobile ? "95vw" : "90vw",
                maxWidth: isMobile ? "none" : "700px",
                bgcolor: "background.paper",
                borderRadius: isMobile ? "8px" : "12px",
                boxShadow:
                  "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)",
                p: isMobile ? 2 : 4,
                maxHeight: "95vh",
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
              isInfoVisible={isAdminAuthenticated}
              handleAdminPasswordSubmit={handleAdminPasswordSubmit}
            />
          )
        ) : (
          <ModalContent
            formData={formData}
            handleChange={handleChange}
            handleSubmit={handleAddSubmit}
            setShowModal={setShowModal}
            modalStyle={modalStyle}
            errors={errors}
            isLoading={isLoading}
            clients={referralClients}
            referralHandlers={referralHandlers}
            handleDateChange={handleDateChange}
            formatRole={formatRole}
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

export default ClientsManagement;
