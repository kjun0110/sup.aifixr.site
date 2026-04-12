import {
  PCFCalculation,
  type PcfCalculationLinkedProject,
} from "../shared/PCFCalculation";

export function Tier1PCFSubmit({
  supplierType = "",
  linkedProject = null,
}: {
  supplierType?: string;
  linkedProject?: PcfCalculationLinkedProject | null;
}) {
  return (
    <PCFCalculation tier="tier1" supplierType={supplierType} linkedProject={linkedProject} />
  );
}
