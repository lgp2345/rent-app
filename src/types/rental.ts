export type MonthlyFee = {
  id: string;
  month: string;
  rent: number;
  water: number;
  waterUsage?: number;
  electricity: number;
  electricityUsage?: number;
  internet: number;
  other: number;
  note?: string;
};

export type Room = {
  id: string;
  name: string;
  tenantName?: string;
  tenantPhone?: string;
  tenantIdCard?: string;
  rent?: number;
  waterPricePerTon?: number;
  electricityPricePerKWh?: number;
  internetFee?: number;
  note?: string;
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
