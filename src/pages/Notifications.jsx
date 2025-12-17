import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { Header } from '@/components/home/Header';
import { GlassCard } from '@/components/ui/GlassCard';
import { GameButton } from '@/components/ui/GameButton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { Bell, Gamepad2, UserPlus, Check, X, Clock } from 'lucide-react';
import { BackButton } from '@/components/ui/BackButton';
import { LoadingScreen } from '@/components/ui/LoadingScreen';

const Notifications = () => {
    const { user } = useAuth();
    const [gameInvites, setGameInvites] = useState([]);
    const [friendRequests, setFriendRequests] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (user) {
            fetchNotifications();
            // Setup socket listeners for real-time updates if implemented
        }
    }, [user]);

    const fetchNotifications = async () => {
        if (!user) return;

        try {
            const { data: requests } = await api.get('/friends/requests');

            // Transform to match UI expectations if needed
            // The API returns friend requests directly
            setFriendRequests(requests.map(req => ({
                id: req._id,
                from_user_id: req.from._id,
                status: req.status,
                created_at: req.createdAt,
                from_profile: {
                    id: req.from._id,
                    full_name: req.from.username, // Using username as full_name fallback
                    username: req.from.username,
                    avatar_url: req.from.avatar_url
                }
            })));

            // Game invites API not implemented yet, using empty
            setGameInvites([]);

        } catch (e) {
            console.error("Failed to fetch notifications", e);
        } finally {
            setLoading(false);
        }
    };

    const acceptGameInvite = async (invite) => {
        if (!user) return;
        toast.info("Game invites not fully implemented yet");
        // Implementation would be acceptable here via API
    };

    const rejectGameInvite = async (inviteId) => {
        // Implementation would be via API
    };

    const acceptFriendRequest = async (request) => {
        if (!user) return;
        try {
            await api.post(`/friends/respond`, { requestId: request.id, status: 'accepted' });
            toast.success('Friend added! 🎉');
            fetchNotifications();
        } catch (e) {
            toast.error('Failed to accept request');
        }
    };

    const rejectFriendRequest = async (requestId) => {
        try {
            await api.post(`/friends/respond`, { requestId, status: 'rejected' });
            toast.info('Request declined');
            fetchNotifications();
        } catch (e) {
            toast.error('Failed to reject request');
        }
    };

    const formatTime = (dateString) => {
        const date = new Date(dateString);
        const now = new Date();
        const diff = now.getTime() - date.getTime();
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);

        if (minutes < 1) return 'Just now';
        if (minutes < 60) return `${minutes}m ago`;
        if (hours < 24) return `${hours}h ago`;
        return `${days}d ago`;
    };

    const totalNotifications = gameInvites.length + friendRequests.length;

    if (loading) {
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
                        <Bell className="w-8 h-8 text-primary" />
                        Notifications
                        {totalNotifications > 0 && (
                            <span className="px-3 py-1 text-sm bg-destructive text-destructive-foreground rounded-full">
                                {totalNotifications}
                            </span>
                        )}
                    </h1>

                    <Tabs defaultValue="invites">
                        <TabsList className="w-full bg-muted/50 mb-4">
                            <TabsTrigger value="invites" className="flex-1">
                                <Gamepad2 className="w-4 h-4 mr-2" />
                                Game Invites ({gameInvites.length})
                            </TabsTrigger>
                            <TabsTrigger value="friends" className="flex-1">
                                <UserPlus className="w-4 h-4 mr-2" />
                                Friend Requests ({friendRequests.length})
                            </TabsTrigger>
                        </TabsList>

                        <TabsContent value="invites">
                            {gameInvites.length === 0 ? (
                                <GlassCard className="text-center py-12">
                                    <Gamepad2 className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
                                    <p className="text-muted-foreground">No game invites</p>
                                    <p className="text-sm text-muted-foreground/60">When friends invite you to play, it'll appear here</p>
                                </GlassCard>
                            ) : (
                                <div className="space-y-3">
                                    {gameInvites.map((invite) => (
                                        <GlassCard key={invite.id} className="p-4">
                                            <div className="flex items-start justify-between gap-4">
                                                <div className="flex items-start gap-3">
                                                    <Avatar className="w-12 h-12">
                                                        <AvatarImage src={invite.from_profile?.avatar_url || undefined} />
                                                        <AvatarFallback className="bg-primary/20 text-primary">
                                                            {invite.from_profile?.full_name?.charAt(0)}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <div>
                                                        <p className="font-medium">
                                                            <Link
                                                                to={`/profile/${invite.from_profile?.id}`}
                                                                className="hover:text-primary transition-colors"
                                                            >
                                                                {invite.from_profile?.full_name}
                                                            </Link>
                                                            {' '}invited you to play
                                                        </p>
                                                        <p className="text-primary font-heading mt-1">{invite.room?.title}</p>
                                                        <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                                                            <Clock className="w-3 h-3" />
                                                            {formatTime(invite.created_at)}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="flex gap-2">
                                                    <GameButton size="sm" onClick={() => acceptGameInvite(invite)}>
                                                        <Check className="w-4 h-4" />
                                                    </GameButton>
                                                    <GameButton variant="ghost" size="sm" onClick={() => rejectGameInvite(invite.id)}>
                                                        <X className="w-4 h-4" />
                                                    </GameButton>
                                                </div>
                                            </div>
                                        </GlassCard>
                                    ))}
                                </div>
                            )}
                        </TabsContent>

                        <TabsContent value="friends">
                            {friendRequests.length === 0 ? (
                                <GlassCard className="text-center py-12">
                                    <UserPlus className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
                                    <p className="text-muted-foreground">No friend requests</p>
                                    <p className="text-sm text-muted-foreground/60">When someone adds you, it'll appear here</p>
                                </GlassCard>
                            ) : (
                                <div className="space-y-3">
                                    {friendRequests.map((request) => (
                                        <GlassCard key={request.id} className="p-4">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <Avatar className="w-12 h-12">
                                                        <AvatarImage src={request.from_profile?.avatar_url || undefined} />
                                                        <AvatarFallback className="bg-primary/20 text-primary">
                                                            {request.from_profile?.full_name?.charAt(0)}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <div>
                                                        <p className="font-medium">
                                                            <Link
                                                                to={`/profile/${request.from_profile?.id}`}
                                                                className="hover:text-primary transition-colors"
                                                            >
                                                                {request.from_profile?.full_name}
                                                            </Link>
                                                        </p>
                                                        <p className="text-sm text-muted-foreground">@{request.from_profile?.username}</p>
                                                        <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                                                            <Clock className="w-3 h-3" />
                                                            {formatTime(request.created_at)}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="flex gap-2">
                                                    <GameButton size="sm" onClick={() => acceptFriendRequest(request)}>
                                                        <Check className="w-4 h-4" />
                                                    </GameButton>
                                                    <GameButton variant="ghost" size="sm" onClick={() => rejectFriendRequest(request.id)}>
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

            {/* Background */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
                <div className="absolute top-1/3 left-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-3xl" />
                <div className="absolute bottom-1/3 right-0 w-[500px] h-[500px] bg-secondary/5 rounded-full blur-3xl" />
            </div>
        </div>
    );
};

export default Notifications;
