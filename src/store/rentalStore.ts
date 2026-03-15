import { create } from 'zustand';
import { loadRentalData, saveRentalData } from '../storage/rentalStorage';
import type { Building, Floor, MonthlyFee, Room } from '../types/rental';

const createId = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;

const normalizeName = (value: string) => value.trim().toLowerCase();

const normalizeMonth = (month: string) => month.trim();

type RentalState = {
  buildings: Building[];
  hydrated: boolean;
  hydrate: () => Promise<void>;
  createBuilding: (input: { name: string; address: string }) => void;
  updateBuilding: (buildingId: string, input: { name: string; address: string }) => void;
  deleteBuilding: (buildingId: string) => void;
  addFloor: (buildingId: string, input: { name: string }) => void;
  updateFloor: (
    buildingId: string,
    floorId: string,
    input: { name: string },
  ) => void;
  deleteFloor: (buildingId: string, floorId: string) => void;
  addRoom: (buildingId: string, floorId: string, input: { name: string }) => void;
  updateRoom: (
    buildingId: string,
    floorId: string,
    roomId: string,
    input: { name: string },
  ) => void;
  deleteRoom: (buildingId: string, floorId: string, roomId: string) => void;
  upsertMonthlyFee: (
    buildingId: string,
    floorId: string,
    roomId: string,
    input: Omit<MonthlyFee, 'id'>,
  ) => void;
  deleteMonthlyFee: (buildingId: string, floorId: string, roomId: string, month: string) => void;
};

const updateAndPersist = (
  set: (fn: (state: RentalState) => Partial<RentalState>) => void,
  updater: (buildings: Building[]) => Building[],
) => {
  set((state) => {
    const buildings = updater(state.buildings);
    void saveRentalData({ buildings });
    return { buildings };
  });
};

const ensureBuilding = (buildings: Building[], buildingId: string) => {
  const idx = buildings.findIndex((item) => item.id === buildingId);
  if (idx < 0) {
    throw new Error('房屋不存在');
  }
  return idx;
};

const ensureFloor = (building: Building, floorId: string) => {
  const idx = building.floors.findIndex((item) => item.id === floorId);
  if (idx < 0) {
    throw new Error('楼层不存在');
  }
  return idx;
};

const ensureRoom = (floor: Floor, roomId: string) => {
  const idx = floor.rooms.findIndex((item) => item.id === roomId);
  if (idx < 0) {
    throw new Error('房间不存在');
  }
  return idx;
};

