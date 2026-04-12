import {
  PCFCalculation,
  type PcfCalculationLinkedProject,
} from "../shared/PCFCalculation";

export function NonTier1PCFSubmit({
  tier,
  supplierType = "",
  linkedProject = null,
}: {
  tier: "tier2" | "tier3";
  supplierType?: string;
  linkedProject?: PcfCalculationLinkedProject | null;
}) {
  return (
    <PCFCalculation tier={tier} supplierType={supplierType} linkedProject={linkedProject} />
  );
}
