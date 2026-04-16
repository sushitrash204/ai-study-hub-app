import React, { useState, useContext } from 'react';
import {
    View, Text, TextInput, StyleSheet, Alert,
    TouchableOpacity, ActivityIndicator, KeyboardAvoidingView,
    Platform, ScrollView, Image
} from 'react-native';
import { AuthContext } from '../../context/AuthContext';
import Constants from 'expo-constants';
import * as authService from '../../services/authService';

export default function LoginScreen({ navigation }: any) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const { login } = useContext(AuthContext);

    const handleLogin = async () => {
        try {
            if (!email || !password) {
                Alert.alert('Lỗi', 'Vui lòng điền đầy đủ thông tin');
                return;
            }

            setIsLoading(true);
            const { user, accessToken } = await authService.login(email, password);
            await login(user, accessToken, '');

        } catch (error: any) {
            console.error('Login Error:', error.message);
            Alert.alert('Đăng nhập thất bại', error.message || 'Đã có lỗi xảy ra. Kiểm tra lại kết nối mạng.');
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
                    <View style={styles.logoContainer}>
                        <Image
                            source={require('../../../assets/icon.png')}
                            style={styles.logo}
                            resizeMode="contain"
                        />
                    </View>
                    <Text style={styles.title}>Chào mừng trở lại!</Text>
                    <Text style={styles.subtitle}>Đăng nhập để tiếp tục học tập</Text>
                </View>

                <View style={styles.form}>
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

                    {isLoading ? (
                        <ActivityIndicator size="large" color="#007AFF" style={{ marginTop: 20 }} />
                    ) : (
                        <TouchableOpacity style={styles.button} onPress={handleLogin}>
                            <Text style={styles.buttonText}>Đăng nhập</Text>
                        </TouchableOpacity>
                    )}
                </View>

                <View style={styles.footer}>
                    <Text style={styles.footerText}>Chưa có tài khoản? </Text>
                    <TouchableOpacity onPress={() => navigation.navigate('Register')}>
                        <Text style={styles.link}>Đăng ký ngay</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#fff' },
    scrollContent: {
        flexGrow: 1,
        paddingHorizontal: 25,
        paddingTop: Constants.statusBarHeight + 40,
        paddingBottom: 40
    },
    header: { marginBottom: 30, alignItems: 'center' },
    logoContainer: {
        width: 80,
        height: 80,
        backgroundColor: '#fff',
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 4,
        borderWidth: 1,
        borderColor: '#F3F4F6',
    },
    logo: { width: 60, height: 60 },
    title: { fontSize: 28, fontWeight: 'bold', color: '#1C1C1E', marginBottom: 8, textAlign: 'center' },
    subtitle: { fontSize: 16, color: '#8E8E93', textAlign: 'center' },
    form: { marginBottom: 30 },
    inputContainer: { marginBottom: 20 },
    label: { fontSize: 13, fontWeight: '700', color: '#3A3A3C', marginBottom: 8, marginLeft: 5, textTransform: 'uppercase', letterSpacing: 0.5 },
    input: {
        backgroundColor: '#F2F2F7',
        padding: 16,
        borderRadius: 16,
        fontSize: 16,
        color: '#1C1C1E',
        borderWidth: 1,
        borderColor: '#E5E5EA'
    },
    button: {
        backgroundColor: '#8B5CF6',
        padding: 18,
        borderRadius: 16,
        alignItems: 'center',
        marginTop: 10,
        shadowColor: '#8B5CF6',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
        elevation: 6
    },
    buttonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
    footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 10 },
    footerText: { color: '#8E8E93', fontSize: 14 },
    link: { color: '#8B5CF6', fontWeight: 'bold', fontSize: 14 }
});
