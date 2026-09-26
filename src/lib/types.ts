export type ApplianceType = "side_by_side" | "standard";

export type FreezerCompartment = {
  id: string;
  label: string;
  position: number;
};

export type FreezerZone = {
  id: string;
  key: string;
  label: string;
  type: "body" | "door";
  side: "left" | "right" | "single";
  position: number;
  compartments: FreezerCompartment[];
};

export type FreezerDefinition = {
  id: string;
  name: string;
  applianceType: ApplianceType;
  ownerId: string;
  shareWithHousehold: boolean;
  inviteCode: string;
  createdAt: string;
  zones: FreezerZone[];
};

export type FreezerItem = {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  freezerId: string;
  compartmentId: string;
  expiresOn?: string;
  memo?: string;
  createdAt: string;
  updatedAt: string;
};

export type ShoppingItem = {
  id: string;
  name: string;
  checked: boolean;
  createdAt: string;
};

export const UNITS = ["개", "봉", "팩", "병", "캔", "g", "kg", "ml", "L"];

export function getFreezer(freezers: FreezerDefinition[], freezerId: string) {
  return freezers.find((freezer) => freezer.id === freezerId);
}

export function getCompartmentLocation(freezer: FreezerDefinition | undefined, compartmentId: string) {
  if (!freezer) return undefined;
  for (const zone of freezer.zones) {
    const compartment = zone.compartments.find((candidate) => candidate.id === compartmentId);
    if (compartment) return { zone, compartment };
  }
  return undefined;
}

export function getLocationLabel(item: Pick<FreezerItem, "freezerId" | "compartmentId">, freezers: FreezerDefinition[]) {
  const freezer = getFreezer(freezers, item.freezerId);
  const location = getCompartmentLocation(freezer, item.compartmentId);
  if (!freezer || !location) return "위치 정보 확인 필요";
  return `${freezer.name} · ${location.zone.label} · ${location.compartment.label}`;
}
