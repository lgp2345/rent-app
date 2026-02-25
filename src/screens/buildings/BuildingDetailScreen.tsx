import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Button } from 'heroui-native/button';
import { Card } from 'heroui-native/card';
import { Input } from 'heroui-native/input';
import { Label } from 'heroui-native/label';
import { TextField } from 'heroui-native/text-field';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Alert, ScrollView, Text, View } from 'react-native';
import { useRentalStore } from '../../store/rentalStore';
import type { RootStackParamList } from '../../navigation/types';
import { ScreenContainer } from '../../ui/ScreenContainer';
import { SectionTitle } from '../../ui/SectionTitle';
import { typography } from '../../theme/tokens';

type Props = NativeStackScreenProps<RootStackParamList, 'BuildingDetail'>;

export const BuildingDetailScreen = ({ route, navigation }: Props) => {
  const { buildingId } = route.params;
  const buildings = useRentalStore((state) => state.buildings);
  const updateBuilding = useRentalStore((state) => state.updateBuilding);
  const addFloor = useRentalStore((state) => state.addFloor);
  const deleteFloor = useRentalStore((state) => state.deleteFloor);
  const addRoom = useRentalStore((state) => state.addRoom);
  const deleteRoom = useRentalStore((state) => state.deleteRoom);

  const building = useMemo(
    () => buildings.find((item) => item.id === buildingId),
    [buildings, buildingId],
  );

  const [name, setName] = useState(building?.name ?? '');
  const [address, setAddress] = useState(building?.address ?? '');
  const [floorName, setFloorName] = useState('');
  const [floorLevel, setFloorLevel] = useState('');
  const [roomInputs, setRoomInputs] = useState<Record<string, string>>({});
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    if (building) {
      setName(building.name);
      setAddress(building.address);
      navigation.setOptions({ title: building.name });
    }
  }, [building, navigation]);

  if (!building) {
    return (
      <View className="flex-1 bg-background p-4">
        <Card variant="secondary">
          <Card.Body>
            <Card.Description>房屋不存在或已被删除。</Card.Description>
          </Card.Body>
        </Card>
      </View>
    );
  }

  const handleSaveBuilding = () => {
    try {
      updateBuilding(building.id, { name, address });
    } catch (error) {
      Alert.alert('保存失败', error instanceof Error ? error.message : '请检查输入');
    }
  };

  const handleAddFloor = () => {
    try {
      addFloor(building.id, {
        name: floorName,
        level: Number.parseInt(floorLevel, 10),
      });
      setFloorName('');
      setFloorLevel('');
    } catch (error) {
      Alert.alert('新增楼层失败', error instanceof Error ? error.message : '请检查输入');
    }
  };

  const handleAddRoom = (floorId: string) => {
    try {
      addRoom(building.id, floorId, { name: roomInputs[floorId] ?? '' });
      setRoomInputs((prev) => ({ ...prev, [floorId]: '' }));
    } catch (error) {
      Alert.alert('新增房间失败', error instanceof Error ? error.message : '请检查输入');
    }
  };

  return (
    <ScreenContainer scrollRef={scrollRef}>
      <Text className={typography.pageTitle + ' text-foreground'}>{building.name}</Text>

      <Card className="border border-border bg-surface">
        <Card.Body className="gap-2">
          <SectionTitle>房屋信息</SectionTitle>
          <Text className="text-xs text-muted">先维护房屋基础信息，再继续配置楼层和房间</Text>
          <TextField isRequired>
            <Label>房屋名称</Label>
            <Input value={name} onChangeText={setName} className="min-h-[44px]" />
          </TextField>
          <TextField isRequired>
            <Label>地址</Label>
            <Input value={address} onChangeText={setAddress} className="min-h-[44px]" />
          </TextField>
          <Button
            variant="primary"
            onPress={handleSaveBuilding}
            className="min-h-[44px]"
            accessibilityRole="button"
            accessibilityLabel="保存房屋信息"
          >
            <Button.Label>保存房屋信息</Button.Label>
          </Button>
        </Card.Body>
      </Card>

      <Card className="border border-border bg-surface">
        <Card.Body className="gap-2">
          <SectionTitle>新增楼层</SectionTitle>
          <TextField isRequired>
            <Label>楼层名称</Label>
            <Input
              value={floorName}
              onChangeText={setFloorName}
              placeholder="例如：2层"
              className="min-h-[44px]"
            />
          </TextField>
          <TextField isRequired>
            <Label>楼层编号</Label>
            <Input
              value={floorLevel}
              onChangeText={setFloorLevel}
              keyboardType="number-pad"
              placeholder="例如：2"
              className="min-h-[44px]"
            />
          </TextField>
          <Button
            variant="primary"
            onPress={handleAddFloor}
            className="min-h-[44px]"
            accessibilityRole="button"
            accessibilityLabel="保存楼层"
          >
            <Button.Label>保存楼层</Button.Label>
          </Button>
        </Card.Body>
      </Card>

      {building.floors.length === 0 ? (
        <Card variant="secondary" className="border border-border">
          <Card.Body>
            <Card.Description className={typography.body}>还没有楼层，请先新增。</Card.Description>
          </Card.Body>
        </Card>
      ) : null}

      {building.floors.map((floor) => (
        <Card key={floor.id} className="border border-border bg-surface">
          <Card.Header className="flex-row items-center justify-between">
            <Card.Title>
              {floor.name}（第 {floor.level} 层）
            </Card.Title>
            <Button
              variant="danger-soft"
              size="sm"
              className="min-h-[44px]"
              onPress={() => deleteFloor(building.id, floor.id)}
              accessibilityRole="button"
              accessibilityLabel={`删除${floor.name}`}
            >
              <Button.Label>删除楼层</Button.Label>
            </Button>
          </Card.Header>
          <Card.Body className="gap-2">
            {floor.rooms.length === 0 ? (
              <Card.Description>暂无房间</Card.Description>
            ) : (
              floor.rooms.map((room) => (
                <View
                  key={room.id}
                  className="rounded-xl border border-border-secondary bg-surface-secondary p-3 gap-2"
                >
                  <Text className="text-foreground font-semibold">{room.name}</Text>
                  <Text className="text-sm text-muted">
                    月账单数：{room.monthlyFees.length}
                  </Text>
                  <View className="flex-row gap-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      className="min-h-[44px]"
                      onPress={() =>
                        navigation.navigate('RoomMonthlyFee', {
                          buildingId: building.id,
                          floorId: floor.id,
                          roomId: room.id,
                        })
                      }
                      accessibilityRole="button"
                      accessibilityLabel={`打开${room.name}费用明细`}
                    >
                      <Button.Label>费用明细</Button.Label>
                    </Button>
                    <Button
                      variant="danger-soft"
                      size="sm"
                      className="min-h-[44px]"
                      onPress={() => deleteRoom(building.id, floor.id, room.id)}
                      accessibilityRole="button"
                      accessibilityLabel={`删除${room.name}`}
                    >
                      <Button.Label>删除房间</Button.Label>
                    </Button>
                  </View>
                </View>
              ))
            )}
          </Card.Body>
          <Card.Footer className="gap-2">
            <TextField isRequired>
              <Label>新增房间</Label>
              <Input
                value={roomInputs[floor.id] ?? ''}
                onChangeText={(text) =>
                  setRoomInputs((prev) => ({ ...prev, [floor.id]: text }))
                }
                onFocus={() => {
                  setTimeout(() => {
                    scrollRef.current?.scrollToEnd({ animated: true });
                  }, 260);
                }}
                placeholder="例如：201"
                className="min-h-[44px]"
              />
            </TextField>
            <Button
              variant="primary"
              size="sm"
              className="min-h-[44px]"
              onPress={() => handleAddRoom(floor.id)}
              accessibilityRole="button"
              accessibilityLabel={`在${floor.name}保存房间`}
            >
              <Button.Label>保存房间</Button.Label>
            </Button>
          </Card.Footer>
        </Card>
      ))}
    </ScreenContainer>
  );
};
