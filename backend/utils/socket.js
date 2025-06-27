const jwt = require("jsonwebtoken");

module.exports = (io) => {
  if (!io) {
    throw new Error("Socket.IO instance is required");
  }

  const connectedUsers = new Map();

  io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) {
      return next(new Error("Authentication error"));
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.user = decoded.user;
      next();
    } catch (err) {
      next(new Error("Authentication error"));
    }
  });

  io.on("connection", (socket) => {
    console.log(`User connected: ${socket.user.id}`);

    connectedUsers.set(socket.user.id, socket.id);

    socket.join(socket.user.role);
    socket.join(`user:${socket.user.id}`);

    socket.on("disconnect", () => {
      console.log(`User disconnected: ${socket.user.id}`);
      connectedUsers.delete(socket.user.id);
    });
  });

  return {
    emitToRoles: (roles, eventName, data) => {
      roles.forEach((role) => {
        io.to(role).emit(eventName, data);
      });
    },
    emitToUser: (userId, eventName, data) => {
      const socketId = connectedUsers.get(userId);
      if (socketId) {
        io.to(socketId).emit(eventName, data);
      }
    },
  };
};
