import React, { useState, useEffect } from 'react';
import {
    View, Text, StyleSheet, TextInput, TouchableOpacity,
    ScrollView, Alert, ActivityIndicator, Modal,
} from 'react-native';
import * as SecureStore from 'expo-secure-store';
import axios from 'axios';
import { API_BASE } from '../config';

const SLOTS = ['8:00 AM - 11:00 AM', '11:00 AM - 2:00 PM', '2:00 PM - 5:00 PM', '5:00 PM - 8:00 PM'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const DEFAULT_CATEGORIES = [
    { icon: '🔩', name: 'Metal' }, { icon: '🧴', name: 'Plastic' },
    { icon: '📰', name: 'Paper' }, { icon: '💻', name: 'Electronics' },
    { icon: '🍶', name: 'Glass' }, { icon: '👗', name: 'Clothes' },
];

const daysInMonth = (m, y) => new Date(y, m + 1, 0).getDate();
const formatDisplayDate = (d, m, y) => `${String(d).padStart(2, '0')} ${MONTHS[m]} ${y}`;

// ── Pure-JS Drum Picker ───────────────────────────────────────────────────────
function Spinner({ value, items, onInc, onDec, width = 70 }) {
    return (
        <View style={{ alignItems: 'center', width }}>
            <TouchableOpacity onPress={onInc} style={sp.arrow}>
                <Text style={sp.arrowTxt}>▲</Text>
            </TouchableOpacity>
            <View style={sp.valueBox}>
                <Text style={sp.valueTxt}>{value}</Text>
            </View>
            <TouchableOpacity onPress={onDec} style={sp.arrow}>
                <Text style={sp.arrowTxt}>▼</Text>
            </TouchableOpacity>
        </View>
    );
}
const sp = StyleSheet.create({
    arrow: { padding: 10 },
    arrowTxt: { fontSize: 16, color: '#16a34a', fontWeight: '800' },
    valueBox: {
        backgroundColor: '#f0fdf4', borderRadius: 12, paddingVertical: 10,
        paddingHorizontal: 6, alignItems: 'center', borderWidth: 1.5, borderColor: '#86efac',
        minWidth: 60,
    },
    valueTxt: { fontSize: 15, fontWeight: '800', color: '#14532d', textAlign: 'center' },
});
// ─────────────────────────────────────────────────────────────────────────────

export default function CreateSaleScreen({ navigation }) {
    const now = new Date();
    const [step, setStep] = useState(1);
    const [category, setCategory] = useState(null);
    const [quantity, setQuantity] = useState('');
    const [notes, setNotes] = useState('');
    const [categories, setCategories] = useState(DEFAULT_CATEGORIES);

    // Date state
    const [day, setDay] = useState(now.getDate());
    const [month, setMonth] = useState(now.getMonth());
    const [year, setYear] = useState(now.getFullYear());
    const [showDateModal, setShowDateModal] = useState(false);

    // Slot
    const [slot, setSlot] = useState(null);

    // Address
    const [house, setHouse] = useState('');
    const [village, setVillage] = useState('');
    const [city, setCity] = useState('');
    const [state, setState] = useState('');
    const [pincode, setPincode] = useState('');

    const [loading, setLoading] = useState(false);

    useEffect(() => {
        (async () => {
            try {
                const res = await axios.get(`${API_BASE}/categories`);
                if (res.data.data?.length) {
                    setCategories(res.data.data.map(c => ({
                        icon: c.icon || '♻️', name: c.name, id: c._id, price: c.pricePerKg,
                    })));
                }
            } catch (_) { }
        })();
    }, []);

    // ── Date helpers ──────────────────────────────────────────────────────────
    const maxDay = daysInMonth(month, year);
    const incDay = () => setDay(d => d >= maxDay ? 1 : d + 1);
    const decDay = () => setDay(d => d <= 1 ? maxDay : d - 1);
    const incMonth = () => { setMonth(m => { const n = (m + 1) % 12; if (day > daysInMonth(n, year)) setDay(1); return n; }); };
    const decMonth = () => { setMonth(m => { const n = (m + 11) % 12; if (day > daysInMonth(n, year)) setDay(1); return n; }); };
    const incYear = () => setYear(y => y + 1);
    const decYear = () => setYear(y => y > now.getFullYear() ? y - 1 : y);

    const displayDate = formatDisplayDate(day, month, year);

    const getScheduledDate = () => {
        const d = new Date(year, month, day);
        d.setHours(6, 0, 0, 0);
        return d.toISOString();
    };

    const fullAddress = [house, village, city, state, pincode].filter(Boolean).join(', ');

    const submit = async () => {
        if (!category) return Alert.alert('Required', 'Please select a scrap category.');
        if (!quantity) return Alert.alert('Required', 'Enter estimated quantity.');
        if (!slot) return Alert.alert('Required', 'Please select a time slot.');
        if (!city.trim()) return Alert.alert('Required', 'Enter city/town.');
        if (pincode.length !== 6) return Alert.alert('Required', 'Enter a valid 6-digit pincode.');

        setLoading(true);
        try {
            const token = await SecureStore.getItemAsync('token');
            await axios.post(`${API_BASE}/sales`, {
                categoryId: category.id || category.name,
                estimatedQty: parseFloat(quantity),
                scheduledDate: getScheduledDate(),
                scheduledSlot: slot,
                pickupAddress: fullAddress,
                city,
                notes,
            }, { headers: { Authorization: `Bearer ${token}` } });

            Alert.alert('✅ Sale Posted!', 'Vendors will start bidding. Check My Sales.', [
                { text: 'View My Sales', onPress: () => navigation.navigate('MySales') },
                { text: 'OK', onPress: () => navigation.goBack() },
            ]);
        } catch (e) {
            Alert.alert('Error', e.response?.data?.message || 'Failed to create sale.');
        } finally { setLoading(false); }
    };

    return (
        <View style={s.root}>
            {/* Header */}
            <View style={s.header}>
                <TouchableOpacity onPress={() => step === 2 ? setStep(1) : navigation.goBack()} style={s.backBtn}>
                    <Text style={s.backIcon}>←</Text>
                </TouchableOpacity>
                <Text style={s.title}>Sell Scrap</Text>
                <View style={s.stepPill}><Text style={s.stepTxt}>Step {step}/2</Text></View>
            </View>
            <View style={s.progressBg}><View style={[s.progressBar, { width: step === 1 ? '50%' : '100%' }]} /></View>

            <ScrollView contentContainerStyle={{ padding: 20 }} keyboardShouldPersistTaps="handled">
                {step === 1 ? (
                    <>
                        <Text style={s.sectionLbl}>Select Scrap Category *</Text>
                        <View style={s.catGrid}>
                            {categories.map(c => (
                                <TouchableOpacity
                                    key={c.name} activeOpacity={0.8}
                                    style={[s.catCard, category?.name === c.name && s.catSelected]}
                                    onPress={() => setCategory(c)}
                                >
                                    <Text style={s.catIcon}>{c.icon}</Text>
                                    <Text style={[s.catName, category?.name === c.name && s.catNameSel]}>{c.name}</Text>
                                    {c.price && <Text style={s.catPrice}>~₹{c.price}/kg</Text>}
                                </TouchableOpacity>
                            ))}
                        </View>

                        <Text style={s.sectionLbl}>Estimated Quantity (kg) *</Text>
                        <TextInput
                            style={s.input} placeholder="e.g. 15" placeholderTextColor="#9ca3af"
                            value={quantity} onChangeText={setQuantity} keyboardType="decimal-pad"
                        />

                        <Text style={s.sectionLbl}>Additional Notes (optional)</Text>
                        <TextInput
                            style={[s.input, { height: 80, textAlignVertical: 'top' }]}
                            placeholder="Special instructions for vendor…"
                            placeholderTextColor="#9ca3af" value={notes}
                            onChangeText={setNotes} multiline
                        />

                        <TouchableOpacity
                            style={[s.nextBtn, !category && { opacity: 0.5 }]}
                            onPress={() => {
                                if (!category) return Alert.alert('Required', 'Select a category first.');
                                if (!quantity) return Alert.alert('Required', 'Enter estimated quantity.');
                                setStep(2);
                            }} activeOpacity={0.85}
                        >
                            <Text style={s.nextTxt}>Next: Schedule Pickup →</Text>
                        </TouchableOpacity>
                    </>
                ) : (
                    <>
                        {/* ── Date Picker ── */}
                        <Text style={s.sectionLbl}>Pickup Date *</Text>
                        <TouchableOpacity style={s.datePicker} onPress={() => setShowDateModal(true)} activeOpacity={0.8}>
                            <Text style={s.dateIcon}>📅</Text>
                            <Text style={s.dateText}>{displayDate}</Text>
                            <Text style={s.dateChevron}>›</Text>
                        </TouchableOpacity>

                        {/* ── Time Slot ── */}
                        <Text style={s.sectionLbl}>Preferred Time Slot *</Text>
                        {SLOTS.map(sl => (
                            <TouchableOpacity
                                key={sl} style={[s.slotRow, slot === sl && s.slotSelected]}
                                onPress={() => setSlot(sl)} activeOpacity={0.8}
                            >
                                <Text style={s.slotIcon}>{slot === sl ? '🔘' : '⚪'}</Text>
                                <Text style={[s.slotTxt, slot === sl && { color: '#16a34a', fontWeight: '700' }]}>{sl}</Text>
                            </TouchableOpacity>
                        ))}

                        {/* ── Address ── */}
                        <Text style={[s.sectionLbl, { marginTop: 22 }]}>Pickup Address *</Text>

                        <Text style={s.fieldLbl}>House / Flat / Street</Text>
                        <TextInput style={s.input} placeholder="e.g. 12B, Gandhi Nagar"
                            placeholderTextColor="#9ca3af" value={house} onChangeText={setHouse} />

                        <Text style={s.fieldLbl}>Village / Colony / Area</Text>
                        <TextInput style={s.input} placeholder="e.g. Bichpuri, Bodla Road"
                            placeholderTextColor="#9ca3af" value={village} onChangeText={setVillage} />

                        <View style={s.row}>
                            <View style={{ flex: 1, marginRight: 8 }}>
                                <Text style={s.fieldLbl}>City / Town *</Text>
                                <TextInput style={s.input} placeholder="Agra"
                                    placeholderTextColor="#9ca3af" value={city} onChangeText={setCity} />
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={s.fieldLbl}>Pincode *</Text>
                                <TextInput style={s.input} placeholder="283105"
                                    placeholderTextColor="#9ca3af" value={pincode}
                                    onChangeText={t => setPincode(t.replace(/\D/g, '').slice(0, 6))}
                                    keyboardType="number-pad" maxLength={6} />
                            </View>
                        </View>

                        <Text style={s.fieldLbl}>State</Text>
                        <TextInput style={s.input} placeholder="Uttar Pradesh"
                            placeholderTextColor="#9ca3af" value={state} onChangeText={setState} />

                        {fullAddress.length > 3 && (
                            <View style={s.addrPreview}>
                                <Text style={s.addrPreviewLbl}>📍 Preview:</Text>
                                <Text style={s.addrPreviewTxt}>{fullAddress}</Text>
                            </View>
                        )}

                        <TouchableOpacity style={s.submitBtn} onPress={submit} disabled={loading} activeOpacity={0.85}>
                            {loading ? <ActivityIndicator color="#fff" /> : <Text style={s.nextTxt}>📦 Post Sale for Bidding</Text>}
                        </TouchableOpacity>
                    </>
                )}
            </ScrollView>

            {/* ── Date Picker Modal ── */}
            <Modal visible={showDateModal} transparent animationType="slide">
                <View style={s.modalBg}>
                    <View style={s.modalCard}>
                        <Text style={s.modalTitle}>📅 Select Pickup Date</Text>
                        <View style={s.spinnerRow}>
                            <View style={{ alignItems: 'center' }}>
                                <Text style={s.spinnerLbl}>Day</Text>
                                <Spinner value={String(day).padStart(2, '0')} onInc={incDay} onDec={decDay} />
                            </View>
                            <View style={s.spinnerDivider} />
                            <View style={{ alignItems: 'center' }}>
                                <Text style={s.spinnerLbl}>Month</Text>
                                <Spinner value={MONTHS[month]} onInc={incMonth} onDec={decMonth} width={80} />
                            </View>
                            <View style={s.spinnerDivider} />
                            <View style={{ alignItems: 'center' }}>
                                <Text style={s.spinnerLbl}>Year</Text>
                                <Spinner value={String(year)} onInc={incYear} onDec={decYear} width={80} />
                            </View>
                        </View>

                        {/* Quick picks */}
                        <View style={s.quickRow}>
                            {[['Today', 0], ['Tomorrow', 1], ['+3 Days', 3], ['+7 Days', 7]].map(([lbl, add]) => (
                                <TouchableOpacity key={lbl} style={s.quickBtn}
                                    onPress={() => {
                                        const t = new Date(); t.setDate(t.getDate() + add);
                                        setDay(t.getDate()); setMonth(t.getMonth()); setYear(t.getFullYear());
                                    }}>
                                    <Text style={s.quickTxt}>{lbl}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        <TouchableOpacity style={s.confirmBtn} onPress={() => setShowDateModal(false)}>
                            <Text style={s.confirmTxt}>✓ Confirm — {displayDate}</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const s = StyleSheet.create({
    root: { flex: 1, backgroundColor: '#f0fdf4' },
    header: { flexDirection: 'row', alignItems: 'center', paddingTop: 52, paddingHorizontal: 20, paddingBottom: 12, backgroundColor: '#fff', elevation: 2 },
    backBtn: { marginRight: 12, padding: 4 },
    backIcon: { fontSize: 22, color: '#16a34a' },
    title: { flex: 1, fontSize: 18, fontWeight: '800', color: '#14532d' },
    stepPill: { backgroundColor: '#dcfce7', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20 },
    stepTxt: { color: '#16a34a', fontWeight: '700', fontSize: 12 },
    progressBg: { height: 4, backgroundColor: '#d1fae5' },
    progressBar: { height: 4, backgroundColor: '#16a34a', borderRadius: 2 },
    sectionLbl: { fontSize: 14, fontWeight: '700', color: '#374151', marginBottom: 10, marginTop: 18 },
    fieldLbl: { fontSize: 12, fontWeight: '600', color: '#6b7280', marginBottom: 5, marginTop: 10 },
    catGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
    catCard: { width: '30%', borderRadius: 14, padding: 12, alignItems: 'center', backgroundColor: '#fff', borderWidth: 1.5, borderColor: '#d1fae5', elevation: 1 },
    catSelected: { borderColor: '#16a34a', backgroundColor: '#dcfce7' },
    catIcon: { fontSize: 28, marginBottom: 4 },
    catName: { fontSize: 12, fontWeight: '600', color: '#374151', textAlign: 'center' },
    catNameSel: { color: '#15803d', fontWeight: '800' },
    catPrice: { fontSize: 10, color: '#6b7280', marginTop: 2 },
    input: { backgroundColor: '#fff', borderRadius: 12, padding: 14, fontSize: 15, color: '#111827', borderWidth: 1.5, borderColor: '#d1fae5', marginBottom: 2 },
    datePicker: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 12, padding: 15, borderWidth: 1.5, borderColor: '#16a34a', elevation: 1 },
    dateIcon: { fontSize: 18, marginRight: 10 },
    dateText: { flex: 1, fontSize: 15, fontWeight: '700', color: '#14532d' },
    dateChevron: { fontSize: 22, color: '#16a34a', fontWeight: '700' },
    slotRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 12, padding: 14, marginBottom: 8, borderWidth: 1.5, borderColor: '#d1fae5' },
    slotSelected: { borderColor: '#16a34a', backgroundColor: '#f0fdf4' },
    slotIcon: { fontSize: 16, marginRight: 10 },
    slotTxt: { fontSize: 14, color: '#374151', fontWeight: '500' },
    row: { flexDirection: 'row', alignItems: 'flex-end' },
    addrPreview: { backgroundColor: '#dcfce7', borderRadius: 10, padding: 12, marginTop: 12, borderWidth: 1, borderColor: '#86efac' },
    addrPreviewLbl: { fontSize: 11, fontWeight: '700', color: '#15803d', marginBottom: 3 },
    addrPreviewTxt: { fontSize: 13, color: '#14532d', lineHeight: 18 },
    nextBtn: { backgroundColor: '#16a34a', borderRadius: 14, paddingVertical: 15, alignItems: 'center', marginTop: 24, elevation: 5, shadowColor: '#16a34a', shadowOpacity: 0.3, shadowRadius: 8 },
    submitBtn: { backgroundColor: '#15803d', borderRadius: 14, paddingVertical: 15, alignItems: 'center', marginTop: 24, marginBottom: 16, elevation: 5 },
    nextTxt: { color: '#fff', fontWeight: '800', fontSize: 16 },
    // Modal
    modalBg: { flex: 1, backgroundColor: '#00000060', justifyContent: 'flex-end' },
    modalCard: { backgroundColor: '#fff', borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24 },
    modalTitle: { fontSize: 18, fontWeight: '800', color: '#14532d', marginBottom: 20, textAlign: 'center' },
    spinnerRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginBottom: 20, gap: 8 },
    spinnerLbl: { fontSize: 11, fontWeight: '700', color: '#6b7280', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 },
    spinnerDivider: { width: 1, height: 80, backgroundColor: '#d1fae5', marginHorizontal: 4 },
    quickRow: { flexDirection: 'row', gap: 8, marginBottom: 20, flexWrap: 'wrap' },
    quickBtn: { backgroundColor: '#f0fdf4', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8, borderWidth: 1.5, borderColor: '#86efac' },
    quickTxt: { color: '#16a34a', fontWeight: '700', fontSize: 12 },
    confirmBtn: { backgroundColor: '#16a34a', borderRadius: 14, paddingVertical: 14, alignItems: 'center', elevation: 3 },
    confirmTxt: { color: '#fff', fontWeight: '800', fontSize: 15 },
});
