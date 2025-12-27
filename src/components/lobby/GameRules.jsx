
import React, { useState } from 'react';
import { BookOpen, ChevronDown, ChevronUp, Share2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

export const GameRules = ({ isHost, onPostToChat }) => {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className="w-full border border-white/5 rounded-lg bg-black/20 overflow-hidden transition-all duration-300">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center justify-between p-3 hover:bg-white/5 transition-colors"
            >
                <div className="flex items-center gap-2 text-sm font-bold text-zinc-300">
                    <BookOpen className="w-4 h-4 text-zinc-500" />
                    How to Play
                </div>
                {isOpen ? <ChevronUp className="w-4 h-4 text-zinc-500" /> : <ChevronDown className="w-4 h-4 text-zinc-500" />}
            </button>

            {isOpen && (
                <div className="p-4 pt-0 space-y-4 animate-in slide-in-from-top-2">
                    <div className="space-y-2 text-xs text-zinc-400 leading-relaxed">
                        <p>
                            <span className="text-white font-bold">1. Minimum 3 Players:</span> The game requires at least 3 players to start.
                        </p>
                        <p>
                            <span className="text-white font-bold">2. The Imposter:</span> One player is secretly the Imposter. They don't know the secret word.
                        </p>
                        <p>
                            <span className="text-white font-bold">3. Describe & Blend In:</span> Everyone describes the word. The Imposter must blend in without revealing they don't know (or by guessing) the word.
                        </p>
                        <p>
                            <span className="text-white font-bold">4. Careful!</span> If the Imposter says the <span className="text-red-400">EXACT</span> secret word, they lose 50% of their points!
                        </p>
                    </div>

                    {isHost && (
                        <Button
                            variant="secondary"
                            size="sm"
                            onClick={(e) => { e.stopPropagation(); onPostToChat(); }}
                            className="w-full h-8 text-xs bg-white/5 hover:bg-white/10 border border-white/5"
                        >
                            <Share2 className="w-3 h-3 mr-2" />
                            Post Rules to Chat
                        </Button>
                    )}
                </div>
            )}
        </div>
    );
};
