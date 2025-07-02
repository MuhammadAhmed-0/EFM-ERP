import { createContext, useContext, useState, useEffect } from "react";
import { io } from "socket.io-client";
import axios from "axios";

const AnnouncementContext = createContext();
const BASE_URL = import.meta.env.VITE_BASE_URL;

export const useAnnouncements = () => {
  const context = useContext(AnnouncementContext);
  if (!context) {
    throw new Error(
      "useAnnouncements must be used within an AnnouncementProvider"
    );
  }
  return context;
};

export const AnnouncementProvider = ({ children }) => {
  const [unreadCount, setUnreadCount] = useState(0);
  const [announcements, setAnnouncements] = useState([]);
  const [socket, setSocket] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;

    const newSocket = io(BASE_URL, {
      auth: { token },
    });

    newSocket.on("new_announcement", (data) => {
      setAnnouncements((prev) => [data.announcement, ...prev]);
      setUnreadCount((prev) => prev + 1);
    });

    setSocket(newSocket);

    return () => {
      if (newSocket) newSocket.close();
    };
  }, []);
  useEffect(() => {
    fetchUnreadCount();
    fetchAnnouncements();
  }, []);
  const fetchUnreadCount = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      const response = await axios.get(
        `${BASE_URL}/api/announcements/unread-count`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setUnreadCount(response.data.count);
      setError(null);
    } catch (error) {
      console.error("Error fetching unread count:", error);
      setError("Failed to fetch unread count");
      setUnreadCount(0);
    }
  };

  const fetchAnnouncements = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(`${BASE_URL}/api/announcements/view`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const announcementsData = response.data.announcements || [];
      setAnnouncements(announcementsData);
    } catch (error) {
      console.error("Error fetching announcements:", error);
    }
  };

  const markAsRead = async (announcementId) => {
    try {
      const token = localStorage.getItem("token");
      await axios.post(
        `${BASE_URL}/api/announcements/mark-read/${announcementId}`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setAnnouncements((prev) =>
        prev.map((announcement) =>
          announcement._id === announcementId
            ? { ...announcement, isRead: true }
            : announcement
        )
      );

      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (error) {
      console.error("Error marking announcement as read:", error);
    }
  };

  const value = {
    unreadCount,
    announcements,
    markAsRead,
    fetchAnnouncements,
    error,
    socket,
  };

  return (
    <AnnouncementContext.Provider value={value}>
      {children}
    </AnnouncementContext.Provider>
  );
};
