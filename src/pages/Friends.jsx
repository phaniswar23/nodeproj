import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { useSocket } from '@/hooks/useSocket';
import { Header } from '@/components/home/Header';
import { GlassCard } from '@/components/ui/GlassCard';
import { GameButton } from '@/components/ui/GameButton';
import { GameInput } from '@/components/ui/GameInput';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { Search, UserPlus, Check, X, Users, Clock, Circle, MessageCircle } from 'lucide-react';
import { BackButton } from '@/components/ui/BackButton';
import { LoadingScreen } from '@/components/ui/LoadingScreen';
import { ChatWindow } from '@/components/chat/ChatWindow';

const Friends = () => {
    const { user } = useAuth();
    const socket = useSocket();
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [friends, setFriends] = useState([]);
    const [pendingRequests, setPendingRequests] = useState([]);
    const [sentRequests, setSentRequests] = useState([]);
    const [loading, setLoading] = useState(false);
    const [onlineUsers, setOnlineUsers] = useState(new Set());
    const [activeChatFriend, setActiveChatFriend] = useState(null);

    useEffect(() => {
        if (user) {
            fetchFriends();
            fetchRequests();
        }
    }, [user]);

    // Socket presence
    useEffect(() => {
        if (!socket) return;

        // Listen for online users
        socket.on('online_users', (users) => {
            setOnlineUsers(new Set(users));
        });

        return () => {
            socket.off('online_users');
        };
    }, [socket]);

    const fetchFriends = async () => {
        try {
            const { data } = await api.get('/friends');
            // data is array of user objects directly
            const mappedFriends = data.map((f) => ({
                id: f._id, // Friendship ID isn't returned, using friend ID as key for now
                friend_id: f._id,
                user_id: user?._id,
                friend_profile: f
            }));
            setFriends(mappedFriends);
        } catch (error) {
            console.error(error);
        }
    };

    const fetchRequests = async () => {
        try {
            const { data } = await api.get('/friends/requests');
            // data is array of requests with populated from_user_id
            const mappedRequests = data.map((r) => ({
                id: r._id,
                from_user_id: r.from_user_id._id,
                to_user_id: user?._id || '',
                status: r.status,
                created_at: r.created_at,
                from_profile: r.from_user_id
            }));
            setPendingRequests(mappedRequests);
        } catch (error) {
            console.error(error);
        }
    };

    const handleSearch = async () => {
        if (!searchQuery.trim()) return;
        setLoading(true);
        try {
            const { data } = await api.get(`/users/search?q=${searchQuery}`);
            // Filter out self
            const mapped = data.filter((u) => u._id !== user?._id);
            setSearchResults(mapped);
        } catch (error) {
            toast.error('Search failed');
        } finally {
            setLoading(false);
        }
    };

    const sendFriendRequest = async (toUserId) => {
        try {
            await api.post('/friends/request', { toUserId });
            toast.success('Friend request sent! 🤝');
            setSearchResults(prev => prev.filter(p => p._id !== toUserId));
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to send request');
        }
    };

    const acceptRequest = async (requestId) => {
        try {
            await api.put(`/friends/request/${requestId}`, { status: 'accepted' });
            toast.success('Friend added! 🎉');
            fetchFriends();
            fetchRequests();
        } catch (error) {
            toast.error('Failed to accept');
        }
    };

    const rejectRequest = async (requestId) => {
        try {
            await api.put(`/friends/request/${requestId}`, { status: 'rejected' });
            toast.info('Request declined');
            fetchRequests();
        } catch (error) {
            toast.error('Failed to reject');
        }
    };

    const removeFriend = async (friendshipId, friendId) => {
        // Backend doesn't have remove endpoint yet, skipping implementation for now
        toast.info('Remove friend not implemented in this migration phase');
    };

    if (loading && friends.length === 0) {
        return <LoadingScreen />;
    }

    return (
        <div className="min-h-screen bg-background">
            <Header />

            <main className="pt-24 pb-12 px-4">
                <div className="max-w-2xl mx-auto">
                    <div className="mb-4">
                        <BackButton />
                    </div>
                    <h1 className="text-3xl font-heading font-bold mb-6 flex items-center gap-3">
                        <Users className="w-8 h-8 text-primary" />
                        Friends
                    </h1>

                    {/* Search */}
                    <GlassCard className="mb-6">
                        <div className="flex gap-3">
                            <GameInput
                                placeholder="Search by username..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                                className="flex-1"
                            />
                            <GameButton onClick={handleSearch} disabled={loading}>
                                <Search className="w-4 h-4" />
                            </GameButton>
                        </div>

                        {searchResults.length > 0 && (
                            <div className="mt-4 space-y-2">
                                {searchResults.map((profile) => (
                                    <div key={profile._id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                                        <Link to={`/profile/${profile._id}`} className="flex items-center gap-3 hover:opacity-80">
                                            <Avatar className="w-10 h-10">
                                                <AvatarImage src={profile.avatar_url || undefined} />
                                                <AvatarFallback className="bg-primary/20 text-primary">
                                                    {profile.full_name?.charAt(0)}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div>
                                                <p className="font-medium">{profile.full_name}</p>
                                                <p className="text-sm text-muted-foreground">@{profile.username}</p>
                                            </div>
                                        </Link>
                                        <GameButton size="sm" onClick={() => sendFriendRequest(profile._id)}>
                                            <UserPlus className="w-4 h-4" />
                                        </GameButton>
                                    </div>
                                ))}
                            </div>
                        )}
                    </GlassCard>

                    {/* Tabs */}
                    <Tabs defaultValue="friends">
                        <TabsList className="w-full bg-muted/50 mb-4">
                            <TabsTrigger value="friends" className="flex-1">
                                Friends ({friends.length})
                            </TabsTrigger>
                            <TabsTrigger value="requests" className="flex-1 relative">
                                Requests
                                {pendingRequests.length > 0 && (
                                    <span className="ml-2 w-5 h-5 bg-destructive text-destructive-foreground text-xs rounded-full flex items-center justify-center">
                                        {pendingRequests.length}
                                    </span>
                                )}
                            </TabsTrigger>
                        </TabsList>

                        <TabsContent value="friends">
                            {friends.length === 0 ? (
                                <GlassCard className="text-center py-12">
                                    <Users className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
                                    <p className="text-muted-foreground">No friends yet</p>
                                    <p className="text-sm text-muted-foreground/60">Search for users to add them</p>
                                </GlassCard>
                            ) : (
                                <div className="space-y-2">
                                    {friends.map((friendship) => (
                                        <GlassCard key={friendship.friend_profile?._id} className="p-4">
                                            <div className="flex items-center justify-between">
                                                <Link
                                                    to={`/profile/${friendship.friend_profile?._id}`}
                                                    className="flex items-center gap-3 hover:opacity-80"
                                                >
                                                    <div className="relative">
                                                        <Avatar className="w-12 h-12">
                                                            <AvatarImage src={friendship.friend_profile?.avatar_url || undefined} />
                                                            <AvatarFallback className="bg-primary/20 text-primary">
                                                                {friendship.friend_profile?.full_name?.charAt(0)}
                                                            </AvatarFallback>
                                                        </Avatar>
                                                        <Circle
                                                            className={`absolute -bottom-0.5 -right-0.5 w-4 h-4 ${onlineUsers.has(friendship.friend_profile?._id || '')
                                                                ? 'text-green-500 fill-green-500'
                                                                : 'text-red-500 fill-red-500'
                                                                }`}
                                                        />
                                                    </div>
                                                    <div>
                                                        <p className="font-medium">{friendship.friend_profile?.full_name}</p>
                                                        <p className="text-sm text-muted-foreground">@{friendship.friend_profile?.username}</p>
                                                    </div>
                                                </Link>
                                                <div className="flex gap-2">
                                                    <GameButton
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => setActiveChatFriend(friendship)}
                                                        className="hover:text-primary hover:bg-primary/10"
                                                    >
                                                        <MessageCircle className="w-4 h-4" />
                                                    </GameButton>
                                                    <GameButton
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => removeFriend(friendship.id, friendship.friend_profile?._id || '')}
                                                    >
                                                        <X className="w-4 h-4" />
                                                    </GameButton>
                                                </div>
                                            </div>
                                        </GlassCard>
                                    ))}
                                </div>
                            )}
                        </TabsContent>

                        <TabsContent value="requests">
                            {pendingRequests.length === 0 ? (
                                <GlassCard className="text-center py-12">
                                    <Clock className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
                                    <p className="text-muted-foreground">No pending requests</p>
                                </GlassCard>
                            ) : (
                                <div className="space-y-2">
                                    {pendingRequests.map((request) => (
                                        <GlassCard key={request.id} className="p-4">
                                            <div className="flex items-center justify-between">
                                                <Link
                                                    to={`/profile/${request.from_profile?._id}`}
                                                    className="flex items-center gap-3 hover:opacity-80"
                                                >
                                                    <Avatar className="w-12 h-12">
                                                        <AvatarImage src={request.from_profile?.avatar_url || undefined} />
                                                        <AvatarFallback className="bg-primary/20 text-primary">
                                                            {request.from_profile?.full_name?.charAt(0)}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <div>
                                                        <p className="font-medium">{request.from_profile?.full_name}</p>
                                                        <p className="text-sm text-muted-foreground">@{request.from_profile?.username}</p>
                                                    </div>
                                                </Link>
                                                <div className="flex gap-2">
                                                    <GameButton
                                                        size="sm"
                                                        onClick={() => acceptRequest(request.id)}
                                                    >
                                                        <Check className="w-4 h-4" />
                                                    </GameButton>
                                                    <GameButton
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => rejectRequest(request.id)}
                                                    >
                                                        <X className="w-4 h-4" />
                                                    </GameButton>
                                                </div>
                                            </div>
                                        </GlassCard>
                                    ))}
                                </div>
                            )}
                        </TabsContent>
                    </Tabs>
                </div>
            </main>

            {/* Chat Window Overlay */}
            {activeChatFriend && (
                <ChatWindow
                    friend={activeChatFriend}
                    isOnline={onlineUsers.has(activeChatFriend.friend_profile?._id)}
                    onClose={() => setActiveChatFriend(null)}
                />
            )}

            {/* Background */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
                <div className="absolute top-1/3 left-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-3xl" />
                <div className="absolute bottom-1/3 right-0 w-[500px] h-[500px] bg-secondary/5 rounded-full blur-3xl" />
            </div>
        </div>
    );
};

export default Friends;
