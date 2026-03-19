import { useState } from 'react';
import { Text, View } from 'react-native';
import { Accordion, Dialog } from 'heroui-native';
import { Button } from 'heroui-native/button';
import { Card } from 'heroui-native/card';
import { Info, Plus, Receipt, Trash2 } from 'lucide-react-native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useRentalStore } from '../../store/rentalStore';
import type { Floor } from '../../types/rental';
import type { RootStackParamList } from '../../navigation/types';

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
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  return (
    <Card variant="tertiary" className="mb-3">
      <Card.Body>
        <View className=" ">
          <View className="flex-row items-center justify-between">
            <Text className="text-foreground font-bold text-base">{room.name}</Text>
            <View className="bg-primary/10 px-2 py-0.5 rounded-full">
              <Text className="text-xs text-primary font-medium">
                {room.monthlyFees.length} 账单
              </Text>
            </View>
          </View>
          <View className="flex-row gap-2">
            <Button
              variant="tertiary"
              size="sm"
              className="min-h-[40px] min-w-[40px] rounded-xl border-primary/30 px-3"
              onPress={() =>
                navigation.navigate('RoomForm', { buildingId, floorId, roomId: room.id })
              }
              accessibilityLabel={`${room.name}信息`}
            >
              <Info size={24} className="text-primary" />
            </Button>
            <Button
              variant="tertiary"
              size="sm"
              className="min-h-[40px] min-w-[40px] rounded-xl border-primary/30 px-3"
              onPress={() =>
                navigation.navigate('RoomMonthlyFee', {
                  buildingId,
                  floorId,
                  roomId: room.id,
                })
              }
              accessibilityLabel={`${room.name}费用明细`}
            >
              <Receipt size={24} className="text-primary" />
            </Button>
            <Dialog isOpen={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
              <Dialog.Trigger asChild>
                <Button
                  variant="tertiary"
                  size="sm"
                  className="min-h-[40px] min-w-[40px] rounded-xl px-3"
                  accessibilityLabel={`删除${room.name}`}
                >
                  <Trash2 size={24} className="text-danger" />
                </Button>
              </Dialog.Trigger>
              <Dialog.Portal>
                <Dialog.Overlay />
                <Dialog.Content>
                  <View className="mb-5 gap-1.5">
                    <Dialog.Title>确认删除</Dialog.Title>
                    <Dialog.Description>确定要删除 {room.name} 吗？此操作不可撤销。</Dialog.Description>
                  </View>
                  <View className="flex-row justify-end gap-3">
                    <Button variant="ghost" size="sm" onPress={() => setIsDeleteOpen(false)}>
                      <Button.Label>取消</Button.Label>
                    </Button>
                    <Button
                      variant="danger-soft"
                      size="sm"
                      onPress={() => {
                        deleteRoom(buildingId, floorId, room.id);
                        setIsDeleteOpen(false);
                      }}
                    >
                      <Button.Label>确认删除</Button.Label>
                    </Button>
                  </View>
                </Dialog.Content>
              </Dialog.Portal>
            </Dialog>
          </View>
        </View>
      </Card.Body>
    </Card>
  );
};

export const FloorCard = ({ buildingId, floor, navigation }: Props) => {
  const deleteFloor = useRentalStore((state) => state.deleteFloor);

  return (
    <Card className="border border-white/40 dark:border-white/10 bg-surface shadow-lg rounded-2xl mb-4">
      <Card.Header className="flex-row items-center justify-between p-5 pb-2">
        <Card.Title className="text-lg font-bold">{floor.name}</Card.Title>
        <View className="flex-row gap-2">
          <Button
            variant="secondary"
            size="sm"
            className="min-h-[40px] px-4 rounded-xl border-primary/30"
            onPress={() =>
              navigation.navigate('RoomForm', { buildingId, floorId: floor.id })
            }
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
            accessibilityLabel={`删除${floor.name}`}
          >
            <Button.Label className="text-danger font-medium text-sm">删除</Button.Label>
          </Button>
        </View>
      </Card.Header>
      <Card.Body className="gap-3 px-5 pb-3">
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
                {floor.rooms.map((room) => (
                  <RoomItem
                    key={room.id}
                    buildingId={buildingId}
                    floorId={floor.id}
                    room={room}
                    navigation={navigation}
                  />
                ))}
              </Accordion.Content>
            </Accordion.Item>
          </Accordion>
        )}
      </Card.Body>
    </Card>
  );
};
