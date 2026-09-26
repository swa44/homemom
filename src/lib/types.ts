export type FreezerId = "main" | "kimchi";
export type MainSection = "left" | "right" | "left_door" | "right_door";
export type KimchiSection = "body" | "door";
export type FreezerSection = MainSection | KimchiSection;

export type FreezerItem = {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  freezer: FreezerId;
  section: FreezerSection;
  level: 1 | 2 | 3;
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

export const FREEZERS: Record<FreezerId, { label: string; shortLabel: string }> = {
  main: { label: "기존 냉장고 냉동실", shortLabel: "기존 냉장고" },
  kimchi: { label: "김치냉장고 냉동실", shortLabel: "김치냉장고" },
};

export const SECTIONS: Record<FreezerId, { id: FreezerSection; label: string }[]> = {
  main: [
    { id: "left", label: "왼쪽" },
    { id: "right", label: "오른쪽" },
    { id: "left_door", label: "왼쪽 문" },
    { id: "right_door", label: "오른쪽 문" },
  ],
  kimchi: [
    { id: "body", label: "본체" },
    { id: "door", label: "문" },
  ],
};

export const UNITS = ["개", "봉", "팩", "병", "캔", "g", "kg", "ml", "L"];

export function getSectionLabel(freezer: FreezerId, section: FreezerSection) {
  return SECTIONS[freezer].find((candidate) => candidate.id === section)?.label ?? section;
}

export function getLocationLabel(item: Pick<FreezerItem, "freezer" | "section" | "level">) {
  return `${FREEZERS[item.freezer].shortLabel} · ${getSectionLabel(item.freezer, item.section)} · ${item.level}칸`;
}
