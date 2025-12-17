import { useState, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { GAMING_AVATARS, generateAvatarUrl } from '@/utils/avatarUtils';
import { Check, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';

export const AvatarSelection = ({ currentAvatarUrl, onSelect }) => {
    const [selectedId, setSelectedId] = useState(null);
    const [search, setSearch] = useState('');

    const filteredAvatars = useMemo(() => {
        if (!search) return GAMING_AVATARS;
        return GAMING_AVATARS.filter(a => a.label.toLowerCase().includes(search.toLowerCase()));
    }, [search]);

    const handleSelect = (avatar) => {
        setSelectedId(avatar.id);
        const dataUrl = generateAvatarUrl(avatar.id);
        onSelect(dataUrl);
    };

    return (
        <div className="space-y-4 animate-in fade-in duration-300">
            <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                    placeholder="Search avatars (e.g. 'Dragon', 'Red', 'Gold')..."
                    className="pl-8 bg-background/50"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
            </div>

            <ScrollArea className="h-[300px] w-full rounded-md border border-white/10 p-4 bg-black/20">
                <div className="grid grid-cols-4 sm:grid-cols-5 gap-3">
                    {filteredAvatars.map((avatar) => {
                        const Icon = avatar.icon;
                        const isSelected = selectedId === avatar.id;

                        return (
                            <button
                                key={avatar.id}
                                onClick={() => handleSelect(avatar)}
                                className={cn(
                                    "group relative aspect-square rounded-xl overflow-hidden border-2 flex flex-col items-center justify-center transition-all duration-200 hover:scale-105",
                                    isSelected
                                        ? "border-primary shadow-[0_0_15px_rgba(45,212,191,0.5)]"
                                        : "border-border/30 hover:border-primary/50 hover:bg-white/5"
                                )}
                                style={{
                                    // Use a subtle gradient background based on theme for preview
                                    background: isSelected ? undefined : `linear-gradient(135deg, ${avatar.color}10, transparent)`
                                }}
                            >
                                {/* Background block for selected/hover */}
                                {isSelected && (
                                    <div className="absolute inset-0 opacity-20" style={{ backgroundColor: avatar.color }} />
                                )}

                                <Icon className={cn("w-6 h-6 transition-transform duration-300 group-hover:scale-110", isSelected ? "scale-110" : "")} style={{ color: avatar.color }} />

                                {isSelected && (
                                    <div className="absolute top-1 right-1 bg-primary text-primary-foreground rounded-full p-0.5 shadow-lg">
                                        <Check className="w-3 h-3" />
                                    </div>
                                )}
                            </button>
                        );
                    })}
                </div>
                {filteredAvatars.length === 0 && (
                    <p className="text-center text-muted-foreground py-10">No avatars found.</p>
                )}
            </ScrollArea>

            <p className="text-xs text-center text-muted-foreground/60 italic">
                {GAMING_AVATARS.length} Pro Avatars Available
            </p>
        </div>
    );
};
