export type RootStackParamList = {
  BuildingList: undefined;
  BuildingDetail: { buildingId: string };
  RoomForm: { buildingId: string; floorId: string; roomId?: string };
  RoomMonthlyFee: { buildingId: string; floorId: string; roomId: string };
};
