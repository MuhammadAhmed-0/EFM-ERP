import { useState, useEffect } from "react";
import {
  FaEdit,
  FaEye,
  FaSearch,
  FaPlus,
  FaFilter,
  FaTrash,
} from "react-icons/fa";
import {
  Modal,
  Box,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Button,
  Typography,
  CircularProgress,
  IconButton,
  Autocomplete,
} from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import ReactDatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { format } from "date-fns";
import axios from "axios";
import { getModalStyles } from "../../../../styles/modal/commonModalStyles";
import ViewStudentModal from "./viewModals/ViewStudentModal";
import { useInfoModal } from "../../../../hooks/useInfoModal";
const STATUS_OPTIONS = ["trial", "regular", "drop", "freeze", "completed"];
const GENDERS = ["male", "female"];
import "../../../../styles/components/Management.css";
import useNotification from "../../../../hooks/useNotification";
import NotificationSnackbar from "../../../../components/common/NotificationSnackbar";
import SyncButton from "../../../../components/common/SyncButton";

const ModalContent = ({
  formData,
  handleChange,
  handleSubmit,
  handleAddSubmit,
  handleEditSubmit,
  setShowModal,
  currentStudent,
  errors,
  isLoading,
  handleDateChange,
  handleFreezeStartDateChange,
  handleFreezeEndDateChange,
  freezeStartDate,
  freezeEndDate,
  subjects,
  teachers,
  handleAddSubjectTeacher,
  handleRemoveSubjectTeacher,
  subjectTeacherPairs,
  clients,
}) => {
  const getFilteredTeachers = (subjectId) => {
    const activeTeachers = teachers.filter(
      (teacher) => teacher.isActive === true
    );

    if (!subjectId) {
      return activeTeachers;
    }

    const selectedSubject = subjects.find(
      (subject) => subject._id === subjectId
    );
    if (!selectedSubject) {
      return activeTeachers;
    }
    return activeTeachers.filter((teacher) => {
      const matchesType =
        selectedSubject.type === "quran"
          ? teacher.role === "teacher_quran"
          : teacher.role === "teacher_subjects";
      if (!matchesType) return false;
      return teacher.profile?.subjects?.some(
        (teacherSubject) =>
          teacherSubject._id === subjectId || teacherSubject === subjectId
      );
    });
  };

  const getTeacherDisplayName = (teacher, subjectId) => {
    let displayName;
    if (!subjectId) {
      displayName = `${teacher.staffId} - ${teacher.name}`;
    } else {
      const selectedSubject = subjects.find(
        (subject) => subject._id === subjectId
      );
      const subjectName = selectedSubject ? ` (${selectedSubject.name})` : "";
      displayName = `${teacher.staffId} - ${teacher.name}${subjectName}`;
    }

    return `${displayName}`;
  };

  return (
    <Box sx={getModalStyles()}>
      <Box sx={{ display: "flex", justifyContent: "space-between", mb: 3 }}>
        <Typography variant="h6">
          {currentStudent ? "Edit Student" : "Add New Student"}
        </Typography>
        <Button onClick={() => !isLoading && setShowModal(false)}>×</Button>
      </Box>

      <form onSubmit={currentStudent ? handleEditSubmit : handleAddSubmit}>
        <TextField
          fullWidth
          label="Name"
          name="name"
          value={formData.name}
          onChange={handleChange}
          required
          margin="normal"
          size="small"
          error={!!errors.name}
          helperText={errors.name}
        />

        <FormControl fullWidth margin="normal" size="small" required>
          <Autocomplete
            id="client-autocomplete"
            options={clients}
            getOptionLabel={(option) => `${option.clientId} - ${option.name}`}
            value={
              clients.find((client) => client._id === formData.clientId) || null
            }
            onChange={(event, newValue) => {
              handleChange({
                target: {
                  name: "clientId",
                  value: newValue ? newValue._id : "",
                },
              });
            }}
            renderInput={(params) => (
              <TextField {...params} label="Client" size="small" required />
            )}
          />
        </FormControl>

        <FormControl fullWidth margin="normal" size="small">
          <InputLabel>Status</InputLabel>
          <Select
            name="status"
            value={formData.status || "trial"}
            label="Status"
            onChange={handleChange}
          >
            {STATUS_OPTIONS.map((status) => (
              <MenuItem key={status} value={status}>
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </MenuItem>
            ))}
          </Select>

          {formData.status === "freeze" && (
            <>
              <Typography variant="caption" sx={{ mt: 0.5, color: "#a855f7" }}>
                {currentStudent && currentStudent.profile.status === "freeze"
                  ? "Student is already in freeze status."
                  : "Setting status to freeze will start tracking the freeze period. The freeze will remain active until changed to another status."}
              </Typography>

              <Box
                sx={{
                  mt: 2,
                  border: "1px solid #e2e8f0",
                  borderRadius: "8px",
                  p: 2,
                  bgcolor: "#f8fafc",
                }}
              >
                <Typography
                  variant="subtitle2"
                  sx={{ mb: 1, color: "#a855f7", fontWeight: 600 }}
                >
                  Freeze Period
                </Typography>

                <LocalizationProvider dateAdapter={AdapterDateFns}>
                  <Box sx={{ mb: 2 }}>
                    <DatePicker
                      label="Freeze Start Date"
                      value={freezeStartDate}
                      onChange={handleFreezeStartDateChange}
                      slotProps={{
                        textField: {
                          fullWidth: true,
                          size: "small",
                          margin: "dense",
                          error: !!errors.freezeStartDate,
                          helperText: errors.freezeStartDate,
                        },
                      }}
                    />
                  </Box>

                  <Box>
                    <DatePicker
                      label="Freeze End Date (Optional)"
                      value={freezeEndDate}
                      onChange={handleFreezeEndDateChange}
                      minDate={freezeStartDate}
                      slotProps={{
                        textField: {
                          fullWidth: true,
                          size: "small",
                          margin: "dense",
                          error: !!errors.freezeEndDate,
                          helperText:
                            errors.freezeEndDate ||
                            "Leave empty for indefinite freeze",
                        },
                      }}
                    />
                  </Box>
                </LocalizationProvider>

                <Typography
                  variant="caption"
                  sx={{ display: "block", mt: 1, color: "#64748b" }}
                >
                  {freezeEndDate
                    ? "The freeze will automatically end on the specified date."
                    : "If no end date is set, the freeze will be active until changed to another status."}
                </Typography>
              </Box>
            </>
          )}

          {currentStudent &&
            currentStudent.profile.status === "freeze" &&
            formData.status !== "freeze" && (
              <Typography variant="caption" sx={{ mt: 0.5, color: "#10b981" }}>
                Changing from freeze to {formData.status} will end the current
                freeze period and record the end date.
              </Typography>
            )}
        </FormControl>

        <FormControl fullWidth margin="normal" size="small">
          <InputLabel>Gender</InputLabel>
          <Select
            name="gender"
            value={formData.gender}
            label="Gender"
            onChange={handleChange}
            required
          >
            {GENDERS.map((gender) => (
              <MenuItem key={gender} value={gender}>
                {gender.charAt(0).toUpperCase() + gender.slice(1)}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <TextField
          fullWidth
          label="Grade"
          name="grade"
          value={formData.grade}
          onChange={handleChange}
          required
          margin="normal"
          size="small"
          error={!!errors.grade}
          helperText={errors.grade}
        />

        <LocalizationProvider dateAdapter={AdapterDateFns}>
          <DatePicker
            label="Date of Birth"
            value={formData.dateOfBirth ? new Date(formData.dateOfBirth) : null}
            onChange={(date) => handleDateChange(date, "dateOfBirth")}
            slotProps={{
              textField: {
                fullWidth: true,
                margin: "normal",
                size: "small",
                required: true,
              },
            }}
          />
        </LocalizationProvider>

        <Typography variant="subtitle1" sx={{ mt: 2, mb: 1 }}>
          Subjects and Teachers
        </Typography>

        {subjectTeacherPairs.map((pair, index) => (
          <Box
            key={index}
            sx={{ display: "flex", gap: 1, mb: 2, alignItems: "flex-start" }}
          >
            <FormControl sx={{ flex: 1 }} size="small">
              <Autocomplete
                id={`subject-autocomplete-${index}`}
                options={subjects}
                getOptionLabel={(option) => option.name || ""}
                value={
                  subjects.find((subject) => subject._id === pair.subjectId) ||
                  null
                }
                onChange={(event, newValue) => {
                  handleChange(
                    {
                      target: {
                        name: "subjectId",
                        value: newValue ? newValue._id : "",
                      },
                    },
                    index
                  );
                }}
                renderInput={(params) => (
                  <TextField {...params} label="Subject" size="small" />
                )}
              />
            </FormControl>
            <FormControl sx={{ flex: 1 }} size="small">
              <Autocomplete
                id={`teacher-autocomplete-${index}`}
                options={getFilteredTeachers(pair.subjectId)}
                getOptionLabel={(option) =>
                  getTeacherDisplayName(option, pair.subjectId)
                }
                value={
                  getFilteredTeachers(pair.subjectId).find(
                    (teacher) => teacher._id === pair.teacherId
                  ) || null
                }
                onChange={(event, newValue) => {
                  handleChange(
                    {
                      target: {
                        name: "teacherId",
                        value: newValue ? newValue._id : "",
                      },
                    },
                    index
                  );
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Active Teachers Only"
                    size="small"
                  />
                )}
                renderOption={(props, option) => {
                  const { key, ...restProps } = props;
                  return (
                    <li key={key} {...restProps}>
                      {getTeacherDisplayName(option, pair.subjectId)}
                      {/* Optional: Show active status indicator */}
                      <span
                        style={{
                          marginLeft: "8px",
                          color: "#22c55e",
                          fontSize: "0.75rem",
                          fontWeight: "500",
                        }}
                      >
                        ✓ Active
                      </span>
                    </li>
                  );
                }}
                disabled={!pair.subjectId}
                noOptionsText={
                  !pair.subjectId
                    ? "Please select a subject first"
                    : "No active teachers found for this subject"
                }
              />
            </FormControl>
            <IconButton onClick={() => handleRemoveSubjectTeacher(index)}>
              <FaTrash />
            </IconButton>
          </Box>
        ))}
        <button className="glass-add-btn" onClick={handleAddSubjectTeacher}>
          Add Subject & Teacher
        </button>
        <Box
          sx={{
            mt: 4,
            pt: 2,
            display: "flex",
            justifyContent: "flex-end",
            gap: 2,
          }}
        >
          <button
            className="clear-filters-btn"
            onClick={() => setShowModal(false)}
            disabled={isLoading}
          >
            Cancel
          </button>
          <button className="add-btn" type="submit" disabled={isLoading}>
            {isLoading ? (
              <div className="loading-spinner"></div>
            ) : currentStudent ? (
              "Update Student"
            ) : (
              "Add Student"
            )}
          </button>
        </Box>
      </form>
    </Box>
  );
};

const StudentsManagement = () => {
  const {
    adminPassword,
    passwordError,
    isInfoVisible,
    setAdminPassword,
    handleAdminPasswordSubmit,
  } = useInfoModal();
  const [students, setStudents] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [currentStudent, setCurrentStudent] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [errors, setErrors] = useState({});
  const [subjects, setSubjects] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [clients, setClients] = useState([]);
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [dateRange, setDateRange] = useState([null, null]);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedClient, setSelectedClient] = useState("all");
  const [freezeStartDate, setFreezeStartDate] = useState(new Date());
  const [freezeEndDate, setFreezeEndDate] = useState(null);
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [totalSubjects, setTotalSubjects] = useState(0);
  const [selectedSubjectType, setSelectedSubjectType] = useState("all");
  const [selectedStudentActiveStatus, setSelectedStudentActiveStatus] =
    useState("all");
  const { notification, showNotification, closeNotification } =
    useNotification();

  const [formData, setFormData] = useState({
    name: "",
    gender: "male",
    grade: "",
    dateOfBirth: null,
    clientId: "",
    status: "trial",
  });
  const BASE_URL = import.meta.env.VITE_BASE_URL;
  const SUBJECT_TYPE_OPTIONS = ["quran", "subjects"];

  const [subjectTeacherPairs, setSubjectTeacherPairs] = useState([
    { subjectId: "", teacherId: "" },
  ]);

  useEffect(() => {
    if (clients.length > 0) {
      fetchStudents();
    }
  }, [clients]);
  const getActiveSubjectCount = (student) => {
    if (
      student.profile?.activeSubjectStats?.totalActiveSubjects !== undefined
    ) {
      return student.profile.activeSubjectStats.totalActiveSubjects;
    }

    if (
      student.profile?.subjectStatus &&
      student.profile.subjectStatus.length > 0
    ) {
      return student.profile.subjectStatus.filter(
        (status) => status.isActive === true
      ).length;
    }

    return student.profile?.assignedTeachers?.length || 0;
  };

  const getActiveSubjectDetails = (student) => {
    if (student.profile?.activeSubjectStats?.activeSubjectDetails) {
      return student.profile.activeSubjectStats.activeSubjectDetails;
    }

    if (
      student.profile?.subjectStatus &&
      student.profile.subjectStatus.length > 0
    ) {
      return student.profile.subjectStatus
        .filter((status) => status.isActive === true)
        .map((status) => ({
          subjectId: status.subject._id,
          subjectName: status.subject.name,
          subjectType: status.subject.type,
          activatedAt: status.currentStatus?.lastActivatedAt,
        }));
    }

    return (
      student.profile?.assignedTeachers?.map((teacher) => ({
        subjectId: teacher.subject._id._id,
        subjectName: teacher.subject.name,
        subjectType: teacher.subject._id.type,
        activatedAt: teacher.assignedAt,
      })) || []
    );
  };

  const fetchStudents = async (showSuccessMessage = false) => {
    setIsSyncing(true);
    setIsLoading(true);
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(`${BASE_URL}/api/admin/users/student`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const studentsWithClientId = (response.data.users || []).map(
        (student) => {
          const clientUserId =
            student.profile.client?._id || student.profile.client;
          const matchingClient = clients.find((c) => c._id === clientUserId);

          return {
            ...student,
            profile: {
              ...student.profile,
              clientId:
                student.profile.clientId ||
                (matchingClient ? matchingClient.clientId : "No ID"),
            },
          };
        }
      );
      console.log(studentsWithClientId);
      if (showSuccessMessage) {
        showNotification("Students refreshed successfully");
      }

      setStudents(studentsWithClientId);
    } catch (error) {
      showNotification(
        error.response?.data?.message || "Error fetching students",
        "error"
      );
    } finally {
      setIsSyncing(false);
      setIsLoading(false);
    }
  };

  const fetchClients = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(
        `${BASE_URL}/api/admin/clients-with-students`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      const clientsList = response.data.clients.map((client) => ({
        _id: client.user._id,
        name: client.user.name,
        email: client.user.email,
        profile: client.user.profile,
        clientId: client.clientId,
      }));
      setClients(clientsList);
    } catch (error) {
      console.error("Error fetching clients:", error);
      showNotification("Error fetching clients", "error");
    }
  };
  const fetchSubjects = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(`${BASE_URL}/api/subjects/view`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (Array.isArray(response.data)) {
        setSubjects(response.data);
      } else if (response.data && Array.isArray(response.data.subjects)) {
        setSubjects(response.data.subjects);
      } else {
        const subjectsArray = response.data ? Object.values(response.data) : [];
        setSubjects(subjectsArray);
      }
    } catch (error) {
      console.error("Error fetching subjects:", error);
      showNotification("Error fetching subjects", "error");
      setSubjects([]);
    }
  };
  const fetchTeachers = async () => {
    try {
      const token = localStorage.getItem("token");
      const [quranTeachersResponse, subjectTeachersResponse] =
        await Promise.all([
          axios.get(`${BASE_URL}/api/admin/users/teacher_quran`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }),
          axios.get(`${BASE_URL}/api/admin/users/teacher_subjects`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }),
        ]);

      const quranTeachers = quranTeachersResponse.data.users || [];
      const subjectTeachers = subjectTeachersResponse.data.users || [];
      const allTeachers = [...quranTeachers, ...subjectTeachers];

      const activeTeachers = allTeachers.filter(
        (teacher) => teacher.isActive === true
      );

      setTeachers(activeTeachers);
    } catch (error) {
      console.error("Error fetching teachers:", error);
      showNotification("Error fetching active teachers", "error");
    }
  };

  useEffect(() => {
    const calculateTotalSubjects = () => {
      const subjectCount = filteredStudents.reduce((total, student) => {
        const activeSubjectCount = getActiveSubjectCount(student);
        return total + activeSubjectCount;
      }, 0);

      setTotalSubjects(subjectCount);
    };

    calculateTotalSubjects();
  }, [filteredStudents]);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    }
    // fetchStudents();
    fetchSubjects();
    fetchTeachers();
    fetchClients();
  }, []);

  const handleChange = (e, index) => {
    const { name, value } = e.target;
    if (name === "teacherId" && value) {
      const selectedTeacher = teachers.find((t) => t._id === value);
      if (selectedTeacher && selectedTeacher.isActive === false) {
        showNotification(
          "This teacher is currently inactive and cannot be assigned to students.",
          "error"
        );
        return;
      }
    }
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
    if (index !== undefined) {
      const updatedPairs = [...subjectTeacherPairs];

      if (name === "subjectId") {
        updatedPairs[index] = {
          ...updatedPairs[index],
          subjectId: value,
          teacherId: "",
        };
      } else if (name === "teacherId") {
        updatedPairs[index] = {
          ...updatedPairs[index],
          teacherId: value,
        };
      }

      setSubjectTeacherPairs(updatedPairs);
    }
  };

  const handleDateChange = (date, field) => {
    setFormData((prev) => ({
      ...prev,
      [field]: date,
    }));
  };

  const handleFreezeStartDateChange = (date) => {
    setFreezeStartDate(date);
    setFormData((prev) => ({
      ...prev,
      freezeStartDate: date,
    }));
  };

  const handleFreezeEndDateChange = (date) => {
    setFreezeEndDate(date);
    setFormData((prev) => ({
      ...prev,
      freezeEndDate: date,
    }));
  };
  const handleAddSubjectTeacher = () => {
    setSubjectTeacherPairs([
      ...subjectTeacherPairs,
      { subjectId: "", teacherId: "" },
    ]);
  };

  const handleRemoveSubjectTeacher = (index) => {
    setSubjectTeacherPairs(subjectTeacherPairs.filter((_, i) => i !== index));
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = "Name is required";
    if (!formData.grade.trim()) newErrors.grade = "Grade is required";
    if (!formData.dateOfBirth)
      newErrors.dateOfBirth = "Date of birth is required";
    if (!formData.clientId) {
      newErrors.clientId = "Client is required";
    }
    const hasValidPairs = subjectTeacherPairs.every(
      (pair) => pair.subjectId && pair.teacherId
    );
    if (!hasValidPairs) {
      newErrors.subjectTeacher = "All subject-teacher pairs must be complete";
    }
    const hasInactiveTeacher = subjectTeacherPairs.some((pair) => {
      if (pair.teacherId) {
        const teacher = teachers.find((t) => t._id === pair.teacherId);
        return teacher && teacher.isActive === false;
      }
      return false;
    });

    if (hasInactiveTeacher) {
      newErrors.subjectTeacher = "Cannot assign inactive teachers to students";
    }

    if (formData.status === "freeze") {
      if (!formData.freezeStartDate) {
        newErrors.freezeStartDate = "Freeze start date is required";
      }

      if (formData.freezeEndDate && formData.freezeStartDate) {
        if (
          new Date(formData.freezeEndDate) < new Date(formData.freezeStartDate)
        ) {
          newErrors.freezeEndDate = "End date must be after start date";
        }
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  const handleAddSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      const token = localStorage.getItem("token");
      const currentDate = new Date();
      let currentUserId = "hammas-coding";
      try {
        const userStr = localStorage.getItem("user");
        if (userStr) {
          const userObj = JSON.parse(userStr);
          currentUserId = userObj._id || currentUserId;
        } else {
          currentUserId = localStorage.getItem("userId") || currentUserId;
        }
      } catch (e) {
        console.error("Error parsing user from localStorage:", e);
      }
      const statusDateHistory = {
        trial: [],
        regular: [],
        drop: [],
        freeze: [],
        completed: [],
      };
      if (formData.status === "freeze") {
        const isActiveFreeze = !formData.freezeEndDate;

        statusDateHistory.freeze.push({
          date: formData.freezeStartDate || currentDate,
          endDate: formData.freezeEndDate,
          addedBy: currentUserId,
          endedBy: formData.freezeEndDate ? currentUserId : null,
        });
        if (
          formData.freezeEndDate &&
          new Date(formData.freezeEndDate) > currentDate
        ) {
          const afterFreezeStatus = "regular";
          statusDateHistory[afterFreezeStatus].push({
            date: new Date(formData.freezeEndDate),
            addedBy: currentUserId,
            scheduledBy: currentUserId,
            scheduledAt: currentDate,
          });
        }
      } else {
        statusDateHistory[formData.status].push({
          date: currentDate,
          addedBy: currentUserId,
        });
      }
      const payload = {
        name: formData.name,
        gender: formData.gender,
        role: "student",
        grade: formData.grade,
        dateOfBirth: formData.dateOfBirth,
        clientId: formData.clientId,
        status: formData.status,
        subjects: subjectTeacherPairs.map((pair) => pair.subjectId),
        assignedTeachers: subjectTeacherPairs.map((pair) => pair.teacherId),
        statusDateHistory: statusDateHistory,
      };

      await axios.post(`${BASE_URL}/api/admin/users`, payload, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      showNotification("Student added successfully");
      fetchStudents();
      setShowModal(false);
    } catch (error) {
      showNotification(
        error.response?.data?.msg || "Error adding student",
        "error"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      const token = localStorage.getItem("token");
      const statusChanged = formData.status !== currentStudent.profile.status;
      const currentDate = new Date();
      let currentUserId = "hammas-coding";
      try {
        const userStr = localStorage.getItem("user");
        if (userStr) {
          const userObj = JSON.parse(userStr);
          currentUserId = userObj._id || currentUserId;
        } else {
          currentUserId = localStorage.getItem("userId") || currentUserId;
        }
      } catch (e) {
        console.error("Error parsing user from localStorage:", e);
      }

      const payload = {
        name: formData.name,
        gender: formData.gender,
        grade: formData.grade,
        dateOfBirth: formData.dateOfBirth,
        clientId: formData.clientId,
        status: formData.status,
        subjects: subjectTeacherPairs.map((pair) => pair.subjectId),
        assignedTeachers: subjectTeacherPairs.map((pair) => pair.teacherId),
      };

      if (formData.status === "freeze") {
        payload.freezeEndDate = formData.freezeEndDate;
      }

      let statusDateHistory = currentStudent.profile.statusDateHistory || {
        trial: [],
        regular: [],
        drop: [],
        freeze: [],
        completed: [],
      };
      if (
        formData.status === "freeze" &&
        currentStudent.profile.status === "freeze"
      ) {
        if (statusDateHistory.freeze && statusDateHistory.freeze.length > 0) {
          const activeFreeze = [...statusDateHistory.freeze]
            .filter((entry) => !entry.endDate)
            .sort((a, b) => new Date(b.date) - new Date(a.date))[0];

          if (activeFreeze) {
            const currentEndDate = activeFreeze.endDate
              ? new Date(activeFreeze.endDate)
              : null;
            const newEndDate = formData.freezeEndDate
              ? new Date(formData.freezeEndDate)
              : null;
            activeFreeze.endDate = formData.freezeEndDate;
            activeFreeze.endedBy = formData.freezeEndDate
              ? currentUserId
              : null;
            if (
              formData.freezeEndDate &&
              new Date(formData.freezeEndDate) > currentDate
            ) {
              const afterFreezeStatus = "regular";
              statusDateHistory[afterFreezeStatus] =
                statusDateHistory[afterFreezeStatus] || [];
              statusDateHistory[afterFreezeStatus] = statusDateHistory[
                afterFreezeStatus
              ].filter(
                (entry) =>
                  !entry.scheduledAt ||
                  new Date(entry.date).getTime() !==
                    new Date(formData.freezeEndDate).getTime()
              );
              statusDateHistory[afterFreezeStatus].push({
                date: new Date(formData.freezeEndDate),
                addedBy: currentUserId,
                scheduledBy: currentUserId,
                scheduledAt: currentDate,
              });
            }
          } else {
            statusDateHistory.freeze.push({
              date: formData.freezeStartDate || currentDate,
              endDate: formData.freezeEndDate,
              addedBy: currentUserId,
              endedBy: formData.freezeEndDate ? currentUserId : null,
            });
          }
        } else {
          statusDateHistory.freeze = [
            {
              date: formData.freezeStartDate || currentDate,
              endDate: formData.freezeEndDate,
              addedBy: currentUserId,
              endedBy: formData.freezeEndDate ? currentUserId : null,
            },
          ];
        }
        payload.statusDateHistory = statusDateHistory;
      } else if (statusChanged) {
        payload.statusDates = {
          ...(currentStudent.profile.statusDates || {}),
          [formData.status]: {
            date: currentDate,
            addedBy: currentUserId,
          },
        };

        if (formData.status === "freeze") {
          statusDateHistory.freeze = statusDateHistory.freeze || [];
          statusDateHistory.freeze.push({
            date: formData.freezeStartDate || currentDate,
            endDate: formData.freezeEndDate,
            addedBy: currentUserId,
            endedBy: formData.freezeEndDate ? currentUserId : null,
          });
          if (
            formData.freezeEndDate &&
            new Date(formData.freezeEndDate) > currentDate
          ) {
            const afterFreezeStatus = "regular";
            statusDateHistory[afterFreezeStatus] =
              statusDateHistory[afterFreezeStatus] || [];

            statusDateHistory[afterFreezeStatus].push({
              date: new Date(formData.freezeEndDate),
              addedBy: currentUserId,
              scheduledBy: currentUserId,
              scheduledAt: currentDate,
            });
          }
        } else if (currentStudent.profile.status === "freeze") {
          if (statusDateHistory.freeze && statusDateHistory.freeze.length > 0) {
            const activeFreeze = [...statusDateHistory.freeze]
              .filter((entry) => !entry.endDate)
              .sort((a, b) => new Date(b.date) - new Date(a.date))[0];

            if (activeFreeze) {
              activeFreeze.endDate = formData.freezeEndDate || currentDate;
              activeFreeze.endedBy = currentUserId;
            }
          }
          statusDateHistory[formData.status] =
            statusDateHistory[formData.status] || [];
          statusDateHistory[formData.status].push({
            date: currentDate,
            addedBy: currentUserId,
          });
        } else {
          statusDateHistory[formData.status] =
            statusDateHistory[formData.status] || [];
          statusDateHistory[formData.status].push({
            date: currentDate,
            addedBy: currentUserId,
          });
        }
        payload.statusDateHistory = statusDateHistory;
      }

      await axios.put(
        `${BASE_URL}/api/admin/users/${currentStudent._id}`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      showNotification("Student updated successfully");
      fetchStudents();
      setShowModal(false);
    } catch (error) {
      console.error("Error updating student:", error);
      console.error("Error response:", error.response?.data);
      showNotification(
        error.response?.data?.msg || "Error updating student",
        "error"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e) => {
    if (currentStudent) {
      handleEditSubmit(e);
    } else {
      handleAddSubmit(e);
    }
  };

  const handleAdd = () => {
    setCurrentStudent(null);
    setFormData({
      name: "",
      gender: "male",
      grade: "",
      dateOfBirth: null,
      clientId: "",
      status: "trial",
      freezeStartDate: new Date(),
      freezeEndDate: null,
    });
    setFreezeStartDate(new Date());
    setFreezeEndDate(null);
    setSubjectTeacherPairs([{ subjectId: "", teacherId: "" }]);
    setErrors({});
    setShowModal(true);
  };

  const handleEdit = (student) => {
    setCurrentStudent(student);
    let freezeStartDate = new Date();
    let freezeEndDate = null;

    if (
      student.profile.statusDateHistory &&
      student.profile.statusDateHistory.freeze &&
      student.profile.statusDateHistory.freeze.length > 0
    ) {
      const activeFreeze = [...student.profile.statusDateHistory.freeze]
        .filter((entry) => !entry.endDate)
        .sort((a, b) => new Date(b.date) - new Date(a.date))[0];

      if (activeFreeze) {
        freezeStartDate = new Date(activeFreeze.date);
        freezeEndDate = activeFreeze.endDate
          ? new Date(activeFreeze.endDate)
          : null;
      }
    }

    setFreezeStartDate(freezeStartDate);
    setFreezeEndDate(freezeEndDate);
    setFormData({
      name: student.name,
      gender: student.gender,
      grade: student.profile.grade,
      dateOfBirth: new Date(student.profile.dateOfBirth),
      clientId: student.profile.client?._id || student.profile.client || "",
      status: student.profile.status || "trial",
      freezeStartDate: freezeStartDate,
      freezeEndDate: freezeEndDate,
    });
    const pairs = student.profile.assignedTeachers.map((assignment) => ({
      subjectId: assignment.subject._id._id,
      teacherId: assignment.teacher._id._id,
    }));

    setSubjectTeacherPairs(pairs);

    setErrors({});
    setShowModal(true);
  };
  useEffect(() => {
    let filtered = [...students];

    if (searchTerm) {
      const searchTermLower = searchTerm.toLowerCase();
      filtered = filtered.filter((student) => {
        const studentId = String(student.profile.studentId || "");
        const clientId = String(student.profile.clientId || "").toLowerCase();
        return (
          student.name.toLowerCase().includes(searchTermLower) ||
          studentId.includes(searchTermLower) ||
          clientId.includes(searchTermLower) ||
          (student.profile.clientName || "")
            .toLowerCase()
            .includes(searchTermLower)
        );
      });
    }

    if (selectedStatus !== "all") {
      filtered = filtered.filter((student) => {
        return student.profile.status === selectedStatus;
      });
    }

    if (selectedSubjectType !== "all") {
      filtered = filtered.filter((student) => {
        const activeSubjects = getActiveSubjectDetails(student);
        return activeSubjects.some(
          (subject) => subject.subjectType === selectedSubjectType
        );
      });
    }
    if (selectedClient !== "all") {
      filtered = filtered.filter((student) => {
        return (
          student.profile.client === selectedClient ||
          student.profile.user === selectedClient
        );
      });
    }

    if (selectedStudentActiveStatus !== "all") {
      filtered = filtered.filter((student) => {
        if (selectedStudentActiveStatus === "active") {
          return !student.name.includes("(Inactive Student)");
        } else if (selectedStudentActiveStatus === "inactive") {
          return student.name.includes("(Inactive Student)");
        }
        return true;
      });
    }

    if (dateRange[0] && dateRange[1]) {
      filtered = filtered.filter((student) => {
        const enrollmentDate = new Date(student.profile.enrollmentDate);
        return enrollmentDate >= dateRange[0] && enrollmentDate <= dateRange[1];
      });
    }

    setFilteredStudents(filtered);
  }, [
    students,
    searchTerm,
    selectedClient,
    dateRange,
    selectedStatus,
    selectedSubjectType,
    selectedStudentActiveStatus,
  ]);

  const modalStyle = {
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    width: 500,
    bgcolor: "background.paper",
    borderRadius: "12px",
    boxShadow:
      "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)",
    p: 4,
    maxHeight: "90vh",
    overflowY: "auto",
    "&:focus-visible": {
      outline: "none",
    },
    fontFamily:
      "'Poppins', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  };
  return (
    <div className="management-container">
      <div className="management-header">
        <div>
          <h2>Students Management</h2>
          <p className="total-count">
            {filteredStudents.length} Total Students • {totalSubjects} Active
            Subjects
          </p>
        </div>
        <div className="header-buttons">
          <SyncButton
            isSyncing={isSyncing}
            onClick={() => fetchStudents(true)}
          />
          <button className="add-btn" onClick={handleAdd}>
            <FaPlus /> Add Student
          </button>
        </div>
      </div>

      <div className="filter-section">
        <div className="search-box">
          <FaSearch className="search-icon" />
          <input
            type="text"
            placeholder="Search by Name, ID or Client"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="filter-box">
          <FaFilter className="filter-icon" />
          <Select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            displayEmpty
            sx={{
              width: "200px",
              height: "40px",
              ".MuiSelect-select": {
                padding: "8px 12px 8px 36px",
                backgroundColor: "white",
                border: "1px solid #e2e8f0",
                borderRadius: "6px",
                fontSize: "0.875rem",
                color: "#475569",
              },
              ".MuiOutlinedInput-notchedOutline": {
                border: "none",
              },
            }}
          >
            <MenuItem value="all">All Status</MenuItem>
            {STATUS_OPTIONS.map((status) => (
              <MenuItem key={status} value={status}>
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </MenuItem>
            ))}
          </Select>
        </div>
        <div className="filter-box">
          <FaFilter className="filter-icon" />
          <Select
            value={selectedStudentActiveStatus}
            onChange={(e) => setSelectedStudentActiveStatus(e.target.value)}
            displayEmpty
            sx={{
              width: "200px",
              height: "40px",
              ".MuiSelect-select": {
                padding: "8px 12px 8px 36px",
                backgroundColor: "white",
                border: "1px solid #e2e8f0",
                borderRadius: "6px",
                fontSize: "0.875rem",
                color: "#475569",
              },
              ".MuiOutlinedInput-notchedOutline": {
                border: "none",
              },
            }}
          >
            <MenuItem value="all">All Student Status</MenuItem>
            <MenuItem value="active">Active Students</MenuItem>
            <MenuItem value="inactive">Inactive Students</MenuItem>
          </Select>
        </div>

        <div className="filter-box">
          <FaFilter className="filter-icon" />
          <Select
            value={selectedSubjectType}
            onChange={(e) => setSelectedSubjectType(e.target.value)}
            displayEmpty
            sx={{
              width: "200px",
              height: "40px",
              ".MuiSelect-select": {
                padding: "8px 12px 8px 36px",
                backgroundColor: "white",
                border: "1px solid #e2e8f0",
                borderRadius: "6px",
                fontSize: "0.875rem",
                color: "#475569",
              },
              ".MuiOutlinedInput-notchedOutline": {
                border: "none",
              },
            }}
          >
            <MenuItem value="all">All Subject Types</MenuItem>
            {SUBJECT_TYPE_OPTIONS.map((type) => (
              <MenuItem key={type} value={type}>
                {type === "quran" ? "Quran" : "Subjects"}
              </MenuItem>
            ))}
          </Select>
        </div>
        <div className="filter-box">
          <ReactDatePicker
            selectsRange={true}
            startDate={dateRange[0]}
            endDate={dateRange[1]}
            onChange={(update) => setDateRange(update)}
            isClearable={true}
            dateFormat="dd/MM/yyyy"
            customInput={
              <div className="date-input-wrapper">
                <FaFilter className="filter-icon" />
                <input
                  className="date-range-input"
                  placeholder="Select date range"
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
        </div>
        <button
          className="clear-filters-btn"
          onClick={() => {
            setDateRange([null, null]);
            setSelectedClient("all");
            setSelectedStatus("all");
            setSelectedSubjectType("all");
            setSelectedStudentActiveStatus("all");
            setSearchTerm("");
          }}
        >
          Clear Filters
        </button>
      </div>

      <div className="table-container">
        {isLoading && !showModal ? (
          <div className="loading-container">
            <CircularProgress />
          </div>
        ) : filteredStudents.length > 0 ? (
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Client</th>
                <th>Grade</th>
                <th>Subjects</th>
                <th>Teachers</th>
                <th>Status</th>
                <th>Enrollment Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredStudents.map((student) => (
                <tr key={student._id}>
                  <td>{student.profile.studentId}</td>
                  <td>
                    <div style={{ fontWeight: "500" }}>
                      {student.name &&
                      student.name.includes("(Inactive Student)") ? (
                        <>
                          {student.name.replace(" (Inactive Student)", "")}
                          <div
                            style={{
                              color: "#dc2626",
                              fontSize: "0.75rem",
                              fontWeight: "500",
                              marginTop: "2px",
                            }}
                          >
                            (Inactive Student)
                          </div>
                        </>
                      ) : (
                        student.name
                      )}
                    </div>
                    <span style={{ color: "#64748b", fontSize: "0.8125rem" }}>
                      {student.gender}
                    </span>
                  </td>
                  <td>
                    <div style={{ fontWeight: "500" }}>
                      {student.profile.clientName}
                    </div>
                    <span style={{ color: "#64748b", fontSize: "0.8125rem" }}>
                      {student.profile.clientId || "No ID"}
                    </span>
                  </td>
                  <td>Grade {student.profile.grade}</td>
                  <td>
                    {/* Show only active subjects */}
                    {getActiveSubjectDetails(student).map(
                      (subjectDetail, index) => (
                        <div
                          key={index}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "4px",
                          }}
                        >
                          {subjectDetail.subjectName}
                          <span
                            style={{
                              color: "#22c55e",
                              fontSize: "0.75rem",
                              fontWeight: "500",
                            }}
                          >
                            ✓
                          </span>
                        </div>
                      )
                    )}
                    {getActiveSubjectDetails(student).length === 0 && (
                      <div
                        style={{
                          color: "#64748b",
                          fontSize: "0.8rem",
                          fontStyle: "italic",
                        }}
                      >
                        No active subjects
                      </div>
                    )}
                  </td>
                  <td>
                    {student.profile.assignedTeachers.map((at) => (
                      <div key={at._id}>
                        {at.teacher.name &&
                        at.teacher.name.includes("(Inactive Teacher)") ? (
                          <>
                            {at.teacher.name.replace(" (Inactive Teacher)", "")}
                            <div
                              style={{
                                color: "#dc2626",
                                fontSize: "0.75rem",
                                fontWeight: "500",
                                marginTop: "2px",
                              }}
                            >
                              (Inactive Teacher)
                            </div>
                          </>
                        ) : at.teacher.name &&
                          at.teacher.name.includes("(Deleted Teacher)") ? (
                          <>
                            {at.teacher.name.replace(" (Deleted Teacher)", "")}
                            <div
                              style={{
                                color: "#dc2626",
                                fontSize: "0.75rem",
                                fontWeight: "500",
                                marginTop: "2px",
                              }}
                            >
                              (Deleted Teacher)
                            </div>
                          </>
                        ) : (
                          at.teacher.name
                        )}
                      </div>
                    ))}
                  </td>
                  <td>
                    <div>
                      <span className={`status-tag ${student.profile.status}`}>
                        {student.profile.status.charAt(0).toUpperCase() +
                          student.profile.status.slice(1)}
                      </span>
                    </div>
                  </td>
                  <td>
                    {format(
                      new Date(student.profile.enrollmentDate),
                      "dd/MM/yyyy"
                    )}
                  </td>
                  <td>
                    <div className="actions">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setCurrentStudent(student);
                          setShowViewModal(true);
                        }}
                      >
                        <FaEye />
                      </button>
                      <button onClick={() => handleEdit(student)}>
                        <FaEdit />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="no-data">
            <p>
              {searchTerm ||
              selectedClient !== "all" ||
              selectedStatus !== "all" ||
              selectedSubjectType !== "all" ||
              (dateRange[0] && dateRange[1])
                ? "No students found matching your search criteria"
                : "No students found"}
            </p>
          </div>
        )}
      </div>
      {showViewModal && currentStudent && (
        <Modal
          open={showViewModal}
          onClose={() => setShowViewModal(false)}
          aria-labelledby="view-modal-title"
        >
          <ViewStudentModal
            student={currentStudent}
            setShowModal={setShowViewModal}
            modalStyle={modalStyle}
            adminPassword={adminPassword}
            setAdminPassword={setAdminPassword}
            passwordError={passwordError}
            isInfoVisible={isInfoVisible}
            handleAdminPasswordSubmit={handleAdminPasswordSubmit}
          />
        </Modal>
      )}
      <Modal
        open={showModal}
        onClose={() => !isLoading && setShowModal(false)}
        aria-labelledby="modal-title"
      >
        <ModalContent
          formData={formData}
          handleChange={handleChange}
          handleSubmit={handleSubmit}
          handleAddSubmit={handleAddSubmit}
          handleEditSubmit={handleEditSubmit}
          setShowModal={setShowModal}
          currentStudent={currentStudent}
          errors={errors}
          isLoading={isLoading}
          handleDateChange={handleDateChange}
          handleFreezeStartDateChange={handleFreezeStartDateChange}
          handleFreezeEndDateChange={handleFreezeEndDateChange}
          freezeStartDate={freezeStartDate}
          freezeEndDate={freezeEndDate}
          subjects={subjects}
          teachers={teachers}
          handleAddSubjectTeacher={handleAddSubjectTeacher}
          handleRemoveSubjectTeacher={handleRemoveSubjectTeacher}
          subjectTeacherPairs={subjectTeacherPairs}
          clients={clients}
        />
      </Modal>
      <NotificationSnackbar
        notification={notification}
        onClose={closeNotification}
      />
    </div>
  );
};

export default StudentsManagement;
