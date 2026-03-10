import React, { useState } from 'react';
import {
    View, Text, TextInput, TouchableOpacity, StyleSheet,
    ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView,
} from 'react-native';
import axios from 'axios';
import { API_BASE } from '../config';

export default function LoginScreen({ navigation }) {
    const [phone, setPhone] = useState('');
    const [loading, setLoading] = useState(false);

    const sendOtp = async () => {
        if (!phone || phone.length < 10) return Alert.alert('Invalid', 'Please enter a valid 10-digit phone number.');
        setLoading(true);
        try {
            const fullPhone = phone.startsWith('+') ? phone : `+91${phone}`;
            const res = await axios.post(`${API_BASE}/auth/send-otp`, { phone: fullPhone, role: 'customer' });
            navigation.navigate('OTP', { phone: fullPhone, devOtp: res.data.otp });
        } catch (e) {
            Alert.alert('Error', e.response?.data?.message || e.message || 'Failed to send OTP');
        } finally { setLoading(false); }
    };

    return (
        <KeyboardAvoidingView style={s.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">
                {/* Header gradient blob */}
                <View style={s.headerBlob} />

                <View style={s.card}>
                    <Text style={s.emoji}>♻️</Text>
                    <Text style={s.title}>ScrapBazaar</Text>
                    <Text style={s.sub}>India ka sabse bada scrap marketplace</Text>

                    <View style={s.inputWrap}>
                        <Text style={s.prefix}>🇮🇳 +91</Text>
                        <TextInput
                            style={s.input}
                            placeholder="Phone number"
                            placeholderTextColor="#9ca3af"
                            value={phone}
                            onChangeText={t => setPhone(t.replace(/\D/g, ''))}
                            keyboardType="phone-pad"
                            maxLength={10}
                        />
                    </View>

                    <TouchableOpacity style={s.btn} onPress={sendOtp} disabled={loading} activeOpacity={0.85}>
                        {loading
                            ? <ActivityIndicator color="#fff" />
                            : <Text style={s.btnTxt}>Send OTP →</Text>}
                    </TouchableOpacity>

                    <Text style={s.disclaimer}>By continuing, you agree to our Terms & Privacy Policy</Text>
                </View>

                <View style={s.features}>
                    {['🏆 Highest Bid Guarantee', '⚡ Same Day Pickup', '🔒 100% Secure'].map(f => (
                        <View key={f} style={s.featureChip}>
                            <Text style={s.featureTxt}>{f}</Text>
                        </View>
                    ))}
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const s = StyleSheet.create({
    root: { flex: 1, backgroundColor: '#f0fdf4' },
    scroll: { flexGrow: 1, alignItems: 'center', paddingBottom: 40 },
    headerBlob: {
        width: '200%', height: 300, backgroundColor: '#16a34a',
        borderBottomLeftRadius: 300, borderBottomRightRadius: 300,
        position: 'absolute', top: -80, alignSelf: 'center',
        opacity: 0.12,
    },
    card: {
        width: '90%', backgroundColor: '#fff', borderRadius: 24,
        padding: 28, marginTop: 100, alignItems: 'center',
        shadowColor: '#16a34a', shadowOpacity: 0.15, shadowRadius: 20,
        elevation: 8,
    },
    emoji: { fontSize: 56, marginBottom: 8 },
    title: { fontSize: 30, fontWeight: '800', color: '#14532d', letterSpacing: 0.5 },
    sub: { fontSize: 13, color: '#4b7c58', marginBottom: 28, textAlign: 'center' },
    inputWrap: {
        flexDirection: 'row', alignItems: 'center', width: '100%',
        backgroundColor: '#f0fdf4', borderRadius: 14, paddingHorizontal: 14,
        borderWidth: 1.5, borderColor: '#bbf7d0', marginBottom: 16,
    },
    prefix: { fontSize: 15, fontWeight: '600', color: '#166534', marginRight: 8 },
    input: { flex: 1, paddingVertical: 14, fontSize: 17, color: '#111827', letterSpacing: 1 },
    btn: {
        width: '100%', paddingVertical: 15, borderRadius: 14, alignItems: 'center',
        backgroundColor: '#16a34a', marginBottom: 12,
        shadowColor: '#16a34a', shadowOpacity: 0.4, shadowRadius: 10, elevation: 6,
    },
    btnTxt: { color: '#fff', fontWeight: '800', fontSize: 16, letterSpacing: 0.5 },
    disclaimer: { fontSize: 11, color: '#9ca3af', textAlign: 'center', marginTop: 4 },
    features: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 8, marginTop: 28, paddingHorizontal: 16 },
    featureChip: { backgroundColor: '#dcfce7', paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20 },
    featureTxt: { color: '#15803d', fontWeight: '600', fontSize: 12 },
});
