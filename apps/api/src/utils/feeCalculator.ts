export type FeeType = "sale" | "transfer" | "lease" | "general";

type FeeBreakdown = {
  stampDuty: number;
  cvt: number;
  total: number;
};

const RATE_BY_TYPE: Record<FeeType, { stampDuty: number; cvt: number }> = {
  sale: { stampDuty: 0.03, cvt: 0.02 },
  transfer: { stampDuty: 0.025, cvt: 0.015 },
  lease: { stampDuty: 0.01, cvt: 0.005 },
  general: { stampDuty: 0.02, cvt: 0.01 },
};

export function calculateFees(amount: number, type: string): FeeBreakdown {
  const normalized = Number.isFinite(amount) && amount > 0 ? amount : 0;
  const key = (type in RATE_BY_TYPE ? type : "general") as FeeType;
  const rates = RATE_BY_TYPE[key];
  const stampDuty = round2(normalized * rates.stampDuty);
  const cvt = round2(normalized * rates.cvt);
  return {
    stampDuty,
    cvt,
    total: round2(normalized + stampDuty + cvt),
  };
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}
