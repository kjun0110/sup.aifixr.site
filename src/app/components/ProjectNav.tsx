'use client';

import { useState } from "react";
import { 
  LayoutDashboard, 
  Network, 
  Database, 
  Search, 
  Send, 
  Eye 
} from "lucide-react";

type ProjectNavProps = {
  tier: "tier1" | "tier2" | "tier3";
  projectName: string;
  clientName: string;
  contractNumber: string;
  activeTab: string;
  onTabChange: (tabId: string) => void;
};

export function ProjectNav({ 
  tier, 
  projectName, 
  clientName, 
  contractNumber,
  activeTab,
  onTabChange 
}: ProjectNavProps) {
  // 모든 차수가 동일한 탭 구조 사용 (권한만 다름)
  const tabs = [
    { id: "dashboard", label: "대시보드", icon: LayoutDashboard },
    { id: "supply-chain", label: "공급망 관리", icon: Network },
    { id: "data-mgmt", label: "데이터 관리", icon: Database },
    { id: "pcf-submit", label: "PCF 산정", icon: Eye },
    { id: "transmission", label: "전송", icon: Send },
  ];

  return (
    <div className="bg-white border-b border-gray-200">
      <div className="max-w-[1600px] mx-auto">
        {/* Project Header */}
        <div className="py-6 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl mb-2" style={{ fontWeight: 700, color: 'var(--aifix-navy)' }}>
                {projectName}
              </h2>
              <div className="flex items-center gap-6" style={{ fontSize: '15px', color: 'var(--aifix-gray)' }}>
                <span>요청 기업: <strong style={{ color: 'var(--aifix-navy)' }}>{clientName}</strong></span>
                <span>계약번호: <strong style={{ color: 'var(--aifix-navy)' }}>{contractNumber}</strong></span>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 pt-2">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className="flex items-center gap-2 px-6 py-4 border-b-2 transition-all duration-200"
                style={{
                  borderBottomColor: isActive ? 'var(--aifix-primary)' : 'transparent',
                  color: isActive ? 'var(--aifix-primary)' : 'var(--aifix-gray)',
                  fontWeight: isActive ? 600 : 400,
                }}
              >
                <Icon className="w-5 h-5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}