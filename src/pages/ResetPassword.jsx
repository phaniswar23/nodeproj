import { useState } from 'react';
import { GameButton } from '@/components/ui/GameButton';
import { GameInput } from '@/components/ui/GameInput';
import { GlassCard } from '@/components/ui/GlassCard';
import { toast } from 'sonner';
import { KeyRound, ShieldQuestion, ArrowRight, CheckCircle2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '@/lib/api';

const ResetPassword = () => {
    const navigate = useNavigate();
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [identifier, setIdentifier] = useState('');
    const [hintData, setHintData] = useState(null);
    const [userAnswer, setUserAnswer] = useState('');

    // Step 1: Find User and Get Hint
    const handleFindUser = async () => {
        if (!identifier) {
            toast.error('Please enter your email or username');
            return;
        }
        setLoading(true);

        try {
            const { data } = await api.post('/auth/forgot-password-init', { identifier });

            if (data.hasHint) {
                setHintData({ question: data.question });
                setStep(2);
            } else {
                // If no hint, maybe go straight to email sent?
                toast.success("Reset link sent to your email");
                navigate('/auth');
            }
        } catch (err) {
            console.error(err);
            toast.error(err.response?.data?.message || 'User not found');
        } finally {
            setLoading(false);
        }
    };

    // Step 2: Verify Hint Answer
    const handleVerifyHint = async () => {
        if (!hintData) return;
        setLoading(true);

        try {
            await api.post('/auth/verify-hint', { identifier, answer: userAnswer });
            toast.success('Security Answer Correct!');
            setStep(3);
        } catch (error) {
            toast.error('Incorrect security answer');
        } finally {
            setLoading(false);
        }
    };

    // Step 3: Trigger Password Reset Email
    const handleResetAction = async () => {
        setLoading(true);

        try {
            await api.post('/auth/send-reset-link', { identifier }); // Re-verify/send
            toast.success("Verification Success! A password reset link has been sent to your email.");
            navigate('/auth');

        } catch (err) {
            console.error(err);
            toast.error('Failed to initiate reset');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4">
            <GlassCard className="max-w-md w-full animate-fade-in relative z-10">
                <div className="text-center mb-6">
                    <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary/20 mb-3">
                        <KeyRound className="w-6 h-6 text-primary" />
                    </div>
                    <h1 className="text-2xl font-heading font-bold">Reset Password</h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        {step === 1 && "Enter your username or email"}
                        {step === 2 && "Answer your security question"}
                        {step === 3 && "Create a new password"}
                    </p>
                </div>

                <div className="space-y-4">
                    {step === 1 && (
                        <div className="space-y-4">
                            <GameInput
                                label="Username / Email"
                                value={identifier}
                                onChange={(e) => setIdentifier(e.target.value)}
                                placeholder="Enter details..."
                            />
                            <GameButton onClick={handleFindUser} glow className="w-full" disabled={loading}>
                                {loading ? 'Searching...' : 'Find Account'}
                            </GameButton>
                        </div>
                    )}

                    {step === 2 && (
                        <div className="space-y-4 animate-in slide-in-from-right">
                            <div className="p-3 bg-secondary/10 rounded-lg border border-secondary/20">
                                <span className="text-xs font-bold text-secondary uppercase tracking-wider block mb-1">Security Question</span>
                                <p className="text-foreground font-medium flex items-center gap-2">
                                    <ShieldQuestion className="w-4 h-4" />
                                    {hintData?.question}
                                </p>
                            </div>

                            <GameInput
                                label="Your Answer"
                                value={userAnswer}
                                onChange={(e) => setUserAnswer(e.target.value)}
                                placeholder="Type your answer here..."
                            />

                            <GameButton onClick={handleVerifyHint} glow className="w-full" disabled={loading}>
                                Verify Answer <ArrowRight className="w-4 h-4 ml-2" />
                            </GameButton>
                        </div>
                    )}

                    {step === 3 && (
                        <div className="space-y-4 animate-in slide-in-from-right">
                            <div className="p-4 bg-primary/10 rounded-lg border border-primary/20 text-center">
                                <CheckCircle2 className="w-8 h-8 text-primary mx-auto mb-2" />
                                <h3 className="font-bold text-lg">Identity Verified</h3>
                                <p className="text-sm text-muted-foreground">
                                    Click below to send a magic reset link to your email.
                                </p>
                            </div>

                            <GameButton onClick={handleResetAction} glow className="w-full" disabled={loading}>
                                {loading ? 'Sending...' : 'Send Reset Link'}
                            </GameButton>
                        </div>
                    )}
                </div>

                <div className="mt-6 text-center">
                    <button onClick={() => navigate('/auth')} className="text-sm text-muted-foreground hover:text-foreground">
                        Back to Login
                    </button>
                </div>
            </GlassCard>
        </div>
    );
};

export default ResetPassword;
