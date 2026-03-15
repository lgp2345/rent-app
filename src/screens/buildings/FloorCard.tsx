import { useCallback, useState } from 'react';
import { Alert, Text, View } from 'react-native';
import { Accordion, BottomSheet } from 'heroui-native';
import { Button } from 'heroui-native/button';
import { Card } from 'heroui-native/card';
import { Input } from 'heroui-native/input';
import { Label } from 'heroui-native/label';
import { TextField } from 'heroui-native/text-field';
import { Plus } from 'lucide-react-native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useRentalStore } from '../../store/rentalStore';
import type { Floor } from '../../types/rental';
import type { RootStackParamList } from '../../navigation/types';
import { SectionTitle } from '../../ui/SectionTitle';

type Props = {
  buildingId: string;
  floor: Floor;
  navigation: NativeStackNavigationProp<RootStackParamList, 'BuildingDetail'>;
};

const RoomItem = ({
  buildingId,
  floorId,
  room,
  navigation,
}: {
  buildingId: string;
  floorId: string;
  room: Floor['rooms'][number];
  navigation: Props['navigation'];
}) => {
  const deleteRoom = useRentalStore((state) => state.deleteRoom);

  return (
    <View className="rounded-xl border border-white/50 dark:border-white/10 bg-white/40 dark:bg-black/20 p-4 gap-3">
      <View className="flex-row items-center justify-between">
        <Text className="text-foreground font-bold text-base">{room.name}</Text>
        <View className="bg-primary/10 px-2 py-1 rounded-full">
          <Text className="text-xs text-primary font-medium">{room.monthlyFees.length} 账单</Text>
        </View>
      </View>
      <View className="flex-row gap-3 mt-1">
        <Button
          variant="secondary"
          size="sm"
          className="flex-1 min-h-[44px] rounded-xl border-primary/30"
          onPress={() =>
            navigation.navigate('RoomMonthlyFee', {
              buildingId,
              floorId,
              roomId: room.id,
            })
          }
          accessibilityRole="button"
          accessibilityLabel={`打开${room.name}费用明细`}
        >
          <Button.Label className="text-primary font-medium text-sm">费用明细</Button.Label>
        </Button>
        <Button
          variant="danger-soft"
          size="sm"
          className="min-h-[44px] px-5 rounded-xl bg-danger/10"
          onPress={() => deleteRoom(buildingId, floorId, room.id)}
          accessibilityRole="button"
          accessibilityLabel={`删除${room.name}`}
        >
          <Button.Label className="text-danger font-medium text-sm">删除</Button.Label>
        </Button>
      </View>
    </View>
  );
};

