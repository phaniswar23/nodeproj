export const getAvatarUrl = (userOrProfile) => {
    if (!userOrProfile) return '';

    // Handle nested profile structure (api/users/:id/profile returns object with profile prop)
    const profileData = userOrProfile.profile || {};
    const rootAvatarUrl = userOrProfile.avatar_url;

    // Priority 1: avatarId (The source of truth for presets)
    const avatarId = profileData.avatarId;

    if (avatarId) {
        // Custom Uploads
        if (avatarId.startsWith('http') || avatarId.startsWith('data:')) {
            return avatarId;
        }

        // DiceBear Presets Logic (Must match Backend & AssetPicker)
        let style = 'avataaars';
        if (avatarId.includes('Gamer') || avatarId.includes('Cyber') || avatarId.includes('Bot')) style = 'bottts';
        else if (avatarId.includes('Esports') || avatarId.includes('Abstract') || avatarId.includes('Minimal')) style = 'identicon';
        else if (avatarId.includes('Retro') || avatarId.includes('Pixel')) style = 'pixel-art';

        return `https://api.dicebear.com/7.x/${style}/svg?seed=${avatarId}`;
    }

    // Priority 2: root avatar_url (Legacy / Fallback)
    if (rootAvatarUrl) return rootAvatarUrl;

    // Fallback Default
    return `https://api.dicebear.com/7.x/avataaars/svg?seed=${userOrProfile.username || 'default'}`;
};
