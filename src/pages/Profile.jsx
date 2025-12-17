import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { useSocket } from '@/hooks/useSocket';
import { Header } from '@/components/home/Header';
import { GlassCard } from '@/components/ui/GlassCard';
import { GameButton } from '@/components/ui/GameButton';
import { GameInput } from '@/components/ui/GameInput';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import {
    Dialog, DialogContent, DialogTitle
} from '@/components/ui/dialog';
import { AvatarSelection } from '@/components/profile/AvatarSelection';
import { toast } from 'sonner';
import {
    Trophy, Target, Flame, Star,
    Instagram, MessageCircle, Edit2, Save, UserPlus, Check, Lock, X, Quote,
    Gamepad2, Loader2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { BackButton } from '@/components/ui/BackButton';
import { LoadingScreen } from '@/components/ui/LoadingScreen';

const StatCard = ({ label, value, icon: Icon, color, delay }) => (
    <div
        className="group relative overflow-hidden rounded-xl bg-card/40 border border-border/50 p-4 transition-all duration-300 hover:-translate-y-1 hover:bg-card/60 hover:shadow-lg hover:shadow-primary/5 animate-slide-up"
        style={{ animationDelay: `${delay}ms` }}
    >
        <div className="flex items-start justify-between">
            <div>
                <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">{label}</p>
                <p className="mt-2 text-2xl font-heading font-bold text-foreground group-hover:text-primary transition-colors">
                    {value}
                </p>
            </div>
            <div className={cn("p-2 rounded-lg bg-background/50 group-hover:scale-110 transition-transform duration-300", color)}>
                <Icon className="w-5 h-5" />
            </div>
        </div>
        {/* Hover glow effect */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
    </div>
);

const Profile = () => {
    const { userId } = useParams();
    const { user } = useAuth();
    const navigate = useNavigate();
    const [profile, setProfile] = useState(null);
    const [stats, setStats] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [isFriend, setIsFriend] = useState(false);
    const [friendRequestPending, setFriendRequestPending] = useState(false);
    const [editForm, setEditForm] = useState({});
    const [onlineUsers, setOnlineUsers] = useState(new Set());
    const socket = useSocket();

    const targetUserId = userId || user?._id;
    const isOwnProfile = targetUserId === user?._id;

    useEffect(() => {
        const fetchProfile = async () => {
            if (!targetUserId) return;

            try {
                const { data } = await api.get(`/users/${targetUserId}/profile`);
                setProfile(data);
                setStats(data.stats); // Backend now returns stats nested
                setEditForm(data);
            } catch (error) {
                toast.error('Profile not found');
                navigate('/');
            } finally {
                setLoading(false);
            }
        };

        const checkFriendship = async () => {
            try {
                const { data: friends } = await api.get('/friends');
                const isF = friends.some((f) => f._id === targetUserId);
                setIsFriend(isF);

                // Check requests (optional refinement)
            } catch (e) { console.error(e); }
        };

        if (targetUserId) {
            fetchProfile();
            if (!isOwnProfile) {
                checkFriendship();
            }
        }
    }, [targetUserId, user, navigate, isOwnProfile]);

    // Socket presence tracking 

    useEffect(() => {
        if (!socket) return;

        // Request initial status? No event for that usually, just wait for broadcast or connection.
        // Actually, backend emits on connection. If we join late, we might miss it?
        // No, backend emits to ALL clients on any connect/disconnect.
        // But what if we navigate to Profile page and we missed the last emit?
        // We might want to ask for it? 
        // For now, rely on standard broadcast. Ideally backend should emit on "request_online_users".
        // But let's just listen.

        socket.on('online_users', (users) => {
            setOnlineUsers(new Set(users));
        });

        return () => {
            socket.off('online_users');
        };
    }, [socket]);

    const handleSave = async () => {
        if (!user) return;
        setSaving(true);

        try {
            // Handle Password Change if fields are present
            if (editForm.currentPassword || editForm.newPassword) {
                if (!editForm.currentPassword || !editForm.newPassword) {
                    toast.error("Please fill in both current and new password");
                    setSaving(false);
                    return;
                }
                if (editForm.newPassword !== editForm.confirmNewPassword) {
                    toast.error("New passwords do not match");
                    setSaving(false);
                    return;
                }

                await api.post('/auth/change-password', {
                    currentPassword: editForm.currentPassword,
                    newPassword: editForm.newPassword
                });
                toast.success('Password updated securely');
                // Clear password fields
                setEditForm(prev => ({ ...prev, currentPassword: '', newPassword: '', confirmNewPassword: '' }));
            }

            // Handle Profile Update
            const { data } = await api.put(`/users/${user._id}/profile`, {
                full_name: editForm.full_name,
                bio: editForm.bio,
                instagram_username: editForm.instagram_username,
                discord_link: editForm.discord_link,
                is_private: editForm.is_private,
                avatar_url: editForm.avatar_url,
            });

            toast.success('Profile saved! ✨');
            setProfile(prev => prev ? { ...prev, ...data } : null);
            setIsEditing(false);
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to save changes');
        } finally {
            setSaving(false);
        }
    };

    const handleFileUpload = async (event) => {
        // Mock upload for now or disable
        toast.info("Custom uploads are disabled. Please use the Avatar Library.");
    };

    const sendFriendRequest = async () => {
        if (!user || !targetUserId) return;

        try {
            await api.post('/friends/request', { toUserId: targetUserId });
            toast.success('Friend request sent! 🤝');
            setFriendRequestPending(true);
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to send request');
        }
    };

    const canViewFullProfile = isOwnProfile || !profile?.is_private || isFriend;

    const statItems = [
        { label: 'Games Played', value: stats?.rooms_participated || 0, icon: Target, color: 'text-primary' },
        { label: 'Wins', value: stats?.wins || 0, icon: Trophy, color: 'text-success' },
        { label: 'Losses', value: stats?.losses || 0, icon: Flame, color: 'text-destructive' },
        { label: 'Total Score', value: stats?.total_score || 0, icon: Star, color: 'text-secondary' },
    ];

    if (loading) {
        return <LoadingScreen />;
    }

    return (
        <div className="min-h-screen bg-background text-foreground font-body overflow-x-hidden">
            <Header />

            {/* Animated Background */}
            <div className="fixed inset-0 pointer-events-none -z-10">
                <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/5 via-background to-background" />
                <div className="absolute -top-[20%] -left-[10%] w-[50vw] h-[50vw] bg-primary/10 rounded-full blur-[100px] animate-pulse" style={{ animationDuration: '8s' }} />
                <div className="absolute top-[20%] -right-[10%] w-[40vw] h-[40vw] bg-secondary/5 rounded-full blur-[100px] animate-pulse" style={{ animationDuration: '10s', animationDelay: '1s' }} />
            </div>

            <main className="pt-24 pb-12 px-4 container mx-auto max-w-5xl">
                <div className="mb-6">
                    <BackButton />
                </div>
                <div className="animate-slide-up">
                    {/* Profile Hero Card */}
                    <GlassCard className="relative overflow-hidden border-primary/20 p-0">
                        {/* Subtle Banner Background inside card */}
                        <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-primary/10 to-transparent opacity-50 pointer-events-none" />

                        <div className="p-6 md:p-10 flex flex-col md:flex-row items-center md:items-start gap-8 relative z-10">
                            {/* Avatar Section */}
                            <div className="relative group shrink-0">
                                {/* Animated Ring */}
                                <div className="absolute -inset-1 rounded-full bg-gradient-to-tr from-primary via-secondary to-primary opacity-70 blur-md group-hover:opacity-100 group-hover:blur-lg transition-all duration-500 animate-spin-slow" />

                                <Avatar className="w-32 h-32 md:w-40 md:h-40 border-4 border-background shadow-2xl relative z-10 group-hover:scale-105 transition-transform duration-300">
                                    <AvatarImage src={profile?.avatar_url || undefined} className="object-cover" />
                                    <AvatarFallback className="bg-card text-primary text-5xl font-heading font-bold">
                                        {canViewFullProfile ? profile?.full_name?.charAt(0) : <Lock className="w-12 h-12" />}
                                    </AvatarFallback>
                                </Avatar>

                                {/* Online Indicator */}
                                <div
                                    className={cn(
                                        "absolute bottom-2 right-2 w-5 h-5 border-4 border-card rounded-full z-20 shadow-lg",
                                        onlineUsers.has(profile?._id) ? "bg-green-500" : "bg-red-500"
                                    )}
                                    title={onlineUsers.has(profile?._id) ? "Online" : "Offline"}
                                />
                            </div>

                            {/* Info Section */}
                            <div className="flex-1 text-center md:text-left space-y-4 w-full">
                                <div className="flex flex-col md:flex-row justify-between items-center md:items-start gap-4">
                                    <div>
                                        <h1 className="text-3xl md:text-4xl font-heading font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-white/70">
                                            {profile?.full_name}
                                        </h1>
                                        <p className="text-lg text-muted-foreground font-medium flex items-center justify-center md:justify-start gap-2">
                                            @{profile?.username}
                                            {profile?.is_private && <Lock className="w-4 h-4 opacity-50" />}
                                        </p>
                                    </div>

                                    <div className="flex items-center gap-3">
                                        {isOwnProfile ? (
                                            <GameButton
                                                variant="outline"
                                                size="sm"
                                                onClick={() => setIsEditing(true)}
                                                className="border-primary/50 hover:bg-primary/10 hover:border-primary group"
                                            >
                                                <Edit2 className="w-4 h-4 mr-2 group-hover:rotate-12 transition-transform" />
                                                Edit Profile
                                            </GameButton>
                                        ) : (
                                            !isFriend && !friendRequestPending && (
                                                <GameButton onClick={sendFriendRequest} size="sm" className="shadow-lg shadow-primary/20">
                                                    <UserPlus className="w-4 h-4 mr-2" />
                                                    Add Friend
                                                </GameButton>
                                            )
                                        )}
                                        {friendRequestPending && (
                                            <GameButton variant="secondary" size="sm" disabled>
                                                <Check className="w-4 h-4 mr-2" />
                                                Request Sent
                                            </GameButton>
                                        )}
                                    </div>
                                </div>

                                {/* Bio & Socials */}
                                {canViewFullProfile && (
                                    <div className="space-y-4 max-w-2xl">
                                        {profile?.bio && (
                                            <div className="relative group">
                                                <div className="absolute -inset-0.5 bg-gradient-to-r from-primary/20 to-secondary/20 rounded-xl blur opacity-20 group-hover:opacity-40 transition duration-500" />
                                                <div className="relative bg-card/40 backdrop-blur-sm border border-white/10 p-6 rounded-xl overflow-hidden">
                                                    <Quote className="absolute top-4 right-4 w-8 h-8 text-primary/10 -rotate-12 transform group-hover:scale-110 transition-transform duration-500" />
                                                    <Quote className="absolute bottom-4 left-4 w-8 h-8 text-primary/10 rotate-180 transform group-hover:scale-110 transition-transform duration-500" />

                                                    <div className="relative z-10">
                                                        <span className="text-[10px] font-bold uppercase tracking-widest text-primary/70 mb-2 block">
                                                            Player Bio
                                                        </span>
                                                        <p className="text-lg italic text-foreground/90 leading-relaxed font-light">
                                                            "{profile.bio}"
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 pt-2">
                                            {profile?.instagram_username && (
                                                <a
                                                    href={`https://instagram.com/${profile.instagram_username}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-background/40 border border-white/5 hover:bg-white/5 hover:border-primary/30 transition-all duration-300 group"
                                                >
                                                    <Instagram className="w-4 h-4 text-[#E1306C] group-hover:scale-110 transition-transform" />
                                                    <span className="text-sm font-medium">{profile.instagram_username}</span>
                                                </a>
                                            )}
                                            {profile?.discord_link && (
                                                <a
                                                    href={profile.discord_link}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-background/40 border border-white/5 hover:bg-white/5 hover:border-[#5865F2]/30 transition-all duration-300 group"
                                                >
                                                    <MessageCircle className="w-4 h-4 text-[#5865F2] group-hover:scale-110 transition-transform" />
                                                    <span className="text-sm font-medium">Discord</span>
                                                </a>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </GlassCard>

                    {/* Stats Grid */}
                    <div className="mt-8">
                        <h3 className="text-xl font-heading font-bold mb-4 opacity-90 flex items-center gap-2">
                            <Trophy className="w-5 h-5 text-primary" />
                            Player Stats
                        </h3>

                        {canViewFullProfile ? (
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                {statItems.map((item, idx) => (
                                    <StatCard key={item.label} {...item} delay={idx * 100} />
                                ))}
                            </div>
                        ) : (
                            <GlassCard className="py-12 text-center border-dashed border-white/10 bg-card/20">
                                <Lock className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3" />
                                <p className="text-muted-foreground font-medium">Stats are private</p>
                                <p className="text-sm text-muted-foreground/60">Add {profile?.full_name} friend to view their stats</p>
                            </GlassCard>
                        )}
                    </div>
                </div>
            </main>

            <Dialog open={isEditing} onOpenChange={setIsEditing}>
                <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto bg-card border-primary/20 backdrop-blur-xl p-0 gap-0">
                    <div className="sticky top-0 bg-inherit z-10 p-6 border-b border-white/10 flex justify-between items-center backdrop-blur-md">
                        <DialogTitle className="text-xl font-heading font-bold text-primary">Edit Profile</DialogTitle>
                        <button
                            onClick={() => setIsEditing(false)}
                            className="p-1 rounded-full hover:bg-white/10 transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    <div className="p-6 pt-2">
                        <Tabs defaultValue="info" className="w-full">
                            <TabsList className="grid w-full grid-cols-3 mb-6 bg-background/50">
                                <TabsTrigger value="info" className="font-heading text-xs tracking-wider">
                                    <Edit2 className="w-3 h-3 mr-2" />
                                    Info
                                </TabsTrigger>
                                <TabsTrigger value="avatar" className="font-heading text-xs tracking-wider">
                                    <Gamepad2 className="w-3 h-3 mr-2" />
                                    Avatar
                                </TabsTrigger>
                                <TabsTrigger value="security" className="font-heading text-xs tracking-wider">
                                    <Lock className="w-3 h-3 mr-2" />
                                    Security
                                </TabsTrigger>
                            </TabsList>

                            <TabsContent value="info" className="space-y-6">
                                <div className="space-y-4">
                                    <GameInput
                                        label="Full Name"
                                        value={editForm.full_name || ''}
                                        onChange={(e) => setEditForm(prev => ({ ...prev, full_name: e.target.value }))}
                                        className="bg-background/50"
                                    />

                                    <div className="space-y-2">
                                        <Label className="text-xs uppercase tracking-wider text-muted-foreground font-bold">Bio</Label>
                                        <Textarea
                                            value={editForm.bio || ''}
                                            onChange={(e) => setEditForm(prev => ({ ...prev, bio: e.target.value }))}
                                            placeholder="Write something about your gaming style..."
                                            className="bg-background/50 border-input focus:border-primary/50 min-h-[100px] resize-none"
                                        />
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <GameInput
                                            label="Instagram"
                                            value={editForm.instagram_username || ''}
                                            onChange={(e) => setEditForm(prev => ({ ...prev, instagram_username: e.target.value }))}
                                            placeholder="username"
                                            className="bg-background/50"
                                        />
                                        <GameInput
                                            label="Discord"
                                            value={editForm.discord_link || ''}
                                            onChange={(e) => setEditForm(prev => ({ ...prev, discord_link: e.target.value }))}
                                            placeholder="Invite Link"
                                            className="bg-background/50"
                                        />
                                    </div>

                                    <div className="flex items-center justify-between p-4 rounded-xl bg-background/30 border border-white/5">
                                        <div>
                                            <Label className="text-base cursor-pointer" htmlFor="private-mode">Private Mode</Label>
                                            <p className="text-xs text-muted-foreground mt-1">Hide stats from non-friends</p>
                                        </div>
                                        <Switch
                                            id="private-mode"
                                            checked={editForm.is_private || false}
                                            onCheckedChange={(checked) => setEditForm(prev => ({ ...prev, is_private: checked }))}
                                        />
                                    </div>
                                </div>
                            </TabsContent>

                            <TabsContent value="avatar" className="space-y-6">
                                <div className="flex flex-col items-center justify-center p-6 bg-background/30 rounded-xl mb-4 border border-white/5">
                                    <Label className="mb-4 text-muted-foreground uppercase tracking-widest text-xs">Current Avatar Preview</Label>
                                    <Avatar className="w-32 h-32 border-4 border-primary/20 shadow-xl">
                                        <AvatarImage src={editForm.avatar_url || profile?.avatar_url || undefined} />
                                        <AvatarFallback className="bg-card text-primary text-4xl font-heading">
                                            {editForm.full_name?.charAt(0) || user?.email?.charAt(0)}
                                        </AvatarFallback>
                                    </Avatar>
                                </div>

                                {/* Custom Upload Section */}
                                <div className="space-y-2">
                                    <Label className="text-xs uppercase tracking-wider text-muted-foreground font-bold mb-2">Upload Custom Image</Label>
                                    <div className="flex items-center gap-3">
                                        <Input
                                            type="file"
                                            accept="image/*"
                                            onChange={handleFileUpload}
                                            className="bg-background/50 cursor-pointer file:cursor-pointer file:text-primary file:font-bold file:border-0 file:bg-transparent file:text-sm file:mr-4 hover:file:text-primary/80"
                                            disabled={uploading}
                                        />
                                        {uploading && <Loader2 className="w-5 h-5 animate-spin text-primary" />}
                                    </div>
                                    <p className="text-xs text-muted-foreground">Max size 2MB. Supported: JPG, PNG, GIF</p>
                                </div>

                                <div className="relative my-4">
                                    <div className="absolute inset-0 flex items-center">
                                        <span className="w-full border-t border-border/50" />
                                    </div>
                                    <div className="relative flex justify-center text-xs uppercase">
                                        <span className="bg-card px-2 text-muted-foreground">Or Choose from Library</span>
                                    </div>
                                </div>

                                <AvatarSelection
                                    currentAvatarUrl={editForm.avatar_url || null}
                                    onSelect={(url) => setEditForm(prev => ({ ...prev, avatar_url: url }))}
                                />

                            </TabsContent>

                            <TabsContent value="security" className="space-y-6">
                                <div className="space-y-4">
                                    <div className="p-4 rounded-xl bg-primary/5 border border-primary/20 mb-4">
                                        <h4 className="flex items-center gap-2 font-bold text-primary mb-2">
                                            <Lock className="w-4 h-4" />
                                            Password Management
                                        </h4>
                                        <p className="text-xs text-muted-foreground">
                                            Update your password regularly to keep your account secure.
                                        </p>
                                    </div>

                                    <div className="space-y-4">
                                        <GameInput
                                            type="password"
                                            label="Current Password"
                                            placeholder="••••••••"
                                            value={editForm.currentPassword || ''}
                                            onChange={(e) => setEditForm(prev => ({ ...prev, currentPassword: e.target.value }))}
                                            className="bg-background/50"
                                        />
                                        <div className="h-px bg-white/5 my-2" />
                                        <GameInput
                                            type="password"
                                            label="New Password"
                                            placeholder="••••••••"
                                            value={editForm.newPassword || ''}
                                            onChange={(e) => setEditForm(prev => ({ ...prev, newPassword: e.target.value }))}
                                            className="bg-background/50"
                                        />
                                        <GameInput
                                            type="password"
                                            label="Confirm New Password"
                                            placeholder="••••••••"
                                            value={editForm.confirmNewPassword || ''}
                                            onChange={(e) => setEditForm(prev => ({ ...prev, confirmNewPassword: e.target.value }))}
                                            className="bg-background/50"
                                        />
                                    </div>
                                </div>
                            </TabsContent>
                        </Tabs>

                        <div className="pt-4 border-t border-white/5 flex gap-3 mt-4">
                            <GameButton
                                variant="ghost"
                                onClick={() => setIsEditing(false)}
                                className="flex-1"
                            >
                                Cancel
                            </GameButton>
                            <GameButton
                                onClick={handleSave}
                                className="flex-1"
                                disabled={saving}
                            >
                                {saving ? <div className="animate-spin mr-2 w-4 h-4 border-2 border-white/20 border-t-white rounded-full" /> : <Save className="w-4 h-4 mr-2" />}
                                Save Changes
                            </GameButton>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default Profile;
