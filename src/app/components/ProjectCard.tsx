'use client';

import Link from "next/link";
import { Hash, Calendar, FileText, Clock, ArrowRight } from "lucide-react";
import { useState } from "react";

type ProjectCardProps = {
  id: string;
  project_id: number;
  name: string;
  productItemNumber: string;
  contractPeriod: string;
  contractNumber: string;
  lastSubmission: string | null;
  status: string;
  /** API 호환용 (카드에는 표시하지 않음) */
  tier?: string;
  profile_id?: number;
  supplier_id?: number;
  my_supply_chain_node_id?: number | null;
};

export function ProjectCard({
  id: _id,
  project_id,
  name,
  productItemNumber,
  contractPeriod,
  contractNumber,
  lastSubmission,
  status,
  tier: _tier,
  profile_id,
  supplier_id,
  my_supply_chain_node_id,
}: ProjectCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  
  const statusColors = {
    "진행중": { bg: "#E9F5FF", text: "#00B4FF" },
    "검토중": { bg: "#FFF4E6", text: "#FF9800" },
    "완료": { bg: "#E8F5E9", text: "#4CAF50" },
  };

  const statusColor = statusColors[status as keyof typeof statusColors] || statusColors["진행중"];

  const projectUrl = supplier_id 
    ? `/projects/${project_id}?supplier_id=${supplier_id}${my_supply_chain_node_id ? `&supply_chain_node_id=${my_supply_chain_node_id}` : ''}`
    : `/projects/${project_id}`;

  return (
    <Link
      href={projectUrl}
      className="block bg-white rounded-[20px] p-8 transition-all duration-300 hover:-translate-y-1 cursor-pointer relative"
      style={{
        boxShadow: isHovered 
          ? "0px 8px 24px rgba(0, 0, 0, 0.12)" 
          : "0px 4px 16px rgba(0, 0, 0, 0.05)",
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Arrow Icon */}
      <div 
        className="absolute top-6 right-6 transition-all duration-300"
        style={{ 
          opacity: isHovered ? 1 : 0,
          transform: isHovered ? 'translateX(0)' : 'translateX(-4px)',
        }}
      >
        <ArrowRight 
          className="w-6 h-6" 
          style={{ color: 'var(--aifix-primary)' }} 
        />
      </div>

      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-3 flex-wrap">
          <span
            className="px-3 py-1 rounded-lg"
            style={{
              backgroundColor: statusColor.bg,
              color: statusColor.text,
              fontSize: "14px",
              fontWeight: 600,
            }}
          >
            {status}
          </span>
        </div>
        <h3 
          className="text-2xl mb-1 transition-colors duration-300 pr-8" 
          style={{ 
            fontWeight: 700, 
            color: isHovered ? 'var(--aifix-primary)' : 'var(--aifix-navy)',
          }}
        >
          {name}
        </h3>
      </div>

      {/* Project Details */}
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <Hash className="w-4 h-4" style={{ color: 'var(--aifix-gray)' }} />
          <span style={{ fontSize: '15px', color: 'var(--aifix-gray)' }}>품목 번호:</span>
          <span style={{ fontSize: '15px', color: 'var(--aifix-navy)', fontWeight: 500 }}>
            {productItemNumber}
          </span>
        </div>

        <div className="flex items-center gap-3">
          <Calendar className="w-4 h-4" style={{ color: 'var(--aifix-gray)' }} />
          <span style={{ fontSize: '15px', color: 'var(--aifix-gray)' }}>계약기간:</span>
          <span style={{ fontSize: '15px', color: 'var(--aifix-navy)', fontWeight: 500 }}>
            {contractPeriod}
          </span>
        </div>

        <div className="flex items-center gap-3">
          <FileText className="w-4 h-4" style={{ color: 'var(--aifix-gray)' }} />
          <span style={{ fontSize: '15px', color: 'var(--aifix-gray)' }}>계약번호:</span>
          <span style={{ fontSize: '15px', color: 'var(--aifix-navy)', fontWeight: 500 }}>
            {contractNumber}
          </span>
        </div>

        <div className="flex items-center gap-3 pt-3 mt-3 border-t border-gray-100">
          <Clock className="w-4 h-4" style={{ color: 'var(--aifix-gray)' }} />
          <span style={{ fontSize: '15px', color: 'var(--aifix-gray)' }}>최근 제출일:</span>
          <span style={{ fontSize: '15px', color: 'var(--aifix-navy)', fontWeight: 500 }}>
            {lastSubmission || "제출 내역 없음"}
          </span>
        </div>
      </div>
    </Link>
  );
}
