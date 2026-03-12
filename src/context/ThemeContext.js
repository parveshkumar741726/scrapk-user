import React, { createContext, useContext, useState, useEffect } from 'react';
import * as SecureStore from 'expo-secure-store';
import { Appearance } from 'react-native';

const ThemeContext = createContext();

export const lightTheme = {
    isDark: false,
    colors: {
        background: '#f0fdf4',
        card: '#ffffff',
        text: '#111827',
        subText: '#4b7c58',
        primary: '#16a34a',
        border: '#d1fae5',
        inputBg: '#f0fdf4',
        inputBorder: '#bbf7d0',
        statsBg: '#fff',
        iconBg: '#dcfce7',
        error: '#ef4444',
    }
};

export const darkTheme = {
    isDark: true,
    colors: {
        background: '#0a1910',
        card: '#102e1c',
        text: '#f3f4f6',
        subText: '#9ca3af',
        primary: '#22c55e',
        border: '#14532d',
        inputBg: '#050f09',
        inputBorder: '#14532d',
        statsBg: '#102e1c',
        iconBg: '#14532d',
        error: '#f87171',
    }
};

export const ThemeProvider = ({ children }) => {
    const [isDarkMode, setIsDarkMode] = useState(false);

    useEffect(() => {
        // Load saved theme or fallback to system theme
        const loadTheme = async () => {
            const saved = await SecureStore.getItemAsync('theme');
            if (saved) {
                setIsDarkMode(saved === 'dark');
            } else {
                const systemScheme = Appearance.getColorScheme();
                setIsDarkMode(systemScheme === 'dark');
            }
        };
        loadTheme();
    }, []);

    const toggleTheme = async () => {
        const newMode = !isDarkMode;
        setIsDarkMode(newMode);
        await SecureStore.setItemAsync('theme', newMode ? 'dark' : 'light');
    };

    const theme = isDarkMode ? darkTheme : lightTheme;

    return (
        <ThemeContext.Provider value={{ isDarkMode, toggleTheme, theme, colors: theme.colors }}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = () => useContext(ThemeContext);
