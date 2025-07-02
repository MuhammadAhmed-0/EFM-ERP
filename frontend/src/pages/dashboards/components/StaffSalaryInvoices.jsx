import { useState, useEffect } from "react";
import { FaFilter, FaPrint } from "react-icons/fa";
import { Select, MenuItem, Button, CircularProgress } from "@mui/material";
import { format } from "date-fns";
import axios from "axios";
import "../../../styles/components/Management.css";
import useNotification from "../../../hooks/useNotification";
import NotificationSnackbar from "../../../components/common/NotificationSnackbar";
import SyncButton from "../../../components/common/SyncButton";
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

const StaffSalaryInvoices = () => {
  const [invoices, setInvoices] = useState([]);
  const [filteredInvoices, setFilteredInvoices] = useState([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState("all");
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [isLoading, setIsLoading] = useState(false);
  const { notification, showNotification, closeNotification } =
    useNotification();

  const BASE_URL = import.meta.env.VITE_BASE_URL;

  const fetchInvoices = async () => {
    setIsSyncing(true);
    setIsLoading(true);
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(
        `${BASE_URL}/api/payments/employee/salary-invoice`,
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
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, []);

  const getUniqueYears = () => {
    const years = new Set(
      invoices.map((invoice) => new Date(invoice.month).getFullYear())
    );
    return Array.from(years).sort((a, b) => b - a);
  };

  const calculateTotals = () => {
    if (filteredInvoices.length === 0) {
      return {
        totalSalary: 0,
        totalBonus: 0,
        totalDeductions: 0,
        totalNet: 0,
      };
    }

    return filteredInvoices.reduce(
      (totals, invoice) => ({
        totalSalary: totals.totalSalary + invoice.amount,
        totalBonus: totals.totalBonus + invoice.bonus.amount,
        totalDeductions: totals.totalDeductions + invoice.deduction,
        totalNet: totals.totalNet + invoice.netSalary,
      }),
      {
        totalSalary: 0,
        totalBonus: 0,
        totalDeductions: 0,
        totalNet: 0,
      }
    );
  };

  useEffect(() => {
    let filtered = [...invoices];

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
  }, [invoices, selectedMonth, selectedYear]);

  return (
    <div className="management-container">
      <div className="management-header">
        <div>
          <h2>My Salary Invoices</h2>
          <p className="total-count">
            {filteredInvoices.length} Total Invoices
          </p>
        </div>
        <div className="header-buttons">
          <SyncButton
            isSyncing={isSyncing}
            onClick={() => fetchInvoices(true)}
          />
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
            className="month-select"
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
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
            setSelectedMonth("all");
            setSelectedYear(new Date().getFullYear());
          }}
        >
          Clear Filters
        </button>
      </div>

      <div className="table-container">
        {isSyncing ? (
          <div className="loading-container">
            <CircularProgress />
          </div>
        ) : filteredInvoices.length > 0 ? (
          <table>
            <thead>
              <tr>
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
                  <td style={{ fontWeight: "500" }}>
                    {format(new Date(invoice.month), "MMMM yyyy")}
                  </td>
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
                        textTransform: "uppercase",
                        color:
                          invoice.status === "paid" ? "#15803d" : "#991b1b",
                        backgroundColor:
                          invoice.status === "paid" ? "#dcfce7" : "#fee2e2",
                      }}
                    >
                      {invoice.status.toUpperCase()}
                    </span>
                  </td>
                  <td>
                    <div className="actions">
                      <button>
                        <a
                          href={`/supervisor/salary/print/${invoice._id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="print-link"
                        >
                          <FaPrint color="#64748b" />
                        </a>
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
      <NotificationSnackbar
        notification={notification}
        onClose={closeNotification}
      />
    </div>
  );
};

export default StaffSalaryInvoices;
