export interface ScrapPriceItem {
  key: string;
  nameEn: string;
  nameHi: string;
  category: string;
  defaultBuyRate: number; // Buying price from customer (₹/kg)
  expectedOfficerRate: number; // Selling price to Municipal Officer / Recycler (₹/kg)
  unit: string;
  icon: string;
}

export const SCRAP_PRICE_CATALOG: ScrapPriceItem[] = [
  {
    key: "copper",
    nameEn: "Copper",
    nameHi: "तांबा",
    category: "metal",
    defaultBuyRate: 650,
    expectedOfficerRate: 750,
    unit: "kg",
    icon: "circle-slice-8",
  },
  {
    key: "brass",
    nameEn: "Brass",
    nameHi: "पीतल",
    category: "metal",
    defaultBuyRate: 400,
    expectedOfficerRate: 460,
    unit: "kg",
    icon: "ring",
  },
  {
    key: "aluminium",
    nameEn: "Aluminium",
    nameHi: "एल्युमिनियम",
    category: "metal",
    defaultBuyRate: 130,
    expectedOfficerRate: 160,
    unit: "kg",
    icon: "cube-outline",
  },
  {
    key: "iron",
    nameEn: "Iron / Steel",
    nameHi: "लोहा / स्टील",
    category: "metal",
    defaultBuyRate: 32,
    expectedOfficerRate: 42,
    unit: "kg",
    icon: "screw-machine-flat-top",
  },
  {
    key: "paper",
    nameEn: "Newspaper & Books",
    nameHi: "अखबार व रद्दी",
    category: "paper",
    defaultBuyRate: 14,
    expectedOfficerRate: 20,
    unit: "kg",
    icon: "newspaper-variant-outline",
  },
  {
    key: "cardboard",
    nameEn: "Cardboard / Carton",
    nameHi: "गत्ता / कार्टन",
    category: "paper",
    defaultBuyRate: 10,
    expectedOfficerRate: 15,
    unit: "kg",
    icon: "package-variant",
  },
  {
    key: "plastic",
    nameEn: "Plastic (Bottles & Hard)",
    nameHi: "प्लास्टिक (बोतलें व डब्बे)",
    category: "plastic",
    defaultBuyRate: 18,
    expectedOfficerRate: 26,
    unit: "kg",
    icon: "bottle-soda-classic-outline",
  },
  // E-Waste Categories (E-Waste Rules 2022)
  {
    key: "ewaste_pcb",
    nameEn: "PCBs & Motherboards",
    nameHi: "सर्किट बोर्ड (मदरबोर्ड)",
    category: "ewaste",
    defaultBuyRate: 220,
    expectedOfficerRate: 310,
    unit: "kg",
    icon: "chip",
  },
  {
    key: "ewaste_batteries",
    nameEn: "Lithium & Device Batteries",
    nameHi: "लिथियम व डिवाइस बैटरी",
    category: "ewaste",
    defaultBuyRate: 95,
    expectedOfficerRate: 135,
    unit: "kg",
    icon: "battery-charging",
  },
  {
    key: "ewaste_cables",
    nameEn: "Wiring & Power Cables",
    nameHi: "बिजली के तार व केबल",
    category: "ewaste",
    defaultBuyRate: 125,
    expectedOfficerRate: 170,
    unit: "kg",
    icon: "power-plug",
  },
  {
    key: "ewaste_screens",
    nameEn: "Displays & Screens (LCD/LED)",
    nameHi: "स्क्रीन व मॉनिटर डिस्प्ले",
    category: "ewaste",
    defaultBuyRate: 25,
    expectedOfficerRate: 42,
    unit: "kg",
    icon: "television",
  },
  {
    key: "ewaste_motors",
    nameEn: "Motors & Compressors",
    nameHi: "इलेक्ट्रिक मोटर व कंप्रेसर",
    category: "ewaste",
    defaultBuyRate: 55,
    expectedOfficerRate: 78,
    unit: "kg",
    icon: "fan",
  },
  {
    key: "ewaste_mobiles",
    nameEn: "Old Phones & Tablets",
    nameHi: "पुराने मोबाइल व टैबलेट",
    category: "ewaste",
    defaultBuyRate: 160,
    expectedOfficerRate: 230,
    unit: "kg",
    icon: "cellphone",
  },
  {
    key: "ewaste_appliances",
    nameEn: "Home Appliances (Mixed)",
    nameHi: "घरेलू उपकरण (मिक्स)",
    category: "ewaste",
    defaultBuyRate: 40,
    expectedOfficerRate: 60,
    unit: "kg",
    icon: "washing-machine",
  },
  {
    key: "ewaste",
    nameEn: "Mixed E-Waste",
    nameHi: "मिश्रित ई-कचरा",
    category: "ewaste",
    defaultBuyRate: 45,
    expectedOfficerRate: 65,
    unit: "kg",
    icon: "recycle",
  },
  {
    key: "glass",
    nameEn: "Glass Bottles",
    nameHi: "कांच की बोतलें",
    category: "glass",
    defaultBuyRate: 4,
    expectedOfficerRate: 8,
    unit: "kg",
    icon: "bottle-wine-outline",
  },
  {
    key: "other",
    nameEn: "Mixed Scrap",
    nameHi: "अन्य मिश्रित कबाड़",
    category: "other",
    defaultBuyRate: 10,
    expectedOfficerRate: 16,
    unit: "kg",
    icon: "recycle",
  },
];

export function getDefaultPriceRates(): Record<string, number> {
  const rates: Record<string, number> = {};
  for (const item of SCRAP_PRICE_CATALOG) {
    rates[item.key] = item.defaultBuyRate;
  }
  return rates;
}

export function getExpectedOfficerRates(): Record<string, number> {
  const rates: Record<string, number> = {};
  for (const item of SCRAP_PRICE_CATALOG) {
    rates[item.key] = item.expectedOfficerRate;
  }
  return rates;
}
