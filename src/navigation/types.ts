export type RootStackParamList = {
  BuildingList: undefined;
  BuildingDetail: { buildingId: string };
  RoomMonthlyFee: { buildingId: string; floorId: string; roomId: string };
};
