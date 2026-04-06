'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import {
  restoreSupSessionFromCookie,
  AIFIXR_SESSION_UPDATED_EVENT,
} from "@/lib/api/client";
import {
  createMySupplierWorkplace,
  deleteMySupplierWorkplace,
  listMySupplierWorkplaces,
  patchMySupplierWorkplace,
  type SupplierOrgWorkplaceRow,
} from "@/lib/api/supplierWorkplaces";

export interface Site {
  /** DB PK (sup_organization_workplaces.id) */
  serverId?: number;
  /** 목록·선택용 안정 키 (종사업장번호 → wp-{id}) */
  id: string;
  name: string;
  businessRegNo: string;
  branchWorkplaceNo: string;
  country: string;
  address: string;
  representative: string;
  email: string;
  phone: string;
  renewableEnergy: string;
  certification: string;
  rmiSmelter: string;
  feoc: string;
}

export function workplaceRowToSite(row: SupplierOrgWorkplaceRow): Site {
  const branchNo = (row.branch_workplace_no ?? "").trim();
  const id = branchNo || `wp-${row.id}`;
  return {
    serverId: row.id,
    id,
    name: row.workplace_name,
    businessRegNo: (row.business_reg_no ?? "").trim(),
    branchWorkplaceNo: branchNo,
    country: row.country ?? "",
    address: row.address ?? "",
    representative: row.rep_name ?? "",
    email: row.rep_email ?? "",
    phone: row.rep_contact ?? "",
    renewableEnergy: "",
    certification: "",
    rmiSmelter: row.rmi_smelter ?? "",
    feoc: row.feoc_status ?? "",
  };
}

export function siteToCreateBody(site: Site): Parameters<typeof createMySupplierWorkplace>[0] {
  return {
    workplace_name: site.name.trim(),
    business_reg_no: site.businessRegNo.trim() || null,
    branch_workplace_no: site.branchWorkplaceNo.trim() || null,
    country: site.country.trim() || null,
    address: site.address.trim() || null,
    rep_name: site.representative.trim() || null,
    rep_email: site.email.trim() || null,
    rep_contact: site.phone.trim() || null,
    rmi_smelter: site.rmiSmelter.trim() || null,
    feoc_status: site.feoc.trim() || null,
  };
}

function siteToPatchBody(site: Site): Record<string, string | null> {
  const b = siteToCreateBody(site);
  return {
    workplace_name: b.workplace_name,
    business_reg_no: b.business_reg_no ?? null,
    branch_workplace_no: b.branch_workplace_no ?? null,
    country: b.country ?? null,
    address: b.address ?? null,
    rep_name: b.rep_name ?? null,
    rep_email: b.rep_email ?? null,
    rep_contact: b.rep_contact ?? null,
    rmi_smelter: b.rmi_smelter ?? null,
    feoc_status: b.feoc_status ?? null,
  };
}

export const emptySiteForm = (): Site => ({
  id: "",
  name: "",
  businessRegNo: "",
  branchWorkplaceNo: "",
  country: "",
  address: "",
  representative: "",
  email: "",
  phone: "",
  renewableEnergy: "",
  certification: "",
  rmiSmelter: "",
  feoc: "",
});

interface SiteContextType {
  sites: Site[];
  sitesLoading: boolean;
  sitesError: string | null;
  refreshSites: () => Promise<void>;
  addSite: (site: Site) => Promise<Site>;
  updateSite: (serverId: number, site: Site) => Promise<Site>;
  deleteSite: (serverId: number) => Promise<void>;
}

const SiteContext = createContext<SiteContextType | undefined>(undefined);

export function SiteProvider({ children }: { children: ReactNode }) {
  const [sites, setSites] = useState<Site[]>([]);
  const [sitesLoading, setSitesLoading] = useState(false);
  const [sitesError, setSitesError] = useState<string | null>(null);

  const refreshSites = useCallback(async () => {
    setSitesLoading(true);
    setSitesError(null);
    try {
      await restoreSupSessionFromCookie();
      const rows = await listMySupplierWorkplaces();
      setSites(rows.map(workplaceRowToSite));
    } catch (e) {
      const msg = e instanceof Error ? e.message : "";
      if (msg.includes("401")) {
        setSites([]);
        setSitesError(null);
      } else {
        setSites([]);
        setSitesError(msg || "사업장 목록을 불러오지 못했습니다.");
      }
    } finally {
      setSitesLoading(false);
    }
  }, []);

  useEffect(() => {
    void refreshSites();
  }, [refreshSites]);

  useEffect(() => {
    const onSession = () => {
      void refreshSites();
    };
    if (typeof window !== "undefined") {
      window.addEventListener(AIFIXR_SESSION_UPDATED_EVENT, onSession);
    }
    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener(AIFIXR_SESSION_UPDATED_EVENT, onSession);
      }
    };
  }, [refreshSites]);

  const addSite = useCallback(async (site: Site) => {
    await restoreSupSessionFromCookie();
    const created = await createMySupplierWorkplace(siteToCreateBody(site));
    const mapped = workplaceRowToSite(created);
    setSites((prev) => [...prev, mapped]);
    return mapped;
  }, []);

  const updateSite = useCallback(async (serverId: number, site: Site) => {
    await restoreSupSessionFromCookie();
    const updated = await patchMySupplierWorkplace(serverId, siteToPatchBody(site));
    const mapped = workplaceRowToSite(updated);
    setSites((prev) => prev.map((s) => (s.serverId === serverId ? mapped : s)));
    return mapped;
  }, []);

  const deleteSite = useCallback(async (serverId: number) => {
    await restoreSupSessionFromCookie();
    await deleteMySupplierWorkplace(serverId);
    setSites((prev) => prev.filter((s) => s.serverId !== serverId));
  }, []);

  return (
    <SiteContext.Provider
      value={{
        sites,
        sitesLoading,
        sitesError,
        refreshSites,
        addSite,
        updateSite,
        deleteSite,
      }}
    >
      {children}
    </SiteContext.Provider>
  );
}

export function useSites() {
  const context = useContext(SiteContext);
  if (context === undefined) {
    throw new Error("useSites must be used within a SiteProvider");
  }
  return context;
}
