'use client';

import { useState, useRef, useEffect } from "react";
import { Calendar, ChevronLeft, ChevronRight, X } from "lucide-react";

interface QuarterPickerProps {
  value: string;
  onChange: (value: string) => void;
}

export function QuarterPicker({ value, onChange }: QuarterPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [year, setYear] = useState(2026);
  const [startQuarter, setStartQuarter] = useState<number | null>(1);
  const [endQuarter, setEndQuarter] = useState<number | null>(1);
  const [isSelectingEnd, setIsSelectingEnd] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const quarters = [
    { id: 1, label: "Q1", fullLabel: "1분기" },
    { id: 2, label: "Q2", fullLabel: "2분기" },
    { id: 3, label: "Q3", fullLabel: "3분기" },
    { id: 4, label: "Q4", fullLabel: "4분기" },
  ];

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const handleQuarterClick = (quarterId: number) => {
    if (!isSelectingEnd) {
      // 시작 분기 선택
      setStartQuarter(quarterId);
      setEndQuarter(null);
      setIsSelectingEnd(true);
    } else {
      // 종료 분기 선택
      if (startQuarter && quarterId < startQuarter) {
        // 시작보다 이전 분기를 선택하면 시작 분기를 재설정
        setStartQuarter(quarterId);
        setEndQuarter(null);
      } else {
        setEndQuarter(quarterId);
        // 선택 완료
        const periodText = startQuarter === quarterId 
          ? `${year}년 ${quarters[startQuarter - 1].label}`
          : `${year}년 ${quarters[startQuarter! - 1].label} ~ ${year}년 ${quarters[quarterId - 1].label}`;
        onChange(periodText);
        setIsSelectingEnd(false);
        setIsOpen(false);
      }
    }
  };

  const handleReset = () => {
    setStartQuarter(null);
    setEndQuarter(null);
    setIsSelectingEnd(false);
  };

  const getQuarterStyle = (quarterId: number) => {
    const isSelected = startQuarter === quarterId && !isSelectingEnd;
    const isInRange = startQuarter && endQuarter && quarterId >= startQuarter && quarterId <= endQuarter;
    const isStart = startQuarter === quarterId && isSelectingEnd;

    if (isSelected || isInRange) {
      return {
        background: 'linear-gradient(90deg, #5B3BFA 0%, #00B4FF 100%)',
        color: 'white',
        fontWeight: 700
      };
    }

    if (isStart) {
      return {
        backgroundColor: '#E3F2FD',
        color: '#5B3BFA',
        fontWeight: 600,
        border: '2px solid #5B3BFA'
      };
    }

    return {
      backgroundColor: 'white',
      color: '#616161',
      fontWeight: 500,
      border: '1px solid #E0E0E0'
    };
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Input Field */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-3 rounded-lg border flex items-center justify-between transition-all"
        style={{ 
          fontSize: '14px', 
          fontWeight: 500,
          borderColor: isOpen ? '#5B3BFA' : '#E0E0E0',
          backgroundColor: 'white'
        }}
      >
        <span style={{ color: value ? 'var(--aifix-navy)' : '#9E9E9E' }}>
          {value || "기간을 선택하세요"}
        </span>
        <Calendar className="w-4 h-4" style={{ color: '#9E9E9E' }} />
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div 
          className="absolute top-full left-0 right-0 mt-2 bg-white rounded-lg shadow-xl z-50"
          style={{ 
            boxShadow: '0px 8px 24px rgba(0, 0, 0, 0.12)',
            border: '1px solid #E0E0E0'
          }}
        >
          <div className="p-4">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--aifix-navy)' }}>
                기간
              </span>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 rounded hover:bg-gray-100"
                style={{ border: 'none', background: 'transparent', cursor: 'pointer' }}
              >
                <X className="w-4 h-4" style={{ color: '#9E9E9E' }} />
              </button>
            </div>

            {/* Year Selector */}
            <div className="flex items-center justify-between mb-4">
              <button
                onClick={() => setYear(year - 1)}
                className="p-2 rounded hover:bg-gray-100"
                style={{ border: 'none', background: 'transparent', cursor: 'pointer' }}
              >
                <ChevronLeft className="w-4 h-4" style={{ color: 'var(--aifix-navy)' }} />
              </button>
              <span style={{ fontSize: '16px', fontWeight: 700, color: 'var(--aifix-navy)' }}>
                {year}년
              </span>
              <button
                onClick={() => setYear(year + 1)}
                className="p-2 rounded hover:bg-gray-100"
                style={{ border: 'none', background: 'transparent', cursor: 'pointer' }}
              >
                <ChevronRight className="w-4 h-4" style={{ color: 'var(--aifix-navy)' }} />
              </button>
            </div>

            {/* Quarter Grid */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              {quarters.map((quarter) => (
                <button
                  key={quarter.id}
                  onClick={() => handleQuarterClick(quarter.id)}
                  className="py-4 rounded-lg text-center transition-all"
                  style={getQuarterStyle(quarter.id)}
                >
                  <div style={{ fontSize: '12px', marginBottom: '4px', opacity: 0.8 }}>
                    {quarter.label}
                  </div>
                  <div style={{ fontSize: '14px' }}>
                    {quarter.fullLabel}
                  </div>
                </button>
              ))}
            </div>

            {/* Footer Actions */}
            <div className="flex items-center justify-between pt-3 border-t" style={{ borderColor: '#E0E0E0' }}>
              <button
                onClick={handleReset}
                className="text-sm px-3 py-1.5 rounded transition-colors"
                style={{
                  color: '#9E9E9E',
                  fontWeight: 500,
                  border: 'none',
                  background: 'transparent',
                  cursor: 'pointer'
                }}
              >
                선택 초기화
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="text-sm px-4 py-1.5 rounded transition-colors"
                style={{
                  background: 'linear-gradient(90deg, #5B3BFA 0%, #00B4FF 100%)',
                  color: 'white',
                  fontWeight: 600,
                  border: 'none',
                  cursor: 'pointer'
                }}
              >
                선택 완료
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
