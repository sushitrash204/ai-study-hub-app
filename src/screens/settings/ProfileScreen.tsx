import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useAuthStore } from '../../store/authStore';
import { useStats } from '../../hooks/stats/useStats';
import { useNavigation } from '@react-navigation/native';

export default function ProfileScreen() {
  const navigation = useNavigation<any>();
  const { user, logout } = useAuthStore();
  const { stats, isLoading: isStatsLoading } = useStats();

  const initials = `${user?.firstName?.[0] || ''}${user?.lastName?.[0] || ''}`.toUpperCase() || 'U';
  const fullName = `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || 'Người dùng';
  const email = user?.email || '';

  const handleLogout = () => {
    Alert.alert(
      'Xác nhận đăng xuất',
      'Bạn có chắc chắn muốn đăng xuất?',
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Đăng xuất',
          style: 'destructive',
          onPress: () => logout()
        }
      ]
    );
  };

  const handleSupport = () => {
    Alert.alert(
      'Hỗ trợ Kỹ thuật',
      'Email: nghia.nt.64cntt@ntu.edu.vn\nSĐT: 0383129381'
    );
  };

  const handleAbout = () => {
    Alert.alert(
      'Về ứng dụng',
      'AI Study Assistant - DATN\nPhiên bản: 1.0.0\nTác giả: Nguyễn Thanh Nghĩa'
    );
  };

  return (
    <ScrollView style={styles.container}>
      {/* Profile Header */}
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initials}</Text>
        </View>
        <Text style={styles.name}>{fullName}</Text>
        <Text style={styles.email}>{email}</Text>
      </View>

      {/* Stats */}
      {!isStatsLoading && stats && (
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{stats.totalSubjects || 0}</Text>
            <Text style={styles.statLabel}>Môn học</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{stats.totalDocuments || 0}</Text>
            <Text style={styles.statLabel}>Tài liệu</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{stats.totalExercises || 0}</Text>
            <Text style={styles.statLabel}>Bài tập</Text>
          </View>
        </View>
      )}

      {/* Settings Items */}
      <View style={styles.settingsSection}>
        <TouchableOpacity
          style={styles.settingItem}
          onPress={() => navigation.navigate('EditProfile')}
        >
          <View style={styles.settingIcon}>
            <Text style={styles.settingIconText}>👤</Text>
          </View>
          <View style={styles.settingContent}>
            <Text style={styles.settingTitle}>Chỉnh sửa thông tin</Text>
          </View>
          <Text style={styles.chevron}>›</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.settingItem}
          onPress={() => navigation.navigate('ChangePassword')}
        >
          <View style={styles.settingIcon}>
            <Text style={styles.settingIconText}>🔒</Text>
          </View>
          <View style={styles.settingContent}>
            <Text style={styles.settingTitle}>Bảo mật</Text>
          </View>
          <Text style={styles.chevron}>›</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.settingItem}
          onPress={() => navigation.navigate('NotificationSettings')}
        >
          <View style={styles.settingIcon}>
            <Text style={styles.settingIconText}>🔔</Text>
          </View>
          <View style={styles.settingContent}>
            <Text style={styles.settingTitle}>Thông báo</Text>
          </View>
          <Text style={styles.chevron}>›</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.settingItem} onPress={handleSupport}>
          <View style={styles.settingIcon}>
            <Text style={styles.settingIconText}>❓</Text>
          </View>
          <View style={styles.settingContent}>
            <Text style={styles.settingTitle}>Hỗ trợ</Text>
          </View>
          <Text style={styles.chevron}>›</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.settingItem} onPress={handleAbout}>
          <View style={styles.settingIcon}>
            <Text style={styles.settingIconText}>ℹ️</Text>
          </View>
          <View style={styles.settingContent}>
            <Text style={styles.settingTitle}>Về ứng dụng</Text>
          </View>
          <Text style={styles.chevron}>›</Text>
        </TouchableOpacity>
      </View>

      {/* Logout Button */}
      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutText}>Đăng xuất</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    alignItems: 'center',
    paddingVertical: 32,
    backgroundColor: '#FFFFFF',
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#8B5CF6',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  avatarText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
  },
  email: {
    fontSize: 16,
    color: '#6B7280',
    marginTop: 4,
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    marginVertical: 16,
    paddingVertical: 20,
    paddingHorizontal: 16,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#8B5CF6',
  },
  statLabel: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
  statDivider: {
    width: 1,
    backgroundColor: '#E5E7EB',
  },
  settingsSection: {
    backgroundColor: '#FFFFFF',
    marginVertical: 16,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  settingIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  settingIconText: {
    fontSize: 20,
  },
  settingContent: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    color: '#111827',
    fontWeight: '500',
  },
  chevron: {
    fontSize: 24,
    color: '#C7C7CC',
  },
  logoutButton: {
    backgroundColor: '#EF4444',
    marginHorizontal: 16,
    marginVertical: 24,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  logoutText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
