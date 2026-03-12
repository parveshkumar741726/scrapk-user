import React, { useState, useEffect } from 'react';
import {
    View, Text, StyleSheet, TextInput, TouchableOpacity,
    ActivityIndicator, Alert, ScrollView, Dimensions, Animated
} from 'react-native';
import * as SecureStore from 'expo-secure-store';
import axios from 'axios';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { API_BASE } from '../config';
import { useTheme } from '../context/ThemeContext';

const labels = ['', '😔 Poor', '😐 Fair', '🙂 Good', '😊 Great', '🤩 Amazing'];
const QUICK_TAGS = ['On time', 'Best price', 'Professional', 'Very Polite', 'Trusted', 'Quick pickup'];

export default function FeedbackScreen({ route, navigation }) {
    const { colors, isDarkMode } = useTheme();
    const s = getStyles(colors, isDarkMode);

    const { saleId, bookingId } = route.params || {};
    const [rating, setRating] = useState(0);
    const [comment, setComment] = useState('');
    const [loading, setLoading] = useState(false);
    const [submitted, setSubmitted] = useState(false);

    const addTag = (tag) => {
        if (comment.includes(tag)) return;
        setComment(c => c ? `${c}, ${tag}` : tag);
    };

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
                <LinearGradient
                    colors={isDarkMode ? ['#065f46', '#064e3b'] : ['#10b981', '#059669']}
                    style={s.successBlob}
                >
                    <MaterialCommunityIcons name="check-circle" size={100} color="#fff" />
                </LinearGradient>
                <Text style={s.successTitle}>Thank You!</Text>
                <Text style={s.successSub}>Your feedback helps make ScrapK better for everyone.</Text>
                <TouchableOpacity style={s.doneBtn} onPress={() => navigation.goBack()} activeOpacity={0.8}>
                    <Text style={s.doneBtnTxt}>Return to Home</Text>
                </TouchableOpacity>
            </View>
        );
    }

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
                    <Text style={s.headerTitle}>Experience</Text>
                    <View style={{ width: 28 }} />
                </View>
            </LinearGradient>

            <ScrollView contentContainerStyle={s.scrollContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
                <View style={s.heroCard}>
                    <View style={s.heroIconBox}>
                        <MaterialCommunityIcons name="star-face" size={48} color={colors.primary} />
                    </View>
                    <Text style={s.heroTitle}>How was your pickup?</Text>
                    <Text style={s.heroSub}>Your honest feedback helps us improve</Text>

                    {/* Star row */}
                    <View style={s.starRow}>
                        {[1, 2, 3, 4, 5].map(i => (
                            <TouchableOpacity key={i} onPress={() => setRating(i)} activeOpacity={0.7}>
                                <MaterialCommunityIcons 
                                    name={rating >= i ? "star" : "star-outline"} 
                                    size={48} 
                                    color={rating >= i ? "#fbbf24" : (isDarkMode ? "#374151" : "#e5e7eb")} 
                                    style={{ marginHorizontal: 4 }}
                                />
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
                <View style={s.section}>
                    <Text style={s.sectionLabel}>What went well?</Text>
                    <View style={s.tagsWrap}>
                        {QUICK_TAGS.map(tag => (
                            <TouchableOpacity 
                                key={tag} 
                                style={[s.tag, comment.includes(tag) && s.tagSelected]} 
                                onPress={() => addTag(tag)} 
                                activeOpacity={0.75}
                            >
                                <Text style={[s.tagTxt, comment.includes(tag) && s.tagTxtSelected]}>{tag}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                {/* Comment */}
                <View style={s.section}>
                    <Text style={s.sectionLabel}>Additional Comments</Text>
                    <View style={s.inputContainer}>
                        <TextInput
                            style={s.input}
                            placeholder="Share more details about your experience…"
                            placeholderTextColor="#9ca3af"
                            value={comment}
                            onChangeText={setComment}
                            multiline
                            numberOfLines={4}
                            textAlignVertical="top"
                        />
                    </View>
                </View>

                <TouchableOpacity 
                    style={[s.submitBtn, !rating && s.btnDisabled]} 
                    onPress={submit} 
                    disabled={loading || !rating} 
                    activeOpacity={0.8}
                >
                    {loading ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <View style={s.submitBtnContent}>
                            <Text style={s.submitBtnTxt}>Submit Feedback</Text>
                            <MaterialCommunityIcons name="arrow-right" size={20} color="#fff" />
                        </View>
                    )}
                </TouchableOpacity>
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
        borderBottomLeftRadius: 24, 
        borderBottomRightRadius: 24,
        elevation: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8
    },
    headerContent: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    backBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center', borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.15)' },
    headerTitle: { fontSize: 18, fontWeight: '800', color: '#fff' },
    
    scrollContent: { padding: 20, paddingBottom: 40 },
    heroCard: {
        backgroundColor: colors.card, 
        borderRadius: 32, 
        padding: 32, 
        alignItems: 'center',
        marginBottom: 24, 
        elevation: 4, 
        shadowColor: colors.primary, 
        shadowOpacity: 0.1, 
        shadowRadius: 15,
        borderWidth: 1,
        borderColor: colors.border,
    },
    heroIconBox: {
        width: 80, height: 80, borderRadius: 40,
        backgroundColor: colors.iconBg,
        alignItems: 'center', justifyContent: 'center',
        marginBottom: 16
    },
    heroTitle: { fontSize: 22, fontWeight: '900', color: colors.text, marginBottom: 4 },
    heroSub: { fontSize: 14, color: colors.subText, marginBottom: 24, textAlign: 'center' },
    starRow: { flexDirection: 'row', marginBottom: 20 },
    ratingLabelWrap: { 
        backgroundColor: isDark ? '#422006' : '#fef9c3', 
        paddingHorizontal: 20, 
        paddingVertical: 8, 
        borderRadius: 20,
        elevation: 2
    },
    ratingLabel: { fontSize: 16, fontWeight: '800', color: isDark ? '#fef08a' : '#b45309' },
    
    section: { marginBottom: 24 },
    sectionLabel: { fontSize: 15, fontWeight: '800', color: colors.text, marginBottom: 12, marginLeft: 4 },
    tagsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    tag: { 
        backgroundColor: colors.card, 
        paddingHorizontal: 16, 
        paddingVertical: 10, 
        borderRadius: 20, 
        borderWidth: 1.5, 
        borderColor: colors.border 
    },
    tagSelected: { backgroundColor: colors.iconBg, borderColor: colors.primary },
    tagTxt: { color: colors.subText, fontWeight: '700', fontSize: 13 },
    tagTxtSelected: { color: colors.primary },
    
    inputContainer: {
        backgroundColor: colors.card,
        borderRadius: 20,
        borderWidth: 1.5,
        borderColor: colors.border,
        padding: 16,
        minHeight: 120,
    },
    input: { flex: 1, color: colors.text, fontSize: 15, fontWeight: '500' },
    
    submitBtn: {
        backgroundColor: colors.primary, 
        borderRadius: 20, 
        height: 60,
        alignItems: 'center', 
        justifyContent: 'center',
        elevation: 6, 
        shadowColor: colors.primary, 
        shadowOpacity: 0.3, 
        shadowRadius: 10,
    },
    btnDisabled: { opacity: 0.6 },
    submitBtnContent: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    submitBtnTxt: { color: '#fff', fontWeight: '800', fontSize: 16 },
    
    successRoot: { flex: 1, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center', padding: 32 },
    successBlob: { 
        width: 180, height: 180, borderRadius: 90, 
        alignItems: 'center', justifyContent: 'center', 
        marginBottom: 32,
        elevation: 10,
        shadowColor: '#000',
        shadowOpacity: 0.2,
        shadowRadius: 15
    },
    successTitle: { fontSize: 32, fontWeight: '900', color: colors.text, marginBottom: 12 },
    successSub: { fontSize: 16, color: colors.subText, textAlign: 'center', marginBottom: 40, lineHeight: 24, paddingHorizontal: 20 },
    doneBtn: { 
        backgroundColor: colors.primary, 
        borderRadius: 20, 
        paddingHorizontal: 32, 
        paddingVertical: 18, 
        elevation: 5,
        shadowColor: colors.primary,
        shadowOpacity: 0.3,
        shadowRadius: 10
    },
    doneBtnTxt: { color: '#fff', fontWeight: '800', fontSize: 16 },
});

