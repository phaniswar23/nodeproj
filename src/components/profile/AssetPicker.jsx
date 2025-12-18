import React, { useState, useMemo } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Upload, Grid, Palette, Image as ImageIcon, Sparkles, Filter, Check } from "lucide-react";
import { cn } from "@/lib/utils";

// --- Mock Data Generators ---
const COLORS = [
    '#7289da', '#5865f2', '#eb459e', '#f47fff', '#ed4245', '#faa61a', '#ffcc00', '#3ba55c', // Discord palette
    '#fd0061', '#9c27b0', '#673ab7', '#3f51b5', '#2196f3', '#03a9f4', '#00bcd4', // Vibrants
    '#795548', '#9e9e9e', '#607d8b', '#000000', '#1e1f22', '#2f3136', '#ffffff', // Neutrals
    '#1abc9c', '#2ecc71', '#3498db', '#9b59b6', '#34495e', '#16a085', '#27ae60', '#2980b9', '#8e44ad', '#2c3e50', // Flat UI
    '#f1c40f', '#e67e22', '#e74c3c', '#ecf0f1', '#95a5a6', '#f39c12', '#d35400', '#c0392b', '#bdc3c7', '#7f8c8d'
];

// Expanded Categories with Gaming themes
const AVATAR_Categories = ['Gamer', 'Esports', 'Abstract', 'Cyber', 'Retro', 'Bot'];
const AVATAR_PRESETS = AVATAR_Categories.flatMap((cat, i) =>
    Array.from({ length: 40 }).map((_, j) => ({
        id: `av-${cat}-${j}`,
        category: cat,
        url: `https://api.dicebear.com/7.x/${cat === 'Gamer' || cat === 'Cyber' || cat === 'Bot' ? 'bottts' : // Robots for Gamer/Cyber
            cat === 'Esports' || cat === 'Abstract' ? 'identicon' : // Abstract shapes for Esports/Team Logos
                cat === 'Retro' ? 'pixel-art' : // 8-bit for Retro
                    'avataaars' // Fallback (shouldn't be hit with current categories)
            }/svg?seed=av-${cat}-${j}`
    }))
);

// Expanded Banners (250+ simulated via gradients/patterns)
const BANNER_PRESETS = Array.from({ length: 250 }).map((_, i) => {
    const hue = (i * 137.5) % 360; // Golden angle for distribution
    return {
        id: `banner-${i}`,
        type: 'gradient',
        title: `Neon Flow ${i + 1}`,
        value: `linear-gradient(${45 + (i * 5) % 360}deg, hsl(${hue}, 70%, 50%), hsl(${(hue + 60) % 360}, 80%, 40%))`
    };
});

