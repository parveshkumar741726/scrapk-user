import React, { useState, useEffect, useCallback } from 'react';
import {
    View, Text, StyleSheet, FlatList, TouchableOpacity,
    TextInput, ActivityIndicator, Linking, Alert,
} from 'react-native';
import axios from 'axios';
import { API_BASE } from '../config';

export default function BazaarScreen() {
    const [vendors, setVendors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [search, setSearch] = useState('');
    const [city, setCity] = useState('');

    const load = async (pg = 1, reset = false) => {
        try {
            const params = new URLSearchParams({ page: pg, limit: 10, role: 'vendor' });
            if (city) params.append('city', city);
            if (search) params.append('search', search);
            const res = await axios.get(`${API_BASE}/users?${params}`);
            const data = res.data.data || [];
            setVendors(prev => reset ? data : [...prev, ...data]);
            setHasMore(data.length === 10);
        } catch (_) { }
        finally { setLoading(false); }
    };

    useEffect(() => { load(1, true); }, [city]);

    const loadMore = () => {
        if (!hasMore) return;
        const next = page + 1;
        setPage(next);
        load(next);
    };

    const call = (phone) => Linking.openURL(`tel:${phone}`).catch(() => Alert.alert('Cannot open dialer'));

    return (
        <View style={s.root}>
            <View style={s.header}>
                <Text style={s.title}>🛒 Kabadi Bazar</Text>
                <Text style={s.sub}>Find verified scrap vendors near you</Text>
            </View>

            {/* Search + filter */}
            <View style={s.searchRow}>
                <View style={s.searchBox}>
                    <Text style={s.searchIcon}>🔍</Text>
                    <TextInput
                        style={s.searchInput} placeholder="Search vendors…"
                        placeholderTextColor="#9ca3af" value={search}
                        onChangeText={t => { setSearch(t); if (!t) load(1, true); }}
                        onSubmitEditing={() => load(1, true)}
                        returnKeyType="search"
                    />
                </View>
                <View style={s.cityBox}>
                    <TextInput
                        style={s.cityInput} placeholder="City" placeholderTextColor="#9ca3af"
                        value={city} onChangeText={setCity} onSubmitEditing={() => load(1, true)}
                        returnKeyType="search"
                    />
                </View>
            </View>

            {loading && page === 1
                ? <ActivityIndicator size="large" color="#16a34a" style={{ marginTop: 60 }} />
                : (
                    <FlatList
                        data={vendors}
                        keyExtractor={v => v._id}
                        contentContainerStyle={{ padding: 16, gap: 12 }}
                        onEndReached={loadMore}
                        onEndReachedThreshold={0.4}
                        ListFooterComponent={hasMore && !loading ? <ActivityIndicator color="#16a34a" /> : null}
                        ListEmptyComponent={
                            <View style={s.empty}>
                                <Text style={s.emptyIcon}>🏪</Text>
                                <Text style={s.emptyTxt}>No vendors found in this area yet.</Text>
                            </View>
                        }
                        renderItem={({ item: v }) => (
                            <View style={s.card}>
                                <View style={s.cardLeft}>
                                    <View style={s.avatar}>
                                        <Text style={s.avatarTxt}>{(v.shopName || v.name || 'V')[0].toUpperCase()}</Text>
                                    </View>
                                    <View style={{ flex: 1 }}>
                                        <Text style={s.shopName}>{v.shopName || v.name || 'Vendor'}</Text>
                                        {v.city ? <Text style={s.location}>📍 {v.city}</Text> : null}
                                        {v.categories?.length ? (
                                            <View style={s.chips}>
                                                {v.categories.slice(0, 3).map(c => (
                                                    <View key={c} style={s.chip}><Text style={s.chipTxt}>{c}</Text></View>
                                                ))}
                                            </View>
                                        ) : null}
                                    </View>
                                </View>

                                <View style={s.cardRight}>
                                    <View style={s.ratingBadge}>
                                        <Text style={s.ratingTxt}>⭐ {v.rating?.toFixed(1) || 'New'}</Text>
                                    </View>
                                    {v.kycStatus === 'verified' && (
                                        <View style={s.verifiedBadge}><Text style={s.verifiedTxt}>✓ Verified</Text></View>
                                    )}
                                    {v.phone && (
                                        <TouchableOpacity style={s.callBtn} onPress={() => call(v.phone)}>
                                            <Text style={s.callTxt}>📞 Call</Text>
                                        </TouchableOpacity>
                                    )}
                                </View>
                            </View>
                        )}
                    />
                )}
        </View>
    );
}

const s = StyleSheet.create({
    root: { flex: 1, backgroundColor: '#f0fdf4' },
    header: { paddingTop: 52, paddingHorizontal: 20, paddingBottom: 12, backgroundColor: '#fff', elevation: 2 },
    title: { fontSize: 20, fontWeight: '800', color: '#14532d' },
    sub: { fontSize: 13, color: '#4b7c58', marginTop: 2 },
    searchRow: { flexDirection: 'row', padding: 12, gap: 8, backgroundColor: '#fff' },
    searchBox: {
        flex: 1, flexDirection: 'row', alignItems: 'center',
        backgroundColor: '#f0fdf4', borderRadius: 12, paddingHorizontal: 12, borderWidth: 1.5, borderColor: '#bbf7d0',
    },
    searchIcon: { fontSize: 16, marginRight: 6 },
    searchInput: { flex: 1, paddingVertical: 10, fontSize: 14, color: '#111827' },
    cityBox: {
        width: 90, backgroundColor: '#f0fdf4', borderRadius: 12, paddingHorizontal: 10,
        borderWidth: 1.5, borderColor: '#bbf7d0', justifyContent: 'center',
    },
    cityInput: { fontSize: 14, color: '#111827', paddingVertical: 10 },
    card: {
        backgroundColor: '#fff', borderRadius: 16, padding: 14,
        flexDirection: 'row', justifyContent: 'space-between',
        elevation: 2, shadowColor: '#16a34a', shadowOpacity: 0.07, shadowRadius: 6,
    },
    cardLeft: { flex: 1, flexDirection: 'row', gap: 12 },
    avatar: {
        width: 46, height: 46, borderRadius: 23, backgroundColor: '#dcfce7',
        alignItems: 'center', justifyContent: 'center',
    },
    avatarTxt: { fontSize: 20, fontWeight: '800', color: '#16a34a' },
    shopName: { fontSize: 15, fontWeight: '800', color: '#111827', marginBottom: 2 },
    location: { fontSize: 12, color: '#6b7280' },
    chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginTop: 6 },
    chip: { backgroundColor: '#f0fdf4', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, borderWidth: 1, borderColor: '#bbf7d0' },
    chipTxt: { fontSize: 10, color: '#16a34a', fontWeight: '600' },
    cardRight: { alignItems: 'flex-end', gap: 6 },
    ratingBadge: { backgroundColor: '#fef9c3', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
    ratingTxt: { fontSize: 12, fontWeight: '700', color: '#b45309' },
    verifiedBadge: { backgroundColor: '#dcfce7', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
    verifiedTxt: { fontSize: 10, fontWeight: '700', color: '#16a34a' },
    callBtn: { backgroundColor: '#16a34a', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
    callTxt: { color: '#fff', fontWeight: '700', fontSize: 12 },
    empty: { alignItems: 'center', marginTop: 60 },
    emptyIcon: { fontSize: 48, marginBottom: 10 },
    emptyTxt: { fontSize: 15, color: '#6b7280' },
});
