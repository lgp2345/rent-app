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
import { AmountField } from '../../ui/AmountField';
import { ScreenContainer } from '../../ui/ScreenContainer';
import { SectionTitle } from '../../ui/SectionTitle';

type Props = NativeStackScreenProps<RootStackParamList, 'RoomMonthlyFee'>;

const emptyFee = {
  rent: '',
  water: '',
  electricity: '',
  internet: '',
  other: '',
  note: '',
};

const asAmount = (value: string) => {
  if (!value.trim()) {
    return 0;
  }
  return Number.parseFloat(value);
};

export const RoomMonthlyFeeScreen = ({ route }: Props) => {
  const { buildingId, floorId, roomId } = route.params;
  const buildings = useRentalStore((state) => state.buildings);
  const upsertMonthlyFee = useRentalStore((state) => state.upsertMonthlyFee);
  const deleteMonthlyFee = useRentalStore((state) => state.deleteMonthlyFee);
  const [month, setMonth] = useState('');
  const [values, setValues] = useState(emptyFee);

  const context = useMemo(() => {
    const building = buildings.find((item) => item.id === buildingId);
    const floor = building?.floors.find((item) => item.id === floorId);
    const room = floor?.rooms.find((item) => item.id === roomId);
    return { building, floor, room };
  }, [buildings, buildingId, floorId, roomId]);

  if (!context.building || !context.floor || !context.room) {
    return (
      <View className="flex-1 bg-background p-4">
        <Card variant="secondary">
          <Card.Body>
            <Card.Description>房间不存在或已被删除。</Card.Description>
          </Card.Body>
        </Card>
      </View>
    );
  }

  const currentFee = context.room.monthlyFees.find((item) => item.month === month.trim());

  const handleLoadMonth = () => {
    if (!currentFee) {
      setValues(emptyFee);
      return;
    }
    setValues({
      rent: String(currentFee.rent),
      water: String(currentFee.water),
      electricity: String(currentFee.electricity),
      internet: String(currentFee.internet),
      other: String(currentFee.other),
      note: currentFee.note ?? '',
    });
  };

  const handleSave = () => {
    try {
      upsertMonthlyFee(buildingId, floorId, roomId, {
        month: month.trim(),
        rent: asAmount(values.rent),
        water: asAmount(values.water),
        electricity: asAmount(values.electricity),
        internet: asAmount(values.internet),
        other: asAmount(values.other),
        note: values.note.trim() || undefined,
      });
      Alert.alert('已保存', '本月费用已更新');
    } catch (error) {
      Alert.alert('保存失败', error instanceof Error ? error.message : '请检查输入');
    }
  };

  const total =
    asAmount(values.rent) +
    asAmount(values.water) +
    asAmount(values.electricity) +
    asAmount(values.internet) +
    asAmount(values.other);

  return (
    <View className="flex-1 bg-background">
      <ScreenContainer withBottomSpace>
        <Text className={typography.pageTitle + ' text-foreground'}>费用中心</Text>

        <Card className="border border-border bg-surface">
          <Card.Body className="gap-2">
            <Card.Title>{context.room.name}</Card.Title>
            <Card.Description>
              {context.building.name} / {context.floor.name}
            </Card.Description>
          </Card.Body>
        </Card>

        <Card className="border border-border bg-surface">
          <Card.Body className="gap-2">
            <SectionTitle>月度费用录入</SectionTitle>
            <TextField isRequired>
              <Label>月份（YYYY-MM）</Label>
              <Input
                value={month}
                onChangeText={setMonth}
                placeholder="例如：2026-02"
                className="min-h-[44px]"
              />
            </TextField>
            <Button
              variant="secondary"
              className="min-h-[44px]"
              onPress={handleLoadMonth}
              accessibilityRole="button"
              accessibilityLabel="加载当前月份费用"
            >
              <Button.Label>加载该月已存在费用</Button.Label>
            </Button>

            <AmountField
              label="租金"
              value={values.rent}
              onChangeText={(text) => setValues((prev) => ({ ...prev, rent: text }))}
            />
            <AmountField
              label="水费"
              value={values.water}
              onChangeText={(text) => setValues((prev) => ({ ...prev, water: text }))}
            />
            <AmountField
              label="电费"
              value={values.electricity}
              onChangeText={(text) => setValues((prev) => ({ ...prev, electricity: text }))}
            />
            <AmountField
              label="网费"
              value={values.internet}
              onChangeText={(text) => setValues((prev) => ({ ...prev, internet: text }))}
            />
            <AmountField
              label="其他费用"
              value={values.other}
              onChangeText={(text) => setValues((prev) => ({ ...prev, other: text }))}
            />
            <TextField>
              <Label>备注</Label>
              <Input
                value={values.note}
                onChangeText={(text) => setValues((prev) => ({ ...prev, note: text }))}
                placeholder="可选"
                className="min-h-[44px]"
              />
            </TextField>

            <View className="rounded-xl bg-accent-soft px-3 py-2">
              <Text className={typography.caption + ' text-accent-soft-foreground'}>本月预计总额</Text>
              <Text className={typography.amount + ' text-accent-soft-foreground'}>
                {Number.isNaN(total) ? '-' : total.toFixed(2)}
              </Text>
            </View>
          </Card.Body>
        </Card>

        <Card className="border border-border bg-surface">
          <Card.Body className="gap-2">
            <SectionTitle>历史月份</SectionTitle>
            {context.room.monthlyFees.length === 0 ? (
              <Card.Description>暂无历史账单</Card.Description>
            ) : (
              context.room.monthlyFees.map((fee) => (
                <View
                  key={fee.id}
                  className="rounded-xl border border-border-secondary bg-surface-secondary p-3 gap-2"
                >
                  <Text className="font-semibold text-foreground">{fee.month}</Text>
                  <Text className="text-sm text-muted">
                    合计：
                    {(
                      fee.rent +
                      fee.water +
                      fee.electricity +
                      fee.internet +
                      fee.other
                    ).toFixed(2)}
                  </Text>
                  <View className="flex-row gap-2">
                    <Button
                      size="sm"
                      variant="secondary"
                      className="min-h-[44px]"
                      onPress={() => {
                        setMonth(fee.month);
                        setValues({
                          rent: String(fee.rent),
                          water: String(fee.water),
                          electricity: String(fee.electricity),
                          internet: String(fee.internet),
                          other: String(fee.other),
                          note: fee.note ?? '',
                        });
                      }}
                      accessibilityRole="button"
                      accessibilityLabel={`将${fee.month}费用填充到表单`}
                    >
                      <Button.Label>填充到表单</Button.Label>
                    </Button>
                    <Button
                      size="sm"
                      variant="danger-soft"
                      className="min-h-[44px]"
                      onPress={() =>
                        deleteMonthlyFee(buildingId, floorId, roomId, fee.month)
                      }
                      accessibilityRole="button"
                      accessibilityLabel={`删除${fee.month}费用`}
                    >
                      <Button.Label>删除</Button.Label>
                    </Button>
                  </View>
                </View>
              ))
            )}
          </Card.Body>
        </Card>
      </ScreenContainer>
      <View className="absolute left-4 right-4 bottom-6">
        <Button
          variant="primary"
          onPress={handleSave}
          className="min-h-[48px] shadow-lg"
          accessibilityRole="button"
          accessibilityLabel="保存本月费用"
        >
          <Button.Label>保存本月费用</Button.Label>
        </Button>
      </View>
    </View>
  );
};
