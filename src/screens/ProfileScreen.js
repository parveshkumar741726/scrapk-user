import React, { useState, useEffect } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, Switch, Modal, Image, ActivityIndicator, Dimensions, TextInput
} from 'react-native';
import * as SecureStore from 'expo-secure-store';
import * as ImagePicker from 'expo-image-picker';
import axios from 'axios';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { API_BASE } from '../config';
import { useTheme } from '../context/ThemeContext';
import { useLanguage, TRANSLATIONS } from '../context/LanguageContext';

const { width } = Dimensions.get('window');

export default function ProfileScreen({ navigation }) {
    const { colors, isDarkMode, toggleTheme } = useTheme();
    const { language, changeLanguage, t } = useLanguage();
    const s = getStyles(colors, isDarkMode);

    const [user, setUser] = useState(null);
    const [showLangModal, setShowLangModal] = useState(false);
    const [showNameModal, setShowNameModal] = useState(false);
    const [editingName, setEditingName] = useState('');
    const [uploading, setUploading] = useState(false);

    useEffect(() => {
        (async () => {
            const u = JSON.parse(await SecureStore.getItemAsync('user') || '{}');
            setUser(u);
        })();
    }, []);

    const logout = () =>
        Alert.alert('Logout?', 'You will be logged out of ScrapK.', [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Logout', style: 'destructive',
                onPress: async () => {
                    await SecureStore.deleteItemAsync('token');
                    await SecureStore.deleteItemAsync('user');
                    navigation.replace('Login');
                },
            },
        ]);

    const handleImagePick = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            base64: true,
            quality: 0.5,
        });

        if (!result.canceled) {
            setUploading(true);
            try {
                const token = await SecureStore.getItemAsync('token');
                const base64Img = `data:image/jpeg;base64,${result.assets[0].base64}`;

                const userId = user._id || user.id;
                if (!userId) {
                    Alert.alert('Error', 'User ID not found. Please log in again.');
                    return;
                }

                const res = await axios.patch(
                    `${API_BASE}/users/${userId}`,
                    { profileImage: base64Img },
                    { headers: { Authorization: `Bearer ${token}` } }
                );

                const updatedUser = res.data.user;
                setUser(updatedUser);
                await SecureStore.setItemAsync('user', JSON.stringify(updatedUser));
                Alert.alert('Success', 'Profile picture updated successfully!');
            } catch (error) {
                const errorMsg = error.response?.data?.message || error.message || 'Failed to update profile picture.';
                Alert.alert('Upload Error', errorMsg);
            } finally {
                setUploading(false);
            }
        }
    };

    const updateName = async () => {
        if (!editingName.trim()) {
            Alert.alert('Required', 'Name cannot be empty.');
            return;
        }
        try {
            const token = await SecureStore.getItemAsync('token');
            const userId = user._id || user.id;
            const res = await axios.patch(
                `${API_BASE}/users/${userId}`,
                { name: editingName.trim() },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            const updatedUser = res.data.user;
            setUser(updatedUser);
            await SecureStore.setItemAsync('user', JSON.stringify(updatedUser));
            setShowNameModal(false);
            Alert.alert('Success', 'Profile name updated successfully!');
        } catch (error) {
            Alert.alert('Error', error.response?.data?.message || 'Failed to update name.');
        }
    };

    const initial = (user?.name || user?.phone || 'U')[0].toUpperCase();

    return (
        <View style={s.root}>
            <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
                {/* Profile Header */}
                <LinearGradient
                    colors={isDarkMode ? ['#064e3b', '#0a1910'] : ['#16a34a', '#10b981']}
                    style={s.header}
                >
                    <View style={s.headerTop}>
                        <Text style={s.headerTitle}>{t.profile || 'Profile'}</Text>
                        <TouchableOpacity style={s.settingsIcon}>
                            <MaterialCommunityIcons name="cog-outline" size={24} color="#fff" />
                        </TouchableOpacity>
                    </View>

                    <View style={s.profileHeaderInfo}>
                        <TouchableOpacity style={s.avatarContainer} onPress={handleImagePick} activeOpacity={0.9}>
                            <View style={s.avatarBorder}>
                                {uploading ? (
                                    <ActivityIndicator color="#fff" />
                                ) : user?.profileImage ? (
                                    <Image source={{ uri: user.profileImage }} style={s.avatarImg} />
                                ) : (
                                    <Text style={s.avatarTxt}>{initial}</Text>
                                )}
                            </View>
                            <View style={s.editBadge}>
                                <MaterialCommunityIcons name="camera" size={14} color="#fff" />
                            </View>
                        </TouchableOpacity>

                        <View style={s.nameContainer}>
                            <Text style={s.userName}>{user?.name || 'Customer'}</Text>
                            <TouchableOpacity onPress={() => {
                                setEditingName(user?.name || '');
                                setShowNameModal(true);
                            }} style={s.nameEditBtn}>
                                <MaterialCommunityIcons name="pencil-outline" size={16} color="#fff" />
                            </TouchableOpacity>
                        </View>
                        <Text style={s.userPhone}>{user?.phone || 'No phone'}</Text>
                        
                        <View style={s.memberBadge}>
                            <MaterialCommunityIcons name="leaf" size={12} color="#fff" />
                            <Text style={s.memberBadgeTxt}>ScrapK Member</Text>
                        </View>
                    </View>
                </LinearGradient>

                {/* Stats Section */}
                <View style={s.statsCard}>
                    <View style={s.statItem}>
                        <Text style={s.statValue}>0</Text>
                        <Text style={s.statLabel}>Total Sales</Text>
                    </View>
                    <View style={s.statDivider} />
                    <View style={s.statItem}>
                        <Text style={s.statValue}>0</Text>
                        <Text style={s.statLabel}>Pickups</Text>
                    </View>
                    <View style={s.statDivider} />
                    <View style={s.statItem}>
                        <Text style={s.statValue}>₹0</Text>
                        <Text style={s.statLabel}>Earnings</Text>
                    </View>
                </View>

                {/* Menu Section */}
                <View style={s.menuSection}>
                    <Text style={s.menuSectionTitle}>Preferences</Text>
                    
                    <View style={s.menuItem}>
                        <View style={[s.menuIconBox, { backgroundColor: '#f0fdf4' }]}>
                            <MaterialCommunityIcons name={isDarkMode ? "moon-waning-crescent" : "white-balance-sunny"} size={22} color="#16a34a" />
                        </View>
                        <Text style={s.menuLabel}>{t.darkMode}</Text>
                        <Switch
                            value={isDarkMode}
                            onValueChange={toggleTheme}
                            trackColor={{ false: '#d1fae5', true: '#059669' }}
                            thumbColor={isDarkMode ? '#fff' : '#fff'}
                        />
                    </View>

                    <TouchableOpacity style={s.menuItem} onPress={() => setShowLangModal(true)} activeOpacity={0.7}>
                        <View style={[s.menuIconBox, { backgroundColor: '#eff6ff' }]}>
                            <MaterialCommunityIcons name="translate" size={22} color="#2563eb" />
                        </View>
                        <Text style={s.menuLabel}>{t.language}</Text>
                        <View style={s.langValueBox}>
                            <Text style={s.langValue}>{TRANSLATIONS[language].languageName}</Text>
                            <MaterialCommunityIcons name="chevron-right" size={20} color={colors.subText} />
                        </View>
                    </TouchableOpacity>

                    <Text style={[s.menuSectionTitle, { marginTop: 20 }]}>Activity</Text>

                    {[
                        { icon: 'package-variant-closed', label: t.mySales, screen: 'MySales', color: '#10b981', bg: '#f0fdf4' },
                        { icon: 'storefront-outline', label: t.bazar, screen: 'Bazaar', color: '#8b5cf6', bg: '#f5f3ff' },
                        { icon: 'message-draw', label: t.feedback, screen: 'Feedback', color: '#f59e0b', bg: '#fffbeb' },
                        { icon: 'alert-circle-outline', label: 'Complaints', screen: 'Complaints', color: '#ef4444', bg: '#fef2f2' },
                    ].map(m => (
                        <TouchableOpacity key={m.label} style={s.menuItem} onPress={() => navigation.navigate(m.screen)} activeOpacity={0.7}>
                            <View style={[s.menuIconBox, { backgroundColor: m.bg }]}>
                                <MaterialCommunityIcons name={m.icon} size={22} color={m.color} />
                            </View>
                            <Text style={s.menuLabel}>{m.label}</Text>
                            <MaterialCommunityIcons name="chevron-right" size={20} color={colors.subText} />
                        </TouchableOpacity>
                    ))}
                </View>

                {/* Footer */}
                <View style={s.footer}>
                    <TouchableOpacity style={s.logoutBtn} onPress={logout} activeOpacity={0.8}>
                        <MaterialCommunityIcons name="logout" size={22} color={colors.error} />
                        <Text style={s.logoutBtnText}>{t.logout || 'Logout Account'}</Text>
                    </TouchableOpacity>
                    
                    <Text style={s.versionTxt}>Version 1.0.0 (Premium)</Text>
                    <Text style={s.manifesto}>Cleaning the world, rewarding your home.</Text>
                </View>
            </ScrollView>

        {/* Language Modal */}
        <Modal visible={showLangModal} transparent animationType="fade">
            <View style={s.modalBg}>
                <View style={s.modalCard}>
                    <Text style={s.modalTitle}>Choose Language</Text>
                    {Object.keys(TRANSLATIONS).map(langKey => (
                        <TouchableOpacity
                            key={langKey} style={[s.langRow, language === langKey && s.langSel]}
                            onPress={() => {
                                changeLanguage(langKey);
                                setShowLangModal(false);
                            }}
                        >
                            <Text style={s.langIcon}>{language === langKey ? '🔘' : '⚪'}</Text>
                            <Text style={[s.langTxt, language === langKey && { color: colors.primary, fontWeight: '700' }]}>
                                {TRANSLATIONS[langKey].languageName}
                            </Text>
                        </TouchableOpacity>
                    ))}
                    <TouchableOpacity style={s.closeBtn} onPress={() => setShowLangModal(false)}>
                        <Text style={s.closeTxt}>Close</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>

        {/* Name Edit Modal */}
        <Modal visible={showNameModal} transparent animationType="fade">
            <View style={s.modalBg}>
                <View style={s.modalCard}>
                    <Text style={s.modalTitle}>Edit Profile Name</Text>
                    
                    <View style={s.inputContainer}>
                        <MaterialCommunityIcons name="account-outline" size={20} color={colors.primary} style={s.inputIcon} />
                        <TextInput 
                            style={s.input}
                            value={editingName}
                            onChangeText={setEditingName}
                            placeholder="Enter your name"
                            placeholderTextColor={colors.subText}
                            autoFocus
                        />
                    </View>

                    <TouchableOpacity style={s.saveBtn} onPress={updateName} activeOpacity={0.8}>
                        <Text style={s.saveBtnTxt}>Save Changes</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={s.closeBtn} onPress={() => setShowNameModal(false)}>
                        <Text style={s.closeTxt}>Cancel</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
        </View>
    );
}

