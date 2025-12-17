import { useEffect, useRef, useState } from 'react';

export const CursorEffect = () => {
    const cursorRef = useRef(null);
    const [velocity, setVelocity] = useState(0);
    const lastPos = useRef({ x: 0, y: 0 });
    const lastTime = useRef(performance.now());
    const rafId = useRef(null);

    useEffect(() => {
        const handleMove = (e) => {
            if (!cursorRef.current) return;

            // Move cursor
            cursorRef.current.style.transform = `translate(${e.clientX}px, ${e.clientY}px) translate(-50%, -50%)`;

            // Calculate velocity for glow intensity
            const now = performance.now();
            const dt = now - lastTime.current;
            if (dt > 16) { // ~60fps
                const dx = e.clientX - lastPos.current.x;
                const dy = e.clientY - lastPos.current.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                const v = dist / dt; // pixels per ms

                setVelocity(Math.min(v * 5, 1)); // Cap at 1

                lastPos.current = { x: e.clientX, y: e.clientY };
                lastTime.current = now;
            }
        };

        window.addEventListener('mousemove', handleMove);
        return () => window.removeEventListener('mousemove', handleMove);
    }, []);

    // Fade out velocity
    useEffect(() => {
        const loop = () => {
            setVelocity(prev => Math.max(0, prev - 0.05));
            if (cursorRef.current) {
                cursorRef.current.style.opacity = 0.3 + (velocity * 0.5); // Base 0.3, max 0.8
                cursorRef.current.style.width = `${400 + velocity * 100}px`; // Grows with speed
                cursorRef.current.style.height = `${400 + velocity * 100}px`;
            }
            rafId.current = requestAnimationFrame(loop);
        };
        rafId.current = requestAnimationFrame(loop);
        return () => cancelAnimationFrame(rafId.current);
    }, [velocity]);

    return (
        <div
            ref={cursorRef}
            className="fixed top-0 left-0 w-[400px] h-[400px] bg-primary/20 rounded-full blur-[80px] pointer-events-none mix-blend-screen z-[9999] transition-opacity duration-100 ease-out"
            style={{ opacity: 0 }}
        />
    );
};
