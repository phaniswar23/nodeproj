import { createContext, useContext, useState, useCallback, useEffect } from 'react';

const SettingsContext = createContext({
    isOpen: false,
    openSettings: () => { },
    closeSettings: () => { },
});

export const SettingsProvider = ({ children }) => {
    const [isOpen, setIsOpen] = useState(false);

    // Prevent scrolling when modal is open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);

    // Handle ESC key
    useEffect(() => {
        const handleEsc = (e) => {
            if (e.key === 'Escape' && isOpen) {
                setIsOpen(false);
            }
        };
        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [isOpen]);

    const openSettings = useCallback(() => setIsOpen(true), []);
    const closeSettings = useCallback(() => setIsOpen(false), []);

    return (
        <SettingsContext.Provider value={{ isOpen, openSettings, closeSettings }}>
            {children}
        </SettingsContext.Provider>
    );
};

export const useSettings = () => useContext(SettingsContext);
