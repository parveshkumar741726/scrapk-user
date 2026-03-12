import React, { useState, useRef } from 'react';
import {
    View, Text, TextInput, TouchableOpacity, StyleSheet,
    ActivityIndicator, Alert,
} from 'react-native';
import * as SecureStore from 'expo-secure-store';
import axios from 'axios';
import { API_BASE } from '../config';
import { useTheme } from '../context/ThemeContext';

export default function OTPScreen({ route, navigation }) {
    const { colors, isDarkMode } = useTheme();
    const s = getStyles(colors, isDarkMode);
    
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

const getStyles = (colors, isDark) => StyleSheet.create({
    root: { flex: 1, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' },
    blob: {
        width: 400, height: 400, borderRadius: 200, backgroundColor: colors.primary,
        position: 'absolute', top: -150, opacity: isDark ? 0.05 : 0.08,
    },
    card: { width: '88%', backgroundColor: colors.card, borderRadius: 24, padding: 28, alignItems: 'center', elevation: 8, shadowColor: colors.primary, shadowOpacity: 0.15, shadowRadius: 20 },
    icon: { fontSize: 48, marginBottom: 8 },
    title: { fontSize: 24, fontWeight: '800', color: colors.text },
    sub: { fontSize: 13, color: colors.subText, marginBottom: 20 },
    devBox: { backgroundColor: isDark ? '#422006' : '#fef9c3', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 8, marginBottom: 16 },
    devTxt: { color: isDark ? '#fef08a' : '#854d0e', fontWeight: '700', fontSize: 13 },
    otpRow: { flexDirection: 'row', gap: 10, marginBottom: 24 },
    box: {
        width: 46, height: 54, borderRadius: 12, borderWidth: 2, borderColor: colors.inputBorder,
        textAlign: 'center', fontSize: 22, fontWeight: '700', color: colors.text,
        backgroundColor: colors.inputBg,
    },
    boxFilled: { borderColor: colors.primary, backgroundColor: colors.iconBg },
    btn: {
        width: '100%', paddingVertical: 15, borderRadius: 14, alignItems: 'center',
        backgroundColor: colors.primary, elevation: 6, shadowColor: colors.primary, shadowOpacity: 0.35, shadowRadius: 8,
    },
    btnTxt: { color: '#fff', fontWeight: '800', fontSize: 16 },
    back: { color: colors.primary, fontWeight: '600', fontSize: 14 },
});
