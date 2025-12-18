import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { useSettings } from '@/context/SettingsContext';
import { Gamepad2, User, LogOut, Bell, Users, Settings } from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { toast } from 'sonner';
import { ThemeSwitcher } from '@/components/theme/ThemeSwitcher';
import { cn } from '@/lib/utils';
import { ProfileCard } from '@/components/profile/ProfileCard';

export const Header = () => {
    const { user, signOut } = useAuth();
    const { openSettings } = useSettings();
    const [showProfileCard, setShowProfileCard] = useState(false);
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



    return (
        <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border/40 h-16 transition-all duration-200">
            <div className="h-full max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between">
                {/* Left side: Branding */}
                <Link to="/" className="flex items-center gap-3 group focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-lg p-1">
                    <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors duration-200">
                        <Gamepad2 className="w-5 h-5 text-primary" />
                    </div>
                    <h1 className="text-lg font-heading font-bold tracking-tight text-foreground group-hover:text-primary transition-colors duration-200">
                        WORD IMPOSTER
                    </h1>
                </Link>

                {/* Right side: Utilities & Profile */}
                <div className="flex items-center gap-2 sm:gap-4">
                    {/* Utility Group */}
                    <div className="flex items-center gap-1 sm:gap-2 pr-2 sm:pr-4 border-r border-border/40">
                        <div className="opacity-70 hover:opacity-100 transition-opacity duration-150 active:scale-95 transform">
                            <ThemeSwitcher />
                        </div>

                        <Link to="/friends" className="focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-md">
                            <button className="relative w-9 h-9 flex items-center justify-center rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-all duration-150 hover:scale-105 active:scale-95">
                                <Users className="w-5 h-5" />
                                {pendingRequests > 0 && (
                                    <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full ring-2 ring-background animate-pulse" />
                                )}
                            </button>
                        </Link>

                        <Link to="/notifications" className="focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-md">
                            <button className="relative w-9 h-9 flex items-center justify-center rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-all duration-150 hover:scale-105 active:scale-95">
                                <Bell className="w-5 h-5" />
                                {pendingInvites > 0 && (
                                    <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-amber-500 rounded-full ring-2 ring-background animate-pulse" />
                                )}
                            </button>
                        </Link>
                    </div>

                    {/* Profile Avatar - Dropdown Menu */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <button className="group relative flex items-center gap-3 outline-none rounded-full focus-visible:ring-2 focus-visible:ring-primary transition-transform active:scale-95 duration-150">
                                <div className="hidden sm:flex flex-col items-end mr-1 animate-slide-in-right">
                                    <span className="text-sm font-bold leading-none text-foreground group-hover:text-primary transition-colors duration-200">
                                        {profile?.full_name || 'Player'}
                                    </span>
                                </div>
                                <Avatar className="w-10 h-10 border-2 border-border group-hover:border-primary transition-colors duration-200 shadow-sm animate-idle">
                                    <AvatarImage src={profile?.avatar_url || undefined} className="object-cover" />
                                    <AvatarFallback className="bg-muted text-muted-foreground font-heading font-bold">
                                        {profile?.full_name?.charAt(0) || 'P'}
                                    </AvatarFallback>
                                </Avatar>
                            </button>
                        </DropdownMenuTrigger>

                        <DropdownMenuContent align="end" className="w-56 mt-2 border-border/40 bg-popover/95 backdrop-blur-xl shadow-xl animate-fade-in-scale origin-top-right">
                            <DropdownMenuLabel className="font-normal">
                                <div className="flex flex-col space-y-1">
                                    <p className="text-sm font-medium leading-none">{profile?.full_name}</p>
                                    <p className="text-xs leading-none text-muted-foreground">
                                        @{profile?.username}
                                    </p>
                                </div>
                            </DropdownMenuLabel>
                            <DropdownMenuSeparator className="bg-border/40" />
                            <DropdownMenuItem
                                asChild
                                className="cursor-pointer focus:bg-primary/10 focus:text-primary transition-colors duration-150"
                            >
                                <Link to="/profile">
                                    <User className="mr-2 h-4 w-4" />
                                    <span>Profile</span>
                                </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                asChild
                                className="cursor-pointer focus:bg-primary/10 focus:text-primary transition-colors duration-150"
                            >
                                <Link to="/settings">
                                    <Settings className="mr-2 h-4 w-4" />
                                    <span>Settings</span>
                                </Link>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator className="bg-border/40" />
                            <DropdownMenuItem
                                className="text-red-500 focus:text-red-500 focus:bg-red-500/10 cursor-pointer transition-colors duration-150"
                                onClick={() => {
                                    signOut();
                                    toast.success('Logged out successfully');
                                }}
                            >
                                <LogOut className="mr-2 h-4 w-4" />
                                <span className="font-medium">Log out</span>
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>
            {showProfileCard && (
                <ProfileCard
                    user={user}
                    profile={profile}
                    onClose={() => setShowProfileCard(false)}
                />
            )}
        </header>
    );
};
