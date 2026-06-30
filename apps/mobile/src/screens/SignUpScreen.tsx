import React, { useState } from 'react';
import { Text, StyleSheet, TouchableOpacity, Alert, View } from 'react-native';
import type { SignUpScreenProps } from '../navigation/types';
import { useAuth } from '../contexts/AuthContext';
import { AuthLayout } from '../components/AuthLayout';
import { Button, Input } from '../components/ui';
import { colors, spacing, typography } from '../theme';

export function SignUpScreen({ navigation }: SignUpScreenProps) {
  const { signUp } = useAuth();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSignUp = async () => {
    if (!firstName.trim() || !lastName.trim() || !email.trim() || !password) {
      Alert.alert('Missing fields', 'Fill in all fields to create your account.');
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert('Password mismatch', 'Passwords do not match.');
      return;
    }
    if (password.length < 8) {
      Alert.alert('Weak password', 'Password must be at least 8 characters.');
      return;
    }

    setLoading(true);
    try {
      const { needsEmailConfirmation } = await signUp({
        email: email.trim(),
        password,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
      });

      if (needsEmailConfirmation) {
        Alert.alert(
          'Check your email',
          'We sent a confirmation link. Verify your email, then sign in.',
          [{ text: 'OK', onPress: () => navigation.navigate('Login') }]
        );
      }
    } catch (err) {
      Alert.alert('Sign up failed', err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout scrollProps={{ contentContainerStyle: styles.scroll }}>
      <Text style={styles.title}>Create account</Text>
      <Text style={styles.subtitle}>Start organizing your household inventory</Text>

      <View style={styles.row}>
        <Input
          style={styles.halfInput}
          placeholder="First name"
          value={firstName}
          onChangeText={setFirstName}
          autoComplete="given-name"
        />
        <Input
          style={styles.halfInput}
          placeholder="Last name"
          value={lastName}
          onChangeText={setLastName}
          autoComplete="family-name"
        />
      </View>

      <Input
        placeholder="Email"
        autoCapitalize="none"
        keyboardType="email-address"
        autoComplete="email"
        value={email}
        onChangeText={setEmail}
      />
      <Input placeholder="Password" secureTextEntry autoComplete="new-password" value={password} onChangeText={setPassword} />
      <Input
        placeholder="Confirm password"
        secureTextEntry
        autoComplete="new-password"
        value={confirmPassword}
        onChangeText={setConfirmPassword}
      />

      <Button title="Create account" onPress={handleSignUp} loading={loading} />

      <TouchableOpacity onPress={() => navigation.navigate('Login')}>
        <Text style={styles.footerLink}>
          Already have an account? <Text style={styles.footerLinkBold}>Sign in</Text>
        </Text>
      </TouchableOpacity>
    </AuthLayout>
  );
}

const styles = StyleSheet.create({
  scroll: {
    paddingTop: spacing.lg,
  },
  title: {
    ...typography.heading,
    color: colors.ink,
    marginBottom: spacing.sm,
  },
  subtitle: {
    ...typography.body,
    color: colors.inkSecondary,
    marginBottom: spacing.xl,
  },
  row: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  halfInput: {
    flex: 1,
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
