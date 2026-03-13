import React, { useState, useEffect, useCallback } from 'react';
import {
    View, Text, StyleSheet, FlatList, TouchableOpacity,
    ActivityIndicator, RefreshControl, Alert, Modal, Image, Dimensions, ScrollView
} from 'react-native';
import * as SecureStore from 'expo-secure-store';
import axios from 'axios';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { API_BASE } from '../config';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';

const { width } = Dimensions.get('window');

const STATUS_COLOR = {
    open: '#10b981', 
    bidding: '#3b82f6', 
    accepted: '#8b5cf6', 
    booked: '#6366f1', 
    completed: '#10b981', 
    cancelled: '#ef4444',
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
    return dt.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};

const formatSlot = (slot) => SLOT_LABELS[slot] || slot || '—';

export default function MySalesScreen({ navigation }) {
    const { colors, isDarkMode } = useTheme();
    const { t } = useLanguage();
    const s = getStyles(colors, isDarkMode);

    const [sales, setSales] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [detailModal, setDetailModal] = useState(null);

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

    const cancelSale = (saleId) => {
        Alert.alert(
            '❌ Cancel Sale',
            'Are you sure you want to cancel this request?',
            [
                { text: 'No', style: 'cancel' },
                {
                    text: 'Yes, Cancel', style: 'destructive',
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

    if (loading && !refreshing) {
        return (
            <View style={s.center}>
                <ActivityIndicator size="large" color={colors.primary} />
            </View>
        );
    }

    return (
        <View style={s.root}>
            {/* Premium Header */}
            <LinearGradient
                colors={isDarkMode ? ['#064e3b', '#0a1910'] : ['#16a34a', '#10b981']}
                style={s.header}
            >
                <View style={s.headerTop}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
                        <MaterialCommunityIcons name="chevron-left" size={32} color="#fff" />
                    </TouchableOpacity>
                    <Text style={s.headerTitle}>{t.mySales}</Text>
                    <TouchableOpacity style={s.addBtn} onPress={() => navigation.navigate('CreateSale')}>
                        <MaterialCommunityIcons name="plus" size={24} color="#fff" />
                    </TouchableOpacity>
                </View>
            </LinearGradient>

            <FlatList
                data={sales}
                keyExtractor={i => i._id}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
                contentContainerStyle={s.list}
                ListEmptyComponent={
                    <View style={s.empty}>
                        <LinearGradient colors={[colors.primary + '20', colors.primary + '05']} style={s.emptyIconBg}>
                            <MaterialCommunityIcons name="package-variant" size={60} color={colors.primary} />
                        </LinearGradient>
                        <Text style={s.emptyTxt}>No active sales found</Text>
                        <TouchableOpacity style={s.emptyBtn} onPress={() => navigation.navigate('CreateSale')}>
                            <Text style={s.emptyBtnTxt}>Post New Sale</Text>
                        </TouchableOpacity>
                    </View>
                }
                renderItem={({ item: sale }) => {
                    const firstImage = sale.images?.[0];
                    const statusClr = STATUS_COLOR[sale.status] || '#6b7280';
                    return (
                        <TouchableOpacity 
                            style={[s.card, { backgroundColor: colors.card }]} 
                            activeOpacity={0.9} 
                            onPress={() => setDetailModal(sale)}
                        >
                            <View style={s.cardInner}>
                                <View style={s.imgContainer}>
                                    {firstImage ? (
                                        <Image source={{ uri: firstImage }} style={s.cardImg} />
                                    ) : (
                                        <View style={[s.cardImg, s.placeholderImg]}>
                                            <MaterialCommunityIcons name="camera-off" size={30} color={colors.subText} />
                                        </View>
                                    )}
                                    <View style={[s.badge, { backgroundColor: statusClr }]}>
                                        <Text style={s.badgeText}>{sale.status?.toUpperCase()}</Text>
                                    </View>
                                </View>

                                <View style={s.cardBody}>
                                    <Text style={s.categoryName} numberOfLines={1}>
                                        {sale.categories?.map(c => c.name).join(', ') || 'Scrap Sale'}
                                    </Text>
                                    
                                    <View style={s.infoRow}>
                                        <MaterialCommunityIcons name="weight-kilogram" size={14} color={colors.primary} />
                                        <Text style={s.infoText}>{sale.estimatedQuantity ?? '?'} kg</Text>
                                    </View>
                                    
                                    <View style={s.infoRow}>
                                        <MaterialCommunityIcons name="calendar-clock" size={14} color={colors.subText} />
                                        <Text style={s.infoText}>{formatDate(sale.scheduledDate)}</Text>
                                    </View>

                                    <View style={s.infoRow}>
                                        <MaterialCommunityIcons name="map-marker-outline" size={14} color={colors.subText} />
                                        <Text style={s.infoText} numberOfLines={1}>{sale.city || 'Location N/A'}</Text>
                                    </View>
                                </View>
                                
                                <View style={s.arrowBtn}>
                                    <MaterialCommunityIcons name="chevron-right" size={24} color={colors.border} />
                                </View>
                            </View>
                        </TouchableOpacity>
                    );
                }}
            />

            {/* Detail Modal Redesign */}
            <Modal visible={!!detailModal} animationType="fade" transparent>
                <View style={s.modalOverlay}>
                    <View style={[s.modalContent, { backgroundColor: colors.card }]}>
                        {detailModal && (
                            <>
                                <View style={s.modalHeader}>
                                    <Text style={s.modalHeaderTitle}>Sale Details</Text>
                                    <TouchableOpacity onPress={() => setDetailModal(null)}>
                                        <MaterialCommunityIcons name="close" size={24} color={colors.text} />
                                    </TouchableOpacity>
                                </View>

                                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.modalScroll}>
                                    {detailModal.images?.length > 0 ? (
                                        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.modalGallery}>
                                            {detailModal.images.map((img, idx) => (
                                                <Image key={idx} source={{ uri: img }} style={s.modalImg} />
                                            ))}
                                        </ScrollView>
                                    ) : (
                                        <View style={s.modalNoImg}>
                                            <MaterialCommunityIcons name="image-off-outline" size={50} color={colors.subText} />
                                            <Text style={{ color: colors.subText, marginTop: 10 }}>No images attached</Text>
                                        </View>
                                    )}

                                    <Text style={s.modalCategory}>
                                        {detailModal.categories?.map(c => c.name).join(', ') || 'Scrap Items'}
                                    </Text>

                                    <View style={s.detailGrid}>
                                        <DetailItem icon="scale" label="Estimated Qty" value={`${detailModal.estimatedQuantity || '?'} kg`} colors={colors} s={s} />
                                        <DetailItem icon="calendar-outline" label="Pickup Date" value={formatDate(detailModal.scheduledDate)} colors={colors} s={s} />
                                        <DetailItem icon="clock-outline" label="Time Slot" value={formatSlot(detailModal.scheduledSlot)} colors={colors} s={s} />
                                        <DetailItem icon="map-marker-radius" label="City" value={detailModal.city || 'N/A'} colors={colors} s={s} />
                                    </View>

                                    <View style={s.addressBlock}>
                                        <Text style={s.addressLabel}>Pickup Address</Text>
                                        <Text style={s.addressContent}>{detailModal.pickupAddress}</Text>
                                    </View>

                                    {detailModal.notes && (
                                        <View style={s.addressBlock}>
                                            <Text style={s.addressLabel}>Additional Notes</Text>
                                            <Text style={s.addressContent}>{detailModal.notes}</Text>
                                        </View>
                                    )}

                                    <View style={s.modalActionRow}>
                                        {['open', 'booked'].includes(detailModal.status) && (
                                            <TouchableOpacity style={s.modalCancelBtn} onPress={() => { setDetailModal(null); cancelSale(detailModal._id); }}>
                                                <MaterialCommunityIcons name="trash-can-outline" size={20} color="#ef4444" />
                                                <Text style={s.modalCancelText}>Cancel Pickup</Text>
                                            </TouchableOpacity>
                                        )}
                                        {['confirmed', 'in_progress'].includes(detailModal.status) && (
                                            <TouchableOpacity style={s.modalTrackBtn} onPress={() => { setDetailModal(null); navigation.navigate('Tracking', { sale: detailModal }); }}>
                                                <MaterialCommunityIcons name="map-marker-path" size={20} color="#fff" />
                                                <Text style={s.modalTrackText}>Track Pickup</Text>
                                            </TouchableOpacity>
                                        )}
                                        {detailModal.status === 'completed' && (
                                            <TouchableOpacity style={s.modalRateBtn} onPress={() => { setDetailModal(null); navigation.navigate('Feedback', { saleId: detailModal._id }); }}>
                                                <MaterialCommunityIcons name="star-outline" size={20} color="#fff" />
                                                <Text style={s.modalRateText}>Rate Experience</Text>
                                            </TouchableOpacity>
                                        )}
                                    </View>
                                </ScrollView>
                            </>
                        )}
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const DetailItem = ({ icon, label, value, colors, s }) => (
    <View style={s.gridItem}>
        <View style={s.gridIcon}>
            <MaterialCommunityIcons name={icon} size={20} color={colors.primary} />
        </View>
        <View>
            <Text style={s.gridLabel}>{label}</Text>
            <Text style={s.gridValue}>{value}</Text>
        </View>
    </View>
);

const s = StyleSheet.create({}); // Placeholder to satisfy compiler, replaced below

const getStyles = (colors, isDark) => StyleSheet.create({
    root: { flex: 1, backgroundColor: colors.background },
    center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background },
    header: {
        paddingTop: 56,
        paddingBottom: 24,
        paddingHorizontal: 20,
        borderBottomLeftRadius: 30,
        borderBottomRightRadius: 30,
    },
    headerTop: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
    headerTitle: { fontSize: 20, fontWeight: '800', color: '#fff' },
    addBtn: {
        width: 40, height: 40, borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.2)',
        alignItems: 'center', justifyContent: 'center',
    },
    list: { padding: 20, paddingBottom: 110 },
    card: {
        borderRadius: 24,
        marginBottom: 16,
        elevation: 4,
        shadowColor: '#000',
        shadowOpacity: 0.06,
        shadowRadius: 10,
        borderWidth: 1,
        borderColor: colors.border,
        overflow: 'hidden',
    },
    cardInner: { flexDirection: 'row', padding: 12, alignItems: 'center' },
    imgContainer: { position: 'relative' },
    cardImg: { width: 90, height: 90, borderRadius: 16 },
    placeholderImg: { backgroundColor: colors.inputBg, alignItems: 'center', justifyContent: 'center' },
    badge: {
        position: 'absolute', top: -5, left: -5,
        paddingHorizontal: 8, paddingVertical: 4,
        borderRadius: 8, elevation: 2,
    },
    badgeText: { color: '#fff', fontSize: 8, fontWeight: '900' },
    cardBody: { flex: 1, marginLeft: 16, justifyContent: 'center' },
    categoryName: { fontSize: 16, fontWeight: '800', color: colors.text, marginBottom: 6 },
    infoRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
    infoText: { fontSize: 12, color: colors.subText, fontWeight: '600' },
    arrowBtn: { padding: 4 },
    
    empty: { alignItems: 'center', marginTop: 100 },
    emptyIconBg: {
        width: 120, height: 120, borderRadius: 60,
        alignItems: 'center', justifyContent: 'center', marginBottom: 20,
    },
    emptyTxt: { fontSize: 18, fontWeight: '800', color: colors.text, marginBottom: 12 },
    emptyBtn: {
        backgroundColor: colors.primary,
        paddingHorizontal: 30, paddingVertical: 14,
        borderRadius: 16, elevation: 3,
    },
    emptyBtnTxt: { color: '#fff', fontWeight: '800', fontSize: 15 },

    // Modal Styles
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
    modalContent: {
        borderTopLeftRadius: 40, borderTopRightRadius: 40,
        maxHeight: '85%', paddingHorizontal: 24, paddingBottom: 34,
    },
    modalHeader: {
        flexDirection: 'row', justifyContent: 'space-between',
        alignItems: 'center', paddingVertical: 24,
        borderBottomWidth: 1, borderBottomColor: colors.border,
    },
    modalHeaderTitle: { fontSize: 18, fontWeight: '800', color: colors.text },
    modalScroll: { paddingTop: 20 },
    modalGallery: { marginBottom: 20 },
    modalImg: { width: 280, height: 180, borderRadius: 24, marginRight: 12 },
    modalNoImg: {
        width: '100%', height: 150, borderRadius: 24,
        backgroundColor: colors.inputBg, borderStyle: 'dashed', borderWidth: 2, borderColor: colors.border,
        alignItems: 'center', justifyContent: 'center', marginBottom: 20,
    },
    modalCategory: { fontSize: 22, fontWeight: '800', color: colors.text, marginBottom: 24 },
    detailGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 16, marginBottom: 24 },
    gridItem: {
        width: (width - 64) / 2, flexDirection: 'row',
        alignItems: 'center', gap: 10,
    },
    gridIcon: {
        width: 36, height: 36, borderRadius: 10,
        backgroundColor: colors.iconBg, alignItems: 'center', justifyContent: 'center',
    },
    gridLabel: { fontSize: 10, color: colors.subText, fontWeight: '700', textTransform: 'uppercase' },
    gridValue: { fontSize: 14, fontWeight: '700', color: colors.text },

    addressBlock: {
        backgroundColor: colors.inputBg, borderRadius: 20,
        padding: 16, marginBottom: 20,
    },
    addressLabel: { fontSize: 12, fontWeight: '800', color: colors.primary, marginBottom: 6 },
    addressContent: { fontSize: 14, color: colors.text, lineHeight: 20 },

    modalActionRow: { marginTop: 10, gap: 12 },
    modalCancelBtn: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        gap: 10, paddingVertical: 16, borderRadius: 18,
        borderWidth: 1.5, borderColor: '#ef4444',
    },
    modalCancelText: { color: '#ef4444', fontWeight: '800', fontSize: 15 },
    modalTrackBtn: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        gap: 10, paddingVertical: 16, borderRadius: 18,
        backgroundColor: colors.primary, elevation: 3,
    },
    modalTrackText: { color: '#fff', fontWeight: '800', fontSize: 15 },
    modalRateBtn: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        gap: 10, paddingVertical: 16, borderRadius: 18,
        backgroundColor: '#f59e0b', elevation: 3,
    },
    modalRateText: { color: '#fff', fontWeight: '800', fontSize: 15 },
});

