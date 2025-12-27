
import React from 'react';
import { Crown, Check, MoreVertical, AlertTriangle, Ban } from 'lucide-react';
import { cn } from '@/lib/utils';
import { GlassCard } from '@/components/ui/GlassCard';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from "@/components/ui/scroll-area";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export const LobbyPlayers = ({
    players = [],
    currentUserId,
    hostId,
    isHost,
    onToggleReady,
    onWarn,
    onKick
}) => {
    return (
        <ScrollArea className="flex-1 -mr-3 pr-3">
            <div className="flex flex-col gap-3">
                {players.map((p) => (
                    <GlassCard
                        key={p.userId}
                        className={cn(
                            "p-3 flex items-center gap-3 relative transition-all duration-300 border-l-4 group",
                            p.userId === currentUserId ? "bg-primary/5 border-l-primary" : "border-l-transparent hover:bg-white/5",
                            p.ready ? "border-l-green-500 bg-green-500/5" : ""
                        )}
                    >
                        <Avatar className="w-10 h-10 ring-2 ring-white/10">
                            <AvatarImage src={p.avatar} />
                            <AvatarFallback className="bg-primary/20 text-primary font-bold text-xs">
                                {p.username?.[0]?.toUpperCase()}
                            </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                                <span className="font-bold text-sm text-white truncate">{p.displayName || p.username}</span>
                                {hostId === p.userId && <Crown className="w-3 h-3 text-yellow-500 fill-yellow-500/20" />}
                                {p.userId === currentUserId && <span className="text-[10px] bg-white/10 px-1 rounded text-gray-400">YOU</span>}
                            </div>
                            <div className={cn("text-[10px] font-bold uppercase", p.ready ? "text-green-400" : "text-gray-500")}>
                                {p.ready ? "Ready" : "Not Ready"}
                            </div>
                        </div>

                        {/* Actions */}
                        {p.userId === currentUserId ? (
                            <button
                                onClick={onToggleReady}
                                className={cn(
                                    "w-8 h-8 rounded-full flex items-center justify-center border transition-all",
                                    p.ready ? "bg-green-500 border-green-500 text-black shadow-[0_0_10px_rgba(34,197,94,0.3)]" : "border-white/20 hover:border-white/50 text-white/50 hover:text-white hover:bg-white/10"
                                )}
                            >
                                <Check className="w-4 h-4" />
                            </button>
                        ) : isHost ? (
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <button className="opacity-0 group-hover:opacity-100 p-1 hover:bg-white/10 rounded transition-opacity">
                                        <MoreVertical className="w-4 h-4 text-gray-400" />
                                    </button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="bg-card border-white/10">
                                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                    <DropdownMenuSeparator className="bg-white/10" />
                                    <DropdownMenuItem
                                        onClick={() => onWarn(p.userId, p.username)}
                                        className="cursor-pointer"
                                    >
                                        <AlertTriangle className="w-4 h-4 mr-2 text-yellow-500" /> Send Warning
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                        onClick={() => onKick(p.userId)}
                                        className="text-destructive focus:text-destructive focus:bg-destructive/10 cursor-pointer"
                                    >
                                        <Ban className="w-4 h-4 mr-2" /> Kick Player
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        ) : null}
                    </GlassCard>
                ))}
            </div>
        </ScrollArea>
    );
};
