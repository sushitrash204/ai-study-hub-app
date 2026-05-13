import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import QuestionAudioPlayer from './QuestionAudioPlayer';

interface QuestionContentRendererProps {
    content: string;
    textStyle?: any;
    renderText?: (text: string) => React.ReactNode;
}

const AUDIO_REGEX = /\[AUDIO:([a-z-]{2,10})\]([\s\S]*?)\[\/AUDIO\]/gi;

export default function QuestionContentRenderer({ content, textStyle, renderText }: QuestionContentRendererProps) {
    if (!content) return null;

    // Split content by audio tags, capturing the tags themselves to parse them later
    const parts = content.split(/(\[AUDIO:[a-z-]{2,10}\][\s\S]*?\[\/AUDIO\])/gi);

    return (
        <View style={styles.container}>
            {parts.map((part, index) => {
                const match = part.match(/\[AUDIO:([a-z-]{2,10})\]([\s\S]*?)\[\/AUDIO\]/i);
                
                if (match) {
                    const lang = match[1];
                    const audioText = match[2];
                    return (
                        <View key={index} style={styles.audioRow}>
                            <QuestionAudioPlayer text={audioText} lang={lang} />
                            <View style={styles.audioInfo}>
                                <Text style={styles.audioLabel}>BÀI NGHE ({lang.toUpperCase()})</Text>
                                <Text style={styles.audioHint}>Bấm để nghe đoạn này</Text>
                            </View>
                        </View>
                    );
                }

                // If it's normal text
                const trimmedPart = part.trim();
                if (trimmedPart) {
                    if (renderText) {
                        return <React.Fragment key={index}>{renderText(trimmedPart)}</React.Fragment>;
                    }
                    return (
                        <Text key={index} style={[textStyle, styles.paragraphText]}>
                            {trimmedPart}
                        </Text>
                    );
                }

                return null;
            })}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        width: '100%',
        marginVertical: 4,
    },
    audioRow: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        padding: 4,
        borderRadius: 16,
        marginBottom: 12,
        marginTop: 4,
    },
    audioInfo: {
        flex: 1,
        justifyContent: 'center',
    },
    audioLabel: {
        fontSize: 11,
        fontWeight: '800',
        color: '#8B5CF6',
        letterSpacing: 0.5,
        marginBottom: 2,
    },
    audioHint: {
        fontSize: 12,
        color: '#6B7280',
        fontStyle: 'italic',
    },
    paragraphText: {
        marginBottom: 8,
    }
});
