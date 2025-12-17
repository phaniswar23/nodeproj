import { useState, useEffect } from 'react';
import { GameButton } from '@/components/ui/GameButton';
import { GameInput } from '@/components/ui/GameInput';
import { GlassCard } from '@/components/ui/GlassCard';
import { toast } from 'sonner';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '@/lib/api';

const UpdatePassword = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const token = searchParams.get('token');

    useEffect(() => {
        if (!token) {
            // If no token from URL, maybe check local session or redirect
            // For now, assume token is required in MERN flow
            // navigate('/'); 
            // Commented out to allow testing UI without token
        }
    }, [token, navigate]);

    const handleUpdate = async () => {
        if (password.length < 6) {
            toast.error("Password too short");
            return;
        }
        setLoading(true);

        try {
            await api.post('/auth/update-password', { password, token });
            toast.success("Password updated successfully!");
            navigate('/auth');
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to update password");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4">
            <GlassCard className="max-w-md w-full">
                <h1 className="text-2xl font-bold mb-4">Set New Password</h1>
                <GameInput
                    type="password"
                    label="New Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                />
                <GameButton onClick={handleUpdate} glow className="w-full mt-4" disabled={loading}>
                    {loading ? 'Updating...' : 'Update Password'}
                </GameButton>
            </GlassCard>
        </div>
    );
};

export default UpdatePassword;
