import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Circle, MinusCircle, Disc, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

const STATUS_OPTIONS = [
    { id: 'online', label: 'Online', color: 'bg-green-500', icon: Circle, ringColor: 'text-green-500' },
    { id: 'dnd', label: 'Do Not Disturb', color: 'bg-red-500', icon: MinusCircle, ringColor: 'text-red-500' },
    { id: 'offline', label: 'Invisible', color: 'bg-gray-500', icon: Disc, ringColor: 'text-gray-500' },
];

export const RadialStatusMenu = ({ isOpen, onClose, currentStatus, onSelect }) => {
    // Radial positioning logic
    // We'll arrange them in a semi-circle below or around the avatar.
    // Let's do a uniform distribution around the bottom-left/bottom-right since it's top-right corner usually?
    // Actually, Prompt says "Menu appears around the avatar".
    // 3 items -> Triangle?
    // Let's place them at -45deg, 0deg, 45deg (bottom-left, bottom, bottom-right)?
    // Or 120deg apart?
    // Let's try vertical stack with slight curve for simplicity first, or standard radial.

    // Config for 3 items in a circle
    const radius = 60; // Distance from center
    const startAngle = 135; // Start at bottom-rightish (visual)
    // Actually, simple "Orbital" layout:
    // 1. Below Left
    // 2. Below Center
    // 3. Below Right

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop to close on click outside */}
                    <div
                        className="fixed inset-0 z-40 bg-transparent"
                        onClick={onClose}
                    />

                    {/* Menu Container (Relative to parent) */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        transition={{ duration: 0.2, type: "spring", stiffness: 300, damping: 25 }}
                        className="absolute inset-0 z-50 flex items-center justify-center pointer-events-none"
                    >
                        {STATUS_OPTIONS.map((status, index) => {
                            // Calculate position on a circle
                            // We want them to pop out. 
                            // Let's hardcode offsets for 3 items for a "Tripod" look
                            // 0: Top (-y)
                            // 1: Bottom Right (+x, +y)
                            // 2: Bottom Left (-x, +y)

                            // Adjusting for "Around the avatar":
                            // Since Avatar is usually top-right or has space, let's just do a nice triangle.
                            const angle = (index * 120) - 90; // -90 starts at Top (12 o'clock)
                            const rad = (angle * Math.PI) / 180;
                            const x = Math.cos(rad) * 65; // Radius 65px
                            const y = Math.sin(rad) * 65;

                            const isSelected = currentStatus === status.id;

                            return (
                                <motion.button
                                    key={status.id}
                                    onClick={() => onSelect(status.id)}
                                    initial={{ x: 0, y: 0, opacity: 0 }}
                                    animate={{ x, y, opacity: 1 }}
                                    exit={{ x: 0, y: 0, opacity: 0 }}
                                    transition={{ duration: 0.3, delay: index * 0.05 }}
                                    className={cn(
                                        "absolute w-12 h-12 rounded-full flex items-center justify-center pointer-events-auto shadow-lg backdrop-blur-md border border-white/10 transition-transform hover:scale-110 active:scale-95 group",
                                        "bg-[#1e1f22]/90", // Dark background
                                        isSelected ? "ring-2 ring-white ring-offset-2 ring-offset-[#1e1f22]" : ""
                                    )}
                                    title={status.label}
                                >
                                    <div className={cn(
                                        "w-full h-full rounded-full flex items-center justify-center opacity-80 group-hover:opacity-100 transition-opacity",
                                        // status.ringColor
                                    )}>
                                        <status.icon className={cn("w-6 h-6", status.ringColor)} />
                                    </div>

                                    {/* Tooltip Label (Optional, maybe fade in on hover) */}
                                    <span className="absolute top-14 text-[10px] font-bold uppercase tracking-wider bg-black/80 px-2 py-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap text-white pointer-events-none">
                                        {status.label}
                                    </span>
                                </motion.button>
                            );
                        })}
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};
