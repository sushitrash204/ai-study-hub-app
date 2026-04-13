import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

const UNIFIED_MATH_FONT_SIZE = 16;

interface MathViewProps {
    latex: string;
    isUser: boolean;
    fallbackText: string;
    inline?: boolean;
}

// Tạm thời render text thường - cần cài react-native-mathjax-svg sau
export default function MathView({ latex, isUser, fallbackText, inline = false }: MathViewProps) {
    const safeLatex = String(latex || '').trim();

    if (!safeLatex) {
        return (
            <Text selectable style={[styles.fallbackText, isUser ? styles.userText : styles.aiText]}>
                {fallbackText}
            </Text>
        );
    }

    return (
        <View style={[styles.container, inline && styles.inlineContainer]}>
            <Text style={[styles.mathText, isUser ? styles.userText : styles.aiText]}>
                {safeLatex}
            </Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        minHeight: UNIFIED_MATH_FONT_SIZE + 4,
        justifyContent: 'center',
        alignSelf: 'flex-start',
        flexShrink: 0,
    },
    inlineContainer: {
        minHeight: UNIFIED_MATH_FONT_SIZE + 4,
        marginHorizontal: 2,
        marginVertical: 0,
        flexShrink: 1,
    },
    mathText: {
        fontSize: UNIFIED_MATH_FONT_SIZE,
        fontFamily: 'Courier',
    },
    fallbackText: {
        fontFamily: 'Courier',
        fontSize: UNIFIED_MATH_FONT_SIZE,
    },
    userText: {
        color: '#F5F3FF',
    },
    aiText: {
        color: '#1F2937',
    },
});
