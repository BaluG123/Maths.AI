// Option Button — Premium glassmorphism answer option with animated feedback
// Fixed: overflow hidden on wrapper to prevent square border clipping on Android

import React, { useRef, useEffect } from 'react';
import { Pressable, Text, View, StyleSheet, Animated, Platform } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useTheme } from '../context/ThemeContext';

interface Props {
    label: string;
    index: number;
    onPress: () => void;
    disabled: boolean;
    state: 'default' | 'correct' | 'wrong' | 'selected';
}

const OPTION_LETTERS = ['A', 'B', 'C', 'D'];
const OPTION_GRADIENTS = [
    { start: '#6C63FF', end: '#9B59FC' }, // Purple
    { start: '#00D4AA', end: '#00B4D8' }, // Teal
    { start: '#FF6B9D', end: '#FF8E53' }, // Pink-Orange
    { start: '#FFC107', end: '#FF9800' }, // Gold
];

export default function OptionButton({ label, index, onPress, disabled, state }: Props) {
    const { colors } = useTheme();
    const shakeAnim = useRef(new Animated.Value(0)).current;
    const scaleAnim = useRef(new Animated.Value(1)).current;
    const pressScale = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        if (state === 'wrong') {
            Animated.sequence([
                Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
                Animated.timing(shakeAnim, { toValue: -10, duration: 50, useNativeDriver: true }),
                Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
                Animated.timing(shakeAnim, { toValue: -10, duration: 50, useNativeDriver: true }),
                Animated.timing(shakeAnim, { toValue: 0, duration: 50, useNativeDriver: true }),
            ]).start();
        } else if (state === 'correct') {
            Animated.sequence([
                Animated.spring(scaleAnim, { toValue: 1.04, tension: 100, friction: 4, useNativeDriver: true }),
                Animated.spring(scaleAnim, { toValue: 1, tension: 60, friction: 6, useNativeDriver: true }),
            ]).start();
        } else {
            shakeAnim.setValue(0);
            scaleAnim.setValue(1);
        }
    }, [state, shakeAnim, scaleAnim]);

    const getBgColor = () => {
        if (state === 'correct') return colors.correctBg;
        if (state === 'wrong') return colors.wrongBg;
        if (state === 'selected') return colors.primaryGlow;
        return 'transparent';
    };

    const getBorderColor = () => {
        if (state === 'correct') return colors.correct;
        if (state === 'wrong') return colors.wrong;
        if (state === 'selected') return colors.primary;
        return colors.border;
    };

    const getIcon = () => {
        if (state === 'correct') return <Icon name="check-circle" size={24} color={colors.correct} />;
        if (state === 'wrong') return <Icon name="cancel" size={24} color={colors.wrong} />;
        return <Icon name="arrow-forward-ios" size={14} color={colors.textMuted} />;
    };

    const gradient = OPTION_GRADIENTS[index % OPTION_GRADIENTS.length];
    const isAnswered = state === 'correct' || state === 'wrong';

    const handlePressIn = () => {
        if (!disabled) {
            Animated.spring(pressScale, {
                toValue: 0.96,
                tension: 100,
                friction: 8,
                useNativeDriver: true,
            }).start();
        }
    };

    const handlePressOut = () => {
        Animated.spring(pressScale, {
            toValue: 1,
            tension: 60,
            friction: 6,
            useNativeDriver: true,
        }).start();
    };

    return (
        <Animated.View
            style={[
                styles.outerWrapper,
                {
                    transform: [{ translateX: shakeAnim }, { scale: scaleAnim }, { scale: pressScale }],
                },
            ]}>
            <Pressable
                onPress={onPress}
                onPressIn={handlePressIn}
                onPressOut={handlePressOut}
                disabled={disabled}
                android_disableSound={true}
                android_ripple={null}
                style={[
                    styles.container,
                    {
                        backgroundColor: getBgColor(),
                        borderColor: getBorderColor(),
                    },
                ]}>
                {/* Letter badge with gradient-inspired color */}
                <View style={[styles.letterBadge, {
                    backgroundColor: state === 'correct'
                        ? colors.correctBg
                        : state === 'wrong'
                            ? colors.wrongBg
                            : `${gradient.start}15`,
                    borderColor: state === 'correct'
                        ? colors.correct
                        : state === 'wrong'
                            ? colors.wrong
                            : `${gradient.start}30`,
                }]}>
                    <Text style={[styles.letter, {
                        color: state === 'correct'
                            ? colors.correct
                            : state === 'wrong'
                                ? colors.wrong
                                : gradient.start,
                    }]}>
                        {OPTION_LETTERS[index]}
                    </Text>
                </View>

                {/* Label */}
                <Text
                    style={[styles.label, {
                        color: colors.text,
                        opacity: disabled && !isAnswered ? 0.4 : 1,
                    }]}
                    numberOfLines={3}>
                    {label}
                </Text>

                {/* Icon */}
                <View style={styles.iconContainer}>
                    {getIcon()}
                </View>
            </Pressable>
        </Animated.View>
    );
}


const styles = StyleSheet.create({
    outerWrapper: {
        marginBottom: 12,
        borderRadius: 20,
        overflow: 'hidden', // Prevents square border clipping on Android
    },
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1.5,
        borderRadius: 20,
        paddingVertical: 16,
        paddingHorizontal: 16,
    },
    letterBadge: {
        width: 42,
        height: 42,
        borderRadius: 14,
        borderWidth: 1,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 14,
    },
    letter: {
        fontSize: 17,
        fontWeight: '800',
    },
    label: {
        flex: 1,
        fontSize: 16,
        fontWeight: '500',
        lineHeight: 22,
    },
    iconContainer: {
        marginLeft: 8,
    },
});
