'use client';

import { useMemo, useRef, useState } from 'react';
import { ScanText, Upload, Filter, X, FileUp } from 'lucide-react';
import { toast } from 'sonner';
import { MonthPicker } from './MonthPicker';

export type OcrMonthlyMetrics = {
  electricityKwh: number;
  production: number;
  temperatureC: number;
  wasteTon: number;
  sourceFileName: string;
  updatedAtIso: string;
};

function parseKoreanMonthLabel(s: string): string | null {
  const m = s.trim().match(/^(\d{4})년\s*(\d{1,2})월$/);
  if (!m) return null;
  const y = m[1];
  const mo = String(parseInt(m[2], 10)).padStart(2, '0');
  return `${y}-${mo}`;
}

function ymToKoreanLabel(ym: string): string {
  const [y, mo] = ym.split('-');
  if (!y || !mo) return ym;
  return `${y}년 ${parseInt(mo, 10)}월`;
}

/** 파일명·월 기반 데모 OCR 추출값 (실서비스에서는 OCR API 응답으로 대체) */
function demoOcrMetrics(ym: string, fileName: string): Omit<OcrMonthlyMetrics, 'sourceFileName' | 'updatedAtIso'> {
  const seed = `${ym}|${fileName}`;
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  const u = () => {
    h ^= h << 13;
    h ^= h >>> 17;
    h ^= h << 5;
    return (h >>> 0) / 2 ** 32;
  };
  return {
    electricityKwh: Math.round(82_000 + u() * 98_000),
    production: Math.round(5_800 + u() * 19_000),
    temperatureC: Math.round((16.5 + u() * 16) * 10) / 10,
    wasteTon: Math.round((2.8 + u() * 44) * 100) / 100,
  };
}

