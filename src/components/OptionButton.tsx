// Option Button — Answer option with correct/incorrect animation

import React, { useRef, useEffect } from 'react';
import { TouchableOpacity, Text, View, StyleSheet, Animated } from 'react-native';
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

export default function OptionButton({ label, index, onPress, disabled, state }: Props) {
    const { colors } = useTheme();
    const shakeAnim = useRef(new Animated.Value(0)).current;
    const scaleAnim = useRef(new Animated.Value(1)).current;
    const bgOpacity = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (state === 'wrong') {
            // Shake animation
            Animated.sequence([
                Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
                Animated.timing(shakeAnim, { toValue: -10, duration: 50, useNativeDriver: true }),
                Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
                Animated.timing(shakeAnim, { toValue: -10, duration: 50, useNativeDriver: true }),
                Animated.timing(shakeAnim, { toValue: 0, duration: 50, useNativeDriver: true }),
            ]).start();
            Animated.timing(bgOpacity, { toValue: 1, duration: 200, useNativeDriver: false }).start();
        } else if (state === 'correct') {
            // Scale pop animation
            Animated.sequence([
                Animated.timing(scaleAnim, { toValue: 1.05, duration: 150, useNativeDriver: true }),
                Animated.timing(scaleAnim, { toValue: 1, duration: 150, useNativeDriver: true }),
            ]).start();
            Animated.timing(bgOpacity, { toValue: 1, duration: 200, useNativeDriver: false }).start();
        } else {
            shakeAnim.setValue(0);
            scaleAnim.setValue(1);
            bgOpacity.setValue(0);
        }
    }, [state, shakeAnim, scaleAnim, bgOpacity]);

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
        if (state === 'correct') return <Icon name="check-circle" size={22} color={colors.correct} />;
        if (state === 'wrong') return <Icon name="cancel" size={22} color={colors.wrong} />;
        return null;
    };

    return (
        <Animated.View
            style={{
                transform: [{ translateX: shakeAnim }, { scale: scaleAnim }],
            }}>
            <TouchableOpacity
                onPress={onPress}
                disabled={disabled}
                activeOpacity={0.7}
                style={[
                    styles.container,
                    {
                        backgroundColor: getBgColor(),
                        borderColor: getBorderColor(),
                    },
                ]}>
                <View style={[styles.letterBadge, { backgroundColor: colors.surfaceElevated }]}>
                    <Text style={[styles.letter, { color: colors.primary }]}>
                        {OPTION_LETTERS[index]}
                    </Text>
                </View>
                <Text
                    style={[styles.label, { color: colors.text }]}
                    numberOfLines={3}>
                    {label}
                </Text>
                {getIcon()}
            </TouchableOpacity>
        </Animated.View>
    );
}


const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1.5,
        borderRadius: 16,
        paddingVertical: 16,
        paddingHorizontal: 16,
        marginBottom: 12,
    },
    letterBadge: {
        width: 36,
        height: 36,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 14,
    },
    letter: {
        fontSize: 16,
        fontWeight: '700',
    },
    label: {
        flex: 1,
        fontSize: 16,
        fontWeight: '500',
        lineHeight: 22,
    },
});
