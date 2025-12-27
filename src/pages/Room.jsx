import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useSocket } from '../hooks/useSocket';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { Copy, ArrowLeft, Gamepad2, Users, MessageSquare, Settings, ScanLine, LogOut, XCircle } from 'lucide-react';
import QRCode from "react-qr-code";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";

// Components - Named Imports
import { LobbyPlayers } from '@/components/lobby/LobbyPlayers';
import { LobbyChat } from '@/components/lobby/LobbyChat';
import { LobbySettingsDrawer } from '@/components/lobby/LobbySettingsDrawer';
import DisplayNameModal from '@/components/game/DisplayNameModal';
import { LiveGameSummary } from '@/components/lobby/LiveGameSummary';
import { GameRules } from '@/components/lobby/GameRules';
import { RulesModal } from '../components/game/RulesModal';

const Room = () => {
    // 1. Correct Param Extraction
    const { roomId: roomCode } = useParams();
    const { user } = useAuth();
    const { socket } = useSocket();
    const navigate = useNavigate();

    // Lobby State
    const [lobbyState, setLobbyState] = useState(null);
    const [messages, setMessages] = useState([]);
    const [showQR, setShowQR] = useState(false);
    const [showLeaveAlert, setShowLeaveAlert] = useState(false);
    const [activeTab, setActiveTab] = useState('lobby'); // 'players', 'lobby', 'chat'
    const [startCountdown, setStartCountdown] = useState(null);

    // UI State
    const [showNameModal, setShowNameModal] = useState(false);

    // Derived State
    const isHost = lobbyState?.hostId === user?._id;
    const players = lobbyState?.players || [];
    const settings = lobbyState?.settings || {};
    const me = players.find(p => p.userId === user?._id);
    const myDisplayName = me?.displayName;

    useEffect(() => {
        if (!socket || !user || !roomCode) return;

        // JOIN
        socket.emit("join_lobby", {
            roomCode,
            userId: user._id,
            username: user.username,
            avatar: user.avatar
        });

        // LISTENERS
        socket.on("lobby_state", (state) => {
            // console.log("Lobby State Received:", state);
            setLobbyState(state);
            if (state.status === 'started') {
                navigate(`/game/${roomCode}`);
            }
        });

        socket.on("chat:receive", (msg) => {
            setMessages(prev => [...prev, msg]);
        });

        socket.on("chat:react", ({ messageId, reaction, user }) => {
            setMessages(prev => prev.map(msg => {
                if (msg.id === messageId) {
                    const existing = msg.reactions || {};
                    const count = existing[reaction] || 0;
                    return {
                        ...msg,
                        reactions: { ...existing, [reaction]: count + 1 }
                    };
                }
                return msg;
            }));
        });

        socket.on("kicked_from_lobby", () => {
            toast.error("You have been kicked from the lobby.");
            navigate('/');
        });

        socket.on("game_started", () => {
            navigate(`/game/${roomCode}`);
        });

        socket.on("room_closed", () => {
            toast.info("The host has closed the room.");
            navigate('/');
        });

        return () => {
            socket.off("lobby_state");
            socket.off("chat:receive");
            socket.off("chat:react");
            socket.off("kicked_from_lobby");
            socket.off("game_started");
            socket.off("room_closed");
            socket.emit("leave_lobby");
        };
    }, [socket, user, roomCode, navigate]);

    // Countdown Effect
    useEffect(() => {
        if (lobbyState?.status === 'starting') {
            setStartCountdown(3);
            const interval = setInterval(() => {
                setStartCountdown(prev => {
                    if (prev <= 1) {
                        clearInterval(interval);
                        return "GO!";
                    }
                    return prev - 1;
                });
            }, 1000);
            return () => clearInterval(interval);
        }
    }, [lobbyState?.status]);

    // Name Modal Trigger
    useEffect(() => {
        if (lobbyState && me && !me.displayName) {
            setShowNameModal(true);
        } else {
            setShowNameModal(false);
        }
    }, [lobbyState, me]);


    // Handlers
    const handleCopyCode = () => {
        navigator.clipboard.writeText(roomCode);
        toast.success("Room code copied!");
    };

    const handleStartGame = () => {
        if (!isHost) return;
        socket.emit("start_game", { roomCode });
    };

    const handleLeaveClick = () => {
        setShowLeaveAlert(true);
    };

    const handleConfirmedLeave = () => {
        if (isHost) {
            socket.emit("close_room", { roomCode });
        } else {
            socket.emit("leave_lobby", { roomCode });
            navigate('/');
        }
        setShowLeaveAlert(false);
    };

    const handleSendMessage = (text) => {
        if (!text.trim()) return;
        socket.emit("chat:send", { roomCode, message: text });
    };

    // 2. Safe Settings Defaulting (Prevent Crash on Slider)
    const safeSettings = {
        difficulty: settings?.difficulty || "medium",
        rounds: settings?.rounds || 5,
        responseTime: settings?.responseTime || 40,
        votingTime: settings?.votingTime || 20,
        ...settings
    };

    // 3. Loading State
    if (!lobbyState) {
        return (
            <div className="flex h-screen items-center justify-center bg-black text-white">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
                    <p className="text-zinc-400 animate-pulse">Connecting to Lobby {roomCode}...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-black text-white font-sans selection:bg-purple-500/30 overflow-hidden relative">
            <AnimatePresence>
                {startCountdown && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-xl flex items-center justify-center pointer-events-none"
                    >
                        <motion.div
                            key={startCountdown}
                            initial={{ scale: 0.5, opacity: 0 }}
                            animate={{ scale: 1.5, opacity: 1 }}
                            exit={{ scale: 2, opacity: 0 }}
                            className="text-9xl md:text-[12rem] font-black text-transparent bg-clip-text bg-gradient-to-br from-cyan-400 via-purple-500 to-pink-500 drop-shadow-[0_0_50px_rgba(168,85,247,0.5)]"
                        >
                            {startCountdown}
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
            <DisplayNameModal
                isOpen={showNameModal}
                roomCode={roomCode}
                currentName={user?.username} // Default suggestion
                onNameSet={() => setShowNameModal(false)}
            />

            {/* HEADER - Minimal */}
            <header className="border-b border-white/10 bg-black/50 backdrop-blur-md sticky top-0 z-10 h-14 flex items-center justify-between px-6">
                <div className="flex items-center gap-4">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={handleLeaveClick}
                        className="text-zinc-400 hover:text-red-500 hover:bg-red-500/10 transition-colors -ml-2"
                        title={isHost ? "Close Room" : "Leave Room"}
                    >
                        {isHost ? <XCircle className="w-5 h-5" /> : <LogOut className="w-5 h-5" />}
                    </Button>
                    <div className="flex items-center gap-2">
                        <span className="font-bold text-lg text-white">Waiting Lobby</span>
                        <div className={`w-2 h-2 rounded-full shadow-[0_0_8px_currentColor] ${lobbyState.status === 'waiting' ? 'bg-green-500 text-green-500' : 'bg-yellow-500 text-yellow-500'}`} />
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10">
                        <span className="text-xs font-bold text-zinc-400">YOU</span>
                        <div className="w-px h-3 bg-white/10" />
                        <span className="text-sm font-bold text-white max-w-[100px] truncate">{myDisplayName || user?.username}</span>
                    </div>
                    {/* Settings Drawer */}
                    <LobbySettingsDrawer
                        settings={safeSettings}
                        isHost={isHost}
                        roomCode={roomCode}
                        onUpdate={(newSettings) => socket.emit("update_lobby_settings", { roomCode, settings: newSettings })}
                    />
                </div>
            </header>

            {/* MAIN CONTENT - Responsive Layout */}
            <main className="max-w-[1600px] mx-auto p-4 lg:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 h-[calc(100vh-120px)] lg:h-[calc(100vh-56px)]">

                {/* LEFT: Players (Mobile Tab: players) */}
                <div className={`${activeTab === 'players' ? 'flex' : 'hidden'} lg:flex lg:col-span-3 flex-col h-full overflow-hidden`}>
                    <div className="flex items-center justify-between mb-4 px-1">
                        <h2 className="flex items-center gap-2 text-sm font-bold text-zinc-400 uppercase tracking-wider">
                            <Users className="w-4 h-4" />
                            Players ({players.length}/3)
                        </h2>
                        <Button size="sm" variant="ghost" onClick={() => toast.info("Invite feature coming soon")} className="h-6 text-xs px-2 hover:bg-white/10 text-zinc-500 hover:text-white">
                            <Users className="w-3 h-3 mr-1" /> Invite
                        </Button>
                    </div>
                    <Card className="flex-1 bg-zinc-900/40 border-white/5 overflow-hidden flex flex-col p-2">
                        <LobbyPlayers
                            players={players}
                            currentUserId={user._id}
                            isHost={isHost}
                            roomCode={roomCode}
                            hostId={lobbyState.hostId}
                            onToggleReady={() => socket.emit("toggle_ready", { roomCode })}
                            onWarn={(uid, name) => toast.message(`Warning sent to ${name}`)}
                            onKick={(uid) => socket.emit("kick_player", { roomCode, targetUserId: uid })}
                            onInvite={() => toast.info("Invite feature coming soon")}
                        />
                    </Card>
                </div>

                {/* CENTER: The Stage (Mobile Tab: lobby) */}
                <div className={`${activeTab === 'lobby' ? 'flex' : 'hidden'} lg:flex lg:col-span-6 flex-col h-full overflow-y-auto custom-scrollbar px-4 pb-20`}>
                    <div className="flex-1 flex flex-col items-center py-12 space-y-8 min-h-max">

                        {/* 1. ROOM CODE CARD - Visual Anchor */}
                        <div className="w-full max-w-lg relative group">
                            {/* Gradient Glow Background */}
                            <div className="absolute -inset-0.5 bg-gradient-to-r from-cyan-500 via-purple-500 to-pink-500 rounded-2xl opacity-20 group-hover:opacity-60 blur-xl transition-all duration-700" />

                            <Card
                                className="relative bg-zinc-950/90 border-white/10 overflow-hidden backdrop-blur-xl transition-all duration-300 group-hover:scale-[1.02] group-hover:border-white/20"
                                onClick={handleCopyCode}
                            >
                                {/* Decorative Top Bar */}
                                <div className="h-1 w-full bg-gradient-to-r from-cyan-500 via-purple-500 to-pink-500 opacity-50" />

                                <div className="p-8 md:p-10 flex flex-col items-center justify-center cursor-pointer">

                                    {/* Label */}
                                    <div className="flex items-center gap-2 mb-6 text-zinc-400 bg-white/5 px-4 py-1.5 rounded-full border border-white/5 shadow-sm">
                                        <Gamepad2 className="w-3.5 h-3.5" />
                                        <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-zinc-300">Room Access Code</span>
                                    </div>

                                    {/* The Code */}
                                    <div className="relative group/code">
                                        <div className="text-6xl md:text-7xl font-mono font-black text-white tracking-[0.1em] drop-shadow-2xl z-10 relative text-center">
                                            {roomCode}
                                        </div>
                                    </div>

                                    {/* Copy Hint */}
                                    <div className="mt-8 flex items-center justify-center gap-4">
                                        <div className="flex items-center gap-2 text-zinc-500 text-sm group-hover:text-cyan-400 transition-colors duration-300 bg-black/40 px-4 py-2 rounded-lg border border-transparent group-hover:border-cyan-500/20">
                                            <Copy className="w-4 h-4 animate-pulse" />
                                            <span className="font-semibold tracking-wide">CLICK TO COPY</span>
                                        </div>

                                        <div className="w-px h-8 bg-white/10" />

                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="text-zinc-500 hover:text-white hover:bg-white/5 gap-2"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setShowQR(true);
                                            }}
                                        >
                                            <ScanLine className="w-4 h-4" />
                                            <span className="text-xs font-bold">SCAN QR</span>
                                        </Button>
                                    </div>
                                </div>
                            </Card>
                        </div>

                        {/* 2. LIVE GAME SUMMARY - Horizontal Strip */}
                        <div className="w-full max-w-lg">
                            <LiveGameSummary settings={safeSettings} />
                        </div>

                        {/* 3. GAME RULES - Collapsible */}
                        <div className="w-full max-w-lg">
                            <GameRules
                                isHost={isHost}
                                onPostToChat={() => socket.emit("chat:send", { roomCode, message: "📜 **GAME RULES**:\n1. Min 3 Players\n2. One Imposter (knows nothing)\n3. Describe usage, but NOT the exact word!\n4. Imposter loses 50% pts if they say the word." })}
                            />
                        </div>

                        {/* 4. ACTIONS */}
                        <div className="w-full max-w-sm pt-4">
                            {isHost ? (
                                <Button
                                    size="lg"
                                    className="w-full h-14 text-xl font-bold bg-white text-black hover:bg-zinc-200 transition-all shadow-[0_0_20px_rgba(255,255,255,0.1)] hover:shadow-[0_0_30px_rgba(255,255,255,0.2)] disabled:opacity-50 disabled:cursor-not-allowed"
                                    onClick={handleStartGame}
                                    disabled={players.length < 3 || players.some(p => !p.ready)}
                                >
                                    {players.length < 3 ? `Waiting for players (${players.length}/3)` :
                                        players.some(p => !p.ready) ? 'Waiting for Ready...' : 'START GAME'}
                                </Button>
                            ) : (
                                <div className="bg-zinc-800/50 rounded-lg p-4 text-center border border-white/5 animate-pulse">
                                    <div className="font-bold text-zinc-300">Waiting for host to start</div>
                                    <div className="text-xs text-zinc-500 mt-1">Found {players.length} players so far</div>
                                </div>
                            )}
                        </div>

                    </div>
                </div>

                {/* RIGHT: Chat (Mobile Tab: chat) */}
                <div className={`${activeTab === 'chat' ? 'flex' : 'hidden'} lg:flex lg:col-span-3 flex-col h-full overflow-hidden`}>
                    <div className="flex items-center justify-between mb-4 px-1">
                        <h2 className="flex items-center gap-2 text-sm font-bold text-zinc-400 uppercase tracking-wider">
                            <MessageSquare className="w-4 h-4" />
                            Live Chat
                        </h2>
                    </div>
                    <Card className="flex-1 bg-zinc-900/40 border-white/5 overflow-hidden flex flex-col shadow-inner">
                        <div className="flex-1 min-h-0 relative">
                            <LobbyChat
                                messages={messages}
                                onSendMessage={handleSendMessage}
                                onSendReaction={(msgId, reaction) => socket.emit("chat:react", { roomCode, messageId: msgId, reaction })}
                                currentUser={{ username: myDisplayName }}
                                roomCode={roomCode}
                                isHost={isHost}
                            />
                        </div>
                    </Card>
                </div>

            </main>

            {/* MOBILE BOTTOM NAV */}
            <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-zinc-950 border-t border-white/10 px-6 py-4 flex items-center justify-between z-50 pb-safe">
                <button
                    onClick={() => setActiveTab('players')}
                    className={`flex flex-col items-center gap-1 ${activeTab === 'players' ? 'text-white' : 'text-zinc-600'}`}
                >
                    <Users className="w-5 h-5" />
                    <span className="text-[10px] font-bold uppercase tracking-wider">Players</span>
                </button>

                <button
                    onClick={() => setActiveTab('lobby')}
                    className={`flex flex-col items-center gap-1 ${activeTab === 'lobby' ? 'text-cyan-400' : 'text-zinc-600'}`}
                >
                    <div className={`p-2 rounded-full ${activeTab === 'lobby' ? 'bg-cyan-500/10' : 'bg-transparent'} -mt-6 border border-zinc-800 bg-zinc-900`}>
                        <Gamepad2 className="w-6 h-6" />
                    </div>
                </button>

                <button
                    onClick={() => setActiveTab('chat')}
                    className={`flex flex-col items-center gap-1 ${activeTab === 'chat' ? 'text-white' : 'text-zinc-600'} relative`}
                >
                    <div className="relative">
                        <MessageSquare className="w-5 h-5" />
                        {messages.length > 0 && <div className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse" />}
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-wider">Chat</span>
                </button>
            </div>

            {/* QR Code Modal */}
            <Dialog open={showQR} onOpenChange={setShowQR}>
                <DialogContent className="bg-zinc-950 border-white/10 sm:max-w-xs shadow-2xl backdrop-blur-xl">
                    <DialogHeader>
                        <DialogTitle className="text-center text-xl font-black text-white tracking-wider uppercase">Join Room</DialogTitle>
                    </DialogHeader>
                    <div className="flex flex-col items-center justify-center p-4 space-y-6">
                        <div className="bg-white p-3 rounded-2xl shadow-[0_0_40px_-10px_rgba(255,255,255,0.3)]">
                            <QRCode
                                value={window.location.href}
                                size={200}
                                style={{ height: "auto", maxWidth: "100%", width: "100%" }}
                                viewBox={`0 0 256 256`}
                            />
                        </div>
                        <div className="text-center space-y-2">
                            <p className="text-zinc-300 font-bold text-lg">{roomCode}</p>
                            <p className="text-zinc-500 text-xs text-center px-4">
                                Scan this QR code with your camera to join this room instantly.
                            </p>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
            {/* Leave/Close Alert */}
            <AlertDialog open={showLeaveAlert} onOpenChange={setShowLeaveAlert}>
                <AlertDialogContent className="bg-zinc-950 border-white/10 text-white">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-xl font-bold">
                            {isHost ? 'Close Room?' : 'Leave Room?'}
                        </AlertDialogTitle>
                        <AlertDialogDescription className="text-zinc-400">
                            {isHost
                                ? "You are the host. Closing the room will kick all players and end the session. Are you sure?"
                                : "Are you sure you want to leave this lobby?"}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel className="bg-transparent border-white/10 hover:bg-white/5 hover:text-white text-zinc-400">Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleConfirmedLeave}
                            className="bg-red-600 hover:bg-red-700 text-white border-none"
                        >
                            {isHost ? 'Close Room' : 'Leave'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
};

export default Room;
