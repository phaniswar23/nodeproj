import { createContext, useEffect, useState, useRef } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

export const SocketContext = createContext(null);

const SOCKET_URL = import.meta.env.VITE_API_URL || '/';

export const SocketProvider = ({ children }) => {
    const [socket, setSocket] = useState(null);
    const [isConnected, setIsConnected] = useState(false);
    const { user } = useAuth();
    const socketRef = useRef(null);

    useEffect(() => {
        // Only connect if user is authenticated
        if (!user) {
            if (socketRef.current) {
                socketRef.current.disconnect();
                socketRef.current = null;
                setSocket(null);
                setIsConnected(false);
            }
            return;
        }

        // If socket already exists and user hasn't changed, do nothing
        if (socketRef.current) {
            // Optional: update query params if needed, but usually better to reconnect
            if (socketRef.current.auth?.userId !== user._id) {
                socketRef.current.disconnect();
            } else {
                return;
            }
        }

        console.log("Initializing Socket Connection...");

        const socketInstance = io(SOCKET_URL, {
            path: '/socket.io',
            query: {
                userId: user._id,
                username: user.username
            },
            reconnection: true,
            reconnectionAttempts: 5,
            reconnectionDelay: 1000
        });

        socketInstance.on('connect', () => {
            console.log('Socket Global Connected:', socketInstance.id);
            setIsConnected(true);
        });

        socketInstance.on('disconnect', () => {
            console.log('Socket Global Disconnected');
            setIsConnected(false);
        });

        socketInstance.on('connect_error', (err) => {
            console.error('Socket Connection Error:', err);
        });

        // GLOBAL LISTENERS (e.g. Invites)
        socketInstance.on('invite_received', (data) => {
            // { from: { username, avatar }, roomId, roomName }
            toast(`Invited to ${data.roomName || 'a game'}`, {
                description: `by ${data.from?.username}`,
                action: {
                    label: 'Join',
                    onClick: () => window.location.href = `/room/${data.roomId}`
                },
                duration: 10000,
            });
        });

        socketRef.current = socketInstance;
        setSocket(socketInstance);

        return () => {
            // We usually DON'T want to disconnect on unmount of Provider (App unmount),
            // but strict mode might trigger this.
            // For now, let's allow it to persist unless user changes.
        };
    }, [user]);

    return (
        <SocketContext.Provider value={{ socket, isConnected }}>
            {children}
        </SocketContext.Provider>
    );
};
