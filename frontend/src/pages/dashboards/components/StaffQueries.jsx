import { useState, useEffect } from "react";
import { FaPlus } from "react-icons/fa";
import axios from "axios";
import QueryModal from "./QueryModal";
import QueryList from "./QueryList";
import "../../../styles/components/SupervisorQueries.css";
import "../../../styles/components/Management.css";
import { io } from "socket.io-client";
import useNotification from "../../../hooks/useNotification";
import NotificationSnackbar from "../../../components/common/NotificationSnackbar";
const StaffQueries = () => {
  const [showModal, setShowModal] = useState(false);
  const [queries, setQueries] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    queryType: "",
    description: "",
  });
  const [errors, setErrors] = useState({});
  const { notification, showNotification, closeNotification } =
    useNotification();

  const [socket, setSocket] = useState(null);
  const BASE_URL = import.meta.env.VITE_BASE_URL;

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    }
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      const newSocket = io(BASE_URL, {
        auth: { token },
      });

      newSocket.on("query_response", (data) => {
        fetchQueries();
      });

      setSocket(newSocket);

      return () => {
        if (newSocket) newSocket.disconnect();
      };
    }
  }, []);

  const fetchQueries = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("No authentication token found");
      }

      const response = await axios.get(
        `${BASE_URL}/api/announcements/my-queries`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      setQueries(response.data.queries);
    } catch (error) {
      if (error.response?.status === 401) {
        showNotification("Session expired. Please login again.", "error");
      } else {
        showNotification(
          error.response?.data?.message || "Error fetching queries",
          "error"
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchQueries();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
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
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.queryType) {
      newErrors.queryType = "Query type is required";
    }
    if (!formData.description.trim()) {
      newErrors.description = "Description is required";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("No authentication token found");
      }

      await axios.post(
        `${BASE_URL}/api/announcements/query/create`,
        {
          queryType: formData.queryType,
          description: formData.description,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      showNotification("Query sent successfully");
      setShowModal(false);
      setFormData({ queryType: "", description: "" });
      await fetchQueries();
    } catch (error) {
      if (error.response?.status === 401) {
        showNotification("Session expired. Please login again.", "error");
      } else {
        showNotification(
          error.response?.data?.message || "Error sending query",
          "error"
        );
      }
    } finally {
      setIsLoading(false);
    }
  };
  return (
    <div className="queries-container">
      <div className="queries-header">
        <div className="queries-header-content">
          <h2 className="queries-title">My Queries</h2>
          <p className="queries-subtitle">
            {queries.length} Total Queries •{" "}
            {queries.filter((q) => !q.readBy?.length).length} Pending
          </p>
        </div>
        <button
          className="add-btn"
          onClick={() => setShowModal(true)}
          disabled={isLoading}
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <FaPlus /> New Query
        </button>
      </div>

      <div className="queries-content">
        <QueryList queries={queries} isLoading={isLoading} />
      </div>

      <QueryModal
        open={showModal}
        onClose={() => !isLoading && setShowModal(false)}
        onSubmit={handleSubmit}
        isLoading={isLoading}
        formData={formData}
        handleChange={handleChange}
        errors={errors}
      />
      <NotificationSnackbar
        notification={notification}
        onClose={closeNotification}
      />
    </div>
  );
};

export default StaffQueries;
