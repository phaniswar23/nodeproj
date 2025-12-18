import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import AuthForm from '@/components/auth/AuthForm';
import ElectricBorder from '@/components/ui/ElectricBorder';

const Auth = () => {
    const [isLogin, setIsLogin] = useState(true);

    return (
        <div className="min-h-screen w-full flex items-center justify-center bg-background relative overflow-hidden p-4">
            {/* Ambient Background Effects */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/20 via-background to-background pointer-events-none" />

            {/* Animated Floating Shapes */}
            <div className="absolute top-10 left-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl animate-pulse-glow pointer-events-none" />
            <div className="absolute bottom-10 right-10 w-96 h-96 bg-secondary/10 rounded-full blur-3xl animate-pulse-glow delay-1000 pointer-events-none" />

            {/* Grid Overlay with Parallax - Shifts based on mode */}
            <motion.div
                className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none"
                animate={{
                    x: isLogin ? 0 : -20,
                    y: isLogin ? 0 : -20,
                    filter: "blur(0px)" // Reset blur
                }}
                transition={{ duration: 0.7, ease: "easeInOut" }}
            />

            {/* Centered Content */}
            <div className="relative z-10 w-full flex justify-center">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={isLogin ? 'login' : 'signup'}
                        initial={{ opacity: 0, x: isLogin ? -20 : 20, scale: 0.98 }}
                        animate={{ opacity: 1, x: 0, scale: 1 }}
                        exit={{ opacity: 0, x: isLogin ? 20 : -20, scale: 0.98 }}
                        transition={{ duration: 0.2, ease: "easeOut" }}
                        className="w-full max-w-md"
                    >
                        <ElectricBorder
                            color={isLogin ? "#7df9ff" : "#5227FF"}
                            speed={isLogin ? 1 : 2}
                            chaos={0.3}
                            thickness={2}
                            style={{ borderRadius: 16 }}
                        >
                            <AuthForm isLogin={isLogin} onToggle={() => setIsLogin(!isLogin)} />
                        </ElectricBorder>
                    </motion.div>
                </AnimatePresence>
            </div>
        </div>
    );
};

export default Auth;
