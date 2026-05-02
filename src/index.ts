import 'dotenv/config';
import { Server } from "socket.io";
import express from "express";
import { createServer } from "node:http";
import { checkboxService, TOTAL_CHECKBOXES } from "./module/checkbox/checkbox.service.js";
import { registerCheckboxHandlers } from "./module/checkbox/checkbox.handler.js";
import { pub, sub, CHANNELS } from "./redis/redis.js";
import cors from "cors";

const app = express();

app.use(cors({
  origin: [
    process.env.FRONTEND_URL!
  ],
  credentials: true
}))

app.use(express.json());

app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
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


const onlineUsers = new Map<string, string>();

app.get("/api/checkboxes", async (req, res) => {
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

  socket.on("user:join", (userId: string) => {
    onlineUsers.set(socket.id, userId);
    pub.publish(CHANNELS.usersOnline, JSON.stringify(onlineUsers.size));
    console.log(`User joined: ${userId}, total online: ${onlineUsers.size}`);
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