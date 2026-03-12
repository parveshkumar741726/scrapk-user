import React, { createContext, useContext, useState, useEffect } from 'react';
import * as SecureStore from 'expo-secure-store';

const LanguageContext = createContext();

export const TRANSLATIONS = {
    en: {
        languageName: 'English',
        home: 'Home',
        mySales: 'My Sales',
        bazar: 'Kabadi Bazar',
        track: 'Track Pickup',
        complaint: 'Complaint',
        feedback: 'Give Feedback',
        profile: 'Profile',
        darkMode: 'Dark Mode',
        language: 'Language',
        logout: 'Logout safely',
        sellScrap: 'Sell Scrap',
        hiUser: 'Hi',
        liveStats: 'Live Stats',
        users: 'Users',
        vendors: 'Vendors',
        pickups: 'Pickups Completed',
        recent: 'Recent Pickups',
    },
    hi: {
        languageName: 'हिंदी',
        home: 'मुख्य पृष्ठ',
        mySales: 'मेरी बिक्री',
        bazar: 'कबाड़ी बाज़ार',
        track: 'पिकअप ट्रैक करें',
        complaint: 'शिकायत',
        feedback: 'प्रतिक्रिया दें',
        profile: 'प्रोफ़ाइल',
        darkMode: 'डार्क मोड',
        language: 'भाषा',
        logout: 'लॉगआउट करें',
        sellScrap: 'कबाड़ी बेचें',
        hiUser: 'नमस्ते',
        liveStats: 'लाइव आँकड़े',
        users: 'उपयोगकर्ता',
        vendors: 'कबाड़ीवाले',
        pickups: 'पिकअप पूरे हुए',
        recent: 'हाल के पिकअप',
    }
};

export const LanguageProvider = ({ children }) => {
    const [language, setLanguage] = useState('en');

    useEffect(() => {
        (async () => {
            try {
                const savedLanguage = await SecureStore.getItemAsync('language_preference');
                if (savedLanguage) {
                    setLanguage(savedLanguage);
                }
            } catch (e) {
                console.warn('Failed to load language', e);
            }
        })();
    }, []);

    const changeLanguage = async (langCode) => {
        setLanguage(langCode);
        try {
            await SecureStore.setItemAsync('language_preference', langCode);
        } catch (e) {
            console.warn('Failed to save language', e);
        }
    };

    const t = TRANSLATIONS[language] || TRANSLATIONS['en'];

    return (
        <LanguageContext.Provider value={{ language, changeLanguage, t }}>
            {children}
        </LanguageContext.Provider>
    );
};

export const useLanguage = () => useContext(LanguageContext);
