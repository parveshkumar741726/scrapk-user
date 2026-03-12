import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Dimensions } from 'react-native';
import { io } from 'socket.io-client';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { WS_BASE } from '../config';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';

const STEPS = [
    { key: 'scheduled', label: 'Pickup Scheduled', icon: 'clipboard-text-clock-outline' },
    { key: 'in_progress', label: 'Partner on Way', icon: 'moped' },
    { key: 'arrived', label: 'Partner Arrived', icon: 'map-marker-check' },
    { key: 'completed', label: 'Pickup Complete', icon: 'check-decagram' },
];

export default function TrackingScreen({ route, navigation }) {
    const { colors, isDarkMode } = useTheme();
    const { t } = useLanguage();
    const s = getStyles(colors, isDarkMode);

    const { sale } = route.params || {};
    const [status, setStatus] = useState(sale?.status || 'scheduled');
    const [dpLocation, setDpLocation] = useState(null);
    const socketRef = useRef(null);

    useEffect(() => {
        const socket = io(`${WS_BASE}/tracking`, { transports: ['websocket'] });
        socketRef.current = socket;

        socket.on('connect', () => {
            if (sale?._id) socket.emit('join_booking', { bookingId: sale._id });
        });
        socket.on('location_update', ({ lat, lng }) => setDpLocation({ lat, lng }));
        socket.on('status_update', ({ status: s }) => setStatus(s));

        return () => socket.disconnect();
    }, []);

    const activeIdx = STEPS.findIndex(s => s.key === status);

    return (
        <View style={s.root}>
            <LinearGradient
                colors={isDarkMode ? ['#064e3b', '#0a1910'] : ['#16a34a', '#10b981']}
                style={s.header}
            >
                <View style={s.headerContent}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
                        <MaterialCommunityIcons name="chevron-left" size={28} color="#fff" />
                    </TouchableOpacity>
                    <Text style={s.headerTitle}>{t.track}</Text>
                    <TouchableOpacity style={s.helpBtn}>
                        <MaterialCommunityIcons name="help-circle-outline" size={24} color="#fff" />
                    </TouchableOpacity>
                </View>
            </LinearGradient>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.content}>
                {/* Visual Map Placeholder */}
                <View style={s.mapContainer}>
                    <LinearGradient
                        colors={isDarkMode ? ['#1e293b', '#0f172a'] : ['#f8fafc', '#f1f5f9']}
                        style={s.mapArea}
                    >
                        <MaterialCommunityIcons name="map-marker-radius" size={60} color={colors.primary} />
                        <Text style={s.mapTxt}>
                            {dpLocation
                                ? `Partner is located at ${dpLocation.lat.toFixed(4)}, ${dpLocation.lng.toFixed(4)}`
                                : 'Awaiting delivery partner location update…'}
                        </Text>
                    </LinearGradient>
                    <View style={s.dpCard}>
                        <View style={s.avatarBox}>
                            <MaterialCommunityIcons name="account-tie" size={32} color="#fff" />
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={s.dpName}>Pickup Partner</Text>
                            <Text style={s.dpStatus}>{status === 'in_progress' ? 'Coming to you' : 'Assignment Pending'}</Text>
                        </View>
                        <TouchableOpacity style={s.callBtn}>
                            <MaterialCommunityIcons name="phone" size={22} color="#fff" />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Tracking Timeline */}
                <View style={s.trackingCard}>
                    <Text style={s.cardTitle}>Status Updates</Text>
                    {STEPS.map((step, i) => {
                        const isDone = i < activeIdx;
                        const isCurrent = i === activeIdx;
                        const isLast = i === STEPS.length - 1;

                        return (
                            <View key={step.key} style={s.stepRow}>
                                <View style={s.timelineCol}>
                                    <View style={[
                                        s.dot, 
                                        isDone && s.dotDone, 
                                        isCurrent && s.dotCurrent
                                    ]}>
                                        <MaterialCommunityIcons 
                                            name={isDone ? "check" : step.icon} 
                                            size={isDone ? 18 : 20} 
                                            color={isCurrent || isDone ? "#fff" : colors.subText} 
                                        />
                                    </View>
                                    {!isLast && (
                                        <View style={[s.line, isDone && s.lineDone]} />
                                    )}
                                </View>
                                <View style={s.stepContent}>
                                    <Text style={[
                                        s.stepLabel, 
                                        isDone && s.labelDone, 
                                        isCurrent && s.labelCurrent
                                    ]}>
                                        {step.label}
                                    </Text>
                                    <Text style={s.stepTime}>
                                        {isDone ? 'Completed' : (isCurrent ? 'Now' : 'Upcoming')}
                                    </Text>
                                </View>
                            </View>
                        );
                    })}
                </View>

                {/* Details Section */}
                <View style={s.infoSection}>
                    <Text style={s.sectionTitle}>Pickup Details</Text>
                    <View style={s.infoGrid}>
                        <View style={s.infoBox}>
                            <MaterialCommunityIcons name="package-variant" size={24} color={colors.primary} />
                            <Text style={s.infoLbl}>Category</Text>
                            <Text style={s.infoVal} numberOfLines={1}>{sale?.categoryId?.name || '—'}</Text>
                        </View>
                        <View style={s.infoBox}>
                            <MaterialCommunityIcons name="weight-kilogram" size={24} color={colors.primary} />
                            <Text style={s.infoLbl}>Est. Weight</Text>
                            <Text style={s.infoVal}>{sale?.estimatedQty || '—'} kg</Text>
                        </View>
                        <View style={s.infoBox}>
                            <MaterialCommunityIcons name="clock-outline" size={24} color={colors.primary} />
                            <Text style={s.infoLbl}>Time Slot</Text>
                            <Text style={s.infoVal} numberOfLines={1}>{sale?.scheduledSlot?.split(' ')[0] || '—'}</Text>
                        </View>
                    </View>
                </View>
            </ScrollView>
        </View>
    );
}