const getStyles = (colors, isDark) => StyleSheet.create({
    root: { flex: 1, backgroundColor: colors.background },
    content: { paddingBottom: 40 },
    header: { 
        paddingTop: 60, 
        paddingBottom: 40, 
        paddingHorizontal: 20, 
        alignItems: 'center',
        borderBottomLeftRadius: 40,
        borderBottomRightRadius: 40,
        elevation: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.3,
        shadowRadius: 10
    },
    headerTop: { 
        width: '100%', 
        flexDirection: 'row', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: 20
    },
    headerTitle: { fontSize: 22, fontWeight: '900', color: '#fff' },
    settingsIcon: { padding: 4 },
    profileHeaderInfo: { alignItems: 'center' },
    avatarContainer: { position: 'relative', marginBottom: 16 },
    avatarBorder: {
        width: 100, height: 100, borderRadius: 50,
        borderWidth: 4, borderColor: 'rgba(255,255,255,0.3)',
        backgroundColor: 'rgba(255,255,255,0.1)',
        alignItems: 'center', justifyContent: 'center',
        overflow: 'hidden'
    },
    avatarImg: { width: '100%', height: '100%', borderRadius: 50 },
    avatarTxt: { fontSize: 42, fontWeight: '900', color: '#fff' },
    editBadge: {
        position: 'absolute', bottom: 2, right: 2,
        backgroundColor: colors.primary,
        width: 28, height: 28, borderRadius: 14,
        alignItems: 'center', justifyContent: 'center',
        borderWidth: 3, borderColor: '#fff'
    },
    nameContainer: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
    userName: { fontSize: 24, fontWeight: '900', color: '#fff' },
    nameEditBtn: { padding: 4, marginLeft: 6, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 12 },
    userPhone: { fontSize: 14, color: 'rgba(255,255,255,0.8)', marginTop: 4, fontWeight: '600' },
    memberBadge: {
        flexDirection: 'row', alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.15)',
        paddingHorizontal: 12, paddingVertical: 6,
        borderRadius: 20, marginTop: 12, gap: 6
    },
    memberBadgeTxt: { color: '#fff', fontSize: 11, fontWeight: '800' },
    
    statsCard: {
        flexDirection: 'row',
        backgroundColor: colors.card,
        marginHorizontal: 20,
        padding: 20,
        borderRadius: 24,
        marginTop: -30,
        elevation: 6,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        justifyContent: 'space-around',
        alignItems: 'center'
    },
    statItem: { alignItems: 'center' },
    statValue: { fontSize: 20, fontWeight: '900', color: colors.primary },
    statLabel: { fontSize: 11, color: colors.subText, fontWeight: '600', marginTop: 4 },
    statDivider: { width: 1, height: 30, backgroundColor: colors.border },
    
    menuSection: { padding: 20 },
    menuSectionTitle: { fontSize: 13, fontWeight: '800', color: colors.subText, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 16, marginLeft: 4 },
    menuItem: {
        flexDirection: 'row', alignItems: 'center',
        backgroundColor: colors.card,
        padding: 12, borderRadius: 20,
        marginBottom: 12,
        borderWidth: 1, borderColor: colors.border
    },
    menuIconBox: {
        width: 44, height: 44, borderRadius: 14,
        alignItems: 'center', justifyContent: 'center',
        marginRight: 14
    },
    menuLabel: { flex: 1, fontSize: 16, fontWeight: '700', color: colors.text },
    langValueBox: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    langValue: { fontSize: 14, color: colors.primary, fontWeight: '700' },
    
    footer: { padding: 20, paddingBottom: 110, alignItems: 'center', marginTop: 10 },
    logoutBtn: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        backgroundColor: colors.error + '10',
        paddingVertical: 16, borderRadius: 20,
        width: '100%', gap: 10,
        borderWidth: 1, borderColor: colors.error + '20'
    },
    logoutBtnText: { color: colors.error, fontSize: 16, fontWeight: '800' },
    versionTxt: { marginTop: 20, fontSize: 12, color: colors.subText, fontWeight: '700' },
    manifesto: { marginTop: 4, fontSize: 11, color: colors.subText, fontStyle: 'italic' },
    
    modalBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
    modalCard: { backgroundColor: colors.card, borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 24 },
    modalTitle: { fontSize: 20, fontWeight: '900', color: colors.text, marginBottom: 20, textAlign: 'center' },
    langRow: { flexDirection: 'row', alignItems: 'center', padding: 18, borderRadius: 16, marginBottom: 8 },
    langSel: { backgroundColor: colors.iconBg, borderWidth: 1.5, borderColor: colors.primary + '30' },
    langIcon: { fontSize: 18, marginRight: 14 },
    langTxt: { fontSize: 16, color: colors.text, fontWeight: '600' },
    closeBtn: { marginTop: 16, padding: 16, alignItems: 'center' },
    closeTxt: { color: colors.subText, fontWeight: '800', fontSize: 15 },
    
    // Name Modal Inputs
    inputContainer: { 
        flexDirection: 'row', alignItems: 'center', backgroundColor: colors.inputBg, 
        borderRadius: 16, borderWidth: 1.5, borderColor: colors.border, paddingHorizontal: 16, marginBottom: 20 
    },
    inputIcon: { marginRight: 12 },
    input: { flex: 1, height: 54, fontSize: 16, color: colors.text, fontWeight: '600' },
    saveBtn: { backgroundColor: colors.primary, paddingVertical: 16, borderRadius: 16, alignItems: 'center' },
    saveBtnTxt: { color: '#fff', fontSize: 16, fontWeight: '800' },
});
