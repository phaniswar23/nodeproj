import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { useSocket } from '@/hooks/useSocket';
import { useAuth } from '@/hooks/useAuth';
import api from '@/lib/api';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Loader2, UserPlus, Check, Circle } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

export const InviteFriendsModal = ({ open, onOpenChange, roomCode }) => {
    const { user } = useAuth();
    const socket = useSocket();
    const [friends, setFriends] = useState([]);
    const [loading, setLoading] = useState(true);
    const [invitedIds, setInvitedIds] = useState(new Set());
    const [onlineUsers, setOnlineUsers] = useState(new Set());

    useEffect(() => {
        if (open) {
            fetchFriends();
        }
    }, [open]);

    // Listen for online status updates
    useEffect(() => {
        if (!socket) return;

        // Initial online users listeners
        socket.on('online_users', (users) => {
            setOnlineUsers(new Set(users));
        });

        return () => {
            socket.off('online_users');
        };
    }, [socket]);

    const fetchFriends = async () => {
        setLoading(true);
        try {
            const { data } = await api.get('/friends');
            // Assuming data is array of user profiles
            const mapped = data.map(f => ({
                id: f._id,
                username: f.username,
                full_name: f.full_name,
                avatar_url: f.avatar_url
            }));
            setFriends(mapped);
        } catch (error) {
            console.error("Failed to fetch friends", error);
        } finally {
            setLoading(false);
        }
    };

    const handleInvite = (friendId) => {
        if (!socket) return;

        socket.emit('invite_friend', {
            toUserId: friendId,
            roomCode
        });

        setInvitedIds(prev => new Set(prev).add(friendId));
        toast.success('Invite sent!');
    };

    // Sort: Online first, then offline
    const sortedFriends = [...friends].sort((a, b) => {
        const aOnline = onlineUsers.has(a.id);
        const bOnline = onlineUsers.has(b.id);
        if (aOnline === bOnline) return 0;
        return aOnline ? -1 : 1;
    });

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md bg-card border-white/10">
                <DialogHeader>
                    <DialogTitle>Invite Friends</DialogTitle>
                    <DialogDescription>Ask your friends to join <b>{roomCode}</b></DialogDescription>
                </DialogHeader>

                <div className="min-h-[300px] flex flex-col">
                    {loading ? (
                        <div className="flex-1 flex items-center justify-center">
                            <Loader2 className="w-8 h-8 animate-spin text-primary" />
                        </div>
                    ) : sortedFriends.length === 0 ? (
                        <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground gap-2">
                            <UserPlus className="w-8 h-8 opacity-20" />
                            <p>No friends found.</p>
                            <Button variant="link" className="text-primary" onClick={() => window.location.href = '/friends'}>
                                Add Friends
                            </Button>
                        </div>
                    ) : (
                        <ScrollArea className="flex-1 -mr-4 pr-4 max-h-[400px]">
                            <div className="space-y-2">
                                {sortedFriends.map(friend => {
                                    const isOnline = onlineUsers.has(friend.id);
                                    const isInvited = invitedIds.has(friend.id);

                                    return (
                                        <div key={friend.id} className="flex items-center justify-between p-3 rounded-xl bg-secondary/5 border border-white/5">
                                            <div className="flex items-center gap-3">
                                                <div className="relative">
                                                    <Avatar>
                                                        <AvatarImage src={friend.avatar_url} />
                                                        <AvatarFallback>{friend.username[0]}</AvatarFallback>
                                                    </Avatar>
                                                    <Circle className={cn(
                                                        "absolute bottom-0 right-0 w-3 h-3 fill-current border-2 border-background rounded-full",
                                                        isOnline ? "text-green-500" : "text-gray-500"
                                                    )} />
                                                </div>
                                                <div>
                                                    <p className="font-bold text-sm">{friend.full_name}</p>
                                                    <p className="text-xs text-muted-foreground">@{friend.username}</p>
                                                </div>
                                            </div>

                                            <Button
                                                size="sm"
                                                variant={isInvited ? "ghost" : "secondary"}
                                                disabled={!isOnline || isInvited}
                                                onClick={() => handleInvite(friend.id)}
                                                className={cn(
                                                    "h-8 px-3 rounded-lg text-xs font-bold transition-all",
                                                    isInvited ? "text-green-500" : ""
                                                )}
                                            >
                                                {isInvited ? (
                                                    <><Check className="w-3 h-3 mr-1" /> Sent</>
                                                ) : (
                                                    "Invite"
                                                )}
                                            </Button>
                                        </div>
                                    )
                                })}
                            </div>
                        </ScrollArea>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
};