export const useRentalStore = create<RentalState>((set) => ({
  buildings: [],
  hydrated: false,
  hydrate: async () => {
    const data = await loadRentalData();
    set({ buildings: data.buildings, hydrated: true });
  },
  createBuilding: ({ name, address = '' }) => {
    const normalizedAddress = address.trim();
    const normalizedName = name.trim();
    if (!normalizedName) {
      throw new Error('名称不能为空');
    }
    updateAndPersist(set, (buildings) => [
      ...buildings,
      {
        id: createId(),
        name: normalizedName,
        address: normalizedAddress,
        floors: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ]);
  },
  updateBuilding: (buildingId, { name, address }) => {
    const normalizedAddress = address.trim();
    const normalizedName = name.trim();
    if (!normalizedAddress) {
      throw new Error('地址不能为空');
    }
    if (!normalizedName) {
      throw new Error('名称不能为空');
    }
    updateAndPersist(set, (buildings) => {
      const idx = ensureBuilding(buildings, buildingId);
      const next = [...buildings];
      next[idx] = {
        ...next[idx],
        name: normalizedName,
        address: normalizedAddress,
        updatedAt: new Date().toISOString(),
      };
      return next;
    });
  },
  deleteBuilding: (buildingId) => {
    updateAndPersist(set, (buildings) =>
      buildings.filter((building) => building.id !== buildingId),
    );
  },
  addFloor: (buildingId, { name }) => {
    const normalizedName = name.trim();
    if (!normalizedName) {
      throw new Error('楼层名称不能为空');
    }
    updateAndPersist(set, (buildings) => {
      const bIdx = ensureBuilding(buildings, buildingId);
      const building = buildings[bIdx];
      const nextBuilding: Building = {
        ...building,
        floors: [
          ...building.floors,
          { id: createId(), name: normalizedName, rooms: [] },
        ],
        updatedAt: new Date().toISOString(),
      };
      const next = [...buildings];
      next[bIdx] = nextBuilding;
      return next;
    });
  },
  updateFloor: (buildingId, floorId, { name }) => {
    const normalizedName = name.trim();
    if (!normalizedName) {
      throw new Error('楼层名称不能为空');
    }
    updateAndPersist(set, (buildings) => {
      const bIdx = ensureBuilding(buildings, buildingId);
      const building = buildings[bIdx];
      const fIdx = ensureFloor(building, floorId);
      const nextFloors = [...building.floors];
      nextFloors[fIdx] = { ...nextFloors[fIdx], name: normalizedName };
      const nextBuilding: Building = {
        ...building,
        floors: nextFloors,
        updatedAt: new Date().toISOString(),
      };
      const next = [...buildings];
      next[bIdx] = nextBuilding;
      return next;
    });
  },
  deleteFloor: (buildingId, floorId) => {
    updateAndPersist(set, (buildings) => {
      const bIdx = ensureBuilding(buildings, buildingId);
      const building = buildings[bIdx];
      const nextBuilding: Building = {
        ...building,
        floors: building.floors.filter((floor) => floor.id !== floorId),
        updatedAt: new Date().toISOString(),
      };
      const next = [...buildings];
      next[bIdx] = nextBuilding;
      return next;
    });
  },
  addRoom: (buildingId, floorId, { name }) => {
    const normalizedName = name.trim();
    if (!normalizedName) {
      throw new Error('房间名称不能为空');
    }
    updateAndPersist(set, (buildings) => {
      const bIdx = ensureBuilding(buildings, buildingId);
      const building = buildings[bIdx];
      const fIdx = ensureFloor(building, floorId);
      const floor = building.floors[fIdx];
      const duplicated = floor.rooms.some(
        (room) => normalizeName(room.name) === normalizeName(normalizedName),
      );
      if (duplicated) {
        throw new Error('同一楼层内房间名称不能重复');
      }
      const nextFloors = [...building.floors];
      nextFloors[fIdx] = {
        ...floor,
        rooms: [...floor.rooms, { id: createId(), name: normalizedName, monthlyFees: [] }],
      };
      const nextBuilding: Building = {
        ...building,
        floors: nextFloors,
        updatedAt: new Date().toISOString(),
      };
      const next = [...buildings];
      next[bIdx] = nextBuilding;
      return next;
    });
  },
  updateRoom: (buildingId, floorId, roomId, { name }) => {
    const normalizedName = name.trim();
    if (!normalizedName) {
      throw new Error('房间名称不能为空');
    }
    updateAndPersist(set, (buildings) => {
      const bIdx = ensureBuilding(buildings, buildingId);
      const building = buildings[bIdx];
      const fIdx = ensureFloor(building, floorId);
      const floor = building.floors[fIdx];
      const rIdx = ensureRoom(floor, roomId);
      const duplicated = floor.rooms.some(
        (room, index) =>
          normalizeName(room.name) === normalizeName(normalizedName) && index !== rIdx,
      );
      if (duplicated) {
        throw new Error('同一楼层内房间名称不能重复');
      }
      const nextRooms = [...floor.rooms];
      nextRooms[rIdx] = { ...nextRooms[rIdx], name: normalizedName };
      const nextFloors = [...building.floors];
      nextFloors[fIdx] = { ...floor, rooms: nextRooms };
      const nextBuilding: Building = {
        ...building,
        floors: nextFloors,
        updatedAt: new Date().toISOString(),
      };
      const next = [...buildings];
      next[bIdx] = nextBuilding;
      return next;
    });
  },
  deleteRoom: (buildingId, floorId, roomId) => {
    updateAndPersist(set, (buildings) => {
      const bIdx = ensureBuilding(buildings, buildingId);
      const building = buildings[bIdx];
      const fIdx = ensureFloor(building, floorId);
      const floor = building.floors[fIdx];
      const nextFloors = [...building.floors];
      nextFloors[fIdx] = {
        ...floor,
        rooms: floor.rooms.filter((room) => room.id !== roomId),
      };
      const nextBuilding: Building = {
        ...building,
        floors: nextFloors,
        updatedAt: new Date().toISOString(),
      };
      const next = [...buildings];
      next[bIdx] = nextBuilding;
      return next;
    });
  },
  upsertMonthlyFee: (buildingId, floorId, roomId, input) => {
    const month = normalizeMonth(input.month);
    if (!/^\d{4}-\d{2}$/.test(month)) {
      throw new Error('月份格式必须为 YYYY-MM');
    }
    const numbers = [input.rent, input.water, input.electricity, input.internet, input.other];
    if (numbers.some((value) => Number.isNaN(value) || value < 0)) {
      throw new Error('费用必须是大于等于 0 的数字');
    }
    updateAndPersist(set, (buildings) => {
      const bIdx = ensureBuilding(buildings, buildingId);
      const building = buildings[bIdx];
      const fIdx = ensureFloor(building, floorId);
      const floor = building.floors[fIdx];
      const rIdx = ensureRoom(floor, roomId);
      const room = floor.rooms[rIdx];
      const feeIndex = room.monthlyFees.findIndex((fee) => fee.month === month);
      const nextFees = [...room.monthlyFees];
      if (feeIndex >= 0) {
        nextFees[feeIndex] = {
          ...nextFees[feeIndex],
          ...input,
          month,
          note: input.note?.trim() || undefined,
        };
      } else {
        nextFees.push({
          id: createId(),
          ...input,
          month,
          note: input.note?.trim() || undefined,
        });
      }
      const nextRooms = [...floor.rooms];
      nextRooms[rIdx] = {
        ...room,
        monthlyFees: nextFees.sort((a, b) => (a.month < b.month ? 1 : -1)),
      };
      const nextFloors = [...building.floors];
      nextFloors[fIdx] = { ...floor, rooms: nextRooms };
      const nextBuilding: Building = {
        ...building,
        floors: nextFloors,
        updatedAt: new Date().toISOString(),
      };
      const next = [...buildings];
      next[bIdx] = nextBuilding;
      return next;
    });
  },
  deleteMonthlyFee: (buildingId, floorId, roomId, month) => {
    const normalizedMonth = normalizeMonth(month);
    updateAndPersist(set, (buildings) => {
      const bIdx = ensureBuilding(buildings, buildingId);
      const building = buildings[bIdx];
      const fIdx = ensureFloor(building, floorId);
      const floor = building.floors[fIdx];
      const rIdx = ensureRoom(floor, roomId);
      const room = floor.rooms[rIdx];
      const nextRooms = [...floor.rooms];
      nextRooms[rIdx] = {
        ...room,
        monthlyFees: room.monthlyFees.filter((fee) => fee.month !== normalizedMonth),
      };
      const nextFloors = [...building.floors];
      nextFloors[fIdx] = { ...floor, rooms: nextRooms };
      const nextBuilding: Building = {
        ...building,
        floors: nextFloors,
        updatedAt: new Date().toISOString(),
      };
      const next = [...buildings];
      next[bIdx] = nextBuilding;
      return next;
    });
  },
}));
