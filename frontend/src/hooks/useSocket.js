import { useEffect, useState } from "react";
import { io } from "socket.io-client";

const useSocket = (
  onEventHandlers = {},
  baseUrl = import.meta.env.VITE_BASE_URL
) => {
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;

    const newSocket = io(baseUrl, {
      auth: { token },
    });

    newSocket.on("connect", () => {
      console.log("Socket connected");
    });

    for (const [event, handler] of Object.entries(onEventHandlers)) {
      newSocket.on(event, handler);
    }

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, []);

  return socket;
};

export default useSocket;
