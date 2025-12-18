import { useState, useEffect } from 'react';
import { useSettings } from '@/context/SettingsContext';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@/components/theme/ThemeProvider';
import api from '@/lib/api';
import { toast } from 'sonner';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Switch } from '@/components/ui/switch';
import { GameButton } from '@/components/ui/GameButton';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
    X, LogOut, User, Lock, Instagram,
    Gamepad2, Edit2, Check, Palette,
    Monitor, Zap, AlertTriangle, Eye, EyeOff, ShieldAlert
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Link } from 'react-router-dom';

// --- Reusable Inline Field Component ---
const InlineField = ({
    label,
    value,
    icon: Icon,
    onSave,
    isPrivate,
    multiline = false,
    placeholder = "Not set",
    editable = true
}) => {
    const [isEditing, setIsEditing] = useState(false);
    const [tempValue, setTempValue] = useState(value || '');
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        setTempValue(value || '');
    }, [value]);

    const handleSave = async () => {
        if (tempValue === value) {
            setIsEditing(false);
            return;
        }
        setSaving(true);
        try {
            await onSave(tempValue);
            setIsEditing(false);
            toast.success(`${label} updated`);
        } catch (error) {
            toast.error("Failed to update");
            setTempValue(value || '');
        } finally {
            setSaving(false);
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !multiline && !e.shiftKey) {
            e.preventDefault();
            handleSave();
        }
        if (e.key === 'Escape') {
            setIsEditing(false);
            setTempValue(value || '');
        }
    };

    return (
        <div className="group flex items-start gap-4 p-3 rounded-lg hover:bg-white/5 transition-colors duration-150 relative">
            <div className="mt-1 text-muted-foreground group-hover:text-foreground transition-colors">
                {Icon ? <Icon className="w-5 h-5" /> : <div className="w-5 h-5" />}
            </div>

            <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-0.5">
                    {label}
                </p>

                {isEditing ? (
                    <div className="flex gap-2 items-start mt-1 animate-in fade-in zoom-in-95 duration-100">
                        {multiline ? (
                            <Textarea
                                value={tempValue}
                                onChange={(e) => setTempValue(e.target.value)}
                                className="bg-[#1e1f22] border-none focus:ring-1 focus:ring-primary min-h-[80px] text-sm resize-none"
                                autoFocus
                                onKeyDown={handleKeyDown}
                            />
                        ) : (
                            <Input
                                value={tempValue}
                                onChange={(e) => setTempValue(e.target.value)}
                                className="bg-[#1e1f22] border-none focus:ring-1 focus:ring-primary h-8 text-sm"
                                autoFocus
                                onKeyDown={handleKeyDown}
                            />
                        )}
                        <div className="flex flex-col gap-1">
                            <button
                                onClick={handleSave}
                                disabled={saving}
                                className="h-8 w-8 bg-green-600/20 hover:bg-green-600/30 text-green-500 rounded-md flex items-center justify-center transition-colors"
                            >
                                {saving ? <Check className="w-4 h-4" /> : <Check className="w-4 h-4" />}
                            </button>
                            <button
                                onClick={() => { setIsEditing(false); setTempValue(value || ''); }}
                                className="h-8 w-8 bg-red-600/20 hover:bg-red-600/30 text-red-500 rounded-md flex items-center justify-center transition-colors"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="flex justify-between items-start">
                        <div className="text-sm font-medium text-foreground py-1 break-words">
                            {value || <span className="text-muted-foreground italic text-xs">{placeholder}</span>}
                            {isPrivate && <Lock className="inline w-3 h-3 ml-2 text-muted-foreground/50" />}
                        </div>
                        {editable && (
                            <button
                                onClick={() => setIsEditing(true)}
                                className="opacity-0 group-hover:opacity-100 transition-all duration-150 p-1.5 hover:bg-white/10 rounded-full text-muted-foreground hover:text-white transform hover:scale-105"
                                title="Edit"
                            >
                                <Edit2 className="w-3.5 h-3.5" />
                            </button>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

// --- Sidebar Item ---
const SidebarItem = ({ icon: Icon, label, isActive, onClick, variant = 'default' }) => (
    <button
        onClick={onClick}
        className={cn(
            "w-full flex items-center gap-3 px-3 py-2.5 rounded-md transition-all duration-150 text-left font-medium text-sm group relative overflow-hidden",
            isActive
                ? "bg-[#3f4147] text-white"
                : "text-[#b9bbbe] hover:bg-[#35373c] hover:text-[#dcddde] hover:translate-x-1",
            variant === 'danger' && "text-red-400 hover:bg-red-500/10 hover:text-red-400"
        )}
    >
        {isActive && <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary rounded-r-full" />}
        {Icon && <Icon className={cn("w-4 h-4 transition-colors", isActive ? "text-white" : "text-muted-foreground group-hover:text-foreground")} />}
        <span>{label}</span>
    </button>
);

export const SettingsModal = () => {
    const { isOpen, closeSettings } = useSettings();
    const { user, signOut } = useAuth();
    const { theme, setTheme } = useTheme();

    // UI State
    const [activeTab, setActiveTab] = useState('account');
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(false);

    // Modal States
    const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
    const [showChangePassword, setShowChangePassword] = useState(false);
    const [showDeleteAccount, setShowDeleteAccount] = useState(false);

    // Form States
    const [passwordForm, setPasswordForm] = useState({ current: '', new: '', confirm: '' });
    const [deleteForm, setDeleteForm] = useState({ password: '' });
    const [formLoading, setFormLoading] = useState(false);
    const [deleteError, setDeleteError] = useState(false);
    const [showDeletePassword, setShowDeletePassword] = useState(false);

    // Fetch Profile
    useEffect(() => {
        if (isOpen && user) {
            const fetchProfile = async () => {
                setLoading(true);
                try {
                    const { data } = await api.get(`/users/${user._id || user.id}/profile`);
                    setProfile(data);
                } catch (error) {
                    console.error(error);
                    toast.error("Could not load profile");
                } finally {
                    setLoading(false);
                }
            };
            fetchProfile();
        }
    }, [isOpen, user]);

    // Handlers
    const handleUpdate = async (field, value) => {
        if (!user) return;
        try {
            const updatedProfile = { ...profile, [field]: value };
            await api.put(`/users/${user._id || user.id}/profile`, updatedProfile);
            setProfile(updatedProfile);
        } catch (error) {
            throw error;
        }
    };

    const handleChangePassword = async (e) => {
        e.preventDefault();
        if (passwordForm.new !== passwordForm.confirm) {
            toast.error("New passwords do not match");
            return;
        }
        if (passwordForm.new.length < 6) {
            toast.error("Password must be at least 6 characters");
            return;
        }
        setFormLoading(true);
        try {
            await api.post('/auth/change-password', {
                currentPassword: passwordForm.current,
                newPassword: passwordForm.new
            });
            toast.success("Password updated successfully");
            setShowChangePassword(false);
            setPasswordForm({ current: '', new: '', confirm: '' });
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to update password");
        } finally {
            setFormLoading(false);
        }
    };

    const handleDeleteAccount = async (e) => {
        e.preventDefault();
        setFormLoading(true);
        setDeleteError(false);
        try {
            // Verify password and delete account via secure endpoint
            await api.post('/users/delete-account', {
                password: deleteForm.password
            });

            toast.success("Account deleted");
            closeSettings();
            signOut();
        } catch (error) {
            console.error(error);
            setDeleteError(true);
            setTimeout(() => setDeleteError(false), 500); // Reset shake after 500ms
            // Don't toast if showing inline error visually
        } finally {
            setFormLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
                onClick={closeSettings}
            />

            {/* Modal Container */}
            <div
                className="relative z-10 w-full max-w-[1100px] h-[80vh] bg-[#313338] rounded-2xl shadow-2xl overflow-hidden flex animate-in zoom-in-95 duration-200 border border-white/5"
                role="dialog"
                aria-modal="true"
            >
                {/* ESC Close */}
                <div
                    className="absolute top-4 right-4 z-50 flex flex-col items-center gap-1 group cursor-pointer hover:scale-105 transition-transform"
                    onClick={closeSettings}
                >
                    <div className="w-8 h-8 rounded-full bg-[#18191c] flex items-center justify-center text-[#b9bbbe] group-hover:text-white transition-colors border-2 border-transparent group-hover:border-white/20">
                        <X className="w-5 h-5" />
                    </div>
                </div>

                {/* Sidebar */}
                <aside className="w-[240px] bg-[#2f3136] flex flex-col h-full shrink-0 border-r border-[#1e1f22]/30 pt-8 pb-4 px-3">
                    <div className="px-3 mb-6">
                        <h2 className="text-xs font-bold text-muted-foreground/70 uppercase tracking-wider">User Settings</h2>
                    </div>
                    <nav className="space-y-1 flex-1">
                        <SidebarItem
                            label="My Account"
                            isActive={activeTab === 'account'}
                            onClick={() => setActiveTab('account')}
                            icon={User}
                        />
                        <SidebarItem
                            label="Appearance"
                            isActive={activeTab === 'appearance'}
                            onClick={() => setActiveTab('appearance')}
                            icon={Palette}
                        />
                        <div className="my-3 border-b border-white/5 mx-2" />
                        <SidebarItem
                            label="Log Out"
                            isActive={false}
                            variant="danger"
                            onClick={() => setShowLogoutConfirm(true)}
                            icon={LogOut}
                        />
                    </nav>
                </aside>

                {/* Main Content */}
                <main className="flex-1 h-full overflow-y-auto bg-[#313338] custom-scrollbar scroll-smooth relative">
                    <div className="max-w-[740px] mx-auto py-12 px-10 pb-20">

                        {/* Tab: My Account */}
                        {activeTab === 'account' && (
                            <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                                <h1 className="text-xl font-bold text-white mb-6">My Account</h1>

                                {/* 1. Account Preview Card */}
                                <div className="bg-[#18191c] rounded-xl overflow-hidden shadow-lg mb-8 relative group">
                                    <div className="h-[160px] w-full bg-gradient-to-r from-[#e91e63] to-[#9c27b0] relative" />

                                    <div className="px-6 pb-6 relative">
                                        <div className="flex justify-between items-end -mt-12 mb-6">
                                            <div className="flex items-end gap-5">
                                                <div className="relative group/avatar cursor-pointer">
                                                    <Avatar className="w-28 h-28 border-[7px] border-[#18191c] bg-[#18191c] ring-offset-[#18191c]">
                                                        <AvatarImage src={profile?.avatar_url} className="object-cover" />
                                                        <AvatarFallback className="bg-[#2f3136] text-white text-2xl">{profile?.full_name?.[0]}</AvatarFallback>
                                                    </Avatar>
                                                    <div className="absolute bottom-1 right-1 w-[26px] h-[26px] bg-green-500 border-[5px] border-[#18191c] rounded-full z-20" title="Online" />
                                                </div>
                                                <div className="mb-2">
                                                    <h2 className="text-2xl font-bold text-white leading-tight">{profile?.full_name}</h2>
                                                    <p className="text-[#b9bbbe] text-sm">@{profile?.username}</p>
                                                </div>
                                            </div>

                                            <div className="flex gap-3 mb-2">
                                                <GameButton
                                                    onClick={() => toast.success("Previewing public profile...")}
                                                    variant="secondary"
                                                    className="bg-[#2f3136] hover:bg-[#3f4147] text-white h-8 text-xs font-medium px-4 shadow-md"
                                                >
                                                    Preview Public
                                                </GameButton>
                                                <GameButton
                                                    onClick={() => { }}
                                                    className="bg-[#5865F2] hover:bg-[#4752c4] text-white h-8 text-xs font-medium px-4 shadow-md"
                                                >
                                                    Edit User Profile
                                                </GameButton>
                                            </div>
                                        </div>

                                        {/* 2. Profile Information */}
                                        <div className="bg-[#2f3136] rounded-lg p-3 space-y-0.5">
                                            <InlineField label="Display Name" value={profile?.full_name} icon={User} onSave={(val) => handleUpdate('full_name', val)} />
                                            <InlineField label="Username" value={profile?.username} icon={User} onSave={(val) => handleUpdate('username', val)} />
                                            <InlineField label="Bio" value={profile?.bio} placeholder="Write a note..." multiline icon={Edit2} onSave={(val) => handleUpdate('bio', val)} />
                                        </div>

                                        <div className="mt-6">
                                            <div className="bg-[#2f3136] rounded-lg p-3 space-y-0.5">
                                                <InlineField label="Instagram" value={profile?.instagram_username ? `@${profile.instagram_username}` : ''} placeholder="Add Instagram" icon={Instagram} onSave={(val) => handleUpdate('instagram_username', val.replace('@', ''))} />
                                                <InlineField label="Discord" value={profile?.discord_link} placeholder="Add Discord" icon={Gamepad2} onSave={(val) => handleUpdate('discord_link', val)} />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* 3. Privacy & Security */}
                                <div className="space-y-6">
                                    <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Password & Authentication</h3>

                                    <div className="space-y-4">
                                        <GameButton onClick={() => setShowChangePassword(true)} className="bg-[#5865F2] hover:bg-[#4752c4] text-white w-auto px-6">
                                            Change Password
                                        </GameButton>

                                        <div className="bg-[#2f3136] p-4 rounded-lg flex items-center justify-between border border-black/10">
                                            <div className="flex gap-4 items-center">
                                                <div className="w-10 h-10 rounded-full bg-[#202225] flex items-center justify-center">
                                                    <Lock className="w-5 h-5 text-muted-foreground" />
                                                </div>
                                                <div>
                                                    <h3 className="text-sm font-bold text-white">Private Profile</h3>
                                                    <p className="text-xs text-muted-foreground">Hides stats and social links from others.</p>
                                                </div>
                                            </div>
                                            <Switch
                                                checked={profile?.is_private || false}
                                                onCheckedChange={(c) => handleUpdate('is_private', c)}
                                                className="data-[state=checked]:bg-green-500"
                                            />
                                        </div>
                                    </div>

                                    {/* Account Removal */}
                                    <div className="pt-8 border-t border-white/5">
                                        <h3 className="text-xs font-bold text-red-400 uppercase tracking-wider mb-2">Account Removal</h3>
                                        <p className="text-xs text-muted-foreground mb-4">Deleting your account is permanent and cannot be undone.</p>
                                        <div className="flex gap-4">
                                            <GameButton
                                                variant="outline"
                                                className="border-yellow-600/50 text-yellow-500 hover:bg-yellow-500/10"
                                                onClick={async () => {
                                                    try {
                                                        await api.post('/users/disable-account');
                                                        toast.success("Account disabled successfully");
                                                        signOut();
                                                    } catch (error) {
                                                        toast.error("Failed to disable account");
                                                    }
                                                }}
                                            >
                                                Disable Account
                                            </GameButton>
                                            <GameButton
                                                variant="danger"
                                                className="bg-transparent border border-red-500 text-red-500 hover:bg-red-500 hover:text-white"
                                                onClick={() => setShowDeleteAccount(true)}
                                            >
                                                Delete Account
                                            </GameButton>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Tab: Appearance */}
                        {activeTab === 'appearance' && (
                            <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                                <h1 className="text-xl font-bold text-white mb-6">Appearance</h1>
                                <div className="space-y-6">
                                    {/* Preview */}
                                    <div className="bg-[#2f3136] p-6 rounded-lg border border-black/10">
                                        <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-4">Theme Preview</h3>
                                        <div className="bg-[#313338] p-4 rounded-md border border-[#1e1f22] flex gap-4 items-center">
                                            <div className="w-10 h-10 rounded-full bg-primary/20" />
                                            <div className="space-y-2 flex-1">
                                                <div className="h-3 w-1/3 bg-primary/20 rounded-full" />
                                                <div className="h-2 w-2/3 bg-muted rounded-full" />
                                            </div>
                                            <GameButton size="sm">Button</GameButton>
                                        </div>
                                    </div>

                                    {/* Settings */}
                                    <div className="bg-[#2f3136] rounded-lg p-2 divide-y divide-black/10">
                                        <div className="p-4 flex items-center justify-between">
                                            <div>
                                                <h3 className="text-sm font-medium text-white mb-1">Theme</h3>
                                                <p className="text-xs text-muted-foreground">Dark / Light / Sync</p>
                                            </div>
                                            <div className="flex bg-[#202225] p-1 rounded-lg">
                                                <button onClick={() => setTheme('dark')} className={cn("px-3 py-1 rounded text-xs font-medium transition-colors", theme === 'dark' ? "bg-[#40444b] text-white shadow-sm" : "text-muted-foreground hover:text-white")}>Dark</button>
                                                <button onClick={() => setTheme('light')} className={cn("px-3 py-1 rounded text-xs font-medium transition-colors", theme === 'light' ? "bg-white text-black shadow-sm" : "text-muted-foreground hover:text-white")}>Light</button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </main>

                {/* --- MODAL OVERLAYS --- */}

                {/* 1. Change Password Modal */}
                {showChangePassword && (
                    <div className="absolute inset-0 z-[60] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
                        <div className="bg-[#313338] w-full max-w-md p-6 rounded-lg shadow-2xl border border-white/10 animate-in zoom-in-95 duration-200">
                            <h3 className="text-xl font-bold text-white mb-6">Change Password</h3>
                            <form onSubmit={handleChangePassword} className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-muted-foreground uppercase">Current Password</label>
                                    <Input
                                        type="password"
                                        value={passwordForm.current}
                                        onChange={e => setPasswordForm(p => ({ ...p, current: e.target.value }))}
                                        className="bg-[#1e1f22] border-none"
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-muted-foreground uppercase">New Password</label>
                                    <Input
                                        type="password"
                                        value={passwordForm.new}
                                        onChange={e => setPasswordForm(p => ({ ...p, new: e.target.value }))}
                                        className="bg-[#1e1f22] border-none"
                                        required
                                        minLength={6}
                                    />
                                    {/* Strength Meter */}
                                    {passwordForm.new && (
                                        <div className="flex gap-1 h-1 mt-2">
                                            <div className={cn("h-full rounded-full flex-1 transition-colors duration-300",
                                                passwordForm.new.length < 6 ? "bg-red-500" : "bg-red-500" // Always filled first if typed
                                            )} />
                                            <div className={cn("h-full rounded-full flex-1 transition-colors duration-300",
                                                passwordForm.new.length >= 8 ? "bg-yellow-500" : "bg-white/5"
                                            )} />
                                            <div className={cn("h-full rounded-full flex-1 transition-colors duration-300",
                                                passwordForm.new.length >= 10 && /[0-9]/.test(passwordForm.new) ? "bg-green-500" : "bg-white/5"
                                            )} />
                                        </div>
                                    )}
                                    <p className="text-[10px] text-muted-foreground text-right mt-1">
                                        {passwordForm.new.length < 6 && <span className="text-red-400">Weak</span>}
                                        {passwordForm.new.length >= 6 && passwordForm.new.length < 10 && <span className="text-yellow-400">Fair</span>}
                                        {passwordForm.new.length >= 10 && <span className="text-green-400">Strong</span>}
                                    </p>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-muted-foreground uppercase">Confirm New Password</label>
                                    <Input
                                        type="password"
                                        value={passwordForm.confirm}
                                        onChange={e => setPasswordForm(p => ({ ...p, confirm: e.target.value }))}
                                        className="bg-[#1e1f22] border-none"
                                        required
                                    />
                                </div>
                                <div className="flex justify-end gap-3 pt-4">
                                    <button type="button" onClick={() => setShowChangePassword(false)} className="px-4 py-2 text-sm text-gray-300 hover:text-white">Cancel</button>
                                    <GameButton type="submit" disabled={formLoading} className="bg-[#5865F2] text-white">
                                        {formLoading ? 'Updating...' : 'Update Password'}
                                    </GameButton>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* 2. Delete Account Modal */}
                {showDeleteAccount && (
                    <div className="absolute inset-0 z-[60] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
                        <div className={cn(
                            "bg-[#313338] w-full max-w-md p-6 rounded-2xl shadow-2xl border border-white/5 animate-in zoom-in-95 duration-200",
                            deleteError && "animate-shake ring-2 ring-red-500/50"
                        )}>
                            <div className="flex justify-between items-start mb-4">
                                <h3 className="text-xl font-bold text-white">Delete Account</h3>
                                <button
                                    onClick={() => setShowDeleteAccount(false)}
                                    className="text-[#b9bbbe] hover:text-white transition-colors"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="bg-amber-500/10 border border-amber-500/20 p-4 rounded-lg mb-6">
                                <p className="text-sm text-amber-200 font-medium leading-relaxed">
                                    This action is permanent. Your account and all data will be deleted immediately.
                                </p>
                            </div>

                            <form onSubmit={handleDeleteAccount} className="space-y-6">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-muted-foreground uppercase">
                                        Password <span className="text-red-400">*</span>
                                    </label>
                                    <div className="relative">
                                        <Input
                                            type={showDeletePassword ? "text" : "password"}
                                            value={deleteForm.password}
                                            onChange={e => {
                                                setDeleteForm(p => ({ ...p, password: e.target.value }));
                                                setDeleteError(false);
                                            }}
                                            className={cn(
                                                "bg-[#1e1f22] border-none pr-10 transition-all duration-200",
                                                deleteError && "ring-1 ring-red-500 bg-red-500/10"
                                            )}
                                            required
                                            autoFocus
                                            placeholder="Enter your password"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowDeletePassword(!showDeletePassword)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-white transition-colors"
                                        >
                                            {showDeletePassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                        </button>
                                    </div>
                                    {deleteForm.password === '' && (
                                        <p className="text-[10px] text-red-400 opacity-0 group-focus-within:opacity-100 transition-opacity">
                                            Password is required
                                        </p>
                                    )}
                                </div>

                                <div className="flex justify-end gap-3 pt-2">
                                    <button
                                        type="button"
                                        onClick={() => setShowDeleteAccount(false)}
                                        className="px-4 py-2 text-sm font-medium text-gray-400 hover:text-white transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <GameButton
                                        type="submit"
                                        variant="danger"
                                        disabled={formLoading || !deleteForm.password}
                                        className="bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-900/20"
                                    >
                                        {formLoading ? 'Deleting...' : 'Delete Account'}
                                    </GameButton>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* 3. Log Out Confirmation */}
                {showLogoutConfirm && (
                    <div className="absolute inset-0 z-[60] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
                        <div className="bg-[#313338] w-full max-w-sm p-6 rounded-lg shadow-2xl border border-white/5 animate-in zoom-in-95 duration-200">
                            <h3 className="text-xl font-bold text-white mb-2">Log Out</h3>
                            <p className="text-sm text-gray-300 mb-6">Are you sure you want to log out?</p>
                            <div className="flex justify-end gap-3">
                                <button onClick={() => setShowLogoutConfirm(false)} className="px-4 py-2 text-sm text-gray-300 hover:text-white">Cancel</button>
                                <GameButton
                                    variant="danger"
                                    className="bg-red-500 hover:bg-red-600 border-none"
                                    onClick={() => {
                                        signOut();
                                        closeSettings();
                                        toast.success("Logged out");
                                    }}
                                >
                                    Log Out
                                </GameButton>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
