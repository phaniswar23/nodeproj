import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { AlertTriangle } from 'lucide-react';

export const RuleReminderModal = () => {
    const [open, setOpen] = useState(false);
    const [dontShowAgain, setDontShowAgain] = useState(false);

    useEffect(() => {
        const hasSeen = localStorage.getItem('hasSeenRuleReminder');
        if (!hasSeen) {
            // Small delay to show after lobby loads
            const timer = setTimeout(() => setOpen(true), 1000);
            return () => clearTimeout(timer);
        }
    }, []);

    const handleClose = () => {
        if (dontShowAgain) {
            localStorage.setItem('hasSeenRuleReminder', 'true');
        }
        setOpen(false);
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent className="max-w-md bg-card border-red-500/20 border shadow-[0_0_50px_rgba(220,38,38,0.2)]">
                <DialogHeader className="items-center text-center space-y-4 pt-4">
                    <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mb-2 animate-pulse">
                        <AlertTriangle className="w-8 h-8 text-red-500" />
                    </div>
                    <DialogTitle className="text-2xl font-bold font-heading text-white">
                        Important Rule Reminder
                    </DialogTitle>
                    <DialogDescription className="text-gray-300 text-base">
                        Imposters lose <span className="text-red-400 font-bold text-lg">-50%</span> of their score if they say the <span className="text-white font-bold underline decoration-red-500/50 underline-offset-4">EXACT Agent word</span>.
                    </DialogDescription>
                </DialogHeader>

                <div className="bg-red-500/5 border border-red-500/10 p-4 rounded-xl text-center text-xs text-red-200/70 mt-4">
                    Be careful! Even a slip of the tongue counts.
                </div>

                <DialogFooter className="flex-col gap-4 mt-6 sm:flex-col items-center">
                    <Button
                        onClick={handleClose}
                        className="w-full bg-red-600 hover:bg-red-700 text-white font-bold h-12 text-base rounded-xl transition-all hover:scale-105 shadow-lg shadow-red-900/20"
                    >
                        Got it, I'll be careful
                    </Button>
                    <div className="flex items-center space-x-2">
                        <Checkbox
                            id="dontShow"
                            checked={dontShowAgain}
                            onCheckedChange={setDontShowAgain}
                            className="border-white/20 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                        />
                        <label
                            htmlFor="dontShow"
                            className="text-xs font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-muted-foreground"
                        >
                            Don't show this again
                        </label>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
