import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { User, Check, AlertCircle, Loader2 } from 'lucide-react';
import { useSocket } from '../../hooks/useSocket';

const DisplayNameModal = ({ isOpen, currentName, roomCode, onNameSet }) => {
    const { socket } = useSocket();
    const [name, setName] = useState(currentName || '');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!socket) return;

        const handleError = (msg) => {
            setError(msg);
            setLoading(false);
        };

        const handleSuccess = (newName) => {
            setLoading(false);
            onNameSet(newName); // Close modal callback
        };

        socket.on("display_name_error", handleError);
        socket.on("display_name_success", handleSuccess);

        return () => {
            socket.off("display_name_error", handleError);
            socket.off("display_name_success", handleSuccess);
        };
    }, [socket, onNameSet]);

    const handleSubmit = (e) => {
        e.preventDefault();
        setError('');

        const cleanName = name.trim();
        if (cleanName.length < 2) {
            setError("Name must be at least 2 characters.");
            return;
        }
        if (cleanName.length > 16) {
            setError("Name must be 16 characters or less.");
            return;
        }
        // Basic profanity check could go here, but server handles mostly

        setLoading(true);
        socket.emit("update_display_name", { roomCode, displayName: cleanName });
    };

    return (
        <Dialog open={isOpen}>
            <DialogContent className="sm:max-w-md bg-zinc-950 border-zinc-800 text-zinc-100" showClose={false}>
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-xl font-bold bg-gradient-to-r from-purple-400 to-pink-600 bg-clip-text text-transparent">
                        <User className="w-5 h-5 text-purple-500" />
                        Choose Your Identity
                    </DialogTitle>
                    <DialogDescription className="text-zinc-400">
                        Set a display name for this room. This is how other players will see you.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="displayName" className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
                            Display Name
                        </Label>
                        <div className="relative">
                            <Input
                                id="displayName"
                                value={name}
                                onChange={(e) => {
                                    setName(e.target.value);
                                    setError('');
                                }}
                                placeholder="e.g. SecretAgent007"
                                className="bg-zinc-900 border-zinc-800 focus:border-purple-500 transition-colors pl-10"
                                autoFocus
                                maxLength={16}
                            />
                            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                        </div>
                        <p className="text-[10px] text-zinc-500 text-right">
                            {name.length}/16 characters
                        </p>
                    </div>

                    <AnimatePresence>
                        {error && (
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="flex items-center gap-2 text-red-400 text-sm bg-red-500/10 p-3 rounded-md border border-red-500/20"
                            >
                                <AlertCircle className="w-4 h-4 shrink-0" />
                                {error}
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <DialogFooter className="pt-2">
                        {/* We don't allow cancelling if it's the initial set, but we might if it's an edit. 
                             However, for simplicity, this modal is 'force set' logic mostly. 
                             If we use it for editing, we might want a cancel button. 
                             Let's assume this is mostly for the initial flow or forced updates.
                          */}
                        <Button
                            type="submit"
                            disabled={loading || name.trim().length < 2}
                            className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold transition-all shadow-lg shadow-purple-500/20"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Joining...
                                </>
                            ) : (
                                <>
                                    Join Lobby
                                    <Check className="w-4 h-4 ml-2" />
                                </>
                            )}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
};

export default DisplayNameModal;
