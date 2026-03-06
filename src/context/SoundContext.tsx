// Sound Context — Sound effects toggle with AsyncStorage persistence
// NOTE: User must add sound files to src/assets/sounds/:
//   - correct.mp3
//   - wrong.mp3
//   - levelup.mp3

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, ReactNode } from 'react';
import Sound from 'react-native-sound';
import { getSoundEnabled, setSoundEnabled as saveSoundEnabled } from '../utils/storageHelper';

// Enable playback in silence mode
Sound.setCategory('Playback');

interface SoundContextType {
    soundEnabled: boolean;
    toggleSound: () => void;
    playCorrectSound: () => void;
    playWrongSound: () => void;
    playLevelUpSound: () => void;
}

const SoundContext = createContext<SoundContextType>({
    soundEnabled: true,
    toggleSound: () => { },
    playCorrectSound: () => { },
    playWrongSound: () => { },
    playLevelUpSound: () => { },
});

export function SoundProvider({ children }: { children: ReactNode }) {
    const [soundEnabled, setSoundEnabled] = useState(true);

    useEffect(() => {
        getSoundEnabled().then(enabled => setSoundEnabled(enabled));
    }, []);

    const toggleSound = useCallback(() => {
        setSoundEnabled(prev => {
            const newVal = !prev;
            saveSoundEnabled(newVal);
            return newVal;
        });
    }, []);

    const playSound = useCallback((fileName: string) => {
        if (!soundEnabled) return;

        const sound = new Sound(fileName, Sound.MAIN_BUNDLE, (error) => {
            if (error) {
                console.log('Failed to load sound', error);
                return;
            }
            sound.play((success) => {
                if (!success) {
                    console.log('Playback failed due to audio decoding errors');
                }
                sound.release(); // Free memory
            });
        });
    }, [soundEnabled]);

    const playCorrectSound = useCallback(() => {
        playSound('correct.mp3');
    }, [playSound]);

    const playWrongSound = useCallback(() => {
        playSound('wrong.mp3');
    }, [playSound]);

    const playLevelUpSound = useCallback(() => {
        playSound('levelup.mp3');
    }, [playSound]);

    const value = useMemo(() => ({
        soundEnabled, toggleSound, playCorrectSound, playWrongSound, playLevelUpSound,
    }), [soundEnabled, toggleSound, playCorrectSound, playWrongSound, playLevelUpSound]);

    return (
        <SoundContext.Provider value={value}>
            {children}
        </SoundContext.Provider>
    );
}

export function useSound() {
    return useContext(SoundContext);
}
