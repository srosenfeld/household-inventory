import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Platform } from 'react-native';
import type { LoginScreenProps } from '../navigation/types';
import { useAuth } from '../contexts/AuthContext';
import { isSupabaseConfigured } from '../lib/supabase';
import { AuthLayout } from '../components/AuthLayout';
import { Button, Input } from '../components/ui';
import { colors, spacing, typography } from '../theme';

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
      <View style={styles.configError}>
        <Text style={styles.configTitle}>Configuration required</Text>
        <Text style={styles.configSubtitle}>
          Set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY in your .env file.
        </Text>
      </View>
    );
  }

  return (
    <AuthLayout>
      <Text style={styles.subtitle}>Sign in to manage your home inventory</Text>

      <Input
        placeholder="Email"
        autoCapitalize="none"
        keyboardType="email-address"
        autoComplete="email"
        value={email}
        onChangeText={setEmail}
      />
      <Input
        placeholder="Password"
        secureTextEntry
        autoComplete="password"
        value={password}
        onChangeText={setPassword}
      />

      <Button title="Sign in" onPress={handleSignIn} loading={loading} />

      <TouchableOpacity onPress={() => navigation.navigate('ForgotPassword')}>
        <Text style={styles.link}>Forgot password?</Text>
      </TouchableOpacity>

      <View style={styles.divider}>
        <View style={styles.dividerLine} />
        <Text style={styles.dividerText}>or</Text>
        <View style={styles.dividerLine} />
      </View>

      <Button title="Continue with Google" variant="secondary" onPress={handleGoogle} disabled={loading} />
      {Platform.OS === 'ios' ? (
        <Button title="Continue with Apple" variant="secondary" onPress={handleApple} disabled={loading} style={styles.ssoGap} />
      ) : null}

      <TouchableOpacity onPress={() => navigation.navigate('SignUp')}>
        <Text style={styles.footerLink}>
          Don&apos;t have an account? <Text style={styles.footerLinkBold}>Create one</Text>
        </Text>
      </TouchableOpacity>
    </AuthLayout>
  );
}

const styles = StyleSheet.create({
  configError: {
    flex: 1,
    backgroundColor: colors.canvas,
    padding: spacing.screenPadding,
    justifyContent: 'center',
  },
  configTitle: {
    ...typography.heading,
    color: colors.ink,
  },
  configSubtitle: {
    ...typography.body,
    color: colors.inkSecondary,
    marginTop: spacing.sm,
    lineHeight: 24,
  },
  subtitle: {
    ...typography.body,
    color: colors.inkSecondary,
    marginBottom: spacing.xxl,
    lineHeight: 24,
  },
  link: {
    color: colors.primaryDeep,
    textAlign: 'center',
    marginTop: spacing.lg,
    fontWeight: '500',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: spacing.xxl,
    gap: spacing.md,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.hairline,
  },
  dividerText: {
    color: colors.inkMuted,
  },
  ssoGap: {
    marginTop: spacing.sm,
  },
  footerLink: {
    textAlign: 'center',
    marginTop: spacing.xxl,
    color: colors.inkSecondary,
  },
  footerLinkBold: {
    color: colors.primaryDeep,
    fontWeight: '600',
  },
});
