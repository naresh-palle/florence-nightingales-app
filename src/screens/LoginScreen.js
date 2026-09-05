import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function LoginScreen({ setAuth }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    setIsLoading(true);
    
    try {
      const response = await fetch('https://florence-nightingales-app.onrender.com/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.toLowerCase(), password })
      });

      const data = await response.json();

      if (!response.ok) {
        Alert.alert("Login Failed", data.error || "Invalid credentials");
        setIsLoading(false);
        return;
      }

      // Successfully logged in!
      setAuth(data.token, data.user.role);
    } catch (error) {
      Alert.alert("Network Error", "Could not connect to the server.");
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      Alert.alert("Required", "Please enter your email first.");
      return;
    }
    try {
      await fetch('https://florence-nightingales-app.onrender.com/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.toLowerCase() })
      });
      Alert.alert("Forgot Password", "If an account exists for this email, password reset instructions have been sent.");
    } catch(e) {}
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Image 
          source={require('../../assets/icon.png')} 
          style={styles.logo} 
          resizeMode="contain"
        />
        <Text style={styles.title}>Florence Nightingales</Text>
        <Text style={styles.subtitle}>Operational Management System</Text>

        <TextInput
          style={styles.input}
          placeholder="Email or Username"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
        />
        
        <TextInput
          style={styles.input}
          placeholder="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        <TouchableOpacity onPress={handleForgotPassword} style={styles.forgotPassword}>
          <Text style={styles.forgotText}>Forgot Password?</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.button, isLoading && styles.buttonDisabled]} 
          onPress={handleLogin}
          disabled={isLoading}
        >
          <Text style={styles.buttonText}>{isLoading ? 'Authenticating...' : 'Secure Login'}</Text>
        </TouchableOpacity>
        
        {/* Notice: No Public Signup Button Here! */}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#ffffff' },
  content: { flex: 1, padding: 24, justifyContent: 'center' },
  logo: { width: 120, height: 120, alignSelf: 'center', marginBottom: 20 },
  title: { fontSize: 24, fontWeight: 'bold', textAlign: 'center', color: '#1a365d' },
  subtitle: { fontSize: 14, textAlign: 'center', color: '#718096', marginBottom: 40 },
  input: { borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 8, padding: 16, marginBottom: 16, fontSize: 16 },
  forgotPassword: { alignSelf: 'flex-end', marginBottom: 24 },
  forgotText: { color: '#3182ce', fontSize: 14 },
  button: { backgroundColor: '#e53e3e', padding: 16, borderRadius: 8, alignItems: 'center' },
  buttonDisabled: { backgroundColor: '#fc8181' },
  buttonText: { color: '#ffffff', fontSize: 16, fontWeight: 'bold' }
});
