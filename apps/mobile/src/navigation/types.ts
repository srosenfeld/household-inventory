import type { NavigatorScreenParams } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { CompositeScreenProps } from '@react-navigation/native';
import type { DraftItem, Item, Room, StorageArea } from '@household-inventory/shared';

export type AuthStackParamList = {
  Login: undefined;
  SignUp: undefined;
  ForgotPassword: undefined;
};

export type HomeTabParamList = {
  Home: undefined;
  ItemDetail: {
    itemId: string;
    item?: Item;
    storageAreaName?: string;
    roomName?: string;
  };
};

export type RoomsTabParamList = {
  RoomList: undefined;
  RoomLayout: { roomId: string; roomName: string };
  StorageArea: { storageAreaId: string; storageAreaName: string; roomId: string; roomName: string };
  Capture: { storageAreaId: string; storageAreaName: string; roomId: string; roomName: string };
  ReviewItems: {
    storageAreaId: string;
    roomId: string;
    scanJobId: string;
    draftItems: DraftItem[];
    storageAreaName: string;
    roomName: string;
  };
  ItemDetail: {
    itemId: string;
    item?: Item;
    storageAreaName?: string;
    roomName?: string;
  };
};

export type SearchTabParamList = {
  Search: undefined;
  ItemDetail: {
    itemId: string;
    item?: Item;
    storageAreaName?: string;
    roomName?: string;
  };
};

export type AccountTabParamList = {
  Profile: undefined;
};

export type OITabParamList = {
  OIInsights: undefined;
};

export type MainTabParamList = {
  HomeTab: NavigatorScreenParams<HomeTabParamList>;
  OITab: NavigatorScreenParams<OITabParamList>;
  RoomsTab: NavigatorScreenParams<RoomsTabParamList>;
  SearchTab: NavigatorScreenParams<SearchTabParamList>;
  AccountTab: NavigatorScreenParams<AccountTabParamList>;
};

/** @deprecated Legacy composite type */
export type RootStackParamList = AuthStackParamList & {
  Profile: undefined;
  CreateHousehold: undefined;
  Home: { householdId: string; householdName: string };
  RoomList: { householdId: string; householdName: string };
  RoomLayout: { roomId: string; roomName: string; householdId: string };
  StorageArea: { storageAreaId: string; storageAreaName: string; roomId: string; roomName: string };
  Capture: { storageAreaId: string; storageAreaName: string; roomId: string; roomName: string };
  ReviewItems: {
    storageAreaId: string;
    roomId: string;
    scanJobId: string;
    draftItems: DraftItem[];
    storageAreaName: string;
    roomName: string;
  };
  ItemDetail: {
    itemId: string;
    item?: Item;
    storageAreaName?: string;
    roomName?: string;
  };
  Search: { householdId: string };
};

export type LoginScreenProps = NativeStackScreenProps<AuthStackParamList, 'Login'>;
export type SignUpScreenProps = NativeStackScreenProps<AuthStackParamList, 'SignUp'>;
export type ForgotPasswordScreenProps = NativeStackScreenProps<AuthStackParamList, 'ForgotPassword'>;
export type CreateHouseholdScreenProps = { onComplete?: (householdId: string, householdName: string) => void };

export type HomeScreenProps = CompositeScreenProps<
  NativeStackScreenProps<HomeTabParamList, 'Home'>,
  BottomTabScreenProps<MainTabParamList>
>;

export type RoomListScreenProps = CompositeScreenProps<
  NativeStackScreenProps<RoomsTabParamList, 'RoomList'>,
  BottomTabScreenProps<MainTabParamList>
>;

export type RoomLayoutScreenProps = NativeStackScreenProps<RoomsTabParamList, 'RoomLayout'>;
export type StorageAreaScreenProps = NativeStackScreenProps<RoomsTabParamList, 'StorageArea'>;
export type CaptureScreenProps = NativeStackScreenProps<RoomsTabParamList, 'Capture'>;
export type ReviewItemsScreenProps = NativeStackScreenProps<RoomsTabParamList, 'ReviewItems'>;
export type ItemDetailScreenProps =
  | NativeStackScreenProps<HomeTabParamList, 'ItemDetail'>
  | NativeStackScreenProps<RoomsTabParamList, 'ItemDetail'>
  | NativeStackScreenProps<SearchTabParamList, 'ItemDetail'>;
export type SearchScreenProps = CompositeScreenProps<
  NativeStackScreenProps<SearchTabParamList, 'Search'>,
  BottomTabScreenProps<MainTabParamList>
>;
export type OIInsightsScreenProps = CompositeScreenProps<
  NativeStackScreenProps<OITabParamList, 'OIInsights'>,
  BottomTabScreenProps<MainTabParamList>
>;
export type ProfileScreenProps = NativeStackScreenProps<AccountTabParamList, 'Profile'>;

export type { Room, StorageArea, Item, DraftItem };
