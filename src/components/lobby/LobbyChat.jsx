
import React, { useRef, useEffect, useState } from 'react';
import { MessageSquare, Send, Settings, Clock, AlertTriangle, ArrowDown, Smile, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { GlassCard } from '@/components/ui/GlassCard';
import { motion, AnimatePresence } from 'framer-motion';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

const REACTION_EMOJIS = ["👍", "😂", "🔥", "❓", "❤️", "😮"];

export const LobbyChat = ({
    messages = [],
    currentUser,
    onSendMessage,
    onSendReaction,
    typingUsers = new Set(),
    gameStatus = 'waiting'
}) => {
    const [messageInput, setMessageInput] = useState("");
    const [showNewMessages, setShowNewMessages] = useState(false);
    const [isAtBottom, setIsAtBottom] = useState(true);
    const scrollAreaRef = useRef(null);
    const chatScrollRef = useRef(null);

    // Auto-scroll logic
    useEffect(() => {
        if (isAtBottom) {
            scrollToBottom();
        } else {
            // Only show "New Messages" if the new message is NOT from me
            const lastMsg = messages[messages.length - 1];
            if (lastMsg && lastMsg.user !== currentUser.username) {
                setShowNewMessages(true);
            }
        }
    }, [messages]);

    const scrollToBottom = () => {
        chatScrollRef.current?.scrollIntoView({ behavior: 'smooth' });
        setShowNewMessages(false);
        setIsAtBottom(true);
    };

    const handleScroll = (e) => {
        const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
        const isBottom = scrollHeight - scrollTop - clientHeight < 50;
        setIsAtBottom(isBottom);
        if (isBottom) setShowNewMessages(false);
    };

    const handleSend = (e) => {
        if (e) e.preventDefault();
        if (!messageInput.trim() || gameStatus === 'starting') return;
        onSendMessage(messageInput.trim());
        setMessageInput("");
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const handleReactionClick = (e, msgId, emoji) => {
        e.preventDefault();
        e.stopPropagation();
        onSendReaction(msgId, emoji);
    };

    // Grouping Logic
    const groupedMessages = (() => {
        const grouped = [];
        let currentGroup = [];

        messages.forEach((msg, i) => {
            // Group consecutive settings/info system messages
            if (msg.isSystem && (msg.type === 'settings' || msg.type === 'info') && !msg.message.includes('Game Starting')) {
                currentGroup.push(msg);
            } else {
                if (currentGroup.length > 0) {
                    grouped.push({ type: 'group', messages: [...currentGroup] });
                    currentGroup = [];
                }
                grouped.push(msg);
            }
        });
        if (currentGroup.length > 0) grouped.push({ type: 'group', messages: [...currentGroup] });
        return grouped;
    })();

    return (
        <GlassCard className="flex-1 flex flex-col min-h-0 bg-black/40 border-white/10 overflow-hidden relative shadow-2xl h-full">
            {/* Header */}
            <div className="p-3 border-b border-white/5 flex items-center justify-between bg-white/5 backdrop-blur-sm z-10 shrink-0">
                <div className="flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-primary" />
                    <span className="text-xs font-bold uppercase tracking-wider text-gray-300">Live Chat</span>
                </div>
                <div className="text-[10px] text-gray-500 font-mono">
                    {messages.length} messages
                </div>
            </div>

            {/* Messages Area */}
            <div
                className="flex-1 overflow-y-auto p-4 space-y-3 scroll-smooth scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent"
                onScroll={handleScroll}
                ref={scrollAreaRef}
            >
                <AnimatePresence initial={false}>
                    {groupedMessages.map((item, i) => {
                        // 1. GROUPED SYSTEM MESSAGES
                        if (item.type === 'group') {
                            if (item.messages.length === 1) {
                                const msg = item.messages[0];
                                return (
                                    <motion.div key={`sys-${i}`} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-center my-2">
                                        <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/5 text-[10px] text-gray-400 font-mono">
                                            <Settings className="w-3 h-3" /> {msg.message}
                                        </div>
                                    </motion.div>
                                );
                            }
                            return (
                                <motion.div key={`group-${i}`} initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="flex flex-col items-center gap-1 my-2">
                                    <div className="text-[10px] text-gray-500 font-mono flex items-center gap-1">
                                        <Clock className="w-3 h-3" /> {item.messages.length} updates
                                    </div>
                                    <div className="flex flex-col items-center gap-0.5 opacity-70">
                                        {item.messages.map((m, idx) => (
                                            <span key={idx} className="text-[10px] text-gray-600">{m.message}</span>
                                        ))}
                                    </div>
                                </motion.div>
                            );
                        }

                        const msg = item;

                        // 2. SINGLE SYSTEM MESSAGES
                        if (msg.isSystem) {
                            let content = null;
                            if (msg.type === 'join' || msg.type === 'leave') {
                                const isJoin = msg.type === 'join';
                                content = (
                                    <div className="flex items-center gap-2 text-[11px] font-bold text-gray-400 bg-black/20 px-3 py-1 rounded-full border border-white/5">
                                        <div className={cn("w-2 h-2 rounded-full", isJoin ? "bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]" : "bg-red-500")} />
                                        {msg.message}
                                    </div>
                                );
                            } else if (msg.type === 'game') {
                                content = (
                                    <div className="flex flex-col items-center gap-1 py-4 w-full">
                                        <div className="w-full h-[1px] bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
                                        <div className="text-sm font-black text-transparent bg-clip-text bg-gradient-to-r from-primary to-purple-400 tracking-[0.2em] uppercase animate-pulse">
                                            {msg.message}
                                        </div>
                                        <div className="w-full h-[1px] bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
                                    </div>
                                );
                            } else if (msg.type === 'kick') {
                                content = (
                                    <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-destructive/10 border border-destructive/30 text-xs font-bold text-destructive shadow-[0_0_15px_rgba(239,68,68,0.2)]">
                                        <AlertTriangle className="w-4 h-4" />
                                        {msg.message}
                                    </div>
                                );
                            } else {
                                content = (
                                    <span className="text-[10px] font-mono text-primary/70 bg-primary/5 px-2 py-0.5 rounded-full border border-primary/20">
                                        {msg.message}
                                    </span>
                                );
                            }
                            return <motion.div key={i} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="flex justify-center my-2 w-full">{content}</motion.div>;
                        }

                        // 3. USER MESSAGES
                        const isMe = msg.user === currentUser.username;

                        return (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, x: isMe ? 10 : -10, y: 10 }}
                                animate={{ opacity: 1, x: 0, y: 0 }}
                                className={cn("flex gap-3 max-w-[85%] group relative", isMe ? "ml-auto flex-row-reverse" : "mr-auto")}
                            >
                                {/* Avatar */}
                                {!isMe && (
                                    <div className="shrink-0 mt-1">
                                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gray-700 to-gray-900 border border-white/10 flex items-center justify-center shadow-lg">
                                            <span className="text-[10px] font-bold text-white">{msg.user[0]?.toUpperCase()}</span>
                                        </div>
                                    </div>
                                )}

                                <div className={cn("flex flex-col", isMe ? "items-end" : "items-start")}>
                                    {!isMe && <span className="text-[10px] text-gray-500 font-bold ml-1 mb-0.5">{msg.user}</span>}

                                    {/* Message Bubble & Reactions */}
                                    <div className="relative">
                                        <div className={cn(
                                            "px-4 py-2.5 text-xs md:text-sm shadow-md break-words relative",
                                            isMe
                                                ? "bg-primary text-primary-foreground rounded-2xl rounded-tr-sm"
                                                : "bg-white/10 backdrop-blur-md text-gray-100 rounded-2xl rounded-tl-sm border border-white/5"
                                        )}>
                                            {msg.message}
                                        </div>

                                        {/* Reaction Logic */}
                                        <div className={cn("absolute -bottom-2 translate-y-full flex gap-1", isMe ? "right-0" : "left-0")}>
                                            {msg.reactions && Object.entries(msg.reactions).map(([emoji, count]) => (
                                                count > 0 && (
                                                    <div key={emoji} className="bg-black/60 backdrop-blur-sm border border-white/10 rounded-full px-1.5 py-0.5 text-[10px] flex items-center gap-1 shadow-sm">
                                                        <span>{emoji}</span>
                                                        <span className="font-bold text-white">{count}</span>
                                                    </div>
                                                )
                                            ))}
                                        </div>

                                        {/* Reaction Button (Hover / Touch) */}
                                        <Popover>
                                            <PopoverTrigger asChild>
                                                <button className={cn(
                                                    "absolute top-0 -translate-y-1/2 p-1 rounded-full bg-black/60 border border-white/10 text-gray-400 hover:text-white hover:scale-110 transition-all opacity-0 group-hover:opacity-100 focus:opacity-100",
                                                    isMe ? "left-0 -translate-x-full mr-2" : "right-0 translate-x-full ml-2"
                                                )}>
                                                    <Smile className="w-3 h-3" />
                                                </button>
                                            </PopoverTrigger>
                                            <PopoverContent side="top" className="w-auto p-1 bg-black/80 border-white/10 backdrop-blur-xl flex gap-1 rounded-full">
                                                {REACTION_EMOJIS.map(emoji => (
                                                    <button
                                                        key={emoji}
                                                        onClick={(e) => handleReactionClick(e, msg.id, emoji)}
                                                        className="w-8 h-8 flex items-center justify-center hover:bg-white/10 rounded-full text-lg transition-colors"
                                                    >
                                                        {emoji}
                                                    </button>
                                                ))}
                                            </PopoverContent>
                                        </Popover>
                                    </div>

                                    <span className="text-[9px] text-gray-600 mt-2 px-1">
                                        {new Date(msg.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                </div>
                            </motion.div>
                        );
                    })}
                </AnimatePresence>

                {/* Typing Indicator */}
                <AnimatePresence>
                    {typingUsers.size > 0 && (
                        <motion.div
                            initial={{ opacity: 0, y: 5 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            className="flex items-center gap-2 text-[10px] text-gray-500 ml-12"
                        >
                            <div className="flex gap-0.5 bg-white/5 px-2 py-1 rounded-full w-fit">
                                <motion.div className="w-1 h-1 bg-gray-400 rounded-full" animate={{ y: [0, -3, 0] }} transition={{ repeat: Infinity, duration: 0.5, delay: 0 }} />
                                <motion.div className="w-1 h-1 bg-gray-400 rounded-full" animate={{ y: [0, -3, 0] }} transition={{ repeat: Infinity, duration: 0.5, delay: 0.15 }} />
                                <motion.div className="w-1 h-1 bg-gray-400 rounded-full" animate={{ y: [0, -3, 0] }} transition={{ repeat: Infinity, duration: 0.5, delay: 0.3 }} />
                            </div>
                            <span className="italic">
                                {Array.from(typingUsers).join(', ')} is typing...
                            </span>
                        </motion.div>
                    )}
                </AnimatePresence>

                <div ref={chatScrollRef} className="h-1" />
            </div>

            {/* New Messages Pill */}
            <AnimatePresence>
                {showNewMessages && (
                    <motion.button
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 20 }}
                        onClick={scrollToBottom}
                        className="absolute bottom-20 left-1/2 -translate-x-1/2 bg-primary/90 hover:bg-primary text-primary-foreground text-[10px] font-bold px-4 py-1.5 rounded-full shadow-xl z-20 flex items-center gap-2 backdrop-blur-sm transition-all border border-white/10"
                    >
                        <span>New messages</span>
                        <div className="w-4 h-4 rounded-full bg-white/20 flex items-center justify-center">
                            <ArrowDown className="w-3 h-3" />
                        </div>
                    </motion.button>
                )}
            </AnimatePresence>

            {/* Input Area */}
            <div className="p-3 bg-black/40 border-t border-white/10 relative z-20 backdrop-blur-md shrink-0">
                <div className="relative flex items-end gap-2 bg-white/5 border border-white/10 rounded-2xl p-1 focus-within:ring-1 focus-within:ring-primary/50 focus-within:border-primary/50 transition-all">
                    <textarea
                        className="w-full bg-transparent border-none rounded-xl px-3 py-2 text-xs text-white placeholder:text-gray-500 focus:ring-0 resize-none min-h-[40px] max-h-[100px] scrollbar-hide"
                        placeholder={gameStatus === 'starting' ? "Game starting..." : "Send a message... (Shift+Enter for new line)"}
                        value={messageInput}
                        onChange={(e) => setMessageInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        disabled={gameStatus === 'starting'}
                        rows={1}
                        style={{ height: 'auto', minHeight: '40px' }}
                    />
                    <button
                        onClick={handleSend}
                        disabled={!messageInput.trim() || gameStatus === 'starting'}
                        className="mb-1 mr-1 p-2 rounded-xl bg-primary text-primary-foreground disabled:opacity-50 disabled:bg-gray-700 disabled:text-gray-500 hover:scale-105 active:scale-95 transition-all shadow-lg"
                    >
                        <Send className="w-3.5 h-3.5" />
                    </button>
                </div>
            </div>
        </GlassCard>
    );
};
