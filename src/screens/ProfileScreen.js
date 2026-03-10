import React, { useState, useEffect } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert,
} from 'react-native';
import * as SecureStore from 'expo-secure-store';

const MENU = [
    { icon: '📦', label: 'My Sales', screen: 'MySales' },
    { icon: '🗣️', label: 'Complaints', screen: 'Complaints' },
    { icon: '⭐', label: 'My Feedback', screen: 'Feedback' },
];

export default function ProfileScreen({ navigation }) {
    const [user, setUser] = useState(null);

    useEffect(() => {
        (async () => {
            const u = JSON.parse(await SecureStore.getItemAsync('user') || '{}');
            setUser(u);
        })();
    }, []);

    const logout = () =>
        Alert.alert('Logout?', 'You will be logged out of ScrapBazaar.', [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Logout', style: 'destructive',
                onPress: async () => {
                    await SecureStore.deleteItemAsync('token');
                    await SecureStore.deleteItemAsync('user');
                    navigation.replace('Login');
                },
            },
        ]);

    const initial = (user?.name || user?.phone || 'U')[0].toUpperCase();

    return (
        <ScrollView style={s.root} contentContainerStyle={s.content}>
            {/* Profile header */}
            <View style={s.headerBlob} />
            <View style={s.profileSection}>
                <View style={s.avatar}>
                    <Text style={s.avatarTxt}>{initial}</Text>
                </View>
                <Text style={s.name}>{user?.name || 'Customer'}</Text>
                <Text style={s.phone}>{user?.phone || '—'}</Text>
                <View style={s.roleBadge}>
                    <Text style={s.roleTxt}>♻️ ScrapBazaar Member</Text>
                </View>
            </View>

            {/* Stats */}
            <View style={s.statsRow}>
                <View style={s.stat}>
                    <Text style={s.statNum}>0</Text>
                    <Text style={s.statLbl}>Sales</Text>
                </View>
                <View style={s.statDiv} />
                <View style={s.stat}>
                    <Text style={s.statNum}>0</Text>
                    <Text style={s.statLbl}>Pickups Done</Text>
                </View>
                <View style={s.statDiv} />
                <View style={s.stat}>
                    <Text style={s.statNum}>₹0</Text>
                    <Text style={s.statLbl}>Earned</Text>
                </View>
            </View>

            {/* Menu */}
            <View style={s.menu}>
                {MENU.map(m => (
                    <TouchableOpacity key={m.label} style={s.menuRow} onPress={() => navigation.navigate(m.screen)} activeOpacity={0.7}>
                        <Text style={s.menuIcon}>{m.icon}</Text>
                        <Text style={s.menuLabel}>{m.label}</Text>
                        <Text style={s.menuArrow}>›</Text>
                    </TouchableOpacity>
                ))}
            </View>

            {/* App info */}
            <View style={s.appInfo}>
                <Text style={s.appInfoTxt}>♻️ ScrapBazaar v1.0.0</Text>
                <Text style={s.appInfoSub}>Turning waste into wealth, one pickup at a time.</Text>
            </View>

            {/* Logout */}
            <TouchableOpacity style={s.logoutBtn} onPress={logout} activeOpacity={0.85}>
                <Text style={s.logoutTxt}>🚪 Logout</Text>
            </TouchableOpacity>
        </ScrollView>
    );
}

const s = StyleSheet.create({
    root: { flex: 1, backgroundColor: '#f0fdf4' },
    content: { paddingBottom: 40 },
    headerBlob: {
        height: 200, backgroundColor: '#16a34a', opacity: 0.12,
        borderBottomLeftRadius: 80, borderBottomRightRadius: 80, marginBottom: -60,
    },
    profileSection: { alignItems: 'center', paddingTop: 40, paddingBottom: 24 },
    avatar: {
        width: 80, height: 80, borderRadius: 40, backgroundColor: '#16a34a',
        alignItems: 'center', justifyContent: 'center',
        shadowColor: '#16a34a', shadowOpacity: 0.4, shadowRadius: 12, elevation: 8,
        marginBottom: 12,
    },
    avatarTxt: { fontSize: 34, fontWeight: '800', color: '#fff' },
    name: { fontSize: 22, fontWeight: '800', color: '#14532d' },
    phone: { fontSize: 14, color: '#4b7c58', marginTop: 2 },
    roleBadge: { marginTop: 10, backgroundColor: '#dcfce7', paddingHorizontal: 16, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: '#86efac' },
    roleTxt: { fontSize: 12, color: '#15803d', fontWeight: '700' },
    statsRow: {
        flexDirection: 'row', backgroundColor: '#fff', marginHorizontal: 20, borderRadius: 18,
        padding: 16, justifyContent: 'space-around', elevation: 3,
        shadowColor: '#16a34a', shadowOpacity: 0.08, shadowRadius: 8, marginBottom: 20,
    },
    stat: { alignItems: 'center', flex: 1 },
    statNum: { fontSize: 20, fontWeight: '800', color: '#16a34a' },
    statLbl: { fontSize: 11, color: '#6b7280', marginTop: 2 },
    statDiv: { width: 1, backgroundColor: '#e5e7eb', height: 30 },
    menu: { backgroundColor: '#fff', marginHorizontal: 20, borderRadius: 18, overflow: 'hidden', elevation: 2, marginBottom: 20 },
    menuRow: {
        flexDirection: 'row', alignItems: 'center', padding: 16,
        borderBottomWidth: 1, borderBottomColor: '#f3f4f6',
    },
    menuIcon: { fontSize: 22, marginRight: 14 },
    menuLabel: { flex: 1, fontSize: 15, fontWeight: '600', color: '#111827' },
    menuArrow: { fontSize: 20, color: '#9ca3af' },
    appInfo: { alignItems: 'center', marginVertical: 20 },
    appInfoTxt: { fontSize: 14, fontWeight: '700', color: '#16a34a' },
    appInfoSub: { fontSize: 12, color: '#9ca3af', marginTop: 4, textAlign: 'center' },
    logoutBtn: {
        marginHorizontal: 20, backgroundColor: '#fff', borderRadius: 14, paddingVertical: 14,
        alignItems: 'center', borderWidth: 1.5, borderColor: '#fca5a5',
    },
    logoutTxt: { color: '#ef4444', fontWeight: '700', fontSize: 15 },
});
