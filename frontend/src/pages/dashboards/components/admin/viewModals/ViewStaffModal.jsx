import { Box, Button, Typography, TextField, Chip } from "@mui/material";
import { format } from "date-fns";
import {
  FaUser,
  FaEnvelope,
  FaPhone,
  FaCalendarAlt,
  FaClock,
  FaMoneyBillWave,
  FaUserTie,
  FaIdCard,
  FaPray,
  FaGraduationCap,
  FaBook,
  FaBriefcase,
  FaHistory,
} from "react-icons/fa";

const POPPINS_FONT =
  "'Poppins', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";

const ViewStaffModal = ({
  staff,
  staffType,
  setShowModal,
  modalStyle,
  adminPassword,
  setAdminPassword,
  passwordError,
  isInfoVisible,
  handleAdminPasswordSubmit,
}) => {
  // Responsive breakpoints
  const isMobile = window.innerWidth < 768;
  const isTablet = window.innerWidth >= 768 && window.innerWidth < 1024;

  // Responsive styles
  const typographyStyles = {
    fontFamily: POPPINS_FONT,
  };

  const sectionHeaderStyles = {
    ...typographyStyles,
    fontWeight: 600,
    mb: { xs: 1.5, sm: 2 },
    fontSize: { xs: "1rem", sm: "1.125rem" },
  };

  const sectionCardStyles = {
    p: { xs: 2, sm: 3 },
    border: "1px solid #e2e8f0",
    borderRadius: "8px",
    bgcolor: "#f8fafc",
    mb: { xs: 2, sm: 4 },
  };

  const textStyles = {
    ...typographyStyles,
    color: "#64748b",
  };

  const InfoRow = ({ label, value, icon: Icon }) => (
    <Box
      sx={{
        display: "flex",
        alignItems: "flex-start",
        gap: { xs: 1, sm: 1.5 },
        mb: { xs: 1.5, sm: 2 },
        flexDirection: { xs: "column", sm: "row" },
      }}
    >
      {Icon && (
        <Icon
          size={isMobile ? 14 : 16}
          style={{
            color: "#64748b",
            marginTop: isMobile ? "0px" : "4px",
            flexShrink: 0,
          }}
        />
      )}
      <Box sx={{ width: "100%" }}>
        <Typography
          variant="body2"
          sx={{
            ...textStyles,
            mb: 0.5,
            fontSize: { xs: "0.75rem", sm: "0.875rem" },
          }}
        >
          {label}
        </Typography>
        <Typography
          sx={{
            ...typographyStyles,
            fontSize: { xs: "0.875rem", sm: "1rem" },
            wordBreak: "break-word",
          }}
        >
          {value || "Not provided"}
        </Typography>
      </Box>
    </Box>
  );

  const InfoGrid = ({ label1, value1, icon1, label2, value2, icon2 }) => (
    <Box
      sx={{
        display: "flex",
        justifyContent: "space-between",
        mb: { xs: 1.5, sm: 2 },
        flexDirection: { xs: "column", sm: "row" },
        gap: { xs: 1, sm: 2 },
      }}
    >
      <Box sx={{ width: { xs: "100%", sm: "48%" } }}>
        <InfoRow label={label1} value={value1} icon={icon1} />
      </Box>
      {label2 && (
        <Box sx={{ width: { xs: "100%", sm: "48%" } }}>
          <InfoRow label={label2} value={value2} icon={icon2} />
        </Box>
      )}
    </Box>
  );

  // Responsive modal styles
  const modalBaseStyles = {
    ...modalStyle,
    maxHeight: { xs: "95vh", sm: "90vh" },
    display: "flex",
    flexDirection: "column",
    width: {
      xs: "95vw",
      sm: "85vw",
      md: "700px",
      lg: "800px",
    },
    maxWidth: {
      xs: "400px",
      sm: "600px",
      md: "700px",
      lg: "800px",
    },
    fontFamily: POPPINS_FONT,
    p: { xs: 2, sm: 3, md: 4 },
    borderRadius: { xs: "8px", sm: "12px" },
  };

  const scrollableContentStyles = {
    overflowY: "auto",
    flex: 1,
    pr: { xs: 1, sm: 2 },
    mt: { xs: 2, sm: 3 },
    "&::-webkit-scrollbar": {
      width: { xs: "4px", sm: "6px" },
    },
    "&::-webkit-scrollbar-track": {
      background: "#f1f5f9",
    },
    "&::-webkit-scrollbar-thumb": {
      background: "#cbd5e1",
      borderRadius: "3px",
    },
  };

  const getRoleText = () => {
    if (staffType === "teacher") {
      return staff.role === "teacher_quran"
        ? "Quran Teacher"
        : "Subjects Teacher";
    }
    return staff.role === "supervisor_quran"
      ? "Quran Supervisor"
      : "Subjects Supervisor";
  };

  const formatDateTime = (date) => {
    return format(new Date(date), "dd/MM/yyyy HH:mm");
  };

  const formatDate = (date) => {
    return format(new Date(date), "dd/MM/yyyy");
  };

  return (
    <Box sx={modalBaseStyles}>
      {/* Header */}
      <Box
        sx={{
          borderBottom: "1px solid #e2e8f0",
          pb: { xs: 1.5, sm: 2 },
          display: "flex",
          justifyContent: "space-between",
          alignItems: { xs: "flex-start", sm: "center" },
          flexDirection: { xs: "column", sm: "row" },
          gap: { xs: 1, sm: 0 },
        }}
      >
        <Box sx={{ width: { xs: "100%", sm: "auto" } }}>
          <Typography
            variant="h5"
            sx={{
              ...typographyStyles,
              fontWeight: 600,
              fontSize: { xs: "1.25rem", sm: "1.5rem" },
            }}
          >
            {staff.name}
          </Typography>
          <Typography
            variant="subtitle2"
            sx={{
              ...typographyStyles,
              fontWeight: 600,
              color: "#64748b",
              fontSize: { xs: "0.8rem", sm: "0.875rem" },
            }}
          >
            Staff ID: {staff.staffId}
          </Typography>
        </Box>
        <Button
          onClick={() => {
            setShowModal(false);
            setAdminPassword("");
          }}
          sx={{
            minWidth: { xs: "28px", sm: "32px" },
            height: { xs: "28px", sm: "32px" },
            p: 0,
            borderRadius: "50%",
            color: "#64748b",
            fontSize: { xs: "18px", sm: "20px" },
            alignSelf: { xs: "flex-end", sm: "center" },
            "&:hover": {
              bgcolor: "#f1f5f9",
            },
          }}
        >
          ×
        </Button>
      </Box>

      {/* Profile Picture Section */}
      <Typography variant="subtitle1" sx={sectionHeaderStyles}>
        Profile Picture
      </Typography>
      <Box sx={sectionCardStyles}>
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            py: { xs: 1.5, sm: 2 },
          }}
        >
          {staff.profilePicture ? (
            <Box
              sx={{
                width: { xs: 100, sm: 120, md: 150 },
                height: { xs: 100, sm: 120, md: 150 },
                borderRadius: "50%",
                overflow: "hidden",
                border: "3px solid #e2e8f0",
                boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                mb: { xs: 1.5, sm: 2 },
                bgcolor: "#f8fafc",
              }}
            >
              <img
                src={staff.profilePicture}
                alt={staff.name}
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                }}
              />
            </Box>
          ) : (
            <Box
              sx={{
                width: { xs: 100, sm: 120, md: 150 },
                height: { xs: 100, sm: 120, md: 150 },
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: "#f8fafc",
                border: "3px solid #e2e8f0",
                mb: { xs: 1.5, sm: 2 },
              }}
            >
              <FaUser
                size={isMobile ? 35 : isTablet ? 40 : 50}
                style={{
                  color: "#94a3b8",
                }}
              />
            </Box>
          )}
          <Typography
            variant="body2"
            sx={{
              color: "#64748b",
              fontSize: { xs: "0.8rem", sm: "0.875rem" },
              textAlign: "center",
            }}
          >
            {!staff.profilePicture && "No Profile Picture Available"}
          </Typography>
        </Box>
      </Box>

      <Box sx={scrollableContentStyles}>
        {/* Basic Information */}
        <Typography variant="subtitle1" sx={sectionHeaderStyles}>
          Basic Information
        </Typography>
        <Box sx={sectionCardStyles}>
          {isInfoVisible ? (
            <>
              <InfoGrid
                label1="Email"
                value1={staff.email}
                icon1={FaEnvelope}
                label2="Phone Number"
                value2={staff.phoneNumber}
                icon2={FaPhone}
              />
              <InfoRow
                label="CNIC Number"
                value={staff.profile?.cnicNumber}
                icon={FaIdCard}
              />
            </>
          ) : (
            <Box sx={{ mt: 2, mb: 2, bgcolor: "#fff", p: { xs: 1.5, sm: 2 } }}>
              <Typography
                variant="subtitle2"
                sx={{
                  mb: 2,
                  fontWeight: "bold",
                  fontSize: { xs: "0.875rem", sm: "1rem" },
                }}
              >
                Enter Admin Password to View Sensitive Information
              </Typography>
              <TextField
                fullWidth
                type="password"
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                error={!!passwordError}
                helperText={passwordError}
                placeholder="Enter password"
                size="small"
                sx={{
                  mb: 2,
                  "& .MuiOutlinedInput-root": {
                    bgcolor: "#fff",
                  },
                  "& .MuiInputBase-input": {
                    fontSize: { xs: "0.875rem", sm: "1rem" },
                  },
                }}
              />
              <Button
                fullWidth
                variant="contained"
                onClick={handleAdminPasswordSubmit}
                sx={{
                  bgcolor: "#1f3d61",
                  minHeight: { xs: "44px", sm: "auto" },
                  fontSize: { xs: "0.875rem", sm: "1rem" },
                  "&:hover": {
                    bgcolor: "#1f3d70",
                  },
                }}
              >
                View Sensitive Information
              </Button>
            </Box>
          )}

          <InfoGrid
            label1="Gender"
            value1={staff.gender}
            icon1={FaUser}
            label2="Role"
            value2={getRoleText()}
            icon2={FaUserTie}
          />
        </Box>

        {/* Personal Information */}
        <Typography variant="subtitle1" sx={sectionHeaderStyles}>
          Personal Information
        </Typography>
        <Box sx={sectionCardStyles}>
          <InfoGrid
            label1="Father's Name"
            value1={staff.profile?.fatherName}
            icon1={FaUser}
            label2="Date of Birth"
            value2={
              staff.profile?.dateOfBirth
                ? formatDate(staff.profile.dateOfBirth)
                : "Not provided"
            }
            icon2={FaCalendarAlt}
          />
          <InfoRow
            label="Religion"
            value={staff.profile?.religion}
            icon={FaPray}
          />
        </Box>

        {/* Professional Information - Teacher Specific */}
        {staffType === "teacher" && (
          <>
            <Typography variant="subtitle1" sx={sectionHeaderStyles}>
              Professional Information
            </Typography>
            <Box sx={sectionCardStyles}>
              <InfoGrid
                label1="Qualification"
                value1={staff.profile?.qualification}
                icon1={FaGraduationCap}
                label2="Department"
                value2={staff.profile?.department}
                icon2={FaBriefcase}
              />

              {staff.profile?.expertise?.length > 0 && (
                <>
                  <Typography
                    variant="subtitle2"
                    sx={{
                      ...sectionHeaderStyles,
                      mb: { xs: 1, sm: 1.5 },
                      fontSize: { xs: "0.875rem", sm: "1rem" },
                    }}
                  >
                    Expertise
                  </Typography>
                  <Box
                    sx={{
                      display: "flex",
                      flexWrap: "wrap",
                      gap: { xs: 0.5, sm: 1 },
                      mb: { xs: 1.5, sm: 2 },
                    }}
                  >
                    {staff.profile.expertise.map((exp, index) => (
                      <Chip
                        key={index}
                        label={exp}
                        size="small"
                        sx={{
                          bgcolor: "#f1f5f9",
                          color: "#64748b",
                          fontSize: { xs: "0.7rem", sm: "0.75rem" },
                          height: { xs: "24px", sm: "28px" },
                        }}
                      />
                    ))}
                  </Box>
                </>
              )}

              {staff.profile?.subjects?.length > 0 && (
                <>
                  <Typography
                    variant="subtitle2"
                    sx={{
                      ...sectionHeaderStyles,
                      mb: { xs: 1, sm: 1.5 },
                      fontSize: { xs: "0.875rem", sm: "1rem" },
                    }}
                  >
                    Subjects
                  </Typography>
                  <Box
                    sx={{
                      display: "flex",
                      flexWrap: "wrap",
                      gap: { xs: 0.5, sm: 1 },
                      mb: { xs: 1.5, sm: 2 },
                    }}
                  >
                    {staff.profile.subjects.map((subject) => (
                      <Chip
                        key={subject._id}
                        label={subject.name}
                        size="small"
                        sx={{
                          bgcolor: "#f1f5f9",
                          color: "#64748b",
                          fontSize: { xs: "0.7rem", sm: "0.75rem" },
                          height: { xs: "24px", sm: "28px" },
                        }}
                      />
                    ))}
                  </Box>
                </>
              )}
            </Box>
          </>
        )}

        {/* Schedule Information */}
        {(staffType === "teacher" || staffType === "supervisor") && (
          <>
            <Typography variant="subtitle1" sx={sectionHeaderStyles}>
              Schedule Information
            </Typography>
            <Box sx={sectionCardStyles}>
              {staff.profile?.availability?.days?.length > 0 && (
                <>
                  <Typography
                    variant="subtitle2"
                    sx={{
                      ...sectionHeaderStyles,
                      mb: { xs: 1, sm: 1.5 },
                      fontSize: { xs: "0.875rem", sm: "1rem" },
                    }}
                  >
                    Available Days
                  </Typography>
                  <Box
                    sx={{
                      display: "flex",
                      flexWrap: "wrap",
                      gap: { xs: 0.5, sm: 1 },
                      mb: { xs: 1.5, sm: 2 },
                    }}
                  >
                    {staff.profile.availability.days.map((day) => (
                      <Chip
                        key={day}
                        label={day}
                        size="small"
                        sx={{
                          bgcolor: "#f1f5f9",
                          color: "#64748b",
                          fontSize: { xs: "0.7rem", sm: "0.75rem" },
                          height: { xs: "24px", sm: "28px" },
                        }}
                      />
                    ))}
                  </Box>
                </>
              )}
              <InfoGrid
                label1="Start Time"
                value1={staff.profile?.availability?.startTime || "Not set"}
                icon1={FaClock}
                label2="End Time"
                value2={staff.profile?.availability?.endTime || "Not set"}
                icon2={FaClock}
              />
            </Box>
          </>
        )}

        {/* Employment Information */}
        <Typography variant="subtitle1" sx={sectionHeaderStyles}>
          Employment Information
        </Typography>
        <Box sx={sectionCardStyles}>
          <InfoGrid
            label1="Department"
            value1={staff.profile?.department}
            icon1={FaBriefcase}
            label2="Shift"
            value2={staff.profile?.shift}
            icon2={FaClock}
          />
          <InfoGrid
            label1="Manager"
            value1={`${staff.profile?.managerName} (${
              staff.profile?.manager?.role === "admin"
                ? "Admin"
                : staff.profile?.manager?.role === "supervisor_quran"
                ? "Quran Supervisor"
                : "Subjects Supervisor"
            })`}
            icon1={FaUserTie}
            label2="Salary"
            value2={`PKR ${staff.profile?.salary}`}
            icon2={FaMoneyBillWave}
          />
          <InfoRow
            label="Status"
            value={
              <span
                className={`status-tag ${
                  staff.isActive ? "active" : "inactive"
                }`}
                style={{
                  fontSize: isMobile ? "0.8rem" : "0.875rem",
                  padding: isMobile ? "2px 6px" : "4px 8px",
                }}
              >
                {staff.isActive ? "Active" : "Inactive"}
              </span>
            }
            icon={FaUser}
          />
        </Box>

        {/* System Information */}
        <Typography variant="subtitle1" sx={sectionHeaderStyles}>
          System Information
        </Typography>
        <Box sx={sectionCardStyles}>
          <InfoGrid
            label1="Created At"
            value1={formatDateTime(staff.createdAt)}
            icon1={FaHistory}
            label2="Last Updated"
            value2={formatDateTime(staff.updatedAt)}
            icon2={FaHistory}
          />
        </Box>

        {/* Salary History */}
        {staff.profile?.salaryHistory?.length > 0 && (
          <>
            <Typography variant="subtitle1" sx={sectionHeaderStyles}>
              Salary History
            </Typography>
            <Box sx={sectionCardStyles}>
              {staff.profile.salaryHistory.map((history, index) => (
                <Box
                  key={index}
                  sx={{
                    p: { xs: 2, sm: 3 },
                    border: "1px solid #e2e8f0",
                    borderRadius: "8px",
                    mb: { xs: 1.5, sm: 2 },
                  }}
                >
                  <InfoGrid
                    label1="Month"
                    value1={history.month}
                    icon1={FaCalendarAlt}
                    label2="Amount"
                    value2={`PKR ${history.amount}`}
                    icon2={FaMoneyBillWave}
                  />
                  {history.bonusAmount > 0 && (
                    <InfoRow
                      label="Bonus Amount"
                      value={`PKR ${history.bonusAmount}`}
                      icon={FaMoneyBillWave}
                    />
                  )}
                  {history.deduction > 0 && (
                    <InfoRow
                      label="Deduction"
                      value={`PKR ${history.deduction}`}
                      icon={FaMoneyBillWave}
                    />
                  )}
                  {history.remarks && (
                    <InfoRow
                      label="Remarks"
                      value={history.remarks}
                      icon={FaBook}
                    />
                  )}
                </Box>
              ))}
            </Box>
          </>
        )}
      </Box>
    </Box>
  );
};

export default ViewStaffModal;
