import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Button } from 'heroui-native/button';
import { Card } from 'heroui-native/card';
import { Input } from 'heroui-native/input';
import { Label } from 'heroui-native/label';
import { TextField } from 'heroui-native/text-field';
import { useMemo, useState } from 'react';
import { Alert, Text, View } from 'react-native';
import { useRentalStore } from '../../store/rentalStore';
import type { RootStackParamList } from '../../navigation/types';
import { typography } from '../../theme/tokens';
import { ScreenContainer } from '../../ui/ScreenContainer';
import { SectionTitle } from '../../ui/SectionTitle';
import { HeaderBar } from '../../ui/HeaderBar';

type Props = NativeStackScreenProps<RootStackParamList, 'RoomForm'>;

type FormValues = {
  name: string;
  rent: string;
  waterPricePerTon: string;
  electricityPricePerKWh: string;
  internetFee: string;
  note: string;
};

const emptyForm: FormValues = {
  name: '',
  rent: '',
  waterPricePerTon: '',
  electricityPricePerKWh: '',
  internetFee: '',
  note: '',
};

const toStoreInput = (v: FormValues) => ({
  name: v.name,
  rent: v.rent ? Number(v.rent) : undefined,
  waterPricePerTon: v.waterPricePerTon ? Number(v.waterPricePerTon) : undefined,
  electricityPricePerKWh: v.electricityPricePerKWh ? Number(v.electricityPricePerKWh) : undefined,
  internetFee: v.internetFee ? Number(v.internetFee) : undefined,
  note: v.note,
});

export const RoomFormScreen = ({ route, navigation }: Props) => {
  const { buildingId, floorId, roomId } = route.params;
  const isEdit = !!roomId;

  const buildings = useRentalStore((s) => s.buildings);
  const addRoom = useRentalStore((s) => s.addRoom);
  const updateRoom = useRentalStore((s) => s.updateRoom);

  const context = useMemo(() => {
    const building = buildings.find((b) => b.id === buildingId);
    const floor = building?.floors.find((f) => f.id === floorId);
    const room = roomId ? floor?.rooms.find((r) => r.id === roomId) : undefined;
    return { building, floor, room };
  }, [buildings, buildingId, floorId, roomId]);

  const initialValues = useMemo<FormValues>(() => {
    if (!context.room) return emptyForm;
    const r = context.room;
    return {
      name: r.name,
      rent: r.rent != null ? String(r.rent) : '',
      waterPricePerTon: r.waterPricePerTon != null ? String(r.waterPricePerTon) : '',
      electricityPricePerKWh:
        r.electricityPricePerKWh != null ? String(r.electricityPricePerKWh) : '',
      internetFee: r.internetFee != null ? String(r.internetFee) : '',
      note: r.note ?? '',
    };
  }, [context.room]);

  const [values, setValues] = useState<FormValues>(initialValues);
  const set = (key: keyof FormValues, val: string) =>
    setValues((prev) => ({ ...prev, [key]: val }));

  if (!context.building || !context.floor) {
    return (
      <View className="flex-1 bg-background p-4">
        <Card variant="secondary">
          <Card.Body>
            <Card.Description>楼层不存在或已被删除。</Card.Description>
          </Card.Body>
        </Card>
      </View>
    );
  }

  const handleSave = () => {
    try {
      if (isEdit && roomId) {
        updateRoom(buildingId, floorId, roomId, toStoreInput(values));
      } else {
        addRoom(buildingId, floorId, toStoreInput(values));
      }
      navigation.goBack();
    } catch (error) {
      Alert.alert('保存失败', error instanceof Error ? error.message : '请检查输入');
    }
  };

  const inputClass = 'min-h-[48px] rounded-xl border-border bg-white dark:bg-surface border';

  return (
    <View className="flex-1 bg-background">
      <HeaderBar title={isEdit ? '编辑房间' : '新增房间'} />
      <ScreenContainer withBottomSpace>
        <Card className="border border-white/40 dark:border-white/10 bg-surface shadow-lg rounded-2xl">
          <Card.Body className="gap-2 p-5">
            <Card.Description className="text-muted">
              {context.building.name} / {context.floor.name}
            </Card.Description>
          </Card.Body>
        </Card>

        <Card className="border border-white/40 dark:border-white/10 bg-surface shadow-lg rounded-2xl">
          <Card.Body className="gap-4 p-5">
            <SectionTitle>基本信息</SectionTitle>
            <TextField isRequired>
              <Label>房间名称</Label>
              <Input
                value={values.name}
                onChangeText={(t) => set('name', t)}
                placeholder="例如：201"
                className={inputClass}
              />
            </TextField>
            <TextField>
              <Label>备注</Label>
              <Input
                value={values.note}
                onChangeText={(t) => set('note', t)}
                placeholder="可选"
                className={inputClass}
              />
            </TextField>
          </Card.Body>
        </Card>

        <Card className="border border-white/40 dark:border-white/10 bg-surface shadow-lg rounded-2xl">
          <Card.Body className="gap-4 p-5">
            <SectionTitle>费用设置</SectionTitle>
            <TextField>
              <Label>租金（元/月）</Label>
              <Input
                value={values.rent}
                onChangeText={(t) => set('rent', t)}
                keyboardType="decimal-pad"
                placeholder="0"
                className={inputClass}
              />
            </TextField>
            <TextField>
              <Label>水费单价（元/吨）</Label>
              <Input
                value={values.waterPricePerTon}
                onChangeText={(t) => set('waterPricePerTon', t)}
                keyboardType="decimal-pad"
                placeholder="0"
                className={inputClass}
              />
            </TextField>
            <TextField>
              <Label>电费单价（元/度）</Label>
              <Input
                value={values.electricityPricePerKWh}
                onChangeText={(t) => set('electricityPricePerKWh', t)}
                keyboardType="decimal-pad"
                placeholder="0"
                className={inputClass}
              />
            </TextField>
            <TextField>
              <Label>网费（元/月）</Label>
              <Input
                value={values.internetFee}
                onChangeText={(t) => set('internetFee', t)}
                keyboardType="decimal-pad"
                placeholder="0"
                className={inputClass}
              />
            </TextField>
          </Card.Body>
        </Card>
      </ScreenContainer>
      <View className="absolute left-4 right-4 bottom-8">
        <Button
          variant="primary"
          onPress={handleSave}
          className="min-h-[56px] shadow-xl rounded-2xl"
        >
          <Button.Label className="font-bold text-lg">
            {isEdit ? '保存修改' : '新增房间'}
          </Button.Label>
        </Button>
      </View>
    </View>
  );
};
