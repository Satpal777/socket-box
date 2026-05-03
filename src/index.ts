import 'dotenv/config';
import { Server } from "socket.io";
import express from "express";
import { createServer } from "node:http";
import { checkboxService, TOTAL_CHECKBOXES } from "./module/checkbox/checkbox.service.js";
import { registerCheckboxHandlers } from "./module/checkbox/checkbox.handler.js";
import { pub, sub, CHANNELS } from "./redis/redis.js";
import cors from "cors";

import { authMiddleware, verifyToken } from "./middleware/auth.js";

const app = express();

app.use(cors({
  origin: [
    process.env.FRONTEND_URL!
  ],
  credentials: true
}))

app.use(express.json());

// Global CORS fallback
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  if (req.method === "OPTIONS") {
    res.sendStatus(200);
  } else {
    next();
  }
});

const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: [
      process.env.FRONTEND_URL!
    ],
    methods: ["GET", "POST"],
    credentials: true
  }
})

// Protect Socket.io
io.use(async (socket, next) => {
  const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.split(' ')[1];

  if (!token) {
    return next(new Error("Authentication error: No token provided"));
  }

  try {
    const payload = await verifyToken(token);
    if (!payload.exp) {
      return next(new Error("Authentication error: No expiration date"));
    }
    if (payload.exp < Date.now() / 1000) {
      return next(new Error("Authentication error: Token expired"));
    }
    (socket as any).user = payload;
    next();
  } catch (err) {
    console.error("Socket Auth Error:", err);
    next(new Error("Authentication error: Invalid token"));
  }
});


const onlineUsers = new Map<string, string>();

app.get("/api/checkboxes", authMiddleware, async (req, res) => {
  try {
    const items = await checkboxService.getAll();
    res.json({ total: TOTAL_CHECKBOXES, items });
  } catch (error) {
    console.error("Failed to fetch checkboxes:", error);
    res.status(500).json({ error: "Failed to fetch checkboxes" });
  }
});

sub.subscribe(...Object.values(CHANNELS));

sub.on("message", (channel, message) => {
  console.log(`Broadcasting to channel ${channel}: ${message}`);
  io.emit(channel, JSON.parse(message));
});

io.on("connection", (socket) => {
  console.log(`User connected: ${socket.id}`);

  const user = (socket as any).user;
  const username = user?.name || user?.email || user?.sub || "Unknown User";

  socket.on("user:join", () => {
    onlineUsers.set(socket.id, username);
    pub.publish(CHANNELS.usersOnline, JSON.stringify(onlineUsers.size));
    console.log(`User joined: ${username}, total online: ${onlineUsers.size}`);
  });

  socket.emit("users:online", onlineUsers.size + 1);

  registerCheckboxHandlers(io, socket);

  socket.on("disconnect", () => {
    onlineUsers.delete(socket.id);
    pub.publish(CHANNELS.usersOnline, JSON.stringify(onlineUsers.size));
    console.log(`User disconnected, total online: ${onlineUsers.size}`);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});