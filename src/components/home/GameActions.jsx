import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { GameButton } from '@/components/ui/GameButton';
import { GlassCard } from '@/components/ui/GlassCard';
import { GameInput } from '@/components/ui/GameInput';
import { Plus, LogIn, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Textarea } from '@/components/ui/textarea';

export const GameActions = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showJoinModal, setShowJoinModal] = useState(false);
    const [loading, setLoading] = useState(false);
    const [joinCode, setJoinCode] = useState('');

    const [roomSettings, setRoomSettings] = useState({
        title: '',
        numRounds: 5,
        responseTime: 30,
        votingTime: 20,
        wordDifficulty: 'basic',
        customWords: '',
    });

    const handleCreateRoom = async () => {
        if (!user) return;
        if (!roomSettings.title.trim()) {
            toast.error('Please enter a room title');
            return;
        }

        let parsedCustomWords = null;

        if (roomSettings.wordDifficulty === 'custom') {
            const lines = roomSettings.customWords.split('\n').filter(line => line.trim());
            if (lines.length < 50 || lines.length > 100) {
                toast.error(`Please enter between 50 and 100 word pairs. Current: ${lines.length}`);
                return;
            }

            const words = lines.map(line => {
                const [main, imposter] = line.split(',').map(s => s.trim());
                if (!main || !imposter) return null;
                return { main, imposter };
            }).filter(Boolean);

            if (words.length < 50) {
                toast.error('Invalid format. Use "MainWord, ImposterWord" per line.');
                return;
            }
            parsedCustomWords = words;
        }

        setLoading(true);

        try {
            const { data } = await api.post('/rooms', {
                owner_id: user._id || user.id,
                title: roomSettings.title,
                num_rounds: Number(roomSettings.numRounds),
                response_time: Number(roomSettings.responseTime),
                voting_time: Number(roomSettings.votingTime),
                word_difficulty: roomSettings.wordDifficulty,
                custom_words: parsedCustomWords,
            });

            toast.success('Room created! 🎮');
            setShowCreateModal(false);
            navigate(`/room/${data.id}`);
        } catch (error) {
            console.error(error);
            toast.error(`Error: ${error.response?.data?.message || 'Failed to create room'}`);
        } finally {
            setLoading(false);
        }
    };

    const handleJoinRoom = async () => {
        if (!user) return;
        if (!joinCode.trim()) {
            toast.error('Please enter a join code');
            return;
        }

        setLoading(true);

        try {
            const { data } = await api.post('/rooms/join', { joinCode: joinCode.toUpperCase() });
            toast.success('Joined room!');
            setShowJoinModal(false);
            navigate(`/room/${data.roomId}`);
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to join room');
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <div className="grid md:grid-cols-2 gap-6 max-w-2xl mx-auto">
                <GlassCard
                    hover
                    className="group cursor-pointer"
                    onClick={() => setShowCreateModal(true)}
                >
                    <div className="flex flex-col items-center text-center space-y-4">
                        <div className="w-16 h-16 rounded-2xl bg-primary/20 flex items-center justify-center group-hover:bg-primary/30 transition-colors group-hover:scale-110 duration-300">
                            <Plus className="w-8 h-8 text-primary" />
                        </div>
                        <div>
                            <h3 className="text-xl font-heading font-bold text-foreground">Create Room</h3>
                            <p className="text-sm text-muted-foreground mt-1">Start a new game session</p>
                        </div>
                    </div>
                </GlassCard>

                <GlassCard
                    hover
                    className="group cursor-pointer"
                    onClick={() => setShowJoinModal(true)}
                >
                    <div className="flex flex-col items-center text-center space-y-4">
                        <div className="w-16 h-16 rounded-2xl bg-secondary/20 flex items-center justify-center group-hover:bg-secondary/30 transition-colors group-hover:scale-110 duration-300">
                            <LogIn className="w-8 h-8 text-secondary" />
                        </div>
                        <div>
                            <h3 className="text-xl font-heading font-bold text-foreground">Join Room</h3>
                            <p className="text-sm text-muted-foreground mt-1">Enter with a room code</p>
                        </div>
                    </div>
                </GlassCard>
            </div>

            {/* Create Room Modal */}
            <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
                <DialogContent className="glass-card border-border max-w-md max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="font-heading text-xl flex items-center gap-2">
                            <Sparkles className="w-5 h-5 text-primary" />
                            Create Room
                        </DialogTitle>
                    </DialogHeader>

                    <div className="space-y-6 mt-4">
                        <GameInput
                            label="Room Title"
                            placeholder="Enter room name"
                            value={roomSettings.title}
                            onChange={(e) => setRoomSettings(prev => ({ ...prev, title: e.target.value }))}
                        />

                        <div className="grid grid-cols-3 gap-4">
                            <div>
                                <Label className="text-xs mb-1.5 block text-muted-foreground">Rounds</Label>
                                <GameInput
                                    type="number"
                                    min={1}
                                    value={roomSettings.numRounds}
                                    onChange={(e) => setRoomSettings(prev => ({ ...prev, numRounds: Number(e.target.value) }))}
                                    className="h-10 text-center"
                                />
                            </div>
                            <div>
                                <Label className="text-xs mb-1.5 block text-muted-foreground">Response (s)</Label>
                                <GameInput
                                    type="number"
                                    min={5}
                                    value={roomSettings.responseTime}
                                    onChange={(e) => setRoomSettings(prev => ({ ...prev, responseTime: Number(e.target.value) }))}
                                    className="h-10 text-center"
                                />
                            </div>
                            <div>
                                <Label className="text-xs mb-1.5 block text-muted-foreground">Voting (s)</Label>
                                <GameInput
                                    type="number"
                                    min={5}
                                    value={roomSettings.votingTime}
                                    onChange={(e) => setRoomSettings(prev => ({ ...prev, votingTime: Number(e.target.value) }))}
                                    className="h-10 text-center"
                                />
                            </div>
                        </div>

                        <div className="space-y-3">
                            <Label className="text-sm">Word Difficulty</Label>
                            <RadioGroup
                                value={roomSettings.wordDifficulty}
                                onValueChange={(v) => setRoomSettings(prev => ({ ...prev, wordDifficulty: v }))}
                                className="flex flex-col gap-2"
                            >
                                <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="basic" id="basic" />
                                    <Label htmlFor="basic" className="cursor-pointer">Basic English (Standard)</Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="medium" id="medium" />
                                    <Label htmlFor="medium" className="cursor-pointer">Medium English (Advanced)</Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="custom" id="custom" />
                                    <Label htmlFor="custom" className="cursor-pointer font-bold text-primary">Custom Words (Builder)</Label>
                                </div>
                            </RadioGroup>

                            {roomSettings.wordDifficulty === 'custom' && (
                                <div className="animate-fade-in bg-muted/20 p-3 rounded-lg border border-primary/20">
                                    <Label className="text-xs text-muted-foreground mb-2 block">
                                        Enter 50-100 pairs. Format: <span className="font-mono">MainWord, ImposterWord</span>
                                    </Label>
                                    <Textarea
                                        placeholder={"Apple, Car\nDog, Cat\nSky, Ocean..."}
                                        value={roomSettings.customWords}
                                        onChange={(e) => setRoomSettings(prev => ({ ...prev, customWords: e.target.value }))}
                                        className="min-h-[150px] font-mono text-sm bg-background/50 border-input"
                                    />
                                    <p className="text-right text-xs text-muted-foreground mt-1">
                                        Pairs count: {roomSettings.customWords.split('\n').filter(l => l.includes(',')).length} / 100
                                    </p>
                                </div>
                            )}
                        </div>

                        <GameButton
                            onClick={handleCreateRoom}
                            className="w-full"
                            glow
                            disabled={loading}
                        >
                            {loading ? 'Creating...' : 'Create Room'}
                        </GameButton>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Join Room Modal */}
            <Dialog open={showJoinModal} onOpenChange={setShowJoinModal}>
                <DialogContent className="glass-card border-border max-w-md">
                    <DialogHeader>
                        <DialogTitle className="font-heading text-xl flex items-center gap-2">
                            <LogIn className="w-5 h-5 text-secondary" />
                            Join Room
                        </DialogTitle>
                    </DialogHeader>

                    <div className="space-y-6 mt-4">
                        <GameInput
                            label="Room Code"
                            placeholder="Enter 6-digit code"
                            value={joinCode}
                            onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                            maxLength={6}
                            className="text-center text-2xl font-heading tracking-widest"
                        />

                        <GameButton
                            onClick={handleJoinRoom}
                            variant="secondary"
                            className="w-full"
                            disabled={loading}
                        >
                            {loading ? 'Joining...' : 'Join Room'}
                        </GameButton>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
};
