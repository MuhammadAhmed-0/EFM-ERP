import { useEffect, useState } from "react";
import { io } from "socket.io-client";
import axios from "axios";

const useUnreadQueries = (baseUrl, path = "/api/announcements/my-queries") => {
  const [unreadQueries, setUnreadQueries] = useState(0);
  const [badgeKey, setBadgeKey] = useState(0);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;

    const socket = io(baseUrl, { auth: { token } });

    socket.on("new_query", () => {
      setUnreadQueries((prev) => prev + 1);
    });

    return () => socket.disconnect();
  }, [baseUrl]);

  useEffect(() => {
    const fetchUnread = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await axios.get(`${baseUrl}${path}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const count = response.data.queries.filter(
          (q) => !q.readBy?.length
        ).length;
        setUnreadQueries(count);
      } catch (err) {
        console.error("Error fetching unread queries:", err);
      }
    };

    fetchUnread();
  }, [baseUrl, path]);

  useEffect(() => {
    setBadgeKey((prev) => prev + 1);
  }, [unreadQueries]);

  const resetUnread = () => setUnreadQueries(0);

  return { unreadQueries, badgeKey, resetUnread };
};

export default useUnreadQueries;
