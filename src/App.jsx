import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "@/components/theme/ThemeProvider";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { SettingsProvider } from "@/context/SettingsContext";
import { SettingsModal } from "@/components/settings/SettingsModal";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import { SocketProvider } from "@/context/SocketProvider";
import Home from "./pages/Home";
import Auth from "./pages/Auth";
import Profile from "./pages/Profile";
import Friends from "./pages/Friends";
import Room from "./pages/Room";
import Game from "./pages/Game";
import Notifications from "./pages/Notifications";
import ResetPassword from "./pages/ResetPassword";
import TestConnection from "./pages/TestConnection";
import UpdatePassword from "./pages/UpdatePassword";
import NotFound from "./pages/NotFound";
import Settings from "./pages/Settings";
import EditProfile from "./pages/EditProfile";
import { Analytics } from "@vercel/analytics/react";


const queryClient = new QueryClient();

const ProtectedRoute = ({ children }) => {
    const { user, loading } = useAuth();

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    if (!user) {
        return <Navigate to="/auth" replace />;
    }

    return <>{children}</>;
};

const PublicRoute = ({ children }) => {
    const { user, loading } = useAuth();

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    if (user) {
        return <Navigate to="/" replace />;
    }

    return <>{children}</>;
};

const AppRoutes = () => (
    <Routes>
        <Route path="/auth" element={<PublicRoute><Auth /></PublicRoute>} />
        <Route path="/" element={<ProtectedRoute><Home /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
        <Route path="/profile/edit" element={<ProtectedRoute><EditProfile /></ProtectedRoute>} />
        <Route path="/profile/:userId" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
        <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
        <Route path="/friends" element={<ProtectedRoute><Friends /></ProtectedRoute>} />
        <Route path="/room/:roomId" element={<ProtectedRoute><Room /></ProtectedRoute>} />
        <Route path="/game/:roomId" element={<ProtectedRoute><Game /></ProtectedRoute>} />
        <Route path="/notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />
        <Route path="/test-connection" element={<TestConnection />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/update-password" element={<UpdatePassword />} />
        <Route path="*" element={<NotFound />} />
    </Routes>
);

const App = () => (
    <QueryClientProvider client={queryClient}>
        <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
            <AuthProvider>
                <SocketProvider>
                    <TooltipProvider>
                        <SettingsProvider>
                            <Toaster />
                            <Sonner
                                toastOptions={{
                                    classNames: {
                                        title: 'text-lg font-bold font-heading',
                                        description: 'text-base font-body',
                                        toast: 'border-border bg-card/90 backdrop-blur-xl'
                                    }
                                }}
                            />
                            <BrowserRouter>
                                <AppRoutes />
                                <SettingsModal />
                                <Analytics />
                            </BrowserRouter>
                        </SettingsProvider>
                    </TooltipProvider>
                </SocketProvider>
            </AuthProvider>
        </ThemeProvider>
    </QueryClientProvider>
);

export default App;
