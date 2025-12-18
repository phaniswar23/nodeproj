import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@/components/theme/ThemeProvider';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import {
    Palette, LogOut, ArrowLeft, Shield, Check
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
    const { theme, setTheme } = useTheme();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('security');

    const handleLogout = () => {
        signOut();
        navigate('/auth');
        toast.success("Logged out successfully");
    };

    return (
        <div className="flex h-screen w-screen bg-background text-foreground font-body overflow-hidden">
            {/* Sidebar */}
            <aside className="w-[280px] bg-card flex flex-col h-full shrink-0 border-r border-border">
                <div className="p-6">
                    <h2 className="text-xs font-bold text-muted-foreground/70 uppercase tracking-wider mb-4 px-2">Settings</h2>
                    <nav className="space-y-1">
                        <SettingsSidebarItem
                            icon={Shield}
                            label="Security"
                            isActive={activeTab === 'security'}
                            onClick={() => setActiveTab('security')}
                        />
                        <SettingsSidebarItem
                            icon={Palette}
                            label="Appearance"
                            isActive={activeTab === 'appearance'}
                            onClick={() => setActiveTab('appearance')}
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
            <main className="flex-1 h-full overflow-y-auto bg-background relative custom-scrollbar">
                {/* Close / Back Button */}
                <div className="absolute top-8 right-8 z-10">
                    <button
                        onClick={() => navigate('/')}
                        className="w-10 h-10 rounded-full bg-muted hover:bg-muted/80 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors border border-border shadow-lg"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div className="text-[10px] text-center mt-1 text-muted-foreground font-bold uppercase tracking-wider">ESC</div>
                </div>

                <div className="max-w-3xl mx-auto py-16 px-8 min-h-full">
                    {activeTab === 'security' && (
                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
                            <h1 className="text-2xl font-bold text-foreground mb-2">Security</h1>
                            <p className="text-muted-foreground mb-8">Manage your password and account deletion settings.</p>

                            <SecuritySettings />
                        </div>
                    )}

                    {activeTab === 'appearance' && (
                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
                            <h1 className="text-2xl font-bold text-foreground mb-6">Appearance</h1>
                            <div className="bg-card rounded-xl p-6 border border-border">
                                <div className="flex items-center justify-between mb-4">
                                    <div>
                                        <h3 className="font-bold text-foreground">Theme</h3>
                                        <p className="text-sm text-muted-foreground">Customize how Word Imposter looks on your device.</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-3 gap-4 mt-6">
                                    <div
                                        className={cn("cursor-pointer rounded-lg p-3 bg-muted border-2 transition-all", theme === 'dark' ? "border-primary ring-2 ring-primary/20" : "border-transparent hover:border-foreground/20")}
                                        onClick={() => setTheme('dark')}
                                    >
                                        <div className="bg-card h-20 rounded mb-2 w-full" />
                                        <div className="flex items-center gap-2">
                                            <div className={cn("w-4 h-4 rounded-full border border-foreground/20 flex items-center justify-center", theme === 'dark' && "bg-primary border-primary")}>
                                                {theme === 'dark' && <Check className="w-3 h-3 text-primary-foreground" />}
                                            </div>
                                            <span className="text-sm font-bold text-foreground">Dark</span>
                                        </div>
                                    </div>
                                    <div
                                        className={cn("cursor-pointer rounded-lg p-3 bg-white border-2 transition-all", theme === 'light' ? "border-primary ring-2 ring-primary/20" : "border-transparent hover:border-black/20")}
                                        onClick={() => setTheme('light')}
                                    >
                                        <div className="bg-gray-100 h-20 rounded mb-2 w-full" />
                                        <div className="flex items-center gap-2">
                                            <div className={cn("w-4 h-4 rounded-full border border-black/20 flex items-center justify-center", theme === 'light' && "bg-primary border-primary")}>
                                                {theme === 'light' && <Check className="w-3 h-3 text-primary-foreground" />}
                                            </div>
                                            <span className="text-sm font-bold text-black">Light</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
};

export default Settings;
