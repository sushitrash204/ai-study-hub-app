import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  RefreshControl,
} from 'react-native';
import { useDocuments } from '../../hooks/documents/useDocuments';
import { useNavigation } from '@react-navigation/native';
import { Document } from '../../models/Document';

export default function DocumentListScreen() {
  const navigation = useNavigation<any>();
  const { state, actions } = useDocuments({ autoFetch: true });
  const { documents, isLoading } = state;

  const [searchQuery, setSearchQuery] = useState('');
  const [filterSubjectId, setFilterSubjectId] = useState<string | undefined>(undefined);

  const filteredDocuments = documents.filter((doc: Document) => {
    if (filterSubjectId && doc.subjectId !== filterSubjectId) return false;
    if (searchQuery && !doc.title?.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const getFileTypeIcon = (fileType: string) => {
    switch (fileType?.toLowerCase()) {
      case 'pdf': return '📄';
      case 'docx': return '📝';
      case 'xlsx': return '📊';
      case 'pptx': return '📑';
      default: return '📎';
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Chưa có thông tin';
    return new Date(dateString).toLocaleDateString('vi-VN');
  };

  const renderDocument = ({ item }: { item: Document }) => (
    <TouchableOpacity
      style={styles.documentCard}
      onPress={() => {
        if (item.fileType?.toLowerCase() === 'pdf') {
          navigation.navigate('PDFViewer', { documentId: item.id });
        } else {
          navigation.navigate('DocumentSummary', { documentId: item.id });
        }
      }}
    >
      <View style={styles.documentIcon}>
        <Text style={styles.documentIconText}>{getFileTypeIcon(item.fileType || '')}</Text>
      </View>
      <View style={styles.documentInfo}>
        <Text style={styles.documentTitle} numberOfLines={2}>
          {item.title}
        </Text>
        <View style={styles.documentMeta}>
          <Text style={styles.metaText}>
            Môn: {item.subjectId || 'Chưa phân loại'}
          </Text>
          <Text style={styles.metaText}>
            {formatDate(item.createdAt || '')}
          </Text>
        </View>
      </View>
      <Text style={styles.chevron}>›</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Tài liệu</Text>
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Tìm kiếm tài liệu..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Document List */}
      <FlatList
        data={filteredDocuments}
        keyExtractor={(item) => item.id}
        renderItem={renderDocument}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>📚</Text>
            <Text style={styles.emptyTitle}>Không có tài liệu nào</Text>
            <Text style={styles.emptySubtitle}>
              Tài liệu của bạn sẽ hiện ở đây
            </Text>
          </View>
        }
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={actions.fetchDocuments}
            tintColor="#8B5CF6"
          />
        }
        contentContainerStyle={styles.listContent}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  searchInput: {
    backgroundColor: '#F2F2F7',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#111827',
  },
  listContent: {
    flexGrow: 1,
    padding: 16,
    gap: 12,
  },
  documentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 12,
  },
  documentIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#F5F3FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  documentIconText: {
    fontSize: 24,
  },
  documentInfo: {
    flex: 1,
  },
  documentTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#111827',
    marginBottom: 4,
  },
  documentMeta: {
    flexDirection: 'row',
    gap: 12,
  },
  metaText: {
    fontSize: 14,
    color: '#6B7280',
  },
  chevron: {
    fontSize: 24,
    color: '#C7C7CC',
    marginLeft: 8,
  },
  emptyContainer: {
    padding: 48,
    alignItems: 'center',
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#6B7280',
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 4,
    textAlign: 'center',
  },
});
