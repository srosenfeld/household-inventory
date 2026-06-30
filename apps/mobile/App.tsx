import React, { useEffect, useState } from 'react';
import { ActivityIndicator, View, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StatusBar } from 'expo-status-bar';
import type { AuthStackParamList } from './src/navigation/types';
import { authStackScreenOptions } from './src/navigation/theme';
import { MainTabs } from './src/navigation/MainTabs';
import { AuthProvider, useAuth } from './src/contexts/AuthContext';
import { HouseholdProvider } from './src/contexts/HouseholdContext';
import { PhotoSetupProvider } from './src/contexts/PhotoSetupContext';
import { LoginScreen } from './src/screens/LoginScreen';
import { SignUpScreen } from './src/screens/SignUpScreen';
import { ForgotPasswordScreen } from './src/screens/ForgotPasswordScreen';
import { CreateHouseholdScreen } from './src/screens/CreateHouseholdScreen';
import { api } from './src/services/api';
import { colors } from './src/theme';
import { WebShell } from './src/components/WebShell';

const AuthStackNav = createNativeStackNavigator<AuthStackParamList>();

function AuthStack() {
  return (
    <AuthStackNav.Navigator screenOptions={authStackScreenOptions}>
      <AuthStackNav.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
      <AuthStackNav.Screen name="SignUp" component={SignUpScreen} options={{ title: 'Create account' }} />
      <AuthStackNav.Screen
        name="ForgotPassword"
        component={ForgotPasswordScreen}
        options={{ title: 'Reset password' }}
      />
    </AuthStackNav.Navigator>
  );
}

function AppNavigator() {
  const { session, loading: authLoading } = useAuth();
  const [ready, setReady] = useState(false);
  const [needsHousehold, setNeedsHousehold] = useState(false);
  const [householdId, setHouseholdId] = useState('');
  const [householdName, setHouseholdName] = useState('');

  useEffect(() => {
    if (authLoading) return;

    if (!session) {
      setReady(true);
      return;
    }

    setReady(false);
    (async () => {
      try {
        await api.getProfile();
        const households = await api.getHouseholds();
        if (households.length > 0) {
          setHouseholdId(households[0].id);
          setHouseholdName(households[0].name);
          setNeedsHousehold(false);
        } else {
          setNeedsHousehold(true);
        }
      } catch {
        setNeedsHousehold(true);
      }
      setReady(true);
    })();
  }, [session, authLoading]);

  const handleHouseholdCreated = (id: string, name: string) => {
    setHouseholdId(id);
    setHouseholdName(name);
    setNeedsHousehold(false);
  };

  if (authLoading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!session) {
    return (
      <NavigationContainer key="guest">
        <StatusBar style="dark" />
        <AuthStack />
      </NavigationContainer>
    );
  }

  if (!ready) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (needsHousehold) {
    return (
      <NavigationContainer key={`setup-${session.user.id}`}>
        <StatusBar style="dark" />
        <CreateHouseholdScreen onComplete={handleHouseholdCreated} />
      </NavigationContainer>
    );
  }

  return (
    <NavigationContainer key={`auth-${session.user.id}`}>
      <StatusBar style="dark" />
      <HouseholdProvider
        value={{
          householdId,
          householdName,
          setHousehold: ({ householdId: id, householdName: name }) => {
            setHouseholdId(id);
            setHouseholdName(name);
          },
        }}
      >
        <PhotoSetupProvider>
          <MainTabs />
        </PhotoSetupProvider>
      </HouseholdProvider>
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <GestureHandlerRootView style={styles.root}>
      <WebShell>
        <AuthProvider>
          <AppNavigator />
        </AuthProvider>
      </WebShell>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.canvasSoft,
  },
});
