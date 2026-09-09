import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  Alert, Image, ImageBackground, KeyboardAvoidingView, Platform, ScrollView
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function LoginScreen({ setAuth }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Required', 'Please enter your email and password.');
      return;
    }
    setIsLoading(true);
    try {
      const response = await fetch('https://florence-nightingales-app.onrender.com/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase(), password })
      });
      const data = await response.json();
      if (!response.ok) {
        Alert.alert('Login Failed', data.error || 'Invalid credentials');
        setIsLoading(false);
        return;
      }
      setAuth(data.token, data.user.role);
    } catch {
      Alert.alert('Network Error', 'Could not connect to server. Check your internet connection.');
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) { Alert.alert('Required', 'Enter your email first.'); return; }
    try {
      await fetch('https://florence-nightingales-app.onrender.com/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase() })
      });
      Alert.alert('Email Sent', 'If this account exists, reset instructions have been sent.');
    } catch {}
  };

  return (
    <ImageBackground source={require('../../assets/login_bg.jpg')} style={s.bg} resizeMode="cover">
      <View style={s.overlay} />
      <SafeAreaView style={s.safe}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
          <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">
            {/* Logo Card */}
            <View style={s.logoCard}>
              <Image source={require('../../assets/icon.jpg')} style={s.logo} resizeMode="contain" />
              <Text style={s.appName}>Florence Nightingales</Text>
              <Text style={s.tagline}>Operational Management System</Text>
            </View>

            {/* Login Card */}
            <View style={s.card}>
              <Text style={s.cardTitle}>Secure Login</Text>
              <Text style={s.cardSub}>Authorized personnel only</Text>

              <Text style={s.label}>Email Address</Text>
              <TextInput
                style={s.input}
                placeholder="Enter your email"
                placeholderTextColor="#94a3b8"
                selectionColor="#ffffff"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
              />

              <Text style={s.label}>Password</Text>
              <View style={s.passwordRow}>
                <TextInput
                  style={s.passwordInput}
                  placeholder="Enter your password"
                  placeholderTextColor="#94a3b8"
                  selectionColor="#ffffff"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={s.eyeBtn}>
                  <Text style={s.eyeText}>{showPassword ? '🙈' : '👁️'}</Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity onPress={handleForgotPassword} style={s.forgot}>
                <Text style={s.forgotText}>Forgot Password?</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[s.btn, isLoading && s.btnDisabled]}
                onPress={handleLogin}
                disabled={isLoading}
                activeOpacity={0.8}
              >
                <Text style={s.btnText}>{isLoading ? '⏳  Authenticating...' : '🔐  Secure Login'}</Text>
              </TouchableOpacity>

              <View style={s.notice}>
                <Text style={s.noticeText}>🔒 256-bit encrypted connection</Text>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </ImageBackground>
  );
}

const s = StyleSheet.create({
  bg: { flex: 1 },
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(10, 25, 45, 0.45)' },
  safe: { flex: 1 },
  scroll: { flexGrow: 1, justifyContent: 'center', padding: 20, paddingBottom: 40 },
  logoCard: { alignItems: 'center', marginBottom: 24 },
  logo: { width: 88, height: 88, borderRadius: 20, marginBottom: 12, borderWidth: 2, borderColor: 'rgba(255,255,255,0.4)' },
  appName: { fontSize: 26, fontWeight: '800', color: '#ffffff', textShadowColor: 'rgba(0,0,0,0.8)', textShadowRadius: 8, textShadowOffset: { width: 0, height: 2 } },
  tagline: { fontSize: 13, color: '#e2e8f0', marginTop: 4, letterSpacing: 0.5, textShadowColor: 'rgba(0,0,0,0.8)', textShadowRadius: 6, textShadowOffset: { width: 0, height: 1 } },
  card: {
    backgroundColor: 'rgba(15, 23, 42, 0.88)',
    borderRadius: 24,
    padding: 24,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.22)',
    shadowColor: '#000',
    shadowOpacity: 0.4,
    shadowRadius: 18,
    elevation: 10
  },
  cardTitle: { fontSize: 24, fontWeight: '800', color: '#ffffff', marginBottom: 4 },
  cardSub: { fontSize: 13, color: '#cbd5e1', marginBottom: 22 },
  label: { fontSize: 14, fontWeight: '700', color: '#f1f5f9', marginBottom: 6 },
  input: {
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.35)',
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    color: '#ffffff',
    backgroundColor: 'rgba(30, 41, 59, 0.8)',
    marginBottom: 16
  },
  passwordRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.35)',
    borderRadius: 12,
    backgroundColor: 'rgba(30, 41, 59, 0.8)',
    marginBottom: 10
  },
  passwordInput: { flex: 1, padding: 14, fontSize: 15, color: '#ffffff' },
  eyeBtn: { padding: 14 },
  eyeText: { fontSize: 18 },
  forgot: { alignSelf: 'flex-end', marginBottom: 24 },
  forgotText: { color: '#60a5fa', fontSize: 13, fontWeight: '700' },
  btn: {
    backgroundColor: '#dc2626',
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#dc2626',
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 6
  },
  btnDisabled: { backgroundColor: '#f87171' },
  btnText: { color: '#ffffff', fontSize: 16, fontWeight: '800', letterSpacing: 0.5 },
  notice: { marginTop: 22, alignItems: 'center' },
  noticeText: { color: '#94a3b8', fontSize: 12 },
});
