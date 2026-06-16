import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import type { ForgotPasswordScreenProps } from '../navigation/types';
import { useAuth } from '../contexts/AuthContext';

export function ForgotPasswordScreen({ navigation }: ForgotPasswordScreenProps) {
  const { resetPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleReset = async () => {
    if (!email.trim()) {
      Alert.alert('Email required', 'Enter the email for your account.');
      return;
    }

    setLoading(true);
    try {
      await resetPassword(email.trim());
      setSent(true);
    } catch (err) {
      Alert.alert('Reset failed', err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <Text style={styles.title}>Reset password</Text>
      <Text style={styles.subtitle}>
        Enter your email and we&apos;ll send a link to reset your password.
      </Text>

      {sent ? (
        <View style={styles.successBox}>
          <Text style={styles.successText}>
            Check your email for a password reset link. It may take a minute to arrive.
          </Text>
        </View>
      ) : (
        <>
          <TextInput
            style={styles.input}
            placeholder="Email"
            autoCapitalize="none"
            keyboardType="email-address"
            autoComplete="email"
            value={email}
            onChangeText={setEmail}
          />

          <TouchableOpacity style={styles.primaryButton} onPress={handleReset} disabled={loading}>
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.primaryButtonText}>Send reset link</Text>
            )}
          </TouchableOpacity>
        </>
      )}

      <TouchableOpacity onPress={() => navigation.navigate('Login')}>
        <Text style={styles.link}>Back to sign in</Text>
      </TouchableOpacity>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fc',
    padding: 24,
    paddingTop: 48,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1a1a2e',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginTop: 8,
    marginBottom: 24,
    lineHeight: 24,
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 16,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#e8e8ef',
    marginBottom: 12,
  },
  primaryButton: {
    backgroundColor: '#4a6cf7',
    padding: 16,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 8,
  },
  primaryButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  successBox: {
    backgroundColor: '#eef2ff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  successText: {
    color: '#1a1a2e',
    lineHeight: 22,
  },
  link: {
    color: '#4a6cf7',
    textAlign: 'center',
    marginTop: 24,
    fontWeight: '500',
  },
});
