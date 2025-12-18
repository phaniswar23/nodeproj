import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useSocket } from '@/hooks/useSocket';
import { Header } from '@/components/home/Header';
import { GlassCard } from '@/components/ui/GlassCard';
import { GameButton } from '@/components/ui/GameButton';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import {
    Users, Crown, Copy, Play, LogOut, Settings, Clock, Check, Send, Lock, MessageSquare, Save, AlertTriangle
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { ScrollArea } from "@/components/ui/scroll-area";

const Room = () => {
    // Extract roomCode ONLY from URL
    const { roomId: roomCodeFromUrl } = useParams();
    const { user } = useAuth();
    const socket = useSocket();
    const navigate = useNavigate();

    // LOBBY STATE (Single Source of Truth)
    const [lobbyState, setLobbyState] = useState({
        roomCode: roomCodeFromUrl,
        hostId: '',
        players: [],
        settings: {
            difficulty: 'Medium',
            rounds: 5,
            responseTime: 40,
            votingTime: 20
        }
    });

    // UI State
    const [messages, setMessages] = useState([]);
    const [messageInput, setMessageInput] = useState("");
    const [loading, setLoading] = useState(true);
    const [showLeaveDialog, setShowLeaveDialog] = useState(false);
    const [copied, setCopied] = useState(false);
    const [draftSettings, setDraftSettings] = useState(lobbyState.settings);

    // Check if I am the host based on Lobby State
    const isHost = user && lobbyState.hostId === user._id;
    const hasUnsavedChanges = JSON.stringify(lobbyState.settings) !== JSON.stringify(draftSettings);

    const chatScrollRef = useRef(null);
    const joinedRef = useRef(false);

    // 1. Initial Load & Join (Immediate)
    useEffect(() => {
        if (!roomCodeFromUrl || !user || !socket) return;
        if (joinedRef.current) return;

        const joinLobby = () => {
            console.log("Joining lobby with code:", roomCodeFromUrl);
            // Emit join_lobby immediately using URL param
            socket.emit('join_lobby', {
                roomCode: roomCodeFromUrl,
                userId: user._id,
                username: user.username,
                avatar: user.avatar_url
            });

            joinedRef.current = true;
            setLoading(false); // Stop loading spinner immediately, UI will hydrate from socket event
        };

        joinLobby();

        // No cleanup to leave_lobby here to prevent accidental leaves on re-renders,
        // user must click Leave button or close tab (disconnect handles it).
    }, [roomCodeFromUrl, user, socket]);

    // 2. Socket Listeners (State Sync)
    useEffect(() => {
        if (!socket) return;

        socket.on('lobby_state', (state) => {
            console.log("Lobby State Updated:", state);
            setLobbyState(state);
            // Sync draft settings if invalid or if I am not host (view mode)
            // Or simplified: Just sync draft to incoming settings always (unless I am typing? slider doesn't lock usually)
            // Let's safe sync:
            // If I am host and hasUnsavedChanges is true, DO NOT overwrite my draft.
            // If I am NOT host, always overwrite.
            if (!isHost) {
                setDraftSettings(state.settings);
            }
        });

        socket.on('chat:receive', (msg) => {
            setMessages(prev => [...prev, msg]);
            setTimeout(() => chatScrollRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
        });

        return () => {
            socket.off('lobby_state');
            socket.off('chat:receive');
        };
    }, [socket, isHost]); // Re-bind if host status changes? Actually safe to keep live.

    const handleSaveSettings = () => {
        if (!socket || !lobbyState.roomCode) return;
        socket.emit('update_lobby_settings', {
            roomCode: lobbyState.roomCode,
            settings: draftSettings
        });
    };

    const handleDraftChange = (key, value) => {
        if (!isHost) return;
        setDraftSettings(prev => ({ ...prev, [key]: value }));
    };

    const handleToggleReady = () => {
        if (!socket || !lobbyState.roomCode) return;
        socket.emit('toggle_ready', { roomCode: lobbyState.roomCode });
    };

    const handleSendMessage = (e) => {
        e.preventDefault();
        if (!messageInput.trim() || !socket) return;
        socket.emit('chat:send', {
            roomCode: lobbyState.roomCode,
            user: { username: user.username },
            message: messageInput.trim()
        });
        setMessageInput("");
    };

    const handleLeaveRoom = () => {
        if (socket) socket.emit('leave_lobby');
        navigate('/');
    };

    const handleStartGame = () => {
        toast("Starting Game...");
        // Logic to emit start_game
    };

    const copyCode = () => {
        navigator.clipboard.writeText(roomCodeFromUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" /></div>;

    const players = lobbyState.players || [];
    const allReady = players.length >= 2 && players.every(p => p.ready);

    return (
        <div className="min-h-screen bg-background relative selection:bg-primary/30 pb-4 overflow-y-auto lg:overflow-hidden flex flex-col">
            <Header />

            <main className="pt-24 px-4 flex-1 container mx-auto max-w-[1400px] grid grid-cols-1 lg:grid-cols-12 gap-6 h-auto lg:h-[calc(100vh-20px)] pb-20 lg:pb-0">

                {/* 1. PLAYERS PANEL */}
                <div className="lg:col-span-3 flex flex-col gap-4 min-h-0 bg-secondary/5 rounded-2xl p-4 border border-white/5">
                    <div className="flex items-center justify-between pb-2 border-b border-white/5">
                        <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                            <Users className="w-4 h-4" /> Players <span className="text-white">{players.length}</span>
                        </h2>
                    </div>
                    <ScrollArea className="flex-1 -mr-3 pr-3">
                        <div className="flex flex-col gap-3">
                            {players.map((p) => (
                                <GlassCard
                                    key={p.userId}
                                    className={cn(
                                        "p-3 flex items-center gap-3 relative transition-all duration-300 border-l-4",
                                        p.userId === user._id ? "bg-primary/5 border-l-primary" : "border-l-transparent hover:bg-white/5",
                                        p.ready ? "border-l-green-500 bg-green-500/5" : ""
                                    )}
                                >
                                    <Avatar className="w-10 h-10 ring-2 ring-white/10">
                                        <AvatarFallback className="bg-primary/20 text-primary font-bold text-xs">
                                            {p.username?.[0]?.toUpperCase()}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <span className="font-bold text-sm text-white truncate">{p.username}</span>
                                            {lobbyState.hostId === p.userId && <Crown className="w-3 h-3 text-yellow-500 fill-yellow-500/20" />}
                                            {p.userId === user._id && <span className="text-[10px] bg-white/10 px-1 rounded text-gray-400">YOU</span>}
                                        </div>
                                        <div className={cn("text-[10px] font-bold uppercase", p.ready ? "text-green-400" : "text-gray-500")}>
                                            {p.ready ? "Ready" : "Not Ready"}
                                        </div>
                                    </div>
                                    {p.userId === user._id && (
                                        <button
                                            onClick={handleToggleReady}
                                            className={cn(
                                                "w-6 h-6 rounded-full flex items-center justify-center border transition-all",
                                                p.ready ? "bg-green-500 border-green-500 text-black" : "border-white/20 hover:border-white/50 text-transparent hover:text-white/20"
                                            )}
                                        >
                                            <Check className="w-3 h-3" />
                                        </button>
                                    )}
                                </GlassCard>
                            ))}
                        </div>
                    </ScrollArea>
                </div>

                {/* 2. LOBBY CORE */}
                <div className="lg:col-span-5 flex flex-col items-center justify-center gap-8 relative py-8">
                    <div className="text-center space-y-4 w-full max-w-md">
                        <Badge variant="outline" className="animate-pulse border-primary/20 text-primary">
                            Waiting for players
                        </Badge>
                        <h1 className="text-5xl font-heading font-black tracking-tighter text-white">
                            Word Imposter
                        </h1>
                        <div
                            onClick={copyCode}
                            className="group relative flex items-center gap-4 bg-black/40 hover:bg-black/60 border border-white/10 px-8 py-4 rounded-2xl cursor-pointer transition-all hover:scale-105"
                        >
                            <div className="text-left">
                                <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Join Code</div>
                                <div className="text-3xl font-mono font-bold tracking-[0.2em] text-white group-hover:text-primary transition-colors">
                                    {roomCodeFromUrl}
                                </div>
                            </div>
                            {copied ? <Check className="w-6 h-6 text-green-500" /> : <Copy className="w-6 h-6 text-gray-400 group-hover:text-white" />}
                        </div>
                    </div>

                    <div className="w-full max-w-sm space-y-3">
                        {isHost ? (
                            <GameButton
                                size="xl"
                                className="w-full py-8 text-xl shadow-2xl shadow-primary/20"
                                disabled={!allReady}
                                onClick={handleStartGame}
                            >
                                START GAME
                            </GameButton>
                        ) : (
                            <div className="text-center p-4 bg-white/5 rounded-xl border border-white/5">
                                <p className="text-sm font-bold text-gray-400">Waiting for host to start...</p>
                            </div>
                        )}
                        {!isHost && !allReady && players.length > 1 && (
                            <p className="text-center text-xs text-orange-400 mt-2">Waiting for all players to ready up</p>
                        )}

                        <button
                            onClick={handleLeaveRoom}
                            className="w-full py-3 text-xs font-bold text-gray-500 hover:text-white hover:bg-white/5 rounded-xl transition-colors flex items-center justify-center gap-2"
                        >
                            <LogOut className="w-3 h-3" /> Leave Lobby
                        </button>
                    </div>
                </div>

                {/* 3. SETTINGS & CHAT */}
                <div className="lg:col-span-4 flex flex-col gap-4 min-h-0">
                    {/* SETTINGS PANEL */}
                    <GlassCard className="p-4 space-y-4 bg-card/30 backdrop-blur-md flex-1 flex flex-col">
                        <div className="flex items-center justify-between pb-2 border-b border-white/5">
                            <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                                <Settings className="w-3 h-3" /> Lobby Settings
                            </h2>
                            {!isHost && <Lock className="w-3 h-3 text-gray-500" />}
                        </div>

                        <div className="space-y-4 flex-1">
                            {/* Difficulty */}
                            <div className="space-y-2">
                                <span className="text-[10px] font-bold text-gray-500 uppercase">Difficulty</span>
                                <div className="grid grid-cols-3 gap-1 bg-black/20 p-1 rounded-lg">
                                    {['Easy', 'Medium', 'Hard'].map((d) => (
                                        <button
                                            key={d}
                                            onClick={() => handleDraftChange('difficulty', d)}
                                            disabled={!isHost}
                                            className={cn(
                                                "py-1.5 rounded text-[10px] font-bold transition-all",
                                                draftSettings.difficulty === d
                                                    ? "bg-primary text-primary-foreground shadow-lg"
                                                    : "text-gray-500 hover:text-gray-300"
                                            )}
                                        >
                                            {d}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Rounds */}
                            <div className="space-y-2">
                                <div className="flex justify-between text-xs">
                                    <span className="text-gray-400">Rounds</span>
                                    <span className="font-mono text-white">{draftSettings.rounds}</span>
                                </div>
                                <input
                                    type="range" min="1" max="10"
                                    value={draftSettings.rounds}
                                    onChange={(e) => handleDraftChange('rounds', parseInt(e.target.value))}
                                    disabled={!isHost}
                                    className="w-full accent-primary h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer"
                                />
                            </div>

                            {/* Timers */}
                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1">
                                    <span className="text-[10px] text-gray-500 uppercase">Response</span>
                                    <input
                                        type="number"
                                        value={draftSettings.responseTime}
                                        onChange={(e) => handleDraftChange('responseTime', parseInt(e.target.value))}
                                        disabled={!isHost}
                                        className="w-full bg-white/5 border border-white/10 rounded px-2 py-1 text-xs text-center font-mono focus:outline-none"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <span className="text-[10px] text-gray-500 uppercase">Voting</span>
                                    <input
                                        type="number"
                                        value={draftSettings.votingTime}
                                        onChange={(e) => handleDraftChange('votingTime', parseInt(e.target.value))}
                                        disabled={!isHost}
                                        className="w-full bg-white/5 border border-white/10 rounded px-2 py-1 text-xs text-center font-mono focus:outline-none"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* SAVE BUTTON */}
                        {isHost && (
                            <button
                                onClick={handleSaveSettings}
                                disabled={!hasUnsavedChanges}
                                className={cn(
                                    "w-full py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-all",
                                    hasUnsavedChanges
                                        ? "bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/20"
                                        : "bg-white/5 text-gray-500 cursor-not-allowed"
                                )}
                            >
                                {hasUnsavedChanges ? (
                                    <>
                                        <AlertTriangle className="w-3 h-3 text-yellow-300" /> Save Changes
                                    </>
                                ) : (
                                    <>
                                        <Save className="w-3 h-3" /> Saved
                                    </>
                                )}
                            </button>
                        )}
                    </GlassCard>

                    {/* CHAT PANEL */}
                    <GlassCard className="flex-[1.5] flex flex-col min-h-0 bg-black/40 border-white/10 overflow-hidden">
                        <div className="p-3 border-b border-white/5 flex items-center gap-2">
                            <MessageSquare className="w-3 h-3 text-primary" />
                            <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Chat</span>
                        </div>
                        <ScrollArea className="flex-1 p-3">
                            <div className="space-y-2">
                                {messages.map((msg, i) => (
                                    <div key={i} className={cn("flex flex-col", msg.user === user.username ? "items-end" : "items-start")}>
                                        <div className="flex items-center gap-1.5 mb-0.5">
                                            <span className="text-[10px] font-bold text-gray-500">{msg.user}</span>
                                        </div>
                                        <div className={cn(
                                            "px-3 py-1.5 rounded-lg text-xs max-w-[90%] break-words",
                                            msg.user === user.username ? "bg-primary text-primary-foreground rounded-tr-none" : "bg-white/10 text-gray-200 rounded-tl-none"
                                        )}>
                                            {msg.message}
                                        </div>
                                    </div>
                                ))}
                                <div ref={chatScrollRef} />
                            </div>
                        </ScrollArea>
                        <form onSubmit={handleSendMessage} className="p-2 bg-white/5 border-t border-white/5 flex gap-2">
                            <input
                                className="flex-1 bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none"
                                placeholder="Type here..."
                                value={messageInput}
                                onChange={(e) => setMessageInput(e.target.value)}
                            />
                        </form>
                    </GlassCard>
                </div>
            </main>

            {/* LEAVE DIALOG */}
            <Dialog open={showLeaveDialog} onOpenChange={setShowLeaveDialog}>
                <DialogContent className="border-white/10 bg-card">
                    <DialogHeader>
                        <DialogTitle>Leave Room?</DialogTitle>
                        <DialogDescription>You will be removed from this lobby.</DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <button onClick={() => setShowLeaveDialog(false)} className="px-4 py-2 rounded-lg text-sm bg-secondary/10 hover:bg-secondary/20">Cancel</button>
                        <button onClick={handleLeaveRoom} className="px-4 py-2 rounded-lg bg-destructive text-destructive-foreground text-sm">Leave</button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default Room;
