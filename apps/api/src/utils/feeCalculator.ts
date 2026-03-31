export type FeeType = "sale" | "transfer" | "lease" | "general";

const RATE_BY_TYPE: Record<FeeType, { stampDuty: number; cvt: number }> = {
  sale: { stampDuty: 0.03, cvt: 0.02 },
  transfer: { stampDuty: 0.025, cvt: 0.015 },
  lease: { stampDuty: 0.01, cvt: 0.005 },
  general: { stampDuty: 0.02, cvt: 0.01 },
};

export function calculateFees(amount: number, type: string) {
  const base = Number.isFinite(amount) && amount > 0 ? amount : 0;
  const feeType = (type in RATE_BY_TYPE ? type : "general") as FeeType;
  const rates = RATE_BY_TYPE[feeType];
  const stampDuty = round2(base * rates.stampDuty);
  const cvt = round2(base * rates.cvt);
  return {
    stampDuty,
    cvt,
    total: round2(base + stampDuty + cvt),
  };
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}
