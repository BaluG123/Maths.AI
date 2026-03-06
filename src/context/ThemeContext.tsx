// Theme Context — Dark/Light mode with AsyncStorage persistence

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, ReactNode } from 'react';
import { Colors, ThemeColors } from '../theme/colors';
import { getThemeMode, setThemeMode as saveThemeMode } from '../utils/storageHelper';

interface ThemeContextType {
    isDark: boolean;
    colors: ThemeColors;
    toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType>({
    isDark: true,
    colors: Colors.dark,
    toggleTheme: () => { },
});

export function ThemeProvider({ children }: { children: ReactNode }) {
    const [isDark, setIsDark] = useState(true);

    useEffect(() => {
        getThemeMode().then(mode => setIsDark(mode === 'dark'));
    }, []);

    const toggleTheme = useCallback(() => {
        const newMode = isDark ? 'light' : 'dark';
        setIsDark(!isDark);
        saveThemeMode(newMode);
    }, [isDark]);

    const colors = useMemo(() => isDark ? Colors.dark : Colors.light, [isDark]);

    const value = useMemo(() => ({ isDark, colors, toggleTheme }), [isDark, colors, toggleTheme]);

    return (
        <ThemeContext.Provider value={value}>
            {children}
        </ThemeContext.Provider>
    );
}

export function useTheme() {
    return useContext(ThemeContext);
}
