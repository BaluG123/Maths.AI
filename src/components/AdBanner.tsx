// AdBanner — Non-intrusive banner ad component
// Themed to match app design, placed at natural content boundaries

import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { BannerAd, BannerAdSize, TestIds } from 'react-native-google-mobile-ads';
import { useTheme } from '../context/ThemeContext';
import { ADMOB_BANNER_AD_ID } from '../utils/constants';

const BANNER_AD_UNIT_ID = __DEV__ ? TestIds.BANNER : ADMOB_BANNER_AD_ID;

interface Props {
    style?: any;
}

export default function AdBanner({ style }: Props) {
    const { colors } = useTheme();

    return (
        <View style={[styles.container, { backgroundColor: colors.surface }, style]}>
            <BannerAd
                unitId={BANNER_AD_UNIT_ID}
                size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
                requestOptions={{
                    keywords: ['math', 'education', 'puzzle', 'brain', 'learning'],
                }}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 4,
        marginTop: 16,
        borderRadius: 12,
        overflow: 'hidden',
    },
});