/** OCR데이터 입력 — 월별 조회 + 업로드 모달로 스키마(전력·생산·온도·폐기물) 반영 */
export function OcrDataInput() {
  const [monthPickerValue, setMonthPickerValue] = useState('');
  const [viewYm, setViewYm] = useState<string | null>(null);
  const [hasQueried, setHasQueried] = useState(false);
  const [metricsByYm, setMetricsByYm] = useState<Record<string, OcrMonthlyMetrics>>({});
  const [uploadOpen, setUploadOpen] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const nf = useMemo(
    () => new Intl.NumberFormat('ko-KR', { maximumFractionDigits: 1 }),
    [],
  );
  const ni = useMemo(() => new Intl.NumberFormat('ko-KR'), []);

  const currentMetrics = viewYm ? metricsByYm[viewYm] : undefined;

  const handleQuery = () => {
    const ym = parseKoreanMonthLabel(monthPickerValue);
    if (!ym) {
      toast.error('조회할 월을 선택해 주세요.');
      return;
    }
    setViewYm(ym);
    setHasQueried(true);
    toast.success(`${ymToKoreanLabel(ym)} 기준으로 조회했습니다.`);
  };

  const handleReset = () => {
    setMonthPickerValue('');
    setViewYm(null);
    setHasQueried(false);
    setUploadOpen(false);
    setSelectedFile(null);
  };

  const openUploadModal = () => {
    if (!viewYm) {
      toast.error('먼저 월을 선택하고 조회해 주세요.');
      return;
    }
    setSelectedFile(null);
    setUploadOpen(true);
  };

  const applyUpload = () => {
    if (!viewYm || !selectedFile) {
      toast.error('파일을 선택해 주세요.');
      return;
    }
    const demo = demoOcrMetrics(viewYm, selectedFile.name);
    const row: OcrMonthlyMetrics = {
      ...demo,
      sourceFileName: selectedFile.name,
      updatedAtIso: new Date().toISOString(),
    };
    setMetricsByYm((prev) => ({ ...prev, [viewYm]: row }));
    setUploadOpen(false);
    setSelectedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    toast.success('OCR 처리를 완료했습니다. 아래 스키마에 반영되었습니다. (데모)');
  };

  const onDropFile = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files?.[0];
    if (f) setSelectedFile(f);
  };

  const gradientBtn =
    'linear-gradient(90deg, #5B3BFA 0%, #00B4FF 100%)';

  return (
    <div className="max-w-[1600px] mx-auto px-8 pt-8 pb-16 space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2" style={{ color: 'var(--aifix-navy)' }}>
          OCR데이터 입력
        </h1>
        <p className="text-[15px]" style={{ color: 'var(--aifix-gray)' }}>
          월을 선택해 조회한 뒤, OCR 파일을 올리면 전력·생산·온도·폐기물 항목에 반영됩니다. (현재는 데모
          추출)
        </p>
      </div>

      <div
        className="bg-white p-8"
        style={{ borderRadius: '20px', boxShadow: '0px 4px 16px rgba(0,0,0,0.05)' }}
      >
        <h2 className="text-xl font-semibold mb-6" style={{ color: 'var(--aifix-navy)' }}>
          조회 조건
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-700">
              조회 월 <span className="text-red-500">*</span>
            </label>
            <MonthPicker value={monthPickerValue} onChange={setMonthPickerValue} />
            <p className="mt-2 text-xs text-gray-500">
              해당 월의 I/F·OCR 반영 지표를 확인합니다.
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={handleQuery}
            className="px-6 py-3 text-white rounded-xl font-medium transition-all hover:scale-[1.02]"
            style={{ background: gradientBtn, boxShadow: '0px 4px 12px rgba(91,59,250,0.2)' }}
          >
            조회
          </button>
          <button
            type="button"
            onClick={handleReset}
            className="px-6 py-3 border border-gray-300 rounded-xl font-medium hover:bg-gray-50 transition-colors"
          >
            초기화
          </button>
        </div>
      </div>

      {!hasQueried ? (
        <div
          className="bg-white p-12 text-center"
          style={{ borderRadius: '20px', boxShadow: '0px 4px 16px rgba(0,0,0,0.05)' }}
        >
          <Filter className="w-16 h-16 mx-auto mb-4 text-gray-300" />
          <p className="text-gray-500 text-lg">조회 월을 선택한 뒤 조회 버튼을 눌러주세요</p>
        </div>
      ) : (
        <div
          className="bg-white overflow-hidden"
          style={{ borderRadius: '20px', boxShadow: '0px 4px 16px rgba(0,0,0,0.05)' }}
        >
          <div className="px-8 py-5 border-b border-gray-100 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-semibold" style={{ color: 'var(--aifix-navy)' }}>
                월별 인터페이스 · OCR 반영 스키마
              </h3>
              <p className="text-sm text-gray-500 mt-1">
                {viewYm ? ymToKoreanLabel(viewYm) : ''}
                {currentMetrics?.sourceFileName
                  ? ` · 최근 파일: ${currentMetrics.sourceFileName}`
                  : ' · 아직 OCR 업로드 없음'}
              </p>
            </div>
            <button
              type="button"
              onClick={openUploadModal}
              className="inline-flex items-center gap-2 px-5 py-2.5 text-white rounded-xl text-sm font-medium transition-all hover:scale-[1.02]"
              style={{ background: gradientBtn }}
            >
              <Upload className="w-4 h-4" />
              OCR 파일 업로드
            </button>
          </div>

          <div className="overflow-x-auto p-6">
            <table className="w-full min-w-[640px] border-collapse text-sm">
              <thead>
                <tr className="bg-[#F8F9FA]">
                  <th
                    className="border border-gray-200 px-4 py-3 text-left font-semibold whitespace-nowrap"
                    style={{ color: 'var(--aifix-navy)' }}
                  >
                    전력사용량 (kWh)
                  </th>
                  <th
                    className="border border-gray-200 px-4 py-3 text-left font-semibold whitespace-nowrap"
                    style={{ color: 'var(--aifix-navy)' }}
                  >
                    생산량
                  </th>
                  <th
                    className="border border-gray-200 px-4 py-3 text-left font-semibold whitespace-nowrap"
                    style={{ color: 'var(--aifix-navy)' }}
                  >
                    온도 (°C)
                  </th>
                  <th
                    className="border border-gray-200 px-4 py-3 text-left font-semibold whitespace-nowrap"
                    style={{ color: 'var(--aifix-navy)' }}
                  >
                    폐기물 반출량 (ton)
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border border-gray-200 px-4 py-4 tabular-nums text-right text-gray-800">
                    {currentMetrics ? ni.format(currentMetrics.electricityKwh) : '—'}
                  </td>
                  <td className="border border-gray-200 px-4 py-4 tabular-nums text-right text-gray-800">
                    {currentMetrics ? ni.format(currentMetrics.production) : '—'}
                  </td>
                  <td className="border border-gray-200 px-4 py-4 tabular-nums text-right text-gray-800">
                    {currentMetrics ? nf.format(currentMetrics.temperatureC) : '—'}
                  </td>
                  <td className="border border-gray-200 px-4 py-4 tabular-nums text-right text-gray-800">
                    {currentMetrics ? nf.format(currentMetrics.wasteTon) : '—'}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <p className="px-8 py-4 text-xs text-gray-500 border-t border-gray-100">
            다른 월을 조회하면 해당 월에 저장된 OCR 반영 값이 표시됩니다. 실제 서비스에서는 OCR·검수 API와
            연동합니다.
          </p>
        </div>
      )}

      {uploadOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/45"
          role="dialog"
          aria-modal="true"
          aria-labelledby="ocr-upload-title"
        >
          <div
            className="bg-white w-full max-w-lg rounded-2xl shadow-xl overflow-hidden"
            style={{ boxShadow: '0px 16px 48px rgba(15,23,42,0.18)' }}
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <FileUp className="w-5 h-5" style={{ color: 'var(--aifix-primary)' }} />
                <h4 id="ocr-upload-title" className="text-lg font-semibold text-gray-900">
                  OCR 파일 업로드
                </h4>
              </div>
              <button
                type="button"
                onClick={() => {
                  setUploadOpen(false);
                  setSelectedFile(null);
                }}
                className="p-2 rounded-lg hover:bg-gray-100 text-gray-500"
                aria-label="닫기"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="px-6 py-5 space-y-4">
              <p className="text-sm text-gray-600">
                <strong>{viewYm ? ymToKoreanLabel(viewYm) : ''}</strong> 데이터에 반영할 문서·이미지를
                선택하세요. (PDF, JPG, PNG 등)
              </p>
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                accept=".pdf,.png,.jpg,.jpeg,.webp,.tif,.tiff"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) setSelectedFile(f);
                }}
              />
              <button
                type="button"
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragOver(true);
                }}
                onDragLeave={() => setDragOver(false)}
                onDrop={onDropFile}
                onClick={() => fileInputRef.current?.click()}
                className={`w-full rounded-xl border-2 border-dashed px-6 py-12 text-center text-sm transition-colors ${
                  dragOver ? 'border-[#5B3BFA] bg-purple-50/50' : 'border-gray-200 hover:border-gray-300 bg-gray-50/50'
                }`}
              >
                <ScanText className="w-10 h-10 mx-auto mb-3 text-gray-400" />
                <span className="text-gray-700 font-medium">클릭하여 파일 선택</span>
                <span className="block text-gray-500 mt-2">또는 여기로 드래그 앤 드롭</span>
                {selectedFile && (
                  <span className="block mt-4 text-[#5B3BFA] font-medium break-all">{selectedFile.name}</span>
                )}
              </button>
            </div>
            <div className="flex justify-end gap-2 px-6 py-4 border-t border-gray-100 bg-gray-50/80">
              <button
                type="button"
                onClick={() => {
                  setUploadOpen(false);
                  setSelectedFile(null);
                }}
                className="px-5 py-2.5 rounded-xl border border-gray-300 text-gray-700 hover:bg-white"
              >
                취소
              </button>
              <button
                type="button"
                onClick={applyUpload}
                disabled={!selectedFile}
                className="px-5 py-2.5 rounded-xl text-white font-medium disabled:opacity-45 disabled:pointer-events-none"
                style={{ background: gradientBtn }}
              >
                업로드 및 OCR 반영
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
