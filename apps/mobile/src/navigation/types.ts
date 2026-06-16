import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { DraftItem, Item, Room, StorageArea } from '@household-inventory/shared';

export type RootStackParamList = {
  Login: undefined;
  SignUp: undefined;
  ForgotPassword: undefined;
  Profile: undefined;
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
  CreateHousehold: undefined;
};

export type LoginScreenProps = NativeStackScreenProps<RootStackParamList, 'Login'>;
export type SignUpScreenProps = NativeStackScreenProps<RootStackParamList, 'SignUp'>;
export type ForgotPasswordScreenProps = NativeStackScreenProps<RootStackParamList, 'ForgotPassword'>;
export type ProfileScreenProps = NativeStackScreenProps<RootStackParamList, 'Profile'>;
export type HomeScreenProps = NativeStackScreenProps<RootStackParamList, 'Home'>;
export type RoomListScreenProps = NativeStackScreenProps<RootStackParamList, 'RoomList'>;
export type RoomLayoutScreenProps = NativeStackScreenProps<RootStackParamList, 'RoomLayout'>;
export type StorageAreaScreenProps = NativeStackScreenProps<RootStackParamList, 'StorageArea'>;
export type CaptureScreenProps = NativeStackScreenProps<RootStackParamList, 'Capture'>;
export type ReviewItemsScreenProps = NativeStackScreenProps<RootStackParamList, 'ReviewItems'>;
export type ItemDetailScreenProps = NativeStackScreenProps<RootStackParamList, 'ItemDetail'>;
export type SearchScreenProps = NativeStackScreenProps<RootStackParamList, 'Search'>;
export type CreateHouseholdScreenProps = NativeStackScreenProps<RootStackParamList, 'CreateHousehold'>;

export type { Room, StorageArea, Item, DraftItem };
