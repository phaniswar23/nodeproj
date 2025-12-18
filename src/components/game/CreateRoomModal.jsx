import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { GameButton } from '@/components/ui/GameButton';
import { GameInput } from '@/components/ui/GameInput';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Zap, Clock, Users, BookOpen, Crown, ChevronRight, X, Loader2 } from 'lucide-react';
import api from '@/lib/api';
import { toast } from 'sonner';

const PRESETS = {
    quick: {
        id: 'quick',
        name: 'Quick Game',
        description: 'Fast rounds, minimal discussion',
        icon: Zap,
        rounds: 3,
        responseTime: 20,
        votingTime: 15,
        color: 'text-yellow-400',
        bg: 'bg-yellow-400/10',
        border: 'border-yellow-400/20'
    },
    standard: {
        id: 'standard',
        name: 'Standard',
        description: 'Balanced experience',
        icon: Users,
        rounds: 5,
        responseTime: 30,
        votingTime: 20,
        color: 'text-primary',
        bg: 'bg-primary/10',
        border: 'border-primary/20'
    },
    competitive: {
        id: 'competitive',
        name: 'Competitive',
        description: 'Strict rules, serious play',
        icon: Crown,
        rounds: 7,
        responseTime: 45,
        votingTime: 30,
        color: 'text-destructive',
        bg: 'bg-destructive/10',
        border: 'border-destructive/20'
    }
};

const WORD_DIFFICULTIES = [
    {
        id: 'easy',
        title: 'Basic English',
        description: 'Divergent words (e.g. Apple vs Car)',
        example: 'Apple / Car',
        color: 'from-green-500/20 to-green-500/5'
    },
    {
        id: 'medium',
        title: 'Medium English',
        description: 'Abstract vs Concrete',
        example: 'Democracy / Banana',
        color: 'from-blue-500/20 to-blue-500/5'
    },
    {
        id: 'mix',
        title: 'Mix Mode',
        description: 'Basic + Medium combined',
        example: 'Random Mix',
        color: 'from-orange-500/20 to-orange-500/5'
    },
    {
        id: 'custom',
        title: 'Custom Words',
        description: 'Host provides words',
        example: 'Your / Choice',
        color: 'from-purple-500/20 to-purple-500/5'
    }
];

