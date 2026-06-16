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
  ScrollView,
} from 'react-native';
import type { SignUpScreenProps } from '../navigation/types';
import { useAuth } from '../contexts/AuthContext';

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
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Create account</Text>
        <Text style={styles.subtitle}>Start organizing your household inventory</Text>

        <View style={styles.row}>
          <TextInput
            style={[styles.input, styles.halfInput]}
            placeholder="First name"
            value={firstName}
            onChangeText={setFirstName}
            autoComplete="given-name"
          />
          <TextInput
            style={[styles.input, styles.halfInput]}
            placeholder="Last name"
            value={lastName}
            onChangeText={setLastName}
            autoComplete="family-name"
          />
        </View>

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
          autoComplete="new-password"
          value={password}
          onChangeText={setPassword}
        />
        <TextInput
          style={styles.input}
          placeholder="Confirm password"
          secureTextEntry
          autoComplete="new-password"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
        />

        <TouchableOpacity style={styles.primaryButton} onPress={handleSignUp} disabled={loading}>
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.primaryButtonText}>Create account</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.navigate('Login')}>
          <Text style={styles.footerLink}>
            Already have an account? <Text style={styles.footerLinkBold}>Sign in</Text>
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
  },
  row: {
    flexDirection: 'row',
    gap: 10,
  },
  halfInput: {
    flex: 1,
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
