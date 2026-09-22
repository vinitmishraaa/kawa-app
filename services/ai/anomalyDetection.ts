import { SCRAP_PRICE_CATALOG } from "../../constants/scrapPricing";

export interface AnomalyReport {
  isAnomaly: boolean;
  severity: "none" | "low" | "medium" | "high";
  percentageDeviation: number;
  benchmarkPrice: number;
  expectedRange: { min: number; max: number };
  warningTitle?: string;
  warningMessage?: string;
  recommendedAction?: string;
}

/**
 * AI/ML Transaction Price Anomaly Detector
 * Inspects quoted transaction values against historical CPCB mandi benchmarks.
 * Prevents exploitation of informal collectors (prices set too low)
 * and flags typographical/fraudulent inputs (prices set unnaturally high).
 */
export function detectPriceAnomaly(
  categoryKey: string,
  enteredRatePerKg: number,
  isRecyclerSale: boolean = false
): AnomalyReport {
  const item = SCRAP_PRICE_CATALOG.find((s) => s.key === categoryKey);
  const benchmark = isRecyclerSale
    ? item?.expectedOfficerRate ?? 50
    : item?.defaultBuyRate ?? 35;

  if (enteredRatePerKg <= 0 || !benchmark) {
    return {
      isAnomaly: false,
      severity: "none",
      percentageDeviation: 0,
      benchmarkPrice: benchmark,
      expectedRange: { min: Math.round(benchmark * 0.7), max: Math.round(benchmark * 1.3) },
    };
  }

  const deviation = ((enteredRatePerKg - benchmark) / benchmark) * 100;
  const absDev = Math.abs(deviation);

  // Normal safe range: Within -30% to +40% of benchmark
  if (deviation >= -30 && deviation <= 40) {
    return {
      isAnomaly: false,
      severity: "none",
      percentageDeviation: Math.round(deviation),
      benchmarkPrice: benchmark,
      expectedRange: { min: Math.round(benchmark * 0.7), max: Math.round(benchmark * 1.4) },
    };
  }

  // Abnormally Low: collector is being underpaid / exploiting informal collector
  if (deviation < -30) {
    const severity = deviation < -60 ? "high" : "medium";
    return {
      isAnomaly: true,
      severity,
      percentageDeviation: Math.round(deviation),
      benchmarkPrice: benchmark,
      expectedRange: { min: Math.round(benchmark * 0.75), max: Math.round(benchmark * 1.35) },
      warningTitle: "⚠️ Abnormal Low Price Alert (भाव बहुत कम है)",
      warningMessage: `Entered rate (₹${enteredRatePerKg}/kg) is ${Math.abs(Math.round(deviation))}% below prevailing CPCB mandi benchmark (₹${benchmark}/kg).`,
      recommendedAction: "Informal collectors should not accept below-market rates. Review weight or negotiate with authorized recycler.",
    };
  }

  // Abnormally High: potential typo (e.g. ₹500/kg for glass or extra 0 added)
  const severity = deviation > 150 ? "high" : "medium";
  return {
    isAnomaly: true,
    severity,
    percentageDeviation: Math.round(deviation),
    benchmarkPrice: benchmark,
    expectedRange: { min: Math.round(benchmark * 0.75), max: Math.round(benchmark * 1.35) },
    warningTitle: "⚠️ Inconsistent High Rate (भाव अस्वाभाविक रूप से अधिक)",
    warningMessage: `Entered rate (₹${enteredRatePerKg}/kg) is ${Math.round(deviation)}% higher than standard benchmark (₹${benchmark}/kg).`,
    recommendedAction: "Please double check if weight and price fields were swapped, or if an extra zero was typed.",
  };
}
