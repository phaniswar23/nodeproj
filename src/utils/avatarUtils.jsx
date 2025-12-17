import {
    Gamepad2, Joystick, Brain, Crown, Ghost,
    Swords, Skull, VenetianMask, Flame, Zap, Shield,
    Target, Trophy, Star, Rocket, Bomb, Map, Compass,
    Anchor, Key, Lock, Unlock, Eye, EyeOff, Heart,
    Hexagon, Triangle, Circle, Square,
    Dna, Atom, Radiation, Biohazard, Plane, Car, Bike, Ship,
    Cat, Dog, Fish, Bird, Bug,
    Gem, Coins, Wallet, CreditCard, DollarSign,
    Cloud, Sun, Moon, Umbrella, Snowflake
} from 'lucide-react';
import { renderToStaticMarkup } from 'react-dom/server';

// 1. Define Icons (~50 icons)
const ICONS = [
    { icon: Gamepad2, label: 'Gamer' }, { icon: Joystick, label: 'Arcade' },
    { icon: Brain, label: 'Brain' }, { icon: Crown, label: 'King' },
    { icon: Ghost, label: 'Ghost' }, { icon: Swords, label: 'Battle' },
    { icon: Skull, label: 'Skull' }, { icon: VenetianMask, label: 'Mask' },
    { icon: Flame, label: 'Fire' }, { icon: Zap, label: 'Energy' },
    { icon: Shield, label: 'Guard' }, { icon: Target, label: 'Aim' },
    { icon: Trophy, label: 'Winner' }, { icon: Star, label: 'Star' },
    { icon: Rocket, label: 'Space' }, { icon: Bomb, label: 'Boom' },
    { icon: Map, label: 'Map' }, { icon: Compass, label: 'North' },
    { icon: Anchor, label: 'Sea' }, { icon: Key, label: 'Key' },
    { icon: Lock, label: 'Lock' }, { icon: Unlock, label: 'Open' },
    { icon: Eye, label: 'Seer' }, { icon: EyeOff, label: 'Blind' },
    { icon: Heart, label: 'Life' }, { icon: Hexagon, label: 'Hex' },
    { icon: Triangle, label: 'Tri' }, { icon: Circle, label: 'Circ' },
    { icon: Square, label: 'Box' }, { icon: Dna, label: 'DNA' },
    { icon: Atom, label: 'Atom' }, { icon: Radiation, label: 'Rad' },
    { icon: Biohazard, label: 'Bio' }, { icon: Plane, label: 'Fly' },
    { icon: Car, label: 'Drive' }, { icon: Bike, label: 'Ride' },
    { icon: Ship, label: 'Sail' }, { icon: Cat, label: 'Cat' },
    { icon: Dog, label: 'Dog' }, { icon: Fish, label: 'Fish' },
    { icon: Bird, label: 'Bird' }, { icon: Bug, label: 'Bug' },
    { icon: Gem, label: 'Gem' }, { icon: Coins, label: 'Gold' },
    { icon: Cloud, label: 'Cloud' }, { icon: Sun, label: 'Sun' },
    { icon: Moon, label: 'Moon' }, { icon: Snowflake, label: 'Ice' },
];

// 2. Define Gradient Themes
const THEMES = [
    { id: 'teal', color: '#2dd4bf', start: '#115e59', end: '#134e4a' },
    { id: 'amber', color: '#f59e0b', start: '#b45309', end: '#78350f' },
    { id: 'purple', color: '#a855f7', start: '#7e22ce', end: '#581c87' },
    { id: 'red', color: '#ef4444', start: '#b91c1c', end: '#7f1d1d' },
    { id: 'blue', color: '#3b82f6', start: '#1d4ed8', end: '#1e3a8a' },
    { id: 'indigo', color: '#6366f1', start: '#4338ca', end: '#312e81' },
    { id: 'pink', color: '#ec4899', start: '#be185d', end: '#831843' },
    { id: 'green', color: '#22c55e', start: '#15803d', end: '#14532d' },
    { id: 'slate', color: '#94a3b8', start: '#475569', end: '#0f172a' },
];

// 3. Generate All Combinations
export const GAMING_AVATARS = [];

ICONS.forEach((iconDef) => {
    THEMES.forEach((theme) => {
        GAMING_AVATARS.push({
            id: `${iconDef.label.toLowerCase()}-${theme.id}`,
            label: `${iconDef.label}`,
            icon: iconDef.icon,
            color: theme.color,
            gradient: `from-[${theme.start}] to-[${theme.end}]`, // Note: Tailwind classes strictly need to be safe-listed or we use style prop. 
            // Actually for SVG generation we use the hex codes directly.
        });
    });
});


export const generateAvatarUrl = (avatarId) => {
    // If it's a custom URL (http/https), return it as is
    if (avatarId.startsWith('http')) return avatarId;

    // Otherwise generate from ID
    // We need to re-find the parts because we don't store the full object in DB, just ID.
    // Actually, we can just find in the array.
    const avatar = GAMING_AVATARS.find(a => a.id === avatarId);

    if (!avatar) return '';

    return createSvgDataUrl(avatar);
};

const createSvgDataUrl = (avatar) => {
    const Icon = avatar.icon;

    // Find theme to get gradient colors again (or store them in avatar object better)
    // Optimized: stored in avatar object but let's make sure we have hex for SVG
    const theme = THEMES.find(t => avatar.id.endsWith(t.id));
    const startColor = theme ? theme.start : '#1e293b';
    const endColor = theme ? theme.end : '#0f172a';

    const svgString = renderToStaticMarkup(
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
            <defs>
                <linearGradient id={`grad-${avatar.id}`} x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor={startColor} />
                    <stop offset="100%" stopColor={endColor} />
                </linearGradient>
            </defs>
            <rect width="100" height="100" fill={`url(#grad-${avatar.id})`} />
            <g transform="translate(25, 25) scale(2)">
                <Icon size={25} color={avatar.color} strokeWidth={2} />
            </g>
        </svg>
    );

    return `data:image/svg+xml;base64,${btoa(svgString)}`;
}

// Generate a random avatar ID for new users if needed
export const getRandomAvatarId = () => {
    const randomIndex = Math.floor(Math.random() * GAMING_AVATARS.length);
    return GAMING_AVATARS[randomIndex].id;
}
