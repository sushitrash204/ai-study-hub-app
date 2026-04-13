import React, { useEffect, useState } from 'react';
import {
    View, Text, StyleSheet, SafeAreaView, ScrollView,
    ActivityIndicator, TouchableOpacity, Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import * as documentService from '../../services/documentService';

export default function DocumentSummaryScreen({ route, navigation }: any) {
    const { documentId, title } = route.params;
    const [summary, setSummary] = useState('');
    const [sourceLength, setSourceLength] = useState(0);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        (async () => {
            try {
                const result = await documentService.summarizeDocument(documentId);
                setSummary(result.summary);
                setSourceLength(result.sourceLength);
            } catch (error: any) {
                Alert.alert('Lỗi', error?.response?.data?.message || error.message || 'Không thể tóm tắt tài liệu.');
                navigation.goBack();
            } finally {
                setLoading(false);
            }
        })();
    }, [documentId]);

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={24} color="#1F2937" />
                </TouchableOpacity>
                <View style={styles.headerCenter}>
                    <Text style={styles.headerTitle}>Tóm tắt AI</Text>
                    <Text style={styles.headerSub} numberOfLines={1}>{title}</Text>
                </View>
                <View style={{ width: 34 }} />
            </View>

            {loading ? (
                <View style={styles.loadingContainer}>
                    <View style={styles.loadingCard}>
                        <ActivityIndicator size="large" color="#8B5CF6" />
                        <Text style={styles.loadingTitle}>AI đang phân tích tài liệu...</Text>
                        <Text style={styles.loadingHint}>Quá trình này có thể mất 15–30 giây.</Text>
                    </View>
                </View>
            ) : (
                <ScrollView
                    contentContainerStyle={styles.content}
                    showsVerticalScrollIndicator={false}
                >
                    <View style={styles.metaBadge}>
                        <Ionicons name="sparkles" size={15} color="#8B5CF6" />
                        <Text style={styles.metaText}>Tóm tắt bởi Gemma AI</Text>
                        {sourceLength > 0 && (
                            <Text style={styles.metaSub}> • {Math.round(sourceLength / 1000)}K ký tự</Text>
                        )}
                    </View>

                    <View style={styles.summaryCard}>
                        <Text style={styles.summaryText}>{summary}</Text>
                    </View>
                </ScrollView>
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F5F3FF' },
    header: {
        height: Constants.statusBarHeight + 60,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingTop: Constants.statusBarHeight,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#EDE9FE',
    },
    backBtn: { padding: 5 },
    headerCenter: { flex: 1, alignItems: 'center', paddingHorizontal: 10 },
    headerTitle: { fontSize: 17, fontWeight: 'bold', color: '#1F2937' },
    headerSub: { fontSize: 12, color: '#8B5CF6', marginTop: 2, fontWeight: '500' },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 30,
    },
    loadingCard: {
        backgroundColor: '#fff',
        borderRadius: 24,
        padding: 40,
        alignItems: 'center',
        width: '100%',
        shadowColor: '#8B5CF6',
        shadowOpacity: 0.08,
        shadowRadius: 16,
        shadowOffset: { width: 0, height: 4 },
        elevation: 4,
    },
    loadingTitle: { marginTop: 20, fontSize: 16, fontWeight: '700', color: '#1F2937', textAlign: 'center' },
    loadingHint: { marginTop: 8, fontSize: 13, color: '#9CA3AF', textAlign: 'center', lineHeight: 20 },
    content: { padding: 20, paddingBottom: 40 },
    metaBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#EDE9FE',
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 20,
        alignSelf: 'flex-start',
        marginBottom: 16,
    },
    metaText: { marginLeft: 6, color: '#7C3AED', fontWeight: '700', fontSize: 13 },
    metaSub: { color: '#7C3AED', fontSize: 13 },
    summaryCard: {
        backgroundColor: '#fff',
        borderRadius: 20,
        padding: 22,
        shadowColor: '#000',
        shadowOpacity: 0.04,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 2 },
        elevation: 2,
    },
    summaryText: { fontSize: 15, lineHeight: 26, color: '#1F2937' },
});
