import { useState, useEffect } from "react";
import "../../../../styles/components/MonthlyReport.css";
import Logo from "../../../../assets/logo.png";
import { FaGlobe, FaPhoneAlt, FaPrint, FaSave } from "react-icons/fa";
import axios from "axios";
import useNotification from "../../../../hooks/useNotification";
import NotificationSnackbar from "../../../../components/common/NotificationSnackbar";
const generateMonthYearOptions = () => {
  const options = [];
  const currentDate = new Date();
  const lastYear = new Date(currentDate);
  lastYear.setMonth(currentDate.getMonth() - 1);

  for (let i = 0; i < 12; i++) {
    const date = new Date(lastYear);
    date.setMonth(lastYear.getMonth() + i);
    const monthYear = date.toLocaleString("default", {
      month: "long",
      year: "numeric",
    });
    options.push(monthYear);
  }
  return options;
};

const MonthlyReport = () => {
  const [formData, setFormData] = useState({
    familyName: "",
    studentName: "",
    grade: "",
    subject: "",
    classCount: "",
    tutorName: "",
    test1No: "01",
    test1Total: "",
    test1Passing: "",
    test1Obtained: "",
    test2No: "02",
    test2Total: "",
    test2Passing: "",
    test2Obtained: "",
    test3No: "03",
    test3Total: "",
    test3Passing: "",
    test3Obtained: "",
    teacherRemarks: "",
    notes:
      "All Lectures are Available on the Concept-Board, student can get the access at any time for revising it and can ask Questions from teacher.",
  });
  const [isViewMode, setIsViewMode] = useState(false);
  const [academicRows, setAcademicRows] = useState([]);
  const [rowCount, setRowCount] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [reportId, setReportId] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const currentDate = new Date();
    return currentDate.toLocaleString("default", {
      month: "long",
      year: "numeric",
    });
  });
  const { notification, showNotification, closeNotification } =
    useNotification();
  const BASE_URL = import.meta.env.VITE_BASE_URL;

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const loadedReportId = params.get("reportId");

    if (loadedReportId) {
      setIsViewMode(true);
      fetchReport(loadedReportId);
    } else {
      const urlParams = {
        familyName: params.get("familyName") || "",
        studentName: params.get("studentName") || "",
        grade: params.get("grade") || "",
        subject: params.get("subject") || "",
        tutorName: params.get("tutorName") || "",
      };
      setFormData((prevData) => ({
        ...prevData,
        ...urlParams,
      }));
      const initialRows = Array.from({ length: 5 }, (_, index) => ({
        id: `initial-row-${Date.now()}-${index}`,
        date1: "",
        topic1: "",
        date2: "",
        topic2: "",
      }));
      setAcademicRows(initialRows);
      setRowCount(5);
    }
  }, []);

  const handleMonthChange = (e) => {
    setSelectedMonth(e.target.value);
    setFormData((prev) => ({
      ...prev,
      classCount: e.target.value,
    }));
  };

  const fetchReport = async (id) => {
    try {
      const token = localStorage.getItem("token");
      const endpoint = `${BASE_URL}/api/teachers/get-report/${id}`;
      const response = await axios.get(endpoint, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const report = response.data.report;
      setReportId(report._id);
      setFormData({
        familyName: report.familyName,
        studentName: report.studentName,
        grade: report.grade,
        subject: report.subjectName,
        classCount: report.classCount,
        tutorName: report.tutorName,
        test1No: report.testScores[0]?.testNumber || "01",
        test1Total: report.testScores[0]?.totalMarks || "",
        test1Passing: report.testScores[0]?.passingMarks || "",
        test1Obtained: report.testScores[0]?.obtainedMarks || "",
        test2No: report.testScores[1]?.testNumber || "02",
        test2Total: report.testScores[1]?.totalMarks || "",
        test2Passing: report.testScores[1]?.passingMarks || "",
        test2Obtained: report.testScores[1]?.obtainedMarks || "",
        test3No: report.testScores[2]?.testNumber || "03",
        test3Total: report.testScores[2]?.totalMarks || "",
        test3Passing: report.testScores[2]?.passingMarks || "",
        test3Obtained: report.testScores[2]?.obtainedMarks || "",
        teacherRemarks: report.teacherRemarks || "",
        notes: report.notes || "",
      });
      const loadedEntries = (report.academicEntries || []).map(
        (entry, index) => ({
          ...entry,
          id: `loaded-row-${Date.now()}-${index}`,
        })
      );
      setAcademicRows(report.academicEntries || []);
      setRowCount(report.academicEntries?.length || 0);
    } catch (error) {
      showNotification("Error loading report", "error");
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const addAcademicRow = () => {
    const newRowCount = rowCount + 1;
    const newRow = {
      id: `row-${Date.now()}-${newRowCount}`,
      date1: "",
      topic1: "",
      date2: "",
      topic2: "",
    };
    setAcademicRows((prev) => [...prev, newRow]);
    setRowCount(newRowCount);
  };

  const removeRow = (id) => {
    setAcademicRows((prev) => prev.filter((row) => row.id !== id));
  };

  const handleRowInputChange = (id, field, value) => {
    setAcademicRows((prev) =>
      prev.map((row) => (row.id === id ? { ...row, [field]: value } : row))
    );
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      const params = new URLSearchParams(window.location.search);
      const studentId = params.get("studentId");
      const subjectId = params.get("subjectId");
      const clientId = params.get("clientId");

      if (!studentId || !subjectId || !clientId) {
        showNotification("Missing required information", "error");
        return;
      }
      const cleanedAcademicEntries = academicRows.map(
        ({ id, ...rest }) => rest
      );

      const reportData = {
        studentId,
        subjectId,
        clientId,
        formData: {
          ...formData,
          classCount: selectedMonth,
          reportDate: new Date().toISOString(),
        },
        academicEntries: cleanedAcademicEntries,
        testScores: [
          {
            testNumber: formData.test1No,
            totalMarks: formData.test1Total,
            passingMarks: formData.test1Passing,
            obtainedMarks: formData.test1Obtained,
          },
          {
            testNumber: formData.test2No,
            totalMarks: formData.test2Total,
            passingMarks: formData.test2Passing,
            obtainedMarks: formData.test2Obtained,
          },
          {
            testNumber: formData.test3No,
            totalMarks: formData.test3Total,
            passingMarks: formData.test3Passing,
            obtainedMarks: formData.test3Obtained,
          },
        ],
      };

      const token = localStorage.getItem("token");
      const response = await axios.post(
        `${BASE_URL}/api/teachers/create-report`,
        reportData,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.data.success) {
        showNotification("Report saved successfully");
        setReportId(response.data.report._id);
      }
    } catch (error) {
      console.error("Save error:", error);
      showNotification(
        error.response?.data?.message || "Error saving report",
        "error"
      );
    } finally {
      setIsSaving(false);
    }
  };

  const printReport = () => {
    window.print();
  };

  return (
    <div className="efm-monthly-report-body">
      <div
        className="efm-no-print"
        style={{
          display: "flex",
          gap: "10px",
          position: "fixed",
          top: "20px",
          right: "20px",
          zIndex: 1000,
          width: "300px",
          justifyContent: "flex-end",
        }}
      >
        {!isViewMode && (
          <button
            className="efm-print-btn"
            onClick={handleSave}
            disabled={isSaving}
            style={{
              display: "flex",
              top: 80,
              alignItems: "center",
              marginRight: "10px",
            }}
          >
            <FaSave style={{ marginRight: "8px" }} />
            {isSaving ? "Saving..." : "Save Report"}
          </button>
        )}
        <button
          className="efm-print-btn"
          onClick={printReport}
          style={{
            display: "flex",
            top: 20,
            alignItems: "center",
            marginRight: "10px",
          }}
        >
          <FaPrint style={{ marginRight: "8px" }} /> Print PDF
        </button>
      </div>

      <div className="efm-report-container">
        <div className="efm-report-header">
          <div className="efm-company-logo">
            <img src={Logo} alt="Logo" />
          </div>
          <div className="efm-header-text">
            <h1>
              <strong style={{ fontWeight: "500" }}>Monthly Report</strong>
            </h1>
            <h2>
              <strong style={{ fontWeight: "500" }}>EFM - Pvt - Ltd</strong>
            </h2>
          </div>
          <div></div>
        </div>

        <div className="efm-section-header">Student Information:</div>
        <div className="efm-student-info">
          <table className="efm-info-table">
            <tbody>
              <tr>
                <td style={{ width: 300 }}>
                  <strong style={{ fontWeight: "500" }}>Family Name</strong>
                </td>
                <td>
                  <input
                    type="text"
                    name="familyName"
                    value={formData.familyName}
                    onChange={handleInputChange}
                    disabled={isViewMode}
                  />
                </td>
              </tr>
              <tr>
                <td style={{ width: 300 }}>
                  <strong style={{ fontWeight: "500" }}>Student Name</strong>
                </td>
                <td>
                  <input
                    type="text"
                    name="studentName"
                    value={formData.studentName}
                    onChange={handleInputChange}
                    disabled={isViewMode}
                  />
                </td>
              </tr>
              <tr>
                <td style={{ width: 300 }}>
                  <strong style={{ fontWeight: "500" }}>Grade</strong>
                </td>
                <td>
                  <input
                    type="text"
                    name="grade"
                    value={formData.grade}
                    onChange={handleInputChange}
                    disabled={isViewMode}
                  />
                </td>
              </tr>
              <tr>
                <td style={{ width: 300 }}>
                  <strong style={{ fontWeight: "500" }}>Subject</strong>
                </td>
                <td>
                  <input
                    type="text"
                    name="subject"
                    value={formData.subject}
                    onChange={handleInputChange}
                    disabled={isViewMode}
                  />
                </td>
              </tr>
              <tr>
                <td style={{ width: 300 }}>
                  <strong style={{ fontWeight: "500" }}>Month</strong>
                </td>
                <td>
                  <select
                    name="classCount"
                    value={selectedMonth}
                    onChange={handleMonthChange}
                    style={{
                      width: "100%",
                      padding: "2px",
                      borderRadius: "4px",
                      fontFamily: "Poppins, sans-serif",
                      fontSize: "16px",
                    }}
                    disabled={isViewMode}
                  >
                    {generateMonthYearOptions().map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </td>
              </tr>
              <tr style={{ borderBottomWidth: 1, borderBottomColor: "#000" }}>
                <td>
                  <strong style={{ fontWeight: "500" }}>Tutor's Name</strong>
                </td>
                <td>
                  <input
                    type="text"
                    name="tutorName"
                    value={formData.tutorName}
                    onChange={handleInputChange}
                    disabled={isViewMode}
                  />
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="efm-section-header">Academic Information:</div>
        <div className="efm-academic-section">
          <table className="efm-academic-table">
            <thead>
              <tr>
                <th>
                  <strong style={{ fontWeight: "500" }}>Date</strong>
                </th>
                <th>
                  <strong style={{ fontWeight: "500" }}>Topics</strong>
                </th>
                <th>
                  <strong style={{ fontWeight: "500" }}>Date</strong>
                </th>
                <th>
                  <strong style={{ fontWeight: "500" }}>Topics</strong>
                </th>
                {!isViewMode && (
                  <th className="efm-no-print" style={{ width: "80px" }}>
                    <strong style={{ fontWeight: "500" }}>Action</strong>
                  </th>
                )}
              </tr>
            </thead>
            <tbody>
              {academicRows.map((row) => (
                <tr
                  key={row.id}
                  style={{ borderBottomWidth: 1, borderBottomColor: "#000" }}
                >
                  <td>
                    <input
                      type="text"
                      placeholder="dd/mm/yyyy"
                      value={row.date1}
                      onChange={(e) =>
                        handleRowInputChange(row.id, "date1", e.target.value)
                      }
                      disabled={isViewMode}
                    />
                  </td>
                  <td>
                    <input
                      type="text"
                      placeholder=""
                      value={row.topic1}
                      onChange={(e) =>
                        handleRowInputChange(row.id, "topic1", e.target.value)
                      }
                      disabled={isViewMode}
                    />
                  </td>
                  <td>
                    <input
                      type="text"
                      placeholder="dd/mm/yyyy"
                      value={row.date2}
                      onChange={(e) =>
                        handleRowInputChange(row.id, "date2", e.target.value)
                      }
                      disabled={isViewMode}
                    />
                  </td>
                  <td>
                    <input
                      type="text"
                      placeholder=""
                      value={row.topic2}
                      onChange={(e) =>
                        handleRowInputChange(row.id, "topic2", e.target.value)
                      }
                      disabled={isViewMode}
                    />
                  </td>
                  {!isViewMode && (
                    <td className="efm-no-print">
                      <button
                        className="efm-remove-row-btn"
                        onClick={() => removeRow(row.id)}
                      >
                        ×
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
          {!isViewMode && (
            <button
              className="efm-add-row-btn efm-no-print"
              onClick={addAcademicRow}
            >
              + Add Row
            </button>
          )}
        </div>

        <div className="efm-section-header">Test Scores:</div>
        <div className="efm-test-scores-section">
          <div className="efm-test-block">
            <div className="efm-test-line">
              Test No. ={" "}
              <input
                type="text"
                name="test1No"
                value={formData.test1No}
                onChange={handleInputChange}
              />
            </div>
            <div className="efm-test-line">
              Total marks ={" "}
              <input
                type="text"
                name="test1Total"
                placeholder="Not Mark"
                value={formData.test1Total}
                onChange={handleInputChange}
              />
            </div>
            <div className="efm-test-line">
              Passing Marks ={" "}
              <input
                type="text"
                name="test1Passing"
                placeholder="Not Mark"
                value={formData.test1Passing}
                onChange={handleInputChange}
              />
            </div>
            <div className="efm-test-line">
              Obtained Marks ={" "}
              <input
                type="text"
                name="test1Obtained"
                placeholder="Not Mark"
                value={formData.test1Obtained}
                onChange={handleInputChange}
              />
            </div>
            <div>------------------------------------------</div>
          </div>

          <div className="efm-separator-line"></div>

          <div className="efm-test-block">
            <div className="efm-test-line">
              Test No. ={" "}
              <input
                type="text"
                name="test2No"
                value={formData.test2No}
                onChange={handleInputChange}
              />
            </div>
            <div className="efm-test-line">
              Total marks ={" "}
              <input
                type="text"
                name="test2Total"
                placeholder="Not Mark"
                value={formData.test2Total}
                onChange={handleInputChange}
              />
            </div>
            <div className="efm-test-line">
              Passing Marks ={" "}
              <input
                type="text"
                name="test2Passing"
                placeholder="Not Mark"
                value={formData.test2Passing}
                onChange={handleInputChange}
              />
            </div>
            <div className="efm-test-line">
              Obtained Marks ={" "}
              <input
                type="text"
                name="test2Obtained"
                placeholder="Not Mark"
                value={formData.test2Obtained}
                onChange={handleInputChange}
              />
            </div>
            <div>------------------------------------------</div>
          </div>

          <div className="efm-separator-line"></div>

          <div className="efm-test-block">
            <div className="efm-test-line">
              Test No. ={" "}
              <input
                type="text"
                name="test3No"
                value={formData.test3No}
                onChange={handleInputChange}
              />
            </div>
            <div className="efm-test-line">
              Total marks ={" "}
              <input
                type="text"
                name="test3Total"
                placeholder="Not Mark"
                value={formData.test3Total}
                onChange={handleInputChange}
              />
            </div>
            <div className="efm-test-line">
              Passing Marks ={" "}
              <input
                type="text"
                name="test3Passing"
                placeholder="Not Mark"
                value={formData.test3Passing}
                onChange={handleInputChange}
              />
            </div>
            <div className="efm-test-line">
              Obtained Marks ={" "}
              <input
                type="text"
                name="test3Obtained"
                placeholder="Not Mark"
                value={formData.test3Obtained}
                onChange={handleInputChange}
              />
            </div>
          </div>
          <div>------------------------------------------</div>
        </div>

        <div className="efm-section-header">Teacher Remarks:</div>
        <div className="efm-remarks-section">
          <textarea
            className="efm-remarks-input"
            name="teacherRemarks"
            placeholder="Enter teacher remarks here..."
            value={formData.teacherRemarks}
            onChange={handleInputChange}
          />
        </div>

        <div className="efm-section-header">Note:</div>
        <div className="efm-notes-section">
          <textarea
            className="efm-notes-input"
            name="notes"
            value={formData.notes}
            onChange={handleInputChange}
          />
        </div>

        <div className="efm-report-footer">
          <a
            href="http://www.efmpvt.com"
            target="_blank"
            rel="noopener noreferrer"
            className="efm-footer-link"
          >
            <FaGlobe style={{ marginRight: "8px" }} />
            www.efmpvt.com
          </a>
          <a href="tel:+923150700775" className="efm-footer-link">
            <FaPhoneAlt style={{ marginRight: "8px" }} />
            +923150700775
          </a>
        </div>
      </div>
      <NotificationSnackbar
        notification={notification}
        onClose={closeNotification}
      />
    </div>
  );
};

export default MonthlyReport;
