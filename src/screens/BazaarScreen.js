import React, { useState, useEffect, useCallback } from 'react';
import {
    View, Text, StyleSheet, FlatList, TouchableOpacity,
    TextInput, ActivityIndicator, Linking, Alert, Dimensions, Image
} from 'react-native';
import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { API_BASE } from '../config';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';

const { width } = Dimensions.get('window');

export default function BazaarScreen() {
    const { colors, isDarkMode } = useTheme();
    const { t } = useLanguage();
    const s = getStyles(colors, isDarkMode);

    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [search, setSearch] = useState('');
    const [city, setCity] = useState('');

    const load = async (pg = 1, reset = false) => {
        try {
            setLoading(true);
            const token = await SecureStore.getItemAsync('token');
            const params = new URLSearchParams({ page: pg, limit: 10 });
            if (city) params.append('city', city);
            if (search) params.append('search', search);

            const endpoint = `${API_BASE}/products?${params}`;

            const res = await axios.get(endpoint, {
                headers: token ? { Authorization: `Bearer ${token}` } : {}
            });
            const data = res.data.data || [];
            
            setProducts(prev => reset ? data : [...prev, ...data]);
            
            setHasMore(data.length === 10);
        } catch (_) { 
            console.error('Error loading bazar data:', _);
        } finally { 
            setLoading(false); 
        }
    };

    useEffect(() => { load(1, true); }, [city]);

    const loadMore = () => {
        if (!hasMore || loading) return;
        const next = page + 1;
        setPage(next);
        load(next);
    };

    const call = (phone) => Linking.openURL(`tel:${phone}`).catch(() => Alert.alert('Cannot open dialer'));

    const renderProduct = ({ item: p }) => (
        <View style={s.card}>
            <View style={s.cardTop}>
                <Image 
                    source={p.images && p.images[0] ? { uri: p.images[0] } : null}
                    style={s.productImg}
                />
                <View style={s.mainInfo}>
                    <View style={s.shopHeader}>
                        <Text style={s.shopName} numberOfLines={1}>{p.title}</Text>
                        <Text style={s.priceTxt}>₹{p.price}</Text>
                    </View>
                    <View style={s.locationRow}>
                        <MaterialCommunityIcons name="store-outline" size={14} color={colors.primary} />
                        <Text style={s.vendorName} numberOfLines={1}>{p.vendorId?.shopName || p.vendorId?.name || 'Vendor'}</Text>
                    </View>
                    <View style={s.locationRow}>
                        <MaterialCommunityIcons name="map-marker" size={12} color={colors.subText} />
                        <Text style={s.location}>{p.vendorId?.city || 'Location unavailable'}</Text>
                    </View>
                </View>
            </View>
            <View style={s.divider} />
            <View style={s.cardBottom}>
                <View style={[s.chip, { backgroundColor: colors.iconBg }]}>
                    <Text style={s.chipTxt}>{p.category}</Text>
                </View>
                <TouchableOpacity style={s.callBtn} onPress={() => call(p.vendorId?.phone)} activeOpacity={0.8}>
                    <LinearGradient 
                        colors={['#16a34a', '#15803d']} 
                        style={s.callGradient}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                    >
                        <MaterialCommunityIcons name="phone" size={16} color="#fff" />
                        <Text style={s.callTxt}>Call Seller</Text>
                    </LinearGradient>
                </TouchableOpacity>
            </View>
        </View>
    );

    return (
        <View style={s.root}>
            <LinearGradient
                colors={isDarkMode ? ['#064e3b', '#0a1910'] : ['#16a34a', '#10b981']}
                style={s.header}
            >
                <View style={s.headerContent}>
                    <View>
                        <Text style={s.title}>{t.bazar}</Text>
                        <Text style={s.sub}>Verified scrap items nearby</Text>
                    </View>
                    <View style={s.headerIcon}>
                        <MaterialCommunityIcons name="package-variant" size={32} color="rgba(255,255,255,0.3)" />
                    </View>
                </View>

                {/* Search Bar */}
                <View style={s.searchRow}>
                    <View style={s.searchBox}>
                        <MaterialCommunityIcons name="magnify" size={20} color={isDarkMode ? '#9ca3af' : '#6b7280'} />
                        <TextInput
                            style={s.searchInput} placeholder="Search items…"
                            placeholderTextColor="#9ca3af" value={search}
                            onChangeText={t => { setSearch(t); if (!t) load(1, true); }}
                            onSubmitEditing={() => load(1, true)}
                            returnKeyType="search"
                        />
                    </View>
                    <View style={s.cityBox}>
                        <MaterialCommunityIcons name="map-marker-outline" size={18} color={isDarkMode ? '#9ca3af' : '#6b7280'} />
                        <TextInput
                            style={s.cityInput} placeholder="City" placeholderTextColor="#9ca3af"
                            value={city} onChangeText={setCity} onSubmitEditing={() => load(1, true)}
                            returnKeyType="search"
                        />
                    </View>
                </View>
            </LinearGradient>

            {loading && page === 1 ? (
                <View style={s.centerLoader}>
                    <ActivityIndicator size="large" color={colors.primary} />
                    <Text style={s.loaderText}>Finding items...</Text>
                </View>
            ) : (
                <FlatList
                    data={products}
                    keyExtractor={p => p._id}
                    contentContainerStyle={s.listPadding}
                    onEndReached={loadMore}
                    onEndReachedThreshold={0.4}
                    ListFooterComponent={hasMore && !loading ? <ActivityIndicator color={colors.primary} /> : null}
                    ListEmptyComponent={
                        <View style={s.empty}>
                            <MaterialCommunityIcons name="package-variant-closed" size={64} color={colors.subText} />
                            <Text style={s.emptyTxt}>No items found in this area yet.</Text>
                            <TouchableOpacity style={s.refreshBtn} onPress={() => load(1, true)}>
                                <Text style={s.refreshBtnText}>Refresh</Text>
                            </TouchableOpacity>
                        </View>
                    }
                    renderItem={renderProduct}
                />
            )}
            }
        </View>
    );
}

