import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Button } from 'heroui-native/button';
import { Card } from 'heroui-native/card';
import { Input } from 'heroui-native/input';
import { Label } from 'heroui-native/label';
import { TextField } from 'heroui-native/text-field';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useMemo, useRef, useState } from 'react';
import { Platform, Pressable, ScrollView, Text, View } from 'react-native';
import { Dialog } from 'heroui-native';
import { Download, Share2 } from 'lucide-react-native';
import { useRentalStore } from '../../store/rentalStore';
import type { RootStackParamList } from '../../navigation/types';
import { AmountField } from '../../ui/AmountField';
import { ReceiptTemplate } from '../../ui/ReceiptTemplate';
import { shareReceipt, saveReceiptToAlbum } from '../../utils/receiptCapture';
import { ScreenContainer } from '../../ui/ScreenContainer';
import { SectionTitle } from '../../ui/SectionTitle';
import { HeaderBar } from '../../ui/HeaderBar';
import { MonthlyFeeHistory } from './MonthlyFeeHistory';

type Props = NativeStackScreenProps<RootStackParamList, 'RoomMonthlyFee'>;

const emptyFee = {
  rent: '',
  waterUsage: '',
  electricityUsage: '',
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

const getPreviousMonth = (month: string) => {
  const [yearRaw, monthRaw] = month.split('-');
  const year = Number.parseInt(yearRaw ?? '', 10);
  const value = Number.parseInt(monthRaw ?? '', 10);
  if (!Number.isFinite(year) || !Number.isFinite(value) || value < 1 || value > 12) {
    return '';
  }
  const date = new Date(year, value - 1, 1);
  date.setMonth(date.getMonth() - 1);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
};

export const RoomMonthlyFeeScreen = ({ route }: Props) => {
  const { buildingId, floorId, roomId } = route.params;
  const buildings = useRentalStore((state) => state.buildings);
  const upsertMonthlyFee = useRentalStore((state) => state.upsertMonthlyFee);
  const deleteMonthlyFee = useRentalStore((state) => state.deleteMonthlyFee);
  const now = new Date();
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const [month, setMonth] = useState(currentMonth);
  const [pickerDate, setPickerDate] = useState(now);
  const [showPicker, setShowPicker] = useState(false);
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

  const room = context.room;
  const waterPrice = room.waterPricePerTon ?? 0;
  const elecPrice = room.electricityPricePerKWh ?? 0;

  const defaultFee = useMemo(
    () => ({
      rent: room.rent != null ? String(room.rent) : '',
      waterUsage: '',
      electricityUsage: '',
      internet: room.internetFee != null ? String(room.internetFee) : '',
      other: '',
      note: '',
    }),
    [room.rent, room.internetFee],
  );

  const [values, setValues] = useState(defaultFee);

  const currentFee = room.monthlyFees.find((item) => item.month === month.trim());
  const previousMonth = getPreviousMonth(month.trim());
  const previousFee = room.monthlyFees.find((item) => item.month === previousMonth);

  const handleLoadMonth = () => {
    if (!currentFee) {
      setValues(defaultFee);
      return;
    }
    setValues({
      rent: String(currentFee.rent),
      waterUsage: currentFee.waterUsage != null ? String(currentFee.waterUsage) : '',
      electricityUsage:
        currentFee.electricityUsage != null ? String(currentFee.electricityUsage) : '',
      internet: String(currentFee.internet),
      other: String(currentFee.other),
      note: currentFee.note ?? '',
    });
  };

  const waterReading = asAmount(values.waterUsage);
  const elecReading = asAmount(values.electricityUsage);
  const previousWaterReading = previousFee?.waterUsage ?? 0;
  const previousElecReading = previousFee?.electricityUsage ?? 0;
  const waterDiff = waterReading - previousWaterReading;
  const elecDiff = elecReading - previousElecReading;
  const waterChargeUsage = waterDiff > 0 ? waterDiff : 0;
  const elecChargeUsage = elecDiff > 0 ? elecDiff : 0;
  const waterTotal = waterChargeUsage * waterPrice;
  const elecTotal = elecChargeUsage * elecPrice;

  const [showOverwriteDialog, setShowOverwriteDialog] = useState(false);
  const [showReceiptDialog, setShowReceiptDialog] = useState(false);
  const [savedFeeData, setSavedFeeData] = useState<{
    month: string;
    rent: number;
    water: number;
    waterUsage?: number;
    electricity: number;
    electricityUsage?: number;
    internet: number;
    other: number;
    note?: string;
  } | null>(null);
  const receiptRef = useRef<View>(null);

  const doSave = () => {
    const feeData = {
      month: month.trim(),
      rent: asAmount(values.rent),
      water: waterTotal,
      waterUsage: asAmount(values.waterUsage) || undefined,
      electricity: elecTotal,
      electricityUsage: asAmount(values.electricityUsage) || undefined,
      internet: asAmount(values.internet),
      other: asAmount(values.other),
      note: values.note.trim() || undefined,
    };
    upsertMonthlyFee(buildingId, floorId, roomId, feeData);
    setSavedFeeData(feeData);
    setShowReceiptDialog(true);
  };

  const handleSave = () => {
    if (currentFee) {
      setShowOverwriteDialog(true);
      return;
    }
    doSave();
  };

  const total =
    asAmount(values.rent) +
    waterTotal +
    elecTotal +
    asAmount(values.internet) +
    asAmount(values.other);

  return (
    <View className="flex-1 bg-background">
      <HeaderBar title="费用中心" />
      <ScreenContainer withBottomSpace>
        <Card className="border border-white/40 dark:border-white/10 bg-surface shadow-lg rounded-2xl mb-4">
          <Card.Body className="gap-2 p-5">
            <Card.Title className="text-xl font-bold">{context.room.name}</Card.Title>
            <Card.Description className="text-muted">
              {context.building.name} / {context.floor.name}
            </Card.Description>
          </Card.Body>
        </Card>

        <Card className="border border-white/40 dark:border-white/10 bg-surface shadow-lg rounded-2xl mb-4">
          <Card.Body className="gap-4 p-5">
            <SectionTitle>月度费用录入</SectionTitle>
            <View className="gap-1">
              <Label>月份</Label>
              <Pressable
                onPress={() => setShowPicker(true)}
                className="min-h-[48px] rounded-xl border-border bg-white dark:bg-surface border justify-center px-3"
              >
                <Text className={month ? 'text-foreground' : 'text-muted'}>
                  {month || '请选择月份'}
                </Text>
              </Pressable>
              {showPicker && (
                <DateTimePicker
                  value={pickerDate}
                  mode="date"
                  display={Platform.OS === 'ios' ? 'inline' : 'default'}
                  onChange={(_e, date) => {
                    setShowPicker(Platform.OS === 'ios');
                    if (date) {
                      setPickerDate(date);
                      const m = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
                      setMonth(m);
                      const fee = room.monthlyFees.find((item) => item.month === m);
                      if (fee) {
                        setValues({
                          rent: String(fee.rent),
                          waterUsage: fee.waterUsage != null ? String(fee.waterUsage) : '',
                          electricityUsage:
                            fee.electricityUsage != null ? String(fee.electricityUsage) : '',
                          internet: String(fee.internet),
                          other: String(fee.other),
                          note: fee.note ?? '',
                        });
                      } else {
                        setValues(defaultFee);
                      }
                    }
                  }}
                />
              )}
            </View>

            <AmountField
              label="租金"
              value={values.rent}
              onChangeText={(text) => setValues((prev) => ({ ...prev, rent: text }))}
            />
            <View className="gap-1">
              <AmountField
                label={`本月水表总读数（吨） 单价: ${waterPrice} 元/吨`}
                value={values.waterUsage}
                onChangeText={(text) => setValues((prev) => ({ ...prev, waterUsage: text }))}
              />
              <Text className="text-xs text-muted px-1">
                上月 {previousWaterReading}，差值 {waterDiff.toFixed(2)}， 计费用量{' '}
                {waterChargeUsage.toFixed(2)} × {waterPrice} = {waterTotal.toFixed(2)} 元
              </Text>
            </View>
            <View className="gap-1">
              <AmountField
                label={`本月电表总读数（度） 单价: ${elecPrice} 元/度`}
                value={values.electricityUsage}
                onChangeText={(text) => setValues((prev) => ({ ...prev, electricityUsage: text }))}
              />
              <Text className="text-xs text-muted px-1">
                上月 {previousElecReading}，差值 {elecDiff.toFixed(2)}， 计费用量{' '}
                {elecChargeUsage.toFixed(2)} × {elecPrice} = {elecTotal.toFixed(2)} 元
              </Text>
            </View>
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
                className="min-h-[48px] rounded-xl border-border bg-white dark:bg-surface border"
              />
            </TextField>

            <View className="flex-row items-center justify-between rounded-xl bg-accent/10 px-5 py-4 mt-2 border border-accent/20">
              <Text className="text-sm font-medium text-accent">本月预计总额</Text>
              <Text className="text-xl font-bold text-accent">
                {Number.isNaN(total) ? '-' : total.toFixed(2)}
              </Text>
            </View>
          </Card.Body>
        </Card>

        <MonthlyFeeHistory
          monthlyFees={room.monthlyFees}
          buildingName={context.building.name}
          floorName={context.floor.name}
          roomName={room.name}
          onDelete={(m) => deleteMonthlyFee(buildingId, floorId, roomId, m)}
          onEdit={(fee) => upsertMonthlyFee(buildingId, floorId, roomId, fee)}
        />
      </ScreenContainer>
      <View className="absolute left-4 right-4 bottom-8">
        <Button
          variant="primary"
          onPress={handleSave}
          className="min-h-[56px] shadow-xl rounded-2xl"
          accessibilityRole="button"
          accessibilityLabel="保存本月费用"
        >
          <Button.Label className="font-bold text-lg">保存本月费用</Button.Label>
        </Button>
      </View>
      <Dialog isOpen={showOverwriteDialog} onOpenChange={setShowOverwriteDialog}>
        <Dialog.Portal>
          <Dialog.Overlay />
          <Dialog.Content>
            <View className="mb-5 gap-1.5">
              <Dialog.Title>账单已存在</Dialog.Title>
              <Dialog.Description>{month} 的账单已存在，是否覆盖旧数据？</Dialog.Description>
            </View>
            <View className="flex-row justify-end gap-3">
              <Button variant="ghost" size="sm" onPress={() => setShowOverwriteDialog(false)}>
                <Button.Label>取消</Button.Label>
              </Button>
              <Button
                variant="danger"
                size="sm"
                onPress={() => {
                  doSave();
                  setShowOverwriteDialog(false);
                }}
              >
                <Button.Label>确认覆盖</Button.Label>
              </Button>
            </View>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog>

      <Dialog isOpen={showReceiptDialog} onOpenChange={setShowReceiptDialog}>
        <Dialog.Portal>
          <Dialog.Overlay />
          <Dialog.Content isSwipeable={false}>
            <View className="mb-4 gap-1.5">
              <Dialog.Title>账单已保存</Dialog.Title>
              <Dialog.Description>是否生成收费单据？</Dialog.Description>
            </View>
            <ScrollView style={{ maxHeight: 420 }}>
              {savedFeeData && (
                <ReceiptTemplate
                  ref={receiptRef}
                  buildingName={context.building!.name}
                  floorName={context.floor!.name}
                  roomName={room.name}
                  fee={{ id: '', ...savedFeeData }}
                />
              )}
            </ScrollView>
            <View className="flex-row justify-end gap-3 mt-4">
              <Button variant="ghost" size="sm" onPress={() => setShowReceiptDialog(false)}>
                <Button.Label>关闭</Button.Label>
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onPress={() => saveReceiptToAlbum(receiptRef)}
              >
                <Download size={16} className="text-foreground" />
                <Button.Label>保存相册</Button.Label>
              </Button>
              <Button
                variant="primary"
                size="sm"
                onPress={() => shareReceipt(receiptRef)}
              >
                <Share2 size={16} className="text-white" />
                <Button.Label>分享</Button.Label>
              </Button>
            </View>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog>
    </View>
  );
};
