import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import http from "http";
import { Server } from "socket.io";
import connectDB from "./db.js";

dotenv.config({ path: "../.env" });

/* ---------------- BASIC SETUP ---------------- */
const app = express();
const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

const PORT = process.env.PORT || 5001;

/* ---------------- MIDDLEWARE ---------------- */
app.use(cors());
app.use(express.json());

connectDB();

/* ---------------- LIVE ROOM STATE ---------------- */
const liveRooms = new Map();

/* ---------------- SOCKET.IO ---------------- */
io.on("connection", (socket) => {
    console.log("Socket connected:", socket.id);

    /* ---------- HELPER: BROADCAST STATE ---------- */
    const broadcastLobbyState = (roomCode) => {
        const room = liveRooms.get(roomCode);
        if (!room) return;

        const state = {
            roomCode: room.roomCode,
            hostId: room.hostId,
            settings: room.settings,
            players: room.players
        };

        io.to(roomCode).emit("lobby_state", state);
    };

    /* ---------- JOIN LOBBY (CRITICAL) ---------- */
    socket.on("join_lobby", ({ roomCode, userId, username, avatar }) => {
        // Validate Input
        if (!roomCode || !userId) {
            console.warn(`Join failed: Missing roomCode (${roomCode}) or userId (${userId})`);
            return;
        }

        socket.join(roomCode);

        // Initialize room if not exists
        if (!liveRooms.has(roomCode)) {
            liveRooms.set(roomCode, {
                roomCode,
                hostId: userId, // First joiner is host
                settings: {
                    difficulty: "Medium",
                    rounds: 5,
                    responseTime: 40,
                    votingTime: 20
                },
                players: []
            });
            console.log(`Created new lobby: ${roomCode} with Host: ${username} (${userId})`);
        }

        const room = liveRooms.get(roomCode);

        // Prevent duplicates (update socketId if rejoining)
        const existingPlayerIndex = room.players.findIndex(p => p.userId === userId);

        if (existingPlayerIndex !== -1) {
            room.players[existingPlayerIndex].socketId = socket.id;
            room.players[existingPlayerIndex].username = username;
            room.players[existingPlayerIndex].avatar = avatar;
        } else {
            room.players.push({
                userId,
                username,
                avatar,
                socketId: socket.id,
                ready: false
            });
        }

        // Broadcast State
        broadcastLobbyState(roomCode);
        console.log(`User ${username} joined ${roomCode}. Total: ${room.players.length}`);
    });

    /* ---------- UPDATE SETTINGS (HOST ONLY) ---------- */
    socket.on("update_lobby_settings", ({ roomCode, settings }) => {
        const room = liveRooms.get(roomCode);
        if (!room) return;

        const player = room.players.find(p => p.socketId === socket.id);
        if (!player || player.userId !== room.hostId) {
            console.warn(`Unauthorized settings update attempt by ${socket.id}`);
            return;
        }

        room.settings = settings;
        room.players.forEach(p => p.ready = false); // Reset ready

        broadcastLobbyState(roomCode);
    });

    /* ---------- LEAVE LOBBY ---------- */
    const handleLeave = () => {
        for (const [code, room] of liveRooms.entries()) {
            const playerIndex = room.players.findIndex(p => p.socketId === socket.id);
            if (playerIndex !== -1) {
                const player = room.players[playerIndex];
                room.players.splice(playerIndex, 1); // Remove

                if (room.players.length === 0) {
                    liveRooms.delete(code);
                    console.log(`Lobby ${code} deleted (empty)`);
                } else {
                    // Host Migration
                    if (player.userId === room.hostId) {
                        room.hostId = room.players[0].userId;
                        console.log(`Host migrated to ${room.players[0].username} in ${code}`);
                    }
                    broadcastLobbyState(code);
                }
                console.log(`User ${player.username} left ${code}`);
                break;
            }
        }
    };

    socket.on("leave_lobby", handleLeave);
    socket.on("disconnect", handleLeave);

    /* ---------- TOGGLE READY ---------- */
    socket.on("toggle_ready", ({ roomCode }) => {
        const room = liveRooms.get(roomCode);
        if (!room) return;

        const player = room.players.find(p => p.socketId === socket.id);
        if (player) {
            player.ready = !player.ready;
            broadcastLobbyState(roomCode);
        }
    });

    /* ---------- CHAT ---------- */
    socket.on("chat:send", ({ roomCode, user, message }) => {
        const msgPayload = {
            id: Date.now(),
            user: user.username,
            message,
            time: new Date().toISOString()
        };
        io.to(roomCode).emit("chat:receive", msgPayload);
    });

});

/* ---------------- ROUTES ---------------- */
app.get("/", (req, res) => {
    res.send("Word Imposter API running");
});

import authRoutes from "./routes/auth.js";
import roomRoutes from "./routes/rooms.js";
import userRoutes from "./routes/users.js";
import friendRoutes from "./routes/friends.js";
import messageRoutes from "./routes/messages.js";
import profileRoutes from "./routes/profile.js";
import accountRoutes from "./routes/account.js";

app.use("/api/auth", authRoutes);
app.use("/api/rooms", roomRoutes);
app.use("/api/users", userRoutes);
app.use("/api/profile", profileRoutes); // New
app.use("/api/account", accountRoutes); // New STRICT requirement
app.use("/api/friends", friendRoutes);
app.use("/api/messages", messageRoutes);

/* ---------------- SERVER START ---------------- */
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
