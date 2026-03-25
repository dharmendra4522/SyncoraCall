// Import required modules
import express from "express"; // Express.js framework to create the backend server
import dotenv from "dotenv"; // dotenv is used to load environment variables from a `.env` file
import cors from "cors"; // CORS (Cross-Origin Resource Sharing) allows frontend & backend communication
import cookieParser from "cookie-parser"; // Parses cookies from incoming requests
import { createServer } from "http"; // Creates an HTTP server (needed for WebSocket support)
import { Server } from "socket.io"; // Import `Server` from `socket.io` for real-time communication

// Import custom route files
import authRoute from "./rout/authRout.js"; // Import authentication routes (login/signup)
import userRoute from "./rout/userRout.js"; // Import user-related routes (profile, settings)
import dbConnection from "./db/dbConnect.js"; // Import function to connect to MongoDB database

// ✅ Load environment variables (from `.env` file)
dotenv.config();

// 🌍 Create an Express application
const app = express();

// 🔧 Set up server port (from `.env` or default to 3000)
const PORT = process.env.PORT || 3000;

// 📡 Create an HTTP server to work with Express (needed for WebSockets)
const server = createServer(app);

// 🌍 Create a more robust list of allowed origins (e.g., local Vite ports)
const allowedOrigins = [
  process.env.FRONTEND_URL,
  "http://localhost:5173",
  "https://syncora-call.vercel.app",
].filter(Boolean);

console.log("Allowed Origins:", allowedOrigins);

// 🔧 Middleware to handle CORS
app.use(
  cors({
    origin: function (origin, callback) {
      // Remove trailing slashes for exact matches (some browsers/tools might include them)
      const sanitizedOrigin = origin ? origin.replace(/\/$/, "") : null;
      if (
        !sanitizedOrigin ||
        allowedOrigins.some((o) => o.replace(/\/$/, "") === sanitizedOrigin)
      ) {
        callback(null, true);
      } else {
        console.warn(`[CORS] Rejected blocking from: ${origin}`);
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE"],
  }),
);

// 🛠 Middleware for handling JSON requests and cookies
app.use(express.json()); // Enables parsing of JSON request bodies
app.use(cookieParser()); // Enables reading cookies in HTTP requests

// 🔗 Define API routes
app.use("/api/auth", authRoute); // Authentication routes (login, signup, logout)
app.use("/api/user", userRoute); // User-related routes (profile, settings)

// ✅ Test Route to check if the server is running
app.get("/ok", (req, res) => {
  res.json({ message: "Server is running!" }); // Returns a JSON response
});

// 🔥 Initialize Socket.io for real-time communication
const io = new Server(server, {
  pingTimeout: 60000,
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST"],
  },
});
console.log("[SUCCESS] Socket.io initialized with CORS"); // Debugging message

// 🟢 Store online users and active calls
let onlineUsers = []; // Array to store online users
const activeCalls = new Map(); // Map to track ongoing calls
const usersInRoom = {}; // { roomID: [socketID, ...] }
const socketToRoom = {}; // { socketID: roomID }

// 📞 Handle WebSocket (Socket.io) connections
io.on("connection", (socket) => {
  console.log(`[INFO] New connection: ${socket.id}`); // Debugging: New user connected

  // 🔹 Emit an event to send the socket ID to the connected user
  socket.emit("me", socket.id);

  // 📡 User joins the chat system
  socket.on("join", (user) => {
    if (!user || !user.id) {
      console.warn("[WARNING] Invalid user data on join"); // Warn if user data is missing
      return;
    }

    socket.join(user.id); // 🔹 Add user to a room with their ID
    const existingUser = onlineUsers.find((u) => u.userId === user.id); // Check if user is already online

    if (existingUser) {
      existingUser.socketId = socket.id; // Update socket ID if user reconnects
    } else {
      // 🟢 Add new user to online users list
      onlineUsers.push({
        userId: user.id,
        name: user.name,
        socketId: socket.id,
      });
    }

    io.emit("online-users", onlineUsers); // 🔹 Broadcast updated online users list
  });

  // 🏠 Group Room Logic
  socket.on("join-room", (roomID) => {
    if (usersInRoom[roomID]) {
      const length = usersInRoom[roomID].length;
      if (length === 10) {
        // Limit to 10 users for performance
        socket.emit("room-full");
        return;
      }
      usersInRoom[roomID].push(socket.id);
    } else {
      usersInRoom[roomID] = [socket.id];
    }
    socketToRoom[socket.id] = roomID;
    const usersInThisRoom = usersInRoom[roomID].filter(
      (id) => id !== socket.id,
    );

    socket.emit("all-users", usersInThisRoom);
  });

  socket.on("sending-signal", (payload) => {
    io.to(payload.userToSignal).emit("user-joined", {
      signal: payload.signal,
      callerID: payload.callerID,
      username: payload.username,
      profilepic: payload.profilepic,
    });
  });

  socket.on("returning-signal", (payload) => {
    io.to(payload.callerID).emit("receiving-returned-signal", {
      signal: payload.signal,
      id: socket.id,
    });
  });

  // 📴 Handle call ending (modified to handle rooms)
  socket.on("call-ended", (data) => {
    io.to(data.to).emit("callEnded", {
      name: data.name,
    });

    activeCalls.delete(data.from);
    activeCalls.delete(data.to);
  });

  // ❌ Handle user disconnecting from the server
  socket.on("disconnect", () => {
    const user = onlineUsers.find((u) => u.socketId === socket.id); // Find the disconnected user
    if (user) {
      activeCalls.delete(user.userId); // Remove the user from active calls

      // 🔥 Remove all calls associated with this user
      for (const [key, value] of activeCalls.entries()) {
        if (value.with === user.userId) activeCalls.delete(key);
      }
    }

    // 🔥 Remove user from the online users list
    onlineUsers = onlineUsers.filter((user) => user.socketId !== socket.id);

    // 🔹 Broadcast updated online users list
    io.emit("online-users", onlineUsers);

    // 🔹 Notify others that the user has disconnected
    socket.broadcast.emit("discounnectUser", { disUser: socket.id });

    console.log(`[INFO] Disconnected: ${socket.id}`); // Debugging: User disconnected
  });
});

// 🏁 Start the server immediately
server.listen(PORT, () => {
  console.log(`✅ Server is running on port ${PORT}`);

  // 🟢 Connect to the database in the background
  dbConnection()
    .then(() => {
      console.log("✅ Database connected successfully");
    })
    .catch((error) => {
      console.error("❌ Background Database Connection Failed:", error.message);
    });
});
