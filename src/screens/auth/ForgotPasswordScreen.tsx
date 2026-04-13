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
import { useAuth } from '../../hooks/auth/useAuth';
import { useNavigation } from '@react-navigation/native';

export default function ForgotPasswordScreen() {
  const navigation = useNavigation<any>();
  const [email, setEmail] = useState('');
  const { state: { isLoading }, actions } = useAuth();
  const [isSent, setIsSent] = useState(false);

  const handleSubmit = async () => {
    if (!email.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập email');
      return;
    }

    const success = await actions.handleForgotPassword(email);
    if (success) {
      setIsSent(true);
    }
  };

  if (isSent) {
    return (
      <View style={styles.container}>
        <View style={styles.card}>
          <View style={styles.iconContainer}>
            <Text style={styles.icon}>✉️</Text>
          </View>
          <Text style={styles.title}>Đã gửi thành công!</Text>
          <Text style={styles.subtitle}>
            Vui lòng kiểm tra email để nhận liên kết khôi phục mật khẩu.
          </Text>
          <TouchableOpacity
            style={styles.button}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.buttonText}>Quay lại Đăng nhập</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.card}>
        {/* Header */}
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>← Quay lại</Text>
        </TouchableOpacity>

        <View style={styles.iconContainer}>
          <Text style={styles.icon}>📧</Text>
        </View>
        <Text style={styles.title}>Quên mật khẩu?</Text>
        <Text style={styles.subtitle}>
          Nhập email của bạn để nhận liên kết khôi phục mật khẩu.
        </Text>

        {/* Form */}
        <View style={styles.form}>
          <Text style={styles.label}>Email</Text>
          <TextInput
            style={styles.input}
            placeholder="name@example.com"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            editable={!isLoading}
          />

          <TouchableOpacity
            style={[styles.button, isLoading && styles.buttonDisabled]}
            onPress={handleSubmit}
            disabled={isLoading}
          >
            <Text style={styles.buttonText}>
              {isLoading ? 'Đang gửi...' : 'Gửi liên kết khôi phục'}
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
  backButton: {
    position: 'absolute',
    top: 16,
    left: 16,
    padding: 8,
  },
  backButtonText: {
    fontSize: 14,
    color: '#6B7280',
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
