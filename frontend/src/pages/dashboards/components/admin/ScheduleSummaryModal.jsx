import { Box, Typography } from "@mui/material";
import { getModalStyles } from "../../../../styles/modal/commonModalStyles";

const ScheduleSummaryModal = ({ summary, setShowModal, modalStyle }) => {
  return (
    <Box
      sx={[
        getModalStyles(),
        {
          ...modalStyle,
          width: "800px",
          background: "#f8fafc",
        },
      ]}
    >
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 3,
          borderBottom: "1px solid #e2e8f0",
          pb: 2,
        }}
      >
        <Box>
          <Typography variant="h5" sx={{ color: "#1e293b", fontWeight: 600 }}>
            Today's Schedule Summary
          </Typography>
          <Typography variant="subtitle2" sx={{ color: "#64748b", mt: 0.5 }}>
            {new Date().toLocaleDateString("en-US", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </Typography>
        </Box>
        <button
          onClick={() => setShowModal(false)}
          style={{
            border: "none",
            background: "none",
            fontSize: "1.5rem",
            cursor: "pointer",
            color: "#64748b",
            padding: "8px",
          }}
        >
          ×
        </button>
      </Box>

      <Box sx={{ display: "flex", gap: 2, mb: 3 }}>
        {/* Today's Classes Section */}
        <Box
          sx={{
            flex: 1,
            background: "#fff",
            borderRadius: "12px",
            p: 3,
            boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
            border: "1px solid #e2e8f0",
          }}
        >
          <Typography
            variant="h6"
            sx={{ mb: 2, color: "#1e293b", fontSize: "1rem", fontWeight: 600 }}
          >
            Today's Classes
          </Typography>
          <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2 }}>
            <Box
              sx={{
                p: 2,
                borderRadius: "8px",
                background: "#f1f5f9",
                textAlign: "center",
              }}
            >
              <Typography
                sx={{
                  color: "#64748b",
                  fontSize: "0.875rem",
                  mb: 1,
                  fontWeight: 600,
                }}
              >
                Total Classes
              </Typography>
              <Typography
                sx={{ color: "#1e293b", fontSize: "2rem", fontWeight: 600 }}
              >
                {summary.totalClasses}
              </Typography>
            </Box>
            <Box
              sx={{
                p: 2,
                borderRadius: "8px",
                background: "#dcfce7",
                textAlign: "center",
              }}
            >
              <Typography
                sx={{
                  color: "#166534",
                  fontSize: "0.875rem",
                  mb: 1,
                  fontWeight: 600,
                }}
              >
                Completed
              </Typography>
              <Typography
                sx={{ color: "#166534", fontSize: "2rem", fontWeight: 600 }}
              >
                {summary.completedClasses}
              </Typography>
            </Box>
            <Box
              sx={{
                p: 2,
                borderRadius: "8px",
                background: "#fff7ed",
                textAlign: "center",
              }}
            >
              <Typography
                sx={{
                  color: "#9a3412",
                  fontSize: "0.875rem",
                  mb: 1,
                  fontWeight: 600,
                }}
              >
                In Progress
              </Typography>
              <Typography
                sx={{ color: "#9a3412", fontSize: "2rem", fontWeight: 600 }}
              >
                {summary.activeClasses}
              </Typography>
            </Box>
            <Box
              sx={{
                p: 2,
                borderRadius: "8px",
                background: "#f0f9ff",
                textAlign: "center",
              }}
            >
              <Typography
                sx={{
                  color: "#075985",
                  fontSize: "0.875rem",
                  mb: 1,
                  fontWeight: 600,
                }}
              >
                Pending
              </Typography>
              <Typography
                sx={{ color: "#075985", fontSize: "2rem", fontWeight: 600 }}
              >
                {summary.pendingClasses}
              </Typography>
            </Box>
          </Box>
        </Box>

        {/* Timing Analysis Section */}
        <Box
          sx={{
            flex: 1,
            background: "#fff",
            borderRadius: "12px",
            p: 3,
            boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
            border: "1px solid #e2e8f0",
          }}
        >
          <Typography
            variant="h6"
            sx={{ mb: 2, color: "#1e293b", fontSize: "1rem", fontWeight: 600 }}
          >
            Timing Analysis
          </Typography>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <Box sx={{ display: "flex", gap: 2 }}>
              <Box
                sx={{
                  flex: 1,
                  p: 2,
                  borderRadius: "8px",
                  background: "#fef2f2",
                }}
              >
                <Typography
                  sx={{
                    color: "#991b1b",
                    fontSize: "0.875rem",
                    mb: 0.5,
                    fontWeight: 600,
                  }}
                >
                  Late Started
                </Typography>
                <Box sx={{ display: "flex", alignItems: "baseline", gap: 1 }}>
                  <Typography
                    sx={{
                      color: "#991b1b",
                      fontSize: "1.5rem",
                      fontWeight: 600,
                    }}
                  >
                    {summary.lateStartedClasses}
                  </Typography>
                  <Typography sx={{ color: "#991b1b", fontSize: "0.875rem" }}>
                    classes
                  </Typography>
                </Box>
                <Typography
                  sx={{ color: "#991b1b", fontSize: "0.875rem", mt: 0.5 }}
                >
                  Total: {summary.totalLateMinutes}m
                </Typography>
              </Box>
              <Box
                sx={{
                  flex: 1,
                  p: 2,
                  borderRadius: "8px",
                  background: "#fff7ed",
                }}
              >
                <Typography
                  sx={{
                    color: "#9a3412",
                    fontSize: "0.875rem",
                    mb: 0.5,
                    fontWeight: 600,
                  }}
                >
                  Early Ended
                </Typography>
                <Box sx={{ display: "flex", alignItems: "baseline", gap: 1 }}>
                  <Typography
                    sx={{
                      color: "#9a3412",
                      fontSize: "1.5rem",
                      fontWeight: 600,
                    }}
                  >
                    {summary.earlyEndedClasses}
                  </Typography>
                  <Typography sx={{ color: "#9a3412", fontSize: "0.875rem" }}>
                    classes
                  </Typography>
                </Box>
                <Typography
                  sx={{ color: "#9a3412", fontSize: "0.875rem", mt: 0.5 }}
                >
                  Total: {summary.totalEarlyMinutes}m
                </Typography>
              </Box>
            </Box>
          </Box>
        </Box>
      </Box>

      {/* NEW SECTION: Additional Session Statuses */}
      <Box
        sx={{
          background: "#fff",
          borderRadius: "12px",
          p: 3,
          boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
          border: "1px solid #e2e8f0",
        }}
      >
        <Typography
          variant="h6"
          sx={{ mb: 2, color: "#1e293b", fontSize: "1rem", fontWeight: 600 }}
        >
          Additional Session Status
        </Typography>
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: 2,
          }}
        >
          {/* Available Sessions */}
          <Box
            sx={{
              p: 2,
              borderRadius: "8px",
              background: "#e0f2fe",
              textAlign: "center",
            }}
          >
            <Typography
              sx={{
                color: "#0369a1",
                fontSize: "0.875rem",
                mb: 1,
                fontWeight: 600,
              }}
            >
              Available
            </Typography>
            <Typography
              sx={{ color: "#0369a1", fontSize: "2rem", fontWeight: 600 }}
            >
              {summary.availableClasses || 0}
            </Typography>
          </Box>

          {/* Absent Sessions */}
          <Box
            sx={{
              p: 2,
              borderRadius: "8px",
              background: "#fee2e2",
              textAlign: "center",
            }}
          >
            <Typography
              sx={{
                color: "#dc2626",
                fontSize: "0.875rem",
                mb: 1,
                fontWeight: 600,
              }}
            >
              Absent
            </Typography>
            <Typography
              sx={{ color: "#dc2626", fontSize: "2rem", fontWeight: 600 }}
            >
              {summary.absentClasses || 0}
            </Typography>
          </Box>

          {/* Leave Sessions */}
          <Box
            sx={{
              p: 2,
              borderRadius: "8px",
              background: "#fed7aa",
              textAlign: "center",
            }}
          >
            <Typography
              sx={{
                color: "#ea580c",
                fontSize: "0.875rem",
                mb: 1,
                fontWeight: 600,
              }}
            >
              Leave
            </Typography>
            <Typography
              sx={{ color: "#ea580c", fontSize: "2rem", fontWeight: 600 }}
            >
              {summary.leaveClasses || 0}
            </Typography>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default ScheduleSummaryModal;