export const CreateRoomModal = ({ open, onOpenChange }) => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);

    // Form State
    const [title, setTitle] = useState('');
    const [activePreset, setActivePreset] = useState('standard');
    const [rounds, setRounds] = useState(5);
    const [responseTime, setResponseTime] = useState(30);
    const [votingTime, setVotingTime] = useState(20);
    const [difficulty, setDifficulty] = useState('medium');
    const [customWordsInput, setCustomWordsInput] = useState('');

    // Parse custom words
    const parsedCustomWords = customWordsInput
        .split('\n')
        .filter(line => line.includes(','))
        .map(line => {
            const [main, imposter] = line.split(',').map(s => s.trim());
            return { main, imposter };
        })
        .filter(pair => pair.main && pair.imposter);

    // Apply preset when changed
    const handlePresetSelect = (presetId) => {
        setActivePreset(presetId);
        const preset = PRESETS[presetId];
        setRounds(preset.rounds);
        setResponseTime(preset.responseTime);
        setVotingTime(preset.votingTime);
    };

    // Override detection
    useEffect(() => {
        const current = PRESETS[activePreset];
        if (
            rounds !== current.rounds ||
            responseTime !== current.responseTime ||
            votingTime !== current.votingTime
        ) {
            // Logic handled by manual input
        }
    }, [rounds, responseTime, votingTime, activePreset]);

    const titleChips = ['Casual', 'Friends', 'Private Match'];

    const handleSubmit = async () => {
        if (!title.trim()) return;

        // Custom words validation
        if (difficulty === 'custom') {
            if (parsedCustomWords.length < 20) {
                toast.error('Custom mode requires at least 20 word pairs');
                return;
            }
            if (parsedCustomWords.length > 500) {
                toast.error('Limit custom words to 500 pairs');
                return;
            }
        }

        setLoading(true);

        try {
            const { data } = await api.post('/rooms', {
                title,
                numRounds: parseInt(rounds),
                responseTime: parseInt(responseTime),
                votingTime: parseInt(votingTime),
                wordDifficulty: difficulty,
                customWords: difficulty === 'custom' ? parsedCustomWords : []
            });

            // Allow animation to finish or minimal delay
            onOpenChange(false);
            navigate(`/room/${data.join_code}`);
            toast.success('Room created successfully! 🚀');
        } catch (error) {
            console.error(error);
            toast.error(error.response?.data?.message || 'Unable to create room');
        } finally {
            setLoading(false);
        }
    };

    const isValid = title.trim().length > 0 && rounds > 0 && responseTime > 5 && votingTime > 5;
    // Disable if custom matches invalid
    const isCustomValid = difficulty !== 'custom' || (parsedCustomWords.length >= 20 && parsedCustomWords.length <= 500);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto p-0 gap-0 bg-card border-white/10">
                <DialogHeader className="p-6 pb-2">
                    <DialogTitle className="text-2xl font-bold font-heading">Create Room</DialogTitle>
                    <DialogDescription>Configure your game session</DialogDescription>
                </DialogHeader>

                <div className="p-6 space-y-8">
                    {/* SECTION 1: INFO */}
                    <div className="space-y-3">
                        <Label className="uppercase text-xs font-bold text-muted-foreground tracking-wider">Room Title</Label>
                        <GameInput
                            placeholder="Enter room name"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="text-lg bg-background/50"
                        />
                        <div className="flex flex-wrap gap-2">
                            {titleChips.map(chip => (
                                <Badge
                                    key={chip}
                                    variant="outline"
                                    className="cursor-pointer hover:bg-primary/20 hover:text-primary transition-colors py-1"
                                    onClick={() => setTitle(chip)}
                                >
                                    {chip}
                                </Badge>
                            ))}
                        </div>
                    </div>

                    {/* SECTION 2: PRESETS */}
                    <div className="space-y-3">
                        <Label className="uppercase text-xs font-bold text-muted-foreground tracking-wider">Game Mode</Label>
                        <div className="grid grid-cols-3 gap-2">
                            {Object.values(PRESETS).map((preset) => (
                                <button
                                    key={preset.id}
                                    onClick={() => handlePresetSelect(preset.id)}
                                    className={cn(
                                        "flex flex-col items-center p-3 rounded-xl border transition-all duration-200 relative overflow-hidden group",
                                        activePreset === preset.id
                                            ? `${preset.bg} ${preset.border} ring-1 ring-primary/50 shadow-md transform -translate-y-0.5`
                                            : "bg-background/30 border-white/5 hover:bg-white/5 hover:border-white/10"
                                    )}
                                >
                                    <preset.icon className={cn("w-5 h-5 mb-1.5 transition-transform duration-300 group-hover:scale-110", preset.color)} />
                                    <span className="text-xs font-bold">{preset.name}</span>
                                    <span className="text-[9px] text-muted-foreground/70 text-center leading-tight mt-1">{preset.description}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* SECTION 3: RULES */}
                    <div className="space-y-3">
                        <Label className="uppercase text-xs font-bold text-muted-foreground tracking-wider">Game Rules</Label>
                        <div className="grid grid-cols-3 gap-4">
                            <div className="space-y-1.5">
                                <Label className="text-[10px] text-muted-foreground">Rounds</Label>
                                <Input
                                    type="number"
                                    min={1} max={10}
                                    value={rounds}
                                    onChange={(e) => setRounds(e.target.value)}
                                    className="bg-background/50 text-center"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-[10px] text-muted-foreground">Response (s)</Label>
                                <Input
                                    type="number"
                                    min={5}
                                    value={responseTime}
                                    onChange={(e) => setResponseTime(e.target.value)}
                                    className="bg-background/50 text-center"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-[10px] text-muted-foreground">Voting (s)</Label>
                                <Input
                                    type="number"
                                    min={5}
                                    value={votingTime}
                                    onChange={(e) => setVotingTime(e.target.value)}
                                    className="bg-background/50 text-center"
                                />
                            </div>
                        </div>
                    </div>

                    {/* SECTION 4: WORDS */}
                    <div className="space-y-3">
                        <Label className="uppercase text-xs font-bold text-muted-foreground tracking-wider">Word Difficulty</Label>
                        <div className="grid grid-cols-2 gap-2">
                            {WORD_DIFFICULTIES.map((diff) => (
                                <div
                                    key={diff.id}
                                    onClick={() => setDifficulty(diff.id)}
                                    className={cn(
                                        "relative overflow-hidden rounded-xl border p-3 cursor-pointer transition-all h-full",
                                        difficulty === diff.id
                                            ? "border-primary bg-primary/10"
                                            : "border-white/5 bg-background/30 hover:bg-white/5"
                                    )}
                                >
                                    <div className={`absolute inset-0 bg-gradient-to-r ${diff.color} opacity-50`} />
                                    <div className="relative flex flex-col justify-between h-full gap-1">
                                        <div>
                                            <p className="font-bold text-sm text-white">{diff.title}</p>
                                            <p className="text-[10px] text-gray-300 font-medium leading-tight">{diff.description}</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Custom Words Builder */}
                        {difficulty === 'custom' && (
                            <div className="space-y-2 animate-in slide-in-from-top-2 fade-in duration-300">
                                <Label className="text-xs font-bold text-primary">
                                    Enter Custom Word Pairs (Min 20)
                                </Label>
                                <textarea
                                    className="flex min-h-[120px] w-full rounded-md border border-input bg-background/50 px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50 font-mono"
                                    placeholder={`Apple, Orange\nDog, Cat\nOne, Two...`}
                                    value={customWordsInput}
                                    onChange={(e) => setCustomWordsInput(e.target.value)}
                                />
                                <div className="flex justify-between items-center text-[10px] text-muted-foreground">
                                    <span>Format: Word, Imposter (one pair per line)</span>
                                    <span className={cn(
                                        parsedCustomWords.length < 20 || parsedCustomWords.length > 500 ? "text-destructive" : "text-green-500"
                                    )}>
                                        {parsedCustomWords.length} / 500 pairs
                                    </span>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* SECTION 5: LIVE SUMMARY */}
                    <div className="p-4 rounded-xl bg-secondary/10 border border-secondary/20">
                        <h4 className="text-xs font-bold text-secondary mb-3 uppercase tracking-wider flex items-center gap-2">
                            <BookOpen className="w-3 h-3" /> Live Game Summary
                        </h4>
                        <div className="space-y-1 text-sm">
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Host</span>
                                <span className="font-medium">You</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Rounds</span>
                                <span className="font-medium">{rounds}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Response Time</span>
                                <span className="font-medium">{responseTime} seconds</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Voting Time</span>
                                <span className="font-medium">{votingTime} seconds</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Word Difficulty</span>
                                <span className="font-medium">
                                    {WORD_DIFFICULTIES.find(d => d.id === difficulty)?.title || difficulty}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* SECTION 6: ACTIONS */}
                <div className="p-6 pt-2 pb-6 sticky bottom-0 bg-card/95 backdrop-blur-sm border-t border-white/5 z-10">
                    <GameButton
                        onClick={handleSubmit}
                        className="w-full shadow-lg shadow-primary/20"
                        size="lg"
                        disabled={!isValid || !isCustomValid || loading}
                    >
                        {loading ? (
                            <>
                                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                                Creating Room...
                            </>
                        ) : (
                            <>Create Room <ChevronRight className="w-5 h-5 ml-2" /></>
                        )}
                    </GameButton>
                </div>
            </DialogContent>
        </Dialog>
    );
};
