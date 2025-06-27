import  { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import "../../../../../styles/components/ChallanInvoicePrint.css";
import Logo from "../../../../../assets/logo.png";
import { CircularProgress } from "@mui/material";

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

const ChallanInvoicePrint = () => {
  const { id } = useParams();
  const [challanData, setChallanData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const BASE_URL = import.meta.env.VITE_BASE_URL;

  useEffect(() => {
    const fetchChallan = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await axios.get(
          `${BASE_URL}/api/payments/challans/${id}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        setChallanData(response.data.data);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching challan:", error);
        setError("Error loading challan data");
        setLoading(false);
      }
    };

    fetchChallan();
  }, [id]);

  const formatDate = (dateString) => {
    if (!dateString) return "Not Available";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return "Not Available";
    const date = new Date(dateString);
    return date.toLocaleString("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusColor = (status) => {
    if (!status) return "#64748b";
    switch (status.toLowerCase()) {
      case "paid":
      case "fully_paid":
        return "#15803d";
      case "pending":
        return "#f59e0b";
      case "overdue":
        return "#991b1b	";
      case "partial":
      case "partially_paid":
        return "#3b82f6";
      default:
        return "#64748b";
    }
  };

  const printInvoice = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="loading-container">
        <CircularProgress />
      </div>
    );
  }

  if (error || !challanData) {
    return (
      <div className="error-container">{error || "Challan not found"}</div>
    );
  }

  return (
    <div className="challan-print-wrapper">
      <div className="challan-print-container">
        <div className="challan-header">
          <div className="challan-logo-wrapper">
            <img className="challan-logo-image" src={Logo} alt="Company Logo" />
          </div>
          <div className="challan-company-info">
            <h1 className="challan-company-title">Fee Invoice</h1>
            <p className="challan-company-subtitle">EFM Pvt. Ltd.</p>
          </div>
        </div>

        <div className="challan-client-section">
          <table className="challan-client-table">
            <tbody>
              <tr>
                <td
                  className="challan-cell-label"
                  style={{ verticalAlign: "middle" }}
                >
                  Client Name:
                </td>
                <td
                  className="challan-client-cell"
                  style={{ verticalAlign: "middle" }}
                >
                  {challanData.clientName || "Not Available"}
                </td>
                <td
                  className="challan-cell-label"
                  style={{ verticalAlign: "middle" }}
                >
                  Client ID:
                </td>
                <td
                  className="challan-client-cell"
                  style={{ verticalAlign: "middle" }}
                >
                  {challanData.clientMainId ||
                    challanData.client?.clientId ||
                    "Not Available"}
                </td>
              </tr>
              <tr>
                <td
                  className="challan-cell-label"
                  style={{ verticalAlign: "middle" }}
                >
                  Email:
                </td>
                <td
                  className="challan-client-cell"
                  style={{ verticalAlign: "middle" }}
                >
                  {challanData.clientEmail ||
                    challanData.client?.email ||
                    "Not Available"}
                </td>
                <td
                  className="challan-cell-label"
                  style={{ verticalAlign: "middle" }}
                >
                  Due Month:
                </td>
                <td
                  className="challan-client-cell"
                  style={{ verticalAlign: "middle" }}
                >
                  {challanData.dueMonth || "Not Available"}
                </td>
              </tr>
              <tr>
                <td
                  className="challan-cell-label"
                  style={{ verticalAlign: "middle" }}
                >
                  Country:
                </td>
                <td
                  className="challan-client-cell"
                  style={{ verticalAlign: "middle" }}
                >
                  {challanData.country || "Not Available"}
                </td>
                <td
                  className="challan-cell-label"
                  style={{ verticalAlign: "middle" }}
                >
                  State:
                </td>
                <td
                  className="challan-client-cell"
                  style={{ verticalAlign: "middle" }}
                >
                  {challanData.state || "Not Available"}
                </td>
              </tr>
              <tr>
                <td
                  className="challan-cell-label"
                  style={{ verticalAlign: "middle" }}
                >
                  Total Students:
                </td>
                <td
                  className="challan-client-cell"
                  style={{ verticalAlign: "middle" }}
                >
                  {challanData.totalStudents || 0}
                </td>
                <td
                  className="challan-cell-label"
                  style={{ verticalAlign: "middle" }}
                >
                  Issue Date:
                </td>
                <td
                  className="challan-client-cell"
                  style={{ verticalAlign: "middle" }}
                >
                  {formatDate(challanData.issueDate || challanData.createdAt)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="challan-fee-section">
          <table className="challan-fee-table">
            <thead>
              <tr>
                <th className="challan-fee-cell challan-fee-header">
                  Description
                </th>
                <th className="challan-fee-cell challan-fee-header">
                  Amount ({challanData.clientCurrency || "USD"})
                </th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="challan-fee-cell">Basic Fee</td>
                <td
                  className="challan-fee-cell challan-fee-amount"
                  style={{ fontWeight: "bold" }}
                >
                  {(
                    challanData.basicFee ||
                    challanData.amount ||
                    0
                  ).toLocaleString()}
                </td>
              </tr>
              <tr>
                <td className="challan-fee-cell">Total Amount</td>
                <td
                  className="challan-fee-cell challan-fee-amount"
                  style={{ fontWeight: "bold" }}
                >
                  {(challanData.amount || 0).toLocaleString()}
                </td>
              </tr>
              <tr>
                <td className="challan-fee-cell">Month(s)</td>
                <td className="challan-fee-cell challan-fee-amount">
                  {(() => {
                    if (
                      Array.isArray(challanData.months) &&
                      challanData.months.length > 0
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
                      const sortedMonths = [...challanData.months].sort(
                        (a, b) => MONTHS.indexOf(a) - MONTHS.indexOf(b)
                      );

                      if (sortedMonths.length === 1) {
                        return shortMonths[sortedMonths[0]];
                      } else {
                        const firstMonth = shortMonths[sortedMonths[0]];
                        const lastMonth =
                          shortMonths[sortedMonths[sortedMonths.length - 1]];
                        return `${firstMonth} to ${lastMonth}`;
                      }
                    }
                    return "Not Available";
                  })()}
                </td>
              </tr>
              <tr>
                <td className="challan-fee-cell">From Date</td>
                <td className="challan-fee-cell challan-fee-amount">
                  {formatDate(challanData.fromDate)}
                </td>
              </tr>
              <tr>
                <td className="challan-fee-cell">To Date</td>
                <td className="challan-fee-cell challan-fee-amount">
                  {formatDate(challanData.toDate)}
                </td>
              </tr>

              {/* Payment Summary Section */}
              {(challanData.totalPaidAmount !== undefined ||
                challanData.pendingAmount !== undefined) && (
                <>
                  <tr style={{ backgroundColor: "#f8fafc" }}>
                    <td
                      className="challan-fee-cell"
                      style={{ fontWeight: "bold", color: "#15803d" }}
                    >
                      Total Paid Amount
                    </td>
                    <td
                      className="challan-fee-cell challan-fee-amount"
                      style={{ fontWeight: "bold", color: "#15803d" }}
                    >
                      {(challanData.totalPaidAmount || 0).toLocaleString()}
                    </td>
                  </tr>
                  <tr style={{ backgroundColor: "#f8fafc" }}>
                    <td
                      className="challan-fee-cell"
                      style={{
                        fontWeight: "bold",
                        color:
                          (challanData.pendingAmount || 0) > 0
                            ? "#991b1b"
                            : "#15803d",
                      }}
                    >
                      Pending Amount
                    </td>
                    <td
                      className="challan-fee-cell challan-fee-amount"
                      style={{
                        fontWeight: "bold",
                        color:
                          (challanData.pendingAmount || 0) > 0
                            ? "#991b1b"
                            : "#15803d",
                      }}
                    >
                      {(challanData.pendingAmount || 0).toLocaleString()}
                    </td>
                  </tr>
                </>
              )}

              {/* Client Timeline Information */}
              {(challanData.trialStartedDate ||
                challanData.regularJoiningDate) && (
                <>
                  {challanData.trialStartedDate && (
                    <tr>
                      <td className="challan-fee-cell">Trial Started Date</td>
                      <td className="challan-fee-cell challan-fee-amount">
                        {formatDate(challanData.trialStartedDate)}
                      </td>
                    </tr>
                  )}
                  {challanData.regularJoiningDate && (
                    <tr>
                      <td className="challan-fee-cell">Regular Joining Date</td>
                      <td className="challan-fee-cell challan-fee-amount">
                        {formatDate(challanData.regularJoiningDate)}
                      </td>
                    </tr>
                  )}
                </>
              )}

              <tr className="challan-total-row">
                <td className="challan-fee-cell">Final Amount</td>
                <td className="challan-fee-cell challan-fee-amount">
                  {`${challanData.clientCurrency || "USD"} ${(
                    challanData.amount || 0
                  ).toLocaleString()}`}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <div className="challan-footer">
          <div>
            <strong>Payment Status:</strong>{" "}
            <strong
              className="challan-status-tag"
              style={{
                color: getStatusColor(
                  challanData.paymentStatus || challanData.status
                ),
              }}
            >
              {(challanData.paymentStatus || challanData.status || "pending")
                .replace("_", " ")
                .toUpperCase()}
            </strong>
          </div>
          {challanData.isOverdue && (
            <div
              style={{ color: "#991b1b	", fontWeight: "bold", marginTop: "5px" }}
            >
              <strong>⚠️ OVERDUE</strong>
            </div>
          )}
          {challanData.remarks && (
            <div className="challan-remarks">
              <strong>Remarks:</strong> {challanData.remarks}
            </div>
          )}
        </div>

        <button className="challan-print-btn" onClick={printInvoice}>
          Print Invoice
        </button>
      </div>
    </div>
  );
};

export default ChallanInvoicePrint;
