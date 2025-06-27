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
}) => (
  <Box sx={getModalStyles()}>
    <Typography variant="h6" sx={{ mb: 2 }}>
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
        />
      ) : (
        <FormControl fullWidth margin="normal" size="small" required>
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
                ? staff.find((member) => member._id === formData.userId) || null
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
                          fontSize: "0.75rem",
                          fontWeight: "500",
                          backgroundColor: "#fee2e2",
                          padding: "2px 6px",
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
                          fontSize: "0.75rem",
                          fontWeight: "500",
                          backgroundColor: "#dcfce7",
                          padding: "2px 6px",
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
        />
      ) : (
        <FormControl fullWidth margin="normal" size="small" required>
          <InputLabel>Month</InputLabel>
          <Select
            name="month"
            value={formData.month || ""}
            label="Month"
            onChange={handleChange}
            error={!!errors.month}
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
      />

      <TextField
        fullWidth
        label="Bonus Reason"
        name="bonusReason"
        value={formData.bonusReason}
        onChange={handleChange}
        margin="normal"
        size="small"
      />

      <TextField
        fullWidth
        label="Total Leaves"
        name="totalLeaves"
        type="number"
        value={formData.totalLeaves}
        onChange={handleChange}
        margin="normal"
        size="small"
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
      />

      <TextField
        fullWidth
        label="Advanced Salary"
        name="advancedSalary"
        type="number"
        value={formData.advancedSalary}
        onChange={handleChange}
        margin="normal"
        size="small"
      />

      <LocalizationProvider dateAdapter={AdapterDateFns}>
        <DatePicker
          label="Payment Date"
          value={formData.paymentDate ? new Date(formData.paymentDate) : null}
          onChange={(date) => handleDateChange(date, "paymentDate")}
          renderInput={(params) => (
            <TextField {...params} fullWidth margin="normal" size="small" />
          )}
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
        rows={2}
      />

      <Box sx={{ mt: 3, display: "flex", justifyContent: "flex-end", gap: 2 }}>
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
const PaidAllModal = ({
  paidAllMonth,
  setPaidAllMonth,
  handlePaidAll,
  isPaidAllLoading,
  setShowPaidAllModal,
  getPendingInvoicesCount,
}) => (
  <Box sx={getModalStyles()}>
    <Typography variant="h6" sx={{ mb: 2 }}>
      Mark All Invoices as Paid
    </Typography>

    <Typography variant="body2" sx={{ mb: 3, color: "#64748b" }}>
      This will mark all pending salary invoices as paid. You can optionally
      filter by month.
    </Typography>

    <FormControl fullWidth margin="normal" size="small">
      <InputLabel>Filter by Month (Optional)</InputLabel>
      <Select
        value={paidAllMonth}
        label="Filter by Month (Optional)"
        onChange={(e) => setPaidAllMonth(e.target.value)}
      >
        <MenuItem value="">All Months</MenuItem>
        {getNextTwelveMonths().map((monthYear) => (
          <MenuItem key={monthYear} value={monthYear}>
            {format(new Date(monthYear + "-01"), "MMMM yyyy")}
          </MenuItem>
        ))}
      </Select>
    </FormControl>

    <Typography variant="body2" sx={{ mt: 2, mb: 3, fontWeight: 500 }}>
      {paidAllMonth
        ? `${getPendingInvoicesCount()} pending invoice(s) for ${format(
            new Date(paidAllMonth + "-01"),
            "MMMM yyyy"
          )} will be marked as paid.`
        : `${getPendingInvoicesCount()} pending invoice(s) will be marked as paid.`}
    </Typography>

    <Box sx={{ mt: 3, display: "flex", justifyContent: "flex-end", gap: 2 }}>
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
const getNextTwelveMonths = () => {
  const months = [];
  const currentDate = new Date();

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
      fetchInvoices(); // Refresh the data
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
        <div className="header-buttons">
          <SyncButton
            isSyncing={isSyncing}
            onClick={() => fetchInvoices(true)}
          />
          <button
            className="add-btn paid-all-btn"
            onClick={() => setShowPaidAllModal(true)}
            disabled={
              invoices.filter((inv) => inv.status === "pending").length === 0
            }
            style={{
              backgroundColor: "#15803d",
              marginRight: "8px",
            }}
          >
            Mark All Paid (
            {invoices.filter((inv) => inv.status === "pending").length})
          </button>
          <button
            className="add-btn"
            onClick={() => {
              setCurrentInvoice(null);
              setFormData(initialFormState);
              setIsViewMode(false);
              setShowModal(true);
            }}
          >
            <FaPlus /> Generate Invoice
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
              width: "250px",
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
              width: "200px",
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
              width: "200px",
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
