'use client';

import { createContext, useContext, useState, ReactNode } from 'react';

export interface Site {
  id: string;
  name: string;
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

interface SiteContextType {
  sites: Site[];
  addSite: (site: Site) => void;
  updateSite: (id: string, site: Site) => void;
  deleteSite: (id: string) => void;
}

const SiteContext = createContext<SiteContextType | undefined>(undefined);

// Initial mock sites
const initialSites: Site[] = [
  {
    id: "FAC-HQ",
    name: "본사",
    country: "South Korea",
    address: "Seoul, South Korea",
    representative: "김대표",
    email: "ceo@ourcompany.co.kr",
    phone: "+82-2-1234-5678",
    renewableEnergy: "사용",
    certification: "ISO 14001, ISO 9001",
    rmiSmelter: "인증됨",
    feoc: "해당",
  },
  {
    id: "FAC-CA",
    name: "천안공장",
    country: "South Korea",
    address: "Cheonan-si, Chungcheongnam-do, South Korea",
    representative: "박공장장",
    email: "park@ourcompany.co.kr",
    phone: "+82-41-1234-5678",
    renewableEnergy: "사용",
    certification: "ISO 14001",
    rmiSmelter: "인증됨",
    feoc: "해당",
  },
];

export function SiteProvider({ children }: { children: ReactNode }) {
  const [sites, setSites] = useState<Site[]>(initialSites);

  const addSite = (site: Site) => {
    setSites([...sites, site]);
  };

  const updateSite = (id: string, updatedSite: Site) => {
    setSites(sites.map(site => site.id === id ? updatedSite : site));
  };

  const deleteSite = (id: string) => {
    setSites(sites.filter(site => site.id !== id));
  };

  return (
    <SiteContext.Provider value={{ sites, addSite, updateSite, deleteSite }}>
      {children}
    </SiteContext.Provider>
  );
}

export function useSites() {
  const context = useContext(SiteContext);
  if (context === undefined) {
    throw new Error('useSites must be used within a SiteProvider');
  }
  return context;
}
