import React, { useState, useContext } from 'react';
import {
    View, Text, TextInput, StyleSheet, Alert,
    TouchableOpacity, ActivityIndicator, ScrollView,
    KeyboardAvoidingView, Platform
} from 'react-native';
import { AuthContext } from '../../context/AuthContext';
import Constants from 'expo-constants';
import * as authService from '../../services/authService';

export default function RegisterScreen({ navigation }: any) {
    const [username, setUsername] = useState('');
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const { login } = useContext(AuthContext);

    const handleRegister = async () => {
        try {
            if (!username || !firstName || !lastName || !email || !password || !confirmPassword) {
                Alert.alert('Lỗi', 'Vui lòng điền đầy đủ thông tin');
                return;
            }

            if (password !== confirmPassword) {
                Alert.alert('Lỗi', 'Mật khẩu xác nhận không khớp');
                return;
            }

            setIsLoading(true);

            const { user, accessToken } = await authService.register({
                username,
                firstName,
                lastName,
                email,
                password,
                confirmPassword
            });
            await login(user, accessToken, '');

        } catch (error: any) {
            console.error('Register Error:', error.message);
            Alert.alert('Đăng ký thất bại', error.message || 'Đã có lỗi xảy ra. Vui lòng thử lại.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.container}
        >
            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                <View style={styles.header}>
                    <Text style={styles.title}>Tạo tài khoản</Text>
                    <Text style={styles.subtitle}>Bắt đầu hành trình chinh phục kiến thức</Text>
                </View>

                <View style={styles.form}>
                    <View style={styles.inputContainer}>
                        <Text style={styles.label}>Tên đăng nhập</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="username123"
                            value={username}
                            onChangeText={setUsername}
                            autoCapitalize="none"
                        />
                    </View>

                    <View style={styles.row}>
                        <View style={[styles.inputContainer, { flex: 1, marginRight: 10 }]}>
                            <Text style={styles.label}>Họ</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="Nguyễn"
                                value={lastName}
                                onChangeText={setLastName}
                            />
                        </View>
                        <View style={[styles.inputContainer, { flex: 1 }]}>
                            <Text style={styles.label}>Tên</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="Văn A"
                                value={firstName}
                                onChangeText={setFirstName}
                            />
                        </View>
                    </View>

                    <View style={styles.inputContainer}>
                        <Text style={styles.label}>Email</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="example@gmail.com"
                            value={email}
                            onChangeText={setEmail}
                            keyboardType="email-address"
                            autoCapitalize="none"
                        />
                    </View>

                    <View style={styles.inputContainer}>
                        <Text style={styles.label}>Mật khẩu</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="••••••••"
                            value={password}
                            onChangeText={setPassword}
                            secureTextEntry={true}
                        />
                    </View>

                    <View style={styles.inputContainer}>
                        <Text style={styles.label}>Xác nhận mật khẩu</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="••••••••"
                            value={confirmPassword}
                            onChangeText={setConfirmPassword}
                            secureTextEntry={true}
                        />
                    </View>

                    {isLoading ? (
                        <ActivityIndicator size="large" color="#007AFF" style={{ marginTop: 20 }} />
                    ) : (
                        <TouchableOpacity style={styles.button} onPress={handleRegister}>
                            <Text style={styles.buttonText}>Đăng ký ngay</Text>
                        </TouchableOpacity>
                    )}
                </View>

                <View style={styles.footer}>
                    <Text style={styles.footerText}>Đã có tài khoản? </Text>
                    <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                        <Text style={styles.link}>Đăng nhập ngay</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#fff' },
    scrollContent: {
        paddingHorizontal: 25,
        paddingTop: Constants.statusBarHeight + 40,
        paddingBottom: 40
    },
    header: { marginBottom: 30 },
    title: { fontSize: 32, fontWeight: 'bold', color: '#1C1C1E', marginBottom: 10 },
    subtitle: { fontSize: 16, color: '#8E8E93' },
    form: { marginBottom: 30 },
    row: { flexDirection: 'row' },
    inputContainer: { marginBottom: 18 },
    label: { fontSize: 14, fontWeight: '600', color: '#3A3A3C', marginBottom: 8, marginLeft: 5 },
    input: {
        backgroundColor: '#F2F2F7',
        padding: 15,
        borderRadius: 12,
        fontSize: 16,
        color: '#1C1C1E',
        borderWidth: 1,
        borderColor: '#E5E5EA'
    },
    button: {
        backgroundColor: '#007AFF',
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
        marginTop: 10,
        shadowColor: '#007AFF',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 5
    },
    buttonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
    footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 10 },
    footerText: { color: '#8E8E93', fontSize: 15 },
    link: { color: '#007AFF', fontWeight: 'bold', fontSize: 15 }
});
