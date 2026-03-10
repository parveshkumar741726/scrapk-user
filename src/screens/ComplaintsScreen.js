import React, { useState } from 'react';
import {
    View, Text, StyleSheet, TextInput, TouchableOpacity,
    ScrollView, ActivityIndicator, Alert,
} from 'react-native';
import * as SecureStore from 'expo-secure-store';
import axios from 'axios';
import { API_BASE } from '../config';

const TYPES = ['Pickup Issue', 'Wrong Quantity', 'Payment Problem', 'Vendor Misconduct', 'App Bug', 'Other'];

export default function ComplaintsScreen({ navigation }) {
    const [type, setType] = useState(null);
    const [subject, setSubject] = useState('');
    const [desc, setDesc] = useState('');
    const [loading, setLoading] = useState(false);

    const submit = async () => {
        if (!type) return Alert.alert('Required', 'Please select a complaint type.');
        if (!subject) return Alert.alert('Required', 'Please enter a subject.');
        if (desc.length < 20) return Alert.alert('Required', 'Please describe the issue (min 20 characters).');

        setLoading(true);
        try {
            const token = await SecureStore.getItemAsync('token');
            await axios.post(`${API_BASE}/complaints`, { type, subject, description: desc }, {
                headers: { Authorization: `Bearer ${token}` },
            });
            Alert.alert('✅ Complaint Registered', 'Our team will review and contact you within 24 hours.', [
                { text: 'OK', onPress: () => navigation.goBack() },
            ]);
        } catch (e) {
            Alert.alert('Error', e.response?.data?.message || 'Failed to submit complaint.');
        } finally { setLoading(false); }
    };

    return (
        <ScrollView style={s.root} contentContainerStyle={s.content} keyboardShouldPersistTaps="handled">
            <View style={s.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={s.back}>
                    <Text style={s.backIcon}>←</Text>
                </TouchableOpacity>
                <Text style={s.title}>🗣️ File a Complaint</Text>
            </View>

            <View style={s.infoCard}>
                <Text style={s.infoTxt}>📞 Our support team responds within 24 hours. For urgent issues, call 1800-XXX-XXXX.</Text>
            </View>

            <Text style={s.label}>Complaint Type *</Text>
            <View style={s.typeGrid}>
                {TYPES.map(t => (
                    <TouchableOpacity key={t} style={[s.typeChip, type === t && s.typeChipSel]} onPress={() => setType(t)} activeOpacity={0.8}>
                        <Text style={[s.typeChipTxt, type === t && s.typeChipTxtSel]}>{t}</Text>
                    </TouchableOpacity>
                ))}
            </View>

            <Text style={s.label}>Subject *</Text>
            <TextInput style={s.input} placeholder="Brief subject…" placeholderTextColor="#9ca3af" value={subject} onChangeText={setSubject} />

            <Text style={s.label}>Describe the Issue *</Text>
            <TextInput
                style={[s.input, { height: 120, textAlignVertical: 'top' }]}
                placeholder="Tell us what happened in detail…"
                placeholderTextColor="#9ca3af" value={desc} onChangeText={setDesc} multiline
            />
            <Text style={[s.charCount, desc.length < 20 && { color: '#ef4444' }]}>{desc.length}/20 min characters</Text>

            <TouchableOpacity style={s.btn} onPress={submit} disabled={loading} activeOpacity={0.85}>
                {loading ? <ActivityIndicator color="#fff" /> : <Text style={s.btnTxt}>Submit Complaint</Text>}
            </TouchableOpacity>
        </ScrollView>
    );
}

const s = StyleSheet.create({
    root: { flex: 1, backgroundColor: '#f0fdf4' },
    content: { padding: 20, paddingBottom: 40 },
    header: { flexDirection: 'row', alignItems: 'center', paddingTop: 40, marginBottom: 20 },
    back: { marginRight: 12 },
    backIcon: { fontSize: 24, color: '#16a34a' },
    title: { fontSize: 20, fontWeight: '800', color: '#14532d' },
    infoCard: { backgroundColor: '#dcfce7', borderRadius: 14, padding: 14, marginBottom: 20, borderWidth: 1, borderColor: '#86efac' },
    infoTxt: { fontSize: 13, color: '#166534', lineHeight: 20 },
    label: { fontSize: 14, fontWeight: '700', color: '#374151', marginBottom: 10, marginTop: 16 },
    typeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    typeChip: {
        paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
        backgroundColor: '#fff', borderWidth: 1.5, borderColor: '#d1fae5',
    },
    typeChipSel: { backgroundColor: '#16a34a', borderColor: '#16a34a' },
    typeChipTxt: { fontSize: 13, color: '#374151', fontWeight: '600' },
    typeChipTxtSel: { color: '#fff' },
    input: {
        backgroundColor: '#fff', borderRadius: 14, padding: 14, fontSize: 14,
        color: '#111827', borderWidth: 1.5, borderColor: '#d1fae5', marginBottom: 4,
    },
    charCount: { fontSize: 12, color: '#6b7280', textAlign: 'right', marginBottom: 8 },
    btn: {
        backgroundColor: '#16a34a', borderRadius: 14, paddingVertical: 15,
        alignItems: 'center', marginTop: 20, elevation: 5,
        shadowColor: '#16a34a', shadowOpacity: 0.3, shadowRadius: 8,
    },
    btnTxt: { color: '#fff', fontWeight: '800', fontSize: 16 },
});
