import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import api from '@/lib/api';
import { useNavigate } from 'react-router-dom';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { toast } from 'sonner';
import {
    Edit2, ArrowLeft, Trophy, Target, Flame, Star,
    Instagram, Gamepad2, Copy, Check, Lock
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { LoadingScreen } from '@/components/ui/LoadingScreen';
import { GameButton } from '@/components/ui/GameButton';
import { motion, AnimatePresence } from 'framer-motion';
import {
    HoverCard,
    HoverCardContent,
    HoverCardTrigger,
} from "@/components/ui/hover-card";

// --- SUB-COMPONENTS ---

const InfoCard = ({ title, children, className, delay = 0 }) => (
    <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay, ease: "easeOut" }}
        className={cn("bg-[#111214]/60 backdrop-blur-xl border border-white/5 rounded-2xl p-6 relative overflow-hidden group", className)}
    >
        {/* Subtle Gradient Glow */}
        <div className="absolute top-0 right-0 w-[200px] h-[200px] bg-white/5 blur-[80px] rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none opacity-0 group-hover:opacity-50 transition-opacity duration-700" />

        {title && (
            <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-4 flex items-center gap-2">
                {title}
            </h3>
        )}
        <div className="relative z-10">
            {children}
        </div>
    </motion.div>
);

const StatCard = ({ icon: Icon, label, value, color, delay = 0 }) => (
    <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        whileHover={{ y: -5, scale: 1.02 }}
        transition={{ duration: 0.3, delay }}
        className="bg-[#111214]/40 backdrop-blur-sm p-5 rounded-2xl border border-white/5 flex flex-col justify-between h-32 hover:border-white/20 transition-all cursor-default group relative overflow-hidden"
    >
        <div className="flex justify-between items-start z-10">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest group-hover:text-white/70 transition-colors">{label}</span>
            <div className={cn("p-1.5 rounded-lg bg-white/5 opacity-50 group-hover:opacity-100 transition-all", color.replace('text-', 'text-opacity-80 '))}>
                <Icon className={cn("w-4 h-4", color)} />
            </div>
        </div>

        <div className="relative z-10">
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: delay + 0.2 }}
                className="text-3xl font-mono font-bold text-white tracking-tight"
            >
                {value}
            </motion.div>
        </div>

        {/* Dynamic Glow */}
        <div className={cn("absolute -bottom-10 -right-10 w-32 h-32 rounded-full blur-[50px] opacity-0 group-hover:opacity-20 transition-opacity duration-500", color.replace('text-', 'bg-'))} />
    </motion.div>
);

const ConnectionItem = ({ icon: Icon, label, value, link, colorClass }) => {
    const [copied, setCopied] = useState(false);

    const handleCopy = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (!value) return;
        navigator.clipboard.writeText(value);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
        toast.success(`Copied ${label} to clipboard`);
    };

    if (!value) return null;

    return (
        <HoverCard openDelay={0} closeDelay={100}>
            <HoverCardTrigger asChild>
                <a
                    href={link || "#"}
                    target={link ? "_blank" : "_self"}
                    rel="noopener noreferrer"
                    className={cn(
                        "flex items-center gap-5 p-4 rounded-xl bg-white/5 border border-transparent hover:border-white/10 hover:bg-white/10 transition-all group relative overflow-hidden cursor-pointer no-underline"
                    )}
                    onClick={!link ? handleCopy : undefined}
                >
                    <div className={cn("w-12 h-12 rounded-full flex items-center justify-center bg-black/40 shadow-inner shrink-0", colorClass)}>
                        <Icon className="w-6 h-6 text-white" />
                    </div>

                    <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{label}</p>
                        <p className="text-base font-bold text-white truncate">{value}</p>
                    </div>

                    <div className="bg-black/20 p-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity scale-90 group-hover:scale-100 shrink-0">
                        {link ? <ArrowLeft className="w-4 h-4 text-white rotate-135" /> : (
                            copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4 text-white" />
                        )}
                    </div>
                </a>
            </HoverCardTrigger>
            <HoverCardContent className="w-80 bg-[#1e1f22] border-white/10 p-6 shadow-2xl rounded-xl z-50">
                <div className="flex flex-col items-center gap-4 text-center">
                    <div className={cn("w-20 h-20 rounded-full flex items-center justify-center bg-black/40 shadow-xl ring-4 ring-white/5", colorClass)}>
                        <Icon className="w-10 h-10 text-white" />
                    </div>
                    <div className="space-y-1 w-full">
                        <h4 className="text-xs font-bold text-[#b9bbbe] uppercase tracking-widest">{label} Username</h4>
                        <div className="p-3 bg-black/50 rounded-lg border border-white/5 break-all">
                            <p className="text-lg font-bold text-white font-mono">{value}</p>
                        </div>
                    </div>
                    <p className="text-[10px] text-gray-500">
                        {link ? "Click to open link" : "Click to copy username"}
                    </p>
                </div>
            </HoverCardContent>
        </HoverCard>
    );
};

