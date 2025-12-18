import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@/components/theme/ThemeProvider';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import {
    Palette, LogOut, ArrowLeft, Shield, Check, User
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { SecuritySettings } from '@/components/profile/SecuritySettings';

const SettingsSidebarItem = ({ icon: Icon, label, isActive, onClick, variant = 'default' }) => (
    <button
        onClick={onClick}
        className={cn(
            "w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 text-left font-medium text-sm group relative overflow-hidden",
            isActive
                ? "bg-accent text-accent-foreground shadow-md"
                : "text-muted-foreground hover:bg-muted hover:text-foreground",
            variant === 'danger' && "text-destructive hover:bg-destructive/10 hover:text-destructive"
        )}
    >
        {isActive && <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary rounded-r-full" />}
        {Icon && <Icon className={cn("w-5 h-5 transition-colors", isActive ? "text-accent-foreground" : "text-muted-foreground group-hover:text-foreground")} />}
        <span>{label}</span>
    </button>
);

const Settings = () => {
    const { signOut } = useAuth();
    const { theme, setTheme, density, setDensity } = useTheme();
    const navigate = useNavigate();
    const [showMobileMenu, setShowMobileMenu] = useState(true);
    const [activeTab, setActiveTab] = useState('account');
    const { user } = useAuth(); // Need user data for My Account

    const handleLogout = () => {
        signOut();
        navigate('/auth');
        toast.success("Logged out successfully");
    };

    const handleTabChange = (tab) => {
        setActiveTab(tab);
        setShowMobileMenu(false); // Switch to content view on mobile
    };

    return (
        <div className="flex h-screen w-screen bg-background text-foreground font-body overflow-hidden flex-col md:flex-row">
            {/* Sidebar */}
            <aside className={cn(
                "bg-card md:flex flex-col h-full shrink-0 border-r border-border transition-all",
                showMobileMenu ? "flex w-full absolute z-20 md:static md:w-[280px]" : "hidden md:flex md:w-[280px]"
            )}>
                <div className="p-6 flex-1">
                    <div className="flex items-center justify-between mb-6 md:mb-4">
                        <h2 className="text-xs font-bold text-muted-foreground/70 uppercase tracking-wider px-2">Settings</h2>
                        {/* Mobile Close Button */}
                        <button
                            onClick={() => navigate('/')}
                            className="md:hidden p-2 -mr-2 text-muted-foreground hover:text-foreground"
                        >
                            <ArrowLeft className="w-5 h-5" />
                        </button>
                    </div>

                    <nav className="space-y-1">
                        <SettingsSidebarItem
                            icon={User}
                            label="My Account"
                            isActive={activeTab === 'account'}
                            onClick={() => handleTabChange('account')}
                        />
                        <SettingsSidebarItem
                            icon={Shield}
                            label="Security"
                            isActive={activeTab === 'security'}
                            onClick={() => handleTabChange('security')}
                        />
                        <SettingsSidebarItem
                            icon={Palette}
                            label="Appearance"
                            isActive={activeTab === 'appearance'}
                            onClick={() => handleTabChange('appearance')}
                        />
                        <div className="my-4 border-t border-border mx-2" />
                        <SettingsSidebarItem
                            icon={LogOut}
                            variant="danger"
                            label="Log Out"
                            isActive={false}
                            onClick={handleLogout}
                        />
                    </nav>
                </div>
            </aside>

            {/* Main Content */}
            <main className={cn(
                "flex-1 h-full overflow-y-auto bg-background relative custom-scrollbar",
                !showMobileMenu ? "flex flex-col" : "hidden md:block"
            )}>
                {/* Close / Back Button (Desktop) */}
                <div className="absolute top-8 right-8 z-10 hidden md:block">
                    <button
                        onClick={() => navigate('/')}
                        className="w-10 h-10 rounded-full bg-muted hover:bg-muted/80 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors border border-border shadow-lg"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div className="text-[10px] text-center mt-1 text-muted-foreground font-bold uppercase tracking-wider">ESC</div>
                </div>

                {/* Mobile Header (Back to Menu) */}
                <div className="md:hidden flex items-center gap-3 p-4 border-b border-white/5 sticky top-0 bg-background/80 backdrop-blur-md z-20">
                    <button
                        onClick={() => setShowMobileMenu(true)}
                        className="p-2 -ml-2 rounded-full hover:bg-white/5"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <span className="font-bold text-lg capitalize">{activeTab.replace('-', ' ')}</span>
                </div>

                <div className="max-w-3xl mx-auto py-8 md:py-16 px-6 md:px-8 min-h-full w-full">

                    {/* MY ACCOUNT TAB */}
                    {activeTab === 'account' && (
                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
                            <h1 className="text-2xl font-bold text-foreground mb-2 hidden md:block">My Account</h1>
                            <p className="text-muted-foreground mb-8 text-sm md:text-base">View your account details.</p>

                            <div className="bg-card rounded-xl border border-border overflow-hidden">
                                {/* Header Color Block */}
                                <div className="h-24 bg-gradient-to-r from-primary/20 to-primary/5 border-b border-border" />
                                <div className="px-6 pb-6 relative">
                                    <div className="-mt-12 mb-4 w-24 h-24 rounded-full bg-card p-1 ring-4 ring-card">
                                        <div className="w-full h-full rounded-full bg-muted flex items-center justify-center text-xl font-bold text-muted-foreground">
                                            {user?.username?.charAt(0).toUpperCase()}
                                        </div>
                                    </div>

                                    <div className="grid gap-6 md:grid-cols-2">
                                        <div>
                                            <h3 className="text-xs font-bold text-muted-foreground uppercase mb-1">Username</h3>
                                            <p className="text-lg font-bold text-foreground">@{user?.username}</p>
                                        </div>
                                        <div>
                                            <h3 className="text-xs font-bold text-muted-foreground uppercase mb-1">Display Name</h3>
                                            <p className="text-lg font-medium text-foreground">{user?.profile?.display_name || user?.full_name || 'Not set'}</p>
                                        </div>
                                        <div>
                                            <h3 className="text-xs font-bold text-muted-foreground uppercase mb-1">User ID</h3>
                                            <p className="font-mono text-sm text-muted-foreground bg-muted/50 p-2 rounded-md inline-block">{user?._id || user?.id}</p>
                                        </div>
                                        <div>
                                            <h3 className="text-xs font-bold text-muted-foreground uppercase mb-1">Member Since</h3>
                                            <p className="text-sm text-foreground">
                                                {user?.created_at ? new Date(user.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' }) : 'Unknown'}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'security' && (
                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
                            <h1 className="text-2xl font-bold text-foreground mb-2 hidden md:block">Security</h1>
                            <p className="text-muted-foreground mb-8 text-sm md:text-base">Manage your password and account deletion settings.</p>

                            <SecuritySettings />
                        </div>
                    )}

                    {activeTab === 'appearance' && (
                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
                            <h1 className="text-2xl font-bold text-foreground mb-6 hidden md:block">Appearance</h1>
                            <div className="bg-card rounded-xl p-4 md:p-6 border border-border">
                                <div className="flex items-center justify-between mb-4">
                                    <div>
                                        <h3 className="font-bold text-foreground">Theme</h3>
                                        <p className="text-sm text-muted-foreground">Adjust the color of the interface for better visibility.</p>
                                    </div>
                                </div>

                                <div className="flex flex-wrap gap-4 mt-6">
                                    {/* LIGHT */}
                                    <button
                                        onClick={() => setTheme('light')}
                                        className={cn(
                                            "w-20 h-20 rounded-2xl border-2 flex items-center justify-center relative transition-all outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-card",
                                            theme === 'light' ? "border-primary ring-2 ring-primary/20" : "border-slate-200 hover:border-slate-300 bg-white"
                                        )}
                                        title="Light"
                                    >
                                        <div className="w-full h-full rounded-[14px] bg-white border border-slate-100" />
                                        {theme === 'light' && (
                                            <div className="absolute -top-2 -right-2 w-6 h-6 bg-primary rounded-full flex items-center justify-center border-2 border-background shadow-sm">
                                                <Check className="w-3.5 h-3.5 text-primary-foreground font-bold" />
                                            </div>
                                        )}
                                    </button>

                                    {/* GRAY */}
                                    <button
                                        onClick={() => setTheme('gray')}
                                        className={cn(
                                            "w-20 h-20 rounded-2xl border-2 flex items-center justify-center relative transition-all outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-card",
                                            theme === 'gray' ? "border-primary ring-2 ring-primary/20" : "border-transparent bg-[#313338] hover:bg-[#313338]/80"
                                        )}
                                        title="Gray"
                                    >
                                        <div className="w-full h-full rounded-[14px] bg-[#313338]" />
                                        {theme === 'gray' && (
                                            <div className="absolute -top-2 -right-2 w-6 h-6 bg-primary rounded-full flex items-center justify-center border-2 border-background shadow-sm">
                                                <Check className="w-3.5 h-3.5 text-primary-foreground font-bold" />
                                            </div>
                                        )}
                                    </button>

                                    {/* DARK (Default) */}
                                    <button
                                        onClick={() => setTheme('dark')}
                                        className={cn(
                                            "w-20 h-20 rounded-2xl border-2 flex items-center justify-center relative transition-all outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-card",
                                            theme === 'dark' ? "border-primary ring-2 ring-primary/20" : "border-white/10 bg-[#1e1f22] hover:bg-[#1e1f22]/80"
                                        )}
                                        title="Dark"
                                    >
                                        <div className="w-full h-full rounded-[14px] bg-[#1e1f22]" />
                                        {theme === 'dark' && (
                                            <div className="absolute -top-2 -right-2 w-6 h-6 bg-primary rounded-full flex items-center justify-center border-2 border-background shadow-sm">
                                                <Check className="w-3.5 h-3.5 text-primary-foreground font-bold" />
                                            </div>
                                        )}
                                    </button>

                                    {/* BLACK (AMOLED) */}
                                    <button
                                        onClick={() => setTheme('black')}
                                        className={cn(
                                            "w-20 h-20 rounded-2xl border-2 flex items-center justify-center relative transition-all outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-card",
                                            theme === 'black' ? "border-primary ring-2 ring-primary/20" : "border-white/10 bg-black hover:bg-black/80"
                                        )}
                                        title="Midnight"
                                    >
                                        <div className="w-full h-full rounded-[14px] bg-black" />
                                        {theme === 'black' && (
                                            <div className="absolute -top-2 -right-2 w-6 h-6 bg-primary rounded-full flex items-center justify-center border-2 border-background shadow-sm">
                                                <Check className="w-3.5 h-3.5 text-primary-foreground font-bold" />
                                            </div>
                                        )}
                                    </button>

                                    {/* SYSTEM */}
                                    <button
                                        onClick={() => setTheme('system')}
                                        className={cn(
                                            "w-20 h-20 rounded-2xl border-2 flex items-center justify-center relative transition-all outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-card",
                                            theme === 'system' ? "border-primary ring-2 ring-primary/20" : "border-border bg-transparent hover:bg-accent/10"
                                        )}
                                        title="System Default"
                                    >
                                        <div className="flex flex-col items-center justify-center gap-2">
                                            <Palette className="w-6 h-6 text-foreground" />
                                        </div>
                                        {theme === 'system' && (
                                            <div className="absolute -top-2 -right-2 w-6 h-6 bg-primary rounded-full flex items-center justify-center border-2 border-background shadow-sm">
                                                <Check className="w-3.5 h-3.5 text-primary-foreground font-bold" />
                                            </div>
                                        )}
                                    </button>

                                </div>


                                <div className="mt-8 pt-8 border-t border-border">
                                    <div className="mb-4">
                                        <h3 className="font-bold text-foreground">UI Density</h3>
                                    </div>

                                    <div className="flex flex-col gap-2">
                                        {['compact', 'default', 'spacious'].map((option) => (
                                            <button
                                                key={option}
                                                onClick={() => setDensity(option)}
                                                className={cn(
                                                    "w-full flex items-center gap-3 p-4 rounded-xl border transition-all text-left outline-none group",
                                                    density === option
                                                        ? "bg-primary/5 border-primary/50 shadow-[0_0_15px_rgba(var(--primary),0.1)]"
                                                        : "bg-transparent border-transparent hover:bg-muted/30"
                                                )}
                                            >
                                                {/* Radio Circle */}
                                                <div className={cn(
                                                    "w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors shrink-0",
                                                    density === option
                                                        ? "border-primary bg-primary"
                                                        : "border-muted-foreground/50 group-hover:border-muted-foreground"
                                                )}>
                                                    {density === option && <div className="w-2 h-2 rounded-full bg-primary-foreground" />}
                                                </div>

                                                <span className="font-medium capitalize">{option}</span>
                                            </button>
                                        ))}
                                    </div>

                                    {/* Density Preview */}
                                    <div className="mt-6">
                                        <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">Preview</h4>
                                        <div className="border border-border rounded-xl bg-card overflow-hidden">
                                            <div className="bg-muted/30 px-4 py-2 border-b border-border">
                                                <div className="flex items-center gap-1.5">
                                                    <div className="w-2.5 h-2.5 rounded-full bg-red-500/20 border border-red-500/50" />
                                                    <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/20 border border-yellow-500/50" />
                                                    <div className="w-2.5 h-2.5 rounded-full bg-green-500/20 border border-green-500/50" />
                                                </div>
                                            </div>
                                            <div className="p-4 bg-background/50">
                                                <div
                                                    className="rounded-lg bg-card border border-border flex items-center transition-all duration-300"
                                                    style={{
                                                        padding: 'var(--ui-p)',
                                                        gap: 'var(--ui-gap)'
                                                    }}
                                                >
                                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-primary/50 flex items-center justify-center shrink-0 shadow-lg text-primary-foreground">
                                                        <User className="w-5 h-5" />
                                                    </div>
                                                    <div className="flex flex-col min-w-0">
                                                        <span
                                                            className="font-bold text-foreground leading-none truncate"
                                                            style={{ fontSize: 'calc(1rem * var(--ui-text-scale))' }}
                                                        >
                                                            {user?.username || 'User'}
                                                        </span>
                                                        <span
                                                            className="text-muted-foreground leading-none mt-1.5 truncate flex items-center gap-2"
                                                            style={{ fontSize: 'calc(0.75rem * var(--ui-text-scale))' }}
                                                        >
                                                            <span className="w-2 h-2 rounded-full bg-green-500 inline-block animate-pulse" />
                                                            Online
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </main >
        </div >
    );
};

export default Settings;
