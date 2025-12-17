import { Gamepad2 } from 'lucide-react';

export const LoadingScreen = () => {
    return (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background">
            <div className="relative">
                {/* Pulsing Glow Background */}
                <div className="absolute inset-0 bg-primary/20 blur-3xl animate-pulse rounded-full" />

                <div className="relative z-10 flex flex-col items-center gap-6">
                    {/* Main Logo Icon with Spin and Glitch */}
                    <div className="relative">
                        <div className="absolute inset-0 bg-primary/50 blur-xl animate-pulse" />
                        <Gamepad2 className="w-16 h-16 text-primary animate-bounce" />
                    </div>

                    <div className="flex flex-col items-center gap-2">
                        <h2 className="text-3xl font-heading font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary animate-pulse">
                            LOADING
                        </h2>

                        {/* Custom Bar Loader */}
                        <div className="w-48 h-1.5 bg-muted rounded-full overflow-hidden">
                            <div className="h-full bg-primary animate-[translateX_1.5s_ease-in-out_infinite] w-1/2 rounded-full" />
                        </div>

                        <p className="text-xs text-muted-foreground uppercase tracking-[0.3em] animate-pulse mt-2">
                            Initializing Game Protocol...
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};
