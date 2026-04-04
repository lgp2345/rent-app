import { StatusBar } from 'expo-status-bar';
import { HeroUINativeProvider } from 'heroui-native';
import { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import './global.css';
import { AppNavigation } from './src/navigation';
import { useRentalStore } from './src/store/rentalStore';

export default function App() {
  const hydrated = useRentalStore((state) => state.hydrated);
  const hydrate = useRentalStore((state) => state.hydrate);

  useEffect(() => {
    void hydrate();
  }, [hydrate]);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <HeroUINativeProvider>
          {hydrated ? (
            <AppNavigation />
          ) : (
            <View className="flex-1 items-center justify-center bg-background">
              <ActivityIndicator />
            </View>
          )}
          <StatusBar style="auto" />
        </HeroUINativeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
