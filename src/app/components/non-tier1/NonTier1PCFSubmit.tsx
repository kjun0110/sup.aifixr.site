import { PCFCalculation } from "../shared/PCFCalculation";

export function NonTier1PCFSubmit({ tier }: { tier: "tier2" | "tier3" }) {
  return <PCFCalculation tier={tier} />;
}