export const FloorCard = ({ buildingId, floor, navigation }: Props) => {
  const deleteFloor = useRentalStore((state) => state.deleteFloor);
  const addRoom = useRentalStore((state) => state.addRoom);
  const [roomName, setRoomName] = useState('');
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  const handleAddRoom = useCallback(() => {
    try {
      addRoom(buildingId, floor.id, { name: roomName });
      setRoomName('');
      setIsSheetOpen(false);
    } catch (error) {
      Alert.alert('新增房间失败', error instanceof Error ? error.message : '请检查输入');
    }
  }, [addRoom, buildingId, floor.id, roomName]);

  return (
    <>
      <Card className="border border-white/40 dark:border-white/10 bg-surface shadow-lg rounded-2xl mb-4">
        <Card.Header className="flex-row items-center justify-between p-5 pb-2">
          <Card.Title className="text-lg font-bold">{floor.name}</Card.Title>
          <View className="flex-row gap-2">
            <Button
              variant="secondary"
              size="sm"
              className="min-h-[40px] px-4 rounded-xl border-primary/30"
              onPress={() => setIsSheetOpen(true)}
              accessibilityRole="button"
              accessibilityLabel={`在${floor.name}新增房间`}
            >
              <Plus size={14} className="text-primary" />
              <Button.Label className="text-primary font-medium text-sm">新增房间</Button.Label>
            </Button>
            <Button
              variant="danger-soft"
              size="sm"
              className="min-h-[40px] px-4 rounded-xl bg-danger/10"
              onPress={() => deleteFloor(buildingId, floor.id)}
              accessibilityRole="button"
              accessibilityLabel={`删除${floor.name}`}
            >
              <Button.Label className="text-danger font-medium text-sm">删除</Button.Label>
            </Button>
          </View>
        </Card.Header>
        <Card.Body className="px-5 pb-3">
          {floor.rooms.length === 0 ? (
            <Card.Description className="py-2">暂无房间</Card.Description>
          ) : (
            <Accordion selectionMode="single" hideSeparator defaultValue="rooms">
              <Accordion.Item value="rooms">
                <Accordion.Trigger className="py-2">
                  <Text className="text-foreground font-medium text-sm flex-1">
                    {floor.rooms.length} 个房间
                  </Text>
                  <Accordion.Indicator />
                </Accordion.Trigger>
                <Accordion.Content>
                  <Accordion
                    selectionMode="multiple"
                    hideSeparator
                    defaultValue={floor.rooms.map((r) => r.id)}
                  >
                    {floor.rooms.map((room) => (
                      <Accordion.Item key={room.id} value={room.id}>
                        <Accordion.Trigger className="py-2">
                          <View className="flex-row items-center flex-1 gap-2">
                            <Text className="text-foreground font-bold text-base">
                              {room.name}
                            </Text>
                            <View className="bg-primary/10 px-2 py-0.5 rounded-full">
                              <Text className="text-xs text-primary font-medium">
                                {room.monthlyFees.length} 账单
                              </Text>
                            </View>
                          </View>
                          <Accordion.Indicator />
                        </Accordion.Trigger>
                        <Accordion.Content>
                          <View className="flex-row gap-3 pb-2">
                            <Button
                              variant="secondary"
                              size="sm"
                              className="flex-1 min-h-[44px] rounded-xl border-primary/30"
                              onPress={() =>
                                navigation.navigate('RoomMonthlyFee', {
                                  buildingId,
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
                              onPress={() =>
                                useRentalStore
                                  .getState()
                                  .deleteRoom(buildingId, floor.id, room.id)
                              }
                              accessibilityRole="button"
                              accessibilityLabel={`删除${room.name}`}
                            >
                              <Button.Label className="text-danger font-medium text-sm">
                                删除
                              </Button.Label>
                            </Button>
                          </View>
                        </Accordion.Content>
                      </Accordion.Item>
                    ))}
                  </Accordion>
                </Accordion.Content>
              </Accordion.Item>
            </Accordion>
          )}
        </Card.Body>
      </Card>

      <BottomSheet isOpen={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <BottomSheet.Portal>
          <BottomSheet.Overlay />
          <BottomSheet.Content
            keyboardBehavior="interactive"
            keyboardBlurBehavior="restore"
            backgroundClassName="bg-background rounded-t-4xl"
          >
            <View className="gap-4">
              <SectionTitle>{`${floor.name} - 新增房间`}</SectionTitle>
              <TextField isRequired>
                <Label>房间名称</Label>
                <Input
                  value={roomName}
                  onChangeText={setRoomName}
                  placeholder="例如：201"
                  className="min-h-[48px] rounded-xl border-border bg-white dark:bg-surface border"
                />
              </TextField>
              <View className="flex-row gap-3 pt-2">
                <Button
                  variant="secondary"
                  className="flex-1 min-h-[48px] rounded-xl"
                  onPress={() => setIsSheetOpen(false)}
                >
                  <Button.Label>取消</Button.Label>
                </Button>
                <Button className="flex-1 min-h-[48px] rounded-xl" onPress={handleAddRoom}>
                  <Button.Label>保存</Button.Label>
                </Button>
              </View>
            </View>
          </BottomSheet.Content>
        </BottomSheet.Portal>
      </BottomSheet>
    </>
  );
};
