'use client';

import { useEffect, useRef, useState } from 'react';
import { Calendar, ChevronLeft, ChevronRight, X } from 'lucide-react';

export type MonthPickerProps = {
  value: string;
  onChange: (value: string) => void;
};

export function MonthPicker({ value, onChange }: MonthPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number>(1);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const matches = [...value.matchAll(/(\d{4})\s*년\s*(\d{1,2})\s*월/g)];
    const match = matches.length > 0 ? matches[0] : null;
    if (match) {
      setSelectedYear(parseInt(match[1], 10));
      setSelectedMonth(parseInt(match[2], 10));
    }
  }, [value]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    if (isOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const months = Array.from({ length: 12 }, (_, i) => {
    const id = i + 1;
    return { id, label: `${id}월` };
  });

  const handleMonthClick = (monthId: number) => {
    setSelectedMonth(monthId);
    onChange(`${selectedYear}년 ${monthId}월`);
    setIsOpen(false);
  };

  const handleClear = () => {
    onChange('');
    setIsOpen(false);
  };

  return (
    <div className="relative w-full" ref={dropdownRef}>
      {/* Input Field - 원청사 프로젝트 기간 디자인과 동일 */}
      <div
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center justify-between w-full px-4 py-2.5 border rounded-xl cursor-pointer transition-all hover:border-[#5B3BFA] ${
          isOpen ? 'border-[#5B3BFA] ring-2 ring-purple-100' : 'border-gray-300'
        }`}
      >
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-gray-500 shrink-0" />
          <span className={`text-sm ${value ? 'text-gray-900' : 'text-gray-400'}`}>
            {value || '선택해주세요'}
          </span>
        </div>
        {value && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleClear();
            }}
            className="p-1 hover:bg-gray-100 rounded transition-colors shrink-0"
          >
            <X className="w-3 h-3 text-gray-500" />
          </button>
        )}
      </div>

      {/* Popup - 원청사 MonthRangePicker와 동일한 사이즈·디자인 */}
      {isOpen && (
        <div
          className="absolute top-full left-0 mt-2 bg-white rounded-xl shadow-2xl border border-gray-200 z-50"
          style={{ width: '420px' }}
        >
          {/* Year Navigation */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <button
              onClick={() => setSelectedYear(selectedYear - 1)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              type="button"
            >
              <ChevronLeft className="w-5 h-5 text-gray-600" />
            </button>
            <div className="text-lg font-bold text-gray-900">{selectedYear}년</div>
            <button
              onClick={() => setSelectedYear(selectedYear + 1)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              type="button"
            >
              <ChevronRight className="w-5 h-5 text-gray-600" />
            </button>
          </div>

          {/* Month Grid - 3x4 */}
          <div className="p-4">
            <div className="grid grid-cols-3 gap-2">
              {months.map((m) => {
                const isSelected = selectedMonth === m.id;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => handleMonthClick(m.id)}
                    className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
                      isSelected ? 'text-white shadow-md' : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                    }`}
                    style={
                      isSelected
                        ? { background: 'linear-gradient(90deg, #5B3BFA 0%, #00B4FF 100%)' }
                        : undefined
                    }
                  >
                    {m.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
