import type { ReactNode, RefObject } from 'react';
import { Platform, ScrollView, View, StyleSheet } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type Props = {
  children: ReactNode;
  withBottomSpace?: boolean;
  safeAreaTop?: boolean;
  scrollRef?: RefObject<ScrollView | null>;
};

export const ScreenContainer = ({
  children,
  withBottomSpace = false,
  safeAreaTop = false,
  scrollRef,
}: Props) => {
  const insets = useSafeAreaInsets();

  return (
    <View style={[StyleSheet.absoluteFill, safeAreaTop && { top: insets.top }]}>
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
