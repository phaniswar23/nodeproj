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

/* ---------------- GLOBAL STATE ---------------- */
const liveRooms = new Map();
// Global Map: userId -> socketId (for direct invites/warnings)
const userSockets = new Map();

/* ---------------- SOCKET.IO ---------------- */
io.on("connection", (socket) => {
    // console.log("Socket connected:", socket.id); // Verbose off
    const { userId, username } = socket.handshake.query;

    if (userId) {
        userSockets.set(userId, socket.id);
        console.log(`User mapped: ${username} -> ${socket.id}`);
        // Broadcast online status to friends (could be optimized)
        io.emit('online_users', Array.from(userSockets.keys()));
    }

    /* ---------- HELPER: BROADCAST STATE ---------- */
    const broadcastLobbyState = (roomCode) => {
        const room = liveRooms.get(roomCode);
        if (!room) return;

        const state = {
            roomCode: room.roomCode,
            hostId: room.hostId,
            settings: room.settings,
            players: room.players,
            status: room.status // waiting | starting | started
        };

        io.to(roomCode).emit("lobby_state", state);
    };

    /* ---------- HELPER: SEND CHAT ---------- */
    const sendSystemMessage = (roomCode, message) => {
        io.to(roomCode).emit("chat:receive", {
            id: Date.now(),
            user: "SYSTEM",
            message,
            time: new Date().toISOString(),
            isSystem: true
        });
    };

    /* ---------- JOIN LOBBY ---------- */
    socket.on("join_lobby", ({ roomCode, userId, username, avatar }) => {
        if (!roomCode || !userId) return;

        socket.join(roomCode);

        // CREATE ROOM
        if (!liveRooms.has(roomCode)) {
            liveRooms.set(roomCode, {
                roomCode,
                hostId: userId,
                settings: {
                    difficulty: "medium",
                    rounds: 5,
                    responseTime: 40,
                    votingTime: 20
                },
                players: [],
                status: 'waiting'
            });
            console.log(`New Lobby: ${roomCode}`);
        }

        const room = liveRooms.get(roomCode);
        const existingPlayer = room.players.find(p => p.userId === userId);

        if (existingPlayer) {
            existingPlayer.socketId = socket.id;
            existingPlayer.username = username;
            existingPlayer.avatar = avatar;
        } else {
            room.players.push({
                userId,
                username,
                avatar,
                socketId: socket.id,
                ready: false
            });
            sendSystemMessage(roomCode, `🟢 ${username} joined the room`);
        }

        broadcastLobbyState(roomCode);
    });

    /* ---------- LOBBY ACTIONS (HOST) ---------- */
    socket.on("update_lobby_settings", ({ roomCode, settings }) => {
        const room = liveRooms.get(roomCode);
        if (!room || room.hostId !== userId) return; // Basic auth check based on query param
        // Better: check if socket.handshake.query.userId === room.hostId

        room.settings = settings;
        room.players.forEach(p => p.ready = false);
        broadcastLobbyState(roomCode);
        sendSystemMessage(roomCode, `⚙️ Settings updated`);
    });

    socket.on("kick_player", ({ roomCode, targetUserId }) => {
        const room = liveRooms.get(roomCode);
        if (!room) return;

        // Host Check
        if (room.hostId !== userId) return;

        const playerIdx = room.players.findIndex(p => p.userId === targetUserId);
        if (playerIdx === -1) return;

        const player = room.players[playerIdx];
        const targetSocketId = player.socketId;

        // Remove
        room.players.splice(playerIdx, 1);

        // Notify Target
        io.to(targetSocketId).emit("kicked_from_lobby");
        io.sockets.sockets.get(targetSocketId)?.leave(roomCode);

        // Notify Room
        sendSystemMessage(roomCode, `❌ ${player.username} was removed by host`);
        broadcastLobbyState(roomCode);
    });

    /* ---------- PLAYER ACTIONS ---------- */
    socket.on("toggle_ready", ({ roomCode }) => {
        const room = liveRooms.get(roomCode);
        if (!room) return;

        const player = room.players.find(p => p.userId === userId);
        if (player) {
            player.ready = !player.ready;
            broadcastLobbyState(roomCode);

            // Check if all ready
            const allReady = room.players.length >= 2 && room.players.every(p => p.ready);
            if (allReady) {
                sendSystemMessage(roomCode, `✅ All players are ready!`);
            }
        }
    });

    socket.on("invite_friend", ({ toUserId, roomCode }) => {
        const targetSocketId = userSockets.get(toUserId);
        const room = liveRooms.get(roomCode);

        if (targetSocketId) {
            io.to(targetSocketId).emit("invite_received", {
                roomId: roomCode,
                roomName: room?.settings?.difficulty ? `${room.settings.difficulty} Room` : "Game Room",
                from: { username: username }
            });
            // Optional: Notify sender/room?
        }
    });

    socket.on("start_game", ({ roomCode }) => {
        const room = liveRooms.get(roomCode);
        if (!room || room.hostId !== userId) return;

        room.status = 'starting';
        broadcastLobbyState(roomCode);
        sendSystemMessage(roomCode, `🎮 Game Starting!`);

        // Simulate start delay
        setTimeout(() => {
            room.status = 'started';
            io.to(roomCode).emit("game_started"); // Frontend should nav to /game/:id
        }, 1000);
    });

    /* ---------- LEAVE / DISCONNECT ---------- */
    const handleLeave = () => {
        // userSockets Map Cleanup
        if (userId) {
            userSockets.delete(userId);
            io.emit('online_users', Array.from(userSockets.keys()));
        }

        // Room Cleanup
        for (const [code, room] of liveRooms.entries()) {
            const index = room.players.findIndex(p => p.socketId === socket.id);
            if (index !== -1) {
                const p = room.players[index];
                room.players.splice(index, 1);
                sendSystemMessage(code, `🔴 ${p.username} left`);

                if (room.players.length === 0) {
                    liveRooms.delete(code);
                } else {
                    if (room.hostId === p.userId) {
                        room.hostId = room.players[0].userId;
                        sendSystemMessage(code, `👑 Host migrated to ${room.players[0].username}`);
                    }
                    broadcastLobbyState(code);
                }
                break;
            }
        }
    };

    socket.on("leave_lobby", handleLeave);
    socket.on("disconnect", handleLeave);

    /* ---------- CHAT ---------- */
    socket.on("chat:send", ({ roomCode, message }) => {
        io.to(roomCode).emit("chat:receive", {
            id: Date.now(),
            user: username, // Trusted from handshake
            message,
            time: new Date().toISOString()
        });
    });
});

/* ---------------- ROUTES ---------------- */
app.get("/", (req, res) => res.send("Word Imposter API running"));

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
app.use("/api/profile", profileRoutes);
app.use("/api/account", accountRoutes);
app.use("/api/friends", friendRoutes);
app.use("/api/messages", messageRoutes);

/* ---------------- SERVER START ---------------- */
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
