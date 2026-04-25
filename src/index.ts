import 'dotenv/config';
import { Server } from "socket.io";
import express from "express";
import { createServer } from "node:http";
import { checkboxService } from "./module/checkbox/checkbox.service.js";
import { registerCheckboxHandlers } from "./module/checkbox/checkbox.handler.js";
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


app.get("/api/checkboxes", async (req, res) => {
  try {
    const checkboxes = await checkboxService.getAll();
    res.json(checkboxes);
  } catch (error) {
    console.error("Failed to fetch checkboxes:", error);
    res.status(500).json({ error: "Failed to fetch checkboxes" });
  }
});

app.post("/api/checkboxes/:id/toggle", async (req, res) => {
  try {
    const { id } = req.params;
    const { checked, userId } = req.body;

    if (!userId) {
      return res.status(400).json({ error: "userId is required" });
    }

    const updated = await checkboxService.update(id, checked, userId);

    // Broadcast to WebSocket clients
    console.log(`Broadcasting update for checkbox ${id}: checked=${checked}, updatedBy=${userId}`);
    io.emit("checkbox:updated", updated);

    res.json(updated);
  } catch (error) {
    console.error("Failed to update checkbox:", error);
    res.status(500).json({ error: "Failed to update checkbox" });
  }
});

// Socket.IO handlers
io.on("connection", (socket) => {
  console.log(`User connected: ${socket.id}`);

  registerCheckboxHandlers(io, socket);

  socket.on("disconnect", () => {
    console.log("User disconnected");
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});