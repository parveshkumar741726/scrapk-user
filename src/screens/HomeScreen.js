import React, { useEffect, useState } from 'react';
import {
    View, Text, StyleSheet, ScrollView, TouchableOpacity,
    RefreshControl, Alert,
} from 'react-native';
import * as SecureStore from 'expo-secure-store';
import axios from 'axios';
import { API_BASE } from '../config';

const QUICK_ACTIONS = [
    { icon: '📦', label: 'Sell Scrap', screen: 'CreateSale', color: '#dcfce7', border: '#86efac' },
    { icon: '📋', label: 'My Sales', screen: 'MySales', color: '#dbeafe', border: '#93c5fd' },
    { icon: '🛒', label: 'Kabadi Bazar', screen: 'Bazaar', color: '#fef9c3', border: '#fde68a' },
    { icon: '🎯', label: 'Track Pickup', screen: 'MySales', color: '#fce7f3', border: '#f9a8d4' },
    { icon: '🗣️', label: 'Complaint', screen: 'Complaints', color: '#f3e8ff', border: '#c4b5fd' },
    { icon: '⭐', label: 'Give Feedback', screen: 'Feedback', color: '#fff7ed', border: '#fed7aa' },
];

export default function HomeScreen({ navigation }) {
    const [user, setUser] = useState(null);
    const [stats, setStats] = useState({ sales: 0, completed: 0 });
    const [refreshing, setRefreshing] = useState(false);

    const load = async () => {
        try {
            const u = JSON.parse(await SecureStore.getItemAsync('user') || '{}');
            setUser(u);
            const token = await SecureStore.getItemAsync('token');
            const res = await axios.get(`${API_BASE}/sales?limit=50`, { headers: { Authorization: `Bearer ${token}` } });
            const sales = res.data.data || [];
            setStats({ sales: sales.length, completed: sales.filter(s => s.status === 'completed').length });
        } catch (_) { }
    };

    useEffect(() => { load(); }, []);
    const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

    const hour = new Date().getHours();
    const greeting = hour < 12 ? '🌅 Good Morning' : hour < 17 ? '☀️ Good Afternoon' : '🌙 Good Evening';

    return (
        <ScrollView style={s.root} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#16a34a" />} showsVerticalScrollIndicator={false}>
            {/* Header */}
            <View style={s.header}>
                <View style={s.headerBlob} />
                <View style={s.headerContent}>
                    <Text style={s.greeting}>{greeting}</Text>
                    <Text style={s.name}>{user?.name || user?.phone || 'Customer'} 👋</Text>
                    <Text style={s.tagline}>Turn your scrap into cash today!</Text>
                </View>

                {/* Stats row */}
                <View style={s.statsRow}>
                    <View style={s.statBox}>
                        <Text style={s.statNum}>{stats.sales}</Text>
                        <Text style={s.statLbl}>Total Sales</Text>
                    </View>
                    <View style={s.statDiv} />
                    <View style={s.statBox}>
                        <Text style={s.statNum}>{stats.completed}</Text>
                        <Text style={s.statLbl}>Completed</Text>
                    </View>
                    <View style={s.statDiv} />
                    <View style={s.statBox}>
                        <Text style={s.statNum}>₹0</Text>
                        <Text style={s.statLbl}>Earned</Text>
                    </View>
                </View>
            </View>

            {/* Quick actions */}
            <Text style={s.sectionTitle}>What do you want to do?</Text>
            <View style={s.grid}>
                {QUICK_ACTIONS.map(a => (
                    <TouchableOpacity
                        key={a.label}
                        style={[s.card, { backgroundColor: a.color, borderColor: a.border }]}
                        onPress={() => navigation.navigate(a.screen)}
                        activeOpacity={0.8}
                    >
                        <Text style={s.cardIcon}>{a.icon}</Text>
                        <Text style={s.cardLabel}>{a.label}</Text>
                    </TouchableOpacity>
                ))}
            </View>

            {/* Banner */}
            <View style={s.banner}>
                <Text style={s.bannerTitle}>♻️ ScrapBazaar Promise</Text>
                <Text style={s.bannerSub}>Best price guaranteed • Doorstep pickup • Instant payment</Text>
            </View>

            <View style={{ height: 30 }} />
        </ScrollView>
    );
}

const s = StyleSheet.create({
    root: { flex: 1, backgroundColor: '#f0fdf4' },
    header: { paddingTop: 52, paddingBottom: 24, paddingHorizontal: 20, overflow: 'hidden' },
    headerBlob: {
        position: 'absolute', top: -60, left: -60, right: -60,
        height: 280, backgroundColor: '#16a34a', borderBottomLeftRadius: 80, borderBottomRightRadius: 80,
        opacity: 0.12,
    },
    headerContent: { marginBottom: 16 },
    greeting: { fontSize: 13, color: '#15803d', fontWeight: '600' },
    name: { fontSize: 22, fontWeight: '800', color: '#14532d', marginTop: 2 },
    tagline: { fontSize: 13, color: '#4b7c58', marginTop: 4 },
    statsRow: {
        flexDirection: 'row', backgroundColor: '#fff', borderRadius: 16, padding: 16,
        alignItems: 'center', justifyContent: 'space-around',
        shadowColor: '#16a34a', shadowOpacity: 0.1, shadowRadius: 10, elevation: 4,
    },
    statBox: { alignItems: 'center', flex: 1 },
    statNum: { fontSize: 22, fontWeight: '800', color: '#16a34a' },
    statLbl: { fontSize: 11, color: '#6b7280', fontWeight: '600', marginTop: 2 },
    statDiv: { width: 1, height: 32, backgroundColor: '#e5e7eb' },
    sectionTitle: { fontSize: 16, fontWeight: '700', color: '#111827', paddingHorizontal: 20, marginTop: 24, marginBottom: 14 },
    grid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 14, gap: 12 },
    card: {
        width: '46%', borderRadius: 18, padding: 18, alignItems: 'center',
        borderWidth: 1.5, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 6, elevation: 2,
    },
    cardIcon: { fontSize: 34, marginBottom: 8 },
    cardLabel: { fontSize: 13, fontWeight: '700', color: '#111827', textAlign: 'center' },
    banner: {
        marginHorizontal: 20, marginTop: 24, backgroundColor: '#16a34a', borderRadius: 18, padding: 20,
        shadowColor: '#16a34a', shadowOpacity: 0.3, shadowRadius: 12, elevation: 6,
    },
    bannerTitle: { fontSize: 16, fontWeight: '800', color: '#fff', marginBottom: 6 },
    bannerSub: { fontSize: 12, color: '#dcfce7', lineHeight: 18 },
});