const AssetPicker = ({ type = 'avatar', onSelect }) => {
    const isBanner = type === 'banner';
    // Default tab based on type
    const [selectedTab, setSelectedTab] = useState(isBanner ? 'color' : 'presets');
    const [selectedCategory, setSelectedCategory] = useState('All');
    const [visibleCount, setVisibleCount] = useState(40);

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            // Basic Validation (5MB)
            if (file.size > 5 * 1024 * 1024) {
                alert("File size exceeds 5MB limit.");
                e.target.value = null;
                return;
            }

            const reader = new FileReader();
            reader.onloadend = () => {
                // Avatar Upload
                const result = reader.result;
                console.log("AssetPicker: File read complete", result ? "Data URL generated" : "Failed");
                onSelect(result);
            };
            reader.readAsDataURL(file);
        }
        // Reset input to allow re-selecting the same file if needed
        e.target.value = null;
    };

    const filteredAvatars = useMemo(() => {
        if (selectedCategory === 'All') return AVATAR_PRESETS;
        return AVATAR_PRESETS.filter(p => p.category === selectedCategory);
    }, [selectedCategory]);

    // Reset pagination when category changes
    React.useEffect(() => {
        setVisibleCount(40);
    }, [selectedCategory]);

    return (
        <div className="w-full h-full bg-[#1e1f22] flex flex-col rounded-xl overflow-hidden border border-white/5">
            <Tabs value={selectedTab} className="w-full flex-1 flex flex-col" onValueChange={setSelectedTab}>
                <div className="px-4 pt-4 pb-2 border-b border-white/5 bg-[#2b2d31]">
                    <TabsList className="bg-[#111214] p-1 w-full justify-start gap-2 h-auto text-[#b9bbbe]">
                        {!isBanner && (
                            <>
                                <TabsTrigger value="presets" className="data-[state=active]:bg-[#40444b] data-[state=active]:text-white px-3 py-1.5 h-8 text-xs font-medium flex-1 sm:flex-none">
                                    <Grid className="w-3 h-3 mr-2" />
                                    Avatars
                                </TabsTrigger>
                                <TabsTrigger value="upload" className="data-[state=active]:bg-[#40444b] data-[state=active]:text-white px-3 py-1.5 h-8 text-xs font-medium flex-1 sm:flex-none">
                                    <Upload className="w-3 h-3 mr-2" />
                                    Upload
                                </TabsTrigger>
                            </>
                        )}
                        {isBanner && (
                            <TabsTrigger value="color" className="data-[state=active]:bg-[#40444b] data-[state=active]:text-white px-3 py-1.5 h-8 text-xs font-medium flex-1 sm:flex-none w-full">
                                <Palette className="w-3 h-3 mr-2" />
                                Solid Colors
                            </TabsTrigger>
                        )}
                    </TabsList>

                    {/* Filter Chips for Avatar Presets */}
                    {!isBanner && selectedTab === 'presets' && (
                        <div className="flex gap-2 overflow-x-auto custom-scrollbar pt-3 pb-1">
                            <button
                                onClick={() => setSelectedCategory('All')}
                                className={cn("px-3 py-1 rounded-full text-[10px] font-bold uppercase whitespace-nowrap transition-colors", selectedCategory === 'All' ? "bg-[#5865f2] text-white" : "bg-[#111214] text-gray-400 hover:text-white")}
                            >
                                All
                            </button>
                            {AVATAR_Categories.map(cat => (
                                <button
                                    key={cat}
                                    onClick={() => setSelectedCategory(cat)}
                                    className={cn("px-3 py-1 rounded-full text-[10px] font-bold uppercase whitespace-nowrap transition-colors", selectedCategory === cat ? "bg-[#5865f2] text-white" : "bg-[#111214] text-gray-400 hover:text-white")}
                                >
                                    {cat}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                <div className="flex-1 overflow-hidden bg-[#313338] relative flex flex-col">

                    {/* PRESETS TAB */}
                    <TabsContent value="presets" className="flex-1 mt-4 relative px-4 pb-4">
                        <div
                            className="h-[450px] overflow-y-auto custom-scrollbar p-4 bg-[#111214]/50 border border-white/10 rounded-xl shadow-inner scroll-smooth"
                            onScroll={(e) => {
                                const { scrollTop, scrollHeight, clientHeight } = e.target;
                                if (scrollHeight - scrollTop <= clientHeight + 100) {
                                    if (visibleCount < filteredAvatars.length) {
                                        setVisibleCount(prev => Math.min(prev + 40, filteredAvatars.length));
                                    }
                                }
                            }}
                        >
                            <div className={cn("grid gap-3", isBanner ? "grid-cols-2 sm:grid-cols-3" : "grid-cols-4 sm:grid-cols-5")}>
                                {isBanner ? (
                                    BANNER_PRESETS.slice(0, visibleCount).map((item) => (
                                        <button
                                            key={item.id}
                                            onClick={() => {
                                                console.log("AssetPicker: Selected Banner Preset", item);
                                                onSelect({ type: 'preset', value: item.value });
                                            }}
                                            className="aspect-video w-full rounded-lg overflow-hidden ring-2 ring-transparent hover:ring-white transition-all focus:outline-none focus:ring-[#5865F2] shadow-sm group relative"
                                            style={{ background: item.value }}
                                        >
                                            <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                                                <Sparkles className="w-4 h-4 text-white drop-shadow-md" />
                                            </div>
                                        </button>
                                    ))
                                ) : (
                                    filteredAvatars.slice(0, visibleCount).map((item) => (
                                        <button
                                            key={item.id}
                                            onClick={() => {
                                                console.log("AssetPicker: Selected Avatar Preset", item.id);
                                                onSelect(item.id);
                                            }}
                                            className="aspect-square w-full rounded-xl bg-[#202225] overflow-hidden ring-2 ring-transparent hover:ring-white transition-all focus:outline-none focus:ring-[#5865F2] flex items-center justify-center relative group cursor-pointer"
                                        >
                                            <img src={item.url} alt="Preset" className="w-full h-full object-cover pointer-events-none transition-transform duration-500 group-hover:scale-110" loading="lazy" />

                                            {/* Hover Overlay */}
                                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                                                <div className="bg-white/10 p-1.5 rounded-full backdrop-blur-md">
                                                    <Check className="w-4 h-4 text-white" />
                                                </div>
                                            </div>
                                        </button>
                                    ))
                                )}
                            </div>

                            {/* Load More Trigger / Loading State */}
                            {visibleCount < filteredAvatars.length && (
                                <div className="py-8 text-center">
                                    <button
                                        onClick={() => setVisibleCount(prev => Math.min(prev + 40, filteredAvatars.length))}
                                        className="text-xs font-bold text-gray-500 uppercase tracking-widest hover:text-white transition-colors"
                                    >
                                        Load More
                                    </button>
                                </div>
                            )}
                        </div>
                    </TabsContent>

                    {/* COLOR TAB */}
                    <TabsContent value="color" className="flex-1 h-full m-0 p-0 overflow-y-auto custom-scrollbar">
                        <div className="p-6">
                            <h3 className="text-xs font-bold text-muted-foreground uppercase mb-4 tracking-wider">Solid Colors</h3>
                            <div className="grid grid-cols-6 sm:grid-cols-8 gap-4">
                                {COLORS.map((color) => (
                                    <button
                                        key={color}
                                        onClick={() => {
                                            console.log("AssetPicker: Selected Color", color);
                                            if (isBanner) onSelect({ type: 'color', value: color });
                                        }}
                                        className="aspect-square rounded-full border border-white/10 ring-2 ring-transparent hover:scale-110 active:scale-95 transition-all shadow-md cursor-pointer"
                                        style={{ backgroundColor: color }}
                                        aria-label={`Select color ${color}`}
                                    />
                                ))}
                            </div>
                            <div className="mt-8 pt-6 border-t border-white/5">
                                <h3 className="text-xs font-bold text-muted-foreground uppercase mb-4 tracking-wider">Custom Hex</h3>
                                <div className="flex gap-4 items-center">
                                    <div className="w-12 h-12 rounded-lg border border-white/20 shadow-inner" style={{ backgroundColor: '#000' }} />
                                    <div className="flex-1">
                                        <input
                                            type="text"
                                            placeholder="#RRGGBB"
                                            className="w-full bg-[#1e1f22] border border-[#1e1f22] focus:border-[#5865F2] text-white text-sm rounded-lg px-4 py-3 outline-none transition-colors font-mono"
                                            onChange={(e) => {
                                                if (/^#[0-9A-F]{6}$/i.test(e.target.value)) {
                                                    const val = e.target.value;
                                                    console.log("AssetPicker: Selected Hex", val);
                                                    if (isBanner) {
                                                        onSelect({ type: 'color', value: val });
                                                    }
                                                }
                                            }}
                                        />
                                        <p className="text-[10px] text-gray-500 mt-2">Enter a valid hex code (e.g. #FF5733)</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </TabsContent>

                    {/* UPLOAD TAB */}
                    <TabsContent value="upload" className="flex-1 h-full m-0 p-0 overflow-y-auto custom-scrollbar flex items-center justify-center">
                        <div className="text-center p-10 border-2 border-dashed border-[#40444b] rounded-2xl hover:bg-[#40444b]/10 hover:border-[#5865F2]/50 transition-all cursor-pointer relative group max-w-xs mx-auto">
                            <input
                                type="file"
                                accept="image/*"
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-50"
                                onChange={handleFileChange}
                            />
                            <div className="w-20 h-20 bg-[#40444b]/30 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:bg-[#5865F2] group-hover:text-white transition-colors duration-300">
                                <Upload className="w-8 h-8 text-gray-400 group-hover:text-white" />
                            </div>
                            <h3 className="text-white font-bold text-lg mb-2">Upload Image</h3>
                            <p className="text-xs text-gray-400 leading-relaxed">
                                Support for JPG, PNG, GIF<br />Max size 5MB
                            </p>
                        </div>
                    </TabsContent>
                </div>
            </Tabs>
        </div>
    );
};

export default AssetPicker;
