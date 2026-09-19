export interface AuthorizedOfficer {
  officerId: string;
  name: string;
  department: string;
  zone: string;
}

export const AUTHORIZED_OFFICER_IDS: AuthorizedOfficer[] = [
  {
    officerId: "OFFICER-SWM-101",
    name: "Rajesh Sharma",
    department: "Municipal Solid Waste Management",
    zone: "North Zone",
  },
  {
    officerId: "OFFICER-SWM-102",
    name: "Amit Banerjee",
    department: "Urban Sanitation & Recycling",
    zone: "South Zone",
  },
  {
    officerId: "OFFICER-SWM-103",
    name: "Pooja Verma",
    department: "Pollution Control & Waste Audit",
    zone: "East Zone",
  },
  {
    officerId: "OFFICER-SWM-104",
    name: "Vikram Sen",
    department: "Municipal Enforcement Cell",
    zone: "West Zone",
  },
  {
    officerId: "OFFICER-SWM-105",
    name: "Debashis Mukherjee",
    department: "Central Waste Command & Oversight",
    zone: "Central Command",
  },
];

export function findAuthorizedOfficer(id: string): AuthorizedOfficer | null {
  const normalized = id.trim().toUpperCase();
  return AUTHORIZED_OFFICER_IDS.find((o) => o.officerId.toUpperCase() === normalized) ?? null;
}

export function getOfficerCanonicalEmail(officerId: string): string {
  const clean = officerId.trim().toLowerCase().replace(/[^a-z0-9]/g, "");
  return `${clean}@kawa.app`;
}

export function isAuthorizedOfficerId(id: string): boolean {
  return findAuthorizedOfficer(id) !== null;
}
