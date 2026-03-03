// SettingsScreen — Profile, theme toggle, sound, rank, notifications

import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Image,
    ScrollView,
    Switch,
    Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import GradientBackground from '../components/GradientBackground';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { useSound } from '../context/SoundContext';
import { getUserScore } from '../utils/storageHelper';
import { getCompletedQuestions } from '../utils/storageHelper';
import {
    getNotificationsEnabled,
    setNotificationsEnabled,
} from '../utils/storageHelper';
import { getRankInfo } from '../utils/rankCalculator';
import { getUserRank } from '../services/firebaseService';
import { APP_NAME, APP_VERSION } from '../utils/constants';

export default function SettingsScreen({ navigation }: any) {
    const { colors, isDark, toggleTheme } = useTheme();
    const { user, isSignedIn, signInWithGoogle, signOut } = useAuth();
    const { soundEnabled, toggleSound } = useSound();
    const [notificationsEnabled, setNotificationsEnabledState] = useState(true);
    const [score, setScore] = useState(0);
    const [completedCount, setCompletedCount] = useState(0);
    const [globalRank, setGlobalRank] = useState(0);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        const s = await getUserScore();
        setScore(s);
        const completed = await getCompletedQuestions();
        setCompletedCount(completed.length);
        const notifEnabled = await getNotificationsEnabled();
        setNotificationsEnabledState(notifEnabled);

        if (isSignedIn && user) {
            const rankData = await getUserRank(user.uid);
            setGlobalRank(rankData.rank);
        }
    };

    const handleNotificationsToggle = (value: boolean) => {
        setNotificationsEnabledState(value);
        setNotificationsEnabled(value);
    };

    const handleSignOut = () => {
        Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Sign Out',
                style: 'destructive',
                onPress: async () => {
                    await signOut();
                    navigation.goBack();
                },
            },
        ]);
    };

    const rankInfo = getRankInfo(score);

    const SettingRow = ({
        icon,
        label,
        value,
        onToggle,
        isSwitch = false,
        rightText,
        iconColor,
    }: any) => (
        <View style={[styles.settingRow, { borderBottomColor: colors.border }]}>
            <View style={[styles.settingIcon, { backgroundColor: `${iconColor || colors.primary}15` }]}>
                <Icon name={icon} size={22} color={iconColor || colors.primary} />
            </View>
            <Text style={[styles.settingLabel, { color: colors.text }]}>{label}</Text>
            {isSwitch ? (
                <Switch
                    value={value}
                    onValueChange={onToggle}
                    trackColor={{ false: colors.border, true: colors.primaryGlow }}
                    thumbColor={value ? colors.primary : colors.textMuted}
                />
            ) : rightText ? (
                <Text style={[styles.settingValue, { color: colors.textSecondary }]}>{rightText}</Text>
            ) : null}
        </View>
    );

    return (
        <GradientBackground>
            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                        <Icon name="arrow-back-ios" size={20} color={colors.text} />
                    </TouchableOpacity>
                    <Text style={[styles.headerTitle, { color: colors.text }]}>Settings</Text>
                    <View style={{ width: 36 }} />
                </View>

                {/* Profile Section */}
                <View style={[styles.profileCard, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
                    {isSignedIn && user ? (
                        <>
                            <View style={[styles.avatarLarge, { borderColor: colors.primary }]}>
                                {user.photoURL ? (
                                    <Image source={{ uri: user.photoURL }} style={styles.avatarImage} />
                                ) : (
                                    <Icon name="person" size={40} color={colors.textSecondary} />
                                )}
                            </View>
                            <Text style={[styles.userName, { color: colors.text }]}>{user.displayName}</Text>
                            <Text style={[styles.userEmail, { color: colors.textSecondary }]}>{user.email}</Text>
                        </>
                    ) : (
                        <>
                            <View style={[styles.avatarLarge, { borderColor: colors.border }]}>
                                <Icon name="person-outline" size={40} color={colors.textMuted} />
                            </View>
                            <Text style={[styles.userName, { color: colors.text }]}>Guest Player</Text>
                            <TouchableOpacity
                                onPress={signInWithGoogle}
                                style={[styles.signInBtn, { backgroundColor: colors.primary }]}>
                                <Icon name="login" size={18} color="#FFFFFF" />
                                <Text style={styles.signInBtnText}>Sign in with Google</Text>
                            </TouchableOpacity>
                        </>
                    )}
                </View>

                {/* Rank Card */}
                <View style={[styles.rankCard, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
                    <View style={[styles.rankIconWrapper, { backgroundColor: `${rankInfo.color}20` }]}>
                        <Icon name={rankInfo.icon} size={32} color={rankInfo.color} />
                    </View>
                    <View style={styles.rankInfo}>
                        <Text style={[styles.rankTitle, { color: rankInfo.color }]}>{rankInfo.title}</Text>
                        <Text style={[styles.rankScore, { color: colors.textSecondary }]}>Score: {score}</Text>
                        {globalRank > 0 && (
                            <Text style={[styles.globalRank, { color: colors.secondary }]}>
                                🌍 Global Rank #{globalRank}
                            </Text>
                        )}
                    </View>
                    {/* Progress to next rank */}
                    {rankInfo.nextRankTitle && (
                        <View style={styles.rankProgress}>
                            <View style={[styles.rankProgressBar, { backgroundColor: colors.border }]}>
                                <View
                                    style={[
                                        styles.rankProgressFill,
                                        {
                                            backgroundColor: rankInfo.color,
                                            width: `${rankInfo.progress * 100}%`,
                                        },
                                    ]}
                                />
                            </View>
                            <Text style={[styles.nextRankText, { color: colors.textMuted }]}>
                                Next: {rankInfo.nextRankTitle} ({rankInfo.nextRankScore} pts)
                            </Text>
                        </View>
                    )}
                </View>

                {/* Stats Row */}
                <View style={styles.statsRow}>
                    <View style={[styles.statItem, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
                        <Icon name="check-circle" size={24} color={colors.correct} />
                        <Text style={[styles.statNumber, { color: colors.text }]}>{completedCount}</Text>
                        <Text style={[styles.statLabel, { color: colors.textMuted }]}>Solved</Text>
                    </View>
                    <View style={[styles.statItem, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
                        <Icon name="star" size={24} color={colors.secondary} />
                        <Text style={[styles.statNumber, { color: colors.text }]}>{score}</Text>
                        <Text style={[styles.statLabel, { color: colors.textMuted }]}>Points</Text>
                    </View>
                    <View style={[styles.statItem, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
                        <Icon name="emoji-events" size={24} color={rankInfo.color} />
                        <Text style={[styles.statNumber, { color: colors.text }]}>#{globalRank || '—'}</Text>
                        <Text style={[styles.statLabel, { color: colors.textMuted }]}>Rank</Text>
                    </View>
                </View>

                {/* Settings Section */}
                <View style={[styles.settingsSection, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
                    <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>PREFERENCES</Text>
                    <SettingRow
                        icon={isDark ? 'dark-mode' : 'light-mode'}
                        label="Dark Mode"
                        value={isDark}
                        onToggle={toggleTheme}
                        isSwitch
                        iconColor={isDark ? '#FFC107' : '#FF9800'}
                    />
                    <SettingRow
                        icon={soundEnabled ? 'volume-up' : 'volume-off'}
                        label="Sound Effects"
                        value={soundEnabled}
                        onToggle={toggleSound}
                        isSwitch
                        iconColor="#00D4AA"
                    />
                    <SettingRow
                        icon="notifications"
                        label="Notifications"
                        value={notificationsEnabled}
                        onToggle={handleNotificationsToggle}
                        isSwitch
                        iconColor="#FF6B9D"
                    />
                </View>

                {/* About Section */}
                <View style={[styles.settingsSection, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
                    <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>ABOUT</Text>
                    <SettingRow icon="info-outline" label="Version" rightText={APP_VERSION} iconColor={colors.textSecondary} />
                    <SettingRow icon="psychology" label="App" rightText={APP_NAME} iconColor={colors.primary} />
                </View>

                {/* Sign Out */}
                {isSignedIn && (
                    <TouchableOpacity
                        onPress={handleSignOut}
                        style={[styles.signOutBtn, { borderColor: colors.wrong }]}>
                        <Icon name="logout" size={20} color={colors.wrong} />
                        <Text style={[styles.signOutText, { color: colors.wrong }]}>Sign Out</Text>
                    </TouchableOpacity>
                )}

                <View style={styles.bottomSpacer} />
            </ScrollView>
        </GradientBackground>
    );
}

const styles = StyleSheet.create({
    scrollContent: {
        paddingBottom: 40,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingTop: 50,
        paddingBottom: 16,
    },
    backBtn: {
        padding: 8,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: '700',
        letterSpacing: 0.5,
    },
    profileCard: {
        marginHorizontal: 16,
        borderRadius: 20,
        borderWidth: 1,
        padding: 24,
        alignItems: 'center',
        marginBottom: 16,
    },
    avatarLarge: {
        width: 80,
        height: 80,
        borderRadius: 40,
        borderWidth: 3,
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
        marginBottom: 12,
    },
    avatarImage: {
        width: 76,
        height: 76,
        borderRadius: 38,
    },
    userName: {
        fontSize: 20,
        fontWeight: '700',
        marginBottom: 4,
    },
    userEmail: {
        fontSize: 14,
        fontWeight: '400',
    },
    signInBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 20,
        marginTop: 12,
    },
    signInBtnText: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: '700',
    },
    rankCard: {
        marginHorizontal: 16,
        borderRadius: 20,
        borderWidth: 1,
        padding: 20,
        marginBottom: 16,
    },
    rankIconWrapper: {
        width: 56,
        height: 56,
        borderRadius: 28,
        justifyContent: 'center',
        alignItems: 'center',
        alignSelf: 'center',
        marginBottom: 12,
    },
    rankInfo: {
        alignItems: 'center',
        marginBottom: 12,
    },
    rankTitle: {
        fontSize: 24,
        fontWeight: '800',
        letterSpacing: 1,
    },
    rankScore: {
        fontSize: 14,
        fontWeight: '500',
        marginTop: 4,
    },
    globalRank: {
        fontSize: 14,
        fontWeight: '600',
        marginTop: 4,
    },
    rankProgress: {
        marginTop: 8,
    },
    rankProgressBar: {
        height: 6,
        borderRadius: 3,
        overflow: 'hidden',
        marginBottom: 6,
    },
    rankProgressFill: {
        height: '100%',
        borderRadius: 3,
    },
    nextRankText: {
        fontSize: 12,
        fontWeight: '500',
        textAlign: 'center',
    },
    statsRow: {
        flexDirection: 'row',
        gap: 10,
        marginHorizontal: 16,
        marginBottom: 16,
    },
    statItem: {
        flex: 1,
        alignItems: 'center',
        paddingVertical: 16,
        borderRadius: 16,
        borderWidth: 1,
    },
    statNumber: {
        fontSize: 18,
        fontWeight: '700',
        marginTop: 6,
    },
    statLabel: {
        fontSize: 11,
        fontWeight: '500',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginTop: 2,
    },
    settingsSection: {
        marginHorizontal: 16,
        borderRadius: 20,
        borderWidth: 1,
        paddingVertical: 8,
        paddingHorizontal: 16,
        marginBottom: 16,
    },
    sectionTitle: {
        fontSize: 12,
        fontWeight: '600',
        letterSpacing: 1,
        paddingVertical: 12,
        paddingHorizontal: 4,
    },
    settingRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 14,
        borderBottomWidth: 0.5,
    },
    settingIcon: {
        width: 36,
        height: 36,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    settingLabel: {
        flex: 1,
        fontSize: 15,
        fontWeight: '500',
    },
    settingValue: {
        fontSize: 14,
        fontWeight: '400',
    },
    signOutBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        marginHorizontal: 16,
        paddingVertical: 14,
        borderRadius: 16,
        borderWidth: 1.5,
    },
    signOutText: {
        fontSize: 15,
        fontWeight: '700',
    },
    bottomSpacer: {
        height: 20,
    },
});
