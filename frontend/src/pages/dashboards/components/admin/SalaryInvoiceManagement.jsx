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
  Autocomplete,
} from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { format } from "date-fns";
import axios from "axios";
import ViewSalaryModal from "./viewModals/ViewSalaryModal";
import "../../../../styles/components/Management.css";
import { getModalStyles } from "../../../../styles/modal/commonModalStyles";
import DeleteConfirmationModal from "../../../DeleteConfirmationModal";
import useNotification from "../../../../hooks/useNotification";
import NotificationSnackbar from "../../../../components/common/NotificationSnackbar";
import SyncButton from "../../../../components/common/SyncButton";
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
  currentInvoice,
  errors,
  isLoading,
  handleDateChange,
  staff,
  formatRoleDisplay,
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
          md: "600px",
          lg: "700px",
          xl: "750px",
        },
        maxWidth: {
          xs: "400px",
          sm: "500px",
          md: "600px",
          lg: "700px",
          xl: "750px",
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
        {currentInvoice ? "Edit Salary Invoice" : "Generate Salary Invoice"}
      </Typography>

      <form onSubmit={handleSubmit}>
        {currentInvoice ? (
          <TextField
            fullWidth
            label="Staff Member"
            value={
              staff.find((m) => m._id === formData.userId)
                ? `${
                    staff.find((m) => m._id === formData.userId).staffId || ""
                  } - ${
                    staff.find((m) => m._id === formData.userId).name
                  } (${formatRoleDisplay(
                    staff.find((m) => m._id === formData.userId).role
                  )})`
                : ""
            }
            margin="normal"
            size="small"
            disabled
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
        ) : (
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
              id="staff-select-autocomplete"
              options={staff}
              getOptionLabel={(option) =>
                `${option.staffId || ""} - ${option.name} (${formatRoleDisplay(
                  option.role
                )}) ${option.isActive === false ? "- Inactive" : ""}`
              }
              value={
                formData.userId
                  ? staff.find((member) => member._id === formData.userId) ||
                    null
                  : null
              }
              onChange={(event, newValue) => {
                handleChange({
                  target: {
                    name: "userId",
                    value: newValue ? newValue._id : "",
                  },
                });
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Staff Member"
                  size="small"
                  error={!!errors.userId}
                  required
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
              renderOption={(props, option) => {
                const { key, ...restProps } = props;
                return (
                  <li key={key} {...restProps}>
                    <div
                      style={{
                        width: "100%",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        fontSize: isMobile ? "0.875rem" : "1rem",
                        padding: isMobile ? "4px 0" : "8px 0",
                      }}
                    >
                      <span>
                        {`${option.staffId || ""} - ${
                          option.name
                        } (${formatRoleDisplay(option.role)})`}
                      </span>
                      {option.isActive === false && (
                        <span
                          style={{
                            marginLeft: "8px",
                            color: "#dc2626",
                            fontSize: isMobile ? "0.7rem" : "0.75rem",
                            fontWeight: "500",
                            backgroundColor: "#fee2e2",
                            padding: isMobile ? "1px 4px" : "2px 6px",
                            borderRadius: "4px",
                          }}
                        >
                          Inactive
                        </span>
                      )}
                      {option.isActive !== false && (
                        <span
                          style={{
                            marginLeft: "8px",
                            color: "#15803d",
                            fontSize: isMobile ? "0.7rem" : "0.75rem",
                            fontWeight: "500",
                            backgroundColor: "#dcfce7",
                            padding: isMobile ? "1px 4px" : "2px 6px",
                            borderRadius: "4px",
                          }}
                        >
                          Active
                        </span>
                      )}
                    </div>
                  </li>
                );
              }}
              groupBy={(option) =>
                option.isActive === false ? "Inactive Staff" : "Active Staff"
              }
              sx={{
                "& .MuiAutocomplete-listbox": {
                  fontSize: {
                    xs: "0.875rem",
                    sm: "0.9rem",
                    md: "1rem",
                  },
                },
              }}
            />
          </FormControl>
        )}

        {currentInvoice ? (
          <TextField
            fullWidth
            label="Month"
            value={formData.month}
            margin="normal"
            size="small"
            disabled
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
        ) : (
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
              Month
            </InputLabel>
            <Select
              name="month"
              value={formData.month || ""}
              label="Month"
              onChange={handleChange}
              error={!!errors.month}
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
              <MenuItem value="">Select Month</MenuItem>
              {getNextTwelveMonths().map((monthYear) => (
                <MenuItem key={monthYear} value={monthYear}>
                  {monthYear}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        )}

        {/* Two-column layout for amount fields on larger screens */}
        <Box
          sx={{
            display: "flex",
            gap: {
              xs: 0,
              sm: 2,
            },
            flexDirection: {
              xs: "column",
              sm: "row",
            },
          }}
        >
          <TextField
            fullWidth
            label="Base Salary Amount"
            name="amount"
            type="number"
            value={formData.amount}
            onChange={handleChange}
            margin="normal"
            size="small"
            disabled={false}
            helperText="Default is staff's base salary, can be modified"
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
            label="Bonus Amount"
            name="bonusAmount"
            type="number"
            value={formData.bonusAmount}
            onChange={handleChange}
            margin="normal"
            size="small"
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
        </Box>

        <TextField
          fullWidth
          label="Bonus Reason"
          name="bonusReason"
          value={formData.bonusReason}
          onChange={handleChange}
          margin="normal"
          size="small"
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

        {/* Two-column layout for remaining fields */}
        <Box
          sx={{
            display: "flex",
            gap: {
              xs: 0,
              sm: 2,
            },
            flexDirection: {
              xs: "column",
              sm: "row",
            },
          }}
        >
          <TextField
            fullWidth
            label="Total Leaves"
            name="totalLeaves"
            type="number"
            value={formData.totalLeaves}
            onChange={handleChange}
            margin="normal"
            size="small"
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
            label="Referral Bonus"
            name="refBonus"
            type="number"
            value={formData.refBonus}
            onChange={handleChange}
            margin="normal"
            size="small"
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
        </Box>

        <TextField
          fullWidth
          label="Advanced Salary"
          name="advancedSalary"
          type="number"
          value={formData.advancedSalary}
          onChange={handleChange}
          margin="normal"
          size="small"
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

        <LocalizationProvider dateAdapter={AdapterDateFns}>
          <DatePicker
            label="Payment Date"
            value={formData.paymentDate ? new Date(formData.paymentDate) : null}
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
                },
              },
            }}
          />
        </LocalizationProvider>

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
            ) : currentInvoice ? (
              "Update"
            ) : (
              "Generate"
            )}
          </button>
        </Box>
      </form>
    </Box>
  );
};

