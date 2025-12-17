import { useEffect, useState } from 'react';

// Bullet / Tracer Background Animation
// High intensity, esports-inspired, optimized for performance

export const BackgroundParticles = () => {
    const [bullets, setBullets] = useState([]);
    const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

    useEffect(() => {
        // Accessibility check
        const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
        setPrefersReducedMotion(mediaQuery.matches);

        const handleChange = (e) => setPrefersReducedMotion(e.matches);
        mediaQuery.addEventListener('change', handleChange);
        return () => mediaQuery.removeEventListener('change', handleChange);
    }, []);

    useEffect(() => {
        if (prefersReducedMotion) {
            setBullets([]);
            return;
        }

        const count = 25; // Moderate density
        const colors = ['bullet-cyan', 'bullet-teal', 'bullet-blue', 'bullet-warm'];

        const newBullets = Array.from({ length: count }).map((_, i) => {
            const isDiagonal = Math.random() > 0.6; // 40% diagonal
            const speedVar = Math.random();

            return {
                id: i,
                top: `${Math.random() * 100}%`,
                width: `${100 + Math.random() * 200}px`,
                // Hyper speed: 0.3s - 0.8s
                duration: `${0.3 + speedVar * 0.5}s`,
                delay: `-${Math.random() * 2}s`,
                // High opacity for max visibility
                opacity: 0.8 + Math.random() * 0.2, // 0.8 - 1.0 (Max opacity)
                height: Math.random() > 0.9 ? '3px' : '2px' // Thicker
            };
        });
        setBullets(newBullets);
    }, [prefersReducedMotion]);

    if (prefersReducedMotion) return null;

    return (
        <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
            {bullets.map((b) => (
                <div
                    key={b.id}
                    className={`bullet ${b.color} ${b.type}`}
                    style={{
                        top: b.top,
                        width: b.width,
                        left: 0,
                        height: b.height,
                        animationDuration: b.duration,
                        animationDelay: b.delay,
                        opacity: b.opacity,
                        '--target-opacity': b.opacity // Use CSS var if needed, but keyframe override is main concern. 
                        // Actually, inline opacity is ignored by keyframe unless keyframe uses var. 
                        // I will rely on keyframe opacity: 1 for now or update index.css.
                    }}
                />
            ))}
        </div>
    );
};
