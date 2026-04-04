import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { BottomSheet } from 'heroui-native';
import { Button } from 'heroui-native/button';
import { Card } from 'heroui-native/card';
import { Input } from 'heroui-native/input';
import { Label } from 'heroui-native/label';
import { TextField } from 'heroui-native/text-field';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Alert, ScrollView, View } from 'react-native';
import { Pencil, Plus } from 'lucide-react-native';
import { useRentalStore } from '../../store/rentalStore';
import type { RootStackParamList } from '../../navigation/types';
import { HeaderBar } from '../../ui/HeaderBar';
import { ScreenContainer } from '../../ui/ScreenContainer';
import { SectionTitle } from '../../ui/SectionTitle';
import { typography } from '../../theme/tokens';
import { FloorCard } from './FloorCard';

type Props = NativeStackScreenProps<RootStackParamList, 'BuildingDetail'>;

export const BuildingDetailScreen = ({ route, navigation }: Props) => {
  const { buildingId } = route.params;
  const buildings = useRentalStore((state) => state.buildings);
  const updateBuilding = useRentalStore((state) => state.updateBuilding);
  const addFloor = useRentalStore((state) => state.addFloor);
  const deleteFloor = useRentalStore((state) => state.deleteFloor);
  const building = useMemo(
    () => buildings.find((item) => item.id === buildingId),
    [buildings, buildingId],
  );

  const [name, setName] = useState(building?.name ?? '');
  const [address, setAddress] = useState(building?.address ?? '');
  const [floorName, setFloorName] = useState('');
  const [isBuildingSheetOpen, setIsBuildingSheetOpen] = useState(false);
  const [isFloorSheetOpen, setIsFloorSheetOpen] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    if (building) {
      setName(building.name);
      setAddress(building.address);
    }
  }, [building]);

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

  return (
    <View className="flex-1 bg-background">
      <HeaderBar title={building.name} />
      <ScreenContainer scrollRef={scrollRef} withBottomSpace>
        <View className="flex-row gap-3 mb-4">
          <Button
            variant="secondary"
            className="flex-1 min-h-[48px] rounded-xl border-primary/30"
            onPress={() => setIsBuildingSheetOpen(true)}
          >
            <Pencil size={18} className="text-primary" />
            <Button.Label className="text-primary font-medium">房屋信息</Button.Label>
          </Button>
          <Button
            variant="secondary"
            className="flex-1 min-h-[48px] rounded-xl border-primary/30"
            onPress={() => setIsFloorSheetOpen(true)}
          >
            <Plus size={18} className="text-primary" />
            <Button.Label className="text-primary font-medium">新增楼层</Button.Label>
          </Button>
        </View>

        {building.floors.length === 0 ? (
          <Card variant="secondary" className="border border-border">
            <Card.Body>
              <Card.Description className={typography.body}>
                还没有楼层，请先新增。
              </Card.Description>
            </Card.Body>
          </Card>
        ) : null}

        {building.floors.map((floor) => (
          <FloorCard
            key={floor.id}
            buildingId={building.id}
            floor={floor}
            navigation={navigation}
          />
        ))}
      </ScreenContainer>

      <BottomSheet isOpen={isBuildingSheetOpen} onOpenChange={setIsBuildingSheetOpen}>
        <BottomSheet.Portal>
          <BottomSheet.Overlay />
          <BottomSheet.Content
            keyboardBehavior="interactive"
            keyboardBlurBehavior="restore"
            backgroundClassName="bg-background rounded-t-4xl"
          >
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
                <Button className="flex-1 min-h-[48px] rounded-xl" onPress={handleSaveBuilding}>
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
          <BottomSheet.Content
            keyboardBehavior="interactive"
            keyboardBlurBehavior="restore"
            backgroundClassName="bg-background rounded-t-4xl"
          >
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
                <Button className="flex-1 min-h-[48px] rounded-xl" onPress={handleAddFloor}>
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
