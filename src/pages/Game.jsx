
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useSocket } from '../hooks/useSocket';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import {
    Clock, Users, MessageSquare, AlertTriangle, CheckCircle2,
    Crown, Shield, Skull, Gavel, Timer, ArrowRight, User
} from 'lucide-react';
import { LobbyChat } from '@/components/lobby/LobbyChat';

const Game = () => {
    const { roomId: roomCode } = useParams();
    const { user } = useAuth();
    const { socket } = useSocket();
    const navigate = useNavigate();

    // Game State
    const [gameState, setGameState] = useState(null);
    const [messages, setMessages] = useState([]);
    const [myResponse, setMyResponse] = useState("");
    const [activeTab, setActiveTab] = useState('game'); // mobile tabs

    // Derived
    const me = gameState?.players.find(p => p.userId === user?._id);
    const amIImposter = gameState?.myRole === 'imposter';
    const currentPhase = gameState?.phase || 'loading';

    // Effects
    useEffect(() => {
        if (!socket || !roomCode) return;

        // Initial fetch handled by rejoin logic in server, but we listen for updates
        socket.on("game_state_update", (state) => {
            console.log("Game State Update:", state);
            setGameState(state);
        });

        socket.on("chat:receive", (msg) => {
            setMessages(prev => [...prev, msg]);
        });

        socket.on("chat:react", ({ messageId, reaction }) => {
            setMessages(prev => prev.map(msg => {
                if (msg.id === messageId) {
                    const existing = msg.reactions || {};
                    return { ...msg, reactions: { ...existing, [reaction]: (existing[reaction] || 0) + 1 } };
                }
                return msg;
            }));
        });

        socket.on("room_closed", () => {
            toast.info("Host closed the room.");
            navigate('/');
        });

        return () => {
            socket.off("game_state_update");
            socket.off("chat:receive");
            socket.off("chat:react");
            socket.off("room_closed");
        };
    }, [socket, roomCode, navigate]);

    // Actions
    const handleSubmitResponse = () => {
        if (!myResponse.trim()) return;
        socket.emit("game:submit_response", { roomCode, response: myResponse });
    };

    const handleVote = (targetId) => {
        socket.emit("game:submit_vote", { roomCode, targetUserId: targetId });
    };

    const handleSendMessage = (text) => {
        if (!text.trim()) return;
        socket.emit("chat:send", { roomCode, message: text });
    };

    // --- RENDER HELPERS ---

    const renderTimer = () => {
        if (!gameState?.phaseEndTime) return null;
        const timeLeft = Math.max(0, Math.ceil((gameState.phaseEndTime - Date.now()) / 1000));
        return (
            <div className="flex items-center gap-2 text-xl font-mono font-bold text-cyan-400">
                <Clock className="w-5 h-5 animate-pulse" />
                {timeLeft}s
            </div>
        );
    };

    // Loading
    if (!gameState) {
        return <div className="min-h-screen bg-black flex items-center justify-center text-white">Loading Game...</div>;
    }

    // --- MAIN UI ---
    return (
        <div className="min-h-screen bg-black text-white font-sans selection:bg-purple-500/30 flex flex-col">

            {/* 1. TOP BAR */}
            <header className="h-16 border-b border-white/10 bg-zinc-950/80 backdrop-blur-md flex items-center justify-between px-4 lg:px-8 z-20">
                <div className="flex items-center gap-4">
                    <div className="text-zinc-400 font-bold text-sm uppercase tracking-wider">
                        Round <span className="text-white">{gameState.currentRound}</span> / {gameState.totalRounds}
                    </div>
                </div>

                <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-3">
                    {/* Phase Badge */}
                    <div className={`px-4 py-1.5 rounded-full font-black uppercase tracking-widest text-xs lg:text-sm border shadow-[0_0_15px_rgba(0,0,0,0.5)] 
                        ${currentPhase === 'response' ? 'bg-blue-500/10 border-blue-500/50 text-blue-400' :
                            currentPhase === 'voting' ? 'bg-red-500/10 border-red-500/50 text-red-400' :
                                currentPhase === 'result' ? 'bg-purple-500/10 border-purple-500/50 text-purple-400' : 'bg-zinc-800 border-zinc-700'}`}>
                        {currentPhase === 'response' ? 'Write Response' :
                            currentPhase === 'voting' ? 'Voting Phase' :
                                currentPhase === 'result' ? 'Round Result' : 'Starting...'}
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    {renderTimer()}
                </div>
            </header>

            {/* 2. MAIN GRID */}
            <main className="flex-1 max-w-[1800px] w-full mx-auto p-4 lg:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 overflow-hidden h-[calc(100vh-64px)] pb-20 lg:pb-6">

                {/* LEFT: PLAYER LIST */}
                <div className={`${activeTab === 'players' ? 'flex' : 'hidden'} lg:flex lg:col-span-3 flex-col gap-4 overflow-y-auto custom-scrollbar`}>
                    <h3 className="text-zinc-500 font-bold text-xs uppercase tracking-wider px-1">Players ({gameState.players.length})</h3>
                    {gameState.players.map(p => (
                        <div key={p.userId} className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${currentPhase === 'voting' && me?.hasVoted && p.userId !== me.userId ? 'opacity-50' :
                                'bg-zinc-900/50 border-white/5'
                            }`}>
                            <div className="relative">
                                <div className="w-10 h-10 rounded-full bg-zinc-800 overflow-hidden border border-white/10">
                                    <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${p.userId}`} alt="av" />
                                </div>
                                {p.hasSubmitted && currentPhase === 'response' && (
                                    <div className="absolute -bottom-1 -right-1 bg-green-500 text-black p-0.5 rounded-full">
                                        <CheckCircle2 className="w-3 h-3" />
                                    </div>
                                )}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                    <span className="font-bold text-sm truncate">{p.displayName || p.username}</span>
                                    {p.userId === user._id && <span className="text-[10px] bg-white/10 px-1.5 rounded text-zinc-400">YOU</span>}
                                </div>
                                <div className="text-xs text-zinc-500">
                                    {gameState.scores[p.userId] || 0} pts
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* CENTER: GAME STAGE */}
                <div className={`${activeTab === 'game' ? 'flex' : 'hidden'} lg:flex lg:col-span-6 flex-col items-center justify-center relative`}>

                    {/* RESPONSE PHASE */}
                    {currentPhase === 'response' && (
                        <div className="w-full max-w-lg flex flex-col items-center gap-8 animate-in fade-in zoom-in duration-500">
                            {/* Word Card */}
                            <div className={`w-full relative overflow-hidden rounded-2xl p-1 bg-gradient-to-br ${amIImposter ? 'from-red-600 to-orange-600' : 'from-cyan-500 to-blue-600'}`}>
                                <div className="bg-zinc-950 rounded-xl p-8 flex flex-col items-center text-center relative z-10">
                                    <div className={`text-xs font-black uppercase tracking-[0.3em] mb-4 px-3 py-1 rounded-full ${amIImposter ? 'bg-red-500/20 text-red-500' : 'bg-cyan-500/20 text-cyan-500'}`}>
                                        {amIImposter ? 'YOU ARE THE IMPOSTER' : 'YOU ARE AN AGENT'}
                                    </div>
                                    <h2 className="text-5xl lg:text-6xl font-black text-white mb-2 drop-shadow-2xl">
                                        {gameState.myWord}
                                    </h2>
                                    {amIImposter && (
                                        <p className="text-red-400/80 text-sm mt-4 font-medium max-w-xs">
                                            Blend in! Don't say the precise Agent word (if you know it).
                                        </p>
                                    )}
                                </div>
                            </div>

                            {/* Input Area */}
                            <div className="w-full space-y-4">
                                <textarea
                                    value={myResponse}
                                    onChange={(e) => setMyResponse(e.target.value)}
                                    disabled={me?.hasSubmitted}
                                    placeholder={amIImposter ? "Describe your word vaguely..." : "Describe your word clearly but carefully..."}
                                    className="w-full bg-zinc-900/50 border border-white/10 rounded-xl p-4 text-lg focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all resize-none h-32"
                                    maxLength={100}
                                />
                                <Button
                                    onClick={handleSubmitResponse}
                                    disabled={me?.hasSubmitted || !myResponse.trim()}
                                    className={`w-full h-12 text-lg font-bold ${me?.hasSubmitted ? 'bg-zinc-800 text-zinc-500' : 'bg-white text-black hover:bg-zinc-200'}`}
                                >
                                    {me?.hasSubmitted ? "Waiting for others..." : "SUBMIT RESPONSE"}
                                </Button>
                            </div>
                        </div>
                    )}

                    {/* VOTING PHASE */}
                    {currentPhase === 'voting' && (
                        <div className="w-full max-w-4xl flex flex-col items-center gap-8 animate-in fade-in slide-in-from-bottom-5 duration-500">
                            <div className="text-center space-y-2">
                                <h2 className="text-3xl font-black text-white">Who is the Imposter?</h2>
                                <p className="text-zinc-400">Read the responses and vote for the suspicious one.</p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
                                {gameState.players.map(p => {
                                    if (p.userId === user._id) return null; // Don't vote for self
                                    return (
                                        <button
                                            key={p.userId}
                                            onClick={() => handleVote(p.userId)}
                                            disabled={me?.hasVoted}
                                            className={`group relative p-4 rounded-xl text-left transition-all border ${me?.hasVoted ? 'opacity-50 cursor-not-allowed border-transparent bg-zinc-900/40' :
                                                    'bg-zinc-900 hover:bg-zinc-800 border-white/5 hover:border-red-500/50 hover:shadow-[0_0_20px_rgba(239,68,68,0.2)]'
                                                }`}
                                        >
                                            <div className="flex items-start justify-between mb-3">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-full bg-zinc-800 overflow-hidden">
                                                        <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${p.userId}`} alt="av" />
                                                    </div>
                                                    <span className="font-bold">{p.displayName}</span>
                                                </div>
                                                {/* Vote Indicator (only show in Result usually, but maybe show own vote) */}
                                            </div>
                                            <div className="bg-black/40 p-3 rounded-lg text-zinc-300 italic text-sm">
                                                "{gameState.responses[p.userId] || "..."}"
                                            </div>
                                        </button>
                                    )
                                })}
                            </div>

                            {/* My Response (Reminder) */}
                            <div className="mt-8 pt-8 border-t border-white/5 w-full text-center">
                                <span className="text-zinc-500 text-xs uppercase tracking-wider">Your Response</span>
                                <p className="text-lg font-medium text-white mt-1">"{gameState.responses[user._id]}"</p>
                            </div>
                        </div>
                    )}

                    {/* RESULT PHASE */}
                    {currentPhase === 'result' && gameState.lastRoundResult && (
                        <div className="w-full max-w-2xl text-center space-y-8 animate-in zoom-in duration-500">

                            {/* IMPOSTER REVEAL */}
                            <div className="space-y-4">
                                <div className="text-sm font-bold text-zinc-500 uppercase tracking-widest">The Imposter Was</div>
                                {gameState.players.filter(p => p.userId === gameState.lastRoundResult.imposterId).map(imp => (
                                    <div key={imp.userId} className="flex flex-col items-center gap-4">
                                        <div className="w-24 h-24 rounded-full border-4 border-red-500 shadow-[0_0_40px_rgba(239,68,68,0.5)] overflow-hidden">
                                            <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${imp.userId}`} alt="imposter" />
                                        </div>
                                        <h2 className="text-4xl font-black text-white">{imp.displayName}</h2>
                                        <div className="flex gap-2 text-sm bg-red-500/10 text-red-500 px-3 py-1 rounded-full border border-red-500/20">
                                            Word: <span className="font-bold text-white">{gameState.lastRoundResult.wordPair.imposter}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* AGENT WORD */}
                            <div className="bg-zinc-900/50 p-4 rounded-xl inline-block border border-white/5">
                                <span className="text-zinc-500 text-xs uppercase mr-2">Agent Word:</span>
                                <span className="text-cyan-400 font-bold text-lg">{gameState.lastRoundResult.wordPair.main}</span>
                            </div>

                            {/* OUTCOME */}
                            <div className="py-6">
                                {gameState.lastRoundResult.imposterCaught ? (
                                    <h3 className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-600">AGENTS WIN</h3>
                                ) : (
                                    <h3 className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-orange-500">IMPOSTER WINS</h3>
                                )}
                            </div>

                            {/* POINTS GAINED */}
                            <div className="bg-zinc-900 border border-white/10 rounded-xl p-6">
                                <h4 className="text-sm font-bold text-zinc-500 uppercase mb-4">Round Scores</h4>
                                <div className="space-y-2">
                                    {gameState.players.map(p => {
                                        const gain = gameState.lastRoundResult.roundScores[p.userId] || 0;
                                        return (
                                            <div key={p.userId} className="flex items-center justify-between p-2 rounded hover:bg-white/5">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-bold text-sm">{p.displayName}</span>
                                                    {p.userId === gameState.lastRoundResult.imposterId && <span className="text-[10px] text-red-500 bg-red-500/10 px-1 rounded">IMP</span>}
                                                </div>
                                                <span className={`font-mono font-bold ${gain > 0 ? 'text-green-400' : 'text-zinc-500'}`}>
                                                    {gain > 0 ? '+' : ''}{gain}
                                                </span>
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>
                            <div className="text-zinc-500 text-xs animate-pulse">Next round starting soon...</div>
                        </div>
                    )}
                </div>

                {/* RIGHT: CHAT */}
                <div className={`${activeTab === 'chat' ? 'flex' : 'hidden'} lg:flex lg:col-span-3 flex-col h-full overflow-hidden`}>
                    <Card className="flex-1 bg-zinc-900/40 border-white/5 overflow-hidden flex flex-col shadow-inner h-full">
                        <LobbyChat
                            messages={messages}
                            onSendMessage={handleSendMessage}
                            onSendReaction={(msgId, reaction) => socket.emit("chat:react", { roomCode, messageId: msgId, reaction })}
                            currentUser={{ username: me?.displayName }}
                            roomCode={roomCode}
                            isHost={false} // Chat is open for all
                        />
                    </Card>
                </div>

            </main>

            {/* MOBILE NAV */}
            <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-zinc-950 border-t border-white/10 px-6 py-4 flex items-center justify-between z-50 pb-safe">
                <button onClick={() => setActiveTab('players')} className={`flex flex-col items-center gap-1 ${activeTab === 'players' ? 'text-white' : 'text-zinc-600'}`}>
                    <Users className="w-5 h-5" />
                    <span className="text-[10px] font-bold">Players</span>
                </button>
                <button onClick={() => setActiveTab('game')} className={`flex flex-col items-center gap-1 ${activeTab === 'game' ? 'text-cyan-400' : 'text-zinc-600'}`}>
                    <div className={`p-2 rounded-full ${activeTab === 'game' ? 'bg-cyan-500/10' : 'bg-transparent'} -mt-6 border border-zinc-800 bg-zinc-900`}>
                        <ArrowRight className="w-6 h-6" /> {/* Play Icon substitute */}
                    </div>
                </button>
                <button onClick={() => setActiveTab('chat')} className={`flex flex-col items-center gap-1 ${activeTab === 'chat' ? 'text-white' : 'text-zinc-600'}`}>
                    <MessageSquare className="w-5 h-5" />
                    <span className="text-[10px] font-bold">Chat</span>
                </button>
            </div>
        </div>
    );
};

export default Game;
