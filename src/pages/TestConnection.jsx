import { useState } from 'react';
import { GameButton } from '@/components/ui/GameButton';
import { GlassCard } from '@/components/ui/GlassCard';
import api from '@/lib/api';

export default function TestConnection() {
    const [logs, setLogs] = useState([]);

    const addLog = (msg) => setLogs(prev => [...prev, `${new Date().toLocaleTimeString()}: ${msg}`]);

    const runTest = async () => {
        setLogs([]);
        addLog('Starting Connection Test...');

        // 1. Test Backend Connectivity
        try {
            addLog('Pinging Backend...');
            const res = await api.get('/auth/me'); // Simple protected route check
            addLog('Backend reachable!');
            addLog(`User: ${res.data.username}`);
        } catch (e) {
            addLog(`Backend Error: ${e.message}`);
            if (e.response) {
                addLog(`Status: ${e.response.status}`);
            }
        }
    };

    return (
        <div className="min-h-screen bg-background p-8 pt-24">
            <GlassCard className="max-w-xl mx-auto">
                <h1 className="text-2xl font-bold mb-4">Connection Verification</h1>
                <GameButton onClick={runTest} glow className="w-full mb-6">
                    Run Diagnostics
                </GameButton>

                <div className="bg-black/50 p-4 rounded-lg font-mono text-xs h-64 overflow-y-auto border border-white/10">
                    {logs.length === 0 ? (
                        <span className="text-muted-foreground">Ready to test...</span>
                    ) : (
                        logs.map((log, i) => (
                            <div key={i} className="mb-1 text-green-400 border-b border-white/5 pb-1 last:border-0">{log}</div>
                        ))
                    )}
                </div>
            </GlassCard>
        </div>
    );
}
