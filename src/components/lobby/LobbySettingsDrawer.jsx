
import React from 'react';
import { Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet";
import { LobbySettings } from './LobbySettings';

export const LobbySettingsDrawer = ({
    settings,
    isHost,
    roomCode,
    onUpdate
}) => {
    return (
        <Sheet>
            <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="text-zinc-400 hover:text-white hover:bg-white/10">
                    <Settings className="w-5 h-5" />
                </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[400px] sm:w-[540px] border-l border-white/10 bg-black/95 backdrop-blur-xl">
                <SheetHeader className="mb-6 text-left">
                    <SheetTitle className="text-white flex items-center gap-2">
                        <Settings className="w-5 h-5 text-blue-400" />
                        Lobby Settings
                    </SheetTitle>
                    <SheetDescription className="text-zinc-500">
                        {isHost ? "Configure game rules and difficulty." : "View current game settings (Host only)."}
                    </SheetDescription>
                </SheetHeader>

                <div className="py-4">
                    <LobbySettings
                        settings={settings}
                        isHost={isHost}
                        roomCode={roomCode}
                        onUpdate={onUpdate}
                    />
                </div>
            </SheetContent>
        </Sheet>
    );
};
