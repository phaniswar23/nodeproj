
import React from 'react';
import { Clock, Vote, Trophy, AlertTriangle, Target } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

export const LiveGameSummary = ({ settings }) => {
    return (
        <Card className="bg-black/40 border-white/10 p-4 space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-zinc-100 uppercase tracking-wider flex items-center gap-2">
                    <Target className="w-4 h-4 text-primary" />
                    Live Game Summary
                </h3>
                <span className="text-[10px] text-zinc-500 font-mono bg-white/5 px-2 py-0.5 rounded border border-white/5">
                    AUTO-UPDATES
                </span>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center">
                <div className="bg-white/5 rounded p-2 border border-white/5">
                    <div className="text-[10px] text-zinc-500 uppercase font-bold mb-1">Rounds</div>
                    <div className="text-xl font-bold text-white font-mono">{settings.rounds}</div>
                </div>
                <div className="bg-white/5 rounded p-2 border border-white/5">
                    <div className="text-[10px] text-zinc-500 uppercase font-bold mb-1">Response</div>
                    <div className="text-xl font-bold text-blue-400 font-mono">{settings.responseTime}s</div>
                </div>
                <div className="bg-white/5 rounded p-2 border border-white/5">
                    <div className="text-[10px] text-zinc-500 uppercase font-bold mb-1">Voting</div>
                    <div className="text-xl font-bold text-purple-400 font-mono">{settings.votingTime}s</div>
                </div>
            </div>

            <Separator className="bg-white/10" />

            <div className="space-y-2">
                <div className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">Scoring Rules</div>
                <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
                    <div className="flex items-center justify-between text-green-400/90">
                        <span>Correct Vote</span>
                        <span className="font-mono font-bold">+100</span>
                    </div>
                    <div className="flex items-center justify-between text-red-400/90">
                        <span>Imposter Survives</span>
                        <span className="font-mono font-bold">+150</span>
                    </div>
                    <div className="flex items-center justify-between text-blue-400/90">
                        <span>Agent Win</span>
                        <span className="font-mono font-bold">+50</span>
                    </div>
                    <div className="flex items-center justify-between text-yellow-500/90 col-span-2 bg-yellow-500/5 rounded px-2 py-1 border border-yellow-500/10">
                        <span className="flex items-center gap-1.5">
                            <AlertTriangle className="w-3 h-3" />
                            Imposter says exact word
                        </span>
                        <span className="font-mono font-bold">-50% Pts</span>
                    </div>
                </div>
            </div>
        </Card>
    );
};
