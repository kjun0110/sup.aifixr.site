import { PCFCalculation } from "../shared/PCFCalculation";

export function Tier1PCFSubmit({ supplierType = "" }: { supplierType?: string }) {
  return <PCFCalculation tier="tier1" supplierType={supplierType} />;
}
