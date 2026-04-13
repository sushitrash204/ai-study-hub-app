import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import api from '../../services/api';
import { useNavigation, useRoute } from '@react-navigation/native';

export default function ResetPasswordScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const token = route.params?.token;

  const handleSubmit = async () => {
    if (!newPassword.trim() || !confirmPassword.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập đầy đủ mật khẩu');
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert('Lỗi', 'Mật khẩu xác nhận không khớp');
      return;
    }

    if (newPassword.length < 6) {
      Alert.alert('Lỗi', 'Mật khẩu phải có ít nhất 6 ký tự');
      return;
    }

    setIsLoading(true);
    try {
      await api.post('/auth/reset-password', {
        token,
        newPassword,
      });
      Alert.alert(
        'Thành công',
        'Đặt lại mật khẩu thành công!',
        [{ text: 'OK', onPress: () => navigation.navigate('Login') }]
      );
    } catch (error: any) {
      Alert.alert('Lỗi', error.response?.data?.message || 'Không thể đặt lại mật khẩu');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.card}>
        <View style={styles.iconContainer}>
          <Text style={styles.icon}>🔒</Text>
        </View>
        <Text style={styles.title}>Đặt lại mật khẩu</Text>
        <Text style={styles.subtitle}>
          Nhập mật khẩu mới của bạn
        </Text>

        {/* Form */}
        <View style={styles.form}>
          <Text style={styles.label}>Mật khẩu mới</Text>
          <TextInput
            style={styles.input}
            placeholder="Nhập mật khẩu mới"
            value={newPassword}
            onChangeText={setNewPassword}
            secureTextEntry
            editable={!isLoading}
          />

          <Text style={styles.label}>Xác nhận mật khẩu</Text>
          <TextInput
            style={styles.input}
            placeholder="Nhập lại mật khẩu"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
            editable={!isLoading}
          />

          <TouchableOpacity
            style={[styles.button, isLoading && styles.buttonDisabled]}
            onPress={handleSubmit}
            disabled={isLoading}
          >
            <Text style={styles.buttonText}>
              {isLoading ? 'Đang xử lý...' : 'Đặt lại mật khẩu'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    justifyContent: 'center',
    padding: 16,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 32,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: '#F5F3FF',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#8B5CF620',
  },
  icon: {
    fontSize: 32,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 20,
  },
  form: {
    gap: 16,
  },
  label: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#8E8E93',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  input: {
    backgroundColor: '#F2F2F7',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#111827',
  },
  button: {
    backgroundColor: '#8B5CF6',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonDisabled: {
    backgroundColor: '#D1D5DB',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
