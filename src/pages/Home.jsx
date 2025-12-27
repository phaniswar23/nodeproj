import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '@/components/home/Header';
import { GlassCard } from '@/components/ui/GlassCard';
import { GameButton } from '@/components/ui/GameButton';
import { GameInput } from '@/components/ui/GameInput';
import { CreateRoomModal } from '@/components/game/CreateRoomModal';
import { useAuth } from '@/hooks/useAuth';
import { Play, Users, ArrowRight, Gamepad2, Sparkles, Loader2 } from 'lucide-react';
import api from '@/lib/api';
import { toast } from 'sonner';
import { BackgroundParticles } from '@/components/home/BackgroundParticles';
import { CursorEffect } from '@/components/ui/CursorEffect';
import { cn } from '@/lib/utils';


import { QRScanner } from '@/components/game/QRScanner';

const Home = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [joinCode, setJoinCode] = useState('');
    const [joinMode, setJoinMode] = useState('code'); // 'code' | 'scan'
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [joining, setJoining] = useState(false);

    const handleJoinRoom = async () => {
        if (!joinCode.trim()) return;
        setJoining(true);
        try {
            const { data } = await api.post('/rooms/join', { joinCode: joinCode.toUpperCase() });
            navigate(`/room/${data.roomId}`);
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to join room');
        } finally {
            setJoining(false);
        }
    };

    return (
        <div className="min-h-screen bg-background overflow-hidden relative selection:bg-primary/30">
            {/* <CursorEffect /> - Removed per user request */}
            {/* Background Animation Removed per user request */}
            {/* <BackgroundParticles /> */}

            <Header />

            {/* Ambient Blobs (Z-0 effectively, but let's keep them behind content) */}
            <div className="fixed inset-0 pointer-events-none z-0">
                <div className="absolute top-1/4 -left-20 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[120px] animate-pulse" style={{ animationDuration: '6s' }} />
                <div className="absolute bottom-1/4 -right-20 w-[500px] h-[500px] bg-secondary/5 rounded-full blur-[100px] animate-pulse" style={{ animationDuration: '8s' }} />
            </div>

            <main className="pt-32 pb-12 px-4 container mx-auto max-w-5xl flex flex-col items-center justify-center min-h-[85vh] relative z-10">

                {/* Hero Section */}
                <div className="text-center mb-16 space-y-6 animate-slide-up">
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs font-bold tracking-[0.2em] text-primary uppercase mb-4 backdrop-blur-md shadow-lg shadow-primary/10 hover:bg-white/10 transition-colors cursor-default">
                        <Gamepad2 className="w-3 h-3" /> Word Imposter v2.0
                    </div>

                    <h1 className="text-6xl md:text-8xl font-heading font-black tracking-tighter drop-shadow-2xl animate-shimmer" style={{ lineHeight: 1.1 }}>
                        TRUST NO ONE.
                    </h1>

                    <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto leading-relaxed font-light opacity-0 animate-in fade-in slide-in-from-bottom-4 duration-1000 fill-mode-forwards" style={{ animationDelay: '300ms' }}>
                        The ultimate social deduction game. <br className="hidden md:block" />
                        Find the <span className="text-secondary font-medium">imposter</span> among your friends before time runs out.
                    </p>
                </div>

                {/* Cards Grid */}
                <div className="grid md:grid-cols-2 gap-8 w-full max-w-4xl px-4 animate-in fade-in slide-in-from-bottom-8 duration-1000 fill-mode-forwards" style={{ animationDelay: '500ms' }}>

                    {/* Create Room Card */}
                    <GlassCard
                        className="p-10 flex flex-col items-center text-center transition-all duration-300 group cursor-pointer neon-border relative overflow-hidden"
                        onClick={() => setShowCreateModal(true)}
                    >
                        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                        <div className="w-20 h-20 rounded-2xl bg-primary/20 flex items-center justify-center mb-8 group-hover:scale-105 transition-transform duration-300 shadow-[0_0_30px_rgba(20,184,166,0.2)]">
                            <Play className="w-10 h-10 text-primary fill-primary group-hover:drop-shadow-[0_0_10px_rgba(20,184,166,0.8)] transition-all" />
                        </div>

                        <h3 className="text-3xl font-bold font-heading mb-3 tracking-wide">Create Room</h3>
                        <p className="text-muted-foreground mb-8 text-base leading-relaxed">Host a new game lobby and invite your friends with a unique code.</p>

                        <GameButton className="w-full text-lg h-12 shadow-lg shadow-primary/10 group-hover:shadow-primary/30" size="lg">
                            Host Game <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                        </GameButton>
                    </GlassCard>

                    {/* Join Room Card */}
                    <GlassCard className="p-10 flex flex-col items-center text-center transition-all duration-300 group neon-border-secondary relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-br from-secondary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                        <div className="w-20 h-20 rounded-2xl bg-secondary/20 flex items-center justify-center mb-8 group-hover:scale-105 transition-transform duration-300 shadow-[0_0_30px_rgba(234,179,8,0.2)]">
                            <Users className="w-10 h-10 text-secondary group-hover:drop-shadow-[0_0_10px_rgba(234,179,8,0.8)] transition-all" />
                        </div>

                        <h3 className="text-3xl font-bold font-heading mb-3 tracking-wide">Join Room</h3>
                        <p className="text-muted-foreground mb-8 text-base leading-relaxed">Enter a game code or scan a QR code to join instantly.</p>

                        <div className="w-full relative z-10">
                            {/* Toggle Switch */}
                            <div className="flex bg-secondary/10 p-1 rounded-lg mb-6">
                                <button
                                    className={cn(
                                        "flex-1 py-2 text-sm font-bold uppercase tracking-wider rounded-md transition-all flex items-center justify-center gap-2",
                                        joinMode === 'code' ? "bg-secondary text-secondary-foreground shadow-md" : "text-muted-foreground hover:bg-secondary/20"
                                    )}
                                    onClick={() => setJoinMode('code')}
                                >
                                    Enter Code
                                </button>
                                <button
                                    className={cn(
                                        "flex-1 py-2 text-sm font-bold uppercase tracking-wider rounded-md transition-all flex items-center justify-center gap-2",
                                        joinMode === 'scan' ? "bg-secondary text-secondary-foreground shadow-md" : "text-muted-foreground hover:bg-secondary/20"
                                    )}
                                    onClick={() => setJoinMode('scan')}
                                >
                                    Scan QR
                                </button>
                            </div>

                            {joinMode === 'code' ? (
                                <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                    <GameInput
                                        placeholder="ENTER CODE"
                                        className="text-center uppercase text-2xl font-bold tracking-[0.2em] h-14 dashed-border bg-background/50 focus:bg-background/80 transition-all border-secondary/30 focus:border-secondary"
                                        value={joinCode}
                                        onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                                        maxLength={6}
                                    />
                                    <GameButton
                                        variant="outline"
                                        className="w-full border-secondary/50 hover:bg-secondary/10 hover:text-secondary h-12 text-lg active:scale-[0.98]"
                                        onClick={handleJoinRoom}
                                        disabled={!joinCode || joining}
                                    >
                                        {joining ? <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Joining...</> : 'Join Lobby'}
                                    </GameButton>
                                </div>
                            ) : (
                                <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                    <QRScanner
                                        onScan={(code) => {
                                            if (code) {
                                                // Assuming the QR code is just the room code or a URL ending in the code
                                                // Simple extraction if it's a URL, otherwise take as is
                                                const extractedCode = code.split('/').pop().toUpperCase().slice(0, 6);
                                                setJoinCode(extractedCode);
                                                setJoinMode('code');
                                                toast.success('Room code scanned!');
                                            }
                                        }}
                                        onError={(error) => {
                                            console.error(error);
                                            toast.error('Could not access camera');
                                        }}
                                    />
                                    <p className="text-xs text-muted-foreground">Make sure you have granted camera permissions.</p>
                                </div>
                            )}
                        </div>
                    </GlassCard>
                </div>

            </main>

            <CreateRoomModal open={showCreateModal} onOpenChange={setShowCreateModal} />
        </div>
    );
};

export default Home;
