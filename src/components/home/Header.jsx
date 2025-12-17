import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { GameButton } from '@/components/ui/GameButton';
import { Gamepad2, User, LogOut, Bell, Users } from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { toast } from 'sonner';
import { ThemeSwitcher } from '@/components/theme/ThemeSwitcher';

export const Header = () => {
    const { user, signOut } = useAuth();
    const [profile, setProfile] = useState(null);
    const [pendingRequests, setPendingRequests] = useState(0);
    const [pendingInvites, setPendingInvites] = useState(0);

    useEffect(() => {
        if (user) {
            fetchProfile();
            fetchNotifications();
        }
    }, [user]);

    const fetchProfile = async () => {
        if (!user) return;
        try {
            const { data } = await api.get(`/users/${user._id || user.id}/profile`);
            setProfile(data);
        } catch (e) {
            console.error(e);
        }
    };

    const fetchNotifications = async () => {
        if (!user) return;
        try {
            const { data } = await api.get('/friends/requests');
            setPendingRequests(data.length || 0);
            // Invites endpoint TBD
            // const { data: invites } = await api.get('/invites');
            // setPendingInvites(invites?.length || 0);
        } catch (e) {
            console.error(e);
        }
    };

    const handleSignOut = async () => {
        signOut();
        toast.success('Logged out successfully');
    };

    const totalNotifications = pendingRequests + pendingInvites;

    return (
        <header className="fixed top-0 left-0 right-0 z-50 glass-card border-t-0 rounded-none border-x-0 py-4 px-6">
            <div className="max-w-7xl mx-auto flex items-center justify-between">
                <Link to="/" className="flex items-center gap-3 group">
                    <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center group-hover:bg-primary/30 transition-colors">
                        <Gamepad2 className="w-6 h-6 text-primary" />
                    </div>
                    <h1 className="text-xl font-heading font-bold gradient-text hidden sm:block">
                        Word Imposter
                    </h1>
                </Link>

                <div className="flex items-center gap-4">
                    <div className="hover:animate-pulse-glow transition-all duration-300">
                        <ThemeSwitcher />
                    </div>

                    <Link to="/friends">
                        <GameButton variant="ghost" size="sm" className="relative hover:text-primary hover:drop-shadow-[0_0_10px_rgba(34,197,94,0.5)] transition-all duration-300">
                            <Users className="w-5 h-5" />
                            {pendingRequests > 0 && (
                                <span className="absolute -top-1 -right-1 w-5 h-5 bg-destructive text-destructive-foreground text-xs rounded-full flex items-center justify-center animate-bounce">
                                    {pendingRequests}
                                </span>
                            )}
                        </GameButton>
                    </Link>

                    <Link to="/notifications">
                        <GameButton variant="ghost" size="sm" className="relative hover:text-secondary hover:drop-shadow-[0_0_10px_rgba(234,179,8,0.5)] transition-all duration-300">
                            <Bell className="w-5 h-5" />
                            {pendingInvites > 0 && (
                                <span className="absolute -top-1 -right-1 w-5 h-5 bg-secondary text-secondary-foreground text-xs rounded-full flex items-center justify-center animate-bounce">
                                    {pendingInvites}
                                </span>
                            )}
                        </GameButton>
                    </Link>

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <div className="relative group cursor-pointer" onMouseMove={(e) => {
                                const rect = e.currentTarget.getBoundingClientRect();
                                const x = e.clientX - rect.left - rect.width / 2;
                                const y = e.clientY - rect.top - rect.height / 2;
                                const angle = Math.atan2(y, x) * (180 / Math.PI) + 90;
                                e.currentTarget.style.setProperty('--fire-angle', `${angle}deg`);
                            }}
                                style={{ '--fire-angle': '0deg' }}
                            >
                                {/* Fire Effect Ring - Cursor Driven + Spin on Hover */}
                                <div
                                    className="absolute -inset-1 rounded-full opacity-60 blur-sm group-hover:opacity-100 group-hover:blur-md transition-all duration-200 group-hover:animate-spin-slow"
                                    style={{
                                        background: `conic-gradient(from var(--fire-angle), transparent 20%, #f59e0b 40%, #ef4444 60%, transparent 80%)`
                                    }}
                                />

                                {/* Inner glow for extra punch */}
                                <div className="absolute -inset-0.5 bg-gradient-to-r from-red-500 to-orange-500 rounded-full opacity-0 group-hover:opacity-50 blur-md animate-pulse" />

                                <Avatar className="relative w-10 h-10 border-2 border-background shadow-xl group-hover:scale-105 transition-transform duration-300 z-10 block">
                                    <AvatarImage src={profile?.avatar_url || undefined} className="object-cover" />
                                    <AvatarFallback className="bg-card text-primary font-heading font-bold">
                                        {profile?.full_name?.charAt(0) || 'P'}
                                    </AvatarFallback>
                                </Avatar>
                            </div>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48 glass-card border-border">
                            <DropdownMenuItem asChild>
                                <Link to="/profile" className="flex items-center gap-2 cursor-pointer">
                                    <User className="w-4 h-4" />
                                    <span>Profile</span>
                                </Link>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={handleSignOut} className="text-destructive cursor-pointer">
                                <LogOut className="w-4 h-4 mr-2" />
                                <span>Logout</span>
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>
        </header>
    );
};
