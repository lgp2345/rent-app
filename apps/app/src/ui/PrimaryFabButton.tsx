import type { ReactNode } from 'react';
import { Button } from 'heroui-native/button';
import { View } from 'react-native';

type Props = {
  label: string;
  onPress: () => void;
  icon?: ReactNode;
};

export const PrimaryFabButton = ({ label, onPress, icon }: Props) => {
  return (
    <View className="absolute right-4 bottom-6">
      <Button
        variant="primary"
        onPress={onPress}
        className="px-5 py-3 rounded-2xl min-h-[48px] shadow-lg"
        accessibilityRole="button"
        accessibilityLabel={label}
      >
        {icon}
        <Button.Label>{label}</Button.Label>
      </Button>
    </View>
  );
};
