import { Box, CircularProgress, Paper } from "@mui/material";
import { formatDistanceToNow, parseISO } from "date-fns";
import "../../../styles/components/SupervisorQueries.css";

const QUERY_TYPE_LABELS = {
  attendance_issue: "Attendance Issue",
  leave_request: "Leave Request",
  salary_query: "Salary Query",
  schedule_change: "Schedule Change",
  technical_issue: "Technical Issue",
  other: "Other",
};

const QueryList = ({ queries, isLoading }) => {
  const formatQueryType = (type) => {
    return QUERY_TYPE_LABELS[type] || type;
  };

  const formatDate = (dateString) => {
    try {
      if (!dateString) return "Date unavailable";
      const date = parseISO(dateString);
      return formatDistanceToNow(date, { addSuffix: true });
    } catch (error) {
      console.error("Date formatting error:", error);
      return "Date unavailable";
    }
  };

  if (isLoading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", p: 3 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!queries.length) {
    return (
      <Paper className="query-card" style={{ textAlign: "center" }}>
        <p className="query-content">No queries found</p>
      </Paper>
    );
  }

  return (
    <div className="queries-list">
      {queries.map((query) => (
        <div key={query._id} className="query-card">
          <div className="query-header">
            <div className="query-header-left">
              <span className={`query-type-chip type-${query.queryType}`}>
                {formatQueryType(query.queryType)}
              </span>
            </div>
            <span className="query-timestamp">
              {formatDate(query.createdAt)}
            </span>
          </div>
          <p className="query-content">{query.content}</p>
          <div className="query-footer">
            <div className="query-status">
              <span
                className={`status-indicator ${
                  query.readBy?.length ? "status-read" : "status-pending"
                }`}
              />
              <span>
                {query.readBy?.length ? "Responded" : "Pending response"}
              </span>
            </div>
          </div>

          {query.response && (
            <div className="query-response">
              <div className="response-header">
                <span className="response-label">Admin Response</span>
                <span className="response-timestamp">
                  {formatDate(query.response.respondedAt)}
                </span>
              </div>
              <p className="response-content">{query.response.content}</p>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default QueryList;
