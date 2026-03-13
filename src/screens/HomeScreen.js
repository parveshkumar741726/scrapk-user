import React, { useEffect, useState } from 'react';
import {
    View, Text, StyleSheet, ScrollView, TouchableOpacity,
    RefreshControl, Alert, Image, Dimensions,
} from 'react-native';
import * as SecureStore from 'expo-secure-store';
import axios from 'axios';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { API_BASE } from '../config';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';

const { width } = Dimensions.get('window');

const QUICK_ACTIONS = (isDark, colors, t) => [
    { icon: 'plus-circle-outline', label: t.sellScrap, screen: 'CreateSale', color: '#10b981' },
    { icon: 'format-list-bulleted', label: t.mySales, screen: 'MySales', color: '#3b82f6' },
    { icon: 'storefront-outline', label: t.bazar, screen: 'Bazaar', color: '#f59e0b' },
    { icon: 'map-marker-radius-outline', label: t.track, screen: 'MySales', color: '#ec4899' },
    { icon: 'comment-alert-outline', label: t.complaint, screen: 'Complaints', color: '#8b5cf6' },
    { icon: 'star-face', label: t.feedback, screen: 'Feedback', color: '#ef4444' },
];

export default function HomeScreen({ navigation }) {
    const { colors, isDarkMode } = useTheme();
    const { t } = useLanguage();
    const s = getStyles(colors, isDarkMode);

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
    const greeting = hour < 12 ? 'Good Morning' : hour < 17 ? 'Good Afternoon' : 'Good Evening';

    return (
        <View style={s.root}>
            <ScrollView 
                style={{ flex: 1 }} 
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />} 
                showsVerticalScrollIndicator={false}
            >
                {/* Header Section */}
                <LinearGradient
                    colors={isDarkMode ? ['#064e3b', '#0a1910'] : ['#16a34a', '#f0fdf4']}
                    style={s.header}
                >
                    <View style={s.topBar}>
                        <View>
                            <Text style={s.greetingText}>{greeting}</Text>
                            <Text style={s.userName}>{user?.name || user?.phone || 'Customer'}</Text>
                        </View>
                        <TouchableOpacity 
                            style={s.profileThumb}
                            onPress={() => navigation.navigate('Profile')}
                        >
                            {user?.profileImage ? (
                                <Image source={{ uri: user.profileImage }} style={s.avatarImg} />
                            ) : (
                                <View style={s.avatarLabel}>
                                    <Text style={s.avatarText}>{(user?.name || 'C')[0]}</Text>
                                </View>
                            )}
                        </TouchableOpacity>
                    </View>

                    {/* Floating Stats Card */}
                    <View style={s.statsCard}>
                        <View style={s.statItem}>
                            <View style={[s.statIcon, { backgroundColor: '#dcfce7' }]}>
                                <MaterialCommunityIcons name="package-variant" size={20} color="#059669" />
                            </View>
                            <View>
                                <Text style={s.statValue}>{stats.sales}</Text>
                                <Text style={s.statLabel}>{t.mySales}</Text>
                            </View>
                        </View>
                        <View style={s.divider} />
                        <View style={s.statItem}>
                            <View style={[s.statIcon, { backgroundColor: '#fef3c7' }]}>
                                <MaterialCommunityIcons name="check-decagram" size={20} color="#d97706" />
                            </View>
                            <View>
                                <Text style={s.statValue}>{stats.completed}</Text>
                                <Text style={s.statLabel}>{t.pickups}</Text>
                            </View>
                        </View>
                    </View>
                </LinearGradient>

                <View style={s.content}>
                    <Text style={s.sectionTitle}>{t.liveStats || 'Quick Navigation'}</Text>
                    
                    <View style={s.actionGrid}>
                        {QUICK_ACTIONS(isDarkMode, colors, t).map((action, index) => (
                            <TouchableOpacity
                                key={index}
                                activeOpacity={0.7}
                                style={[s.actionItem, { backgroundColor: isDarkMode ? '#102e1c' : '#fff' }]}
                                onPress={() => navigation.navigate(action.screen)}
                            >
                                <LinearGradient
                                    colors={[action.color + '20', action.color + '05']}
                                    style={s.actionIconBg}
                                >
                                    <MaterialCommunityIcons name={action.icon} size={28} color={action.color} />
                                </LinearGradient>
                                <Text style={s.actionLabel}>{action.label}</Text>
                                <View style={[s.actionIndicator, { backgroundColor: action.color }]} />
                            </TouchableOpacity>
                        ))}
                    </View>

                    {/* Promo Banner */}
                    <TouchableOpacity activeOpacity={0.9} style={s.promoBanner}>
                        <LinearGradient
                            colors={['#10b981', '#059669']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={s.promoGradient}
                        >
                            <View style={s.promoTextContent}>
                                <Text style={s.promoTitle}>♻️ ScrapK Promise</Text>
                                <Text style={s.promoSub}>Instant Payment • Doorstep Pickup • Best Price</Text>
                            </View>
                            <MaterialCommunityIcons name="shield-check-outline" size={40} color="#fff" style={{ opacity: 0.3 }} />
                        </LinearGradient>
                    </TouchableOpacity>
                </View>
                <View style={{ height: 110 }} />
            </ScrollView>
        </View>
    );
}

