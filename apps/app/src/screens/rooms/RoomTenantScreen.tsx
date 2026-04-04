import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Button } from 'heroui-native/button';
import { Card } from 'heroui-native/card';
import { Input } from 'heroui-native/input';
import { Label } from 'heroui-native/label';
import { TextField } from 'heroui-native/text-field';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useMemo, useState } from 'react';
import { Alert, Platform, Pressable, Text, View } from 'react-native';
import { Plus, Trash2 } from 'lucide-react-native';
import { useRentalStore } from '../../store/rentalStore';
import type { RootStackParamList } from '../../navigation/types';
import type { Tenant } from '../../types/rental';
import { ScreenContainer } from '../../ui/ScreenContainer';
import { SectionTitle } from '../../ui/SectionTitle';
import { HeaderBar } from '../../ui/HeaderBar';

type Props = NativeStackScreenProps<RootStackParamList, 'RoomTenant'>;

const createTenantId = () =>
  `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;

const emptyTenant = (): Tenant => ({
  id: createTenantId(),
  name: '',
  phone: '',
  idCard: '',
});

export const RoomTenantScreen = ({ route, navigation }: Props) => {
  const { buildingId, floorId, roomId } = route.params;

  const buildings = useRentalStore((s) => s.buildings);
  const updateRoomTenants = useRentalStore((s) => s.updateRoomTenants);

  const context = useMemo(() => {
    const building = buildings.find((b) => b.id === buildingId);
    const floor = building?.floors.find((f) => f.id === floorId);
    const room = floor?.rooms.find((r) => r.id === roomId);
    return { building, floor, room };
  }, [buildings, buildingId, floorId, roomId]);

  const [tenants, setTenants] = useState<Tenant[]>(() => {
    const existing = context.room?.tenants;
    return existing?.length ? existing : [emptyTenant()];
  });

  const parseDate = (str?: string) => {
    if (!str) return undefined;
    const d = new Date(str);
    return Number.isNaN(d.getTime()) ? undefined : d;
  };

  const formatDate = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

  const [leaseStartDate, setLeaseStartDate] = useState(
    context.room?.leaseStartDate ?? '',
  );
  const [leaseEndDate, setLeaseEndDate] = useState(
    context.room?.leaseEndDate ?? '',
  );
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);

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

  const updateTenant = (id: string, key: keyof Omit<Tenant, 'id'>, val: string) => {
    setTenants((prev) =>
      prev.map((t) => (t.id === id ? { ...t, [key]: val } : t)),
    );
  };

  const addTenant = () => setTenants((prev) => [...prev, emptyTenant()]);

  const removeTenant = (id: string) => {
    if (tenants.length <= 1) return;
    setTenants((prev) => prev.filter((t) => t.id !== id));
  };

  const handleSave = () => {
    try {
      updateRoomTenants(buildingId, floorId, roomId, {
        tenants,
        leaseStartDate,
        leaseEndDate,
      });
      navigation.goBack();
    } catch (error) {
      Alert.alert('保存失败', error instanceof Error ? error.message : '请检查输入');
    }
  };

  const inputClass =
    'min-h-[48px] rounded-xl border-border bg-white dark:bg-surface border';

  return (
    <View className="flex-1 bg-background">
      <HeaderBar title="租户管理" />
      <ScreenContainer withBottomSpace>
        <Card className="border border-white/40 dark:border-white/10 bg-surface shadow-lg rounded-2xl">
          <Card.Body className="gap-2 p-5">
            <Card.Description className="text-muted">
              {context.building.name} / {context.floor.name} / {context.room.name}
            </Card.Description>
          </Card.Body>
        </Card>

        <Card className="border border-white/40 dark:border-white/10 bg-surface shadow-lg rounded-2xl">
          <Card.Body className="gap-4 p-5">
            <SectionTitle>租期</SectionTitle>
            <View className="gap-1">
              <Label>起始日期</Label>
              <Pressable
                onPress={() => setShowStartPicker(true)}
                className={`${inputClass} justify-center px-3`}
              >
                <Text className={leaseStartDate ? 'text-foreground' : 'text-muted'}>
                  {leaseStartDate || '请选择起始日期'}
                </Text>
              </Pressable>
              {showStartPicker && (
                <DateTimePicker
                  value={parseDate(leaseStartDate) ?? new Date()}
                  mode="date"
                  display={Platform.OS === 'ios' ? 'inline' : 'default'}
                  onChange={(_e, date) => {
                    setShowStartPicker(Platform.OS === 'ios');
                    if (date) setLeaseStartDate(formatDate(date));
                  }}
                />
              )}
            </View>
            <View className="gap-1">
              <Label>结束日期</Label>
              <Pressable
                onPress={() => setShowEndPicker(true)}
                className={`${inputClass} justify-center px-3`}
              >
                <Text className={leaseEndDate ? 'text-foreground' : 'text-muted'}>
                  {leaseEndDate || '请选择结束日期'}
                </Text>
              </Pressable>
              {showEndPicker && (
                <DateTimePicker
                  value={parseDate(leaseEndDate) ?? new Date()}
                  mode="date"
                  display={Platform.OS === 'ios' ? 'inline' : 'default'}
                  onChange={(_e, date) => {
                    setShowEndPicker(Platform.OS === 'ios');
                    if (date) setLeaseEndDate(formatDate(date));
                  }}
                />
              )}
            </View>
          </Card.Body>
        </Card>

        {tenants.map((tenant, index) => (
          <Card
            key={tenant.id}
            className="border border-white/40 dark:border-white/10 bg-surface shadow-lg rounded-2xl"
          >
            <Card.Body className="gap-4 p-5">
              <View className="flex-row items-center justify-between">
                <SectionTitle>{`租户 ${index + 1}`}</SectionTitle>
                {tenants.length > 1 && (
                  <Button
                    variant="danger-soft"
                    size="sm"
                    className="min-h-[36px] px-3 rounded-xl"
                    onPress={() => removeTenant(tenant.id)}
                  >
                    <Trash2 size={14} className="text-danger" />
                    <Button.Label className="text-danger text-sm">删除</Button.Label>
                  </Button>
                )}
              </View>
              <TextField isRequired>
                <Label>姓名</Label>
                <Input
                  value={tenant.name}
                  onChangeText={(t) => updateTenant(tenant.id, 'name', t)}
                  placeholder="租户姓名"
                  className={inputClass}
                />
              </TextField>
              <TextField>
                <Label>联系电话</Label>
                <Input
                  value={tenant.phone ?? ''}
                  onChangeText={(t) => updateTenant(tenant.id, 'phone', t)}
                  placeholder="可选"
                  keyboardType="phone-pad"
                  className={inputClass}
                />
              </TextField>
              <TextField>
                <Label>身份证号</Label>
                <Input
                  value={tenant.idCard ?? ''}
                  onChangeText={(t) => updateTenant(tenant.id, 'idCard', t)}
                  placeholder="可选"
                  className={inputClass}
                />
              </TextField>
            </Card.Body>
          </Card>
        ))}

        <Button
          variant="secondary"
          onPress={addTenant}
          className="min-h-[48px] rounded-2xl border-primary/30"
        >
          <Plus size={16} className="text-primary" />
          <Button.Label className="text-primary font-medium">添加租户</Button.Label>
        </Button>
      </ScreenContainer>
      <View className="absolute left-4 right-4 bottom-8">
        <Button
          variant="primary"
          onPress={handleSave}
          className="min-h-[56px] shadow-xl rounded-2xl"
        >
          <Button.Label className="font-bold text-lg">保存</Button.Label>
        </Button>
      </View>
    </View>
  );
};