const Profile = () => {
    const { user: currentUser } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [profile, setProfile] = useState(null);

    // Determines if we are viewing our own profile
    const userId = currentUser?._id;
    const isOwnProfile = true;

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const { data } = await api.get(`/users/${userId}/profile`);
                setProfile(data);
            } catch (error) {
                console.error(error);
                toast.error("Failed to load profile");
            } finally {
                setLoading(false);
            }
        };

        if (userId) fetchProfile();
    }, [userId]);

    if (loading) return <LoadingScreen />;

    // Helper to get Banner Style
    const getBannerStyle = () => {
        const b = profile?.profile?.banner || { type: 'color', value: profile?.banner_url || '#1e1f22' };
        if (b.type === 'image') return { backgroundImage: `url(${b.value})`, backgroundSize: 'cover', backgroundPosition: 'center' };
        if (b.type === 'gradient' || b.type === 'preset') return { background: b.value };
        return { backgroundColor: b.value };
    };

    const getAvatarSrc = () => {
        const avatarId = profile?.profile?.avatarId || profile?.avatar_url || 'avatar_default';
        if (avatarId.startsWith('http') || avatarId.startsWith('data:')) return avatarId;

        // Dicebear fallback logic
        const style = (avatarId.includes('Gamer') || avatarId.includes('Cyber') || avatarId.includes('Bot')) ? 'bottts' :
            (avatarId.includes('Esports') || avatarId.includes('Abstract') || avatarId.includes('Minimal')) ? 'identicon' :
                avatarId.includes('Retro') ? 'pixel-art' : 'avataaars';

        return `https://api.dicebear.com/7.x/${style}/svg?seed=${avatarId}`;
    };

    return (
        <div className="min-h-screen w-screen bg-[#0b0c0e] flex items-center justify-center p-4 selection:bg-primary/30 font-body relative overflow-hidden">
            {/* Background Ambience */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
                <div className="absolute top-[-20%] left-[-10%] w-[60vw] h-[60vw] bg-blue-900/10 blur-[150px] rounded-full mix-blend-screen" />
                <div className="absolute bottom-[-20%] right-[-10%] w-[60vw] h-[60vw] bg-purple-900/10 blur-[150px] rounded-full mix-blend-screen" />
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] mix-blend-overlay" />
            </div>

            {/* Back Button (Floating) */}
            <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5 }}
                className="absolute top-6 left-6 z-50"
            >
                <button
                    onClick={() => navigate('/')}
                    className="flex items-center gap-2 px-4 py-2 bg-black/40 backdrop-blur-md rounded-full border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all group shadow-lg"
                >
                    <ArrowLeft className="w-4 h-4 text-[#b9bbbe] group-hover:text-white transition-colors" />
                    <span className="text-xs font-bold text-[#b9bbbe] group-hover:text-white uppercase tracking-widest hidden sm:block">Back</span>
                </button>
            </motion.div>

            {/* MAIN PROFILE CARD */}
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, type: 'spring', bounce: 0.3 }}
                className="w-full max-w-3xl bg-[#111214] rounded-3xl border border-white/10 overflow-hidden shadow-2xl relative z-20 flex flex-col"
            >
                {/* Banner Section inside Card */}
                <div className="h-48 w-full relative overflow-hidden group">
                    <div className="absolute inset-0 transition-transform duration-700 group-hover:scale-105" style={{ ...getBannerStyle() }} />
                    <div className="absolute inset-0 bg-gradient-to-b from-black/20 to-[#111214]/90" />
                </div>

                <div className="px-8 pb-8 flex-1 flex flex-col relative">
                    {/* Header Row: Avatar + Name + Actions */}
                    <div className="flex flex-col sm:flex-row items-center sm:items-end gap-6 -mt-20 mb-8 relative z-10">
                        {/* Avatar */}
                        <div className="relative shrink-0">
                            <div className="w-32 h-32 rounded-full p-1 bg-[#111214] ring-4 ring-[#111214] shadow-2xl relative overflow-hidden group/avatar">
                                <Avatar className="w-full h-full rounded-full border-2 border-white/5 bg-[#1e1f22]">
                                    <AvatarImage src={getAvatarSrc()} className="object-cover" />
                                    <AvatarFallback className="bg-[#1e1f22] text-white text-3xl font-bold">{profile?.full_name?.[0]}</AvatarFallback>
                                </Avatar>
                                {/* Active Indicator Ring */}
                                <div className={cn(
                                    "absolute inset-0 rounded-full border-2 opacity-0 group-hover/avatar:opacity-100 transition-opacity",
                                    (profile?.profile?.status === 'dnd' ? "border-red-500/50" :
                                        profile?.profile?.status === 'offline' ? "border-gray-500/50" :
                                            "border-green-500/50")
                                )} />
                            </div>
                            <div className={cn(
                                "absolute bottom-2 right-2 w-5 h-5 rounded-full border-[3px] border-[#111214] shadow-sm z-20",
                                (profile?.profile?.status === 'dnd' ? "bg-red-500" :
                                    profile?.profile?.status === 'offline' ? "bg-gray-500" :
                                        "bg-green-500")
                            )} title={profile?.profile?.status === 'dnd' ? 'Do Not Disturb' : profile?.profile?.status === 'offline' ? 'Invisible' : 'Online'} />
                        </div>

                        {/* Name & Title */}
                        <div className="flex-1 text-center sm:text-left min-w-0">
                            <h1 className="text-3xl font-heading font-bold text-white tracking-wide truncate">
                                {profile?.profile?.display_name || profile?.full_name}
                            </h1>
                            <p className="text-[#b9bbbe] font-mono text-sm">@{profile?.username}</p>
                        </div>

                        {/* Edit Action */}
                        {isOwnProfile && (
                            <div className="shrink-0 mt-4 sm:mt-0">
                                <GameButton onClick={() => navigate('/profile/edit')} className="px-6 py-2 text-xs h-9 bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 hover:text-white shadow-none">
                                    <Edit2 className="w-3.5 h-3.5 mr-2" /> Edit Profile
                                </GameButton>
                            </div>
                        )}
                    </div>

                    {/* TWO COLUMN GRID: Sidebar (Info) vs Main (Stats) */}
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

                        {/* LEFT: About & Connections */}
                        <div className="space-y-6 lg:col-span-5">
                            {/* ABOUT */}
                            <div className="space-y-2">
                                <h3 className="text-[10px] font-bold text-[#b9bbbe] uppercase tracking-widest flex items-center gap-2">
                                    About
                                </h3>
                                <div className="p-4 rounded-xl bg-[#0b0c0e]/50 border border-white/5">
                                    <p className="text-sm text-gray-300 leading-relaxed font-medium">
                                        {profile?.profile?.bio || <span className="text-gray-600 italic">No bio set yet.</span>}
                                    </p>
                                </div>
                            </div>

                            {/* CONNECTIONS (Only show if present) */}
                            {(profile?.profile?.instagram_username || profile?.profile?.discord_link) && (
                                <div className="space-y-2">
                                    <h3 className="text-[10px] font-bold text-[#b9bbbe] uppercase tracking-widest flex items-center gap-2">
                                        Connections
                                    </h3>
                                    <div className="space-y-3">
                                        <ConnectionItem
                                            icon={Instagram}
                                            label="Instagram"
                                            value={profile?.profile?.instagram_username ? `@${profile.profile.instagram_username}` : null}
                                            link={profile?.profile?.instagram_username ? `https://instagram.com/${profile.profile.instagram_username}` : null}
                                            colorClass="from-yellow-500 via-pink-500 to-purple-600 bg-gradient-to-tr"
                                        />
                                        <ConnectionItem
                                            icon={Gamepad2}
                                            label="Discord"
                                            value={profile?.profile?.discord_link}
                                            colorClass="bg-[#5865F2]"
                                        />
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* RIGHT: Stats Grid */}
                        <div className="lg:col-span-7 space-y-2">
                            <h3 className="text-[10px] font-bold text-[#b9bbbe] uppercase tracking-widest pl-1">
                                Career Performance
                            </h3>

                            {(!profile?.profile?.is_private || isOwnProfile) ? (
                                <div className="grid grid-cols-2 gap-3">
                                    <StatCard icon={Target} label="Games" value={profile?.stats?.rooms_participated || 0} color="text-cyan-400" />
                                    <StatCard icon={Trophy} label="Wins" value={profile?.stats?.wins || 0} color="text-emerald-400" />
                                    <StatCard icon={Flame} label="Losses" value={profile?.stats?.losses || 0} color="text-rose-400" />
                                    <StatCard icon={Star} label="Score" value={profile?.stats?.total_score || 0} color="text-amber-400" />
                                </div>
                            ) : (
                                <div className="h-40 rounded-xl border border-dashed border-white/10 bg-[#0b0c0e]/30 flex flex-col items-center justify-center gap-3 text-gray-600">
                                    <Lock className="w-6 h-6 opacity-50" />
                                    <span className="text-xs font-bold uppercase tracking-widest">Stats Hidden</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

export default Profile;
