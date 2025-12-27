import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import http from "http";
import { Server } from "socket.io";
import connectDB from "./db.js";
import Room from "./models/Room.js";

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

import { GameManager } from "./game/GameManager.js";

/* ---------------- GLOBAL STATE ---------------- */
const liveRooms = new Map();
const gameManagers = new Map(); // roomCode -> GameManager instance
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
    const sendSystemMessage = (roomCode, message, type = 'info') => {
        io.to(roomCode).emit("chat:receive", {
            id: Date.now(),
            user: "SYSTEM",
            message,
            type, // 'join', 'leave', 'settings', 'game', 'kick', 'info'
            time: new Date().toISOString(),
            isSystem: true
        });
    };

    /* ---------- JOIN LOBBY ---------- */
    socket.on("join_lobby", async ({ roomCode, userId, username, avatar }) => {
        if (!roomCode || !userId) return;

        console.log(`[JOIN_LOBBY] Request for Room: ${roomCode}, User: ${userId}`);

        socket.join(roomCode);

        // CREATE ROOM (Initialize State from DB if not exists)
        if (!liveRooms.has(roomCode)) {
            try {
                const dbRoom = await Room.findOne({ join_code: roomCode });
                if (dbRoom) {
                    liveRooms.set(roomCode, {
                        roomCode,
                        hostId: dbRoom.owner_id.toString(),
                        settings: {
                            difficulty: dbRoom.word_difficulty,
                            rounds: dbRoom.num_rounds,
                            responseTime: dbRoom.response_time,
                            votingTime: dbRoom.voting_time,
                            customWords: dbRoom.custom_words || []
                        },
                        players: [],
                        status: 'waiting'
                    });
                    console.log(`[JOIN_LOBBY] Lobby Initialized from DB: ${roomCode}`);
                } else {
                    // Fallback
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
                    console.log(`[JOIN_LOBBY] Lobby Initialized (Fallback): ${roomCode}`);
                }
            } catch (error) {
                console.error("[JOIN_LOBBY] Error fetching room from DB:", error);
                // Even on error, create a temporary fallback so user isn't stuck
                liveRooms.set(roomCode, {
                    roomCode,
                    hostId: userId,
                    settings: { difficulty: "medium", rounds: 5, responseTime: 40, votingTime: 20 },
                    players: [],
                    status: 'waiting'
                });
            }
        }

        const room = liveRooms.get(roomCode);
        if (!room) {
            console.error(`[JOIN_LOBBY] Critical: Room ${roomCode} undefined after creation attempt.`);
            return;
        }
        const existingPlayer = room.players.find(p => p.userId === userId);

        if (existingPlayer) {
            existingPlayer.socketId = socket.id;
            // Don't overwrite displayName on rejoin if already set, unless null
            // existingPlayer.displayName persists
            existingPlayer.username = username; // Internal update
            existingPlayer.avatar = avatar;

            // Re-emit state so client knows their current confirmed display name
            socket.emit("lobby_state", {
                roomCode: room.roomCode,
                hostId: room.hostId,
                settings: room.settings,
                players: room.players,
                status: room.status
            });

            // If game is active, reconnect to game state
            const mgr = gameManagers.get(roomCode);
            if (mgr) {
                const privateState = mgr.getPrivateState(userId);
                socket.emit("game_state_update", privateState);
            }

        } else {
            room.players.push({
                userId,
                username, // Internal
                displayName: null, // Must be set by client
                avatar,
                socketId: socket.id,
                ready: false
            });
            broadcastLobbyState(roomCode);
        }
    });

    /* ---------- DISPLAY NAME UPDATE ---------- */
    socket.on("update_display_name", ({ roomCode, displayName }) => {
        const room = liveRooms.get(roomCode);
        if (!room) return;

        const player = room.players.find(p => p.socketId === socket.id);
        if (!player) return;

        // Validation
        const cleanName = displayName?.trim();
        if (!cleanName || cleanName.length < 2 || cleanName.length > 16) {
            socket.emit("display_name_error", "Name must be 2-16 characters");
            return;
        }

        const isTaken = room.players.some(p => p.displayName?.toLowerCase() === cleanName.toLowerCase() && p.userId !== player.userId);
        if (isTaken) {
            socket.emit("display_name_error", "Name already taken in this room");
            return;
        }

        const oldName = player.displayName;
        player.displayName = cleanName;

        broadcastLobbyState(roomCode);
        socket.emit("display_name_success", cleanName);

        if (oldName) {
            sendSystemMessage(roomCode, `✏️ **${oldName}** is now known as **${cleanName}**`, 'info');
        } else {
            sendSystemMessage(roomCode, `🟢 **${cleanName}** joined the room`, 'join');
        }
    });


    /* ---------- LOBBY ACTIONS (HOST) ---------- */
    socket.on("update_lobby_settings", ({ roomCode, settings }) => {
        const room = liveRooms.get(roomCode);
        // Basic host auth check
        const player = room?.players.find(p => p.socketId === socket.id);
        if (!room || room.hostId !== player?.userId) return;

        room.settings = settings;
        room.players.forEach(p => p.ready = false);
        broadcastLobbyState(roomCode);
        sendSystemMessage(roomCode, `⚙️ Settings updated by Host`, 'settings');
    });

    socket.on("kick_player", ({ roomCode, targetUserId }) => {
        const room = liveRooms.get(roomCode);
        if (!room) return;

        const hostPlayer = room.players.find(p => p.socketId === socket.id);
        if (room.hostId !== hostPlayer?.userId) return;

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
        sendSystemMessage(roomCode, `❌ **${player.displayName || player.username}** was removed by host`, 'kick');
        broadcastLobbyState(roomCode);
    });

    /* ---------- PLAYER ACTIONS ---------- */
    socket.on("toggle_ready", ({ roomCode }) => {
        const room = liveRooms.get(roomCode);
        if (!room) return;

        const player = room.players.find(p => p.socketId === socket.id);
        if (player) {
            if (!player.displayName) return; // Enforce name

            player.ready = !player.ready;
            broadcastLobbyState(roomCode);

            // Notify room of ready status change
            const statusIcon = player.ready ? "✅" : "⏸️";
            const statusText = player.ready ? "is Ready" : "is Not Ready";
            sendSystemMessage(roomCode, `${statusIcon} **${player.displayName}** ${statusText}`, 'info');

            // Check if all ready
            const allReady = room.players.length >= 2 && room.players.every(p => p.ready);
            if (allReady) {
                sendSystemMessage(roomCode, `🎮 All players are ready`, 'game');
            }
        }
    });

    socket.on("invite_friend", ({ toUserId, roomCode }) => {
        const targetSocketId = userSockets.get(toUserId);
        const room = liveRooms.get(roomCode);

        if (targetSocketId) {
            const sender = room?.players.find(p => p.socketId === socket.id);
            io.to(targetSocketId).emit("invite_received", {
                roomId: roomCode,
                roomName: room?.settings?.difficulty ? `${room.settings.difficulty} Room` : "Game Room",
                from: { username: sender?.displayName || "A friend" }
            });
        }
    });

    socket.on("start_game", ({ roomCode }) => {
        const room = liveRooms.get(roomCode);
        const player = room?.players.find(p => p.socketId === socket.id);
        if (!room || room.hostId !== player?.userId) return;

        // RULES CHECK
        if (room.players.length < 3) {
            sendSystemMessage(roomCode, `⚠️ Minimum 3 players required to start!`, 'kick');
            return;
        }

        const allReady = room.players.every(p => p.ready);
        if (!allReady) {
            sendSystemMessage(roomCode, `⚠️ All players must be READY to start!`, 'kick');
            return;
        }

        room.status = 'starting';
        broadcastLobbyState(roomCode);
        sendSystemMessage(roomCode, `🚀 Game starting...`, 'game');

        // Simulate start delay
        setTimeout(() => {
            room.status = 'started';
            // Start Game Engine
            const manager = new GameManager(io, roomCode, room);
            gameManagers.set(roomCode, manager);
            manager.startGame();

            io.to(roomCode).emit("game_started");
        }, 4000);
    });

    /* ---------- GAME PLAY ACTIONS ---------- */
    socket.on("game:submit_response", ({ roomCode, response }) => {
        const manager = gameManagers.get(roomCode);
        if (!manager) return;

        const room = liveRooms.get(roomCode);
        const player = room?.players.find(p => p.socketId === socket.id);
        if (player) {
            manager.handleResponse(player.userId, response);
        }
    });

    socket.on("game:submit_vote", ({ roomCode, targetUserId }) => {
        const manager = gameManagers.get(roomCode);
        if (!manager) return;

        const room = liveRooms.get(roomCode);
        const player = room?.players.find(p => p.socketId === socket.id);
        if (player) {
            manager.handleVote(player.userId, targetUserId);
        }
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

                // Only announce leave if they had a name (fully joined)
                if (p.displayName) {
                    sendSystemMessage(code, `🔴 **${p.displayName}** left`, 'leave');
                }

                if (room.players.length === 0) {
                    liveRooms.delete(code);
                    gameManagers.delete(code); // Cleanup Game Manager
                } else {
                    if (room.hostId === p.userId) {
                        room.hostId = room.players[0].userId;
                        sendSystemMessage(code, `👑 Host migrated to **${room.players[0].displayName}**`, 'settings');
                    }
                    broadcastLobbyState(code);
                }
                break;
            }
        }
    };

    socket.on("leave_lobby", handleLeave);
    socket.on("disconnect", handleLeave);

    /* ---------- CHAT RATE LIMITER ---------- */
    const chatRateLimits = new Map(); // socketId -> timestamp

    /* ---------- CHAT ---------- */
    socket.on("chat:send", ({ roomCode, message }) => {
        const room = liveRooms.get(roomCode);
        if (!room) return;

        // Rate Limit Check (500ms)
        const lastTime = chatRateLimits.get(socket.id) || 0;
        const now = Date.now();
        if (now - lastTime < 500) return; // Silent drop or could emit warning
        chatRateLimits.set(socket.id, now);

        const player = room.players.find(p => p.socketId === socket.id);

        if (!player || !player.displayName) return; // Enforce name

        io.to(roomCode).emit("chat:receive", {
            id: Date.now(),
            user: player.displayName, // Use Display Name
            message: message.slice(0, 200), // Max length
            time: new Date().toISOString()
        });
    });

    socket.on("chat:typing", ({ roomCode }) => {
        const room = liveRooms.get(roomCode);
        const player = room?.players.find(p => p.socketId === socket.id);
        if (player && player.displayName) {
            socket.to(roomCode).emit("chat:typing", { username: player.displayName });
        }
    });

    socket.on("chat:stop_typing", ({ roomCode }) => {
        const room = liveRooms.get(roomCode);
        const player = room?.players.find(p => p.socketId === socket.id);
        if (player && player.displayName) {
            socket.to(roomCode).emit("chat:stop_typing", { username: player.displayName });
        }
    });

    socket.on("chat:react", ({ roomCode, messageId, reaction }) => {
        const room = liveRooms.get(roomCode);
        const player = room?.players.find(p => p.socketId === socket.id);

        // console.log(`[CHAT_REACT] ${player?.username} reacted ${reaction} to ${messageId}`);

        if (player && player.displayName) {
            io.to(roomCode).emit("chat:react", {
                messageId,
                reaction,
                user: player.displayName
            });
        }
    });

    /* ---------- CLOSE ROOM (HOST) ---------- */
    socket.on("close_room", ({ roomCode }) => {
        const room = liveRooms.get(roomCode);
        if (!room) return;

        const player = room.players.find(p => p.socketId === socket.id);
        if (!player || room.hostId !== player.userId) return; // Host only

        // Notify all players
        io.to(roomCode).emit("room_closed");

        // Force leave everyone
        room.players.forEach(p => {
            io.sockets.sockets.get(p.socketId)?.leave(roomCode);
        });

        liveRooms.delete(roomCode);
        gameManagers.delete(roomCode); // Cleanup Game Manager
        console.log(`[CLOSE_ROOM] Room ${roomCode} closed by host ${player.username}`);
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
