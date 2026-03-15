import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { BottomSheet } from 'heroui-native';
import { Button } from 'heroui-native/button';
import { Card } from 'heroui-native/card';
import { Input } from 'heroui-native/input';
import { Label } from 'heroui-native/label';
import { TextField } from 'heroui-native/text-field';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Alert, ScrollView, Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
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
  const [roomInputs, setRoomInputs] = useState<Record<string, string>>({});
  const [isBuildingSheetOpen, setIsBuildingSheetOpen] = useState(false);
  const [isFloorSheetOpen, setIsFloorSheetOpen] = useState(false);
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
      setIsBuildingSheetOpen(false);
    } catch (error) {
      Alert.alert('保存失败', error instanceof Error ? error.message : '请检查输入');
    }
  };

  const handleAddFloor = () => {
    try {
      addFloor(building.id, { name: floorName });
      setFloorName('');
      setIsFloorSheetOpen(false);
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
    <View className="flex-1 bg-background">
      <ScreenContainer scrollRef={scrollRef} withBottomSpace>
        <View className="flex-row gap-3 mb-4">
          <Button
            variant="secondary"
            className="flex-1 min-h-[48px] rounded-xl border-primary/30"
            onPress={() => setIsBuildingSheetOpen(true)}
          >
            <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
              <Path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
              <Path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
            </Svg>
            <Button.Label className="text-primary font-medium">房屋信息</Button.Label>
          </Button>
          <Button
            variant="secondary"
            className="flex-1 min-h-[48px] rounded-xl border-primary/30"
            onPress={() => setIsFloorSheetOpen(true)}
          >
            <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
              <Path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth={2} strokeLinecap="round" />
            </Svg>
            <Button.Label className="text-primary font-medium">新增楼层</Button.Label>
          </Button>
        </View>

        {building.floors.length === 0 ? (
          <Card variant="secondary" className="border border-border">
            <Card.Body>
              <Card.Description className={typography.body}>还没有楼层，请先新增。</Card.Description>
            </Card.Body>
          </Card>
        ) : null}

        {building.floors.map((floor) => (
          <Card
            key={floor.id}
            className="border border-white/40 dark:border-white/10 bg-surface shadow-lg rounded-2xl mb-4"
          >
            <Card.Header className="flex-row items-center justify-between p-5 pb-2">
              <Card.Title className="text-lg font-bold">{floor.name}</Card.Title>
              <Button
                variant="danger-soft"
                size="sm"
                className="min-h-[40px] px-4 rounded-xl bg-danger/10"
                onPress={() => deleteFloor(building.id, floor.id)}
                accessibilityRole="button"
                accessibilityLabel={`删除${floor.name}`}
              >
                <Button.Label className="text-danger font-medium text-sm">删除楼层</Button.Label>
              </Button>
            </Card.Header>
            <Card.Body className="gap-3 px-5">
              {floor.rooms.length === 0 ? (
                <Card.Description className="py-2">暂无房间</Card.Description>
              ) : (
                floor.rooms.map((room) => (
                  <View
                    key={room.id}
                    className="rounded-xl border border-white/50 dark:border-white/10 bg-white/40 dark:bg-black/20 p-4 gap-3"
                  >
                    <View className="flex-row items-center justify-between">
                      <Text className="text-foreground font-bold text-base">{room.name}</Text>
                      <View className="bg-primary/10 px-2 py-1 rounded-full">
                        <Text className="text-xs text-primary font-medium">
                          {room.monthlyFees.length} 账单
                        </Text>
                      </View>
                    </View>
                    <View className="flex-row gap-3 mt-1">
                      <Button
                        variant="secondary"
                        size="sm"
                        className="flex-1 min-h-[44px] rounded-xl border-primary/30"
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
                        <Button.Label className="text-primary font-medium text-sm">
                          费用明细
                        </Button.Label>
                      </Button>
                      <Button
                        variant="danger-soft"
                        size="sm"
                        className="min-h-[44px] px-5 rounded-xl bg-danger/10"
                        onPress={() => deleteRoom(building.id, floor.id, room.id)}
                        accessibilityRole="button"
                        accessibilityLabel={`删除${room.name}`}
                      >
                        <Button.Label className="text-danger font-medium text-sm">删除</Button.Label>
                      </Button>
                    </View>
                  </View>
                ))
              )}
            </Card.Body>
            <Card.Footer className="gap-3 p-5 pt-3 border-t border-border/50">
              <TextField isRequired>
                <Label>新增房间</Label>
                <View className="flex-row gap-3">
                  <Input
                    value={roomInputs[floor.id] ?? ''}
                    onChangeText={(text) => setRoomInputs((prev) => ({ ...prev, [floor.id]: text }))}
                    onFocus={() => {
                      setTimeout(() => {
                        scrollRef.current?.scrollToEnd({ animated: true });
                      }, 260);
                    }}
                    placeholder="例如：201"
                    className="flex-1 min-h-[48px] rounded-xl border-border bg-white dark:bg-surface border"
                  />
                  <Button
                    variant="primary"
                    className="min-h-[48px] px-6 rounded-xl"
                    onPress={() => handleAddRoom(floor.id)}
                    accessibilityRole="button"
                    accessibilityLabel={`在${floor.name}保存房间`}
                  >
                    <Button.Label className="font-semibold">保存</Button.Label>
                  </Button>
                </View>
              </TextField>
            </Card.Footer>
          </Card>
        ))}
      </ScreenContainer>

      <BottomSheet isOpen={isBuildingSheetOpen} onOpenChange={setIsBuildingSheetOpen}>
        <BottomSheet.Portal>
          <BottomSheet.Overlay />
          <BottomSheet.Content keyboardBehavior="interactive" keyboardBlurBehavior="restore">
            <View className="gap-4">
              <SectionTitle>房屋信息</SectionTitle>
              <TextField isRequired>
                <Label>房屋名称</Label>
                <Input
                  value={name}
                  onChangeText={setName}
                  className="min-h-[48px] rounded-xl border-border bg-white dark:bg-surface border"
                />
              </TextField>
              <TextField>
                <Label>地址</Label>
                <Input
                  value={address}
                  onChangeText={setAddress}
                  className="min-h-[48px] rounded-xl border-border bg-white dark:bg-surface border"
                />
              </TextField>
              <View className="flex-row gap-3 pt-2">
                <Button
                  variant="secondary"
                  className="flex-1 min-h-[48px] rounded-xl"
                  onPress={() => setIsBuildingSheetOpen(false)}
                >
                  <Button.Label>取消</Button.Label>
                </Button>
                <Button
                  className="flex-1 min-h-[48px] rounded-xl"
                  onPress={handleSaveBuilding}
                >
                  <Button.Label>保存</Button.Label>
                </Button>
              </View>
            </View>
          </BottomSheet.Content>
        </BottomSheet.Portal>
      </BottomSheet>

      <BottomSheet isOpen={isFloorSheetOpen} onOpenChange={setIsFloorSheetOpen}>
        <BottomSheet.Portal>
          <BottomSheet.Overlay />
          <BottomSheet.Content keyboardBehavior="interactive" keyboardBlurBehavior="restore">
            <View className="gap-4">
              <SectionTitle>新增楼层</SectionTitle>
              <TextField isRequired>
                <Label>楼层名称</Label>
                <Input
                  value={floorName}
                  onChangeText={setFloorName}
                  placeholder="例如：2层"
                  className="min-h-[48px] rounded-xl border-border bg-white dark:bg-surface border"
                />
              </TextField>
              <View className="flex-row gap-3 pt-2">
                <Button
                  variant="secondary"
                  className="flex-1 min-h-[48px] rounded-xl"
                  onPress={() => setIsFloorSheetOpen(false)}
                >
                  <Button.Label>取消</Button.Label>
                </Button>
                <Button
                  className="flex-1 min-h-[48px] rounded-xl"
                  onPress={handleAddFloor}
                >
                  <Button.Label>保存</Button.Label>
                </Button>
              </View>
            </View>
          </BottomSheet.Content>
        </BottomSheet.Portal>
      </BottomSheet>
    </View>
  );
};
