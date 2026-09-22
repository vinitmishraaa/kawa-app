import { SCRAP_PRICE_CATALOG } from "../../constants/scrapPricing";

export interface CriticalMineralInfo {
  name: string;
  symbol: string;
  economicValue: "Medium" | "High" | "Critical" | "Ultra-High";
  industrialUse: string;
}

export interface MaterialAdvice {
  categoryKey: string;
  displayName: string;
  criticalMinerals: CriticalMineralInfo[];
  hazardousAlert?: string;
  sortingTip: string;
  eprComplianceGuidance: string;
  baseBenchmarkPerKg: number;
  expectedRecyclerPerKg: number;
}

export const MATERIAL_AI_CATALOG: Record<string, MaterialAdvice> = {
  ewaste_pcb: {
    categoryKey: "ewaste_pcb",
    displayName: "Printed Circuit Boards & Motherboards",
    criticalMinerals: [
      { name: "Gold", symbol: "Au", economicValue: "Ultra-High", industrialUse: "Bonding wires & edge connectors" },
      { name: "Gallium", symbol: "Ga", economicValue: "Critical", industrialUse: "Semiconductor transistors & power ICs" },
      { name: "Tantalum", symbol: "Ta", economicValue: "Critical", industrialUse: "Surface-mount SMD capacitors" },
      { name: "Copper", symbol: "Cu", economicValue: "High", industrialUse: "Motherboard copper traces & ground planes" },
      { name: "Silver", symbol: "Ag", economicValue: "High", industrialUse: "Lead-free solder & contact switches" },
    ],
    hazardousAlert: "Never use nitric acid or open torches. Acid washing causes lung edema and destroys 90% of gallium/tantalum value.",
    sortingTip: "Keep green smartphone/server boards separate from brown TV/appliance power boards for highest CPCB payout.",
    eprComplianceGuidance: "Eligible for CPCB EPR Certificate Tier-1 credit under Schedule I (Information Technology Equipment).",
    baseBenchmarkPerKg: 220,
    expectedRecyclerPerKg: 310,
  },
  ewaste_batteries: {
    categoryKey: "ewaste_batteries",
    displayName: "Lithium-Ion & Device Batteries",
    criticalMinerals: [
      { name: "Lithium", symbol: "Li", economicValue: "Critical", industrialUse: "Lithium cobalt oxide cathode active material" },
      { name: "Cobalt", symbol: "Co", economicValue: "Critical", industrialUse: "High-density mobile energy storage" },
      { name: "Nickel", symbol: "Ni", economicValue: "High", industrialUse: "High-voltage vehicle & UPS batteries" },
    ],
    hazardousAlert: "Flammable electrolyte. Puncturing or short-circuiting leads to thermal runaway explosion (800°C+). Wrap terminals with tape.",
    sortingTip: "Store pouch cells in dry plastic drums away from heavy metals. Never store near iron or moisture.",
    eprComplianceGuidance: "Mandatory CPCB Battery Waste Management Rules 2022 EPR manifest required.",
    baseBenchmarkPerKg: 95,
    expectedRecyclerPerKg: 135,
  },
  ewaste_cables: {
    categoryKey: "ewaste_cables",
    displayName: "Wiring & Power Cables",
    criticalMinerals: [
      { name: "Pure Copper", symbol: "Cu", economicValue: "High", industrialUse: "99.9% conductivity electrical transmission" },
    ],
    hazardousAlert: "Open burning of PVC insulation emits carcinogenic dioxins and reduces copper yield by 15%. Always strip mechanically.",
    sortingTip: "Separate thick AC power cables from thin data/earphone wires for maximum price realization.",
    eprComplianceGuidance: "Authorized recyclers use mechanical granulation shredders to recycle 100% of copper + PVC.",
    baseBenchmarkPerKg: 125,
    expectedRecyclerPerKg: 170,
  },
  ewaste_screens: {
    categoryKey: "ewaste_screens",
    displayName: "LCD Panels, LEDs & CRT Displays",
    criticalMinerals: [
      { name: "Indium", symbol: "In", economicValue: "Critical", industrialUse: "Indium Tin Oxide (ITO) transparent electrodes" },
      { name: "Rare-Earth Phosphors", symbol: "RE", economicValue: "Critical", industrialUse: "Color display backlights (Eu, Tb, Y)" },
    ],
    hazardousAlert: "CRT funnels contain 1.5-2.5 kg of toxic lead oxide. Broken vacuum envelopes cause violent implosion. Do not crack.",
    sortingTip: "Keep screens upright in bubble wrap or cardboard dividers to avoid glass shatter during transit.",
    eprComplianceGuidance: "Certified CRT/LCD dismantling facilities extract mercury cold cathodes safely.",
    baseBenchmarkPerKg: 25,
    expectedRecyclerPerKg: 42,
  },
  ewaste_motors: {
    categoryKey: "ewaste_motors",
    displayName: "Electric Motors & Compressors",
    criticalMinerals: [
      { name: "Neodymium", symbol: "Nd", economicValue: "Critical", industrialUse: "High-strength permanent magnets (NdFeB)" },
      { name: "Copper", symbol: "Cu", economicValue: "High", industrialUse: "Armature and stator coil windings" },
    ],
    sortingTip: "Clean intact motor housings fetch higher resale than manually smashed armatures.",
    eprComplianceGuidance: "Recyclers recover permanent rare-earth magnets for automotive and renewable energy supply chains.",
    baseBenchmarkPerKg: 55,
    expectedRecyclerPerKg: 78,
  },
  ewaste_mobiles: {
    categoryKey: "ewaste_mobiles",
    displayName: "Old Phones & Tablet Assemblies",
    criticalMinerals: [
      { name: "Gold", symbol: "Au", economicValue: "Ultra-High", industrialUse: "Micro-soldering contact pins" },
      { name: "Cobalt", symbol: "Co", economicValue: "Critical", industrialUse: "Compact Li-ion battery pack" },
      { name: "Tantalum", symbol: "Ta", economicValue: "Critical", industrialUse: "Micro-capacitors" },
      { name: "Indium", symbol: "In", economicValue: "Critical", industrialUse: "Touchscreen sensor grid" },
    ],
    sortingTip: "Keep phones with intact screens and boards together. Remove loose swelling batteries.",
    eprComplianceGuidance: "Authorized smelters extract 300g of gold and 100g of silver per metric ton of mobile phones.",
    baseBenchmarkPerKg: 160,
    expectedRecyclerPerKg: 230,
  },
  ewaste_appliances: {
    categoryKey: "ewaste_appliances",
    displayName: "Home Appliances & Mixed Electronics",
    criticalMinerals: [
      { name: "Copper", symbol: "Cu", economicValue: "High", industrialUse: "Transformers & power lines" },
      { name: "Aluminium", symbol: "Al", economicValue: "Medium", industrialUse: "Heat sinks & chassis" },
    ],
    sortingTip: "Remove heavy concrete counterweights from washing machines before weighing scrap metals.",
    eprComplianceGuidance: "Refrigerators and AC compressors require authorized degasification to prevent CFC/HFC release.",
    baseBenchmarkPerKg: 40,
    expectedRecyclerPerKg: 60,
  },
};

