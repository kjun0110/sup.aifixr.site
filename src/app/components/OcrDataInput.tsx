'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { ScanText, Upload, Filter, X, FileUp, Eye } from 'lucide-react';
import { toast } from 'sonner';
import { MonthPicker } from './MonthPicker';

/** OCRO 스키마 필드 (증명서 추출 항목) */
export type OcrsCertFields = {
  exporter_name: string;
  exporter_address: string;
  exporter_telephone: string;
  exporter_fax: string;
  importer_name: string;
  importer_address: string;
  importer_telephone: string;
  importer_fax: string;
  country_of_origin: string;
  serial_number: string;
  product_description: string;
  hs_code: string;
  quantity: string;
  invoice_reference: string;
  certifying_authority: string;
  issue_date: string;
  signer_name: string;
  signature_date: string;
};

export type OcrMonthlyRow = OcrsCertFields & {
  sourceFileName: string;
  fileObjectUrl: string;
  fileMimeType: string;
  updatedAtIso: string;
};

const OCR_COLUMN_DEFS: { key: keyof OcrsCertFields; labelKo: string; widthClass?: string }[] = [
  { key: 'exporter_name', labelKo: '수출자 이름', widthClass: 'min-w-[120px]' },
  { key: 'exporter_address', labelKo: '수출자 주소', widthClass: 'min-w-[180px]' },
  { key: 'exporter_telephone', labelKo: '수출자 전화번호', widthClass: 'min-w-[120px]' },
  { key: 'exporter_fax', labelKo: '수출자 팩스번호', widthClass: 'min-w-[120px]' },
  { key: 'importer_name', labelKo: '수취인 이름', widthClass: 'min-w-[120px]' },
  { key: 'importer_address', labelKo: '수취인 주소', widthClass: 'min-w-[180px]' },
  { key: 'importer_telephone', labelKo: '수입자 전화번호', widthClass: 'min-w-[120px]' },
  { key: 'importer_fax', labelKo: '수입자 팩스번호', widthClass: 'min-w-[120px]' },
  { key: 'country_of_origin', labelKo: '원산지 국가', widthClass: 'min-w-[100px]' },
  { key: 'serial_number', labelKo: '일련번호', widthClass: 'min-w-[100px]' },
  { key: 'product_description', labelKo: '상품 설명', widthClass: 'min-w-[160px]' },
  { key: 'hs_code', labelKo: 'HS 코드', widthClass: 'min-w-[90px]' },
  { key: 'quantity', labelKo: '수량', widthClass: 'min-w-[80px]' },
  { key: 'invoice_reference', labelKo: '송장 참조번호', widthClass: 'min-w-[120px]' },
  { key: 'certifying_authority', labelKo: '인증 기관', widthClass: 'min-w-[140px]' },
  { key: 'issue_date', labelKo: '발행일', widthClass: 'min-w-[100px]' },
  { key: 'signer_name', labelKo: '서명자 이름', widthClass: 'min-w-[100px]' },
  { key: 'signature_date', labelKo: '서명 날짜', widthClass: 'min-w-[100px]' },
];

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

