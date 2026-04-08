import { PCFCalculation } from "../shared/PCFCalculation";

export function NonTier1PCFSubmit({
  tier,
  supplierType = "",
}: {
  tier: "tier2" | "tier3";
  supplierType?: string;
}) {
  return <PCFCalculation tier={tier} supplierType={supplierType} />;
}
