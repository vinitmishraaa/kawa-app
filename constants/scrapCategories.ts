// Icon-first categories — the icon does most of the work so the
// screen stays usable for people with limited literacy, per E-Waste Rules 2022.
// `icon` is a name from @expo/vector-icons/MaterialCommunityIcons.

export interface ScrapSubCategory {
  id: string;
  labelKey: string;
  minPrice?: number;
  maxPrice?: number;
  criticalMinerals?: string[];
  isHazardous?: boolean;
}

export interface ScrapCategory {
  id: string;
  icon: string;
  labelKey: string; // i18next key, see locales/en.json + locales/hi.json + locales/mr.json
  subCategories: ScrapSubCategory[];
}

export const SCRAP_CATEGORIES: ScrapCategory[] = [
  {
    id: "ewaste",
    icon: "chip",
    labelKey: "categories.ewaste.label",
    subCategories: [
      {
        id: "pcb",
        labelKey: "categories.ewaste.pcb",
        minPrice: 350,
        maxPrice: 550,
        criticalMinerals: ["Copper", "Gold", "Silver", "Gallium"],
      },
      {
        id: "batteries",
        labelKey: "categories.ewaste.batteries",
        minPrice: 120,
        maxPrice: 220,
        criticalMinerals: ["Lithium", "Cobalt", "Nickel"],
        isHazardous: true,
      },
      {
        id: "screens",
        labelKey: "categories.ewaste.screens",
        minPrice: 80,
        maxPrice: 180,
        criticalMinerals: ["Indium", "Lead"],
        isHazardous: true,
      },
      {
        id: "cables",
        labelKey: "categories.ewaste.cables",
        minPrice: 420,
        maxPrice: 620,
        criticalMinerals: ["Pure Copper"],
      },
      {
        id: "motors",
        labelKey: "categories.ewaste.motors",
        minPrice: 45,
        maxPrice: 95,
        criticalMinerals: ["Neodymium", "Copper"],
      },
      {
        id: "electronics",
        labelKey: "categories.ewaste.electronics",
        minPrice: 50,
        maxPrice: 150,
      },
      {
        id: "appliances",
        labelKey: "categories.ewaste.appliances",
        minPrice: 30,
        maxPrice: 70,
      },
      {
        id: "mixed",
        labelKey: "categories.ewaste.mixed",
        minPrice: 25,
        maxPrice: 55,
      },
    ],
  },
  {
    id: "metal",
    icon: "screw-machine-flat-top",
    labelKey: "categories.metal.label",
    subCategories: [
      { id: "copper", labelKey: "categories.metal.copper", minPrice: 450, maxPrice: 650 },
      { id: "aluminium", labelKey: "categories.metal.aluminium", minPrice: 110, maxPrice: 160 },
      { id: "iron", labelKey: "categories.metal.iron", minPrice: 26, maxPrice: 35 },
      { id: "steel", labelKey: "categories.metal.steel", minPrice: 35, maxPrice: 50 },
    ],
  },
  {
    id: "paper",
    icon: "newspaper-variant-outline",
    labelKey: "categories.paper.label",
    subCategories: [
      { id: "newspaper", labelKey: "categories.paper.newspaper", minPrice: 14, maxPrice: 18 },
      { id: "cardboard", labelKey: "categories.paper.cardboard", minPrice: 9, maxPrice: 13 },
      { id: "books", labelKey: "categories.paper.books", minPrice: 10, maxPrice: 14 },
    ],
  },
  {
    id: "plastic",
    icon: "bottle-soda-classic-outline",
    labelKey: "categories.plastic.label",
    subCategories: [
      { id: "bottles", labelKey: "categories.plastic.bottles", minPrice: 15, maxPrice: 22 },
      { id: "containers", labelKey: "categories.plastic.containers", minPrice: 18, maxPrice: 26 },
      { id: "mixed", labelKey: "categories.plastic.mixed", minPrice: 10, maxPrice: 16 },
    ],
  },
  {
    id: "glass",
    icon: "bottle-wine-outline",
    labelKey: "categories.glass.label",
    subCategories: [
      { id: "bottles", labelKey: "categories.glass.bottles", minPrice: 3, maxPrice: 6 },
      { id: "jars", labelKey: "categories.glass.jars", minPrice: 2, maxPrice: 5 },
    ],
  },
  {
    id: "other",
    icon: "recycle-variant",
    labelKey: "categories.other.label",
    subCategories: [{ id: "mixed", labelKey: "categories.other.mixed", minPrice: 5, maxPrice: 15 }],
  },
];

export const QUANTITY_UNITS = ["kg", "pieces", "bags"] as const;
