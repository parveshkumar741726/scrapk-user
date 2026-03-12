import React, { useState, useEffect } from 'react';
import {
    View, Text, StyleSheet, TextInput, TouchableOpacity,
    ScrollView, Alert, ActivityIndicator, Modal, Image, Dimensions
} from 'react-native';
import * as SecureStore from 'expo-secure-store';
import * as ImagePicker from 'expo-image-picker';
import axios from 'axios';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { API_BASE } from '../config';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';

const { width } = Dimensions.get('window');

const SLOTS = ['8:00 AM - 11:00 AM', '11:00 AM - 2:00 PM', '2:00 PM - 5:00 PM', '5:00 PM - 8:00 PM'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const DEFAULT_CATEGORIES = [
    { icon: 'metal', name: 'Metal' }, { icon: 'bottle-wine', name: 'Plastic' },
    { icon: 'newspaper-variant-outline', name: 'Paper' }, { icon: 'laptop', name: 'Electronics' },
    { icon: 'glass-fragile', name: 'Glass' }, { icon: 'tshirt-crew', name: 'Clothes' },
];

const daysInMonth = (m, y) => new Date(y, m + 1, 0).getDate();
const formatDisplayDate = (d, m, y) => `${String(d).padStart(2, '0')} ${MONTHS[m]} ${y}`;

const LOCATIONS = {
    'Uttar Pradesh': ['Agra', 'Lucknow', 'Kanpur', 'Noida', 'Ghaziabad', 'Mathura', 'Meerut', 'Aligarh'],
    'Delhi': ['New Delhi', 'North Delhi', 'South Delhi', 'East Delhi', 'West Delhi'],
    'Haryana': ['Gurugram', 'Faridabad', 'Panipat', 'Rohtak', 'Ambala'],
    'Rajasthan': ['Jaipur', 'Jodhpur', 'Udaipur', 'Kota', 'Ajmer'],
    'Maharashtra': ['Mumbai', 'Pune', 'Nagpur', 'Nashik', 'Thane'],
    'Karnataka': ['Bengaluru', 'Mysuru', 'Hubli', 'Mangaluru'],
    'Gujarat': ['Ahmedabad', 'Surat', 'Vadodara', 'Rajkot'],
    'Tamil Nadu': ['Chennai', 'Coimbatore', 'Madurai', 'Tiruchirappalli']
};
const STATES = Object.keys(LOCATIONS).sort();

const getFirstDayOfMonth = (m, y) => new Date(y, m, 1).getDay();

export default function CreateSaleScreen({ navigation }) {
    const { colors, isDarkMode } = useTheme();
    const { t } = useLanguage();
    const s = getStyles(colors, isDarkMode);

    const now = new Date();
    const [step, setStep] = useState(1);
    const [selectedCategories, setSelectedCategories] = useState([]);
    const [quantity, setQuantity] = useState('');
    const [notes, setNotes] = useState('');
    const [images, setImages] = useState([]);
    const [categories, setCategories] = useState(DEFAULT_CATEGORIES);

    const [vendors, setVendors] = useState([]);
    const [selectedVendor, setSelectedVendor] = useState(null);
    const [loadingVendors, setLoadingVendors] = useState(false);

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

    const [showListModal, setShowListModal] = useState(false);
    const [dropdownType, setDropdownType] = useState('state');

    const [loading, setLoading] = useState(false);

    useEffect(() => {
        (async () => {
            try {
                const res = await axios.get(`${API_BASE}/categories`);
                if (res.data.data?.length) {
                    setCategories(res.data.data.map(c => ({
                        icon: c.iconId || 'recycle', name: c.name, id: c._id, price: c.pricePerKg,
                    })));
                }
            } catch (_) { }
        })();
    }, []);

    const maxDay = daysInMonth(month, year);
    const incMonth = () => {
        setMonth(m => {
            const n = (m + 1) % 12;
            const newYear = n === 0 ? year + 1 : year;
            if (n === 0) setYear(newYear);
            if (day > daysInMonth(n, newYear)) setDay(1);
            return n;
        });
    };
    const decMonth = () => {
        setMonth(m => {
            const n = (m + 11) % 12;
            const newYear = n === 11 ? year - 1 : year;
            if (newYear < now.getFullYear() || (newYear === now.getFullYear() && n < now.getMonth())) return m;
            if (n === 11) setYear(newYear);
            if (day > daysInMonth(n, newYear)) setDay(1);
            return n;
        });
    };

    const displayDate = formatDisplayDate(day, month, year);

    const getScheduledDate = () => {
        const d = new Date(year, month, day);
        d.setHours(6, 0, 0, 0);
        return d.toISOString();
    };

    const fullAddress = [house, village, city, state, pincode].filter(Boolean).join(', ');

    const fetchVendors = async () => {
        setLoadingVendors(true);
        try {
            const token = await SecureStore.getItemAsync('token');
            const res = await axios.get(`${API_BASE}/users?role=vendor&city=${city}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setVendors(res.data.data || []);
        } catch (_) { }
        setLoadingVendors(false);
    };

    const submit = async () => {
        if (selectedCategories.length === 0) return Alert.alert('Required', 'Please select at least one scrap category.');
        if (!quantity) return Alert.alert('Required', 'Enter estimated quantity.');
        if (!slot) return Alert.alert('Required', 'Please select a time slot.');
        if (!city.trim()) return Alert.alert('Required', 'Enter city/town.');
        if (pincode.length !== 6) return Alert.alert('Required', 'Enter a valid 6-digit pincode.');
        if (!selectedVendor) return Alert.alert('Required', 'Please select a vendor.');

        setLoading(true);
        try {
            const token = await SecureStore.getItemAsync('token');
            await axios.post(`${API_BASE}/sales`, {
                categories: selectedCategories.map(c => c.id || c.name),
                estimatedQty: parseFloat(quantity),
                scheduledDate: getScheduledDate(),
                scheduledSlot: slot,
                pickupAddress: fullAddress,
                city,
                notes,
                vendorId: selectedVendor._id,
                images: images.map(img => `data:image/jpeg;base64,${img}`),
            }, { headers: { Authorization: `Bearer ${token}` } });

            Alert.alert('✅ Pickup Assigned!', 'Your scrap pickup has been scheduled.', [
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
            <LinearGradient
                colors={isDarkMode ? ['#064e3b', '#0a1910'] : ['#16a34a', '#10b981']}
                style={s.header}
            >
                <View style={s.headerContent}>
                    <TouchableOpacity onPress={() => step > 1 ? setStep(step - 1) : navigation.goBack()} style={s.backBtn}>
                        <MaterialCommunityIcons name="chevron-left" size={32} color="#fff" />
                    </TouchableOpacity>
                    <View style={s.headerCenter}>
                        <Text style={s.title}>{t.sellScrap}</Text>
                        <Text style={s.subtitle}>Step {step} of 3</Text>
                    </View>
                    <View style={s.headerRight}>
                        <CircularProgress step={step} total={3} />
                    </View>
                </View>
            </LinearGradient>

            <ScrollView contentContainerStyle={s.scrollContent} keyboardShouldPersistTaps="handled">
                {step === 1 ? (
                    <View style={s.stepContainer}>
                        <Text style={s.sectionTitle}>What are you selling?</Text>
                        <Text style={s.sectionSub}>Select all that apply</Text>
                        
                        <View style={s.catGrid}>
                            {categories.map(c => {
                                const isSelected = selectedCategories.some(sc => sc.name === c.name);
                                return (
                                    <TouchableOpacity
                                        key={c.name} activeOpacity={0.8}
                                        style={[s.catCard, isSelected && s.catSelected]}
                                        onPress={() => {
                                            if (isSelected) {
                                                setSelectedCategories(prev => prev.filter(sc => sc.name !== c.name));
                                            } else {
                                                setSelectedCategories(prev => [...prev, c]);
                                            }
                                        }}
                                    >
                                        <View style={[s.catIconBox, isSelected && s.catIconBoxSelected]}>
                                            <MaterialCommunityIcons 
                                                name={c.icon} 
                                                size={28} 
                                                color={isSelected ? '#fff' : colors.primary} 
                                            />
                                        </View>
                                        <Text style={[s.catName, isSelected && s.catNameSel]}>{c.name}</Text>
                                        {c.price && <Text style={s.catPrice}>₹{c.price}/kg</Text>}
                                    </TouchableOpacity>
                                );
                            })}
                        </View>

                        <Text style={s.fieldLabel}>Estimated Quantity (kg) *</Text>
                        <View style={s.inputContainer}>
                            <MaterialCommunityIcons name="weight-kilogram" size={20} color={colors.primary} style={s.inputIcon} />
                            <TextInput
                                style={s.input} placeholder="e.g. 15" placeholderTextColor={colors.subText}
                                value={quantity} onChangeText={setQuantity} keyboardType="decimal-pad"
                            />
                        </View>

                        <Text style={s.fieldLabel}>Scrap Pictures (Optional, max 3)</Text>
                        <View style={s.imageUploadContainer}>
                            {images.map((img, idx) => (
                                <View key={idx} style={s.imageWrapper}>
                                    <Image source={{ uri: `data:image/jpeg;base64,${img}` }} style={s.uploadedImg} />
                                    <TouchableOpacity 
                                        style={s.removeImgBtn} 
                                        onPress={() => setImages(prev => prev.filter((_, i) => i !== idx))}
                                    >
                                        <MaterialCommunityIcons name="close" size={14} color="#fff" />
                                    </TouchableOpacity>
                                </View>
                            ))}
                            {images.length < 3 && (
                                <TouchableOpacity
                                    style={s.addImgBtn} activeOpacity={0.8}
                                    onPress={async () => {
                                        const result = await ImagePicker.launchImageLibraryAsync({
                                            mediaTypes: ['images'], base64: true, quality: 0.5,
                                        });
                                        if (!result.canceled) setImages(prev => [...prev, result.assets[0].base64].slice(0, 3));
                                    }}
                                >
                                    <MaterialCommunityIcons name="camera-plus-outline" size={30} color={colors.primary} />
                                    <Text style={s.addImgText}>Add Photo</Text>
                                </TouchableOpacity>
                            )}
                        </View>

                        <Text style={s.fieldLabel}>Additional Notes (optional)</Text>
                        <TextInput
                            style={[s.input, s.textArea]}
                            placeholder="Any special instructions for the vendor?"
                            placeholderTextColor={colors.subText} value={notes}
                            onChangeText={setNotes} multiline
                        />

                        <TouchableOpacity
                            style={[s.primaryBtn, selectedCategories.length === 0 && s.disabledBtn]}
                            onPress={() => {
                                if (selectedCategories.length === 0) return Alert.alert('Required', 'Select at least one category.');
                                if (!quantity) return Alert.alert('Required', 'Enter estimated quantity.');
                                setStep(2);
                            }} activeOpacity={0.85}
                        >
                            <Text style={s.primaryBtnText}>Continue to Scheduling</Text>
                            <MaterialCommunityIcons name="arrow-right" size={20} color="#fff" />
                        </TouchableOpacity>
                    </View>
                ) : step === 2 ? (
                    <View style={s.stepContainer}>
                        <Text style={s.sectionTitle}>When should we come?</Text>
                        <Text style={s.sectionSub}>Schedule your pickup slot</Text>
                        
                        <TouchableOpacity style={s.datePickerBtn} onPress={() => setShowDateModal(true)} activeOpacity={0.8}>
                            <View style={s.dateIconBox}>
                                <MaterialCommunityIcons name="calendar-month" size={24} color={colors.primary} />
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={s.dateLabel}>Pickup Date</Text>
                                <Text style={s.dateValue}>{displayDate}</Text>
                            </View>
                            <MaterialCommunityIcons name="chevron-right" size={24} color={colors.subText} />
                        </TouchableOpacity>

                        <Text style={s.fieldLabel}>Preferred Time Slot *</Text>
                        <View style={s.slotGrid}>
                            {SLOTS.map(sl => (
                                <TouchableOpacity
                                    key={sl} style={[s.slotCard, slot === sl && s.slotSelected]}
                                    onPress={() => setSlot(sl)} activeOpacity={0.8}
                                >
                                    <MaterialCommunityIcons 
                                        name={slot === sl ? "clock-check" : "clock-outline"} 
                                        size={20} 
                                        color={slot === sl ? colors.primary : colors.subText} 
                                    />
                                    <Text style={[s.slotText, slot === sl && s.slotTextSelected]}>{sl}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        <Text style={[s.sectionTitle, { marginTop: 32 }]}>Where is the pickup?</Text>
                        <Text style={s.sectionSub}>Your detailed local address</Text>

                        <View style={s.formGroup}>
                            <Text style={s.inputLabel}>House / Flat / Street</Text>
                            <View style={s.inputContainer}>
                                <MaterialCommunityIcons name="home-outline" size={20} color={colors.primary} style={s.inputIcon} />
                                <TextInput style={s.input} value={house} onChangeText={setHouse} />
                            </View>
                        </View>

                        <View style={s.formGroup}>
                            <Text style={s.inputLabel}>Village / Colony / Area</Text>
                            <View style={s.inputContainer}>
                                <MaterialCommunityIcons name="map-marker-outline" size={20} color={colors.primary} style={s.inputIcon} />
                                <TextInput style={s.input} value={village} onChangeText={setVillage} />
                            </View>
                        </View>

                        <View style={s.row}>
                            <View style={{ flex: 1, marginRight: 12 }}>
                                <Text style={s.inputLabel}>State *</Text>
                                <TouchableOpacity
                                    style={s.dropdown}
                                    onPress={() => { setDropdownType('state'); setShowListModal(true); }}
                                >
                                    <Text style={[s.dropdownValue, !state && { color: colors.subText }]} numberOfLines={1}>
                                        {state || 'Select State'}
                                    </Text>
                                    <MaterialCommunityIcons name="menu-down" size={20} color={colors.subText} />
                                </TouchableOpacity>
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={s.inputLabel}>City *</Text>
                                <TouchableOpacity
                                    style={[s.dropdown, !state && { opacity: 0.5 }]}
                                    onPress={() => {
                                        if (!state) return Alert.alert('Required', 'Select a state first.');
                                        setDropdownType('city');
                                        setShowListModal(true);
                                    }}
                                >
                                    <Text style={[s.dropdownValue, !city && { color: colors.subText }]} numberOfLines={1}>
                                        {city || 'Select City'}
                                    </Text>
                                    <MaterialCommunityIcons name="menu-down" size={20} color={colors.subText} />
                                </TouchableOpacity>
                            </View>
                        </View>

                        <View style={[s.formGroup, { marginTop: 12 }]}>
                            <Text style={s.inputLabel}>Pincode *</Text>
                            <View style={s.inputContainer}>
                                <MaterialCommunityIcons name="numeric-6-box-outline" size={20} color={colors.primary} style={s.inputIcon} />
                                <TextInput style={s.input} value={pincode}
                                    onChangeText={t => setPincode(t.replace(/\D/g, '').slice(0, 6))}
                                    keyboardType="number-pad" maxLength={6} />
                            </View>
                        </View>

                        <TouchableOpacity style={s.primaryBtn} onPress={() => {
                            if (!slot) return Alert.alert('Required', 'Please select a time slot.');
                            if (!city.trim()) return Alert.alert('Required', 'Enter city/town.');
                            if (pincode.length !== 6) return Alert.alert('Required', 'Enter a valid 6-digit pincode.');
                            setStep(3);
                            fetchVendors();
                        }} activeOpacity={0.85}>
                            <Text style={s.primaryBtnText}>Continue to Vendors</Text>
                            <MaterialCommunityIcons name="arrow-right" size={20} color="#fff" />
                        </TouchableOpacity>
                    </View>
                ) : (
                    <View style={s.stepContainer}>
                        <Text style={s.sectionTitle}>Assign a vendor</Text>
                        <Text style={s.sectionSub}>Verified scrap buyers in {city}</Text>

                        {loadingVendors ? (
                            <View style={s.loadingContainer}>
                                <ActivityIndicator size="large" color={colors.primary} />
                                <Text style={s.loadingText}>Fetching nearby vendors...</Text>
                            </View>
                        ) : vendors.length === 0 ? (
                            <View style={s.emptyVendors}>
                                <MaterialCommunityIcons name="store-off-outline" size={80} color={colors.subText} />
                                <Text style={s.emptyVendorsTitle}>No vendors found</Text>
                                <Text style={s.emptyVendorsSub}>There are no verified vendors listed in {city} yet.</Text>
                                <TouchableOpacity style={s.retryBtn} onPress={fetchVendors}>
                                    <Text style={s.retryBtnText}>Retry Search</Text>
                                </TouchableOpacity>
                            </View>
                        ) : (
                            <View style={s.vendorList}>
                                {vendors.map(v => (
                                    <TouchableOpacity
                                        key={v._id}
                                        style={[s.vendorCard, selectedVendor?._id === v._id && s.vendorCardSelected]}
                                        onPress={() => setSelectedVendor(v)}
                                        activeOpacity={0.8}
                                    >
                                        <LinearGradient 
                                            colors={selectedVendor?._id === v._id ? [colors.primary, colors.primary + 'cc'] : [colors.inputBg, colors.inputBg]} 
                                            style={s.vendorAvatar}
                                        >
                                            <Text style={[s.vendorInitial, selectedVendor?._id === v._id && { color: '#fff' }]}>
                                                {(v.shopName || v.name || 'V')[0].toUpperCase()}
                                            </Text>
                                        </LinearGradient>
                                        
                                        <View style={s.vendorInfo}>
                                            <Text style={s.vendorName}>{v.shopName || v.name}</Text>
                                            <View style={s.vendorStats}>
                                                <MaterialCommunityIcons name="star" size={14} color="#f59e0b" />
                                                <Text style={s.vendorRating}>{v.rating?.toFixed(1) || 'New'}</Text>
                                                <View style={s.dotSeparator} />
                                                <Text style={s.vendorExp}>{v.categories?.length || 0} categories</Text>
                                            </View>
                                        </View>

                                        <View style={[s.selectionCircle, selectedVendor?._id === v._id && s.selectionCircleActive]}>
                                            {selectedVendor?._id === v._id && <MaterialCommunityIcons name="check" size={16} color="#fff" />}
                                        </View>
                                    </TouchableOpacity>
                                ))}

                                <TouchableOpacity 
                                    style={[s.primaryBtn, (loading || !selectedVendor) && s.disabledBtn]} 
                                    onPress={submit} 
                                    disabled={loading || !selectedVendor} 
                                    activeOpacity={0.85}
                                >
                                    {loading ? (
                                        <ActivityIndicator color="#fff" />
                                    ) : (
                                        <>
                                            <Text style={s.primaryBtnText}>Confirm & Book Pickup</Text>
                                            <MaterialCommunityIcons name="check-decagram" size={20} color="#fff" />
                                        </>
                                    )}
                                </TouchableOpacity>
                            </View>
                        )}
                    </View>
                )}
            </ScrollView>

            {/* Date Picker Modal */}
            <Modal visible={showDateModal} transparent animationType="fade">
                <View style={s.modalOverlay}>
                    <View style={s.calendarCard}>
                        <View style={s.modalHeader}>
                            <Text style={s.modalTitle}>Select Pickup Date</Text>
                            <TouchableOpacity onPress={() => setShowDateModal(false)}>
                                <MaterialCommunityIcons name="close" size={24} color={colors.text} />
                            </TouchableOpacity>
                        </View>
                        
                        <View style={s.calendarNav}>
                            <TouchableOpacity onPress={decMonth} style={s.navBtn}>
                                <MaterialCommunityIcons name="chevron-left" size={28} color={colors.primary} />
                            </TouchableOpacity>
                            <Text style={s.monthLabel}>{MONTHS[month]} {year}</Text>
                            <TouchableOpacity onPress={incMonth} style={s.navBtn}>
                                <MaterialCommunityIcons name="chevron-right" size={28} color={colors.primary} />
                            </TouchableOpacity>
                        </View>

                        <View style={s.weekdayHeader}>
                            {['Su','Mo','Tu','We','Th','Fr','Sa'].map((d, i) => (
                                <Text key={i} style={s.weekdayText}>{d}</Text>
                            ))}
                        </View>

                        <View style={s.calendarGrid}>
                            {Array.from({ length: getFirstDayOfMonth(month, year) }).map((_, i) => (
                                <View key={`e-${i}`} style={s.dayCell} />
                            ))}
                            {Array.from({ length: maxDay }).map((_, i) => {
                                const d = i + 1;
                                const isSelected = d === day;
                                const isPast = new Date(year, month, d) < new Date(now.getFullYear(), now.getMonth(), now.getDate());
                                return (
                                    <TouchableOpacity 
                                        key={d} 
                                        style={[s.dayCell, isSelected && s.dayCellSelected, isPast && { opacity: 0.2 }]}
                                        onPress={() => { if (!isPast) setDay(d); }}
                                        disabled={isPast} activeOpacity={0.7}
                                    >
                                        <Text style={[s.dayText, isSelected && s.dayTextSelected]}>{d}</Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>

                        <TouchableOpacity style={s.confirmBtn} onPress={() => setShowDateModal(false)}>
                            <Text style={s.confirmBtnText}>Confirm Date</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            {/* List Modal */}
            <Modal visible={showListModal} transparent animationType="fade">
                <View style={s.modalOverlay}>
                    <View style={s.listCard}>
                        <View style={s.modalHeader}>
                            <Text style={s.modalTitle}>
                                {dropdownType === 'state' ? 'Select State' : 'Select City'}
                            </Text>
                            <TouchableOpacity onPress={() => setShowListModal(false)}>
                                <MaterialCommunityIcons name="close" size={24} color={colors.text} />
                            </TouchableOpacity>
                        </View>
                        <ScrollView style={s.listScrollView}>
                            {(dropdownType === 'state' ? STATES : (LOCATIONS[state] || [])).map(item => (
                                <TouchableOpacity
                                    key={item}
                                    style={s.listItem}
                                    onPress={() => {
                                        if (dropdownType === 'state') {
                                            setState(item);
                                            setCity('');
                                        } else {
                                            setCity(item);
                                        }
                                        setShowListModal(false);
                                    }}
                                >
                                    <Text style={[s.listItemText, (dropdownType === 'state' ? state : city) === item && s.listItemTextActive]}>
                                        {item}
                                    </Text>
                                    {(dropdownType === 'state' ? state : city) === item && (
                                        <MaterialCommunityIcons name="check" size={20} color={colors.primary} />
                                    )}
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const CircularProgress = ({ step, total }) => {
    const size = 36;
    const strokeWidth = 3;
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const progress = (step / total) * circumference;
    
    return (
        <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
            {/* Background Circle */}
            <View style={{
                position: 'absolute',
                width: size, height: size,
                borderRadius: size / 2,
                borderWidth: strokeWidth,
                borderColor: 'rgba(255,255,255,0.2)'
            }} />
            <Text style={{ color: '#fff', fontSize: 10, fontWeight: 'bold' }}>{step}/{total}</Text>
        </View>
    );
};

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
    headerContent: { flexDirection: 'row', alignItems: 'center' },
    backBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center', borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.15)' },
    headerCenter: { flex: 1, marginLeft: 16 },
    title: { fontSize: 20, fontWeight: '800', color: '#fff' },
    subtitle: { fontSize: 13, color: 'rgba(255,255,255,0.8)', fontWeight: '600' },
    headerRight: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
    
    scrollContent: { paddingBottom: 40 },
    stepContainer: { padding: 20 },
    sectionTitle: { fontSize: 22, fontWeight: '800', color: colors.text, marginBottom: 4 },
    sectionSub: { fontSize: 14, color: colors.subText, marginBottom: 24, fontWeight: '500' },
    
    catGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: 24 },
    catCard: { 
        width: '31%', 
        backgroundColor: colors.card, 
        borderRadius: 20, 
        padding: 12, 
        alignItems: 'center', 
        marginBottom: 12,
        borderWidth: 1.5,
        borderColor: colors.border,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4
    },
    catSelected: { borderColor: colors.primary, backgroundColor: colors.iconBg },
    catIconBox: { 
        width: 54, height: 54, 
        borderRadius: 16, 
        backgroundColor: colors.inputBg, 
        alignItems: 'center', justifyContent: 'center', 
        marginBottom: 8 
    },
    catIconBoxSelected: { backgroundColor: colors.primary },
    catName: { fontSize: 12, fontWeight: '700', color: colors.text, textAlign: 'center' },
    catNameSel: { color: colors.primary },
    catPrice: { fontSize: 10, color: colors.subText, marginTop: 2, fontWeight: '600' },
    
    fieldLabel: { fontSize: 14, fontWeight: '700', color: colors.text, marginTop: 20, marginBottom: 12 },
    inputContainer: { 
        flexDirection: 'row', 
        alignItems: 'center', 
        backgroundColor: colors.card, 
        borderRadius: 16, 
        borderWidth: 1.5, 
        borderColor: colors.border,
        paddingHorizontal: 16
    },
    inputIcon: { marginRight: 12 },
    input: { 
        flex: 1, 
        height: 54, 
        fontSize: 16, 
        color: colors.text, 
        fontWeight: '600' 
    },
    textArea: { 
        height: 120, 
        textAlignVertical: 'top', 
        paddingTop: 16, 
        backgroundColor: colors.card, 
        borderRadius: 16, 
        borderWidth: 1.5, 
        borderColor: colors.border,
        paddingHorizontal: 16,
        fontSize: 16,
        color: colors.text
    },
    
    imageUploadContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 10 },
    imageWrapper: { width: 100, height: 100, borderRadius: 16, overflow: 'hidden', backgroundColor: colors.inputBg },
    uploadedImg: { width: '100%', height: '100%' },
    addImgBtn: { 
        width: 100, height: 100, 
        borderRadius: 16, 
        borderWidth: 2, 
        borderStyle: 'dashed', 
        borderColor: colors.primary, 
        alignItems: 'center', justifyContent: 'center',
        backgroundColor: colors.iconBg
    },
    addImgText: { fontSize: 11, color: colors.primary, fontWeight: '700', marginTop: 4 },
    removeImgBtn: { 
        position: 'absolute', top: 6, right: 6, 
        backgroundColor: colors.error, 
        width: 22, height: 22, borderRadius: 11, 
        alignItems: 'center', justifyContent: 'center',
        elevation: 3
    },
    
    primaryBtn: { 
        backgroundColor: colors.primary, 
        height: 58, 
        borderRadius: 18, 
        flexDirection: 'row', 
        alignItems: 'center', justifyContent: 'center', 
        marginTop: 32,
        elevation: 4,
        shadowColor: colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8
    },
    primaryBtnText: { color: '#fff', fontSize: 17, fontWeight: '800', marginRight: 8 },
    disabledBtn: { opacity: 0.6 },
    
    // Step 2 Styles
    datePickerBtn: { 
        flexDirection: 'row', 
        alignItems: 'center', 
        backgroundColor: colors.card, 
        borderRadius: 20, 
        padding: 16, 
        borderWidth: 1.5, 
        borderColor: colors.border,
        elevation: 2
    },
    dateIconBox: { 
        width: 48, height: 48, 
        borderRadius: 14, 
        backgroundColor: colors.iconBg, 
        alignItems: 'center', justifyContent: 'center', 
        marginRight: 16 
    },
    dateLabel: { fontSize: 13, color: colors.subText, fontWeight: '600' },
    dateValue: { fontSize: 16, fontWeight: '800', color: colors.text, marginTop: 2 },
    
    slotGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
    slotCard: { 
        width: '48.5%', 
        flexDirection: 'row', 
        alignItems: 'center', 
        backgroundColor: colors.card, 
        borderRadius: 14, 
        padding: 14, 
        borderWidth: 1.5, 
        borderColor: colors.border 
    },
    slotSelected: { borderColor: colors.primary, backgroundColor: colors.iconBg },
    slotText: { fontSize: 12, color: colors.subText, fontWeight: '600', marginLeft: 8 },
    slotTextSelected: { color: colors.primary, fontWeight: '800' },
    
    formGroup: { marginBottom: 16 },
    inputLabel: { fontSize: 12, fontWeight: '700', color: colors.subText, marginBottom: 8, marginLeft: 4 },
    row: { flexDirection: 'row' },
    dropdown: { 
        flexDirection: 'row', 
        alignItems: 'center', 
        backgroundColor: colors.card, 
        borderRadius: 16, 
        height: 54, 
        borderWidth: 1.5, 
        borderColor: colors.border,
        paddingHorizontal: 16
    },
    dropdownValue: { flex: 1, fontSize: 14, fontWeight: '700', color: colors.text },
    
    // Step 3 Styles
    loadingContainer: { alignItems: 'center', paddingVertical: 60 },
    loadingText: { marginTop: 16, fontSize: 15, color: colors.subText, fontWeight: '600' },
    emptyVendors: { alignItems: 'center', paddingVertical: 40 },
    emptyVendorsTitle: { fontSize: 20, fontWeight: '800', color: colors.text, marginTop: 20 },
    emptyVendorsSub: { fontSize: 14, color: colors.subText, textAlign: 'center', marginTop: 8, paddingHorizontal: 40, lineHeight: 20 },
    retryBtn: { marginTop: 24, paddingVertical: 12, paddingHorizontal: 24, borderRadius: 12, backgroundColor: colors.iconBg },
    retryBtnText: { color: colors.primary, fontWeight: '800' },
    
    vendorList: { gap: 12 },
    vendorCard: { 
        flexDirection: 'row', 
        alignItems: 'center', 
        backgroundColor: colors.card, 
        padding: 16, 
        borderRadius: 24, 
        borderWidth: 1.5, 
        borderColor: colors.border,
        elevation: 2
    },
    vendorCardSelected: { borderColor: colors.primary, backgroundColor: colors.iconBg },
    vendorAvatar: { width: 52, height: 52, borderRadius: 18, alignItems: 'center', justifyContent: 'center', marginRight: 16 },
    vendorInitial: { fontSize: 22, fontWeight: 'bold' },
    vendorInfo: { flex: 1 },
    vendorName: { fontSize: 16, fontWeight: '800', color: colors.text, marginBottom: 4 },
    vendorStats: { flexDirection: 'row', alignItems: 'center' },
    vendorRating: { fontSize: 13, fontWeight: '700', color: colors.text, marginLeft: 4 },
    dotSeparator: { width: 4, height: 4, borderRadius: 2, backgroundColor: colors.border, marginHorizontal: 8 },
    vendorExp: { fontSize: 13, color: colors.subText, fontWeight: '500' },
    selectionCircle: { width: 28, height: 28, borderRadius: 14, borderWidth: 2, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
    selectionCircleActive: { backgroundColor: colors.primary, borderColor: colors.primary },
    
    // Modal Styles
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
    calendarCard: { backgroundColor: colors.card, borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 24 },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    modalTitle: { fontSize: 18, fontWeight: '800', color: colors.text },
    calendarNav: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
    navBtn: { padding: 4 },
    monthLabel: { fontSize: 18, fontWeight: '800', color: colors.text },
    weekdayHeader: { flexDirection: 'row', marginBottom: 12 },
    weekdayText: { flex: 1, textAlign: 'center', fontSize: 13, fontWeight: '700', color: colors.subText },
    calendarGrid: { flexDirection: 'row', flexWrap: 'wrap' },
    dayCell: { width: '14.28%', aspectRatio: 1, alignItems: 'center', justifyContent: 'center', borderRadius: 12 },
    dayCellSelected: { backgroundColor: colors.primary },
    dayText: { fontSize: 16, fontWeight: '600', color: colors.text },
    dayTextSelected: { color: '#fff', fontWeight: '800' },
    confirmBtn: { backgroundColor: colors.primary, height: 56, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginTop: 24 },
    confirmBtnText: { color: '#fff', fontSize: 16, fontWeight: '800' },
    
    listCard: { backgroundColor: colors.card, borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 24, maxHeight: '80%' },
    listScrollView: { marginTop: 10 },
    listItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 18, borderBottomWidth: 1, borderBottomColor: colors.border },
    listItemText: { fontSize: 16, fontWeight: '600', color: colors.text },
    listItemTextActive: { color: colors.primary, fontWeight: '800' },
});

