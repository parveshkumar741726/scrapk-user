import React, { useState, useEffect } from 'react';
import {
    View, Text, StyleSheet, TextInput, TouchableOpacity,
    ActivityIndicator, Alert, ScrollView,
} from 'react-native';
import * as SecureStore from 'expo-secure-store';
import axios from 'axios';
import { API_BASE } from '../config';

const labels = ['', '😔 Poor', '😐 Fair', '🙂 Good', '😊 Great', '🤩 Excellent'];
const QUICK_TAGS = ['On time', 'Best price', 'Professional', 'Polite', 'Trusted', 'Quick pickup'];

export default function FeedbackScreen({ route, navigation }) {
    const { saleId, bookingId } = route.params || {};
    const [rating, setRating] = useState(0);
    const [comment, setComment] = useState('');
    const [loading, setLoading] = useState(false);
    const [submitted, setSubmitted] = useState(false);

    const addTag = (tag) => setComment(c => c ? `${c}, ${tag}` : tag);

    const submit = async () => {
        if (!rating) return Alert.alert('⚠️ Rating required', 'Please tap a star to rate first.');
        setLoading(true);
        try {
            const token = await SecureStore.getItemAsync('token');
            await axios.post(`${API_BASE}/feedback`, {
                saleId, bookingId, rating, comment,
            }, { headers: { Authorization: `Bearer ${token}` } });
            setSubmitted(true);
        } catch (e) {
            Alert.alert('Error', e.response?.data?.message || 'Could not submit feedback.');
        } finally { setLoading(false); }
    };

    if (submitted) {
        return (
            <View style={s.successRoot}>
                <View style={s.blob} />
                <Text style={s.successEmoji}>🎉</Text>
                <Text style={s.successTitle}>Thank You!</Text>
                <Text style={s.successSub}>Your feedback helps make ScrapBazaar better for everyone.</Text>
                <TouchableOpacity style={s.doneBtn} onPress={() => navigation.goBack()}>
                    <Text style={s.doneBtnTxt}>Back to Home</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <ScrollView style={s.root} contentContainerStyle={s.content} keyboardShouldPersistTaps="handled">
            <View style={s.blob} />
            <View style={s.headerRow}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Text style={s.backIcon}>←</Text>
                </TouchableOpacity>
                <Text style={s.pageTitle}>Rate Experience</Text>
            </View>

            <View style={s.heroCard}>
                <Text style={s.heroEmoji}>⭐</Text>
                <Text style={s.heroTitle}>How was your pickup?</Text>
                <Text style={s.heroSub}>Your honest feedback helps us improve</Text>

                {/* Star row */}
                <View style={s.starRow}>
                    {[1, 2, 3, 4, 5].map(i => (
                        <TouchableOpacity key={i} onPress={() => setRating(i)} activeOpacity={0.7}>
                            <Text style={[s.star, rating >= i && s.starFilled]}>★</Text>
                        </TouchableOpacity>
                    ))}
                </View>
                {rating > 0 && (
                    <View style={s.ratingLabelWrap}>
                        <Text style={s.ratingLabel}>{labels[rating]}</Text>
                    </View>
                )}
            </View>

            {/* Quick tags */}
            <Text style={s.sectionLabel}>Quick Tags</Text>
            <View style={s.tagsWrap}>
                {QUICK_TAGS.map(tag => (
                    <TouchableOpacity key={tag} style={s.tag} onPress={() => addTag(tag)} activeOpacity={0.75}>
                        <Text style={s.tagTxt}>+ {tag}</Text>
                    </TouchableOpacity>
                ))}
            </View>

            {/* Comment */}
            <Text style={s.sectionLabel}>Comments (Optional)</Text>
            <TextInput
                style={s.input}
                placeholder="Share details about your experience…"
                placeholderTextColor="#9ca3af"
                value={comment}
                onChangeText={setComment}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
            />

            <TouchableOpacity style={[s.btn, !rating && s.btnDisabled]} onPress={submit} disabled={loading || !rating} activeOpacity={0.85}>
                {loading ? <ActivityIndicator color="#fff" /> : <Text style={s.btnTxt}>Submit Feedback ✓</Text>}
            </TouchableOpacity>
        </ScrollView>
    );
}

const s = StyleSheet.create({
    root: { flex: 1, backgroundColor: '#f0fdf4' },
    content: { padding: 20, paddingBottom: 40 },
    successRoot: { flex: 1, backgroundColor: '#f0fdf4', alignItems: 'center', justifyContent: 'center', padding: 32 },
    blob: { position: 'absolute', top: -80, left: -60, right: -60, height: 300, backgroundColor: '#16a34a', borderBottomLeftRadius: 60, borderBottomRightRadius: 60, opacity: 0.1 },
    headerRow: { flexDirection: 'row', alignItems: 'center', marginTop: 44, marginBottom: 24 },
    backIcon: { fontSize: 26, color: '#16a34a', marginRight: 12 },
    pageTitle: { fontSize: 20, fontWeight: '800', color: '#14532d' },
    heroCard: {
        backgroundColor: '#fff', borderRadius: 24, padding: 24, alignItems: 'center',
        marginBottom: 24, elevation: 4, shadowColor: '#16a34a', shadowOpacity: 0.1, shadowRadius: 12,
    },
    heroEmoji: { fontSize: 48, marginBottom: 8 },
    heroTitle: { fontSize: 20, fontWeight: '800', color: '#14532d', marginBottom: 4 },
    heroSub: { fontSize: 13, color: '#6b7280', marginBottom: 20 },
    starRow: { flexDirection: 'row', marginBottom: 12 },
    star: { fontSize: 44, color: '#e5e7eb', marginHorizontal: 4 },
    starFilled: { color: '#fbbf24' },
    ratingLabelWrap: { backgroundColor: '#fef9c3', paddingHorizontal: 18, paddingVertical: 6, borderRadius: 20 },
    ratingLabel: { fontSize: 15, fontWeight: '700', color: '#b45309' },
    sectionLabel: { fontSize: 14, fontWeight: '700', color: '#374151', marginBottom: 10, marginTop: 4 },
    tagsWrap: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 16 },
    tag: { margin: 4, backgroundColor: '#fff', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1.5, borderColor: '#86efac' },
    tagTxt: { color: '#16a34a', fontWeight: '600', fontSize: 13 },
    input: {
        backgroundColor: '#fff', borderRadius: 14, padding: 14, fontSize: 14,
        color: '#111827', borderWidth: 1.5, borderColor: '#d1fae5',
        minHeight: 100, marginBottom: 20,
    },
    btn: {
        backgroundColor: '#16a34a', borderRadius: 14, paddingVertical: 16,
        alignItems: 'center', elevation: 5, shadowColor: '#16a34a', shadowOpacity: 0.3, shadowRadius: 8,
    },
    btnDisabled: { backgroundColor: '#86efac' },
    btnTxt: { color: '#fff', fontWeight: '800', fontSize: 16 },
    successEmoji: { fontSize: 80, marginBottom: 20 },
    successTitle: { fontSize: 28, fontWeight: '800', color: '#14532d', marginBottom: 8 },
    successSub: { fontSize: 14, color: '#4b7c58', textAlign: 'center', marginBottom: 32, lineHeight: 22 },
    doneBtn: { backgroundColor: '#16a34a', borderRadius: 14, paddingHorizontal: 40, paddingVertical: 16, elevation: 5 },
    doneBtnTxt: { color: '#fff', fontWeight: '800', fontSize: 16 },
});
