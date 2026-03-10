import React, { useState, useEffect, useCallback } from 'react';
import {
    View, Text, StyleSheet, FlatList, TouchableOpacity,
    ActivityIndicator, RefreshControl, Alert, Modal, TextInput,
} from 'react-native';
import * as SecureStore from 'expo-secure-store';
import axios from 'axios';
import { API_BASE } from '../config';

const STATUS_COLOR = {
    open: '#16a34a', pending: '#f59e0b', accepted: '#3b82f6',
    confirmed: '#8b5cf6', completed: '#10b981', cancelled: '#ef4444',
};

const SLOT_LABELS = {
    morning: '8:00 AM - 11:00 AM',
    afternoon: '11:00 AM - 5:00 PM',
    evening: '5:00 PM - 8:00 PM',
};

const formatDate = (d) => {
    if (!d) return '—';
    const dt = new Date(d);
    if (isNaN(dt)) return String(d);
    return dt.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
        .replace(/-/g, ' ');
};

const formatSlot = (slot) => SLOT_LABELS[slot] || slot || '—';

export default function MySalesScreen({ navigation }) {
    const [sales, setSales] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [bidModal, setBidModal] = useState(null); // { sale, bids }
    const [bidLoading, setBidLoading] = useState(false);

    const getH = async () => {
        const t = await SecureStore.getItemAsync('token');
        return { headers: { Authorization: `Bearer ${t}` } };
    };

    const load = async () => {
        try {
            const h = await getH();
            const res = await axios.get(`${API_BASE}/sales`, h);
            setSales(res.data.data || []);
        } catch (_) { }
        finally { setLoading(false); }
    };

    const onRefresh = useCallback(async () => { setRefreshing(true); await load(); setRefreshing(false); }, []);
    useEffect(() => { load(); }, []);

    const viewBids = async (sale) => {
        setBidLoading(true);
        try {
            const h = await getH();
            const res = await axios.get(`${API_BASE}/bids?saleId=${sale._id}`, h);
            setBidModal({ sale, bids: res.data.data || [] });
        } catch (_) { Alert.alert('Error', 'Could not load bids.'); }
        finally { setBidLoading(false); }
    };

    const acceptBid = async (bidId, saleId) => {
        Alert.alert('Accept Bid?', 'This vendor will be confirmed for your pickup.', [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Accept ✓', style: 'default',
                onPress: async () => {
                    try {
                        const h = await getH();
                        await axios.patch(`${API_BASE}/bids/${bidId}/accept`, {}, h);
                        Alert.alert('🎉 Bid Accepted!', 'Booking confirmed. Track your pickup in My Sales.');
                        setBidModal(null);
                        load();
                    } catch (e) { Alert.alert('Error', e.response?.data?.message || 'Failed to accept bid.'); }
                },
            },
        ]);
    };

    const cancelSale = (saleId) => {
        Alert.alert(
            '❌ Cancel Sale',
            'Sale cancel ho jayegi aur sare bids hata diye jayenge. Confirm?',
            [
                { text: 'Nahi', style: 'cancel' },
                {
                    text: 'Haan, Cancel Karo', style: 'destructive',
                    onPress: async () => {
                        try {
                            const h = await getH();
                            await axios.delete(`${API_BASE}/sales/${saleId}`, h);
                            setSales(prev => prev.filter(s => s._id !== saleId));
                        } catch (e) {
                            Alert.alert('Error', e.response?.data?.message || 'Failed to cancel sale.');
                        }
                    },
                },
            ]
        );
    };



    return (
        <View style={s.root}>
            <View style={s.header}>
                <Text style={s.title}>📦 My Sales</Text>
                <TouchableOpacity style={s.addBtn} onPress={() => navigation.navigate('CreateSale')}>
                    <Text style={s.addTxt}>+ New Sale</Text>
                </TouchableOpacity>
            </View>

            <FlatList
                data={sales}
                keyExtractor={i => i._id}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#16a34a" />}
                contentContainerStyle={{ padding: 16, gap: 12 }}
                ListEmptyComponent={
                    <View style={s.empty}>
                        <Text style={s.emptyIcon}>📭</Text>
                        <Text style={s.emptyTxt}>No sales yet!</Text>
                        <TouchableOpacity style={s.emptyBtn} onPress={() => navigation.navigate('CreateSale')}>
                            <Text style={s.emptyBtnTxt}>+ Post Your First Sale</Text>
                        </TouchableOpacity>
                    </View>
                }
                renderItem={({ item: sale }) => (
                    <View style={s.card}>
                        <View style={s.cardTop}>
                            <View>
                                <Text style={s.cardCategory}>{sale.categoryId?.name || 'Scrap'}</Text>
                                <Text style={s.cardQty}>~{sale.estimatedQuantity ?? sale.estimatedQty ?? '?'} kg</Text>
                            </View>
                            <View style={[s.badge, { backgroundColor: (STATUS_COLOR[sale.status] || '#6b7280') + '20' }]}>
                                <Text style={[s.badgeTxt, { color: STATUS_COLOR[sale.status] || '#6b7280' }]}>
                                    {sale.status?.toUpperCase()}
                                </Text>
                            </View>
                        </View>

                        <Text style={s.cardDate}>📅 {formatDate(sale.scheduledDate)} · {formatSlot(sale.scheduledSlot)}</Text>
                        {sale.pickupAddress ? <Text style={s.cardAddr} numberOfLines={1}>📍 {sale.pickupAddress}</Text> : null}

                        <View style={s.cardActions}>
                            {sale.status === 'open' && (
                                <TouchableOpacity style={s.bidBtn} onPress={() => viewBids(sale)} disabled={bidLoading}>
                                    <Text style={s.bidBtnTxt}>👀 View Bids ({sale.bidCount || 0})</Text>
                                </TouchableOpacity>
                            )}
                            {sale.status === 'open' && (
                                <TouchableOpacity style={s.cancelBtn} onPress={() => cancelSale(sale._id)}>
                                    <Text style={s.cancelBtnTxt}>❌ Cancel</Text>
                                </TouchableOpacity>
                            )}
                            {['confirmed', 'in_progress'].includes(sale.status) && (
                                <TouchableOpacity style={s.trackBtn} onPress={() => navigation.navigate('Tracking', { sale })}>
                                    <Text style={s.trackBtnTxt}>🗺️ Track Pickup</Text>
                                </TouchableOpacity>
                            )}
                            {sale.status === 'completed' && (
                                <TouchableOpacity style={s.rateBtn} onPress={() => navigation.navigate('Feedback', { saleId: sale._id })}>
                                    <Text style={s.rateBtnTxt}>⭐ Rate Experience</Text>
                                </TouchableOpacity>
                            )}
                        </View>
                    </View>
                )}
            />

            {/* Bid Modal */}
            <Modal visible={!!bidModal} animationType="slide" transparent>
                <View style={s.modalBg}>
                    <View style={s.modalCard}>
                        <Text style={s.modalTitle}>💰 Bids Received</Text>
                        <Text style={s.modalSub}>Sale: {bidModal?.sale?.categoryId?.name} · {bidModal?.sale?.estimatedQuantity ?? bidModal?.sale?.estimatedQty ?? '?'}kg</Text>
                        {bidModal?.bids?.length === 0
                            ? <Text style={{ textAlign: 'center', color: '#6b7280', marginTop: 20 }}>No bids yet. Check back soon!</Text>
                            : bidModal?.bids?.map(bid => (
                                <View key={bid._id} style={s.bidRow}>
                                    <View>
                                        <Text style={s.bidVendor}>{bid.vendorId?.shopName || bid.vendorId?.name || 'Vendor'}</Text>
                                        <Text style={s.bidNote}>{bid.note || ''}</Text>
                                    </View>
                                    <View style={{ alignItems: 'flex-end' }}>
                                        <Text style={s.bidAmt}>₹{bid.bidAmount}/kg</Text>
                                        <TouchableOpacity style={s.acceptBtn} onPress={() => acceptBid(bid._id, bid.saleId)}>
                                            <Text style={s.acceptTxt}>Accept</Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            ))
                        }
                        <TouchableOpacity style={s.closeBtn} onPress={() => setBidModal(null)}>
                            <Text style={s.closeBtnTxt}>Close</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const s = StyleSheet.create({
    root: { flex: 1, backgroundColor: '#f0fdf4' },
    center: { flex: 1, backgroundColor: '#f0fdf4', alignItems: 'center', justifyContent: 'center' },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 52, paddingHorizontal: 20, paddingBottom: 16, backgroundColor: '#fff', elevation: 2 },
    title: { fontSize: 20, fontWeight: '800', color: '#14532d' },
    addBtn: { backgroundColor: '#16a34a', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
    addTxt: { color: '#fff', fontWeight: '700', fontSize: 13 },
    card: { backgroundColor: '#fff', borderRadius: 16, padding: 16, elevation: 2, shadowColor: '#16a34a', shadowOpacity: 0.08, shadowRadius: 8 },
    cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 },
    cardCategory: { fontSize: 16, fontWeight: '800', color: '#14532d' },
    cardQty: { fontSize: 13, color: '#4b7c58', fontWeight: '600' },
    badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
    badgeTxt: { fontSize: 11, fontWeight: '800', letterSpacing: 0.5 },
    cardDate: { fontSize: 12, color: '#6b7280', marginBottom: 2 },
    cardAddr: { fontSize: 12, color: '#6b7280', marginBottom: 10 },
    cardActions: { flexDirection: 'row', gap: 8, marginTop: 8 },
    bidBtn: { backgroundColor: '#dcfce7', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 8, borderWidth: 1, borderColor: '#86efac' },
    bidBtnTxt: { color: '#16a34a', fontWeight: '700', fontSize: 13 },
    trackBtn: { backgroundColor: '#dbeafe', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 8, borderWidth: 1, borderColor: '#93c5fd' },
    trackBtnTxt: { color: '#1d4ed8', fontWeight: '700', fontSize: 13 },
    rateBtn: { backgroundColor: '#fef9c3', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 8, borderWidth: 1, borderColor: '#fde68a' },
    rateBtnTxt: { color: '#b45309', fontWeight: '700', fontSize: 13 },
    empty: { alignItems: 'center', marginTop: 80 },
    emptyIcon: { fontSize: 60, marginBottom: 12 },
    emptyTxt: { fontSize: 18, fontWeight: '700', color: '#374151', marginBottom: 16 },
    emptyBtn: { backgroundColor: '#16a34a', borderRadius: 14, paddingHorizontal: 24, paddingVertical: 12 },
    emptyBtnTxt: { color: '#fff', fontWeight: '700', fontSize: 15 },
    modalBg: { flex: 1, backgroundColor: '#00000055', justifyContent: 'flex-end' },
    modalCard: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, maxHeight: '70%' },
    modalTitle: { fontSize: 18, fontWeight: '800', color: '#14532d', marginBottom: 4 },
    modalSub: { fontSize: 13, color: '#6b7280', marginBottom: 16 },
    bidRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f0fdf4', borderRadius: 12, padding: 14, marginBottom: 10 },
    bidVendor: { fontSize: 14, fontWeight: '700', color: '#111827' },
    bidNote: { fontSize: 12, color: '#6b7280', marginTop: 2 },
    bidAmt: { fontSize: 16, fontWeight: '800', color: '#16a34a', marginBottom: 6 },
    acceptBtn: { backgroundColor: '#16a34a', borderRadius: 8, paddingHorizontal: 14, paddingVertical: 6 },
    acceptTxt: { color: '#fff', fontWeight: '700', fontSize: 12 },
    closeBtn: { backgroundColor: '#f0fdf4', borderRadius: 12, paddingVertical: 12, alignItems: 'center', marginTop: 8 },
    closeBtnTxt: { color: '#16a34a', fontWeight: '700', fontSize: 15 },
    cancelBtn: { backgroundColor: '#fee2e2', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 8, borderWidth: 1, borderColor: '#fca5a5' },
    cancelBtnTxt: { color: '#dc2626', fontWeight: '700', fontSize: 13 },
});
