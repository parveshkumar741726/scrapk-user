import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { View, Text, Platform } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { ThemeProvider, useTheme } from './src/context/ThemeContext';

import LoginScreen from './src/screens/LoginScreen';
import OTPScreen from './src/screens/OTPScreen';
import HomeScreen from './src/screens/HomeScreen';
import CreateSaleScreen from './src/screens/CreateSaleScreen';
import MySalesScreen from './src/screens/MySalesScreen';
import TrackingScreen from './src/screens/TrackingScreen';
import BazaarScreen from './src/screens/BazaarScreen';
import FeedbackScreen from './src/screens/FeedbackScreen';
import ComplaintsScreen from './src/screens/ComplaintsScreen';
import ProfileScreen from './src/screens/ProfileScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// Dynamic theme builder for Navigation container
const getNavigationTheme = (colors, isDark) => ({
    dark: isDark,
    colors: {
        primary: colors.primary,
        background: colors.background,
        card: colors.card,
        text: colors.text,
        border: colors.border,
        notification: colors.error,
    },
});

const TABS = [
    { name: 'Home', icon: 'home', label: 'Home' },
    { name: 'MySales', icon: 'package-variant-closed', label: 'My Sales' },
    { name: 'Bazaar', icon: 'storefront', label: 'Bazaar' },
    { name: 'Profile', icon: 'account', label: 'Profile' },
];

function MainTabs() {
    const { colors } = useTheme();
    return (
        <Tab.Navigator
            screenOptions={({ route }) => ({
                headerShown: false,
                tabBarStyle: {
                    backgroundColor: colors.card,
                    borderTopWidth: 0,
                    height: Platform.OS === 'ios' ? 88 : 70,
                    paddingBottom: Platform.OS === 'ios' ? 28 : 12,
                    paddingTop: 12,
                    borderTopLeftRadius: 30,
                    borderTopRightRadius: 30,
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    elevation: 25,
                    shadowColor: colors.primary,
                    shadowOpacity: 0.2,
                    shadowOffset: { width: 0, height: -4 },
                    shadowRadius: 15,
                },
                tabBarActiveTintColor: colors.primary,
                tabBarInactiveTintColor: colors.subText,
                tabBarShowLabel: true,
                tabBarLabelStyle: { 
                    fontSize: 11, 
                    fontWeight: '800', 
                    marginTop: 4 
                },
                tabBarIcon: ({ focused, color, size }) => {
                    const t = TABS.find(t => t.name === route.name);
                    const iconName = focused ? t.icon : `${t.icon}-outline`;
                    
                    return (
                        <View style={{
                            alignItems: 'center',
                            justifyContent: 'center',
                            backgroundColor: focused ? colors.primary + '15' : 'transparent',
                            borderRadius: 16,
                            width: 48,
                            height: 32,
                        }}>
                            <MaterialCommunityIcons 
                                name={iconName} 
                                size={22} 
                                color={color} 
                            />
                        </View>
                    );
                },
            })}
        >
            <Tab.Screen name="Home" component={HomeScreen} />
            <Tab.Screen name="MySales" component={MySalesScreen} />
            <Tab.Screen name="Bazaar" component={BazaarScreen} />
            <Tab.Screen name="Profile" component={ProfileScreen} />
        </Tab.Navigator>
    );
}

function AppNavigator() {
    const { colors, isDarkMode } = useTheme();
    return (
        <NavigationContainer theme={getNavigationTheme(colors, isDarkMode)}>
            <Stack.Navigator screenOptions={{ headerShown: false }}>
                <Stack.Screen name="Login" component={LoginScreen} />
                <Stack.Screen name="OTP" component={OTPScreen} />
                <Stack.Screen name="Main" component={MainTabs} />
                <Stack.Screen name="CreateSale" component={CreateSaleScreen} />
                <Stack.Screen name="Tracking" component={TrackingScreen} />
                <Stack.Screen name="Feedback" component={FeedbackScreen} />
                <Stack.Screen name="Complaints" component={ComplaintsScreen} />
            </Stack.Navigator>
        </NavigationContainer>
    );
}

import { LanguageProvider } from './src/context/LanguageContext';

export default function App() {
    return (
        <SafeAreaProvider>
            <LanguageProvider>
                <ThemeProvider>
                    <AppNavigator />
                </ThemeProvider>
            </LanguageProvider>
        </SafeAreaProvider>
    );
}
