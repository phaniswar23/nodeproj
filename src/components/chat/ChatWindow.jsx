import { useState, useEffect, useRef } from 'react';
import { useSocket } from '@/hooks/useSocket';
import { useAuth } from '@/hooks/useAuth';
import api from '@/lib/api';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { X, Send, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

export const ChatWindow = ({ friend, isOnline, onClose }) => {
    const { user } = useAuth();
    const socket = useSocket();
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const scrollRef = useRef(null);

    useEffect(() => {
        if (friend && user) {
            fetchMessages();
        }
    }, [friend, user]);

    useEffect(() => {
        if (!socket) return;

        socket.on('receive_message', (message) => {
            if (message.sender === friend.friend_id || (message.sender === user._id && message.receiver === friend.friend_id)) {
                // If the message is from current user, we might have added it optimistically or we can ignore duplicates based on ID if we wanted,
                // but simpler to just append if not exists or unique content/timestamp check.
                // For simplicity, just appending. A real app would dedup.
                setMessages((prev) => {
                    // Avoid duplicates if duplicate ID check
                    if (prev.some(m => m._id === message._id)) return prev;
                    return [...prev, message];
                });
                scrollToBottom();
            }
        });

        return () => {
            socket.off('receive_message');
        };
    }, [socket, friend, user]);

    const fetchMessages = async () => {
        try {
            const { data } = await api.get(`/messages/${friend.friend_id}`);
            setMessages(data);
            setLoading(false);
            scrollToBottom();
        } catch (error) {
            console.error('Error fetching messages:', error);
            setLoading(false);
        }
    };

    const scrollToBottom = () => {
        if (scrollRef.current) {
            scrollRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    };

    const handleSendMessage = (e) => {
        e.preventDefault();
        if (!newMessage.trim() || !socket) return;

        const content = newMessage.trim();

        socket.emit('private_message', {
            toUserId: friend.friend_id,
            fromUserId: user._id,
            content
        });

        setNewMessage('');
    };

    return (
        <div className="fixed z-50 flex flex-col overflow-hidden animate-slide-up bg-card border border-border shadow-2xl bottom-0 right-0 w-full h-[100dvh] rounded-none sm:bottom-4 sm:right-4 sm:w-80 sm:h-[450px] sm:rounded-xl">
            {/* Header */}
            <div className="p-3 bg-primary/10 border-b border-border flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <Avatar className="w-8 h-8">
                        <AvatarImage src={friend.friend_profile?.avatar_url} />
                        <AvatarFallback className="bg-primary/20 text-primary text-xs">
                            {friend.friend_profile?.full_name?.charAt(0)}
                        </AvatarFallback>
                    </Avatar>
                    <div>
                        <p className="font-bold text-sm truncate max-w-[150px]">{friend.friend_profile?.full_name}</p>
                        <p className={cn(
                            "text-[10px] px-1 rounded-sm w-fit font-bold",
                            isOnline
                                ? "text-green-500 bg-green-500/10"
                                : "text-red-500 bg-red-500/10"
                        )}>
                            {isOnline ? 'Online' : 'Offline'}
                        </p>
                    </div>
                </div>
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onClose}>
                    <X className="w-4 h-4" />
                </Button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-background/50">
                {loading ? (
                    <div className="flex justify-center items-center h-full">
                        <Loader2 className="w-6 h-6 animate-spin text-primary" />
                    </div>
                ) : messages.length === 0 ? (
                    <p className="text-center text-xs text-muted-foreground mt-10">
                        Start the conversation with {friend.friend_profile?.first_name || friend.friend_profile?.full_name.split(' ')[0]}!
                    </p>
                ) : (
                    messages.map((msg, index) => {
                        const isMe = msg.sender === user._id;
                        return (
                            <div key={msg._id || index} className={cn("flex", isMe ? "justify-end" : "justify-start")}>
                                <div
                                    className={cn(
                                        "max-w-[75%] px-3 py-2 rounded-lg text-sm break-words",
                                        isMe
                                            ? "bg-primary text-primary-foreground rounded-tr-none"
                                            : "bg-muted text-muted-foreground rounded-tl-none"
                                    )}
                                >
                                    {msg.content}
                                </div>
                            </div>
                        );
                    })
                )}
                <div ref={scrollRef} />
            </div>

            {/* Input */}
            <form onSubmit={handleSendMessage} className="p-3 border-t border-border bg-card">
                <div className="flex gap-2">
                    <Input
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Type a message..."
                        className="text-sm h-9 bg-background/50"
                    />
                    <Button type="submit" size="icon" className="h-9 w-9" disabled={!newMessage.trim()}>
                        <Send className="w-4 h-4" />
                    </Button>
                </div>
            </form>
        </div>
    );
};
