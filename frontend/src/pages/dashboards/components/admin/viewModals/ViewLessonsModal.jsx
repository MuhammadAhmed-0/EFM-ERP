import { Box, Button, Typography } from "@mui/material";
import ReactDatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { format } from "date-fns";
import { getModalStyles } from "../../../../../styles/modal/commonModalStyles";
import { FaFilter } from "react-icons/fa";

const customStyles = {
  dateInputWrapper: {
    position: "relative",
    width: "100%",
  },
  filterIcon: {
    position: "absolute",
    left: "12px",
    top: "50%",
    transform: "translateY(-50%)",
    color: "#64748b",
    zIndex: 1,
  },
  dateInput: {
    width: "100%",
    padding: "8px 12px 8px 36px",
    border: "1px solid #e2e8f0",
    borderRadius: "6px",
    fontSize: "0.875rem",
    color: "#475569",
    backgroundColor: "white",
  },
};
const ViewLessonsModal = ({
  lessons,
  studentName,
  subjectName,
  setShowModal,
  dateRange,
  setDateRange,
}) => {
  const filteredLessons =
    dateRange[0] && dateRange[1]
      ? lessons.filter((lesson) => {
          const lessonDate = new Date(lesson.addedAt);
          return lessonDate >= dateRange[0] && lessonDate <= dateRange[1];
        })
      : lessons;

  return (
    <Box sx={getModalStyles()}>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 3,
        }}
      >
        <Typography variant="h6">
          Lessons for {studentName} - {subjectName}
        </Typography>
        <Button onClick={() => setShowModal(false)}>×</Button>
      </Box>

      <Box sx={{ mb: 3, width: "100%" }}>
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
            <div style={customStyles.dateInputWrapper}>
              <FaFilter style={customStyles.filterIcon} />
              <input
                style={customStyles.dateInput}
                placeholder="Filter by date range"
                value={
                  dateRange[0] && dateRange[1]
                    ? `${format(dateRange[0], "dd/MM/yyyy")} - ${format(
                        dateRange[1],
                        "dd/MM/yyyy"
                      )}`
                    : ""
                }
                readOnly
              />
            </div>
          }
        />
      </Box>
      {filteredLessons.map((lesson, index) => (
        <Box
          key={index}
          sx={{
            mb: 2,
            p: 2,
            border: "1px solid #e2e8f0",
            borderRadius: "8px",
            bgcolor: "#f8fafc",
          }}
        >
          <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
            {lesson.title}
          </Typography>
          <Typography variant="body2" sx={{ mb: 1 }}>
            {lesson.description}
          </Typography>
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              color: "#64748b",
              fontSize: "0.875rem",
              mt: 1,
            }}
          >
            <span>
              Class Date: {format(new Date(lesson.classDate), "dd/MM/yyyy")}
            </span>
          </Box>
        </Box>
      ))}

      {filteredLessons.length === 0 && (
        <Typography sx={{ textAlign: "center", color: "#64748b" }}>
          No lessons found
        </Typography>
      )}
    </Box>
  );
};

export default ViewLessonsModal;
