import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { GameButton } from '@/components/ui/GameButton';
import { GameInput } from '@/components/ui/GameInput';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import api from '@/lib/api';
import { Loader2, ArrowRight, CheckCircle2, ShieldQuestion, KeyRound, User, Lock, Eye, EyeOff } from 'lucide-react';

const ForgotPasswordModal = ({ isOpen, onClose }) => {
    const [step, setStep] = useState(1); // 1: Identify, 2: verify, 3: Reset
    const [loading, setLoading] = useState(false);

    // Form State
    const [username, setUsername] = useState(''); // Identifier is now username
    const [securityQuestion, setSecurityQuestion] = useState('');
    const [securityAnswer, setSecurityAnswer] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [resetToken, setResetToken] = useState(null);
    const [showNewPassword, setShowNewPassword] = useState(false);

    // Step 1: Find User
    const [passwordRules, setPasswordRules] = useState({
        hasLength: false,
        hasAlpha: false,
        hasNumber: false,
        hasSpecial: false
    });

    const checkPasswordRules = (pwd) => {
        const rules = {
            hasLength: pwd.length >= 8,
            hasAlpha: /[a-zA-Z]/.test(pwd),
            hasNumber: /[0-9]/.test(pwd),
            hasSpecial: /[^a-zA-Z0-9]/.test(pwd)
        };
        setPasswordRules(rules);
        return Object.values(rules).every(Boolean);
    };

    const handlePasswordChange = (e) => {
        const value = e.target.value;
        setNewPassword(value);
        checkPasswordRules(value);
    };

    const handleIdentify = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            // Updated endpoint to expect username
            const { data } = await api.post('/auth/forgot-password-init', { username });
            if (data.hasHint) {
                setSecurityQuestion(data.question);
                setStep(2);
            } else {
                toast.error("Account security not configured properly.");
            }
        } catch (error) {
            // Generic error message as requested, but also useful feedback
            toast.error("Account not found");
        } finally {
            setLoading(false);
        }
    };

    // Step 2: Verify Answer & Get Token
    const handleVerifyAnswer = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            // Verify answer and get token
            const { data } = await api.post('/auth/verify-hint', { username, answer: securityAnswer });

            if (data.success && data.resetToken) {
                setResetToken(data.resetToken);
                toast.success("Identity Verified");
                setStep(3);
            }
        } catch (error) {
            toast.error("Incorrect answer");
        } finally {
            setLoading(false);
        }
    };

    // Step 3: Reset Password
    const handleResetPassword = async (e) => {
        e.preventDefault();

        if (!checkPasswordRules(newPassword)) return;

        if (newPassword !== confirmPassword) {
            toast.error("Passwords do not match");
            return;
        }

        setLoading(true);
        try {
            await api.post('/auth/update-password', {
                token: resetToken,
                password: newPassword
            });

            toast.success("Password Updated Successfully! Please login.");
            onClose();
        } catch (error) {
            toast.error("Failed to update password. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const resetState = () => {
        setTimeout(() => {
            setStep(1);
            setUsername('');
            setSecurityQuestion('');
            setSecurityAnswer('');
            setNewPassword('');
            setConfirmPassword('');
            setResetToken(null);
            setPasswordRules({
                hasLength: false,
                hasAlpha: false,
                hasNumber: false,
                hasSpecial: false
            });
        }, 300);
    }

    const ChecklistItem = ({ fulfilled, text }) => (
        <div className={`flex items-center space-x-2 text-xs transition-colors duration-200 ${fulfilled ? 'text-green-500' : 'text-muted-foreground'}`}>
            {fulfilled ? <CheckCircle2 className="w-3 h-3" /> : <div className="w-3 h-3 rounded-full border border-current opacity-50" />}
            <span>{text}</span>
        </div>
    );

    return (
        <Dialog open={isOpen} onOpenChange={(open) => { if (!open) resetState(); onClose(); }}>
            <DialogContent className="sm:max-w-md border-primary/20 bg-card/95 backdrop-blur-xl animate-scale-in">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-heading text-center bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary">
                        {step === 1 && "Account Recovery"}
                        {step === 2 && "Security Verification"}
                        {step === 3 && "Secure Reset"}
                    </DialogTitle>
                    <DialogDescription className="text-center">
                        {step === 1 && "Enter your username to begin recovery."}
                        {step === 2 && "Answer your security question to verify identity."}
                        {step === 3 && "Create a new strong password."}
                    </DialogDescription>
                </DialogHeader>

                <div className="py-4">
                    {step === 1 && (
                        <form onSubmit={handleIdentify} className="space-y-4">
                            <GameInput
                                icon={User}
                                placeholder="Username"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                required
                                autoFocus
                            />
                            <GameButton type="submit" className="w-full" disabled={loading} glow>
                                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Locate Account"}
                            </GameButton>
                        </form>
                    )}

                    {step === 2 && (
                        <form onSubmit={handleVerifyAnswer} className="space-y-4 animate-slide-in-right">
                            <div className="bg-muted/50 p-4 rounded-lg border border-border/50">
                                <Label className="text-xs text-muted-foreground uppercase tracking-wider">Security Question</Label>
                                <p className="font-medium text-lg mt-1 flex items-center gap-2">
                                    <ShieldQuestion className="w-5 h-5 text-primary" />
                                    {securityQuestion}
                                </p>
                            </div>
                            <GameInput
                                icon={KeyRound}
                                placeholder="Your Answer"
                                value={securityAnswer}
                                onChange={(e) => setSecurityAnswer(e.target.value)}
                                required
                                autoFocus
                            />
                            <GameButton type="submit" className="w-full" disabled={loading} glow>
                                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Verify Identity"}
                            </GameButton>
                        </form>
                    )}

                    {step === 3 && (
                        <form onSubmit={handleResetPassword} className="space-y-4 animate-slide-in-right">
                            <div className="relative">
                                <GameInput
                                    icon={Lock}
                                    type={showNewPassword ? "text" : "password"}
                                    placeholder="New Password"
                                    value={newPassword}
                                    onChange={handlePasswordChange}
                                    required
                                    autoFocus
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowNewPassword(!showNewPassword)}
                                    className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
                                >
                                    {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>

                            <div className="grid grid-cols-2 gap-2 pl-1 mb-2">
                                <ChecklistItem fulfilled={passwordRules.hasAlpha} text="At least one letter" />
                                <ChecklistItem fulfilled={passwordRules.hasNumber} text="At least one number" />
                                <ChecklistItem fulfilled={passwordRules.hasSpecial} text="One special char" />
                                <ChecklistItem fulfilled={passwordRules.hasLength} text="Min 8 chars" />
                            </div>

                            <GameInput
                                icon={Lock}
                                type="password"
                                placeholder="Confirm New Password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                required
                            />

                            <GameButton
                                type="submit"
                                className="w-full"
                                disabled={loading || !Object.values(passwordRules).every(Boolean) || newPassword !== confirmPassword}
                                glow
                            >
                                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Change Password"}
                            </GameButton>
                        </form>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default ForgotPasswordModal;
