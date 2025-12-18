import { Link } from 'react-router-dom';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { GameButton } from '@/components/ui/GameButton';
import {
    X, User, Gamepad2, Trophy, Medal,
    Instagram, Globe, ExternalLink
} from 'lucide-react';
import { cn } from '@/lib/utils';

export const ProfileCard = ({ user, profile, onClose }) => {

    // Mock Stats - In a real app, these would come from the profile prop
    const stats = [
        { icon: Gamepad2, label: "Matches", value: profile?.games_played || "0" },
        { icon: Trophy, label: "Win Rate", value: profile?.win_rate || "0%" },
        { icon: Medal, label: "Rank", value: profile?.rank || "Novice" },
    ];

    if (!profile) return null;

    return (
        <>
            {/* Backdrop - Transparent layer to handle outside clicks */}
            <div
                className="fixed inset-0 z-40 bg-transparent"
                onClick={onClose}
            />

            {/* Card Container */}
            <div
                className="absolute top-16 right-4 sm:right-6 z-50 w-[340px] bg-[#1e1f22]/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/5 overflow-hidden animate-in fade-in zoom-in-95 duration-200 origin-top-right text-left"
                role="dialog"
            >
                {/* 1. Header Banner */}
                <div className="h-28 w-full bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 relative">
                    {/* Close Button overlapping banner */}
                    <button
                        onClick={onClose}
                        className="absolute top-3 right-3 p-1.5 bg-black/20 hover:bg-black/40 rounded-full text-white/80 hover:text-white transition-colors backdrop-blur-sm"
                    >
                        <X className="w-4 h-4" />
                    </button>

                    {/* Subtle Pattern/Texture */}
                    <div className="absolute inset-0 opacity-20 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] mix-blend-overlay" />
                </div>

                {/* 2. Avatar & Identity */}
                <div className="px-6 pb-6 relative">
                    <div className="flex justify-between items-end -mt-10 mb-3">
                        {/* Avatar */}
                        <div className="relative">
                            <Avatar className="w-20 h-20 border-[6px] border-[#1e1f22] bg-[#1e1f22] ring-offset-[#1e1f22] shadow-lg group hover:ring-4 hover:ring-primary/20 transition-all duration-300">
                                <AvatarImage src={profile?.avatar_url} className="object-cover" />
                                <AvatarFallback className="bg-[#2f3136] text-white text-xl font-bold">
                                    {profile?.full_name?.[0]}
                                </AvatarFallback>
                            </Avatar>
                            {/* Online Status */}
                            <div className="absolute bottom-1 right-1 w-5 h-5 bg-green-500 border-[4px] border-[#1e1f22] rounded-full z-20 shadow-sm" title="Online" />
                        </div>
                    </div>

                    <div className="mb-6">
                        <div className="flex items-center gap-2">
                            <h2 className="text-xl font-bold text-white leading-tight">
                                {profile?.full_name}
                            </h2>
                        </div>
                        <p className="text-[#b9bbbe] text-sm font-medium">@{profile?.username}</p>

                        {/* Bio */}
                        {profile?.bio ? (
                            <p className="mt-3 text-sm text-gray-300 leading-relaxed line-clamp-2">
                                {profile.bio}
                            </p>
                        ) : (
                            <p className="mt-3 text-sm text-gray-500 italic">No bio yet.</p>
                        )}
                    </div>

                    {/* 3. User Stats */}
                    <div className="grid grid-cols-3 gap-2 mb-6 p-3 bg-[#2b2d31]/50 rounded-xl border border-white/5">
                        {stats.map((stat, i) => (
                            <div key={i} className="flex flex-col items-center justify-center p-1">
                                <stat.icon className="w-4 h-4 text-[#b9bbbe] mb-1.5" />
                                <span className="text-sm font-bold text-white">{stat.value}</span>
                                <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">{stat.label}</span>
                            </div>
                        ))}
                    </div>

                    {/* 4. Social Presence */}
                    {(profile?.instagram_username || profile?.discord_link || profile?.website) && (
                        <div className="flex gap-3 mb-6">
                            {profile.instagram_username && (
                                <a
                                    href={`https://instagram.com/${profile.instagram_username}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="p-2 bg-[#2b2d31] hover:bg-[#404249] rounded-lg text-pink-400 transition-all hover:-translate-y-0.5"
                                    title="Instagram"
                                >
                                    <Instagram className="w-4 h-4" />
                                </a>
                            )}
                            {profile.discord_link && (
                                <div
                                    className="p-2 bg-[#2b2d31] hover:bg-[#404249] rounded-lg text-indigo-400 transition-all hover:-translate-y-0.5 cursor-pointer"
                                    title="Discord"
                                    onClick={() => {/* Copy or open logic */ }}
                                >
                                    <Gamepad2 className="w-4 h-4" />
                                </div>
                            )}
                        </div>
                    )}

                    {/* 5. Footer Actions */}
                    <Link to="/profile" onClick={onClose} className="block w-full">
                        <GameButton
                            variant="secondary"
                            className="w-full bg-[#5865F2] hover:bg-[#4752c4] text-white border-none shadow-md"
                        >
                            View Full Profile
                        </GameButton>
                    </Link>
                </div>
            </div>
        </>
    );
};
