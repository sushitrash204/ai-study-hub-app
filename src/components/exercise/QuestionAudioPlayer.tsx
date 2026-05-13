import React, { useState, useEffect } from 'react';
import { TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Audio } from 'expo-av';

interface QuestionAudioPlayerProps {
    text: string;
    lang: string;
}

export default function QuestionAudioPlayer({ text, lang }: QuestionAudioPlayerProps) {
    const [sound, setSound] = useState<Audio.Sound | null>(null);
    const [loading, setLoading] = useState(false);
    const [playing, setPlaying] = useState(false);

    async function playSound() {
        if (playing) {
            try {
                await sound?.stopAsync();
            } catch (e) {
                // Ignore error if sound already stopped
            }
            setPlaying(false);
            return;
        }

        try {
            setLoading(true);
            
            // Clean text for TTS
            const cleanText = text.trim().slice(0, 200);
            const ttsUrl = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(cleanText)}&tl=${lang}&client=tw-ob`;
            
            // Unload previous sound if exists
            if (sound) {
                await sound.unloadAsync();
            }

            const { sound: newSound } = await Audio.Sound.createAsync(
                { uri: ttsUrl },
                { shouldPlay: true }
            );
            
            setSound(newSound);
            setPlaying(true);
            setLoading(false);

            newSound.setOnPlaybackStatusUpdate((status) => {
                if (status.isLoaded && status.didJustFinish) {
                    setPlaying(false);
                }
            });
        } catch (error) {
            console.error('TTS Error:', error);
            setLoading(false);
        }
    }

    useEffect(() => {
        return sound
            ? () => {
                sound.unloadAsync();
            }
            : undefined;
    }, [sound]);

    return (
        <TouchableOpacity 
            onPress={playSound} 
            style={styles.container}
            disabled={loading}
            activeOpacity={0.7}
        >
            {loading ? (
                <ActivityIndicator size="small" color="#8B5CF6" />
            ) : (
                <Ionicons 
                    name={playing ? "stop-circle" : "volume-medium"} 
                    size={24} 
                    color="#8B5CF6" 
                />
            )}
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    container: {
        width: 44,
        height: 44,
        backgroundColor: '#F5F3FF',
        borderRadius: 14,
        marginRight: 12,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: '#EDE9FE',
    }
});
