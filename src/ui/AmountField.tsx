import { Input } from 'heroui-native/input';
import { Label } from 'heroui-native/label';
import { TextField } from 'heroui-native/text-field';

type Props = {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
};

export const AmountField = ({ label, value, onChangeText }: Props) => {
  return (
    <TextField>
      <Label className="mb-1">{label}</Label>
      <Input
        value={value}
        onChangeText={onChangeText}
        keyboardType="decimal-pad"
        placeholder="0"
        className="text-right min-h-[44px]"
      />
    </TextField>
  );
};