const PaidAllModal = ({
  paidAllMonth,
  setPaidAllMonth,
  handlePaidAll,
  isPaidAllLoading,
  setShowPaidAllModal,
  getPendingInvoicesCount,
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
        Mark All Invoices as Paid
      </Typography>

      <Typography
        variant="body2"
        sx={{
          mb: {
            xs: 2,
            sm: 2.5,
            md: 3,
          },
          color: "#64748b",
          fontSize: {
            xs: "0.875rem",
            sm: "0.9rem",
            md: "1rem",
          },
          textAlign: "center",
          lineHeight: 1.5,
        }}
      >
        This will mark all pending salary invoices as paid. You can optionally
        filter by month.
      </Typography>

      <FormControl
        fullWidth
        margin="normal"
        size="small"
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
          Filter by Month (Optional)
        </InputLabel>
        <Select
          value={paidAllMonth}
          label="Filter by Month (Optional)"
          onChange={(e) => setPaidAllMonth(e.target.value)}
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
          <MenuItem value="">All Months</MenuItem>
          {getNextTwelveMonths().map((monthYear) => (
            <MenuItem key={monthYear} value={monthYear}>
              {format(new Date(monthYear + "-01"), "MMMM yyyy")}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      <Typography
        variant="body2"
        sx={{
          mt: {
            xs: 1.5,
            sm: 2,
          },
          mb: {
            xs: 2,
            sm: 2.5,
            md: 3,
          },
          fontWeight: 500,
          fontSize: {
            xs: "0.875rem",
            sm: "0.9rem",
            md: "1rem",
          },
          textAlign: "center",
          color: "#374151",
          padding: {
            xs: 1.5,
            sm: 2,
          },
          backgroundColor: "#f8fafc",
          borderRadius: "8px",
          border: "1px solid #e2e8f0",
        }}
      >
        {paidAllMonth
          ? `${getPendingInvoicesCount()} pending invoice(s) for ${format(
              new Date(paidAllMonth + "-01"),
              "MMMM yyyy"
            )} will be marked as paid.`
          : `${getPendingInvoicesCount()} pending invoice(s) will be marked as paid.`}
      </Typography>

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
          onClick={() => {
            setShowPaidAllModal(false);
            setPaidAllMonth("");
          }}
          disabled={isPaidAllLoading}
        >
          Cancel
        </button>
        <button
          className="add-btn"
          onClick={handlePaidAll}
          disabled={isPaidAllLoading || getPendingInvoicesCount() === 0}
        >
          {isPaidAllLoading ? (
            <div className="loading-spinner"></div>
          ) : (
            `Mark ${getPendingInvoicesCount()} Invoice(s) as Paid`
          )}
        </button>
      </Box>
    </Box>
  );
};
const getNextTwelveMonths = () => {
  const months = [];
  const currentDate = new Date();

  for (let i = -2; i < 0; i++) {
    const date = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth() + i,
      1
    );
    const monthYear = format(date, "yyyy-MM");
    months.push(monthYear);
  }

  for (let i = 0; i < 12; i++) {
    const date = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth() + i,
      1
    );
    const monthYear = format(date, "yyyy-MM");
    months.push(monthYear);
  }

  return months;
};

const SalaryInvoiceManagement = () => {
  const initialFormState = {
    userId: "",
    month: "",
    amount: "",
    bonusAmount: "",
    bonusReason: "",
    totalLeaves: "",
    refBonus: "",
    advancedSalary: "",
    paymentDate: new Date(),
    remarks: "",
  };

  const [invoices, setInvoices] = useState([]);
  const [filteredInvoices, setFilteredInvoices] = useState([]);
  const [staff, setStaff] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [currentInvoice, setCurrentInvoice] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState("all");
  const [selectedMonth, setSelectedMonth] = useState("all");
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [invoiceToDelete, setInvoiceToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isPaidAllLoading, setIsPaidAllLoading] = useState(false);
  const [showPaidAllModal, setShowPaidAllModal] = useState(false);
  const [paidAllMonth, setPaidAllMonth] = useState("");
  const [formData, setFormData] = useState(initialFormState);
  const [isViewMode, setIsViewMode] = useState(false);
  const [errors, setErrors] = useState({});
  const [showActiveStaff, setShowActiveStaff] = useState(false);
  const [showInactiveStaff, setShowInactiveStaff] = useState(false);
  const [isLoadingInvoices, setIsLoadingInvoices] = useState(true);
  const { notification, showNotification, closeNotification } =
    useNotification();
  const { isMobile, isTablet } = useResponsive();
  const pendingCount = invoices.filter(
    (inv) => inv.status === "pending"
  ).length;

  const BASE_URL = import.meta.env.VITE_BASE_URL;

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    }
  }, []);

  const fetchStaff = async () => {
    try {
      const token = localStorage.getItem("token");
      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      };
      const [
        teacherQuranRes,
        supervisorQuranRes,
        supervisorSubjectsRes,
        teacherSubjectsRes,
      ] = await Promise.all([
        axios.get(`${BASE_URL}/api/admin/users/teacher_quran`, config),
        axios.get(`${BASE_URL}/api/admin/users/supervisor_quran`, config),
        axios.get(`${BASE_URL}/api/admin/users/supervisor_subjects`, config),
        axios.get(`${BASE_URL}/api/admin/users/teacher_subjects`, config),
      ]);

      const allStaff = [
        ...teacherQuranRes.data.users,
        ...supervisorQuranRes.data.users,
        ...supervisorSubjectsRes.data.users,
        ...teacherSubjectsRes.data.users,
      ];

      const sortedStaff = allStaff.sort((a, b) => {
        if (a.isActive === b.isActive) return 0;
        return a.isActive ? -1 : 1;
      });

      setStaff(sortedStaff);
    } catch (error) {
      showNotification("Error fetching staff members", "error");
    }
  };
  const handleDeleteInvoice = (invoice) => {
    setInvoiceToDelete(invoice);
    setShowDeleteModal(true);
  };

  const confirmDeleteInvoice = async () => {
    if (!invoiceToDelete) return;

    setIsDeleting(true);
    try {
      const token = localStorage.getItem("token");
      await axios.delete(
        `${BASE_URL}/api/admin/salary/${invoiceToDelete._id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setInvoices((prevInvoices) =>
        prevInvoices.filter((invoice) => invoice._id !== invoiceToDelete._id)
      );

      showNotification("Salary invoice deleted successfully");
      setShowDeleteModal(false);
      setInvoiceToDelete(null);
    } catch (error) {
      console.error("Error deleting invoice:", error);
      showNotification(
        error.response?.data?.msg || "Error deleting salary invoice",
        "error"
      );
    } finally {
      setIsDeleting(false);
    }
  };

  const closeDeleteModal = () => {
    if (!isDeleting) {
      setShowDeleteModal(false);
      setInvoiceToDelete(null);
    }
  };

  const formatRoleDisplay = (role) => {
    const roleMap = {
      teacher_quran: "Quran Teacher",
      supervisor_quran: "Quran Supervisor",
      teacher_subjects: "Subjects Teacher",
      supervisor_subjects: "Subjects Supervisor",
    };
    return roleMap[role] || role;
  };
  const fetchInvoices = async () => {
    setIsSyncing(true);
    setIsLoadingInvoices(true);
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(
        `${BASE_URL}/api/payments/admin/salary-invoices`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      setInvoices(response.data.invoices);
      setFilteredInvoices(response.data.invoices);
      showNotification("Salary invoices refreshed successfully");
    } catch (error) {
      showNotification(
        error.response?.data?.message || "Error fetching salary invoices",
        "error"
      );
    } finally {
      setIsSyncing(false);
      setIsLoadingInvoices(false);
    }
  };

  useEffect(() => {
    fetchStaff();
    fetchInvoices();
  }, []);

  const handlePaidAll = async () => {
    setIsPaidAllLoading(true);
    try {
      const token = localStorage.getItem("token");
      const payload = paidAllMonth ? { month: paidAllMonth } : {};

      const response = await axios.patch(
        `${BASE_URL}/api/admin/salary/mark-all-paid`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      showNotification(
        response.data.msg || "All pending invoices marked as paid successfully"
      );
      fetchInvoices(); 
      setShowPaidAllModal(false);
      setPaidAllMonth("");
    } catch (error) {
      showNotification(
        error.response?.data?.msg || "Error marking invoices as paid",
        "error"
      );
    } finally {
      setIsPaidAllLoading(false);
    }
  };

  const getPendingInvoicesCount = () => {
    let filtered = invoices.filter((invoice) => invoice.status === "pending");

    if (paidAllMonth) {
      filtered = filtered.filter((invoice) =>
        invoice.month.startsWith(paidAllMonth)
      );
    }

    return filtered.length;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === "userId") {
      const selectedStaffMember = staff.find((member) => member._id === value);
      setFormData((prev) => ({
        ...prev,
        [name]: value,
        amount: selectedStaffMember?.profile?.salary || "",
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

  const handleAdd = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const token = localStorage.getItem("token");
      await axios.post(
        `${BASE_URL}/api/admin/salary/${formData.userId}`,
        {
          month: formData.month,
          amount: Number(formData.amount) || undefined,
          bonusAmount: Number(formData.bonusAmount) || 0,
          bonusReason: formData.bonusReason || "",
          totalLeaves: Number(formData.totalLeaves) || 0,
          refBonus: Number(formData.refBonus) || 0,
          advancedSalary: Number(formData.advancedSalary) || 0,
          paymentDate: formData.paymentDate,
          remarks: formData.remarks || "",
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      showNotification("Salary invoice generated successfully");
      fetchInvoices();
      setShowModal(false);
      setFormData(initialFormState);
    } catch (error) {
      showNotification(
        error.response?.data?.msg ||
          error.response?.data?.message ||
          "Error generating salary invoice",
        "error"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const token = localStorage.getItem("token");
      await axios.put(
        `${BASE_URL}/api/admin/salary/${currentInvoice._id}`,
        {
          month: formData.month,
          amount: Number(formData.amount) || undefined,
          bonusAmount: Number(formData.bonusAmount) || 0,
          bonusReason: formData.bonusReason || "",
          totalLeaves: Number(formData.totalLeaves) || 0,
          refBonus: Number(formData.refBonus) || 0,
          advancedSalary: Number(formData.advancedSalary) || 0,
          paymentDate: formData.paymentDate,
          remarks: formData.remarks || "",
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      showNotification("Salary invoice updated successfully");
      fetchInvoices();
      setShowModal(false);
      setCurrentInvoice(null);
    } catch (error) {
      console.error("Error details:", error.response?.data);
      showNotification(
        error.response?.data?.msg || "Error updating salary invoice",
        "error"
      );
    } finally {
      setIsLoading(false);
    }
  };
  const handleSubmit = (e) => {
    if (currentInvoice) {
      handleEdit(e);
    } else {
      handleAdd(e);
    }
  };

  const getStaffDetails = (userId) => {
    if (!userId) return null;

    const staffMember = staff.find((member) => member._id === userId);
    return staffMember
      ? {
          ...staffMember,
          displayStaffId: staffMember.staffId,
        }
      : null;
  };
  const getUniqueYears = () => {
    const years = new Set(
      invoices.map((invoice) => new Date(invoice.month).getFullYear())
    );
    return Array.from(years).sort((a, b) => b - a);
  };

  const calculateTotals = useCallback(() => {
    const totals = {
      totalSalary: 0,
      totalBonus: 0,
      totalDeductions: 0,
      totalNet: 0,
    };

    filteredInvoices.forEach((invoice) => {
      totals.totalSalary += invoice.amount;
      totals.totalBonus += invoice.bonus.amount;
      totals.totalDeductions += invoice.deduction;
      totals.totalNet += invoice.netSalary;
    });

    return totals;
  }, [filteredInvoices]);

  useEffect(() => {
    let filtered = [...invoices];

    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();

      filtered = filtered.filter((invoice) => {
        const nameMatch = invoice.user?.name
          ?.toLowerCase()
          .includes(searchLower);
        const idMatch = invoice.user?.staffId?.toString().includes(searchTerm);
        return nameMatch || idMatch;
      });
    }

    if (selectedStaff !== "all") {
      filtered = filtered.filter(
        (invoice) => invoice.user?._id === selectedStaff
      );
    }

    if (showActiveStaff && !showInactiveStaff) {
      filtered = filtered.filter((invoice) => {
        const staffMember = staff.find((s) => s._id === invoice.user?._id);
        return staffMember && staffMember.isActive !== false;
      });
    } else if (!showActiveStaff && showInactiveStaff) {
      filtered = filtered.filter((invoice) => {
        const staffMember = staff.find((s) => s._id === invoice.user?._id);
        return staffMember && staffMember.isActive === false;
      });
    }
    if (selectedMonth !== "all") {
      filtered = filtered.filter(
        (invoice) =>
          new Date(invoice.month).getMonth() === MONTHS.indexOf(selectedMonth)
      );
    }

    if (selectedYear) {
      filtered = filtered.filter(
        (invoice) => new Date(invoice.month).getFullYear() === selectedYear
      );
    }

    setFilteredInvoices(filtered);
  }, [
    invoices,
    searchTerm,
    selectedStaff,
    selectedMonth,
    selectedYear,
    showActiveStaff,
    showInactiveStaff,
    staff,
  ]);

  return (
    <div className="management-container">
      <div className="management-header">
        <div>
          <h2>Salary Invoice Management</h2>
          <p className="total-count">
            {filteredInvoices.length} Total Invoices
          </p>
        </div>
        <div
          className="header-buttons"
          style={{
            display: "flex",
            gap: isMobile ? "8px" : "12px",
            alignItems: "center",
            flexWrap: isMobile ? "wrap" : "nowrap",
            justifyContent: isMobile ? "center" : "flex-end",
            width: "100%",
          }}
        >
          <SyncButton
            isSyncing={isSyncing}
            onClick={() => fetchInvoices(true)}
            style={{
              order: isMobile ? 1 : 0,
              width: isMobile ? "100%" : "auto",
              minHeight: isMobile ? "44px" : "auto",
            }}
          />

          <button
            className="add-btn paid-all-btn responsive-add-btn"
            onClick={() => setShowPaidAllModal(true)}
            disabled={pendingCount === 0}
            title={`Mark ${pendingCount} pending invoice(s) as paid`}
            style={{
              backgroundColor: "#15803d",
              marginRight: isMobile ? "0" : "8px",
              order: isMobile ? 3 : 0,
              width: isMobile ? "50%" : "auto",
              minHeight: isMobile ? "44px" : "40px",
              fontSize: isMobile ? "0.875rem" : "0.9rem",
              padding: isMobile ? "12px 16px" : "8px 16px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              whiteSpace: isMobile ? "nowrap" : "normal",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            <span className="paid-btn-text">
              {isMobile
                ? `Mark All (${pendingCount})`
                : `Mark All Paid (${pendingCount})`}
            </span>
          </button>

          <button
            className="add-btn responsive-add-btn"
            onClick={() => {
              setCurrentInvoice(null);
              setFormData(initialFormState);
              setIsViewMode(false);
              setShowModal(true);
            }}
            title="Generate Invoice"
          >
            <FaPlus style={{ fontSize: isMobile ? "0.8rem" : "0.875rem" }} />
            <span className="add-btn-text">
              {isMobile ? "Generate" : "Generate Invoice"}
            </span>
          </button>
        </div>
      </div>

      <div className="stats-cards">
        <div className="stat-card total-amount">
          <h3>Total Salary</h3>
          <p>PKR {calculateTotals().totalSalary.toLocaleString()}</p>
        </div>
        <div className="stat-card pending-amount">
          <h3>Total Bonus</h3>
          <p>PKR {calculateTotals().totalBonus.toLocaleString()}</p>
        </div>
        <div className="stat-card paid-amount">
          <h3>Total Deductions</h3>
          <p>PKR {calculateTotals().totalDeductions.toLocaleString()}</p>
        </div>
        <div className="stat-card overdue-amount">
          <h3>Total Net Salary</h3>
          <p>PKR {calculateTotals().totalNet.toLocaleString()}</p>
        </div>
      </div>

      <div className="filter-section">
        <div className="search-box">
          <FaSearch className="search-icon" />
          <input
            type="text"
            placeholder="Search by Name or ID"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="filter-box checkbox-filter">
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={showActiveStaff}
              onChange={(e) => setShowActiveStaff(e.target.checked)}
              className="checkbox-input"
            />
            <span className="checkbox-text">Active Staff</span>
          </label>
          <label className="checkbox-label" style={{ marginLeft: "16px" }}>
            <input
              type="checkbox"
              checked={showInactiveStaff}
              onChange={(e) => setShowInactiveStaff(e.target.checked)}
              className="checkbox-input"
            />
            <span className="checkbox-text">Inactive Staff</span>
          </label>
        </div>
        <div className="filter-box">
          <FaFilter className="filter-icon" />
          <Select
            className="client-select"
            value={selectedStaff}
            onChange={(e) => setSelectedStaff(e.target.value)}
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
            <MenuItem value="all">All Staff</MenuItem>
            {staff.map((member) => (
              <MenuItem key={member._id} value={member._id}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    width: "100%",
                  }}
                >
                  <span>
                    {member.staffId} - {member.name} (
                    {formatRoleDisplay(member.role)})
                  </span>
                  <span
                    style={{
                      marginLeft: "8px",
                      color: member.isActive === false ? "#dc2626" : "#15803d",
                      fontSize: "0.7rem",
                      fontWeight: "500",
                      backgroundColor:
                        member.isActive === false ? "#fee2e2" : "#dcfce7",
                      padding: "1px 4px",
                      borderRadius: "3px",
                    }}
                  >
                    {member.isActive === false ? "Inactive" : "Active"}
                  </span>
                </div>
              </MenuItem>
            ))}
          </Select>
        </div>
        <div className="filter-box">
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
        <div className="filter-box">
          <FaFilter className="filter-icon" />
          <Select
            className="status-select"
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
            sx={{
              width: {
                xs: "100%",
                sm: "180px",
                md: "200px",
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
            {getUniqueYears().map((year) => (
              <MenuItem key={year} value={year}>
                {year}
              </MenuItem>
            ))}
          </Select>
        </div>
        <button
          className="clear-filters-btn"
          onClick={() => {
            setSelectedStaff("all");
            setSelectedMonth("all");
            setSelectedYear(new Date().getFullYear());
            setSearchTerm("");
            setShowActiveStaff(false);
            setShowInactiveStaff(false);
          }}
        >
          Clear Filters
        </button>
      </div>

      <div className="table-container">
        {isLoadingInvoices ? (
          <div className="loading-container">
            <CircularProgress />
          </div>
        ) : filteredInvoices.length > 0 ? (
          <table>
            <thead>
              <tr>
                <th>Staff</th>
                <th>Role</th>
                <th>Month</th>
                <th>Basic Salary</th>
                <th>Bonus</th>
                <th>Deductions</th>
                <th>Net Salary</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredInvoices.map((invoice) => (
                <tr key={invoice._id}>
                  <td>
                    <div style={{ fontWeight: "500" }}>
                      {invoice.user?.name || "Deleted Staff"}
                    </div>
                    <div style={{ color: "#64748b", fontSize: "0.8125rem" }}>
                      ID: {invoice.user?.staffId || "N/A"}
                    </div>
                    {staff.find((s) => s._id === invoice.user?._id)
                      ?.isActive === false && (
                      <div style={{ marginTop: "4px" }}>
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
                      </div>
                    )}
                  </td>
                  <td style={{ fontWeight: "500" }}>
                    {formatRoleDisplay(invoice.role)}
                  </td>
                  <td>{format(new Date(invoice.month), "MMMM yyyy")}</td>
                  <td>PKR {invoice.amount.toLocaleString()}</td>
                  <td>PKR {invoice.bonus.amount.toLocaleString()}</td>
                  <td>PKR {invoice.deduction.toLocaleString()}</td>
                  <td style={{ fontWeight: "500" }}>
                    PKR {invoice.netSalary.toLocaleString()}
                  </td>
                  <td>
                    <span
                      style={{
                        display: "inline-block",
                        padding: "4px 10px",
                        fontSize: "0.75rem",
                        fontWeight: 500,
                        borderRadius: "5px",
                        textTransform: "capitalize",
                        color:
                          invoice.status === "paid"
                            ? "#15803d"
                            : invoice.status === "pending"
                            ? "#b45309"
                            : invoice.status === "overdue"
                            ? "#be123c"
                            : "#991b1b",
                        backgroundColor:
                          invoice.status === "paid"
                            ? "#dcfce7"
                            : invoice.status === "pending"
                            ? "#fef3c7"
                            : invoice.status === "overdue"
                            ? "#fce7f3"
                            : "#fee2e2",
                      }}
                    >
                      {invoice.status}
                    </span>
                  </td>
                  <td>
                    <div className="actions">
                      <button
                        onClick={() => {
                          setCurrentInvoice(invoice);
                          setIsViewMode(true);
                          setShowModal(true);
                        }}
                      >
                        <FaEye />
                      </button>
                      <button
                        onClick={() => {
                          setCurrentInvoice(invoice);
                          setFormData({
                            userId: invoice.user?._id || "",
                            month: invoice.month,
                            amount: invoice.amount,
                            bonusAmount: invoice.bonus.amount,
                            bonusReason: invoice.bonus.reason,
                            totalLeaves: invoice.totalLeaves,
                            refBonus: invoice.refBonus,
                            advancedSalary: invoice.advancedSalary,
                            paymentDate: invoice.paymentDate,
                            remarks: invoice.remarks,
                          });
                          setIsViewMode(false);
                          setShowModal(true);
                        }}
                      >
                        <FaEdit />
                      </button>
                      <button>
                        <a
                          href={`/salary/print/${invoice._id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="print-link"
                        >
                          <FaPrint color="#64748b" />
                        </a>
                      </button>
                      <button
                        onClick={() => handleDeleteInvoice(invoice)}
                        title="Delete salary invoice"
                      >
                        <FaTrash color="#64748b" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="no-data">
            <p>No salary invoices found</p>
          </div>
        )}
      </div>

      <Modal open={showModal} onClose={() => !isLoading && setShowModal(false)}>
        {isViewMode ? (
          <ViewSalaryModal
            invoice={currentInvoice}
            setShowModal={setShowModal}
            modalStyle={getModalStyles()}
            staffDetails={
              currentInvoice?.user?._id
                ? getStaffDetails(currentInvoice.user._id)
                : null
            }
          />
        ) : (
          <ModalContent
            formData={formData}
            handleChange={handleChange}
            handleSubmit={handleSubmit}
            setShowModal={setShowModal}
            currentInvoice={currentInvoice}
            errors={errors}
            isLoading={isLoading}
            handleDateChange={handleDateChange}
            staff={staff}
            formatRoleDisplay={formatRoleDisplay}
          />
        )}
      </Modal>
      <Modal
        open={showPaidAllModal}
        onClose={() => !isPaidAllLoading && setShowPaidAllModal(false)}
      >
        <PaidAllModal
          paidAllMonth={paidAllMonth}
          setPaidAllMonth={setPaidAllMonth}
          handlePaidAll={handlePaidAll}
          isPaidAllLoading={isPaidAllLoading}
          setShowPaidAllModal={setShowPaidAllModal}
          getPendingInvoicesCount={getPendingInvoicesCount}
        />
      </Modal>
      <DeleteConfirmationModal
        open={showDeleteModal}
        onClose={closeDeleteModal}
        onConfirm={confirmDeleteInvoice}
        isLoading={isDeleting}
        type="invoice"
        data={invoiceToDelete}
      />

      <NotificationSnackbar
        notification={notification}
        onClose={closeNotification}
      />
    </div>
  );
};

export default SalaryInvoiceManagement;