const getStyles = (colors, isDark) => StyleSheet.create({
    root: { flex: 1, backgroundColor: colors.background },
    header: { 
        paddingTop: 52, 
        paddingHorizontal: 20, 
        paddingBottom: 24, 
        borderBottomLeftRadius: 32, 
        borderBottomRightRadius: 32,
        elevation: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8
    },
    headerContent: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    headerIcon: { opacity: 0.8 },
    title: { fontSize: 24, fontWeight: '900', color: '#fff' },
    sub: { fontSize: 13, color: 'rgba(255,255,255,0.8)', fontWeight: '600' },
    
    toggleContainer: {
        flexDirection: 'row',
        backgroundColor: 'rgba(0,0,0,0.1)',
        borderRadius: 14,
        padding: 4,
        marginBottom: 20,
    },
    toggleBtn: {
        flex: 1,
        paddingVertical: 10,
        alignItems: 'center',
        borderRadius: 10,
    },
    toggleBtnActive: {
        backgroundColor: '#fff',
        elevation: 2,
    },
    toggleText: {
        fontSize: 14,
        fontWeight: '800',
        color: 'rgba(255,255,255,0.7)',
    },
    toggleTextActive: {
        color: '#16a34a',
    },

    searchRow: { flexDirection: 'row', gap: 10 },
    searchBox: {
        flex: 1, 
        flexDirection: 'row', 
        alignItems: 'center',
        backgroundColor: isDark ? 'rgba(0,0,0,0.3)' : 'rgba(255,255,255,0.9)', 
        borderRadius: 16, 
        paddingHorizontal: 12,
        height: 50,
        borderWidth: 1,
        borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'transparent',
    },
    searchInput: { flex: 1, paddingLeft: 8, fontSize: 14, color: isDark ? '#fff' : '#1f2937', fontWeight: '600' },
    cityBox: {
        width: 100, 
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: isDark ? 'rgba(0,0,0,0.3)' : 'rgba(255,255,255,0.9)', 
        borderRadius: 16, 
        paddingHorizontal: 12,
        borderWidth: 1,
        borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'transparent',
    },
    cityInput: { flex: 1, paddingLeft: 4, fontSize: 14, color: isDark ? '#fff' : '#1f2937', fontWeight: '600' },
    
    centerLoader: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    loaderText: { marginTop: 12, color: colors.subText, fontWeight: '600' },
    
    listPadding: { padding: 16, paddingBottom: 110 },
    card: {
        backgroundColor: colors.card, 
        borderRadius: 24, 
        padding: 16,
        marginBottom: 16,
        elevation: 4, 
        shadowColor: '#000', 
        shadowOpacity: 0.1, 
        shadowRadius: 10,
        borderWidth: 1,
        borderColor: colors.border,
    },
    cardTop: { flexDirection: 'row', alignItems: 'center', gap: 14 },
    avatar: {
        width: 56, height: 56, borderRadius: 20,
        alignItems: 'center', justifyContent: 'center',
        elevation: 3,
    },
    avatarTxt: { fontSize: 24, fontWeight: '900', color: '#fff' },
    productImg: { width: 70, height: 70, borderRadius: 18, backgroundColor: isDark ? '#064e3b' : '#f0fdf4' },
    mainInfo: { flex: 1 },
    shopHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
    shopName: { fontSize: 17, fontWeight: '800', color: colors.text, flex: 1, marginRight: 8 },
    priceTxt: { fontSize: 17, fontWeight: '900', color: colors.primary },
    vendorName: { fontSize: 12, fontWeight: '700', color: colors.primary, flex: 1 },
    locationRow: { flexDirection: 'row', alignItems: 'center', marginTop: 3, gap: 4 },
    location: { fontSize: 12, color: colors.subText, fontWeight: '500' },
    
    ratingBadge: { 
        flexDirection: 'row', 
        alignItems: 'center', 
        backgroundColor: isDark ? '#422006' : '#fef9c3', 
        paddingHorizontal: 8, 
        paddingVertical: 4, 
        borderRadius: 10,
        gap: 4
    },
    ratingTxt: { fontSize: 12, fontWeight: '800', color: isDark ? '#fef08a' : '#b45309' },
    
    divider: { height: 1, backgroundColor: colors.border, marginVertical: 14, opacity: 0.5 },
    
    cardBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
    chipContainer: { flex: 1, flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
    chip: { 
        backgroundColor: colors.iconBg, 
        paddingHorizontal: 10, 
        paddingVertical: 5, 
        borderRadius: 10, 
        borderWidth: 1, 
        borderColor: colors.primary + '20' 
    },
    chipTxt: { fontSize: 11, color: colors.primary, fontWeight: '700' },
    noCatText: { fontSize: 12, color: colors.subText, fontStyle: 'italic' },
    moreText: { fontSize: 11, color: colors.subText, fontWeight: '600', alignSelf: 'center' },
    
    actionRow: { alignItems: 'flex-end', gap: 8 },
    verifiedBadge: { 
        flexDirection: 'row', 
        alignItems: 'center', 
        backgroundColor: colors.iconBg, 
        paddingHorizontal: 10, 
        paddingVertical: 4, 
        borderRadius: 20,
        gap: 4
    },
    verifiedTxt: { fontSize: 11, fontWeight: '800', color: colors.primary },
    callBtn: { borderRadius: 12, overflow: 'hidden', elevation: 2 },
    callGradient: { 
        flexDirection: 'row', 
        alignItems: 'center', 
        paddingHorizontal: 16, 
        paddingVertical: 8, 
        gap: 6 
    },
    callTxt: { color: '#fff', fontWeight: '800', fontSize: 14 },
    
    empty: { alignItems: 'center', paddingVertical: 60 },
    emptyTxt: { fontSize: 16, color: colors.subText, fontWeight: '600', marginTop: 16, textAlign: 'center' },
    refreshBtn: { 
        marginTop: 20, 
        backgroundColor: colors.iconBg, 
        paddingHorizontal: 24, 
        paddingVertical: 12, 
        borderRadius: 16,
        borderWidth: 1,
        borderColor: colors.primary + '30'
    },
    refreshBtnText: { color: colors.primary, fontWeight: '800' },
});
