import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { BuildingDetailScreen } from '../screens/buildings/BuildingDetailScreen';
import { BuildingListScreen } from '../screens/buildings/BuildingListScreen';
import { RoomFormScreen } from '../screens/rooms/RoomFormScreen';
import { RoomMonthlyFeeScreen } from '../screens/rooms/RoomMonthlyFeeScreen';
import { RoomTenantScreen } from '../screens/rooms/RoomTenantScreen';
import type { RootStackParamList } from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();

export const AppNavigation = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="BuildingList">
        <Stack.Screen
          name="BuildingList"
          component={BuildingListScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="BuildingDetail"
          component={BuildingDetailScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="RoomForm"
          component={RoomFormScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="RoomMonthlyFee"
          component={RoomMonthlyFeeScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="RoomTenant"
          component={RoomTenantScreen}
          options={{ headerShown: false }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
};
