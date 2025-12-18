import React from 'react';
import { Link } from 'react-router-dom';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getAvatarUrl } from '@/lib/avatarUtils';
import { cn } from '@/lib/utils';

export const StatusAvatar = ({ user, profile }) => {
    const status = profile?.profile?.status || 'online';

    return (
        <Link to="/profile">
            <button className="relative w-10 h-10 rounded-full transition-transform active:scale-95 outline-none focus-visible:ring-2 focus-visible:ring-primary ring-offset-2 ring-offset-background group">
                <Avatar className="w-full h-full shadow-lg border border-white/10 group-hover:border-white/20 transition-colors">
                    <AvatarImage src={getAvatarUrl(profile || user)} className="object-cover" />
                    <AvatarFallback className="bg-muted text-muted-foreground font-heading font-bold">
                        {profile?.full_name?.charAt(0) || user?.username?.charAt(0) || '?'}
                    </AvatarFallback>
                </Avatar>
                {/* Status Indicator Dot */}
                <div className={cn(
                    "absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-[#0b0c0e] z-10",
                    status === 'online' ? "bg-green-500" :
                        status === 'dnd' ? "bg-red-500" :
                            "bg-gray-500"
                )} />
            </button>
        </Link>
    );
};
