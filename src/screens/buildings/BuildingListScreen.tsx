import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Button } from 'heroui-native/button';
import { Card } from 'heroui-native/card';
import { Input } from 'heroui-native/input';
import { Label } from 'heroui-native/label';
import { TextField } from 'heroui-native/text-field';
import { useMemo, useState } from 'react';
import { Alert, Pressable, Text, View } from 'react-native';
import { typography } from '../../theme/tokens';
import { PrimaryFabButton } from '../../ui/PrimaryFabButton';
import { ScreenContainer } from '../../ui/ScreenContainer';
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

  const sortedBuildings = useMemo(
    () =>
      [...buildings].sort((a, b) =>
        a.createdAt < b.createdAt ? 1 : -1,
      ),
    [buildings],
  );

  const handleCreate = () => {
    try {
      createBuilding({ name, address });
      setName('');
      setAddress('');
    } catch (error) {
      Alert.alert('新增失败', error instanceof Error ? error.message : '请检查输入');
    }
  };

  return (
    <View className="flex-1 bg-background">
      <ScreenContainer withBottomSpace>
        <Text className={typography.pageTitle + ' text-foreground'}>房屋管理</Text>

        <Card className="border border-border bg-surface">
          <Card.Body className="gap-2">
            <View className="flex-row items-center justify-between rounded-xl bg-accent-soft px-3 py-2">
              <Text className="text-sm font-medium text-accent-soft-foreground">已创建房屋</Text>
              <Text className="text-base font-semibold text-accent-soft-foreground">
                {sortedBuildings.length}
              </Text>
            </View>
            <SectionTitle>新增房屋</SectionTitle>
            <TextField isRequired>
              <Label>房屋名称</Label>
              <Input
                value={name}
                onChangeText={setName}
                placeholder="例如：幸福里 1 栋"
                className="min-h-[44px]"
              />
            </TextField>
            <TextField isRequired>
              <Label>地址</Label>
              <Input
                value={address}
                onChangeText={setAddress}
                placeholder="例如：杭州市西湖区文三路 88 号"
                className="min-h-[44px]"
              />
            </TextField>
          </Card.Body>
        </Card>

        {sortedBuildings.length === 0 ? (
          <Card variant="secondary" className="border border-border">
            <Card.Body>
              <Card.Description className={typography.body}>还没有房屋，先新增一栋。</Card.Description>
            </Card.Body>
          </Card>
        ) : null}

        {sortedBuildings.map((building) => (
          <Pressable
            key={building.id}
            onPress={() =>
              navigation.navigate('BuildingDetail', { buildingId: building.id })
            }
            accessibilityRole="button"
            accessibilityLabel={`进入${building.name}详情`}
          >
            <Card className="border border-border bg-surface">
              <Card.Body className="gap-2">
                <Card.Title>{building.name}</Card.Title>
                <Card.Description>{building.address}</Card.Description>
                <Text className={typography.caption + ' text-muted'}>
                  楼层 {building.floors.length} / 房间{' '}
                  {building.floors.reduce((sum, floor) => sum + floor.rooms.length, 0)}
                </Text>
              </Card.Body>
              <Card.Footer className="flex-row gap-2">
                <Button
                  variant="secondary"
                  className="min-h-[44px]"
                  onPress={() =>
                    navigation.navigate('BuildingDetail', { buildingId: building.id })
                  }
                  accessibilityRole="button"
                  accessibilityLabel={`进入${building.name}详情`}
                >
                  <Button.Label>进入详情</Button.Label>
                </Button>
                <Button
                  variant="danger-soft"
                  className="min-h-[44px]"
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
                  <Button.Label>删除</Button.Label>
                </Button>
              </Card.Footer>
            </Card>
          </Pressable>
        ))}
      </ScreenContainer>
      <PrimaryFabButton label="保存房屋" onPress={handleCreate} />
    </View>
  );
};
