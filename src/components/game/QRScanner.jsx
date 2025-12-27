import { Scanner } from '@yudiel/react-qr-scanner';
import { Loader2, AlertCircle } from 'lucide-react';
import { useState } from 'react';

export const QRScanner = ({ onScan, onError }) => {
    const [loading, setLoading] = useState(true);

    return (
        <div className="rounded-xl overflow-hidden border-2 border-primary/20 shadow-[0_0_20px_rgba(0,0,0,0.5)] bg-black/80 aspect-square w-full max-w-[350px] mx-auto relative group">

            {loading && (
                <div className="absolute inset-0 flex items-center justify-center z-10 text-primary">
                    <Loader2 className="w-8 h-8 animate-spin" />
                </div>
            )}

            <Scanner
                onScan={(result) => {
                    setLoading(false);
                    if (result && result[0] && result[0].rawValue) {
                        onScan(result[0].rawValue);
                    }
                }}
                onError={(error) => {
                    setLoading(false);
                    if (onError) onError(error);
                }}
                classNames={{
                    container: "w-full h-full object-cover"
                }}
                components={{
                    audio: false,
                    onOff: false,
                    finder: true
                }}
                allowMultiple={true}
                scanDelay={500}
            />

            {/* Overlay Grid Effect */}
            <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(20,184,166,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(20,184,166,0.1)_1px,transparent_1px)] bg-[size:20px_20px] opacity-20" />

            <div className="absolute bottom-2 left-0 right-0 text-center text-xs text-muted-foreground bg-black/50 py-1 backdrop-blur-sm">
                Point camera at a Room QR Code
            </div>
        </div>
    );
};