export function getMaterialAdvice(categoryKey: string): MaterialAdvice {
  if (MATERIAL_AI_CATALOG[categoryKey]) {
    return MATERIAL_AI_CATALOG[categoryKey];
  }

  // Fallback to scrap pricing catalog or generic ewaste
  const item = SCRAP_PRICE_CATALOG.find((s) => s.key === categoryKey);
  return {
    categoryKey: categoryKey,
    displayName: item?.nameEn ?? "Mixed Scrap Material",
    criticalMinerals: [
      { name: "Base Metals", symbol: "Metals", economicValue: "High", industrialUse: "Industrial secondary smelting" },
    ],
    sortingTip: "Segregate clean non-ferrous metals from ferrous steel for better resale margins.",
    eprComplianceGuidance: "Dispose through authorized municipal or CPCB channels.",
    baseBenchmarkPerKg: item?.defaultBuyRate ?? 30,
    expectedRecyclerPerKg: item?.expectedOfficerRate ?? 45,
  };
}

export function estimateMaterialValuation(
  categoryKey: string,
  weightKg: number,
  conditionGrade: "Grade A (Clean)" | "Grade B (Semi-sorted)" | "Grade C (Mixed / Wet)" = "Grade A (Clean)"
) {
  const advice = getMaterialAdvice(categoryKey);

  // Quality multiplier: Grade A = 100%, Grade B = 88%, Grade C = 75%
  const gradeFactor =
    conditionGrade.includes("Grade A") ? 1.0 : conditionGrade.includes("Grade B") ? 0.88 : 0.75;

  const effectiveBuyRate = Math.round(advice.baseBenchmarkPerKg * gradeFactor);
  const effectiveRecyclerRate = Math.round(advice.expectedRecyclerPerKg * gradeFactor);

  const buyingCost = Math.round(effectiveBuyRate * weightKg);
  const expectedRecyclerPayout = Math.round(effectiveRecyclerRate * weightKg);
  const projectedNetProfit = Math.max(0, expectedRecyclerPayout - buyingCost);

  return {
    effectiveBuyRate,
    effectiveRecyclerRate,
    buyingCost,
    expectedRecyclerPayout,
    projectedNetProfit,
    marginPerKg: effectiveRecyclerRate - effectiveBuyRate,
  };
}
