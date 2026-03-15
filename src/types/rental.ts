export type MonthlyFee = {
  id: string;
  month: string;
  rent: number;
  water: number;
  electricity: number;
  internet: number;
  other: number;
  note?: string;
};

export type Room = {
  id: string;
  name: string;
  monthlyFees: MonthlyFee[];
};

export type Floor = {
  id: string;
  name: string;
  rooms: Room[];
};

export type Building = {
  id: string;
  name: string;
  address: string;
  floors: Floor[];
  createdAt: string;
  updatedAt: string;
};

export type RentalData = {
  buildings: Building[];
};
