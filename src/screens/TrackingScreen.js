import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { io } from 'socket.io-client';
import { WS_BASE } from '../config';

const STEPS = [
    { key: 'scheduled', label: 'Pickup Scheduled', icon: '📋' },
    { key: 'in_progress', label: 'On the Way', icon: '🚴' },
    { key: 'arrived', label: 'Partner Arrived', icon: '📍' },
    { key: 'completed', label: 'Pickup Complete', icon: '✅' },
];

export default function TrackingScreen({ route, navigation }) {
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
            <View style={s.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={s.back}>
                    <Text style={s.backIcon}>←</Text>
                </TouchableOpacity>
                <Text style={s.title}>Live Tracking</Text>
            </View>

            {/* Map placeholder */}
            <View style={s.mapArea}>
                <Text style={s.mapEmoji}>🗺️</Text>
                <Text style={s.mapTxt}>
                    {dpLocation
                        ? `📍 Delivery partner at ${dpLocation.lat.toFixed(4)}, ${dpLocation.lng.toFixed(4)}`
                        : 'Waiting for delivery partner location…'}
                </Text>
            </View>

            {/* Progress steps */}
            <View style={s.stepsCard}>
                <Text style={s.stepsTitle}>Pickup Progress</Text>
                {STEPS.map((step, i) => {
                    const done = i < activeIdx;
                    const current = i === activeIdx;
                    return (
                        <View key={step.key} style={s.stepRow}>
                            <View style={[s.dot, done && s.dotDone, current && s.dotCurrent]}>
                                <Text style={s.dotIcon}>{done ? '✓' : step.icon}</Text>
                            </View>
                            {i < STEPS.length - 1 && (
                                <View style={[s.line, done && s.lineDone]} />
                            )}
                            <Text style={[s.stepLabel, done && s.labelDone, current && s.labelCurrent]}>
                                {step.label}
                            </Text>
                        </View>
                    );
                })}
            </View>

            {/* Info row */}
            <View style={s.infoRow}>
                <View style={s.infoBox}>
                    <Text style={s.infoIcon}>📦</Text>
                    <Text style={s.infoLbl}>Category</Text>
                    <Text style={s.infoVal}>{sale?.categoryId?.name || '—'}</Text>
                </View>
                <View style={s.infoBox}>
                    <Text style={s.infoIcon}>⚖️</Text>
                    <Text style={s.infoLbl}>Qty</Text>
                    <Text style={s.infoVal}>{sale?.estimatedQty || '—'} kg</Text>
                </View>
                <View style={s.infoBox}>
                    <Text style={s.infoIcon}>🕐</Text>
                    <Text style={s.infoLbl}>Slot</Text>
                    <Text style={s.infoVal} numberOfLines={1}>{sale?.scheduledSlot?.split(' ')[0] || '—'}</Text>
                </View>
            </View>
        </View>
    );
}

const s = StyleSheet.create({
    root: { flex: 1, backgroundColor: '#f0fdf4' },
    header: { flexDirection: 'row', alignItems: 'center', paddingTop: 52, paddingHorizontal: 20, paddingBottom: 16, backgroundColor: '#fff', elevation: 2 },
    back: { marginRight: 14 },
    backIcon: { fontSize: 22, color: '#16a34a' },
    title: { fontSize: 18, fontWeight: '800', color: '#14532d' },
    mapArea: {
        height: 200, backgroundColor: '#dcfce7', alignItems: 'center', justifyContent: 'center',
        borderBottomWidth: 1, borderBottomColor: '#bbf7d0',
    },
    mapEmoji: { fontSize: 56, marginBottom: 8 },
    mapTxt: { fontSize: 12, color: '#4b7c58', paddingHorizontal: 24, textAlign: 'center' },
    stepsCard: { backgroundColor: '#fff', margin: 16, borderRadius: 20, padding: 20, elevation: 3 },
    stepsTitle: { fontSize: 15, fontWeight: '800', color: '#14532d', marginBottom: 16 },
    stepRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
    dot: {
        width: 36, height: 36, borderRadius: 18, backgroundColor: '#f3f4f6',
        alignItems: 'center', justifyContent: 'center', marginRight: 12,
    },
    dotDone: { backgroundColor: '#dcfce7' },
    dotCurrent: { backgroundColor: '#16a34a' },
    dotIcon: { fontSize: 16 },
    line: { position: 'absolute', left: 17, top: 36, width: 2, height: 20, backgroundColor: '#e5e7eb' },
    lineDone: { backgroundColor: '#16a34a' },
    stepLabel: { fontSize: 14, color: '#6b7280', flex: 1 },
    labelDone: { color: '#16a34a', fontWeight: '600' },
    labelCurrent: { color: '#14532d', fontWeight: '800' },
    infoRow: {
        flexDirection: 'row', marginHorizontal: 16, backgroundColor: '#fff',
        borderRadius: 16, padding: 16, justifyContent: 'space-around', elevation: 2,
    },
    infoBox: { alignItems: 'center', flex: 1 },
    infoIcon: { fontSize: 22, marginBottom: 4 },
    infoLbl: { fontSize: 11, color: '#6b7280', marginBottom: 2 },
    infoVal: { fontSize: 13, fontWeight: '700', color: '#111827' },
});
