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
import { motion, AnimatePresence } from 'framer-motion';

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
                className="text-3xl font-heading font-black text-white tracking-tight"
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
        <a
            href={link || "#"}
            target={link ? "_blank" : "_self"}
            rel="noopener noreferrer"
            className={cn(
                "flex items-center gap-4 p-3 rounded-xl bg-white/5 border border-transparent hover:border-white/10 hover:bg-white/10 transition-all group relative overflow-hidden cursor-pointer no-underline"
            )}
            onClick={!link ? handleCopy : undefined}
        >
            <div className={cn("w-10 h-10 rounded-full flex items-center justify-center bg-black/40 shadow-inner", colorClass)}>
                <Icon className="w-5 h-5 text-white" />
            </div>

            <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-muted-foreground uppercase">{label}</p>
                <p className="text-sm font-bold text-white truncate">{value}</p>
            </div>

            <div className="bg-black/20 p-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity scale-90 group-hover:scale-100">
                {link ? <ArrowLeft className="w-4 h-4 text-white rotate-135" /> : (
                    copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4 text-white" />
                )}
            </div>
        </a>
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

        let style = 'avataaars';
        if (avatarId.includes('Gamer') || avatarId.includes('Cyber') || avatarId.includes('Bot')) style = 'bottts';
        else if (avatarId.includes('Esports') || avatarId.includes('Abstract') || avatarId.includes('Minimal')) style = 'identicon';
        else if (avatarId.includes('Retro')) style = 'pixel-art';

        return `https://api.dicebear.com/7.x/${style}/svg?seed=${avatarId}`;
    };

    return (
        <div className="min-h-screen w-screen bg-[#0b0c0e] text-foreground font-body overflow-y-auto custom-scrollbar selection:bg-primary/30">

            {/* Background Ambience */}
            <div className="fixed inset-0 bg-[#0b0c0e] pointer-events-none z-0">
                <div className="absolute top-[-20%] left-[-10%] w-[60vw] h-[60vw] bg-blue-900/10 blur-[150px] rounded-full" />
                <div className="absolute bottom-[-20%] right-[-10%] w-[60vw] h-[60vw] bg-purple-900/10 blur-[150px] rounded-full" />
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] mix-blend-overlay" />
            </div>

            {/* Sticky Back Button */}
            <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5 }}
                className="fixed top-8 left-8 z-50 group cursor-pointer"
                onClick={() => navigate('/')}
            >
                <div className="flex items-center gap-3 px-4 py-2.5 bg-black/40 backdrop-blur-md rounded-full border border-white/5 hover:bg-white/10 hover:border-white/20 transition-all shadow-xl">
                    <ArrowLeft className="w-5 h-5 text-gray-400 group-hover:text-white transition-colors" />
                    <span className="text-xs font-bold text-gray-400 group-hover:text-white uppercase tracking-widest hidden sm:block pr-1">Back</span>
                </div>
            </motion.div>

            <main className="relative flex flex-col items-center min-h-full pt-0 pb-20 z-10 w-full">

                {/* HERO BANNER SECTION */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 1 }}
                    className="w-full h-80 relative overflow-hidden"
                >
                    <div className="absolute inset-0 transition-transform hover:scale-105" style={{ ...getBannerStyle(), transitionDuration: '20s' }} />
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#0b0c0e]/40 to-[#0b0c0e]" />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0b0c0e] via-transparent to-transparent opacity-90" />
                </motion.div>

                <div className="w-full max-w-5xl px-6 md:px-10 -mt-32 space-y-12 mb-20">

                    {/* PROFILE HEADER */}
                    <div className="flex flex-col md:flex-row items-center md:items-end gap-8">

                        {/* Avatar */}
                        <motion.div
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ type: "spring", stiffness: 100, delay: 0.2 }}
                            className="relative"
                        >
                            <div className="w-40 h-40 md:w-48 md:h-48 rounded-full p-1.5 bg-[#0b0c0e] ring-2 ring-white/10 relative z-20 shadow-2xl">
                                <Avatar className="w-full h-full rounded-full border-4 border-[#121316] bg-[#1e1f22]">
                                    <AvatarImage src={getAvatarSrc()} className="object-cover" />
                                    <AvatarFallback className="bg-[#1e1f22] text-white text-5xl font-bold">
                                        {profile?.full_name?.[0]}
                                    </AvatarFallback>
                                </Avatar>
                            </div>


                        </motion.div>

                        {/* Name & Actions */}
                        <div className="flex-1 text-center md:text-left pb-4 space-y-3">
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.3 }}
                                className="flex flex-col md:flex-row md:items-center gap-4 md:gap-8"
                            >
                                <h1 className="text-4xl md:text-6xl font-heading font-black text-white leading-none tracking-tight drop-shadow-2xl">
                                    {profile?.profile?.display_name || profile?.full_name}
                                </h1>

                                {isOwnProfile && (
                                    <motion.button
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                        onClick={() => navigate('/profile/edit')}
                                        className="mx-auto md:mx-0 px-5 py-2 rounded-full border border-white/20 bg-white/5 hover:bg-white/10 text-white transition-all font-bold text-[10px] uppercase tracking-widest flex items-center gap-2 group backdrop-blur-sm self-start mt-2"
                                    >
                                        <Edit2 className="w-3 h-3 text-gray-400 group-hover:text-white transition-colors" />
                                        <span>Edit Profile</span>
                                    </motion.button>
                                )}
                            </motion.div>

                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.4 }}
                                className="flex items-center justify-center md:justify-start gap-4"
                            >
                                <p className="text-gray-400 text-lg font-medium tracking-wide">@{profile?.username}</p>
                                {profile?.profile?.pronouns && (
                                    <>
                                        <span className="w-1.5 h-1.5 rounded-full bg-gray-600" />
                                        <span className="text-gray-500 text-sm font-bold uppercase tracking-wider">{profile.profile.pronouns}</span>
                                    </>
                                )}
                            </motion.div>
                        </div>
                    </div>

                    {/* CONTENT GRID */}
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-6">

                        {/* LEFT COLUMN: About & Stats (8 cols) */}
                        <div className="md:col-span-8 space-y-6">

                            {/* Bio Card */}
                            <InfoCard title="About" className="min-h-[160px]" delay={0.4}>
                                <p className="text-gray-300 leading-relaxed text-lg font-light text-pretty">
                                    {profile?.profile?.bio || profile?.bio || <span className="opacity-30 italic">No bio written yet. Just vibing in the void.</span>}
                                </p>
                            </InfoCard>

                            {/* Player Stats */}
                            <div className="space-y-4">
                                <motion.h3
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.5 }}
                                    className="text-xs font-bold text-muted-foreground uppercase tracking-widest pl-2"
                                >
                                    Career Stats
                                </motion.h3>

                                {(!profile?.profile?.is_private || isOwnProfile) ? (
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                                        <StatCard icon={Target} label="Games" value={profile?.stats?.games_played || "0"} color="text-cyan-400" delay={0.5} />
                                        <StatCard icon={Trophy} label="Wins" value={profile?.stats?.wins || "0"} color="text-emerald-400" delay={0.6} />
                                        <StatCard icon={Flame} label="Losses" value={profile?.stats?.losses || "0"} color="text-rose-400" delay={0.7} />
                                        <StatCard icon={Star} label="Score" value={profile?.stats?.total_score || "0"} color="text-amber-400" delay={0.8} />
                                    </div>
                                ) : (
                                    <div className="p-10 border border-dashed border-white/10 rounded-2xl bg-white/5 flex flex-col items-center justify-center gap-3">
                                        <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center">
                                            <Lock className="w-5 h-5 text-gray-500" />
                                        </div>
                                        <p className="text-gray-500 font-bold uppercase tracking-widest text-xs">Stats are private</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* RIGHT COLUMN: Connections (4 cols) */}
                        <div className="md:col-span-4 space-y-6">
                            <InfoCard title="Connections" className="h-full" delay={0.6}>
                                <div className="space-y-3">
                                    {(!profile?.profile?.instagram_username && !profile?.profile?.discord_link) && (
                                        <div className="py-8 text-center">
                                            <p className="text-sm text-gray-500 italic">No connections added.</p>
                                        </div>
                                    )}

                                    <ConnectionItem
                                        icon={Instagram}
                                        label="Instagram"
                                        value={profile?.profile?.instagram_username ? `@${profile.profile.instagram_username}` : null}
                                        link={profile?.profile?.instagram_username ? `https://instagram.com/${profile.profile.instagram_username}` : null}
                                        colorClass="bg-gradient-to-tr from-yellow-500 via-pink-500 to-purple-600"
                                    />

                                    <ConnectionItem
                                        icon={Gamepad2}
                                        label="Discord"
                                        value={profile?.profile?.discord_link}
                                        colorClass="bg-[#5865F2]"
                                    />
                                </div>
                            </InfoCard>
                        </div>

                    </div>

                </div>
            </main>
        </div>
    );
};

export default Profile;
