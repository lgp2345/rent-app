import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { BuildingDetailScreen } from '../screens/buildings/BuildingDetailScreen';
import { BuildingListScreen } from '../screens/buildings/BuildingListScreen';
import { RoomMonthlyFeeScreen } from '../screens/rooms/RoomMonthlyFeeScreen';
import type { RootStackParamList } from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();

export const AppNavigation = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="BuildingList">
        <Stack.Screen name="BuildingList" component={BuildingListScreen} options={{ title: '房屋列表' }} />
        <Stack.Screen name="BuildingDetail" component={BuildingDetailScreen} options={{ title: '房屋详情' }} />
        <Stack.Screen name="RoomMonthlyFee" component={RoomMonthlyFeeScreen} options={{ title: '月度费用' }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};
