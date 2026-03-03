import React, { useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Modal,
    TouchableOpacity,
    Animated,
    Dimensions,
    Platform,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useTheme } from '../context/ThemeContext';
import { useTranslation } from 'react-i18next';
import LinearGradient from 'react-native-linear-gradient';

const { width } = Dimensions.get('window');

interface Props {
    isVisible: boolean;
    onAccept: () => void;
    onDecline: () => void;
}

export default function NotificationPermissionModal({ isVisible, onAccept, onDecline }: Props) {
    const { colors } = useTheme();
    const { t } = useTranslation();
    const scaleAnim = useRef(new Animated.Value(0.9)).current;
    const opacityAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (isVisible) {
            Animated.parallel([
                Animated.spring(scaleAnim, {
                    toValue: 1,
                    friction: 8,
                    tension: 40,
                    useNativeDriver: true,
                }),
                Animated.timing(opacityAnim, {
                    toValue: 1,
                    duration: 300,
                    useNativeDriver: true,
                }),
            ]).start();
        } else {
            scaleAnim.setValue(0.9);
            opacityAnim.setValue(0);
        }
    }, [isVisible, scaleAnim, opacityAnim]);

    return (
        <Modal
            transparent
            visible={isVisible}
            animationType="none"
            onRequestClose={onDecline}
        >
            <View style={styles.overlay}>
                <Animated.View
                    style={[
                        styles.container,
                        {
                            backgroundColor: colors.surface,
                            opacity: opacityAnim,
                            transform: [{ scale: scaleAnim }],
                            borderColor: colors.border,
                        },
                    ]}
                >
                    <LinearGradient
                        colors={[colors.primary + '20', 'transparent']}
                        style={styles.gradientHeader}
                    />

                    <View style={[styles.iconContainer, { backgroundColor: colors.primaryGlow, shadowColor: colors.primary }]}>
                        <Icon name="functions" size={40} color={colors.primary} />
                    </View>

                    <Text style={[styles.title, { color: colors.text }]}>
                        {t('common.notifications.permission_title', { defaultValue: 'Unlock Your IQ' })}
                    </Text>

                    <Text style={[styles.message, { color: colors.textSecondary }]}>
                        {t('common.notifications.permission_message', {
                            defaultValue: 'Get personalized daily math challenges and track your brain potential.'
                        })}
                    </Text>

                    <View style={styles.buttonContainer}>
                        <TouchableOpacity
                            onPress={onDecline}
                            style={[styles.button, styles.declineButton]}
                        >
                            <Text style={[styles.declineText, { color: colors.textMuted }]}>
                                {t('common.maybe_later')}
                            </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            onPress={onAccept}
                            activeOpacity={0.8}
                            style={styles.acceptButtonWrapper}
                        >
                            <LinearGradient
                                colors={[colors.primary, '#6C63FF']}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                                style={styles.acceptButton}
                            >
                                <Text style={styles.acceptText}>{t('common.save')}</Text>
                                <Icon name="notifications-active" size={18} color="#FFF" style={styles.buttonIcon} />
                            </LinearGradient>
                        </TouchableOpacity>
                    </View>
                </Animated.View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.7)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    container: {
        width: '100%',
        maxWidth: 340,
        borderRadius: 32,
        padding: 32,
        alignItems: 'center',
        borderWidth: 1,
        overflow: 'hidden',
    },
    gradientHeader: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: 120,
    },
    iconContainer: {
        width: 80,
        height: 80,
        borderRadius: 40,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 24,
        elevation: 10,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
    },
    title: {
        fontSize: 24,
        fontWeight: '800',
        textAlign: 'center',
        marginBottom: 12,
        letterSpacing: 0.5,
    },
    message: {
        fontSize: 15,
        textAlign: 'center',
        lineHeight: 22,
        marginBottom: 32,
        paddingHorizontal: 10,
    },
    buttonContainer: {
        flexDirection: 'row',
        width: '100%',
        gap: 12,
    },
    button: {
        flex: 1,
        height: 54,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
    },
    declineButton: {
        backgroundColor: 'transparent',
    },
    declineText: {
        fontSize: 15,
        fontWeight: '600',
    },
    acceptButtonWrapper: {
        flex: 1.5,
    },
    acceptButton: {
        height: 54,
        borderRadius: 18,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 8,
    },
    acceptText: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: '700',
    },
    buttonIcon: {
        marginLeft: 2,
    },
});
