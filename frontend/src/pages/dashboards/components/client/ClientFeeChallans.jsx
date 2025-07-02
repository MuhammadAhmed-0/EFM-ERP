import { useState, useEffect } from "react";
import { FaFilter, FaPrint } from "react-icons/fa";
import { Select, MenuItem, Button, CircularProgress } from "@mui/material";
import { format } from "date-fns";
import axios from "axios";
import "../../../../styles/components/Management.css";
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

const STATUS_OPTIONS = ["pending", "paid", "overdue", "partial"];

const ClientFeeChallans = () => {
  const [challans, setChallans] = useState([]);
  const [filteredChallans, setFilteredChallans] = useState([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [isLoading, setIsLoading] = useState(true);
  const { notification, showNotification, closeNotification } =
    useNotification();

  const BASE_URL = import.meta.env.VITE_BASE_URL;

  const fetchChallans = async () => {
    setIsSyncing(true);
    setIsLoading(true);
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(
        `${BASE_URL}/api/payments/client/challans`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      setChallans(response.data.challans);
      setFilteredChallans(response.data.challans);
      showNotification("Fee challans refreshed successfully");
    } catch (error) {
      showNotification(
        error.response?.data?.message || "Error fetching fee challans",
        "error"
      );
    } finally {
      setIsSyncing(false);
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchChallans();
  }, []);

  const getUniqueYears = () => {
    const years = new Set(
      challans.map((challan) => new Date(challan.fromDate).getFullYear())
    );
    return Array.from(years).sort((a, b) => b - a);
  };

  const calculateTotals = () => {
    if (filteredChallans.length === 0) {
      return {
        totalAmount: 0,
        totalPending: 0,
        totalPaid: 0,
      };
    }

    return filteredChallans.reduce(
      (totals, challan) => {
        const {
          status = "pending",
          amount = 0,
          pendingAmount = 0,
          totalPaidAmount = 0,
        } = challan;

        if (selectedStatus === "pending") {
          return {
            ...totals,
            totalAmount: totals.totalAmount + pendingAmount,
            totalPending: totals.totalPending + pendingAmount,
            totalPaid: totals.totalPaid,
          };
        }

        return {
          totalAmount: totals.totalAmount + amount,
          totalPending: totals.totalPending + pendingAmount,
          totalPaid: totals.totalPaid + totalPaidAmount,
        };
      },
      {
        totalAmount: 0,
        totalPending: 0,
        totalPaid: 0,
      }
    );
  };

  useEffect(() => {
    let filtered = [...challans];

    if (selectedMonth !== "all") {
      filtered = filtered.filter((challan) =>
        challan.months.includes(selectedMonth)
      );
    }

    if (selectedYear) {
      filtered = filtered.filter(
        (challan) => new Date(challan.fromDate).getFullYear() === selectedYear
      );
    }

    if (selectedStatus !== "all") {
      filtered = filtered.filter((challan) => {
        const status = challan.status || "pending";
        return status.toLowerCase() === selectedStatus.toLowerCase();
      });
    }

    setFilteredChallans(filtered);
  }, [challans, selectedMonth, selectedYear, selectedStatus]);

  const formatCurrency = (amount, currency) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency || "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
      currencyDisplay: "code",
    }).format(amount || 0);
  };

  const formatPaymentHistory = (paymentHistory) => {
    if (!paymentHistory || paymentHistory.length === 0) {
      return "No payments";
    }

    return paymentHistory.map((payment, index) => (
      <div key={index} style={{ fontSize: "0.75rem", marginBottom: "2px" }}>
        {format(new Date(payment.date), "dd/MM/yyyy")} -{" "}
        {formatCurrency(payment.amount, payment.currency || "USD")}
      </div>
    ));
  };

  return (
    <div className="management-container">
      <div className="management-header">
        <div>
          <h2>My Fee Challans</h2>
          <p className="total-count">
            {filteredChallans.length} Total Challans
          </p>
        </div>
        <div className="header-buttons">
          <SyncButton
            isSyncing={isSyncing}
            onClick={() => fetchChallans(true)}
          />
        </div>
      </div>

      <div className="stats-cards">
        <div className="stat-card total-amount">
          <h3>Total Amount</h3>
          <p>
            {formatCurrency(
              calculateTotals().totalAmount,
              challans[0]?.clientCurrency
            )}
          </p>
        </div>
        <div className="stat-card pending-amount">
          <h3>Pending Amount</h3>
          <p>
            {formatCurrency(
              calculateTotals().totalPending,
              challans[0]?.clientCurrency
            )}
          </p>
        </div>
        <div className="stat-card paid-amount">
          <h3>Paid Amount</h3>
          <p>
            {formatCurrency(
              calculateTotals().totalPaid,
              challans[0]?.clientCurrency
            )}
          </p>
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
        <div className="filter-box">
          <FaFilter className="filter-icon" />
          <Select
            className="month-select"
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
            <MenuItem value="all">All Status</MenuItem>
            {STATUS_OPTIONS.map((status) => (
              <MenuItem key={status} value={status.toLowerCase()}>
                {status.charAt(0).toUpperCase() +
                  status.slice(1).toLowerCase().replace("_", " ")}
              </MenuItem>
            ))}
          </Select>
        </div>
        <button
          className="clear-filters-btn"
          onClick={() => {
            setSelectedMonth("all");
            setSelectedYear(new Date().getFullYear());
            setSelectedStatus("all");
          }}
        >
          Clear Filters
        </button>
      </div>

      <div className="table-container">
        {isLoading ? (
          <div className="loading-container">
            <CircularProgress />
          </div>
        ) : filteredChallans.length > 0 ? (
          <table>
            <thead>
              <tr>
                <th>Month</th>
                <th>Amount</th>
                <th>Created Date</th>
                <th>Due Month</th>
                <th>Payment Date</th>
                <th>Status</th>
                <th>Remarks</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredChallans.map((challan) => (
                <tr key={challan._id}>
                  <td style={{ fontWeight: "500" }}>
                    {(() => {
                      if (
                        Array.isArray(challan.months) &&
                        challan.months.length > 0
                      ) {
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
                      }
                      return "N/A";
                    })()}
                  </td>
                  <td>
                    <div style={{ fontWeight: "500" }}>
                      {formatCurrency(challan.amount, challan.clientCurrency)}
                    </div>

                    <div
                      style={{
                        fontSize: "0.8rem",
                        color: "#991b1b",
                        fontWeight: "500",
                      }}
                    >
                      Pending:{" "}
                      {formatCurrency(
                        challan.pendingAmount || 0,
                        challan.clientCurrency
                      )}
                    </div>
                  </td>
                  <td>
                    {format(
                      new Date(challan.issueDate || challan.createdAt),
                      "dd/MM/yyyy"
                    )}
                  </td>
                  <td style={{ fontWeight: "500" }}>{challan.dueMonth}</td>
                  <td style={{ fontWeight: "500" }}>
                    {challan.paymentHistory &&
                    challan.paymentHistory.length > 0 ? (
                      <div style={{ fontSize: "0.875rem" }}>
                        {formatPaymentHistory(challan.paymentHistory)}
                      </div>
                    ) : (
                      <span style={{ color: "#64748b", fontSize: "0.875rem" }}>
                        No payments
                      </span>
                    )}
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
                        color: (() => {
                          const currentDate = new Date();
                          const dueDate = new Date(
                            challan.toDate || challan.fromDate
                          );
                          const isOverdue =
                            currentDate > dueDate &&
                            (challan.pendingAmount || 0) > 0;

                          if (isOverdue) return "#991b1b";

                          const status =
                            challan.status?.toLowerCase() || "pending";
                          return status === "paid"
                            ? "#15803d"
                            : status === "partial"
                            ? "#ca8a04"
                            : "#991b1b";
                        })(),
                        backgroundColor: (() => {
                          const currentDate = new Date();
                          const dueDate = new Date(
                            challan.toDate || challan.fromDate
                          );
                          const isOverdue =
                            currentDate > dueDate &&
                            (challan.pendingAmount || 0) > 0;

                          if (isOverdue) return "#fee2e2";

                          const status =
                            challan.status?.toLowerCase() || "pending";
                          return status === "paid"
                            ? "#dcfce7"
                            : status === "partial"
                            ? "#fef9c3"
                            : "#fee2e2";
                        })(),
                      }}
                    >
                      {(() => {
                        const currentDate = new Date();
                        const dueDate = new Date(
                          challan.toDate || challan.fromDate
                        );
                        const isOverdue =
                          currentDate > dueDate &&
                          (challan.pendingAmount || 0) > 0;

                        if (isOverdue) return "OVERDUE";

                        const status = challan.status || "pending";
                        return status.replace("_", " ").toUpperCase();
                      })()}
                    </span>

                    {challan.isOverdue && (
                      <div
                        style={{
                          fontSize: "0.8rem",
                          color: "#991b1b",
                          marginTop: "2px",
                        }}
                      >
                        ⚠️ OVERDUE
                      </div>
                    )}
                  </td>

                  <td style={{ fontSize: "0.875rem", maxWidth: "150px" }}>
                    {challan.remarks || "No!"}
                  </td>
                  <td>
                    <div className="actions">
                      <button title="Print Invoice">
                        <a
                          href={`/client/challan/print/${challan._id}`}
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
            <p>No fee challans found</p>
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

export default ClientFeeChallans;
