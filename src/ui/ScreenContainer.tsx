import type { ReactNode, RefObject } from 'react';
import { Platform, ScrollView, View } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';

type Props = {
  children: ReactNode;
  withBottomSpace?: boolean;
  scrollRef?: RefObject<ScrollView | null>;
};

export const ScreenContainer = ({ children, withBottomSpace = false, scrollRef }: Props) => {
  return (
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
        className="flex-1 bg-background px-4 pt-4 gap-3"
        style={{ paddingBottom: withBottomSpace ? 128 : 24 }}
      >
        {children}
      </View>
    </KeyboardAwareScrollView>
  );
};
