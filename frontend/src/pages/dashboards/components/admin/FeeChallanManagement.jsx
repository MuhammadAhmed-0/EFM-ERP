import { useState, useEffect, useCallback } from "react";
import {
  FaEdit,
  FaSearch,
  FaPlus,
  FaFilter,
  FaEye,
  FaPrint,
  FaTrash,
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
  Chip,
  Autocomplete,
} from "@mui/material";
import DeleteConfirmationModal from "../../../DeleteConfirmationModal";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { format } from "date-fns";
import axios from "axios";
import "../../../../styles/components/Management.css";
import { getModalStyles } from "../../../../styles/modal/commonModalStyles";
import { InputAdornment } from "@mui/material";
import ViewChallanModal from "./viewModals/ViewChallanModal";
import useNotification from "../../../../hooks/useNotification";
import NotificationSnackbar from "../../../../components/common/NotificationSnackbar";
import SyncButton from "../../../../components/common/SyncButton";
// import WhatsAppButton from "../../../../components/WhatsappButton";
const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];
const PAYMENT_METHODS = ["Cash", "Jazzcash", "Easypaisa", "Bank"];
const STATUS_OPTIONS = ["pending", "paid", "overdue", "partial"];
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
  handleAddSubmit,
  handleEditSubmit,
  setShowModal,
  currentChallan,
  errors,
  isLoading,
  handleDateChange,
  clients,
  capitalizeStatus,
  handleMonthToggle,
  getNextTwelveMonths,
  calculatePaymentTotals,
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
          md: "700px",
          lg: "800px",
          xl: "900px",
        },
        maxWidth: {
          xs: "400px",
          sm: "600px",
          md: "700px",
          lg: "800px",
          xl: "900px",
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
      <Typography
        variant="h6"
        sx={{
          mb: {
            xs: 2,
            sm: 2.5,
            md: 3,
          },
          textAlign: "center",
          fontSize: {
            xs: "1.1rem",
            sm: "1.2rem",
            md: "1.25rem",
            lg: "1.3rem",
          },
          fontWeight: 500,
          color: "#1e293b",
        }}
      >
        {currentChallan ? "Edit Fee Challan" : "Add New Fee Challan"}
      </Typography>

      <form onSubmit={currentChallan ? handleEditSubmit : handleAddSubmit}>
        <FormControl
          fullWidth
          margin="normal"
          size="small"
          required
          sx={{
            mb: {
              xs: 1.5,
              sm: 2,
              md: 2.5,
            },
          }}
        >
          <Autocomplete
            id="client-select-autocomplete"
            options={clients.filter((client) => client.isActive !== false)}
            getOptionLabel={(option) =>
              `${option.clientId || ""} - ${option.name}`
            }
            value={
              clients.find((client) => client._id === formData.clientId) || null
            }
            onChange={(event, newValue) => {
              handleChange({
                target: {
                  name: "clientId",
                  value: newValue ? newValue._id : "",
                },
              });
            }}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Client (Active Only)"
                error={!!errors.clientId}
                size="small"
                required
                helperText={errors.clientId || "Only active clients are shown"}
                sx={{
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
            )}
          />
        </FormControl>

        <TextField
          fullWidth
          label={`Amount (${formData.clientCurrency})`}
          name="amount"
          type="number"
          value={formData.amount}
          onChange={handleChange}
          required
          margin="normal"
          size="small"
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                {formData.clientCurrency}
              </InputAdornment>
            ),
          }}
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

        {formData.clientId && (
          <Typography
            variant="caption"
            color="textSecondary"
            sx={{
              ml: 1,
              fontSize: {
                xs: "0.75rem",
                sm: "0.8rem",
              },
            }}
          >
            Basic fee from client profile: {formData.clientCurrency}{" "}
            {clients.find((c) => c._id === formData.clientId)?.totalFee || 0}
          </Typography>
        )}

        <Box
          sx={{
            mb: {
              xs: 1.5,
              sm: 2,
              md: 2.5,
            },
          }}
        >
          <Typography
            variant="subtitle2"
            sx={{
              mb: 1,
              fontSize: {
                xs: "0.875rem",
                sm: "0.9rem",
                md: "1rem",
              },
            }}
          >
            Select Months
          </Typography>
          <Box
            sx={{
              display: "flex",
              flexWrap: "wrap",
              gap: {
                xs: 0.5,
                sm: 1,
              },
            }}
          >
            {MONTHS.map((month) => (
              <Chip
                key={month}
                label={month}
                onClick={() => handleMonthToggle(month)}
                color={formData.months.includes(month) ? "primary" : "default"}
                size={isMobile ? "small" : "medium"}
                sx={{
                  cursor: "pointer",
                  bgcolor: formData.months.includes(month)
                    ? "#1f3d61"
                    : "default",
                  color: formData.months.includes(month) ? "white" : "inherit",
                  fontSize: {
                    xs: "0.75rem",
                    sm: "0.8rem",
                    md: "0.875rem",
                  },
                  "&:hover": {
                    bgcolor: formData.months.includes(month)
                      ? "#1f3d70"
                      : "default",
                  },
                }}
              />
            ))}
          </Box>
          {errors.months && (
            <Typography
              color="error"
              variant="caption"
              sx={{
                mt: 1,
                fontSize: {
                  xs: "0.75rem",
                  sm: "0.8rem",
                },
              }}
            >
              {errors.months}
            </Typography>
          )}
        </Box>

        <Box
          sx={{
            display: "flex",
            gap: 2,
            flexDirection: {
              xs: "column",
              sm: "row",
            },
          }}
        >
          <LocalizationProvider dateAdapter={AdapterDateFns}>
            <DatePicker
              label="From Date"
              value={formData.fromDate}
              onChange={(date) => handleDateChange(date, "fromDate")}
              slotProps={{
                textField: {
                  fullWidth: true,
                  margin: "normal",
                  size: "small",
                  required: true,
                  sx: {
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
                  },
                },
              }}
            />
            <DatePicker
              label="To Date"
              value={formData.toDate}
              onChange={(date) => handleDateChange(date, "toDate")}
              slotProps={{
                textField: {
                  fullWidth: true,
                  margin: "normal",
                  size: "small",
                  required: true,
                  sx: {
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
                  },
                },
              }}
            />
          </LocalizationProvider>
        </Box>

        <FormControl
          fullWidth
          margin="normal"
          size="small"
          required
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
            Due Month
          </InputLabel>
          <Select
            name="dueMonth"
            value={formData.dueMonth}
            label="Due Month"
            onChange={handleChange}
            sx={{
              "& .MuiSelect-select": {
                fontSize: {
                  xs: "0.875rem",
                  sm: "0.9rem",
                  md: "1rem",
                },
              },
            }}
          >
            <MenuItem value="">Select Due Month</MenuItem>
            {getNextTwelveMonths().map((monthYear) => (
              <MenuItem key={monthYear} value={monthYear}>
                {monthYear}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {currentChallan && (
          <>
            <Typography
              variant="h6"
              sx={{
                mt: {
                  xs: 2,
                  sm: 2.5,
                  md: 3,
                },
                mb: 1,
                fontSize: {
                  xs: "1rem",
                  sm: "1.1rem",
                  md: "1.25rem",
                },
              }}
            >
              Payment Details
            </Typography>

            <Box
              sx={{
                mb: {
                  xs: 1.5,
                  sm: 2,
                },
                p: {
                  xs: 1.5,
                  sm: 2,
                },
                bgcolor: "#f8fafc",
                borderRadius: 1,
              }}
            >
              <Typography
                variant="subtitle2"
                sx={{
                  mb: 1,
                  fontSize: {
                    xs: "0.875rem",
                    sm: "0.9rem",
                    md: "1rem",
                  },
                }}
              >
                Current Payment Status
              </Typography>
              <Typography
                variant="body2"
                sx={{
                  fontSize: {
                    xs: "0.8rem",
                    sm: "0.875rem",
                  },
                }}
              >
                Total Amount: {currentChallan.clientCurrency}{" "}
                {currentChallan.amount}
              </Typography>
              <Typography
                variant="body2"
                color="success.main"
                sx={{
                  fontSize: {
                    xs: "0.8rem",
                    sm: "0.875rem",
                  },
                }}
              >
                Paid: {currentChallan.clientCurrency}{" "}
                {calculatePaymentTotals(currentChallan).totalPaid}
              </Typography>
              <Typography
                variant="body2"
                color="error.main"
                sx={{
                  fontSize: {
                    xs: "0.8rem",
                    sm: "0.875rem",
                  },
                }}
              >
                Pending: {currentChallan.clientCurrency}{" "}
                {calculatePaymentTotals(currentChallan).pendingAmount}
              </Typography>
            </Box>

            <Typography
              variant="subtitle2"
              sx={{
                mb: 1,
                fontSize: {
                  xs: "0.875rem",
                  sm: "0.9rem",
                  md: "1rem",
                },
              }}
            >
              Add New Payment
            </Typography>

            <TextField
              fullWidth
              label="Payment Amount"
              name="amountPaid"
              type="number"
              value={formData.amountPaid}
              onChange={handleChange}
              margin="normal"
              size="small"
              inputProps={{
                max: calculatePaymentTotals(currentChallan).pendingAmount,
                min: 0,
                step: "0.01",
              }}
              helperText={`Maximum: ${currentChallan.clientCurrency} ${
                calculatePaymentTotals(currentChallan).pendingAmount
              }`}
              sx={{
                mb: {
                  xs: 1.5,
                  sm: 2,
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

            <FormControl
              fullWidth
              margin="normal"
              size="small"
              sx={{
                mb: {
                  xs: 1.5,
                  sm: 2,
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
                Payment Method
              </InputLabel>
              <Select
                name="paymentMethod"
                value={formData.paymentMethod || ""}
                label="Payment Method"
                onChange={handleChange}
                sx={{
                  "& .MuiSelect-select": {
                    fontSize: {
                      xs: "0.875rem",
                      sm: "0.9rem",
                      md: "1rem",
                    },
                  },
                }}
              >
                {PAYMENT_METHODS.map((method) => (
                  <MenuItem key={method} value={method}>
                    {method.charAt(0).toUpperCase() + method.slice(1)}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              fullWidth
              label="Transaction ID"
              name="transactionId"
              value={formData.transactionId}
              onChange={handleChange}
              margin="normal"
              size="small"
              sx={{
                mb: {
                  xs: 1.5,
                  sm: 2,
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

            <LocalizationProvider dateAdapter={AdapterDateFns}>
              <DatePicker
                label="Payment Date"
                value={
                  formData.paymentDate
                    ? new Date(formData.paymentDate)
                    : new Date()
                }
                onChange={(date) => handleDateChange(date, "paymentDate")}
                slotProps={{
                  textField: {
                    fullWidth: true,
                    margin: "normal",
                    size: "small",
                    sx: {
                      mb: {
                        xs: 1.5,
                        sm: 2,
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
                    },
                  },
                }}
              />
            </LocalizationProvider>

            <Typography
              variant="h6"
              sx={{
                mt: {
                  xs: 2,
                  sm: 2.5,
                  md: 3,
                },
                mb: 1,
                fontSize: {
                  xs: "1rem",
                  sm: "1.1rem",
                  md: "1.25rem",
                },
              }}
            >
              Update Challan Details
            </Typography>

            <FormControl
              fullWidth
              margin="normal"
              size="small"
              sx={{
                mb: {
                  xs: 1.5,
                  sm: 2,
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
                Status Override
              </InputLabel>
              <Select
                name="status"
                value={formData.status || ""}
                label="Status Override"
                onChange={handleChange}
                sx={{
                  "& .MuiSelect-select": {
                    fontSize: {
                      xs: "0.875rem",
                      sm: "0.9rem",
                      md: "1rem",
                    },
                  },
                }}
              >
                <MenuItem value="">Auto (Based on Payments)</MenuItem>
                {STATUS_OPTIONS.map((status) => (
                  <MenuItem key={status} value={status.toLowerCase()}>
                    {capitalizeStatus(status)}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </>
        )}

        <TextField
          fullWidth
          label="Remarks"
          name="remarks"
          value={formData.remarks}
          onChange={handleChange}
          margin="normal"
          size="small"
          multiline
          rows={isMobile ? 2 : 3}
          sx={{
            mb: {
              xs: 2,
              sm: 2.5,
              md: 3,
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
            ) : currentChallan ? (
              "Update Challan"
            ) : (
              "Add Challan"
            )}
          </button>
        </Box>
      </form>
    </Box>
  );
};

const FeeChallanManagement = () => {
  const initialFormState = {
    clientId: "",
    amount: "",
    months: [],
    fromDate: null,
    toDate: null,
    dueMonth: "",
    remarks: "",
    status: "",
    paymentMethod: "",
    transactionId: "",
    paymentDate: null,
    amountPaid: "",
    clientCurrency: "PKR",
  };
  const [exchangeRates, setExchangeRates] = useState({});
  const [challans, setChallans] = useState([]);
  const [clients, setClients] = useState([]);
  const [filteredChallans, setFilteredChallans] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [currentChallan, setCurrentChallan] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [selectedClient, setSelectedClient] = useState("all");
  const [selectedMonth, setSelectedMonth] = useState("all");
  const [formData, setFormData] = useState(initialFormState);
  const [selectedCreationMonth, setSelectedCreationMonth] = useState("all");
  const [selectedCreationYear, setSelectedCreationYear] = useState(
    new Date().getFullYear()
  );
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [challanToDelete, setChallanToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isViewMode, setIsViewMode] = useState(false);
  const [errors, setErrors] = useState({});
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [selectedCurrency, setSelectedCurrency] = useState("all");
  const [showActiveClients, setShowActiveClients] = useState(false);
  const [showInactiveClients, setShowInactiveClients] = useState(false);
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
    fetchClients();
    fetchChallans(true);
  }, []);

  useEffect(() => {
    const fetchRates = async () => {
      const currencies = new Set(
        challans.map((challan) => challan.clientCurrency)
      );
      for (const currency of currencies) {
        if (currency !== "PKR" && !exchangeRates[currency]) {
          await fetchExchangeRate(currency);
        }
      }
    };

    fetchRates();
  }, [challans]);

  const handleCloseModal = () => {
    if (!isLoading) {
      setShowModal(false);
      setIsViewMode(false);
      setCurrentChallan(null);
      setFormData(initialFormState);
    }
  };

  const getUniqueYears = () => {
    const years = new Set(
      challans.map((challan) => new Date(challan.createdAt).getFullYear())
    );
    return Array.from(years).sort((a, b) => b - a);
  };
  const handleAddPayment = async (challanId, paymentData) => {
    try {
      const token = localStorage.getItem("token");

      await axios.post(
        `${BASE_URL}/api/admin/fees/challan/${challanId}/payment`,
        paymentData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      showNotification("Payment added successfully");
      fetchChallans();
      return true;
    } catch (error) {
      showNotification(
        error.response?.data?.msg || "Error adding payment",
        "error"
      );
      return false;
    }
  };
  const calculateTotals = useCallback(() => {
    const totals = {
      total: 0,
      pending: 0,
      paid: 0,
      overdue: 0,
      partial: 0,
    };

    filteredChallans.forEach((challan) => {
      const amount = Number(challan.amount);
      const paymentTotals = calculatePaymentTotals(challan);
      const paymentStatus = getPaymentStatus(challan);

      if (selectedCurrency === "all") {
        const convertedAmount =
          challan.clientCurrency === "PKR"
            ? amount
            : amount * (exchangeRates[challan.clientCurrency] || 0);

        const convertedPaid =
          challan.clientCurrency === "PKR"
            ? paymentTotals.totalPaid
            : paymentTotals.totalPaid *
              (exchangeRates[challan.clientCurrency] || 0);

        totals.total += convertedAmount;
        totals.paid += convertedPaid;
        totals.pending += convertedAmount - convertedPaid;

        if (paymentStatus === "overdue")
          totals.overdue += convertedAmount - convertedPaid;
      } else if (challan.clientCurrency === selectedCurrency) {
        totals.total += amount;
        totals.paid += paymentTotals.totalPaid;
        totals.pending += paymentTotals.pendingAmount;

        if (paymentStatus === "overdue")
          totals.overdue += paymentTotals.pendingAmount;
      }
    });

    return totals;
  }, [filteredChallans, selectedCurrency, exchangeRates]);
  const getPaymentStatus = (challan) => {
    if (!challan.paymentHistory || challan.paymentHistory.length === 0) {
      return challan.status === "overdue" ? "overdue" : "pending";
    }

    const totalPaid = challan.paymentHistory.reduce(
      (sum, payment) => sum + (payment.amount || 0),
      0
    );
    const totalAmount = challan.amount;

    if (totalPaid >= totalAmount) {
      return "fully_paid";
    } else if (totalPaid > 0) {
      return "partially_paid";
    }
    return "pending";
  };

  const getPaymentStatusText = (status) => {
    switch (status) {
      case "fully_paid":
        return "Paid";
      case "partially_paid":
        return "Partial";
      case "pending":
        return "Pending";
      case "overdue":
        return "Overdue";
      default:
        return capitalizeStatus(status);
    }
  };

  const calculatePaymentTotals = (challan) => {
    const totalPaid =
      challan.paymentHistory?.reduce(
        (sum, payment) => sum + (payment.amount || 0),
        0
      ) || 0;
    const pendingAmount = Math.max(0, challan.amount - totalPaid);

    return {
      totalPaid,
      pendingAmount,
      totalAmount: challan.amount,
    };
  };
  const getNextTwelveMonths = () => {
    const months = [];
    const currentDate = new Date();

    for (let i = 0; i < 12; i++) {
      const date = new Date(
        currentDate.getFullYear(),
        currentDate.getMonth() + i,
        1
      );
      const monthYear = `${MONTHS[date.getMonth()]}-${date.getFullYear()}`;
      months.push(monthYear);
    }

    return months;
  };
  const handleDeleteChallan = (challan) => {
    setChallanToDelete(challan);
    setShowDeleteModal(true);
  };

  const confirmDeleteChallan = async () => {
    if (!challanToDelete) return;

    setIsDeleting(true);
    try {
      const token = localStorage.getItem("token");
      const response = await axios.delete(
        `${BASE_URL}/api/admin/fees/challan/${challanToDelete._id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      showNotification("Challan deleted successfully");
      setChallans((prevChallans) =>
        prevChallans.filter((c) => c._id !== challanToDelete._id)
      );

      fetchChallans();
      setShowDeleteModal(false);
      setChallanToDelete(null);
    } catch (error) {
      console.error("Error deleting challan:", error);
      const errorMessage =
        error.response?.data?.msg || "Error deleting challan";
      showNotification(errorMessage, "error");

      if (
        error.message.includes("Network Error") ||
        error.message.includes("Connection Refused")
      ) {
        showNotification(
          "Network error - Server might be down. Please try again later.",
          "error"
        );
      }
    } finally {
      setIsDeleting(false);
    }
  };

  const closeDeleteModal = () => {
    if (!isDeleting) {
      setShowDeleteModal(false);
      setChallanToDelete(null);
    }
  };

  const fetchClients = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(
        `${BASE_URL}/api/admin/clients-with-students`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      const clientsList = response.data.clients.map((client) => ({
        _id: client.user._id,
        name: client.clientName,
        totalFee: client.totalFee,
        currency: client.currency,
        clientId: client.clientId,
        isActive: client.user?.isActive !== false,
      }));
      setClients(clientsList);
    } catch (error) {
      showNotification("Error fetching clients", "error");
    }
  };

  const fetchChallans = async (showSuccessMessage = false) => {
    setIsSyncing(true);
    if (isInitialLoading) {
      setIsLoading(true);
    }
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(
        `${BASE_URL}/api/payments/admin/challans`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      setChallans(response.data.challans);
      setFilteredChallans(response.data.challans);
      if (showSuccessMessage) {
        showNotification("Challans invoices refreshed successfully");
      }
    } catch (error) {
      showNotification(
        error.response?.data?.message || "Error fetching challans",
        "error"
      );
    } finally {
      setIsSyncing(false);
      setIsLoading(false);
      setIsInitialLoading(false);
    }
  };
  const fetchExchangeRate = async (fromCurrency) => {
    if (fromCurrency === "PKR") return 1;
    if (exchangeRates[fromCurrency]) return exchangeRates[fromCurrency];

    try {
      const response = await axios.get(
        `https://v6.exchangerate-api.com/v6/0664b02840ea58da831cd9c9/pair/${fromCurrency}/PKR`
      );
      const rate = response.data.conversion_rate;
      setExchangeRates((prev) => ({
        ...prev,
        [fromCurrency]: rate,
      }));
      return rate;
    } catch (error) {
      console.error("Error fetching exchange rate:", error);
      return null;
    }
  };

  const convertToPKR = (amount, currency) => {
    const rate = exchangeRates[currency];
    if (!rate) return "Loading...";
    return (amount * rate).toFixed(2);
  };

  useEffect(() => {
    fetchClients();
    fetchChallans();
  }, []);

  const handleMonthToggle = (month) => {
    setFormData((prev) => {
      const months = prev.months.includes(month)
        ? prev.months.filter((m) => m !== month)
        : [...prev.months, month].sort(
            (a, b) => MONTHS.indexOf(a) - MONTHS.indexOf(b)
          );
      return {
        ...prev,
        months,
      };
    });
  };
  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === "clientId") {
      const selectedClient = clients.find((client) => client._id === value);
      setFormData((prev) => ({
        ...prev,
        [name]: value,
        amount: selectedClient ? selectedClient.totalFee : "",
        clientCurrency: selectedClient ? selectedClient.currency : "USD",
      }));
    } else if (name === "months") {
      setFormData((prev) => ({
        ...prev,
        months: Array.isArray(value) ? value : [],
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const handleDateChange = (date, field) => {
    setFormData((prev) => ({
      ...prev,
      [field]: date,
    }));
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const token = localStorage.getItem("token");
      const payload = {
        amount: formData.amount,
        months: formData.months,
        fromDate: formData.fromDate,
        toDate: formData.toDate,
        dueMonth: formData.dueMonth,
        remarks: formData.remarks,
        clientCurrency: formData.clientCurrency,
      };

      await axios.post(
        `${BASE_URL}/api/admin/fees/challan/${formData.clientId}`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      showNotification("Challan added successfully");
      fetchChallans();
      setShowModal(false);
    } catch (error) {
      if (error.response?.status === 409) {
        showNotification(
          error.response.data.msg || "Challan for these months already exists",
          "error"
        );
      } else {
        showNotification(
          error.response?.data?.msg ||
            error.response?.data?.message ||
            "Error adding challan",
          "error"
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const token = localStorage.getItem("token");
      let success = true;

      if (formData.amountPaid && parseFloat(formData.amountPaid) > 0) {
        const paymentData = {
          amount: parseFloat(formData.amountPaid),
          paymentMethod: formData.paymentMethod || "manual",
          transactionId: formData.transactionId || "",
          remarks: formData.remarks || "",
        };

        success = await handleAddPayment(currentChallan._id, paymentData);
      }

      if (success) {
        let payload = {};

        if (formData.amount !== currentChallan.amount) {
          payload.amount = formData.amount;
        }

        if (
          JSON.stringify(formData.months) !==
          JSON.stringify(currentChallan.months)
        ) {
          payload.months = formData.months;
        }

        if (formData.dueMonth !== currentChallan.dueMonth) {
          payload.dueMonth = formData.dueMonth;
        }

        if (formData.remarks !== currentChallan.remarks) {
          payload.remarks = formData.remarks;
        }

        if (formData.status && formData.status !== currentChallan.status) {
          payload.status = formData.status;
        }

        if (Object.keys(payload).length > 0) {
          await axios.put(
            `${BASE_URL}/api/admin/fees/challan/${currentChallan._id}`,
            payload,
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          );
          showNotification("Challan updated successfully");
        }

        fetchChallans();
        setShowModal(false);
      }
    } catch (error) {
      showNotification(
        error.response?.data?.message || "Error updating challan",
        "error"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const capitalizeStatus = (status) => {
    return status.charAt(0).toUpperCase() + status.toLowerCase().slice(1);
  };

  useEffect(() => {
    let filtered = [...challans];

    if (searchTerm) {
      filtered = filtered.filter(
        (challan) =>
          challan.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (challan.clientMainId &&
            challan.clientMainId
              .toLowerCase()
              .includes(searchTerm.toLowerCase()))
      );
    }
    if (selectedClient !== "all") {
      filtered = filtered.filter(
        (challan) => challan.client === selectedClient
      );
    }

    if (selectedMonth !== "all") {
      filtered = filtered.filter((challan) =>
        Array.isArray(challan.months)
          ? challan.months.includes(selectedMonth)
          : challan.month === selectedMonth
      );
    }

    if (selectedStatus !== "all") {
      filtered = filtered.filter(
        (challan) =>
          challan.status.toLowerCase() === selectedStatus.toLowerCase()
      );
    }

    if (selectedCurrency !== "all") {
      filtered = filtered.filter(
        (challan) => challan.clientCurrency === selectedCurrency
      );
    }

    if (showActiveClients && !showInactiveClients) {
      filtered = filtered.filter((challan) => challan.clientIsActive === true);
    } else if (!showActiveClients && showInactiveClients) {
      filtered = filtered.filter((challan) => challan.clientIsActive === false);
    }

    if (selectedCreationMonth !== "all") {
      filtered = filtered.filter((challan) => {
        const creationDate = new Date(challan.createdAt);
        return (
          creationDate.getMonth() + 1 === selectedCreationMonth &&
          creationDate.getFullYear() === selectedCreationYear
        );
      });
    }

    setFilteredChallans(filtered);
  }, [
    challans,
    searchTerm,
    selectedClient,
    selectedMonth,
    selectedStatus,
    selectedCurrency,
    selectedCreationMonth,
    selectedCreationYear,
    showActiveClients,
    showInactiveClients,
  ]);

  return (
    <div className="management-container">
      <div className="management-header">
        <div>
          <h2>Fee Challan Management</h2>
          <p className="total-count">
            {filteredChallans.length} Total Challans
          </p>
        </div>
        <div className="header-buttons">
          <SyncButton
            isSyncing={isSyncing}
            onClick={() => fetchChallans(true)}
          />

          <button
            className="add-btn responsive-add-btn"
            onClick={() => {
              setIsViewMode(false);
              setCurrentChallan(null);
              setFormData(initialFormState);
              setShowModal(true);
            }}
            title="Add Challan"
          >
            <FaPlus />
            <span className="add-btn-text">Add Challan</span>
          </button>
        </div>
      </div>
      <div className="stats-cards">
        <div className="stat-card total-amount">
          <h3>Total Amount</h3>
          <p>
            {selectedCurrency === "all" ? "PKR" : selectedCurrency}{" "}
            {calculateTotals().total.toFixed(2)}
          </p>
        </div>

        <div className="stat-card pending-amount">
          <h3>Pending Amount</h3>
          <p>
            {selectedCurrency === "all" ? "PKR" : selectedCurrency}{" "}
            {calculateTotals().pending.toFixed(2)}
          </p>
        </div>

        <div className="stat-card paid-amount">
          <h3>Paid Amount</h3>
          <p>
            {selectedCurrency === "all" ? "PKR" : selectedCurrency}{" "}
            {calculateTotals().paid.toFixed(2)}
          </p>
        </div>

        <div className="stat-card overdue-amount">
          <h3>Overdue Amount</h3>
          <p>
            {selectedCurrency === "all" ? "PKR" : selectedCurrency}{" "}
            {calculateTotals().overdue.toFixed(2)}
          </p>
        </div>
      </div>
      <div className="filter-section">
        <div
          className="date-filter-group"
          style={{
            padding: window.innerWidth < 768 ? "12px" : "15px",
            backgroundColor: "#fff",
            borderRadius: "5px",
            border: "1px solid #d4d4d4",
            width: "100%",
            display: "flex",
            alignItems: window.innerWidth < 768 ? "flex-start" : "center",
            gap: window.innerWidth < 768 ? "10px" : "15px",
            flexDirection: window.innerWidth < 768 ? "column" : "row",
          }}
        >
          <Typography
            variant="subtitle1"
            sx={{
              color: "#475569",
              minWidth: window.innerWidth < 768 ? "auto" : "120px",
              fontWeight: "700",
              fontSize: {
                xs: "0.9rem",
                sm: "1rem",
                md: "1.1rem",
              },
              textAlign: window.innerWidth < 768 ? "center" : "left",
              width: window.innerWidth < 768 ? "100%" : "auto",
            }}
          >
            Filter by Creation:
          </Typography>
          <div
            style={{
              display: "flex",
              gap: window.innerWidth < 768 ? "8px" : "10px",
              alignItems: "center",
              flexDirection: window.innerWidth < 480 ? "column" : "row",
              width: window.innerWidth < 768 ? "100%" : "auto",
              justifyContent: window.innerWidth < 768 ? "center" : "flex-start",
            }}
          >
            <div className="filter-box" style={{ position: "relative" }}>
              <FaFilter className="filter-icon" />
              <Select
                value={selectedCreationMonth}
                onChange={(e) => setSelectedCreationMonth(e.target.value)}
                className="client-select"
                sx={{
                  width: {
                    xs: "100%",
                    sm: "180px",
                    md: "200px",
                  },
                  minWidth: {
                    xs: "100%",
                    sm: "150px",
                  },
                  height: "40px",
                  ".MuiSelect-select": {
                    padding:
                      window.innerWidth <= 768
                        ? "6px 25px"
                        : "8px 12px 8px 36px",
                    backgroundColor: "white",
                    borderRadius: "6px",
                    fontSize: "0.875rem",
                    color: "#475569",
                    marginTop: 0.5,
                  },
                  ".MuiOutlinedInput-notchedOutline": {
                    border: "none",
                  },
                }}
              >
                <MenuItem value="all">All Months</MenuItem>
                {MONTHS.map((month, index) => (
                  <MenuItem key={month} value={index + 1}>
                    {month}
                  </MenuItem>
                ))}
              </Select>
            </div>
            <div className="filter-box" style={{ position: "relative" }}>
              <FaFilter className="filter-icon" />
              <Select
                value={selectedCreationYear}
                onChange={(e) => setSelectedCreationYear(e.target.value)}
                className="client-select"
                sx={{
                  width: {
                    xs: "100%",
                    sm: "180px",
                    md: "200px",
                  },
                  minWidth: {
                    xs: "100%",
                    sm: "150px",
                  },
                  height: "40px",
                  ".MuiSelect-select": {
                    padding:
                      window.innerWidth <= 768
                        ? "6px 25px"
                        : "8px 12px 8px 36px",
                    backgroundColor: "white",
                    borderRadius: "6px",
                    fontSize: "0.875rem",
                    color: "#475569",
                    marginTop: 0.5,
                  },
                  ".MuiOutlinedInput-notchedOutline": {
                    border: "none",
                  },
                }}
              >
                {getUniqueYears().map((year) => (
                  <MenuItem key={year} value={year}>
                    {year}
                  </MenuItem>
                ))}
              </Select>
            </div>
          </div>
        </div>
      </div>
      <div className="filter-section">
        <div className="search-box">
          <FaSearch className="search-icon" />
          <input
            type="text"
            placeholder="Search by Name or ID."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="filter-box checkbox-filter">
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={showActiveClients}
              onChange={(e) => setShowActiveClients(e.target.checked)}
              className="checkbox-input"
            />
            <span className="checkbox-text">Active Clients</span>
          </label>
          <label className="checkbox-label" style={{ marginLeft: "16px" }}>
            <input
              type="checkbox"
              checked={showInactiveClients}
              onChange={(e) => setShowInactiveClients(e.target.checked)}
              className="checkbox-input"
            />
            <span className="checkbox-text">Inactive Clients</span>
          </label>
        </div>
        <div className="filter-box" style={{ position: "relative" }}>
          <FaFilter className="filter-icon" />
          <Select
            className="month-select"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            sx={{
              width: {
                xs: "100%",
                sm: "180px",
                md: "200px",
              },
              minWidth: {
                xs: "100%",
                sm: "150px",
              },
              height: "40px",
              ".MuiSelect-select": {
                padding:
                  window.innerWidth <= 768 ? "6px 25px" : "8px 12px 8px 36px",
                backgroundColor: "white",
                borderRadius: "6px",
                fontSize: "0.875rem",
                color: "#475569",
                marginTop: 0.5,
              },
              ".MuiOutlinedInput-notchedOutline": {
                border: "none",
              },
            }}
          >
            <MenuItem value="all">All Months</MenuItem>
            {MONTHS.map((month) => (
              <MenuItem key={month} value={month}>
                {month}
              </MenuItem>
            ))}
          </Select>
        </div>

        <div className="filter-box" style={{ position: "relative" }}>
          <FaFilter className="filter-icon" />
          <Select
            className="status-select"
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            sx={{
              width: {
                xs: "100%",
                sm: "180px",
                md: "200px",
              },
              minWidth: {
                xs: "100%",
                sm: "150px",
              },
              height: "40px",
              ".MuiSelect-select": {
                padding: "8px 12px 8px 36px",
                backgroundColor: "white",
                border: "1px solid #e2e8f0",
                borderRadius: "6px",
                fontSize: "0.875rem",
                color: "#475569",
              },
              ".MuiOutlinedInput-notchedOutline": {
                border: "none",
              },
            }}
          >
            <MenuItem value="all">All Status</MenuItem>
            {STATUS_OPTIONS.map((status) => (
              <MenuItem key={status} value={status.toLowerCase()}>
                {capitalizeStatus(status)}
              </MenuItem>
            ))}
          </Select>
        </div>

        <div className="filter-box" style={{ position: "relative" }}>
          <FaFilter className="filter-icon" />
          <Select
            className="currency-select"
            value={selectedCurrency}
            onChange={(e) => setSelectedCurrency(e.target.value)}
            sx={{
              width: {
                xs: "100%",
                sm: "180px",
                md: "200px",
              },
              minWidth: {
                xs: "100%",
                sm: "150px",
              },
              height: "40px",
              ".MuiSelect-select": {
                padding: "8px 12px 8px 36px",
                backgroundColor: "white",
                border: "1px solid #e2e8f0",
                borderRadius: "6px",
                fontSize: "0.875rem",
                color: "#475569",
              },
              ".MuiOutlinedInput-notchedOutline": {
                border: "none",
              },
            }}
          >
            <MenuItem value="all">All Currencies</MenuItem>
            {CURRENCIES.map((currency) => (
              <MenuItem key={currency} value={currency}>
                {currency}
              </MenuItem>
            ))}
          </Select>
        </div>
        <button
          className="clear-filters-btn"
          onClick={() => {
            setSelectedClient("all");
            setSelectedMonth("all");
            setSelectedStatus("all");
            setSelectedCurrency("all");
            setSelectedCreationMonth("all");
            setSelectedCreationYear(new Date().getFullYear());
            setSearchTerm("");
            setShowActiveClients(false);
            setShowInactiveClients(false);
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
        ) : filteredChallans.length > 0 ? (
          <table>
            <thead>
              <tr>
                <th>Client</th>
                <th>Amount</th>
                <th>
                  Amount <br /> (PKR)
                </th>
                <th>Month</th>
                <th>
                  Created <br /> Date
                </th>
                <th>
                  Due <br /> Month
                </th>
                <th>
                  Payment <br /> Date
                </th>
                <th>Status</th>
                <th>Remarks</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredChallans.map((challan) => {
                const paymentTotals = calculatePaymentTotals(challan);
                const paymentStatus = getPaymentStatus(challan);

                return (
                  <tr key={challan._id}>
                    <td>
                      <div style={{ fontWeight: "500" }}>
                        {challan.clientName
                          .replace("(Inactive Client)", "")
                          .trim()}
                      </div>
                      <span style={{ color: "#64748b", fontSize: "0.8125rem" }}>
                        {challan.clientMainId}
                      </span>
                      <div style={{ marginTop: "4px" }}>
                        <span
                          style={{
                            fontSize: "0.7rem",
                            fontWeight: "500",
                            color: challan.clientIsActive
                              ? "#22c55e"
                              : "#dc2626",
                            backgroundColor: challan.clientIsActive
                              ? "#dcfce7"
                              : "#fee2e2",
                            padding: "2px 6px",
                            borderRadius: "4px",
                          }}
                        >
                          {challan.clientIsActive ? "Active" : "Inactive"}
                        </span>
                      </div>
                    </td>
                    <td style={{ fontWeight: "500" }}>
                      <div>
                        {challan.clientCurrency} {challan.amount}
                      </div>
                      {paymentTotals.totalPaid > 0 && (
                        <div
                          style={{
                            fontSize: "0.8rem",
                            color: "#15803d",
                          }}
                        >
                          Paid: {challan.clientCurrency}{" "}
                          {paymentTotals.totalPaid}
                        </div>
                      )}
                      {paymentTotals.pendingAmount > 0 && (
                        <div
                          style={{
                            fontSize: "0.8rem",
                            color: "#991b1b",
                          }}
                        >
                          Pending: {challan.clientCurrency}{" "}
                          {paymentTotals.pendingAmount}
                        </div>
                      )}
                    </td>
                    <td style={{ fontWeight: "500" }}>
                      <div>
                        PKR{" "}
                        {challan.clientCurrency === "PKR"
                          ? challan.amount
                          : convertToPKR(
                              challan.amount,
                              challan.clientCurrency
                            )}
                      </div>
                      {paymentTotals.totalPaid > 0 && (
                        <div
                          style={{
                            fontSize: "0.8rem",
                            color: "#15803d",
                          }}
                        >
                          Paid: PKR{" "}
                          {challan.clientCurrency === "PKR"
                            ? paymentTotals.totalPaid
                            : convertToPKR(
                                paymentTotals.totalPaid,
                                challan.clientCurrency
                              )}
                        </div>
                      )}
                    </td>
                    <td style={{ fontWeight: "500" }}>
                      {Array.isArray(challan.months) &&
                      challan.months.length > 0 ? (
                        (() => {
                          const shortMonths = {
                            January: "Jan",
                            February: "Feb",
                            March: "Mar",
                            April: "Apr",
                            May: "May",
                            June: "Jun",
                            July: "Jul",
                            August: "Aug",
                            September: "Sep",
                            October: "Oct",
                            November: "Nov",
                            December: "Dec",
                          };

                          const monthIndices = challan.months.map((month) =>
                            MONTHS.indexOf(month)
                          );
                          const firstMonth =
                            shortMonths[MONTHS[Math.min(...monthIndices)]];
                          const lastMonth =
                            shortMonths[MONTHS[Math.max(...monthIndices)]];

                          return monthIndices.length > 1
                            ? `${firstMonth} to ${lastMonth}`
                            : firstMonth;
                        })()
                      ) : (
                        <div>
                          {challan.month
                            ? (() => {
                                const shortMonths = {
                                  January: "Jan",
                                  February: "Feb",
                                  March: "Mar",
                                  April: "Apr",
                                  May: "May",
                                  June: "Jun",
                                  July: "Jul",
                                  August: "Aug",
                                  September: "Sep",
                                  October: "Oct",
                                  November: "Nov",
                                  December: "Dec",
                                };
                                return shortMonths[challan.month] || "N/A";
                              })()
                            : "N/A"}
                        </div>
                      )}
                    </td>
                    <td>{format(new Date(challan.createdAt), "dd/MM/yyyy")}</td>
                    <td style={{ fontWeight: "500" }}>
                      {challan.dueMonth || "Not Set"}
                    </td>
                    <td style={{ fontWeight: "500" }}>
                      {challan.paymentHistory &&
                      challan.paymentHistory.length > 0 ? (
                        <div>
                          {challan.paymentHistory.map((payment, index) => (
                            <div key={index}>
                              <div
                                style={{
                                  fontSize: "0.75rem",
                                  marginBottom: "2px",
                                }}
                              >
                                {format(new Date(payment.date), "dd/MM/yyyy")} -{" "}
                                {challan.clientCurrency} {payment.amount}
                              </div>
                              <br />
                            </div>
                          ))}
                        </div>
                      ) : (
                        "Not Paid"
                      )}
                    </td>
                    <td>
                      <span
                        style={{
                          display: "inline-block",
                          padding: "4px 12px",
                          fontSize: "0.75rem",
                          fontWeight: 500,
                          borderRadius: "5px",
                          textTransform: "uppercase",
                          color: (() => {
                            switch (paymentStatus) {
                              case "fully_paid":
                                return "#15803d";
                              case "partially_paid":
                                return "#92400e";
                              case "overdue":
                                return "#991b1b";
                              case "pending":
                              default:
                                return "#991b1b";
                            }
                          })(),
                          backgroundColor: (() => {
                            switch (paymentStatus) {
                              case "fully_paid":
                                return "#dcfce7";
                              case "partially_paid":
                                return "#fef3c7";
                              case "overdue":
                                return "#fee2e2";
                              case "pending":
                              default:
                                return "#fee2e2";
                            }
                          })(),
                        }}
                      >
                        {getPaymentStatusText(paymentStatus)}
                      </span>
                    </td>

                    <td>{challan.remarks}</td>
                    <td>
                      <div className="actions">
                        <button
                          onClick={() => {
                            setCurrentChallan(challan);
                            setIsViewMode(true);
                            setShowModal(true);
                            setFormData(initialFormState);
                          }}
                        >
                          <FaEye />
                        </button>
                        <button
                          onClick={() => {
                            setCurrentChallan(challan);
                            setIsViewMode(false);
                            setFormData({
                              clientId: challan.client._id,
                              amount: challan.amount,
                              months: challan.months ? [...challan.months] : [],
                              fromDate: challan.fromDate
                                ? new Date(challan.fromDate)
                                : null,
                              toDate: challan.toDate
                                ? new Date(challan.toDate)
                                : null,
                              dueMonth: challan.dueMonth,
                              remarks: challan.remarks,
                              status: challan.status,
                              paymentMethod: challan.paymentMethod || "",
                              transactionId: challan.transactionId || "",
                              paymentDate: challan.paymentDate
                                ? new Date(challan.paymentDate)
                                : null,
                              amountPaid: "",
                              clientCurrency: challan.clientCurrency,
                            });
                            setShowModal(true);
                          }}
                        >
                          <FaEdit />
                        </button>
                        <button>
                          <a
                            href={`/challan/print/${challan._id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="print-link"
                          >
                            <FaPrint color="#64748b" />
                          </a>
                        </button>
                        {/* <WhatsAppButton
                          challan={{
                            ...challan,
                            clientPhoneNumber: challan.clientPhoneNumber,
                            totalStudents: challan.totalStudents || "01",
                          }}
                          onSuccess={(message) =>
                            showNotification(message, "success")
                          }
                          onError={(error) => showNotification(error, "error")}
                        /> */}
                        <button
                          onClick={() => handleDeleteChallan(challan)}
                          title="Delete challan"
                        >
                          <FaTrash color="#64748b" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        ) : (
          <div className="no-data">
            <p>No challans found</p>
          </div>
        )}
      </div>
      <Modal open={showModal} onClose={() => handleCloseModal()}>
        {isViewMode && currentChallan ? (
          <ViewChallanModal
            challan={currentChallan}
            setShowModal={handleCloseModal}
            months={MONTHS}
            modalStyle={getModalStyles()}
          />
        ) : (
          <ModalContent
            formData={formData}
            handleChange={handleChange}
            handleAddSubmit={handleAddSubmit}
            handleEditSubmit={handleEditSubmit}
            setShowModal={handleCloseModal}
            currentChallan={currentChallan}
            errors={errors}
            isLoading={isLoading}
            handleDateChange={handleDateChange}
            clients={clients}
            capitalizeStatus={capitalizeStatus}
            handleMonthToggle={handleMonthToggle}
            getNextTwelveMonths={getNextTwelveMonths}
            calculatePaymentTotals={calculatePaymentTotals}
          />
        )}
      </Modal>
      <DeleteConfirmationModal
        open={showDeleteModal}
        onClose={closeDeleteModal}
        onConfirm={confirmDeleteChallan}
        isLoading={isDeleting}
        type="challan"
        data={challanToDelete}
      />
      <NotificationSnackbar
        notification={notification}
        onClose={closeNotification}
      />
    </div>
  );
};

export default FeeChallanManagement;
