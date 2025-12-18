import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// --- Generators ---
const AVATAR_Categories = ['Abstract', 'Cyber', 'Anime', 'Minimal'];
const AVATAR_STYLES = {
    'Abstract': 'shapeshifters',
    'Cyber': 'bottts',
    'Anime': 'avataaars', // Close enough for now, DiceBear generic
    'Minimal': 'identicon'
};

const generateAvatars = () => {
    let avatars = [];
    let count = 0;

    // Generate ~50 per category -> 200 total
    Object.entries(AVATAR_STYLES).forEach(([category, style]) => {
        for (let i = 0; i < 50; i++) {
            avatars.push({
                id: `av-${category.toLowerCase()}-${i}`,
                category: category,
                // Using DiceBear API for production-ready SVG URLs
                url: `https://api.dicebear.com/7.x/${style}/svg?seed=${category}-${i}-${Math.random().toString(36).substring(7)}`,
                // In a real scenario with local files, this would be `/assets/avatars/${category}/${i}.png`
            });
            count++;
        }
    });
    return avatars;
};

const generateBanners = () => {
    let banners = [];
    // 220 Banners
    // Strategy: Gradients (Cyber, Neon, Dark, Pastel flavors)

    for (let i = 0; i < 220; i++) {
        const hue1 = Math.floor(i * 1.6) % 360;
        const hue2 = (hue1 + 60) % 360;
        const css = `linear-gradient(${135 + (i % 8) * 45}deg, hsl(${hue1}, 70%, 50%), hsl(${hue2}, 70%, 50%))`;

        let category = 'Cyber';
        if (i > 150) category = 'Minimal';
        else if (i > 100) category = 'Dark';
        else if (i > 50) category = 'Neon';

        banners.push({
            id: `bn-${i}`,
            category: category,
            type: 'gradient',
            value: css,
            thumbnail: css // For gradients, thumbnail is the same CSS
        });
    }
    return banners;
};

const ASSETS = {
    avatars: generateAvatars(),
    banners: generateBanners()
};

// --- Write to File ---
const outputPath = path.resolve(__dirname, '../src/data/assets.json');
// Ensure directory exists
const dir = path.dirname(outputPath);
if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
}

fs.writeFileSync(outputPath, JSON.stringify(ASSETS, null, 2));

console.log(`✅ Successfully generated ${ASSETS.avatars.length} Avatars and ${ASSETS.banners.length} Banners.`);
console.log(`📂 Saved to: ${outputPath}`);
