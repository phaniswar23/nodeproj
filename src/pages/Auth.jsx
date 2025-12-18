import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import AuthForm from '@/components/auth/AuthForm';


const Auth = () => {
    const [isLogin, setIsLogin] = useState(true);

    return (
        <div className="min-h-screen w-full flex items-center justify-center bg-background relative overflow-hidden p-4">
            {/* Ambient Background Effects - Simplified */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/10 via-background to-background pointer-events-none" />

            {/* Static Grid Overlay */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none opacity-50" />

            {/* Centered Content */}
            <div className="relative z-10 w-full flex justify-center">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={isLogin ? 'login' : 'signup'}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.3 }}
                        className="w-full max-w-md"
                    >
                        <AuthForm isLogin={isLogin} onToggle={() => setIsLogin(!isLogin)} />
                    </motion.div>
                </AnimatePresence>
            </div>
        </div>
    );
};

export default Auth;
