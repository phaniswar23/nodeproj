import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { GameButton } from '@/components/ui/GameButton';
import { ArrowLeft, Save, User, Palette, Info, Eye } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from 'sonner';
import api from '@/lib/api';

import AssetPicker from '@/components/profile/AssetPicker';

const EditProfile = () => {
    const { user, refreshUser } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);

    // Form State (Info Tab)
    const [info, setInfo] = useState({
        displayName: '',
        bio: '',
        instagramUsername: '',
        discordLink: '',
        privateProfile: false
    });

    // Visuals State
    const [avatarId, setAvatarId] = useState('avatar_default');
    const [banner, setBanner] = useState({ type: 'color', value: '#7289da' });
    const [activeVisualType, setActiveVisualType] = useState('avatar'); // 'avatar' or 'banner'

    // Initialize from User
    useEffect(() => {
        console.log("EditProfile: User detected", user);
        if (user) {
            console.log("EditProfile: Transforming user to internal state", user.profile);
            setInfo({
                displayName: user.profile?.display_name || user.full_name || '',
                bio: user.profile?.bio || user.bio || '',
                instagramUsername: user.profile?.instagram_username || '',
                discordLink: user.profile?.discord_link || '',
                privateProfile: user.profile?.is_private || false
            });
            // Handle Assets: new structure or legacy fallback
            // Handle Assets
            if (user.profile?.avatarId) setAvatarId(user.profile.avatarId);
            else if (user.avatar_url) setAvatarId(user.avatar_url); // Fallback logic

            if (user.profile?.banner) setBanner(user.profile.banner);
            else if (user.banner_url) setBanner({ type: 'color', value: user.banner_url });
        }
    }, [user]);


    // Save Handler for Info & Visuals
    const handleSave = async () => {
        setLoading(true);
        console.log("EditProfile: Saving...", { ...info, avatarId, banner });
        try {
            // Consolidated Update
            // API: PUT /api/profile
            await api.put('/profile', {
                ...info,
                avatarId,
                banner
            });

            toast.success("Profile changes saved successfully!");
            await refreshUser(); // Reload user context
        } catch (error) {
            console.error("Save error:", error);
            // Show more specific error if available
            const msg = error.response?.data?.message || "Failed to save changes. Please try again.";
            toast.error(msg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex h-screen w-screen bg-[#313338] overflow-hidden">
            {/* LEFT PANEL: Editor Controls */}
            <div className="w-full max-w-[500px] h-full bg-[#1e1f22] border-r border-[#111214] flex flex-col shadow-2xl z-20">
                {/* Header */}
                <div className="p-6 border-b border-[#111214] flex items-center justify-between bg-[#111214]/50 backdrop-blur-md">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => navigate('/profile')}
                            className="w-8 h-8 rounded-full bg-[#2f3136] hover:bg-[#40444b] flex items-center justify-center transition-colors group"
                        >
                            <ArrowLeft className="w-4 h-4 text-[#b9bbbe] group-hover:text-white" />
                        </button>
                        <h1 className="text-xl font-heading font-bold text-white tracking-wide">Edit Profile</h1>
                    </div>
                </div>

                {/* Tabs & Content */}
                <Tabs defaultValue="info" className="flex-1 flex flex-col overflow-hidden">
                    <div className="px-6 pt-6 pb-2">
                        <TabsList className="bg-[#111214] p-1 w-full justify-start h-12 rounded-xl border border-white/5">
                            <TabsTrigger value="info" className="flex-1 h-9 text-xs font-bold uppercase tracking-wider data-[state=active]:bg-[#5865f2] data-[state=active]:text-white transition-all">
                                <Info className="w-4 h-4 mr-2" /> Info
                            </TabsTrigger>
                            <TabsTrigger value="visuals" className="flex-1 h-9 text-xs font-bold uppercase tracking-wider data-[state=active]:bg-[#5865f2] data-[state=active]:text-white transition-all">
                                <Palette className="w-4 h-4 mr-2" /> Visuals
                            </TabsTrigger>
                        </TabsList>
                    </div>

                    <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
                        {/* INFO TAB */}
                        <TabsContent value="info" className="space-y-6 mt-0">
                            {/* Identity */}
                            <div className="space-y-4">
                                <h3 className="text-xs font-bold text-[#b9bbbe] uppercase tracking-widest pl-1">Identity</h3>
                                <div className="space-y-4 bg-[#2b2d31] p-4 rounded-xl border border-white/5">
                                    <div>
                                        <label className="text-[10px] font-bold text-[#b9bbbe] uppercase mb-1.5 block">Display Name</label>
                                        <Input
                                            value={info.displayName}
                                            onChange={e => setInfo({ ...info, displayName: e.target.value })}
                                            className="bg-[#1e1f22] border-none focus:ring-1 focus:ring-[#5865f2]"
                                        />
                                    </div>
                                    <div className="grid grid-cols-1 gap-4">
                                        {/* Pronouns Field Removed */}
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-bold text-[#b9bbbe] uppercase mb-1.5 block">Bio</label>
                                        <Textarea
                                            value={info.bio}
                                            onChange={e => setInfo({ ...info, bio: e.target.value })}
                                            className="bg-[#1e1f22] border-none focus:ring-1 focus:ring-[#5865f2] min-h-[100px] resize-none"
                                            placeholder="Tell us about yourself..."
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Socials */}
                            <div className="space-y-4">
                                <h3 className="text-xs font-bold text-[#b9bbbe] uppercase tracking-widest pl-1">Socials</h3>
                                <div className="space-y-4 bg-[#2b2d31] p-4 rounded-xl border border-white/5">
                                    <div>
                                        <label className="text-[10px] font-bold text-[#b9bbbe] uppercase mb-1.5 block">Instagram Username</label>
                                        <div className="relative">
                                            <span className="absolute left-3 top-2.5 text-gray-500 text-sm">@</span>
                                            <Input
                                                value={info.instagramUsername}
                                                onChange={e => setInfo({ ...info, instagramUsername: e.target.value })}
                                                className="bg-[#1e1f22] border-none focus:ring-1 focus:ring-[#5865f2] pl-8"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-bold text-[#b9bbbe] uppercase mb-1.5 block">Discord Link</label>
                                        <Input
                                            value={info.discordLink}
                                            onChange={e => setInfo({ ...info, discordLink: e.target.value })}
                                            placeholder="https://discord.gg/..."
                                            className="bg-[#1e1f22] border-none focus:ring-1 focus:ring-[#5865f2]"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Privacy */}
                            <div className="bg-[#2b2d31] p-4 rounded-xl border border-white/5 flex items-center justify-between">
                                <div>
                                    <h4 className="text-sm font-bold text-white">Private Profile</h4>
                                    <p className="text-xs text-[#b9bbbe]">Hide stats from non-friends</p>
                                </div>
                                <Switch
                                    checked={info.privateProfile}
                                    onCheckedChange={(c) => setInfo({ ...info, privateProfile: c })}
                                />
                            </div>
                        </TabsContent>

                        {/* VISUALS TAB */}
                        <TabsContent value="visuals" className="space-y-6 mt-0 h-full flex flex-col">
                            {/* Toggle between Avatar / Banner Picker */}
                            <div className="flex gap-2 bg-[#2b2d31] p-1 rounded-lg self-start">
                                <button
                                    onClick={() => setActiveVisualType('avatar')}
                                    className={`px-4 py-1.5 text-xs font-bold uppercase rounded-md transition-all ${activeVisualType === 'avatar' ? 'bg-[#5865f2] text-white shadow-lg' : 'text-[#b9bbbe] hover:text-white'}`}
                                >
                                    Avatar
                                </button>
                                <button
                                    onClick={() => setActiveVisualType('banner')}
                                    className={`px-4 py-1.5 text-xs font-bold uppercase rounded-md transition-all ${activeVisualType === 'banner' ? 'bg-[#5865f2] text-white shadow-lg' : 'text-[#b9bbbe] hover:text-white'}`}
                                >
                                    Banner
                                </button>
                            </div>

                            {/* Asset Picker Area */}
                            <div className="flex-1 bg-[#2b2d31] rounded-xl border border-white/5 overflow-hidden min-h-[400px]">
                                <AssetPicker
                                    type={activeVisualType}
                                    onSelect={(val) => {
                                        console.log("EditProfile received Asset:", val, "Type:", activeVisualType);
                                        if (activeVisualType === 'banner') setBanner(val);
                                        else setAvatarId(val);
                                    }}
                                />
                            </div>
                        </TabsContent>
                    </div>

                    {/* Footer Actions (Only for Info/Visuals) */}
                    <TabsContent value="info" className="mt-0 p-6 bg-[#111214] border-t border-white/5 flex justify-end">
                        <GameButton onClick={handleSave} disabled={loading} className="px-8 shadow-green-500/20 bg-green-600 hover:bg-green-700">
                            {loading ? 'Saving...' : <><Save className="w-4 h-4 mr-2" /> Save Changes</>}
                        </GameButton>
                    </TabsContent>
                    <TabsContent value="visuals" className="mt-0 p-6 bg-[#111214] border-t border-white/5 flex justify-end">
                        <GameButton onClick={handleSave} disabled={loading} className="px-8 shadow-green-500/20 bg-green-600 hover:bg-green-700">
                            {loading ? 'Saving...' : <><Save className="w-4 h-4 mr-2" /> Save Changes</>}
                        </GameButton>
                    </TabsContent>
                </Tabs>
            </div>

            {/* RIGHT PANEL: Live Preview */}
            <div className="flex-1 bg-[#0b0c0e] relative flex flex-col items-center justify-center p-12 overflow-hidden">
                {/* Decorative Grid */}
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e1f22_1px,transparent_1px),linear-gradient(to_bottom,#1e1f22_1px,transparent_1px)] bg-[size:40px_40px] opacity-10 pointer-events-none" />

                <div className="flex items-center gap-2 mb-8 text-[#5865f2] opacity-80">
                    <Eye className="w-5 h-5" />
                    <span className="text-xs font-bold uppercase tracking-[0.2em]">Live Preview</span>
                </div>

                {/* THE PROFILE CARD PREVIEW */}
                <div className="w-full max-w-[500px] animate-in zoom-in-95 duration-500">
                    <div className="bg-[#111214] rounded-2xl overflow-hidden shadow-2xl relative border border-[#1e1f22]">
                        {/* Dynamic Banner */}
                        <div
                            className="h-40 w-full relative overflow-hidden transition-all duration-500"
                            style={{
                                background: banner.value || '#1e1f22'
                            }}
                        >
                            {/* If image type, render img tag for better scaling? Or just background. Background covers well. */}
                            {banner.type === 'image' && (
                                <img src={banner.value} className="w-full h-full object-cover absolute inset-0" alt="Banner" />
                            )}
                            <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[#111214]/90" />
                        </div>

                        <div className="px-8 pb-8 relative">
                            {/* Avatar */}
                            <div className="-mt-16 w-32 h-32 rounded-full border-[6px] border-[#111214] bg-[#111214] relative z-10 overflow-hidden shadow-2xl group cursor-default">
                                <Avatar className="w-full h-full">
                                    <AvatarImage
                                        src={
                                            avatarId.startsWith('http') || avatarId.startsWith('data:')
                                                ? avatarId
                                                : (() => {
                                                    let style = 'avataaars';
                                                    if (avatarId.includes('Gamer') || avatarId.includes('Cyber') || avatarId.includes('Bot')) style = 'bottts';
                                                    else if (avatarId.includes('Esports') || avatarId.includes('Abstract') || avatarId.includes('Minimal')) style = 'identicon';
                                                    else if (avatarId.includes('Retro')) style = 'pixel-art';
                                                    return `https://api.dicebear.com/7.x/${style}/svg?seed=${avatarId}`;
                                                })()
                                        }
                                        className="object-cover"
                                    />
                                    <AvatarFallback className="bg-[#1e1f22] text-white text-3xl font-bold">
                                        {info.displayName?.[0]}
                                    </AvatarFallback>
                                </Avatar>
                                {/* Active Ring Mock */}
                                <div className="absolute inset-0 rounded-full border-[2px] border-green-500/50 animate-pulse" />
                            </div>

                            {/* Info */}
                            <div className="mt-4">
                                <h2 className="text-2xl font-bold text-white">{info.displayName || 'Display Name'}</h2>
                                <div className="flex items-center gap-2 text-[#b9bbbe]">
                                    <span className="text-lg">@{user?.username}</span>
                                    {info.privateProfile && (
                                        <div className="flex items-center gap-1 bg-[#2f3136] px-2 py-0.5 rounded-md border border-[#ed4245]/20 text-[#ed4245]">
                                            <span className="w-1.5 h-1.5 rounded-full bg-[#ed4245] animate-pulse" />
                                            <span className="text-[10px] font-bold uppercase tracking-wider">Private</span>
                                        </div>
                                    )}
                                </div>

                                {/* Socials Preview */}
                                {(info.instagramUsername || info.discordLink) && (
                                    <div className="flex items-center gap-3 mt-3 pt-3 border-t border-white/5">
                                        {info.instagramUsername && (
                                            <div className="flex items-center gap-1.5 text-xs text-[#b9bbbe]">
                                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg>
                                                <span>@{info.instagramUsername.replace('@', '')}</span>
                                            </div>
                                        )}
                                        {info.discordLink && (
                                            <div className="flex items-center gap-1.5 text-xs text-[#b9bbbe]">
                                                <svg viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5"><path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.419-2.1568 2.419zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.419-2.1568 2.419z"></path></svg>
                                                <span>Discord</span>
                                            </div>
                                        )}
                                    </div>
                                )}

                                <div className="mt-6 p-4 bg-[#1e1f22] rounded-xl border border-white/5">
                                    <h3 className="text-[10px] font-bold text-[#b9bbbe] uppercase tracking-widest mb-2">About</h3>
                                    <p className="text-sm text-gray-300 leading-relaxed whitespace-pre-wrap">
                                        {info.bio || <span className="italic opacity-50">No bio set...</span>}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EditProfile;
