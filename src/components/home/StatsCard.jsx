import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { GlassCard } from '@/components/ui/GlassCard';
import { Trophy, Target, Flame, Star } from 'lucide-react';

export const StatsCard = () => {
    const { user } = useAuth();
    const [stats, setStats] = useState(null);

    useEffect(() => {
        if (user) fetchStats();
    }, [user]);

    const fetchStats = async () => {
        if (!user) return;
        try {
            const { data } = await api.get(`/users/${user._id || user.id}/stats`);
            setStats(data);
        } catch {
            // ignore error or empty state
        }
    };

    const statItems = [
        { label: 'Games Played', value: stats?.rooms_participated || 0, icon: Target, color: 'text-primary' },
        { label: 'Wins', value: stats?.wins || 0, icon: Trophy, color: 'text-success' },
        { label: 'Losses', value: stats?.losses || 0, icon: Flame, color: 'text-destructive' },
        { label: 'Total Score', value: stats?.total_score || 0, icon: Star, color: 'text-secondary' },
    ];

    return (
        <GlassCard className="mt-8">
            <h3 className="font-heading text-lg font-bold mb-4 flex items-center gap-2">
                <Trophy className="w-5 h-5 text-primary" />
                Your Stats
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {statItems.map((item) => (
                    <div key={item.label} className="text-center p-4 rounded-lg bg-muted/30">
                        <item.icon className={`w-6 h-6 mx-auto mb-2 ${item.color}`} />
                        <div className="text-2xl font-heading font-bold">{item.value}</div>
                        <div className="text-xs text-muted-foreground">{item.label}</div>
                    </div>
                ))}
            </div>
        </GlassCard>
    );
};
