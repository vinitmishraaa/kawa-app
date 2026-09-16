// Icon-first categories — the icon does most of the work so the
// screen stays usable for people with limited literacy, per spec.
// `icon` is a name from @expo/vector-icons/MaterialCommunityIcons.

export interface ScrapCategory {
  id: string;
  icon: string;
  labelKey: string; // i18next key, see locales/en.json + locales/hi.json
  subCategories: { id: string; labelKey: string }[];
}

export const SCRAP_CATEGORIES: ScrapCategory[] = [
  {
    id: "paper",
    icon: "newspaper-variant-outline",
    labelKey: "categories.paper.label",
    subCategories: [
      { id: "newspaper", labelKey: "categories.paper.newspaper" },
      { id: "cardboard", labelKey: "categories.paper.cardboard" },
      { id: "books", labelKey: "categories.paper.books" },
    ],
  },
  {
    id: "plastic",
    icon: "bottle-soda-classic-outline",
    labelKey: "categories.plastic.label",
    subCategories: [
      { id: "bottles", labelKey: "categories.plastic.bottles" },
      { id: "containers", labelKey: "categories.plastic.containers" },
      { id: "mixed", labelKey: "categories.plastic.mixed" },
    ],
  },
  {
    id: "metal",
    icon: "screw-machine-flat-top",
    labelKey: "categories.metal.label",
    subCategories: [
      { id: "iron", labelKey: "categories.metal.iron" },
      { id: "aluminium", labelKey: "categories.metal.aluminium" },
      { id: "copper", labelKey: "categories.metal.copper" },
      { id: "steel", labelKey: "categories.metal.steel" },
    ],
  },
  {
    id: "ewaste",
    icon: "washing-machine",
    labelKey: "categories.ewaste.label",
    subCategories: [
      { id: "appliances", labelKey: "categories.ewaste.appliances" },
      { id: "electronics", labelKey: "categories.ewaste.electronics" },
      { id: "cables", labelKey: "categories.ewaste.cables" },
    ],
  },
  {
    id: "glass",
    icon: "bottle-wine-outline",
    labelKey: "categories.glass.label",
    subCategories: [
      { id: "bottles", labelKey: "categories.glass.bottles" },
      { id: "jars", labelKey: "categories.glass.jars" },
    ],
  },
  {
    id: "other",
    icon: "recycle-variant",
    labelKey: "categories.other.label",
    subCategories: [{ id: "mixed", labelKey: "categories.other.mixed" }],
  },
];

export const QUANTITY_UNITS = ["kg", "pieces", "bags"] as const;