function hashSeed(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** 파일명·월 기반 데모 OCR 추출값 (실서비스에서는 OCR API 응답으로 대체) */
function demoOcrsFields(ym: string, fileName: string): OcrsCertFields {
  const h = hashSeed(`${ym}|${fileName}`);
  const pick = <T,>(arr: T[], offset: number) => arr[(h + offset) % arr.length];
  return {
    exporter_name: pick(['(주)한국수출상사', 'Global Trade Co.', 'East Export Ltd.'], 1),
    exporter_address: pick(['서울특별시 강남구 테헤란로 123', 'Busan Haeundae-gu 45', 'Incheon Songdo 7'], 2),
    exporter_telephone: pick(['02-1234-5678', '051-987-6543', '032-111-2222'], 3),
    exporter_fax: pick(['02-1234-5679', '051-987-6544', '—'], 4),
    importer_name: pick(['ABC Import LLC', 'EU Distribution GmbH', 'Tokyo Trading 株式会社'], 5),
    importer_address: pick(['New York, NY 10001', 'Berlin 10115', 'Tokyo Chuo-ku 1-1'], 6),
    importer_telephone: pick(['+1-212-555-0100', '+49-30-5555', '+81-3-5555'], 7),
    importer_fax: pick(['+1-212-555-0101', '—', '+81-3-5556'], 8),
    country_of_origin: pick(['대한민국', 'KOR', 'Republic of Korea'], 9),
    serial_number: pick([`CO-${ym.replace('-', '')}-${(h % 9000) + 1000}`, `SN-${h % 100000}`], 10),
    product_description: pick(['리튬 이온 배터리 셀', '전극재 (양극)', '정밀 부품 세트'], 11),
    hs_code: pick(['8507.60', '3815.19', '8544.42'], 12),
    quantity: pick(['1,200 EA', '45 MT', '88 BOX'], 13),
    invoice_reference: pick([`INV-${ym}-001`, `REF-${(h % 99999).toString().padStart(5, '0')}`], 14),
    certifying_authority: pick(['한국무역협회', 'KITA', '관세청'], 15),
    issue_date: pick([`${ym}-15`, `${ym}-01`, `${ym}-28`], 16),
    signer_name: pick(['김담당', 'Lee Signer', 'Park Official'], 17),
    signature_date: pick([`${ym}-16`, `${ym}-02`, `${ym}-29`], 18),
  };
}

function revokeAllObjectUrls(rows: Record<string, OcrMonthlyRow>) {
  Object.values(rows).forEach((r) => {
    if (r.fileObjectUrl) URL.revokeObjectURL(r.fileObjectUrl);
  });
}

/** OCR데이터 입력 — 월별 조회 + OCRO 스키마(엑셀형) + 원본 파일 팝업 */
export function OcrDataInput() {
  const [monthPickerValue, setMonthPickerValue] = useState('');
  const [viewYm, setViewYm] = useState<string | null>(null);
  const [hasQueried, setHasQueried] = useState(false);
  const [rowsByYm, setRowsByYm] = useState<Record<string, OcrMonthlyRow>>({});
  const [uploadOpen, setUploadOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const rowsRef = useRef(rowsByYm);
  rowsRef.current = rowsByYm;

  const currentRow = viewYm ? rowsByYm[viewYm] : undefined;

  useEffect(() => {
    return () => {
      revokeAllObjectUrls(rowsRef.current);
    };
  }, []);

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

  const handleReset = useCallback(() => {
    setRowsByYm((prev) => {
      revokeAllObjectUrls(prev);
      return {};
    });
    setMonthPickerValue('');
    setViewYm(null);
    setHasQueried(false);
    setUploadOpen(false);
    setPreviewOpen(false);
    setSelectedFile(null);
  }, []);

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
    const fileObjectUrl = URL.createObjectURL(selectedFile);
    const fields = demoOcrsFields(viewYm, selectedFile.name);
    const row: OcrMonthlyRow = {
      ...fields,
      sourceFileName: selectedFile.name,
      fileObjectUrl,
      fileMimeType: selectedFile.type || 'application/octet-stream',
      updatedAtIso: new Date().toISOString(),
    };
    setRowsByYm((prev) => {
      const old = prev[viewYm];
      if (old?.fileObjectUrl) URL.revokeObjectURL(old.fileObjectUrl);
      return { ...prev, [viewYm]: row };
    });
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

  const excelHeaderBg = '#E8E8E8';
  const excelBorder = '#B4B4B4';
  const excelCellBg = '#FFFFFF';

  const isPdf = currentRow?.fileMimeType.includes('pdf');
  const isImage =
    currentRow &&
    (currentRow.fileMimeType.startsWith('image/') ||
      /\.(png|jpe?g|gif|webp|bmp|tif?f)$/i.test(currentRow.sourceFileName));

  const openPreview = () => {
    if (!currentRow?.fileObjectUrl) {
      toast.error('먼저 해당 월에 파일을 업로드해 주세요.');
      return;
    }
    setPreviewOpen(true);
  };

  const cellBase =
    'border px-2 py-1.5 text-xs align-middle whitespace-nowrap max-w-[220px] truncate';

  return (
    <div className="max-w-[1600px] mx-auto px-8 pt-8 pb-16 space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2" style={{ color: 'var(--aifix-navy)' }}>
          OCR데이터 입력
        </h1>
        <p className="text-[15px]" style={{ color: 'var(--aifix-gray)' }}>
          월을 선택해 조회한 뒤, OCR 파일을 올리면 OCRO(원산지 증명서) 스키마 항목에 반영됩니다. 마지막 열에서
          업로드한 원본을 팝업으로 확인할 수 있습니다. (현재는 데모 추출)
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
                월별 인터페이스 · OCR 반영 스키마 (OCRO)
              </h3>
              <p className="text-sm text-gray-500 mt-1">
                {viewYm ? ymToKoreanLabel(viewYm) : ''}
                {currentRow?.sourceFileName
                  ? ` · 최근 파일: ${currentRow.sourceFileName}`
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

          <div className="p-6 overflow-x-auto" style={{ background: '#F0F0F0' }}>
            <div
              className="inline-block min-w-full align-middle shadow-sm"
              style={{
                border: `1px solid ${excelBorder}`,
                fontFamily: 'ui-sans-serif, system-ui, "Segoe UI", Calibri, sans-serif',
              }}
            >
              <table className="border-collapse text-[13px] w-max min-w-full">
                <thead>
                  <tr style={{ background: excelHeaderBg }}>
                    {OCR_COLUMN_DEFS.map((col) => (
                      <th
                        key={col.key}
                        className={`${cellBase} font-semibold text-left text-gray-900 ${col.widthClass ?? ''}`}
                        style={{ borderColor: excelBorder }}
                        title={col.key}
                      >
                        {col.labelKo}
                      </th>
                    ))}
                    <th
                      className={`${cellBase} font-semibold text-center text-gray-900 min-w-[108px]`}
                      style={{
                        borderColor: excelBorder,
                        background: excelHeaderBg,
                      }}
                    >
                      원본 파일
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr style={{ background: excelCellBg }}>
                    {OCR_COLUMN_DEFS.map((col) => (
                      <td
                        key={col.key}
                        className={`${cellBase} text-gray-800 tabular-nums ${col.widthClass ?? ''}`}
                        style={{ borderColor: excelBorder }}
                        title={currentRow ? String(currentRow[col.key]) : undefined}
                      >
                        {currentRow ? currentRow[col.key] : '—'}
                      </td>
                    ))}
                    <td
                      className={`${cellBase} text-center`}
                      style={{
                        borderColor: excelBorder,
                        background: excelCellBg,
                      }}
                    >
                      {currentRow ? (
                        <button
                          type="button"
                          onClick={openPreview}
                          className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium text-white hover:opacity-90"
                          style={{ background: gradientBtn }}
                        >
                          <Eye className="w-3.5 h-3.5 shrink-0" />
                          보기
                        </button>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <p className="px-8 py-4 text-xs text-gray-500 border-t border-gray-100">
            가로 스크롤로 전체 열을 확인할 수 있습니다. 다른 월을 조회하면 해당 월에 저장된 OCR 반영 값이 표시됩니다.
            실제 서비스에서는 OCR·검수 API와 연동합니다.
          </p>
        </div>
      )}

      {previewOpen && currentRow && (
        <div
          className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/50"
          role="dialog"
          aria-modal="true"
          aria-labelledby="ocr-preview-title"
        >
          <div
            className="bg-white w-full max-w-5xl max-h-[90vh] rounded-2xl shadow-xl flex flex-col overflow-hidden"
            style={{ boxShadow: '0px 16px 48px rgba(15,23,42,0.22)' }}
          >
            <div className="flex items-center justify-between px-5 py-3 border-b border-gray-200 shrink-0">
              <h4 id="ocr-preview-title" className="text-base font-semibold text-gray-900 truncate pr-4">
                원본 파일 · {currentRow.sourceFileName}
              </h4>
              <button
                type="button"
                onClick={() => setPreviewOpen(false)}
                className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 shrink-0"
                aria-label="닫기"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 min-h-[50vh] bg-gray-100 overflow-auto">
              {isPdf ? (
                <iframe
                  title="OCR 원본 PDF"
                  src={currentRow.fileObjectUrl}
                  className="w-full h-[min(75vh,800px)] border-0 bg-white"
                />
              ) : isImage ? (
                // eslint-disable-next-line @next/next/no-img-element -- blob: 미리보기
                <img
                  src={currentRow.fileObjectUrl}
                  alt={currentRow.sourceFileName}
                  className="max-w-full h-auto mx-auto block p-4"
                />
              ) : (
                <div className="p-8 text-center text-gray-600">
                  <p className="mb-4">이 형식은 브라우저에서 바로 미리보기할 수 없습니다.</p>
                  <a
                    href={currentRow.fileObjectUrl}
                    download={currentRow.sourceFileName}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-white text-sm font-medium"
                    style={{ background: gradientBtn }}
                  >
                    파일 다운로드
                  </a>
                </div>
              )}
            </div>
          </div>
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
