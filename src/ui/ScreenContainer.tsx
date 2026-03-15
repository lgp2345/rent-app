import type { ReactNode, RefObject } from 'react';
import { Platform, ScrollView, View, StyleSheet } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';

type Props = {
  children: ReactNode;
  withBottomSpace?: boolean;
  scrollRef?: RefObject<ScrollView | null>;
};

export const ScreenContainer = ({ children, withBottomSpace = false, scrollRef }: Props) => {
  return (
    <View style={StyleSheet.absoluteFill}>
      {/* Background blobs for Glassmorphism effect */}
      <View className="absolute -top-32 -left-20 w-72 h-72 rounded-full bg-primary/20" />
      <View className="absolute top-1/4 -right-32 w-96 h-96 rounded-full bg-accent/20" />
      {/* <View className="absolute bottom-0 left-0 w-full h-1/3 bg-background" /> */}

      <KeyboardAwareScrollView
        enableOnAndroid
        extraHeight={Platform.OS === 'ios' ? 24 : 160}
        extraScrollHeight={Platform.OS === 'ios' ? 24 : 120}
        keyboardOpeningTime={0}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        innerRef={(ref) => {
          if (scrollRef) {
            scrollRef.current = ref as ScrollView | null;
          }
        }}
        style={{ flex: 1 }}
        contentContainerStyle={{ flexGrow: 1 }}
      >
        <View
          className="flex-1 px-4 pt-4 gap-4"
          style={{ paddingBottom: withBottomSpace ? 128 : 24 }}
        >
          {children}
        </View>
      </KeyboardAwareScrollView>
    </View>
  );
};
