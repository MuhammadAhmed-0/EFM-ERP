import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import "../../../../../styles/components/ChallanInvoicePrint.css";
import Logo from "../../../../../assets/logo.png";
import { CircularProgress } from "@mui/material";
import { format } from "date-fns";

const SalaryInvoicePrint = () => {
  const { id } = useParams();
  const [salaryData, setSalaryData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const BASE_URL = import.meta.env.VITE_BASE_URL;

  useEffect(() => {
    const fetchSalaryInvoice = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await axios.get(
          `${BASE_URL}/api/payments/salary/${id}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        setSalaryData(response.data.data);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching salary invoice:", error);
        setError("Error loading salary invoice data");
        setLoading(false);
      }
    };

    fetchSalaryInvoice();
  }, [id]);

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

  if (error || !salaryData) {
    return (
      <div className="error-container">
        {error || "Salary invoice not found"}
      </div>
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
            <h1 className="challan-company-title">Salary Invoice</h1>
            <p className="challan-company-subtitle">EFM Pvt. Ltd.</p>
          </div>
        </div>

        <div className="challan-client-section">
          <table className="challan-client-table">
            <tbody>
              <tr>
                <td className="challan-cell-label">Staff Name:</td>
                <td className="challan-client-cell">{salaryData.userName}</td>
                <td className="challan-cell-label">Role:</td>
                <td className="challan-client-cell">
                  {salaryData.role
                    .split("_")
                    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                    .join(" ")}
                </td>
              </tr>
              <tr>
                <td className="challan-cell-label">Email:</td>
                <td className="challan-client-cell">{salaryData.user.email}</td>
                <td className="challan-cell-label">Month:</td>
                <td className="challan-client-cell">
                  {format(new Date(salaryData.month), "MMMM yyyy")}
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
                  Amount (PKR)
                </th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="challan-fee-cell">Base Salary</td>
                <td className="challan-fee-cell challan-fee-amount">
                  {salaryData.amount.toLocaleString()}
                </td>
              </tr>
              <tr>
                <td className="challan-fee-cell">Bonus Amount</td>
                <td className="challan-fee-cell challan-fee-amount">
                  {salaryData.bonus.amount.toLocaleString()}
                </td>
              </tr>
              <tr>
                <td className="challan-fee-cell">Bonus Reason</td>
                <td className="challan-fee-cell">
                  {salaryData.bonus.reason || "N/A"}
                </td>
              </tr>
              <tr>
                <td className="challan-fee-cell">Referral Bonus</td>
                <td className="challan-fee-cell challan-fee-amount">
                  {salaryData.refBonus.toLocaleString()}
                </td>
              </tr>
              <tr>
                <td className="challan-fee-cell">Advanced Salary</td>
                <td className="challan-fee-cell challan-fee-amount">
                  {salaryData.advancedSalary.toLocaleString()}
                </td>
              </tr>
              <tr>
                <td className="challan-fee-cell">Approved Leaves</td>
                <td className="challan-fee-cell">{salaryData.approvedLeave}</td>
              </tr>
              <tr>
                <td className="challan-fee-cell">Total Leaves</td>
                <td className="challan-fee-cell number">
                  {salaryData.totalLeaves}
                </td>
              </tr>
              <tr>
                <td className="challan-fee-cell">Late Minutes</td>
                <td className="challan-fee-cell number">
                  {salaryData.lateMinutes}
                </td>
              </tr>
              <tr>
                <td className="challan-fee-cell">Fine Per Minute</td>
                <td className="challan-fee-cell number">
                  {salaryData.finePerMinute.toFixed(2)}
                </td>
              </tr>
              <tr>
                <td className="challan-fee-cell">Absent Fine</td>
                <td className="challan-fee-cell challan-fee-amount negative">
                  -{salaryData.absentFine.toLocaleString()}
                </td>
              </tr>
              <tr>
                <td className="challan-fee-cell">Biometric Fine</td>
                <td className="challan-fee-cell challan-fee-amount negative">
                  -{salaryData.biometricFine.toLocaleString()}
                </td>
              </tr>
              <tr>
                <td className="challan-fee-cell">Total Deductions</td>
                <td className="challan-fee-cell challan-fee-amount negative">
                  -{salaryData.deduction.toLocaleString()}
                </td>
              </tr>
              <tr className="challan-total-row">
                <td className="challan-fee-cell">Net Salary</td>
                <td className="challan-fee-cell challan-fee-amount">
                  PKR {salaryData.netSalary.toLocaleString()}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <button className="challan-print-btn" onClick={printInvoice}>
          Print Invoice
        </button>
      </div>
    </div>
  );
};

export default SalaryInvoicePrint;
