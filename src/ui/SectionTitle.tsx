import { Text } from 'react-native';

type Props = {
  children: string;
};

export const SectionTitle = ({ children }: Props) => {
  return (
    <Text className="text-[16px] leading-6 font-semibold tracking-tight text-foreground">
      {children}
    </Text>
  );
};
