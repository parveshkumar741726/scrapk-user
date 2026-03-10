import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { View, Text } from 'react-native';

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

const THEME = {
    colors: {
        primary: '#16a34a',
        background: '#f8fffe',
        card: '#ffffff',
        text: '#111827',
        border: '#d1fae5',
        notification: '#ef4444',
    },
};

const TABS = [
    { name: 'Home', icon: '🏠' },
    { name: 'MySales', icon: '📦', label: 'My Sales' },
    { name: 'Bazaar', icon: '🛒' },
    { name: 'Profile', icon: '👤' },
];

function MainTabs() {
    return (
        <Tab.Navigator
            screenOptions={({ route }) => ({
                headerShown: false,
                tabBarStyle: {
                    backgroundColor: '#fff',
                    borderTopColor: '#d1fae5',
                    borderTopWidth: 1,
                    paddingBottom: 6,
                    paddingTop: 4,
                    height: 62,
                    elevation: 12,
                    shadowColor: '#16a34a',
                    shadowOpacity: 0.1,
                    shadowRadius: 12,
                },
                tabBarActiveTintColor: '#16a34a',
                tabBarInactiveTintColor: '#9ca3af',
                tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
                tabBarIcon: ({ focused }) => {
                    const t = TABS.find(t => t.name === route.name);
                    return (
                        <View style={{
                            alignItems: 'center', justifyContent: 'center',
                            backgroundColor: focused ? '#dcfce7' : 'transparent',
                            borderRadius: 10, width: 36, height: 28,
                        }}>
                            <Text style={{ fontSize: 18 }}>{t?.icon}</Text>
                        </View>
                    );
                },
                tabBarLabel: ({ focused }) => {
                    const t = TABS.find(t => t.name === route.name);
                    return (
                        <Text style={{ fontSize: 10, fontWeight: focused ? '700' : '500', color: focused ? '#16a34a' : '#9ca3af' }}>
                            {t?.label || t?.name}
                        </Text>
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

export default function App() {
    return (
        <SafeAreaProvider>
            <NavigationContainer theme={THEME}>
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
        </SafeAreaProvider>
    );
}
