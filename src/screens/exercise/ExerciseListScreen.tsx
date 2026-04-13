import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { useExercises } from '../../hooks/exercises/useExercises';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Exercise } from '../../models/Exercise';

export default function ExerciseListScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const subjectId = route.params?.subjectId || null;

  const { state, actions } = useExercises();
  const { exercisesBySubject, isLoading } = state;

  const exercises = subjectId ? exercisesBySubject[subjectId] || [] : [];

  const [filterType, setFilterType] = useState<string | undefined>(undefined);
  const [filterDifficulty, setFilterDifficulty] = useState<string | undefined>(undefined);

  const filteredExercises = exercises.filter((ex: any) => {
    if (filterType && ex.type !== filterType) return false;
    if (filterDifficulty && ex.difficulty !== filterDifficulty) return false;
    return true;
  });

  const getExerciseTypeLabel = (type: string) => {
    switch (type) {
      case 'QUIZ': return 'Trắc nghiệm';
      case 'ESSAY': return 'Tự luận';
      case 'MIXED': return 'Hỗn hợp';
      default: return type;
    }
  };

  const getDifficultyLabel = (difficulty: string) => {
    switch (difficulty) {
      case 'EASY': return 'Dễ';
      case 'MEDIUM': return 'Trung bình';
      case 'HARD': return 'Khó';
      default: return difficulty;
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'EASY': return '#10B981';
      case 'MEDIUM': return '#F59E0B';
      case 'HARD': return '#EF4444';
      default: return '#6B7280';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'TODO': return 'Chưa làm';
      case 'IN_PROGRESS': return 'Đang làm';
      case 'COMPLETED': return 'Hoàn thành';
      default: return status;
    }
  };

  const renderExercise = ({ item }: { item: Exercise }) => (
    <TouchableOpacity
      style={styles.exerciseCard}
      onPress={() => navigation.navigate('ExerciseDetail', { exerciseId: item.id || '' })}
    >
      <View style={styles.cardHeader}>
        <Text style={styles.exerciseTitle}>{item.title}</Text>
        <View
          style={[
            styles.difficultyBadge,
            { backgroundColor: getDifficultyColor(item.difficulty || 'MEDIUM') }
          ]}
        >
          <Text style={styles.difficultyText}>
            {getDifficultyLabel(item.difficulty || 'MEDIUM')}
          </Text>
        </View>
      </View>

      <View style={styles.cardMeta}>
        <Text style={styles.metaText}>
          Loại: {getExerciseTypeLabel(item.type)}
        </Text>
        <Text style={styles.metaText}>
          Số câu hỏi: {item.questions?.length || 0}
        </Text>
      </View>

      {(item as any).submissionStatus && (
        <View style={styles.statusContainer}>
          <Text style={styles.statusText}>
            Trạng thái: {getStatusLabel((item as any).submissionStatus)}
          </Text>
          {(item as any).maxScore !== null && (item as any).maxScore !== undefined && (
            <Text style={styles.scoreText}>
              Điểm cao nhất: {(item as any).maxScore}/10
            </Text>
          )}
        </View>
      )}
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Bài tập</Text>
      </View>

      {/* Filter */}
      <View style={styles.filterContainer}>
        <FlatList
          horizontal
          data={[
            { label: 'Tất cả', value: undefined },
            { label: 'Trắc nghiệm', value: 'QUIZ' },
            { label: 'Tự luận', value: 'ESSAY' },
            { label: 'Hỗn hợp', value: 'MIXED' },
          ]}
          keyExtractor={(item, index) => index.toString()}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.filterChip,
                filterType === item.value && styles.filterChipActive
              ]}
              onPress={() => setFilterType(item.value)}
            >
              <Text
                style={[
                  styles.filterChipText,
                  filterType === item.value && styles.filterChipTextActive
                ]}
              >
                {item.label}
              </Text>
            </TouchableOpacity>
          )}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterList}
        />
      </View>

      {/* Exercise List */}
      <FlatList
        data={filteredExercises}
        keyExtractor={(item) => item.id}
        renderItem={renderExercise}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>📝</Text>
            <Text style={styles.emptyTitle}>Không có bài tập nào</Text>
            <Text style={styles.emptySubtitle}>
              Bài tập của bạn sẽ hiện ở đây
            </Text>
          </View>
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
  filterContainer: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  filterList: {
    paddingHorizontal: 16,
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    marginRight: 8,
  },
  filterChipActive: {
    backgroundColor: '#8B5CF6',
  },
  filterChipText: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
  },
  filterChipTextActive: {
    color: '#FFFFFF',
  },
  listContent: {
    flexGrow: 1,
    padding: 16,
    gap: 12,
  },
  exerciseCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  exerciseTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    flex: 1,
    marginRight: 8,
  },
  difficultyBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  difficultyText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  cardMeta: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 8,
  },
  metaText: {
    fontSize: 14,
    color: '#6B7280',
  },
  statusContainer: {
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    paddingTop: 8,
    marginTop: 8,
  },
  statusText: {
    fontSize: 14,
    color: '#8B5CF6',
    fontWeight: '500',
  },
  scoreText: {
    fontSize: 14,
    color: '#10B981',
    fontWeight: '600',
    marginTop: 4,
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
