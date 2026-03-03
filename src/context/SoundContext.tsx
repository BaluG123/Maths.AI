// Sound Context — Sound effects toggle with AsyncStorage persistence
// NOTE: User must add sound files to src/assets/sounds/:
//   - correct.mp3
//   - wrong.mp3
//   - levelup.mp3

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { getSoundEnabled, setSoundEnabled as saveSoundEnabled } from '../utils/storageHelper';

// We'll use a simple approach without react-native-sound for now
// since it requires platform-specific audio files to be bundled.
// Sound playback will be a no-op placeholder until user adds audio files.

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

    const toggleSound = () => {
        const newVal = !soundEnabled;
        setSoundEnabled(newVal);
        saveSoundEnabled(newVal);
    };

    const playCorrectSound = useCallback(() => {
        if (!soundEnabled) return;
        // Sound playback placeholder - uncomment when audio files are added:
        // const sound = new Sound('correct.mp3', Sound.MAIN_BUNDLE, (error) => {
        //   if (!error) sound.play(() => sound.release());
        // });
    }, [soundEnabled]);

    const playWrongSound = useCallback(() => {
        if (!soundEnabled) return;
        // Sound playback placeholder
    }, [soundEnabled]);

    const playLevelUpSound = useCallback(() => {
        if (!soundEnabled) return;
        // Sound playback placeholder
    }, [soundEnabled]);

    return (
        <SoundContext.Provider
            value={{ soundEnabled, toggleSound, playCorrectSound, playWrongSound, playLevelUpSound }}>
            {children}
        </SoundContext.Provider>
    );
}

export function useSound() {
    return useContext(SoundContext);
}
