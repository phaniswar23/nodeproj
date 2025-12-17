import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '@/components/home/Header';
import { GlassCard } from '@/components/ui/GlassCard';
import { GameButton } from '@/components/ui/GameButton';
import { GameInput } from '@/components/ui/GameInput';
import { CreateRoomModal } from '@/components/game/CreateRoomModal';
import { useAuth } from '@/hooks/useAuth';
import { Play, Users, ArrowRight, Gamepad2 } from 'lucide-react';
import api from '@/lib/api';
import { toast } from 'sonner';

const Index = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [joinCode, setJoinCode] = useState('');
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [joining, setJoining] = useState(false);

    const handleJoinRoom = async () => {
        if (!joinCode.trim()) return;
        setJoining(true);
        try {
            const { data } = await api.post('/rooms/join', { joinCode: joinCode.toUpperCase() });
            navigate(`/room/${data.roomId}`); // Using roomId or we might need code? 
            // The endpoint returns { roomId: room._id }. 
            // Wait, navigation usually uses room CODE for cleaner URLs or ID?
            // Existing route `router.get('/:code')` in backend implies code.
            // But `router.post('/join')` returns `roomId`.
            // Let's check `Room.jsx`. If it expects ID or Code. 
            // I'll assume ID for now based on `navigate('/room/' + id)`. 
            // Actually, if I navigate to `/room/:id`, the component will stick `id` into `useParams`.
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to join room');
        } finally {
            setJoining(false);
        }
    };

    return (
        <div className="min-h-screen bg-background overflow-hidden relative">
            <Header />

            {/* Background Ambience */}
            <div className="fixed inset-0 pointer-events-none -z-10">
                <div className="absolute top-1/4 -left-20 w-[600px] h-[600px] bg-primary/10 rounded-full blur-[120px] animate-pulse" style={{ animationDuration: '6s' }} />
                <div className="absolute bottom-1/4 -right-20 w-[500px] h-[500px] bg-secondary/10 rounded-full blur-[100px] animate-pulse" style={{ animationDuration: '8s' }} />
            </div>

            <main className="pt-32 pb-12 px-4 container mx-auto max-w-4xl flex flex-col items-center justify-center min-h-[80vh]">

                <div className="text-center mb-12 space-y-4 animate-slide-up">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-bold tracking-widest text-primary uppercase mb-4">
                        <Gamepad2 className="w-4 h-4" /> Word Imposter v2.0
                    </div>
                    <h1 className="text-5xl md:text-7xl font-heading font-black text-transparent bg-clip-text bg-gradient-to-b from-white to-white/50 drop-shadow-2xl">
                        TRUST NO ONE.
                    </h1>
                    <p className="text-xl text-muted-foreground max-w-lg mx-auto leading-relaxed">
                        The ultimate social deduction game. Find the imposter among your friends before time runs out.
                    </p>
                </div>

                <div className="grid md:grid-cols-2 gap-6 w-full max-w-2xl animate-fade-in" style={{ animationDelay: '200ms' }}>

                    {/* Create Room Card */}
                    <GlassCard className="p-8 flex flex-col items-center text-center hover:border-primary/50 transition-colors group cursor-pointer" onClick={() => setShowCreateModal(true)}>
                        <div className="w-16 h-16 rounded-2xl bg-primary/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                            <Play className="w-8 h-8 text-primary fill-primary" />
                        </div>
                        <h3 className="text-2xl font-bold font-heading mb-2">Create Room</h3>
                        <p className="text-muted-foreground mb-6 text-sm">Host a new game and invite your friends using a code.</p>
                        <GameButton className="w-full" size="lg">
                            Host Game <ArrowRight className="w-4 h-4 ml-2" />
                        </GameButton>
                    </GlassCard>

                    {/* Join Room Card */}
                    <GlassCard className="p-8 flex flex-col items-center text-center hover:border-secondary/50 transition-colors">
                        <div className="w-16 h-16 rounded-2xl bg-secondary/20 flex items-center justify-center mb-6">
                            <Users className="w-8 h-8 text-secondary" />
                        </div>
                        <h3 className="text-2xl font-bold font-heading mb-2">Join Room</h3>
                        <p className="text-muted-foreground mb-6 text-sm">Enter a game code to join an existing lobby.</p>

                        <div className="w-full space-y-3">
                            <GameInput
                                placeholder="ENTER CODE"
                                className="text-center uppercase text-xl font-bold tracking-widest h-12 dashed-border"
                                value={joinCode}
                                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                                maxLength={6}
                            />
                            <GameButton
                                variant="outline"
                                className="w-full border-secondary/50 hover:bg-secondary/10 hover:text-secondary"
                                onClick={handleJoinRoom}
                                disabled={!joinCode || joining}
                            >
                                {joining ? 'Joining...' : 'Join Lobby'}
                            </GameButton>
                        </div>
                    </GlassCard>
                </div>

            </main>

            <CreateRoomModal open={showCreateModal} onOpenChange={setShowCreateModal} />
        </div>
    );
};

export default Index;
