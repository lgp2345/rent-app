import { useNavigation } from '@react-navigation/native';
import { Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';

type Props = {
  title: string;
  showBack?: boolean;
};

export const HeaderBar = ({ title, showBack = true }: Props) => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();

  return (
    <View className="bg-background/80 border-b border-border/30" style={{ paddingTop: insets.top }}>
      <View className="h-[48px] flex-row items-center px-4">
        {showBack && navigation.canGoBack() ? (
          <Pressable
            onPress={() => navigation.goBack()}
            className="w-[36px] h-[36px] items-center justify-center rounded-full active:bg-foreground/10"
            accessibilityRole="button"
            accessibilityLabel="返回"
          >
            <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
              <Path
                d="M15 18l-6-6 6-6"
                stroke="currentColor"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </Svg>
          </Pressable>
        ) : (
          <View className="w-[36px]" />
        )}
        <Text
          className="flex-1 text-center text-foreground text-base font-semibold"
          numberOfLines={1}
        >
          {title}
        </Text>
        <View className="w-[36px]" />
      </View>
    </View>
  );
};
