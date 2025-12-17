import AuthForm from '@/components/auth/AuthForm';

const Auth = () => {
    return (
        <div className="min-h-screen w-full flex items-center justify-center bg-background relative overflow-hidden p-4">
            {/* Ambient Background Effects */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/20 via-background to-background pointer-events-none" />

            {/* Animated Floating Shapes */}
            <div className="absolute top-10 left-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl animate-pulse-glow pointer-events-none" />
            <div className="absolute bottom-10 right-10 w-96 h-96 bg-secondary/10 rounded-full blur-3xl animate-pulse-glow delay-1000 pointer-events-none" />

            {/* Grid Overlay for Tech/Gaming Feel */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />

            {/* Centered Content */}
            <div className="relative z-10 w-full flex justify-center">
                <AuthForm />
            </div>
        </div>
    );
};

export default Auth;
