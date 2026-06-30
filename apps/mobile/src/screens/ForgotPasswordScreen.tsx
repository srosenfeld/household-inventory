import React, { useState } from 'react';
import { Text, StyleSheet, TouchableOpacity, Alert, View } from 'react-native';
import type { ForgotPasswordScreenProps } from '../navigation/types';
import { useAuth } from '../contexts/AuthContext';
import { Button, Input } from '../components/ui';
import { colors, spacing, typography } from '../theme';

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
    <View style={styles.container}>
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
          <Input
            placeholder="Email"
            autoCapitalize="none"
            keyboardType="email-address"
            autoComplete="email"
            value={email}
            onChangeText={setEmail}
          />
          <Button title="Send reset link" onPress={handleReset} loading={loading} />
        </>
      )}

      <TouchableOpacity onPress={() => navigation.navigate('Login')}>
        <Text style={styles.link}>Back to sign in</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.canvasSoft,
    padding: spacing.screenPadding,
    paddingTop: spacing.lg,
  },
  subtitle: {
    ...typography.body,
    color: colors.inkSecondary,
    marginBottom: spacing.xl,
    lineHeight: 24,
  },
  successBox: {
    backgroundColor: colors.primarySoft,
    borderRadius: spacing.cardRadius,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.hairline,
  },
  successText: {
    color: colors.ink,
    lineHeight: 22,
  },
  link: {
    color: colors.primaryDeep,
    textAlign: 'center',
    marginTop: spacing.xxl,
    fontWeight: '500',
  },
});
