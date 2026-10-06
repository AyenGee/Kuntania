/** The nine South African provinces. Values match the Prisma `Province` enum. */
export const PROVINCES = [
  { value: "EASTERN_CAPE", label: "Eastern Cape" },
  { value: "FREE_STATE", label: "Free State" },
  { value: "GAUTENG", label: "Gauteng" },
  { value: "KWAZULU_NATAL", label: "KwaZulu-Natal" },
  { value: "LIMPOPO", label: "Limpopo" },
  { value: "MPUMALANGA", label: "Mpumalanga" },
  { value: "NORTHERN_CAPE", label: "Northern Cape" },
  { value: "NORTH_WEST", label: "North West" },
  { value: "WESTERN_CAPE", label: "Western Cape" },
] as const;

export type ProvinceValue = (typeof PROVINCES)[number]["value"];

export const PROVINCE_VALUES = PROVINCES.map((p) => p.value) as [
  ProvinceValue,
  ...ProvinceValue[],
];
