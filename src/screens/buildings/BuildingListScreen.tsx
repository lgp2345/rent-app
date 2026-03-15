import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { BottomSheet, Toast, useToast } from 'heroui-native';
import { Button } from 'heroui-native/button';
import { Card } from 'heroui-native/card';
import { Input } from 'heroui-native/input';
import { Label } from 'heroui-native/label';
import { TextField } from 'heroui-native/text-field';
import { useMemo, useState } from 'react';
import { Alert, Pressable, Text, View } from 'react-native';
import { typography } from '../../theme/tokens';
import { ScreenContainer } from '../../ui/ScreenContainer';
import DraggableView from 'react-native-draggable-floating';
import { SectionTitle } from '../../ui/SectionTitle';
import { useRentalStore } from '../../store/rentalStore';
import type { RootStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'BuildingList'>;

export const BuildingListScreen = ({ navigation }: Props) => {
  const buildings = useRentalStore((state) => state.buildings);
  const createBuilding = useRentalStore((state) => state.createBuilding);
  const deleteBuilding = useRentalStore((state) => state.deleteBuilding);
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [isCreateSheetOpen, setIsCreateSheetOpen] = useState(false);
  const { toast } = useToast();
  const sortedBuildings = useMemo(
    () => [...buildings].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1)),
    [buildings],
  );

  const handleCreate = () => {
    try {
      createBuilding({ name, address });
      setName('');
      setAddress('');
      return true;
    } catch (error) {
      // toast.show({
      //   label: '新增失败',
      //   description: error instanceof Error ? error.message : '请检查输入',
      //   variant: 'warning',
      //   actionLabel: '关闭',
      //       onActionPress: ({ hide }) => hide(),
      // });
      toast.show({
        component: (props) => (
          <Toast variant="warning" {...props}>
            <Toast.Title>Custom Toast</Toast.Title>
            <Toast.Description>This uses a custom component</Toast.Description>
            <Toast.Close className="absolute top-2 right-2" />
          </Toast>
        ),
      });
      return false;
    }
  };

  return (
    <View className="flex-1 bg-background">
      <ScreenContainer withBottomSpace>
        <View className="flex-row items-baseline justify-between mb-4">
          <Text className={typography.pageTitle + ' text-foreground'}>房屋管理</Text>
          <View className="flex-row items-center gap-2">
            <Text className="text-xs text-muted-foreground font-medium">
              共 {sortedBuildings.length} 栋
            </Text>
          </View>
        </View>

        {sortedBuildings.length === 0 ? (
          <Card variant="secondary" className="border border-border">
            <Card.Body>
              <Card.Description className={typography.body}>
                还没有房屋，先新增一栋。
              </Card.Description>
            </Card.Body>
          </Card>
        ) : null}

        {sortedBuildings.map((building) => (
          <Pressable
            key={building.id}
            onPress={() => navigation.navigate('BuildingDetail', { buildingId: building.id })}
            accessibilityRole="button"
            accessibilityLabel={`进入${building.name}详情`}
          >
            <Card className="border border-white/40 dark:border-white/10 bg-surface shadow-lg rounded-2xl mb-3">
              <Card.Body className="gap-2 p-5">
                <View className="flex-row items-center justify-between">
                  <Card.Title className="text-lg font-bold text-foreground">
                    {building.name}
                  </Card.Title>
                  <View className="bg-primary/10 px-2 py-1 rounded-full">
                    <Text className="text-xs text-primary font-medium">
                      {building.floors.reduce((sum, floor) => sum + floor.rooms.length, 0)} 房间
                    </Text>
                  </View>
                </View>
                <Card.Description className="text-muted mt-1">{building.address}</Card.Description>
                <Text className={typography.caption + ' text-muted mt-2'}>
                  共 {building.floors.length} 个楼层
                </Text>
              </Card.Body>
              <Card.Footer className="flex-row gap-3 px-5 pb-5 pt-2 border-t border-border/50">
                <Button
                  variant="secondary"
                  className="flex-1 min-h-[48px] rounded-xl border-primary/30"
                  onPress={() => navigation.navigate('BuildingDetail', { buildingId: building.id })}
                  accessibilityRole="button"
                  accessibilityLabel={`进入${building.name}详情`}
                >
                  <Button.Label className="text-primary font-medium">进入详情</Button.Label>
                </Button>
                <Button
                  variant="danger-soft"
                  className="min-h-[48px] px-6 rounded-xl bg-danger/10"
                  onPress={() =>
                    Alert.alert('删除房屋', '确定删除该房屋吗？', [
                      { text: '取消', style: 'cancel' },
                      {
                        text: '删除',
                        style: 'destructive',
                        onPress: () => deleteBuilding(building.id),
                      },
                    ])
                  }
                  accessibilityRole="button"
                  accessibilityLabel={`删除${building.name}`}
                >
                  <Button.Label className="text-danger font-medium">删除</Button.Label>
                </Button>
              </Card.Footer>
            </Card>
          </Pressable>
        ))}
      </ScreenContainer>
      <BottomSheet isOpen={isCreateSheetOpen} onOpenChange={setIsCreateSheetOpen}>
        <BottomSheet.Portal>
          <BottomSheet.Overlay />
          <BottomSheet.Content keyboardBehavior="interactive" keyboardBlurBehavior="restore">
            <View className="gap-4">
              <SectionTitle>新增房屋</SectionTitle>
              <TextField isRequired>
                <Label>房屋名称</Label>
                <Input
                  value={name}
                  onChangeText={setName}
                  placeholder="例如：幸福里 1 栋"
                  className="min-h-[48px] rounded-xl border-border bg-white dark:bg-surface border"
                />
              </TextField>
              <TextField isRequired>
                <Label>地址</Label>
                <Input
                  value={address}
                  onChangeText={setAddress}
                  placeholder="例如：杭州市西湖区文三路 88 号"
                  className="min-h-[48px] rounded-xl border-border bg-white dark:bg-surface border"
                />
              </TextField>
              <View className="flex-row gap-3 pt-2">
                <Button
                  variant="secondary"
                  className="flex-1 min-h-[48px] rounded-xl"
                  onPress={() => setIsCreateSheetOpen(false)}
                >
                  <Button.Label>取消</Button.Label>
                </Button>
                <Button
                  className="flex-1 min-h-[48px] rounded-xl"
                  onPress={() => {
                    if (handleCreate()) {
                      setIsCreateSheetOpen(false);
                    }
                  }}
                >
                  <Button.Label>保存</Button.Label>
                </Button>
              </View>
            </View>
          </BottomSheet.Content>
        </BottomSheet.Portal>
      </BottomSheet>
      <DraggableView initialOffsetY={600}>
        <Button
          className="min-h-[48px] rounded-xl"
          onPress={() => setIsCreateSheetOpen(true)}
          accessibilityRole="button"
          accessibilityLabel="新增房屋"
        >
          <Button.Label className="font-medium">新增房屋</Button.Label>
        </Button>
      </DraggableView>
    </View>
  );
};
