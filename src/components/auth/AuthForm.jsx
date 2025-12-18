import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { GameButton } from '@/components/ui/GameButton';
import { GameInput } from '@/components/ui/GameInput';
import { GlassCard } from '@/components/ui/GlassCard';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { toast } from 'sonner';
import { Link, useNavigate } from 'react-router-dom';
import { Lock, User, ArrowRight, Eye, EyeOff, ShieldQuestion, KeyRound, CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import ForgotPasswordModal from './ForgotPasswordModal';
import api from '@/lib/api';
import { z } from 'zod';


const SECURITY_QUESTIONS = [
    "What was the name of your first pet?",
    "What is your mother's maiden name?",
    "What was the make of your first car?",
    "What city were you born in?",
    "What is the name of your favorite teacher?",
];


const letterContainerVariants = {
    hidden: { opacity: 0 },
    show: {
        opacity: 1,
        transition: {
            staggerChildren: 0.03,
            delayChildren: 0.1
        }
    }
};

const letterVariants = {
    hidden: { opacity: 0, y: 10 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 200 } }
};

const AuthForm = ({ isLogin, onToggle }) => {
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [isForgotPasswordOpen, setIsForgotPasswordOpen] = useState(false);

    // Form Data
    const [formData, setFormData] = useState({
        username: '',
        password: '',
        confirmPassword: '',
        full_name: '',
        hintQuestion: '',
        hintAnswer: ''
    });

    // Username Availability State
    const [isCheckingUsername, setIsCheckingUsername] = useState(false);
    const [usernameAvailable, setUsernameAvailable] = useState(null); // null, true, false

    // Validation State
    const [errors, setErrors] = useState({});
    const [passwordStrength, setPasswordStrength] = useState(0);

    const { signIn, signUp } = useAuth();
    const navigate = useNavigate();

    // Debounce Username Check
    useEffect(() => {
        if (isLogin || !formData.username || formData.username.length < 3) {
            setUsernameAvailable(null);
            return;
        }

        const checkUsername = async () => {
            setIsCheckingUsername(true);
            try {
                const response = await api.post('/auth/check-username', { username: formData.username });
                setUsernameAvailable(response.data.available);
            } catch (error) {
                console.error("Username check failed", error);
                setUsernameAvailable(null);
            } finally {
                setIsCheckingUsername(false);
            }
        };

        const timer = setTimeout(checkUsername, 500);

        return () => clearTimeout(timer);
    }, [formData.username, isLogin]);


    // Password Rules State
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

    // Password Strength Meter & Rules Check
    useEffect(() => {
        if (!formData.password) {
            setPasswordStrength(0);
            setPasswordRules({
                hasLength: false,
                hasAlpha: false,
                hasNumber: false,
                hasSpecial: false
            });
            return;
        }

        checkPasswordRules(formData.password);

        let strength = 0;
        if (formData.password.length >= 8) strength += 25;
        if (/[A-Z]/.test(formData.password)) strength += 25;
        if (/[0-9]/.test(formData.password)) strength += 25;
        if (/[^A-Za-z0-9]/.test(formData.password)) strength += 25;
        setPasswordStrength(strength);
    }, [formData.password]);

    const validateForm = () => {
        const newErrors = {};

        if (!formData.username.trim()) newErrors.username = "Username is required";
        if (!isLogin && usernameAvailable === false) newErrors.username = "Username is already taken";

        if (!formData.password) newErrors.password = "Password is required";

        if (!isLogin) {
            if (!formData.full_name.trim()) newErrors.full_name = "Full Name is required";
            if (!checkPasswordRules(formData.password)) newErrors.password = "Password does not meet requirements";
            if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = "Passwords do not match";
            if (!formData.hintQuestion) newErrors.hintQuestion = "Security question required";
            if (!formData.hintAnswer.trim()) newErrors.hintAnswer = "Security answer required";
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validateForm()) return;

        setLoading(true);
        try {
            const { error } = isLogin
                ? await signIn({ username: formData.username, password: formData.password })
                : await signUp({
                    username: formData.username,
                    password: formData.password,
                    fullName: formData.full_name,
                    hintQuestion: formData.hintQuestion,
                    hintAnswer: formData.hintAnswer
                });

            if (error) {
                toast.error(error);
            } else {
                toast.success(isLogin ? 'Welcome back! 👋' : 'Account created! 🎉');
                navigate('/');
            }
        } catch (error) {
            toast.error('An unexpected error occurred');
        } finally {
            setLoading(false);
        }
    };

    const getStrengthColor = () => {
        if (passwordStrength <= 25) return "bg-destructive";
        if (passwordStrength <= 50) return "bg-orange-500";
        if (passwordStrength <= 75) return "bg-yellow-500";
        return "bg-success";
    };

    const ChecklistItem = ({ fulfilled, text }) => (
        <div className={`flex items-center space-x-2 text-xs transition-colors duration-200 ${fulfilled ? 'text-green-500' : 'text-muted-foreground'}`}>
            {fulfilled ? <CheckCircle2 className="w-3 h-3" /> : <div className="w-3 h-3 rounded-full border border-current opacity-50" />}
            <span>{text}</span>
        </div>
    );

    const clearError = (field) => {
        if (errors[field]) {
            setErrors(prev => ({ ...prev, [field]: null }));
        }
    };

    const isFormValid = () => {
        if (!formData.username?.trim()) return false;
        if (!formData.password) return false;

        if (!isLogin) {
            if (!formData.full_name?.trim()) return false;
            if (!Object.values(passwordRules).every(Boolean)) return false;
            if (formData.password !== formData.confirmPassword) return false;
            if (!formData.hintQuestion) return false;
            if (!formData.hintAnswer?.trim()) return false;
            if (usernameAvailable === false) return false;
        }
        return true;
    };

    const handleSwitchMode = () => {
        setErrors({});
        setFormData({ ...formData, username: '', password: '', confirmPassword: '' });
        setUsernameAvailable(null);
        onToggle();
    };

    return (
        <div className="w-full max-w-md">
            <GlassCard className="p-8 bg-card/60 backdrop-blur-lg shadow-2xl will-change-transform">
                <div className="text-center mb-6">
                    <motion.h2
                        variants={letterContainerVariants}
                        initial="hidden"
                        animate="show"
                        className="text-3xl font-heading font-bold mb-2 bg-clip-text text-transparent bg-gradient-to-r from-primary via-accent to-secondary animate-pulse-glow flex justify-center"
                    >
                        {(isLogin ? 'Welcome Back' : 'Create Your Profile').split("").map((char, i) => (
                            <motion.span key={i} variants={letterVariants}>
                                {char === " " ? "\u00A0" : char}
                            </motion.span>
                        ))}
                    </motion.h2>
                    <motion.p
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="text-muted-foreground text-sm tracking-wide"
                    >
                        {isLogin ? 'Enter credentials to access the network' : 'Register your identity'}
                    </motion.p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {!isLogin && (
                        <div className="space-y-4 animate-accordion-down">
                            <GameInput
                                icon={User}
                                placeholder="Full Name"
                                value={formData.full_name}
                                onChange={(e) => {
                                    setFormData({ ...formData, full_name: e.target.value });
                                    clearError('full_name');
                                }}
                                error={errors.full_name}
                            />
                        </div>
                    )}

                    <div className="relative">
                        <GameInput
                            icon={User}
                            placeholder="Username"
                            value={formData.username}
                            onChange={(e) => {
                                setFormData({ ...formData, username: e.target.value });
                                clearError('username');
                            }}
                            error={errors.username}
                            autoComplete="username"
                        />
                        {!isLogin && formData.username.length >= 3 && (
                            <div className="absolute right-3 top-3 transition-all duration-300">
                                {isCheckingUsername ? (
                                    <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                                ) : usernameAvailable === true ? (
                                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                                ) : usernameAvailable === false ? (
                                    <XCircle className="w-4 h-4 text-destructive" />
                                ) : null}
                            </div>
                        )}
                    </div>

                    <div className="relative">
                        <GameInput
                            icon={Lock}
                            type={showPassword ? "text" : "password"}
                            placeholder="Password"
                            value={formData.password}
                            onChange={(e) => {
                                setFormData({ ...formData, password: e.target.value });
                                clearError('password');
                            }}
                            error={errors.password}
                            autoComplete={isLogin ? "current-password" : "new-password"}
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-3 text-muted-foreground hover:text-foreground transition-colors"
                            tabIndex={-1}
                        >
                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                    </div>

                    {!isLogin && (
                        <div className="space-y-4 animate-accordion-down">
                            {/* Password Strength Meter */}
                            <div className="space-y-1">
                                <div className="flex justify-between text-xs text-muted-foreground">
                                    <span>Strength</span>
                                    <span>{passwordStrength}%</span>
                                </div>
                                <div className="h-1.5 w-full bg-secondary/20 rounded-full overflow-hidden">
                                    <div
                                        className={`h-full transition-all duration-500 ease-out ${getStrengthColor()}`}
                                        style={{ width: `${passwordStrength}%` }}
                                    />
                                </div>
                            </div>

                            {/* Password Checklist */}
                            <div className="grid grid-cols-2 gap-2 pl-1">
                                <ChecklistItem fulfilled={passwordRules.hasAlpha} text="At least one letter" />
                                <ChecklistItem fulfilled={passwordRules.hasNumber} text="At least one number" />
                                <ChecklistItem fulfilled={passwordRules.hasSpecial} text="One special char" />
                                <ChecklistItem fulfilled={passwordRules.hasLength} text="Min 8 chars" />
                            </div>

                            <div className="relative">
                                <GameInput
                                    icon={Lock}
                                    type={showConfirmPassword ? "text" : "password"}
                                    placeholder="Confirm Password"
                                    value={formData.confirmPassword}
                                    onChange={(e) => {
                                        setFormData({ ...formData, confirmPassword: e.target.value });
                                        clearError('confirmPassword');
                                    }}
                                    error={errors.confirmPassword}
                                    autoComplete="new-password"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    className="absolute right-3 top-3 text-muted-foreground hover:text-foreground transition-colors"
                                    tabIndex={-1}
                                >
                                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                            {!isLogin && formData.confirmPassword && formData.password !== formData.confirmPassword && (
                                <p className="text-xs text-destructive ml-1 animate-slide-up">Passwords do not match</p>
                            )}

                            <div className="space-y-2">
                                <Select
                                    value={formData.hintQuestion}
                                    onValueChange={(value) => {
                                        setFormData({ ...formData, hintQuestion: value });
                                        clearError('hintQuestion');
                                    }}
                                >
                                    <SelectTrigger className="glass-card border-input">
                                        <div className="flex items-center gap-2 text-muted-foreground">
                                            <ShieldQuestion className="w-4 h-4" />
                                            <SelectValue placeholder="Select Security Question" />
                                        </div>
                                    </SelectTrigger>
                                    <SelectContent>
                                        {SECURITY_QUESTIONS.map((q) => (
                                            <SelectItem key={q} value={q}>{q}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {errors.hintQuestion && <p className="text-xs text-destructive ml-1">{errors.hintQuestion}</p>}
                            </div>

                            <GameInput
                                icon={KeyRound}
                                placeholder="Security Answer"
                                value={formData.hintAnswer}
                                onChange={(e) => {
                                    setFormData({ ...formData, hintAnswer: e.target.value });
                                    clearError('hintAnswer');
                                }}
                                error={errors.hintAnswer}
                            />
                        </div>
                    )}

                    <GameButton
                        as={motion.button}
                        whileTap={{ scale: 0.95 }}
                        className="w-full mt-6"
                        type="submit"
                        disabled={loading || !isFormValid()}
                        glow
                        size="lg"
                    >
                        {loading ? 'Processing...' : (isLogin ? 'Access System' : 'Initialize Profile')}
                        {!loading && <ArrowRight className="w-4 h-4 ml-2" />}
                    </GameButton>
                </form>

                <div className="mt-6 flex flex-col items-center gap-4 text-sm">
                    {isLogin && (
                        <button
                            onClick={() => setIsForgotPasswordOpen(true)}
                            className="text-muted-foreground hover:text-primary transition-all hover:underline"
                        >
                            Forgot Credentials?
                        </button>
                    )}

                    <div className="text-muted-foreground">
                        {isLogin ? "New user? " : "Existing access? "}
                        <button
                            onClick={handleSwitchMode}
                            className="text-primary font-bold hover:text-accent transition-colors uppercase tracking-wider"
                        >
                            {isLogin ? 'Initialize' : 'Log In'}
                        </button>
                    </div>
                </div>
            </GlassCard>

            <ForgotPasswordModal
                isOpen={isForgotPasswordOpen}
                onClose={() => setIsForgotPasswordOpen(false)}
            />
        </div>
    );
};

export default AuthForm;
