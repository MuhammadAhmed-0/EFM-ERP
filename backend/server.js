const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");
require("dotenv").config();
const { Server } = require("socket.io");
const http = require("http");
const jwt = require("jsonwebtoken");
const { startScheduleCronJob } = require("./services/scheduleService");

connectDB();

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: [
      // "http://localhost:5173",
      // "http://192.168.1.60:5173",
      "https://erp.efmpvt.com/",
    ],
    methods: ["GET", "POST"],
  },
});
app.set("io", io);

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
  socket.join(socket.user.role);
  socket.join(`user:${socket.user.id}`);

  socket.on("disconnect", () => {
    console.log(`User disconnected: ${socket.user.id}`);
  });
});
app.use((req, res, next) => {
  req.io = io;
  next();
});
const corsOptions = {
  origin: "https://erp.efmpvt.com",
  methods: ["GET", "POST", "PUT", "DELETE"], 
  allowedHeaders: ["Content-Type", "Authorization"], 
};

app.use(cors(corsOptions));app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use((req, res, next) => {
  req.io = io;
  next();
});
startScheduleCronJob();

app.use("/api/schedules", require("./routes/scheduleRoutes"));
app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/supervisors", require("./routes/supervisorRoutes"));
app.use("/api/admin", require("./routes/adminRoutes"));
app.use("/api/payments", require("./routes/paymentRoutes"));
app.use("/api/announcements", require("./routes/announcementRoutes"));
app.use("/api/clients", require("./routes/clientRoutes"));
app.use("/api/subjects", require("./routes/subjectRoutes"));
app.use("/api/teachers", require("./routes/teacherRoutes"));
app.use("/api/student-attendance", require("./routes/studentAttendanceRoutes"));
app.use("/api/staff-attendance", require("./routes/staffAttendanceRoute"));
// app.use("/api/pdf", require("./routes/staffAttendanceRoute"));

app.get("/", (req, res) => {
  res.send("ERP API is running");
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send({ message: "Something went wrong!" });
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
  console.log("📅 Schedule management cron job is active");
});
// server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