const getStyles = (colors, isDark) => StyleSheet.create({
    root: { flex: 1, backgroundColor: colors.background },
    header: { 
        paddingTop: 52, 
        paddingBottom: 20, 
        paddingHorizontal: 20, 
        borderBottomLeftRadius: 32, 
        borderBottomRightRadius: 32,
        elevation: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8
    },
    headerContent: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    backBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center', borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.15)' },
    headerTitle: { fontSize: 18, fontWeight: '800', color: '#fff' },
    helpBtn: { padding: 4 },
    
    content: { paddingBottom: 40 },
    mapContainer: { margin: 20, marginBottom: 10 },
    mapArea: {
        height: 220, borderRadius: 32, alignItems: 'center', justifyContent: 'center',
        borderWidth: 1.5, borderColor: colors.border, padding: 30,
    },
    mapTxt: { fontSize: 13, color: colors.subText, textAlign: 'center', marginTop: 12, fontWeight: '600', lineHeight: 20 },
    dpCard: {
        backgroundColor: colors.card, marginHorizontal: 16, marginTop: -40,
        borderRadius: 24, padding: 16, flexDirection: 'row', alignItems: 'center',
        elevation: 8, shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 12,
        gap: 12, borderWidth: 1, borderColor: colors.border
    },
    avatarBox: { width: 50, height: 50, borderRadius: 25, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
    dpName: { fontSize: 16, fontWeight: '800', color: colors.text },
    dpStatus: { fontSize: 12, color: colors.primary, fontWeight: '700', marginTop: 2 },
    callBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#10b981', alignItems: 'center', justifyContent: 'center' },
    
    trackingCard: { backgroundColor: colors.card, margin: 20, borderRadius: 32, padding: 24, elevation: 4, shadowColor: colors.primary, shadowOpacity: 0.05, shadowRadius: 15, borderWidth: 1, borderColor: colors.border },
    cardTitle: { fontSize: 18, fontWeight: '900', color: colors.text, marginBottom: 24 },
    stepRow: { flexDirection: 'row', gap: 16, height: 70 },
    timelineCol: { alignItems: 'center', width: 40 },
    dot: {
        width: 36, height: 36, borderRadius: 18, backgroundColor: colors.inputBg,
        alignItems: 'center', justifyContent: 'center', zIndex: 2,
        borderWidth: 2, borderColor: colors.border
    },
    dotDone: { backgroundColor: colors.primary, borderColor: colors.primary },
    dotCurrent: { backgroundColor: colors.primary, borderColor: colors.primary, elevation: 4, shadowColor: colors.primary },
    line: { width: 3, flex: 1, backgroundColor: colors.border, marginTop: -4, marginBottom: -4 },
    lineDone: { backgroundColor: colors.primary },
    stepContent: { flex: 1, paddingTop: 4 },
    stepLabel: { fontSize: 15, color: colors.subText, fontWeight: '700' },
    labelDone: { color: colors.primary },
    labelCurrent: { color: colors.text, fontWeight: '900' },
    stepTime: { fontSize: 12, color: colors.subText, marginTop: 4, fontWeight: '600' },
    
    infoSection: { paddingHorizontal: 20 },
    sectionTitle: { fontSize: 16, fontWeight: '800', color: colors.text, marginBottom: 16, marginLeft: 4 },
    infoGrid: { flexDirection: 'row', gap: 12 },
    infoBox: { 
        flex: 1, backgroundColor: colors.card, borderRadius: 24, padding: 16, 
        alignItems: 'center', borderWidth: 1.5, borderColor: colors.border, gap: 4
    },
    infoLbl: { fontSize: 11, color: colors.subText, fontWeight: '700', marginTop: 4 },
    infoVal: { fontSize: 14, fontWeight: '800', color: colors.text, textAlign: 'center' },
});

