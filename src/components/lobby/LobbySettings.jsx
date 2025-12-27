
import React, { useState, useEffect } from 'react';
import { Settings, Save, Lock, Info, Clock, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { GlassCard } from '@/components/ui/GlassCard';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { Badge } from '@/components/ui/badge';
import { GameButton } from '@/components/ui/GameButton';

export const LobbySettings = ({
    settings,
    isHost,
    onUpdate
}) => {
    // Local draft state for Host
    const [draft, setDraft] = useState(settings);
    const [hasChanges, setHasChanges] = useState(false);

    // Sync draft with incoming settings when they change externally
    useEffect(() => {
        if (!isHost) {
            setDraft(settings);
        } else {
            if (!hasChanges) {
                setDraft(settings);
            }
        }
    }, [settings, isHost, hasChanges]);

    const handleChange = (key, value) => {
        if (!isHost) return;
        setDraft(prev => ({ ...prev, [key]: value }));
        setHasChanges(true);
    };

    const handleSave = () => {
        onUpdate(draft);
        setHasChanges(false);
    };

    if (!draft) return <div className="text-red-500">Error: No settings loaded</div>;

    return (
        <div className="space-y-6">
            {/* Difficulty */}
            <div className="space-y-3">
                <div className="flex items-center justify-between">
                    <Label className="uppercase text-xs font-bold text-muted-foreground tracking-wider">Difficulty</Label>
                    <Badge variant="outline" className="text-[10px] border-white/10 bg-white/5">{draft.difficulty}</Badge>
                </div>
                {isHost ? (
                    <Select
                        value={draft.difficulty}
                        onValueChange={(val) => handleChange('difficulty', val)}
                    >
                        <SelectTrigger className="bg-secondary/20 border-white/10">
                            <SelectValue placeholder="Select difficulty" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="Easy (Beginner)">Easy (Beginner)</SelectItem>
                            <SelectItem value="Medium (Standard)">Medium (Standard)</SelectItem>
                            <SelectItem value="Hard (Expert)">Hard (Expert)</SelectItem>
                        </SelectContent>
                    </Select>
                ) : (
                    <div className="p-2.5 rounded-md bg-white/5 border border-white/10 text-sm text-center">
                        {draft.difficulty}
                    </div>
                )}
            </div>

            {/* Rounds */}
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <Label className="uppercase text-xs font-bold text-muted-foreground tracking-wider">Rounds</Label>
                    <span className="font-mono text-xl text-primary font-bold">{draft.rounds}</span>
                </div>
                <Slider
                    value={[draft.rounds]}
                    onValueChange={(val) => handleChange('rounds', val[0])}
                    min={3}
                    max={10}
                    step={1}
                    disabled={!isHost}
                    className={cn(!isHost && "opacity-50 cursor-not-allowed")}
                />
            </div>

            {/* Timers */}
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <Label className="uppercase text-[10px] font-bold text-muted-foreground tracking-wider">Response</Label>
                        <span className="font-mono text-sm text-white">{draft.responseTimer}s</span>
                    </div>
                    <Slider
                        value={[draft.responseTimer]}
                        onValueChange={(val) => handleChange('responseTimer', val[0])}
                        min={15}
                        max={120}
                        step={5}
                        disabled={!isHost}
                        className={cn(!isHost && "opacity-50 cursor-not-allowed")}
                    />
                </div>
                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <Label className="uppercase text-[10px] font-bold text-muted-foreground tracking-wider">Voting</Label>
                        <span className="font-mono text-sm text-white">{draft.voteTimer}s</span>
                    </div>
                    <Slider
                        value={[draft.voteTimer]}
                        onValueChange={(val) => handleChange('voteTimer', val[0])}
                        min={15}
                        max={120}
                        step={5}
                        disabled={!isHost}
                        className={cn(!isHost && "opacity-50 cursor-not-allowed")}
                    />
                </div>
            </div>

            {isHost && hasChanges && (
                <div className="sticky bottom-0 pt-4 bg-gradient-to-t from-black/80 to-transparent pb-1">
                    <GameButton
                        onClick={handleSave}
                        className="w-full bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20"
                    >
                        <Save className="w-4 h-4 mr-2" />
                        Save Changes
                    </GameButton>
                </div>
            )}

            {/* Host Status Indicator if Clean */}
            {isHost && !hasChanges && (
                <div className="text-center">
                    <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-500/10 text-green-400 text-xs font-medium border border-green-500/20">
                        <Lock className="w-3 h-3" /> Saved
                    </span>
                </div>
            )}
        </div>
    );
};
