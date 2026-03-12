import React, { useState } from 'react';
import {
    View, Text, StyleSheet, TextInput, TouchableOpacity,
    ScrollView, ActivityIndicator, Alert, Dimensions
} from 'react-native';
import * as SecureStore from 'expo-secure-store';
import axios from 'axios';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { API_BASE } from '../config';
import { useTheme } from '../context/ThemeContext';

const TYPES = ['Pickup Issue', 'Wrong Quantity', 'Payment Problem', 'Vendor Misconduct', 'App Bug', 'Other'];

export default function ComplaintsScreen({ navigation }) {
    const { colors, isDarkMode } = useTheme();
    const s = getStyles(colors, isDarkMode);

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
                { text: 'Back to Profile', onPress: () => navigation.goBack() },
            ]);
        } catch (e) {
            Alert.alert('Error', e.response?.data?.message || 'Failed to submit complaint.');
        } finally { setLoading(false); }
    };

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
                    <Text style={s.headerTitle}>Support</Text>
                    <View style={{ width: 28 }} />
                </View>

                <View style={s.headerIntro}>
                    <Text style={s.title}>Submit Complaint</Text>
                    <Text style={s.subtitle}>We're here to help you solve any issues</Text>
                </View>
            </LinearGradient>

            <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
                <View style={s.infoCard}>
                    <View style={s.infoIconBox}>
                        <MaterialCommunityIcons name="headset" size={24} color={colors.primary} />
                    </View>
                    <View style={{ flex: 1 }}>
                        <Text style={s.infoTitle}>Fast Resolution</Text>
                        <Text style={s.infoTxt}>Our support team typically responds within 24 hours.</Text>
                    </View>
                </View>

                <Text style={s.label}>What is the issue about? *</Text>
                <View style={s.typeGrid}>
                    {TYPES.map(t => (
                        <TouchableOpacity 
                            key={t} 
                            style={[s.typeChip, type === t && s.typeChipSel]} 
                            onPress={() => setType(t)} 
                            activeOpacity={0.8}
                        >
                            <Text style={[s.typeChipTxt, type === t && s.typeChipTxtSel]}>{t}</Text>
                        </TouchableOpacity>
                    ))}
                </View>

                <View style={s.fieldGroup}>
                    <Text style={s.label}>Subject *</Text>
                    <View style={s.inputContainer}>
                        <MaterialCommunityIcons name="pencil-outline" size={20} color={colors.subText} style={s.inputIcon} />
                        <TextInput 
                            style={s.input} 
                            placeholder="Brief subject of your complaint…" 
                            placeholderTextColor="#9ca3af" 
                            value={subject} 
                            onChangeText={setSubject} 
                        />
                    </View>
                </View>

                <View style={s.fieldGroup}>
                    <Text style={s.label}>Detailed Description *</Text>
                    <View style={[s.inputContainer, s.textAreaContainer]}>
                        <TextInput
                            style={s.textArea}
                            placeholder="Please explain the issue in detail so we can help you better…"
                            placeholderTextColor="#9ca3af" 
                            value={desc} 
                            onChangeText={setDesc} 
                            multiline
                            numberOfLines={5}
                            textAlignVertical="top"
                        />
                    </View>
                    <Text style={[s.charCount, desc.length < 20 && desc.length > 0 && { color: colors.error }]}>
                        {desc.length}/20 min characters
                    </Text>
                </View>

                <TouchableOpacity 
                    style={[s.btn, (loading || !type || !subject || desc.length < 20) && s.btnDisabled]} 
                    onPress={submit} 
                    disabled={loading || !type || !subject || desc.length < 20} 
                    activeOpacity={0.8}
                >
                    {loading ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <View style={s.btnContent}>
                            <Text style={s.btnTxt}>Send Complaint</Text>
                            <MaterialCommunityIcons name="send" size={20} color="#fff" />
                        </View>
                    )}
                </TouchableOpacity>

                <View style={s.urgentBox}>
                    <Text style={s.urgentText}>Need urgent help?</Text>
                    <TouchableOpacity style={s.callRow}>
                        <MaterialCommunityIcons name="phone-in-talk" size={18} color={colors.primary} />
                        <Text style={s.callLink}>Call 1800-419-0000</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </View>
    );
}

const getStyles = (colors, isDark) => StyleSheet.create({
    root: { flex: 1, backgroundColor: colors.background },
    header: { 
        paddingTop: 52, 
        paddingBottom: 32, 
        paddingHorizontal: 20, 
        borderBottomLeftRadius: 32, 
        borderBottomRightRadius: 32,
        elevation: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8
    },
    headerContent: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    backBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center', borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.15)' },
    headerTitle: { fontSize: 18, fontWeight: '800', color: '#fff' },
    headerIntro: { marginTop: 24 },
    title: { fontSize: 26, fontWeight: '900', color: '#fff', marginBottom: 6 },
    subtitle: { fontSize: 13, color: 'rgba(255,255,255,0.8)', fontWeight: '600' },
    
    content: { padding: 20, paddingBottom: 40 },
    infoCard: { 
        flexDirection: 'row', 
        alignItems: 'center',
        backgroundColor: colors.iconBg, 
        borderRadius: 20, 
        padding: 16, 
        marginBottom: 24, 
        borderWidth: 1.5, 
        borderColor: colors.primary + '30',
        gap: 16
    },
    infoIconBox: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', elevation: 2 },
    infoTitle: { fontSize: 15, fontWeight: '800', color: colors.text, marginBottom: 2 },
    infoTxt: { fontSize: 12, color: colors.subText, lineHeight: 18, fontWeight: '500' },
    
    label: { fontSize: 15, fontWeight: '800', color: colors.text, marginBottom: 12, marginTop: 16, marginLeft: 4 },
    typeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 10 },
    typeChip: {
        paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20,
        backgroundColor: colors.card, borderWidth: 1.5, borderColor: colors.border,
    },
    typeChipSel: { backgroundColor: colors.primary, borderColor: colors.primary, elevation: 3 },
    typeChipTxt: { fontSize: 13, color: colors.subText, fontWeight: '700' },
    typeChipTxtSel: { color: '#fff' },
    
    fieldGroup: { marginTop: 16 },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.card,
        borderRadius: 18,
        borderWidth: 1.5,
        borderColor: colors.border,
        paddingHorizontal: 16,
        height: 56,
    },
    inputIcon: { marginRight: 12 },
    input: { flex: 1, color: colors.text, fontSize: 15, fontWeight: '600' },
    textAreaContainer: { height: 160, paddingVertical: 4, alignItems: 'flex-start' },
    textArea: { flex: 1, color: colors.text, fontSize: 15, fontWeight: '500', paddingTop: 12 },
    charCount: { fontSize: 11, color: colors.subText, textAlign: 'right', marginTop: 6, fontWeight: '700' },
    
    btn: {
        backgroundColor: colors.primary, 
        borderRadius: 18, 
        height: 60,
        alignItems: 'center', 
        justifyContent: 'center',
        marginTop: 32,
        elevation: 6, 
        shadowColor: colors.primary, 
        shadowOpacity: 0.3, 
        shadowRadius: 10,
    },
    btnDisabled: { opacity: 0.6 },
    btnContent: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    btnTxt: { color: '#fff', fontWeight: '800', fontSize: 17 },
    
    urgentBox: { alignItems: 'center', marginTop: 32, gap: 8 },
    urgentText: { fontSize: 14, color: colors.subText, fontWeight: '600' },
    callRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    callLink: { color: colors.primary, fontWeight: '800', fontSize: 15, textDecorationLine: 'underline' },
});

