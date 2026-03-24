'use client';

import { useState, useRef, useEffect } from "react";
import { Calendar, ChevronLeft, ChevronRight, X } from "lucide-react";

type QuarterPickerProps = {
  value: string;
  onChange: (value: string) => void;
};

export function QuarterPicker({ value, onChange }: QuarterPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedYear, setSelectedYear] = useState(2026);
  const [selectedQuarter, setSelectedQuarter] = useState<string>("Q1");
  const dropdownRef = useRef<HTMLDivElement>(null);

  // value를 파싱하여 초기 상태 설정
  useEffect(() => {
    const match = value.match(/(\d{4})\s+(Q\d)/);
    if (match) {
      setSelectedYear(parseInt(match[1]));
      setSelectedQuarter(match[2]);
    }
  }, [value]);

  // 외부 클릭 감지
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const quarters = [
    { id: "Q1", label: "1분기" },
    { id: "Q2", label: "2분기" },
    { id: "Q3", label: "3분기" },
    { id: "Q4", label: "4분기" }
  ];

  const handleQuarterSelect = (quarter: string) => {
    setSelectedQuarter(quarter);
  };

  const handleConfirm = () => {
    onChange(`${selectedYear} ${selectedQuarter}`);
    setIsOpen(false);
  };

  const handleReset = () => {
    setSelectedYear(2026);
    setSelectedQuarter("Q1");
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* 트리거 버튼 */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center gap-3 bg-white px-4 py-3 rounded-xl border border-gray-200 hover:border-gray-300 transition-colors"
      >
        <Calendar className="w-5 h-5" style={{ color: 'var(--aifix-primary)' }} />
        <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--aifix-gray)' }}>
          기간 선택
        </span>
        <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--aifix-navy)' }}>
          {value}
        </span>
      </button>

      {/* 드롭다운 팝오버 */}
      {isOpen && (
        <div
          className="absolute top-full left-0 mt-2 bg-white rounded-2xl border border-gray-200 p-6 z-50"
          style={{
            width: '320px',
            boxShadow: '0px 8px 24px rgba(0, 0, 0, 0.12)'
          }}
        >
          {/* 헤더 - 연도 선택 */}
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={() => setSelectedYear(selectedYear - 1)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ChevronLeft className="w-5 h-5" style={{ color: 'var(--aifix-gray)' }} />
            </button>
            
            <span style={{ fontSize: '18px', fontWeight: 700, color: 'var(--aifix-navy)' }}>
              {selectedYear}년
            </span>
            
            <button
              onClick={() => setSelectedYear(selectedYear + 1)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ChevronRight className="w-5 h-5" style={{ color: 'var(--aifix-gray)' }} />
            </button>
          </div>

          {/* 분기 선택 그리드 */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            {quarters.map((quarter) => {
              const isSelected = quarter.id === selectedQuarter;
              return (
                <button
                  key={quarter.id}
                  onClick={() => handleQuarterSelect(quarter.id)}
                  className="py-4 rounded-xl transition-all"
                  style={{
                    background: isSelected
                      ? 'var(--aifix-primary)'
                      : '#F5F3FF',
                    color: isSelected ? 'white' : 'var(--aifix-primary)',
                    fontWeight: 600,
                    fontSize: '14px'
                  }}
                >
                  <div style={{ fontSize: '13px', opacity: 0.8, marginBottom: '4px' }}>
                    {quarter.id}
                  </div>
                  <div>{quarter.label}</div>
                </button>
              );
            })}
          </div>

          {/* 하단 액션 버튼 */}
          <div className="flex items-center justify-between pt-4 border-t border-gray-200">
            <button
              onClick={handleReset}
              style={{ fontSize: '14px', color: 'var(--aifix-gray)' }}
              className="hover:underline"
            >
              초기화
            </button>
            <button
              onClick={handleConfirm}
              className="px-5 py-2 rounded-lg"
              style={{
                background: 'var(--aifix-primary)',
                color: 'white',
                fontWeight: 600,
                fontSize: '14px'
              }}
            >
              선택 완료
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
