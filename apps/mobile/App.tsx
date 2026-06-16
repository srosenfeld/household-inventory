import React, { useEffect, useState } from 'react';
import { ActivityIndicator, View, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StatusBar } from 'expo-status-bar';
import type { RootStackParamList } from './src/navigation/types';
import { AuthProvider, useAuth } from './src/contexts/AuthContext';
import { LoginScreen } from './src/screens/LoginScreen';
import { SignUpScreen } from './src/screens/SignUpScreen';
import { ForgotPasswordScreen } from './src/screens/ForgotPasswordScreen';
import { ProfileScreen } from './src/screens/ProfileScreen';
import { CreateHouseholdScreen } from './src/screens/CreateHouseholdScreen';
import { HomeScreen } from './src/screens/HomeScreen';
import { RoomListScreen } from './src/screens/RoomListScreen';
import { RoomLayoutScreen } from './src/screens/RoomLayoutScreen';
import { StorageAreaScreen } from './src/screens/StorageAreaScreen';
import { CaptureScreen } from './src/screens/CaptureScreen';
import { ReviewItemsScreen } from './src/screens/ReviewItemsScreen';
import { ItemDetailScreen } from './src/screens/ItemDetailScreen';
import { SearchScreen } from './src/screens/SearchScreen';
import { api } from './src/services/api';

const Stack = createNativeStackNavigator<RootStackParamList>();

const screenOptions = {
  headerStyle: { backgroundColor: '#1a1a2e' },
  headerTintColor: '#fff',
  headerTitleStyle: { fontWeight: '600' as const },
};

function AuthStack() {
  return (
    <Stack.Navigator screenOptions={screenOptions}>
      <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
      <Stack.Screen name="SignUp" component={SignUpScreen} options={{ title: 'Create account' }} />
      <Stack.Screen
        name="ForgotPassword"
        component={ForgotPasswordScreen}
        options={{ title: 'Reset password' }}
      />
    </Stack.Navigator>
  );
}

function MainStack({
  initialRoute,
  homeParams,
}: {
  initialRoute: keyof RootStackParamList;
  homeParams?: RootStackParamList['Home'];
}) {
  return (
    <Stack.Navigator initialRouteName={initialRoute} screenOptions={screenOptions}>
      <Stack.Screen name="Profile" component={ProfileScreen} options={{ title: 'Account' }} />
      <Stack.Screen
        name="CreateHousehold"
        component={CreateHouseholdScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="Home"
        component={HomeScreen}
        options={{ title: 'Home' }}
        initialParams={initialRoute === 'Home' ? homeParams : undefined}
      />
      <Stack.Screen name="RoomList" component={RoomListScreen} options={{ title: 'Rooms' }} />
      <Stack.Screen name="RoomLayout" component={RoomLayoutScreen} options={{ title: 'Room layout' }} />
      <Stack.Screen name="StorageArea" component={StorageAreaScreen} options={{ title: 'Storage area' }} />
      <Stack.Screen name="Capture" component={CaptureScreen} options={{ title: 'Scan contents' }} />
      <Stack.Screen name="ReviewItems" component={ReviewItemsScreen} options={{ title: 'Review items' }} />
      <Stack.Screen name="ItemDetail" component={ItemDetailScreen} options={{ title: 'Item details' }} />
      <Stack.Screen name="Search" component={SearchScreen} options={{ title: 'Find item' }} />
    </Stack.Navigator>
  );
}

function AppNavigator() {
  const { session, loading: authLoading } = useAuth();
  const [ready, setReady] = useState(false);
  const [startRoute, setStartRoute] = useState<keyof RootStackParamList>('CreateHousehold');
  const [homeParams, setHomeParams] = useState<RootStackParamList['Home'] | undefined>();

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
          setStartRoute('Home');
          setHomeParams({
            householdId: households[0].id,
            householdName: households[0].name,
          });
        } else {
          setStartRoute('CreateHousehold');
          setHomeParams(undefined);
        }
      } catch {
        setStartRoute('CreateHousehold');
        setHomeParams(undefined);
      }
      setReady(true);
    })();
  }, [session, authLoading]);

  if (authLoading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#4a6cf7" />
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
        <ActivityIndicator size="large" color="#4a6cf7" />
      </View>
    );
  }

  return (
    <NavigationContainer key={`auth-${session.user.id}`}>
      <StatusBar style="dark" />
      <MainStack initialRoute={startRoute} homeParams={homeParams} />
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <GestureHandlerRootView style={styles.root}>
      <AuthProvider>
        <AppNavigator />
      </AuthProvider>
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
    backgroundColor: '#f8f9fc',
  },
});
