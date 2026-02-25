import AsyncStorage from '@react-native-async-storage/async-storage';
import type { RentalData } from '../types/rental';

const STORAGE_KEY = '@rent-app:rental-data';

export const loadRentalData = async (): Promise<RentalData> => {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return { buildings: [] };
    }
    const parsed = JSON.parse(raw) as RentalData;
    if (!parsed || !Array.isArray(parsed.buildings)) {
      return { buildings: [] };
    }
    return parsed;
  } catch {
    return { buildings: [] };
  }
};

export const saveRentalData = async (data: RentalData): Promise<void> => {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data));
};