const getStyles = (colors, isDark) => StyleSheet.create({
    root: { flex: 1, backgroundColor: colors.background },
    header: {
        paddingTop: 60,
        paddingBottom: 80,
        paddingHorizontal: 24,
        borderBottomLeftRadius: 40,
        borderBottomRightRadius: 40,
    },
    topBar: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 30,
    },
    greetingText: {
        fontSize: 14,
        color: isDark ? '#a7f3d0' : '#fff',
        opacity: 0.9,
        fontWeight: '600',
    },
    userName: {
        fontSize: 24,
        fontWeight: '800',
        color: '#fff',
        letterSpacing: -0.5,
    },
    profileThumb: {
        width: 48,
        height: 48,
        borderRadius: 24,
        borderWidth: 2,
        borderColor: '#fff',
        overflow: 'hidden',
        elevation: 8,
    },
    avatarImg: { width: '100%', height: '100%' },
    avatarLabel: {
        width: '100%',
        height: '100%',
        backgroundColor: '#059669',
        alignItems: 'center',
        justifyContent: 'center',
    },
    avatarText: { color: '#fff', fontSize: 18, fontWeight: '800' },
    
    statsCard: {
        position: 'absolute',
        bottom: -35,
        left: 24,
        right: 24,
        height: 80,
        backgroundColor: colors.card,
        borderRadius: 20,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-evenly',
        elevation: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
    },
    statItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    statIcon: {
        width: 40,
        height: 40,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    statValue: {
        fontSize: 18,
        fontWeight: '800',
        color: colors.text,
    },
    statLabel: {
        fontSize: 10,
        color: colors.subText,
        fontWeight: '700',
        textTransform: 'uppercase',
    },
    divider: {
        width: 1,
        height: 40,
        backgroundColor: colors.border,
        opacity: 0.5,
    },

    content: {
        marginTop: 60,
        paddingHorizontal: 20,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '800',
        color: colors.text,
        marginBottom: 20,
        marginLeft: 4,
    },
    actionGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        gap: 16,
    },
    actionItem: {
        width: (width - 56) / 2,
        borderRadius: 24,
        padding: 20,
        alignItems: 'center',
        elevation: 3,
        shadowColor: '#000',
        shadowOpacity: 0.05,
        shadowRadius: 8,
        borderWidth: 1,
        borderColor: colors.border,
    },
    actionIconBg: {
        width: 56,
        height: 56,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 12,
    },
    actionLabel: {
        fontSize: 13,
        fontWeight: '800',
        color: colors.text,
        textAlign: 'center',
    },
    actionIndicator: {
        position: 'absolute',
        top: 12,
        right: 12,
        width: 6,
        height: 6,
        borderRadius: 3,
    },
    
    promoBanner: {
        marginTop: 30,
        borderRadius: 24,
        overflow: 'hidden',
        elevation: 6,
    },
    promoGradient: {
        padding: 24,
        flexDirection: 'row',
        alignItems: 'center',
    },
    promoTextContent: { flex: 1 },
    promoTitle: {
        fontSize: 18,
        fontWeight: '800',
        color: '#fff',
        marginBottom: 4,
    },
    promoSub: {
        fontSize: 12,
        color: '#dcfce7',
        fontWeight: '600',
    }
});
