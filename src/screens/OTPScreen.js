import React, { useState, useRef } from 'react';
import {
    View, Text, TextInput, TouchableOpacity, StyleSheet,
    ActivityIndicator, Alert,
} from 'react-native';
import * as SecureStore from 'expo-secure-store';
import axios from 'axios';
import { API_BASE } from '../config';

export default function OTPScreen({ route, navigation }) {
    const { phone, devOtp } = route.params;
    const [otp, setOtp] = useState(['', '', '', '', '', '']);
    const [loading, setLoading] = useState(false);
    const inputs = useRef([]);

    const handleChange = (val, idx) => {
        if (!/^\d*$/.test(val)) return;
        const next = [...otp];
        next[idx] = val;
        setOtp(next);
        if (val && idx < 5) inputs.current[idx + 1]?.focus();
        if (!val && idx > 0) inputs.current[idx - 1]?.focus();
    };

    const verify = async () => {
        const code = otp.join('');
        if (code.length < 6) return Alert.alert('Enter complete 6-digit OTP');
        setLoading(true);
        try {
            const res = await axios.post(`${API_BASE}/auth/verify-otp`, { phone, otp: code });
            await SecureStore.setItemAsync('token', res.data.accessToken);
            await SecureStore.setItemAsync('user', JSON.stringify(res.data.user));
            navigation.replace('Main');
        } catch (e) {
            Alert.alert('Invalid OTP', e.response?.data?.message || 'Please try again.');
        } finally { setLoading(false); }
    };

    return (
        <View style={s.root}>
            <View style={s.blob} />

            <View style={s.card}>
                <Text style={s.icon}>📲</Text>
                <Text style={s.title}>Verify OTP</Text>
                <Text style={s.sub}>Sent to {phone}</Text>

                {devOtp ? (
                    <View style={s.devBox}>
                        <Text style={s.devTxt}>🛠 Dev OTP: {devOtp}</Text>
                    </View>
                ) : null}

                <View style={s.otpRow}>
                    {otp.map((d, i) => (
                        <TextInput
                            key={i}
                            ref={r => inputs.current[i] = r}
                            style={[s.box, d !== '' && s.boxFilled]}
                            value={d}
                            onChangeText={v => handleChange(v, i)}
                            keyboardType="number-pad"
                            maxLength={1}
                            selectTextOnFocus
                        />
                    ))}
                </View>

                <TouchableOpacity style={s.btn} onPress={verify} disabled={loading} activeOpacity={0.85}>
                    {loading ? <ActivityIndicator color="#fff" /> : <Text style={s.btnTxt}>Verify & Login ✓</Text>}
                </TouchableOpacity>

                <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginTop: 14 }}>
                    <Text style={s.back}>← Change Number</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const s = StyleSheet.create({
    root: { flex: 1, backgroundColor: '#f0fdf4', alignItems: 'center', justifyContent: 'center' },
    blob: {
        width: 400, height: 400, borderRadius: 200, backgroundColor: '#16a34a',
        position: 'absolute', top: -150, opacity: 0.08,
    },
    card: { width: '88%', backgroundColor: '#fff', borderRadius: 24, padding: 28, alignItems: 'center', elevation: 8, shadowColor: '#16a34a', shadowOpacity: 0.15, shadowRadius: 20 },
    icon: { fontSize: 48, marginBottom: 8 },
    title: { fontSize: 24, fontWeight: '800', color: '#14532d' },
    sub: { fontSize: 13, color: '#6b7280', marginBottom: 20 },
    devBox: { backgroundColor: '#fef9c3', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 8, marginBottom: 16 },
    devTxt: { color: '#854d0e', fontWeight: '700', fontSize: 13 },
    otpRow: { flexDirection: 'row', gap: 10, marginBottom: 24 },
    box: {
        width: 46, height: 54, borderRadius: 12, borderWidth: 2, borderColor: '#d1fae5',
        textAlign: 'center', fontSize: 22, fontWeight: '700', color: '#111827',
        backgroundColor: '#f0fdf4',
    },
    boxFilled: { borderColor: '#16a34a', backgroundColor: '#dcfce7' },
    btn: {
        width: '100%', paddingVertical: 15, borderRadius: 14, alignItems: 'center',
        backgroundColor: '#16a34a', elevation: 6, shadowColor: '#16a34a', shadowOpacity: 0.35, shadowRadius: 8,
    },
    btnTxt: { color: '#fff', fontWeight: '800', fontSize: 16 },
    back: { color: '#16a34a', fontWeight: '600', fontSize: 14 },
});
