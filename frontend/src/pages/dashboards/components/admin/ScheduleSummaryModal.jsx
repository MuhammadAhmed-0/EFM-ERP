import { Box, Typography, useTheme, useMediaQuery } from "@mui/material";
import { getModalStyles } from "../../../../styles/modal/commonModalStyles";

const ScheduleSummaryModal = ({ summary, setShowModal, modalStyle }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const isSmallMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const getResponsiveModalStyle = () => ({
    ...getModalStyles(),
    ...modalStyle,
    width: isMobile ? "95vw" : isSmallMobile ? "98vw" : "800px",
    maxWidth: isMobile ? "none" : "800px",
    maxHeight: isMobile ? "95vh" : "90vh",
    background: "#f8fafc",
    borderRadius: isMobile ? "16px" : "12px",
    padding: isMobile ? "16px" : "24px",
    overflow: "auto",
    margin: isMobile ? "10px" : "auto",
  });

  return (
    <Box sx={getResponsiveModalStyle()}>
      {/* Header Section */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: isMobile ? "flex-start" : "center",
          mb: isMobile ? 2 : 3,
          borderBottom: "1px solid #e2e8f0",
          pb: isMobile ? 1.5 : 2,
          flexDirection: isMobile ? "column" : "row",
          gap: isMobile ? 1 : 0,
        }}
      >
        <Box sx={{ width: isMobile ? "100%" : "auto" }}>
          <Typography
            variant="h5"
            sx={{
              color: "#1e293b",
              fontWeight: 600,
              fontSize: isMobile ? "1.25rem" : "1.5rem",
            }}
          >
            Today's Schedule Summary
          </Typography>
          <Typography
            variant="subtitle2"
            sx={{
              color: "#64748b",
              mt: 0.5,
              fontSize: isMobile ? "0.8125rem" : "0.875rem",
            }}
          >
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
            fontSize: isMobile ? "1.25rem" : "1.5rem",
            cursor: "pointer",
            color: "#64748b",
            padding: isMobile ? "4px" : "8px",
            alignSelf: isMobile ? "flex-end" : "auto",
            borderRadius: isMobile ? "50%" : "4px",
            minWidth: isMobile ? "28px" : "auto",
            height: isMobile ? "28px" : "auto",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
          onMouseEnter={(e) => {
            e.target.style.backgroundColor = "#f1f5f9";
            e.target.style.color = "#3949ab";
          }}
          onMouseLeave={(e) => {
            e.target.style.backgroundColor = "transparent";
            e.target.style.color = "#64748b";
          }}
        >
          ×
        </button>
      </Box>

      {/* Main Content Container */}
      <Box
        sx={{
          display: "flex",
          gap: isMobile ? 1.5 : 2,
          mb: isMobile ? 2 : 3,
          flexDirection: isMobile ? "column" : "row",
        }}
      >
        {/* Today's Classes Section */}
        <Box
          sx={{
            flex: 1,
            background: "#fff",
            borderRadius: isMobile ? "16px" : "12px",
            p: isMobile ? 2 : 3,
            boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
            border: "1px solid #e2e8f0",
          }}
        >
          <Typography
            variant="h6"
            sx={{
              mb: isMobile ? 1.5 : 2,
              color: "#1e293b",
              fontSize: isMobile ? "0.9375rem" : "1rem",
              fontWeight: 600,
            }}
          >
            Today's Classes
          </Typography>
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: isMobile ? "1fr 1fr" : "1fr 1fr",
              gap: isMobile ? 1.5 : 2,
            }}
          >
            {/* Total Classes */}
            <Box
              sx={{
                p: isMobile ? 1.5 : 2,
                borderRadius: "8px",
                background: "#f1f5f9",
                textAlign: "center",
              }}
            >
              <Typography
                sx={{
                  color: "#64748b",
                  fontSize: isMobile ? "0.75rem" : "0.875rem",
                  mb: 1,
                  fontWeight: 600,
                }}
              >
                Total Classes
              </Typography>
              <Typography
                sx={{
                  color: "#1e293b",
                  fontSize: isMobile ? "1.5rem" : "2rem",
                  fontWeight: 600,
                }}
              >
                {summary.totalClasses}
              </Typography>
            </Box>

            {/* Completed */}
            <Box
              sx={{
                p: isMobile ? 1.5 : 2,
                borderRadius: "8px",
                background: "#dcfce7",
                textAlign: "center",
              }}
            >
              <Typography
                sx={{
                  color: "#166534",
                  fontSize: isMobile ? "0.75rem" : "0.875rem",
                  mb: 1,
                  fontWeight: 600,
                }}
              >
                Completed
              </Typography>
              <Typography
                sx={{
                  color: "#166534",
                  fontSize: isMobile ? "1.5rem" : "2rem",
                  fontWeight: 600,
                }}
              >
                {summary.completedClasses}
              </Typography>
            </Box>

            {/* In Progress */}
            <Box
              sx={{
                p: isMobile ? 1.5 : 2,
                borderRadius: "8px",
                background: "#fff7ed",
                textAlign: "center",
              }}
            >
              <Typography
                sx={{
                  color: "#9a3412",
                  fontSize: isMobile ? "0.75rem" : "0.875rem",
                  mb: 1,
                  fontWeight: 600,
                }}
              >
                In Progress
              </Typography>
              <Typography
                sx={{
                  color: "#9a3412",
                  fontSize: isMobile ? "1.5rem" : "2rem",
                  fontWeight: 600,
                }}
              >
                {summary.activeClasses}
              </Typography>
            </Box>

            {/* Pending */}
            <Box
              sx={{
                p: isMobile ? 1.5 : 2,
                borderRadius: "8px",
                background: "#f0f9ff",
                textAlign: "center",
              }}
            >
              <Typography
                sx={{
                  color: "#075985",
                  fontSize: isMobile ? "0.75rem" : "0.875rem",
                  mb: 1,
                  fontWeight: 600,
                }}
              >
                Pending
              </Typography>
              <Typography
                sx={{
                  color: "#075985",
                  fontSize: isMobile ? "1.5rem" : "2rem",
                  fontWeight: 600,
                }}
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
            borderRadius: isMobile ? "16px" : "12px",
            p: isMobile ? 2 : 3,
            boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
            border: "1px solid #e2e8f0",
          }}
        >
          <Typography
            variant="h6"
            sx={{
              mb: isMobile ? 1.5 : 2,
              color: "#1e293b",
              fontSize: isMobile ? "0.9375rem" : "1rem",
              fontWeight: 600,
            }}
          >
            Timing Analysis
          </Typography>
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              gap: isMobile ? 1.5 : 2,
            }}
          >
            <Box
              sx={{
                display: "flex",
                gap: isMobile ? 1.5 : 2,
                flexDirection: isSmallMobile ? "column" : "row",
              }}
            >
              {/* Late Started */}
              <Box
                sx={{
                  flex: 1,
                  p: isMobile ? 1.5 : 2,
                  borderRadius: "8px",
                  background: "#fef2f2",
                }}
              >
                <Typography
                  sx={{
                    color: "#991b1b",
                    fontSize: isMobile ? "0.75rem" : "0.875rem",
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
                      fontSize: isMobile ? "1.25rem" : "1.5rem",
                      fontWeight: 600,
                    }}
                  >
                    {summary.lateStartedClasses}
                  </Typography>
                  <Typography
                    sx={{
                      color: "#991b1b",
                      fontSize: isMobile ? "0.75rem" : "0.875rem",
                    }}
                  >
                    classes
                  </Typography>
                </Box>
                <Typography
                  sx={{
                    color: "#991b1b",
                    fontSize: isMobile ? "0.75rem" : "0.875rem",
                    mt: 0.5,
                  }}
                >
                  Total: {summary.totalLateMinutes}m
                </Typography>
              </Box>

              {/* Early Ended */}
              <Box
                sx={{
                  flex: 1,
                  p: isMobile ? 1.5 : 2,
                  borderRadius: "8px",
                  background: "#fff7ed",
                }}
              >
                <Typography
                  sx={{
                    color: "#9a3412",
                    fontSize: isMobile ? "0.75rem" : "0.875rem",
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
                      fontSize: isMobile ? "1.25rem" : "1.5rem",
                      fontWeight: 600,
                    }}
                  >
                    {summary.earlyEndedClasses}
                  </Typography>
                  <Typography
                    sx={{
                      color: "#9a3412",
                      fontSize: isMobile ? "0.75rem" : "0.875rem",
                    }}
                  >
                    classes
                  </Typography>
                </Box>
                <Typography
                  sx={{
                    color: "#9a3412",
                    fontSize: isMobile ? "0.75rem" : "0.875rem",
                    mt: 0.5,
                  }}
                >
                  Total: {summary.totalEarlyMinutes}m
                </Typography>
              </Box>
            </Box>
          </Box>
        </Box>
      </Box>

      {/* Additional Session Statuses Section */}
      <Box
        sx={{
          background: "#fff",
          borderRadius: isMobile ? "16px" : "12px",
          p: isMobile ? 2 : 3,
          boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
          border: "1px solid #e2e8f0",
        }}
      >
        <Typography
          variant="h6"
          sx={{
            mb: isMobile ? 1.5 : 2,
            color: "#1e293b",
            fontSize: isMobile ? "0.9375rem" : "1rem",
            fontWeight: 600,
          }}
        >
          Additional Session Status
        </Typography>
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: isMobile
              ? isSmallMobile
                ? "1fr"
                : "repeat(2, 1fr)"
              : "repeat(3, 1fr)",
            gap: isMobile ? 1.5 : 2,
          }}
        >
          {/* Available Sessions */}
          <Box
            sx={{
              p: isMobile ? 1.5 : 2,
              borderRadius: "8px",
              background: "#e0f2fe",
              textAlign: "center",
            }}
          >
            <Typography
              sx={{
                color: "#0369a1",
                fontSize: isMobile ? "0.75rem" : "0.875rem",
                mb: 1,
                fontWeight: 600,
              }}
            >
              Available
            </Typography>
            <Typography
              sx={{
                color: "#0369a1",
                fontSize: isMobile ? "1.5rem" : "2rem",
                fontWeight: 600,
              }}
            >
              {summary.availableClasses || 0}
            </Typography>
          </Box>

          {/* Absent Sessions */}
          <Box
            sx={{
              p: isMobile ? 1.5 : 2,
              borderRadius: "8px",
              background: "#fee2e2",
              textAlign: "center",
            }}
          >
            <Typography
              sx={{
                color: "#dc2626",
                fontSize: isMobile ? "0.75rem" : "0.875rem",
                mb: 1,
                fontWeight: 600,
              }}
            >
              Absent
            </Typography>
            <Typography
              sx={{
                color: "#dc2626",
                fontSize: isMobile ? "1.5rem" : "2rem",
                fontWeight: 600,
              }}
            >
              {summary.absentClasses || 0}
            </Typography>
          </Box>

          {/* Leave Sessions */}
          <Box
            sx={{
              p: isMobile ? 1.5 : 2,
              borderRadius: "8px",
              background: "#fed7aa",
              textAlign: "center",
              gridColumn: isSmallMobile ? "1 / -1" : "auto",
            }}
          >
            <Typography
              sx={{
                color: "#ea580c",
                fontSize: isMobile ? "0.75rem" : "0.875rem",
                mb: 1,
                fontWeight: 600,
              }}
            >
              Leave
            </Typography>
            <Typography
              sx={{
                color: "#ea580c",
                fontSize: isMobile ? "1.5rem" : "2rem",
                fontWeight: 600,
              }}
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
