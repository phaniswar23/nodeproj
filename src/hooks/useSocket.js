import { useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './useAuth';

const SOCKET_URL = import.meta.env.VITE_API_URL || '/'; // Proxy handles forwarding to backend in dev

export const useSocket = () => {
    const [socket, setSocket] = useState(null);
    const { user } = useAuth();

    useEffect(() => {
        const socketInstance = io(SOCKET_URL, {
            path: '/socket.io',
            query: {
                userId: user?._id || user?.id
            }
        });
        socketInstance.on('connect', () => {
            console.log('Socket connected:', socketInstance.id);
        });
        setSocket(socketInstance);
        return () => {
            socketInstance.disconnect();
        };
    }, [user]); // Re-connect if user changes

    return socket;
};
