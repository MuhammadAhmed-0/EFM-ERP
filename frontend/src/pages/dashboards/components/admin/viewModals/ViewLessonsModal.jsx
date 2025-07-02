import { useState, useEffect } from "react";
import { Box, Button, Typography, Modal } from "@mui/material";
import ReactDatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { format } from "date-fns";
import { FaFilter } from "react-icons/fa";

const useResponsive = () => {
  const [screenSize, setScreenSize] = useState({
    isMobile: false,
    isTablet: false,
    isDesktop: false,
    width: 0,
  });

  useEffect(() => {
    const checkScreenSize = () => {
      const width = window.innerWidth;
      setScreenSize({
        isMobile: width < 768,
        isTablet: width >= 768 && width < 1024,
        isDesktop: width >= 1024,
        width,
      });
    };

    checkScreenSize();
    window.addEventListener("resize", checkScreenSize);
    return () => window.removeEventListener("resize", checkScreenSize);
  }, []);

  return screenSize;
};

const POPPINS_FONT =
  "'Poppins', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";

const ViewLessonsModal = ({
  lessons,
  studentName,
  subjectName,
  setShowModal,
  dateRange,
  setDateRange,
  open = true,
}) => {
  const { isMobile, isTablet } = useResponsive();

  const getResponsiveModalStyles = () => ({
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    width: {
      xs: "95vw",
      sm: "90vw",
      md: "700px",
      lg: "800px",
      xl: "900px",
    },
    maxWidth: {
      xs: "400px",
      sm: "600px",
      md: "700px",
      lg: "800px",
      xl: "900px",
    },
    maxHeight: {
      xs: "95vh",
      sm: "90vh",
      md: "85vh",
    },
    bgcolor: "background.paper",
    borderRadius: "12px",
    boxShadow:
      "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)",
    p: {
      xs: 2,
      sm: 3,
      md: 4,
    },
    overflow: "hidden",
    display: "flex",
    flexDirection: "column",
    fontFamily: POPPINS_FONT,
    "&:focus-visible": {
      outline: "none",
    },
    "& *": {
      fontFamily: `${POPPINS_FONT} !important`,
    },
  });

  const getDateInputStyles = () => ({
    dateInputWrapper: {
      position: "relative",
      width: "100%",
    },
    filterIcon: {
      position: "absolute",
      left: isMobile ? "8px" : "12px",
      top: "50%",
      transform: "translateY(-50%)",
      color: "#64748b",
      zIndex: 1,
      fontSize: isMobile ? "0.8rem" : "0.875rem",
    },
    dateInput: {
      width: "100%",
      padding: isMobile ? "10px 12px 10px 32px" : "12px 16px 12px 40px",
      border: "1px solid #e2e8f0",
      borderRadius: "8px",
      fontSize: isMobile ? "0.8rem" : "0.875rem",
      color: "#475569",
      backgroundColor: "white",
      height: isMobile ? "44px" : "48px",
      boxSizing: "border-box",
      cursor: "pointer",
      "&:focus": {
        outline: "none",
        borderColor: "#3b82f6",
        boxShadow: "0 0 0 2px rgba(59, 130, 246, 0.1)",
      },
    },
  });

  const filteredLessons =
    dateRange[0] && dateRange[1]
      ? lessons.filter((lesson) => {
          const lessonDate = new Date(lesson.addedAt);
          return lessonDate >= dateRange[0] && lessonDate <= dateRange[1];
        })
      : lessons;

  const customStyles = getDateInputStyles();

  const handleClose = () => {
    setDateRange([null, null]);
    setShowModal(false);
  };

  return (
    <Modal
      open={open}
      onClose={handleClose}
      aria-labelledby="view-lessons-modal"
    >
      <Box sx={getResponsiveModalStyles()}>
        {/* Header */}
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            mb: {
              xs: 2,
              sm: 2.5,
              md: 3,
            },
            pb: {
              xs: 1.5,
              sm: 2,
            },
            borderBottom: "1px solid #e2e8f0",
            flexDirection: {
              xs: "column",
              sm: "row",
            },
            gap: {
              xs: 1,
              sm: 0,
            },
          }}
        >
          <Box
            sx={{
              flex: 1,
              width: "100%",
            }}
          >
            <Typography
              variant="h6"
              sx={{
                fontFamily: POPPINS_FONT,
                fontWeight: 600,
                fontSize: {
                  xs: "1.1rem",
                  sm: "1.2rem",
                  md: "1.25rem",
                },
                lineHeight: 1.2,
                mb: {
                  xs: 0.5,
                  sm: 0,
                },
                pr: {
                  xs: 0,
                  sm: 2,
                },
                textAlign: {
                  xs: "center",
                  sm: "left",
                },
                color: "#1e293b",
              }}
            >
              Lessons for {studentName} - {subjectName}
            </Typography>
          </Box>
          <Button
            onClick={handleClose}
            sx={{
              minWidth: {
                xs: "32px",
                sm: "36px",
              },
              height: {
                xs: "32px",
                sm: "36px",
              },
              p: 0,
              borderRadius: "50%",
              color: "#64748b",
              fontSize: {
                xs: "18px",
                sm: "20px",
              },
              alignSelf: {
                xs: "flex-end",
                sm: "flex-start",
              },
              position: {
                xs: "absolute",
                sm: "static",
              },
              top: {
                xs: "16px",
                sm: "auto",
              },
              right: {
                xs: "16px",
                sm: "auto",
              },
              "&:hover": {
                bgcolor: "#f1f5f9",
                color: "#3949ab",
              },
            }}
          >
            ×
          </Button>
        </Box>

        {/* Date Filter */}
        <Box
          sx={{
            mb: {
              xs: 2,
              sm: 2.5,
              md: 3,
            },
            width: "100%",
          }}
        >
          <Typography
            variant="body2"
            sx={{
              fontFamily: POPPINS_FONT,
              color: "#64748b",
              mb: 1,
              fontSize: {
                xs: "0.8rem",
                sm: "0.875rem",
              },
              fontWeight: 500,
            }}
          >
            Filter by Date Range
          </Typography>
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
                  placeholder="Select date range to filter lessons"
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
            popperClassName="responsive-datepicker"
            popperProps={{
              strategy: "fixed",
            }}
          />
        </Box>

        {/* Lessons Content */}
        <Box
          sx={{
            flex: 1,
            overflowY: "auto",
            pr: {
              xs: 1,
              sm: 1.5,
            },
            "&::-webkit-scrollbar": {
              width: isMobile ? "4px" : "6px",
            },
            "&::-webkit-scrollbar-track": {
              background: "#f1f5f9",
              borderRadius: "3px",
            },
            "&::-webkit-scrollbar-thumb": {
              background: "#cbd5e1",
              borderRadius: "3px",
            },
            "&::-webkit-scrollbar-thumb:hover": {
              background: "#94a3b8",
            },
          }}
        >
          {filteredLessons.map((lesson, index) => (
            <Box
              key={index}
              sx={{
                mb: {
                  xs: 2,
                  sm: 2.5,
                },
                p: {
                  xs: 1.5,
                  sm: 2,
                  md: 2.5,
                },
                border: "1px solid #e2e8f0",
                borderRadius: "8px",
                bgcolor: "#f8fafc",
                transition: "all 0.2s ease",
                "&:hover": {
                  borderColor: "#cbd5e1",
                  bgcolor: "#f1f5f9",
                  transform: "translateY(-1px)",
                  boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
                },
              }}
            >
              <Typography
                variant="subtitle1"
                sx={{
                  fontFamily: POPPINS_FONT,
                  fontWeight: 600,
                  mb: {
                    xs: 1,
                    sm: 1.5,
                  },
                  fontSize: {
                    xs: "0.9rem",
                    sm: "1rem",
                    md: "1.1rem",
                  },
                  color: "#1e293b",
                  lineHeight: 1.3,
                }}
              >
                {lesson.title}
              </Typography>

              <Typography
                variant="body2"
                sx={{
                  fontFamily: POPPINS_FONT,
                  mb: {
                    xs: 1.5,
                    sm: 2,
                  },
                  fontSize: {
                    xs: "0.8rem",
                    sm: "0.875rem",
                    md: "0.9rem",
                  },
                  color: "#475569",
                  lineHeight: 1.5,
                }}
              >
                {lesson.description}
              </Typography>

              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: {
                    xs: "flex-start",
                    sm: "center",
                  },
                  flexDirection: {
                    xs: "column",
                    sm: "row",
                  },
                  gap: {
                    xs: 1,
                    sm: 0,
                  },
                  color: "#64748b",
                  fontSize: {
                    xs: "0.75rem",
                    sm: "0.8rem",
                    md: "0.875rem",
                  },
                  mt: {
                    xs: 1,
                    sm: 1.5,
                  },
                  pt: {
                    xs: 1,
                    sm: 1.5,
                  },
                  borderTop: "1px solid #e2e8f0",
                }}
              >
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 0.5,
                  }}
                >
                  <Typography
                    component="span"
                    sx={{
                      fontFamily: POPPINS_FONT,
                      fontWeight: 600,
                      color: "#374151",
                    }}
                  >
                    Class Date:
                  </Typography>
                  <Typography
                    component="span"
                    sx={{
                      fontFamily: POPPINS_FONT,
                      color: "#1e293b",
                      fontWeight: 500,
                    }}
                  >
                    {format(
                      new Date(lesson.classDate),
                      isMobile ? "dd/MM/yy" : "dd/MM/yyyy"
                    )}
                  </Typography>
                </Box>

                {lesson.addedAt && (
                  <Box
                    sx={{
                      fontSize: {
                        xs: "0.7rem",
                        sm: "0.75rem",
                      },
                      color: "#94a3b8",
                      fontStyle: "italic",
                    }}
                  >
                    <Typography
                      component="span"
                      sx={{
                        fontFamily: POPPINS_FONT,
                      }}
                    >
                      Added:{" "}
                      {format(
                        new Date(lesson.addedAt),
                        isMobile ? "dd/MM/yy" : "dd/MM/yyyy HH:mm"
                      )}
                    </Typography>
                  </Box>
                )}
              </Box>

              {lesson.remarks && (
                <Box
                  sx={{
                    mt: {
                      xs: 1,
                      sm: 1.5,
                    },
                    pt: {
                      xs: 1,
                      sm: 1.5,
                    },
                    borderTop: "1px solid #e2e8f0",
                  }}
                >
                  <Typography
                    component="span"
                    sx={{
                      fontFamily: POPPINS_FONT,
                      fontWeight: 600,
                      color: "#374151",
                      fontSize: {
                        xs: "0.75rem",
                        sm: "0.8rem",
                      },
                      display: "block",
                      mb: 0.5,
                    }}
                  >
                    Remarks:
                  </Typography>
                  <Typography
                    component="span"
                    sx={{
                      fontFamily: POPPINS_FONT,
                      color: "#475569",
                      fontSize: {
                        xs: "0.75rem",
                        sm: "0.8rem",
                      },
                      wordBreak: "break-word",
                    }}
                  >
                    {lesson.remarks}
                  </Typography>
                </Box>
              )}
            </Box>
          ))}

          {filteredLessons.length === 0 && (
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                minHeight: {
                  xs: "150px",
                  sm: "200px",
                },
                color: "#64748b",
                textAlign: "center",
                p: {
                  xs: 2,
                  sm: 3,
                },
              }}
            >
              <Typography
                sx={{
                  fontFamily: POPPINS_FONT,
                  fontSize: {
                    xs: "1rem",
                    sm: "1.1rem",
                  },
                  fontWeight: 500,
                  mb: 1,
                }}
              >
                📚 No Lessons Found
              </Typography>
              <Typography
                sx={{
                  fontFamily: POPPINS_FONT,
                  fontSize: {
                    xs: "0.8rem",
                    sm: "0.875rem",
                  },
                  color: "#94a3b8",
                }}
              >
                {dateRange[0] && dateRange[1]
                  ? "No lessons found for the selected date range"
                  : "No lessons have been added yet"}
              </Typography>
            </Box>
          )}
        </Box>
      </Box>
    </Modal>
  );
};

export default ViewLessonsModal;
