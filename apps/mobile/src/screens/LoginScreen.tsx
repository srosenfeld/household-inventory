import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Platform,
  KeyboardAvoidingView,
  ScrollView,
} from 'react-native';
import type { LoginScreenProps } from '../navigation/types';
import { useAuth } from '../contexts/AuthContext';
import { isSupabaseConfigured } from '../lib/supabase';

export function LoginScreen({ navigation }: LoginScreenProps) {
  const { signIn, signInWithGoogle, signInWithApple } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSignIn = async () => {
    if (!email.trim() || !password) {
      Alert.alert('Missing fields', 'Enter your email and password.');
      return;
    }

    setLoading(true);
    try {
      await signIn(email.trim(), password);
    } catch (err) {
      Alert.alert('Sign in failed', err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setLoading(true);
    try {
      await signInWithGoogle();
    } catch (err) {
      Alert.alert('Google sign in failed', err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const handleApple = async () => {
    setLoading(true);
    try {
      await signInWithApple();
    } catch (err) {
      if (err instanceof Error && err.message.includes('ERR_REQUEST_CANCELED')) return;
      Alert.alert('Apple sign in failed', err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  if (!isSupabaseConfigured()) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Configuration required</Text>
        <Text style={styles.subtitle}>
          Set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY in your .env file.
        </Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Household Inventory</Text>
        <Text style={styles.subtitle}>Sign in to manage your home inventory</Text>

        <TextInput
          style={styles.input}
          placeholder="Email"
          autoCapitalize="none"
          keyboardType="email-address"
          autoComplete="email"
          value={email}
          onChangeText={setEmail}
        />
        <TextInput
          style={styles.input}
          placeholder="Password"
          secureTextEntry
          autoComplete="password"
          value={password}
          onChangeText={setPassword}
        />

        <TouchableOpacity style={styles.primaryButton} onPress={handleSignIn} disabled={loading}>
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.primaryButtonText}>Sign in</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.navigate('ForgotPassword')}>
          <Text style={styles.link}>Forgot password?</Text>
        </TouchableOpacity>

        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>or</Text>
          <View style={styles.dividerLine} />
        </View>

        <TouchableOpacity style={styles.ssoButton} onPress={handleGoogle} disabled={loading}>
          <Text style={styles.ssoButtonText}>Continue with Google</Text>
        </TouchableOpacity>

        {Platform.OS === 'ios' && (
          <TouchableOpacity style={styles.ssoButton} onPress={handleApple} disabled={loading}>
            <Text style={styles.ssoButtonText}>Continue with Apple</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity onPress={() => navigation.navigate('SignUp')}>
          <Text style={styles.footerLink}>
            Don&apos;t have an account? <Text style={styles.footerLinkBold}>Create one</Text>
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: {
    flexGrow: 1,
    backgroundColor: '#f8f9fc',
    padding: 24,
    justifyContent: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#1a1a2e',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginTop: 8,
    marginBottom: 32,
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
  link: {
    color: '#4a6cf7',
    textAlign: 'center',
    marginTop: 16,
    fontWeight: '500',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
    gap: 12,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#e8e8ef',
  },
  dividerText: {
    color: '#888',
  },
  ssoButton: {
    backgroundColor: '#fff',
    padding: 14,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e8e8ef',
    marginBottom: 10,
  },
  ssoButtonText: {
    color: '#1a1a2e',
    fontWeight: '600',
  },
  footerLink: {
    textAlign: 'center',
    marginTop: 24,
    color: '#666',
  },
  footerLinkBold: {
    color: '#4a6cf7',
    fontWeight: '600',
  },
});
