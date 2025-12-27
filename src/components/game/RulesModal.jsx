import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { ScrollArea } from "@/components/ui/scroll-area";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { BookOpen, AlertTriangle, CheckCircle, XCircle, Trophy } from 'lucide-react';

export const RulesModal = ({ open, onOpenChange }) => {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl h-[85vh] bg-card border-white/10 p-0 overflow-hidden flex flex-col">
                <DialogHeader className="p-6 pb-2">
                    <DialogTitle className="flex items-center gap-2 text-2xl font-bold font-heading text-white">
                        <BookOpen className="w-6 h-6 text-primary" /> Game Rules & Scoring
                    </DialogTitle>
                    <DialogDescription>
                        Understanding how to win as Agent or Imposter.
                    </DialogDescription>
                </DialogHeader>

                <ScrollArea className="flex-1">
                    <div className="p-6 pt-2 pb-20 space-y-8">

                        {/* 1. Core Rules */}
                        <div className="space-y-4">
                            <h3 className="text-lg font-bold text-primary uppercase tracking-wider border-b border-primary/20 pb-2">
                                📜 Core Rules
                            </h3>
                            <ul className="space-y-2 text-sm text-gray-300">
                                <li className="flex items-start gap-2">
                                    <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5" />
                                    <span>Minimum <strong>3 players</strong> required to start.</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5" />
                                    <span>One <strong>Imposter</strong> is chosen randomly each round.</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5" />
                                    <span>
                                        <strong>Agents</strong> get the same secret word (e.g., "Apple").<br />
                                        <strong>Imposter</strong> gets a different but similar word (e.g., "Pear").
                                    </span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5" />
                                    <span>Use the chat or voice to discuss, but don't reveal your word explicitly!</span>
                                </li>
                            </ul>
                        </div>

                        {/* 2. Scoring System */}
                        <div className="space-y-4">
                            <h3 className="text-lg font-bold text-secondary uppercase tracking-wider border-b border-secondary/20 pb-2">
                                🏆 Scoring System
                            </h3>
                            <div className="rounded-xl border border-white/10 overflow-hidden">
                                <Table>
                                    <TableHeader className="bg-white/5">
                                        <TableRow className="border-white/5 hover:bg-white/5">
                                            <TableHead className="text-xs font-bold uppercase text-muted-foreground">Action</TableHead>
                                            <TableHead className="text-xs font-bold uppercase text-muted-foreground text-right">Points</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        <TableRow className="border-white/5 hover:bg-white/5">
                                            <TableCell className="font-medium flex items-center gap-2">
                                                <CheckCircle className="w-4 h-4 text-green-500" /> Correctly voting Imposter
                                            </TableCell>
                                            <TableCell className="text-right font-mono text-green-400 font-bold">+100</TableCell>
                                        </TableRow>
                                        <TableRow className="border-white/5 hover:bg-white/5">
                                            <TableCell className="font-medium flex items-center gap-2">
                                                <Trophy className="w-4 h-4 text-yellow-500" /> Imposter Survives Round
                                            </TableCell>
                                            <TableCell className="text-right font-mono text-yellow-400 font-bold">+150</TableCell>
                                        </TableRow>
                                        <TableRow className="border-white/5 hover:bg-white/5">
                                            <TableCell className="font-medium flex items-center gap-2">
                                                <Trophy className="w-4 h-4 text-blue-500" /> Agent Survives (Win)
                                            </TableCell>
                                            <TableCell className="text-right font-mono text-blue-400 font-bold">+50</TableCell>
                                        </TableRow>
                                        <TableRow className="border-white/5 hover:bg-white/5">
                                            <TableCell className="font-medium flex items-center gap-2">
                                                <XCircle className="w-4 h-4 text-red-500" /> Wrong Vote
                                            </TableCell>
                                            <TableCell className="text-right font-mono text-gray-500 font-bold">0</TableCell>
                                        </TableRow>
                                        <TableRow className="border-white/5 hover:bg-white/5 bg-gradient-to-r from-red-900/50 to-red-900/10 border-l-4 border-l-red-500">
                                            <TableCell className="font-bold flex items-center gap-2 text-red-400 py-4">
                                                <AlertTriangle className="w-5 h-5 text-red-500 animate-pulse" />
                                                <span>
                                                    Imposter reveals EXACT Agent word
                                                    <span className="block text-[10px] font-normal text-red-300/70">Automatic penalty detected by system</span>
                                                </span>
                                            </TableCell>
                                            <TableCell className="text-right font-mono text-red-400 font-black text-lg">
                                                -50%
                                                <span className="block text-[10px] font-normal text-red-300/70">of total score</span>
                                            </TableCell>
                                        </TableRow>
                                    </TableBody>
                                </Table>
                            </div>

                            <div className="flex gap-3 bg-red-500/10 border border-red-500/20 p-4 rounded-lg">
                                <span className="text-xl">⚠️</span>
                                <p className="text-sm text-red-200 leading-relaxed">
                                    <strong>Why the penalty?</strong> To prevent the Imposter from giving up or ruining the deduction element, using the exact agent word results in a severe score deduction. Try to blend in without being obvious!
                                </p>
                            </div>


                            {/* Spacer to ensure scrolling - FORCE HEIGHT */}
                            <div style={{ height: '200px', minHeight: '200px' }} className="w-full flex items-center justify-center text-white/5 text-xs uppercase tracking-widest">
                                End of Rules
                            </div>
                        </div>

                    </div>
                </ScrollArea>

                <div className="p-4 border-t border-white/10 bg-black/20 text-center">
                    <p className="text-xs text-muted-foreground">
                        Identify the imposter before the time runs out. Good luck!
                    </p>
                </div>
            </DialogContent>
        </Dialog>
    );
};
