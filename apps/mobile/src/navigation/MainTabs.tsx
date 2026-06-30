import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import type {
  HomeTabParamList,
  OITabParamList,
  RoomsTabParamList,
  SearchTabParamList,
  AccountTabParamList,
  MainTabParamList,
} from './types';
import { colors } from '../theme';
import { stackScreenOptions } from './theme';
import { HomeScreen } from '../screens/HomeScreen';
import { PhotoCaptureScreen } from '../screens/PhotoCaptureScreen';
import { AssignPhotosToRoomsScreen } from '../screens/AssignPhotosToRoomsScreen';
import { OrganizeRoomPhotosScreen } from '../screens/OrganizeRoomPhotosScreen';
import { RoomListScreen } from '../screens/RoomListScreen';
import { RoomLayoutScreen } from '../screens/RoomLayoutScreen';
import { StorageAreaScreen } from '../screens/StorageAreaScreen';
import { CaptureScreen } from '../screens/CaptureScreen';
import { ReviewItemsScreen } from '../screens/ReviewItemsScreen';
import { ItemDetailScreen } from '../screens/ItemDetailScreen';
import { SearchScreen } from '../screens/SearchScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { OIInsightsScreen } from '../screens/OIInsightsScreen';

const Tab = createBottomTabNavigator<MainTabParamList>();
const HomeStack = createNativeStackNavigator<HomeTabParamList>();
const OIStack = createNativeStackNavigator<OITabParamList>();
const RoomsStack = createNativeStackNavigator<RoomsTabParamList>();
const SearchStack = createNativeStackNavigator<SearchTabParamList>();
const AccountStack = createNativeStackNavigator<AccountTabParamList>();

function HomeTabNavigator() {
  return (
    <HomeStack.Navigator screenOptions={stackScreenOptions}>
      <HomeStack.Screen name="Home" component={HomeScreen} options={{ title: 'Home' }} />
      <HomeStack.Screen name="PhotoCapture" component={PhotoCaptureScreen} options={{ title: 'Take photos' }} />
      <HomeStack.Screen
        name="AssignPhotosToRooms"
        component={AssignPhotosToRoomsScreen}
        options={{ title: 'Assign to rooms' }}
      />
      <HomeStack.Screen
        name="OrganizeRoomPhotos"
        component={OrganizeRoomPhotosScreen}
        options={{ title: 'Organize' }}
      />
      <HomeStack.Screen name="ItemDetail" component={ItemDetailScreen} options={{ title: 'Item details' }} />
    </HomeStack.Navigator>
  );
}

function RoomsTabNavigator() {
  return (
    <RoomsStack.Navigator screenOptions={stackScreenOptions}>
      <RoomsStack.Screen name="RoomList" component={RoomListScreen} options={{ title: 'Rooms' }} />
      <RoomsStack.Screen name="RoomLayout" component={RoomLayoutScreen} options={{ title: 'Room layout' }} />
      <RoomsStack.Screen name="StorageArea" component={StorageAreaScreen} options={{ title: 'Storage area' }} />
      <RoomsStack.Screen name="Capture" component={CaptureScreen} options={{ title: 'Scan contents' }} />
      <RoomsStack.Screen name="ReviewItems" component={ReviewItemsScreen} options={{ title: 'Review items' }} />
      <RoomsStack.Screen name="ItemDetail" component={ItemDetailScreen} options={{ title: 'Item details' }} />
    </RoomsStack.Navigator>
  );
}

function OITabNavigator() {
  return (
    <OIStack.Navigator screenOptions={stackScreenOptions}>
      <OIStack.Screen
        name="OIInsights"
        component={OIInsightsScreen}
        options={{ title: 'Organizational Intelligence' }}
      />
    </OIStack.Navigator>
  );
}

function SearchTabNavigator() {
  return (
    <SearchStack.Navigator screenOptions={stackScreenOptions}>
      <SearchStack.Screen name="Search" component={SearchScreen} options={{ title: 'Find item' }} />
      <SearchStack.Screen name="ItemDetail" component={ItemDetailScreen} options={{ title: 'Item details' }} />
    </SearchStack.Navigator>
  );
}

function AccountTabNavigator() {
  return (
    <AccountStack.Navigator screenOptions={stackScreenOptions}>
      <AccountStack.Screen name="Profile" component={ProfileScreen} options={{ title: 'Account' }} />
    </AccountStack.Navigator>
  );
}

export function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.navigation.tabActive,
        tabBarInactiveTintColor: colors.navigation.tabInactive,
        tabBarStyle: {
          backgroundColor: colors.navigation.tabBarBg,
          borderTopColor: colors.navigation.tabBarBorder,
          borderTopWidth: 1,
        },
        tabBarIcon: ({ color, size }) => {
          const icons: Record<keyof MainTabParamList, keyof typeof Ionicons.glyphMap> = {
            HomeTab: 'home-outline',
            OITab: 'sparkles-outline',
            RoomsTab: 'grid-outline',
            SearchTab: 'search-outline',
            AccountTab: 'person-outline',
          };
          return <Ionicons name={icons[route.name]} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="HomeTab" component={HomeTabNavigator} options={{ title: 'Home' }} />
      <Tab.Screen name="OITab" component={OITabNavigator} options={{ title: 'OI' }} />
      <Tab.Screen name="RoomsTab" component={RoomsTabNavigator} options={{ title: 'Rooms' }} />
      <Tab.Screen name="SearchTab" component={SearchTabNavigator} options={{ title: 'Search' }} />
      <Tab.Screen name="AccountTab" component={AccountTabNavigator} options={{ title: 'Account' }} />
    </Tab.Navigator>
  );
}
