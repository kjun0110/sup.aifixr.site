'use client';

import { useState } from "react";
import {
  X,
  Mail,
  User,
  Building2,
  Upload,
  Send,
  Paperclip,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  Check,
  Ban
} from "lucide-react";

type InviteRecord = {
  id: string;
  companyName: string;
  email: string;
  sentAt: string;
  status: "invited" | "contract_signed" | "registered" | "pending_approval" | "connected";
};

export function SupplierInviteModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  type RecipientDraft = {
    id: string;
    companyName: string;
    contactName: string;
    contactEmail: string;
  };

  const [recipients, setRecipients] = useState<RecipientDraft[]>([
    { id: 'r-1', companyName: '', contactName: '', contactEmail: '' },
  ]);
  const [selectedContract, setSelectedContract] = useState("v2.0");
  const [inviteRecords, setInviteRecords] = useState<InviteRecord[]>([
    {
      id: "1",
      companyName: "에코솔루션",
      email: "contact@ecosolution.com",
      sentAt: "2026-03-04 10:30",
      status: "connected"
    },
    {
      id: "2",
      companyName: "글로벌케미칼",
      email: "info@globalchem.com",
      sentAt: "2026-03-03 15:20",
      status: "pending_approval"
    },
    {
      id: "3",
      companyName: "한국메탈",
      email: "contact@krmetal.com",
      sentAt: "2026-03-02 09:15",
      status: "registered"
    },
    {
      id: "4",
      companyName: "스마트테크",
      email: "contact@smarttech.com",
      sentAt: "2026-03-01 14:20",
      status: "contract_signed"
    },
    {
      id: "5",
      companyName: "퓨처에너지",
      email: "info@futureenergy.com",
      sentAt: "2026-02-28 11:00",
      status: "invited"
    },
  ]);

  const handleApprove = (recordId: string) => {
    setInviteRecords(prev => 
      prev.map(record => 
        record.id === recordId 
          ? { ...record, status: "connected" as const }
          : record
      )
    );
  };

  const handleReject = (recordId: string) => {
    setInviteRecords(prev => 
      prev.map(record => 
        record.id === recordId 
          ? { ...record, status: "invited" as const }
          : record
      )
    );
  };

  const createId = () => `r-${Math.random().toString(36).slice(2, 9)}`;

  const updateRecipient = (id: string, patch: Partial<RecipientDraft>) => {
    setRecipients((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  };

  const addRecipient = () => {
    setRecipients((prev) => [
      ...prev,
      { id: createId(), companyName: '', contactName: '', contactEmail: '' },
    ]);
  };

  const removeRecipient = (id: string) => {
    setRecipients((prev) => {
      const next = prev.filter((r) => r.id !== id);
      // 첫 발신인 카드(r-1) 삭제 버튼은 숨기지만, 혹시 모를 상태를 대비해 최소 1개는 유지
      return next.length > 0 ? next : [{ id: 'r-1', companyName: '', contactName: '', contactEmail: '' }];
    });
  };

  const handleSendInvites = () => {
    const filled = recipients
      .map((r) => ({
        ...r,
        companyName: r.companyName.trim(),
        contactName: r.contactName.trim(),
        contactEmail: r.contactEmail.trim(),
      }))
      .filter((r) => r.companyName || r.contactName || r.contactEmail);

    if (filled.length === 0) {
      alert('발신인(협력사) 정보를 입력해주세요.');
      return;
    }

    const invalid = filled.find((r) => !r.companyName || !r.contactName || !r.contactEmail);
    if (invalid) {
      alert('모든 발신인(협력사) 항목의 회사명/담당자 이름/담당자 이메일을 입력해주세요.');
      return;
    }

    const now = new Date().toISOString().slice(0, 16).replace('T', ' ');
    const newRecords: InviteRecord[] = filled.map((r, idx) => ({
      id: `inv-${Date.now()}-${idx}`,
      companyName: r.companyName,
      email: r.contactEmail,
      sentAt: now,
      status: 'invited',
    }));

    setInviteRecords((prev) => [...newRecords, ...prev]);
    setRecipients([{ id: 'r-1', companyName: '', contactName: '', contactEmail: '' }]);
  };

  const defaultEmailBody = `안녕하세요.

귀사는 우리회사(1차)에 납품하는 협력사로,
해당 납품 제품은 현대자동차 공급망에 포함되어 있습니다.

공급망 탄소데이터 및 PCF 산정을 위해
AIFIX 시스템 등록이 필요합니다.

아래 링크를 통해 회원가입을 진행해 주시기 바랍니다.

https://aifixr.site/signup

(발송 시 수신자별 보안 토큰이 자동으로 첨부됩니다.)

회원가입 시 DATA CONTRACT 동의가 필요하며,
관련 문서는 아래 첨부파일에서 확인하실 수 있습니다.

감사합니다.`;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "invited":
        return (
          <div className="flex items-center gap-1 text-xs" style={{ color: '#00B4FF' }}>
            <Clock className="w-3 h-3" />
            <span>초대발송</span>
          </div>
        );
      case "contract_signed":
        return (
          <div className="flex items-center gap-1 text-xs" style={{ color: '#009688' }}>
            <CheckCircle className="w-3 h-3" />
            <span>계약서명</span>
          </div>
        );
      case "registered":
        return (
          <div className="flex items-center gap-1 text-xs" style={{ color: '#4CAF50' }}>
            <CheckCircle className="w-3 h-3" />
            <span>가입완료</span>
          </div>
        );
      case "pending_approval":
        return (
          <div className="flex items-center gap-1 text-xs" style={{ color: '#FF9800' }}>
            <Clock className="w-3 h-3" />
            <span>승인대기</span>
          </div>
        );
      case "connected":
        return (
          <div className="flex items-center gap-1 text-xs" style={{ color: '#673AB7' }}>
            <CheckCircle className="w-3 h-3" />
            <span>연결완료</span>
          </div>
        );
      default:
        return (
          <div className="flex items-center gap-1 text-xs" style={{ color: '#F44336' }}>
            <XCircle className="w-3 h-3" />
            <span>발송실패</span>
          </div>
        );
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-[20px] w-full max-w-6xl max-h-[90vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
        style={{ boxShadow: "0px 8px 32px rgba(0, 0, 0, 0.2)" }}
      >
        {/* Header */}
        <div 
          className="flex items-center justify-between p-6 border-b"
          style={{ borderColor: '#E0E0E0' }}
        >
          <div>
            <h2 className="text-2xl mb-1" style={{ fontWeight: 700, color: 'var(--aifix-navy)' }}>
              하위 협력사 초대
            </h2>
            <p style={{ fontSize: '14px', color: 'var(--aifix-gray)' }}>
              직접 하위 협력사에게 AIFIX 시스템 등록 안내 메일을 발송합니다
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center transition-all hover:bg-gray-100"
          >
            <X className="w-5 h-5" style={{ color: 'var(--aifix-gray)' }} />
          </button>
        </div>

        {/* Body */}
        <div className="grid grid-cols-2 gap-6 p-6" style={{ maxHeight: 'calc(90vh - 160px)', overflowY: 'auto' }}>
          {/* Left - Email Composition */}
          <div>
            <h3 className="text-lg mb-4" style={{ fontWeight: 700, color: 'var(--aifix-navy)' }}>
              초대 메일 작성
            </h3>

            {/* Input Method Tabs */}
            <div className="flex gap-2 mb-6 p-1 rounded-lg" style={{ backgroundColor: '#F5F5F5' }}>
              <button
                className="flex-1 px-4 py-2 rounded-lg text-sm transition-all"
                style={{
                  backgroundColor: 'white',
                  color: 'var(--aifix-primary)',
                  fontWeight: 600,
                  boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.1)'
                }}
              >
                직접 입력
              </button>
              <button
                className="flex-1 px-4 py-2 rounded-lg text-sm transition-all"
                style={{
                  backgroundColor: 'transparent',
                  color: 'var(--aifix-gray)',
                  fontWeight: 600
                }}
              >
                <div className="flex items-center justify-center gap-2">
                  <Upload className="w-4 h-4" />
                  CSV 업로드
                </div>
              </button>
            </div>

            {/* Company Info Fields */}
            <div className="space-y-4 mb-6">
              {recipients.map((r, idx) => (
                <div key={r.id} className="p-4 rounded-xl border border-gray-200 bg-white">
                  <div className="flex items-center justify-between mb-3">
                    <div style={{ fontWeight: 700, color: 'var(--aifix-navy)' }}>발신인 {idx + 1}</div>
                    {idx > 0 ? (
                      <button
                        type="button"
                        onClick={() => removeRecipient(r.id)}
                        className="p-1.5 rounded-lg hover:bg-gray-100 transition-all"
                        aria-label="발신인 카드 삭제"
                        title="삭제"
                      >
                        <XCircle className="w-4 h-4 text-gray-500" />
                      </button>
                    ) : (
                      <div style={{ width: 24 }} />
                    )}
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label
                        className="block mb-2"
                        style={{ fontSize: '14px', fontWeight: 600, color: 'var(--aifix-navy)' }}
                      >
                        협력사 회사명 *
                      </label>
                      <div className="relative">
                        <Building2
                          className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4"
                          style={{ color: 'var(--aifix-gray)' }}
                        />
                        <input
                          type="text"
                          value={r.companyName}
                          onChange={(e) => updateRecipient(r.id, { companyName: e.target.value })}
                          placeholder="예: 세진케미칼"
                          className="w-full pl-10 pr-3 py-2.5 rounded-lg border border-gray-300 text-sm transition-all focus:border-[var(--aifix-primary)] focus:outline-none"
                        />
                      </div>
                    </div>

                    <div>
                      <label
                        className="block mb-2"
                        style={{ fontSize: '14px', fontWeight: 600, color: 'var(--aifix-navy)' }}
                      >
                        담당자 이름 *
                      </label>
                      <div className="relative">
                        <User
                          className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4"
                          style={{ color: 'var(--aifix-gray)' }}
                        />
                        <input
                          type="text"
                          value={r.contactName}
                          onChange={(e) => updateRecipient(r.id, { contactName: e.target.value })}
                          placeholder="예: 김철수"
                          className="w-full pl-10 pr-3 py-2.5 rounded-lg border border-gray-300 text-sm transition-all focus:border-[var(--aifix-primary)] focus:outline-none"
                        />
                      </div>
                    </div>

                    <div>
                      <label
                        className="block mb-2"
                        style={{ fontSize: '14px', fontWeight: 600, color: 'var(--aifix-navy)' }}
                      >
                        담당자 이메일 *
                      </label>
                      <div className="relative">
                        <Mail
                          className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4"
                          style={{ color: 'var(--aifix-gray)' }}
                        />
                        <input
                          type="email"
                          value={r.contactEmail}
                          onChange={(e) => updateRecipient(r.id, { contactEmail: e.target.value })}
                          placeholder="예: contact@company.com"
                          className="w-full pl-10 pr-3 py-2.5 rounded-lg border border-gray-300 text-sm transition-all focus:border-[var(--aifix-primary)] focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              <button
                type="button"
                onClick={addRecipient}
                className="w-full py-2.5 rounded-lg transition-all hover:scale-[1.01]"
                style={{
                  backgroundColor: 'rgba(91, 59, 250, 0.08)',
                  color: 'var(--aifix-primary)',
                  fontWeight: 700,
                  border: '1px solid rgba(91, 59, 250, 0.25)',
                }}
              >
                발신인 추가
              </button>
            </div>

            {/* Email Subject */}
            <div className="mb-4">
              <label className="block mb-2" style={{ fontSize: '14px', fontWeight: 600, color: 'var(--aifix-navy)' }}>
                메일 제목
              </label>
              <input
                type="text"
                defaultValue="[AIFIX] 공급망 데이터 등록 요청"
                className="w-full px-3 py-2.5 rounded-lg border border-gray-300 text-sm transition-all focus:border-[var(--aifix-primary)] focus:outline-none"
              />
            </div>

            {/* Email Body */}
            <div className="mb-4">
              <label className="block mb-2" style={{ fontSize: '14px', fontWeight: 600, color: 'var(--aifix-navy)' }}>
                메일 본문
              </label>
              <textarea
                className="w-full px-3 py-2.5 rounded-lg border border-gray-300 text-sm transition-all focus:border-[var(--aifix-primary)] focus:outline-none"
                rows={12}
                defaultValue={defaultEmailBody}
                style={{ resize: 'none', lineHeight: 1.6 }}
              />
            </div>

            {/* DATA CONTRACT Attachment */}
            <div 
              className="mb-6 p-4 rounded-lg"
              style={{ backgroundColor: 'var(--aifix-secondary-light)', border: '1px solid var(--aifix-primary)' }}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Paperclip className="w-4 h-4" style={{ color: 'var(--aifix-primary)' }} />
                  <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--aifix-navy)' }}>
                    DATA CONTRACT 자동 첨부
                  </span>
                </div>
              </div>
              
              <select 
                value={selectedContract}
                onChange={(e) => setSelectedContract(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm"
                style={{ outline: 'none' }}
              >
                <option value="v2.0">v2.0 (2026.01)</option>
                <option value="v1.9">v1.9 (2025.12)</option>
                <option value="v1.8">v1.8 (2025.11)</option>
              </select>

              <p style={{ fontSize: '12px', color: 'var(--aifix-gray)', marginTop: '8px' }}>
                선택한 버전의 DATA CONTRACT PDF가 자동으로 첨부됩니다
              </p>
            </div>

            {/* Send Button */}
            <button
              type="button"
              onClick={handleSendInvites}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-lg transition-all hover:scale-[1.02]"
              style={{
                background: 'linear-gradient(90deg, #5B3BFA 0%, #00B4FF 100%)',
                boxShadow: '0px 4px 12px rgba(91, 59, 250, 0.2)',
                color: 'white',
                fontWeight: 600
              }}
            >
              <Send className="w-5 h-5" />
              초대 메일 발송
            </button>
          </div>

          {/* Right - Sent History */}
          <div>
            <h3 className="text-lg mb-4" style={{ fontWeight: 700, color: 'var(--aifix-navy)' }}>
              발송 기록
            </h3>

            {/* Records List */}
            <div className="space-y-3">
              {inviteRecords.map((record) => (
                <div 
                  key={record.id}
                  className="p-4 rounded-lg border transition-all hover:bg-gray-50"
                  style={{ borderColor: '#E0E0E0' }}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Building2 className="w-4 h-4" style={{ color: 'var(--aifix-primary)' }} />
                        <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--aifix-navy)' }}>
                          {record.companyName}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mb-2">
                        <Mail className="w-3 h-3" style={{ color: 'var(--aifix-gray)' }} />
                        <span style={{ fontSize: '13px', color: 'var(--aifix-gray)' }}>
                          {record.email}
                        </span>
                      </div>
                    </div>
                    {getStatusBadge(record.status)}
                  </div>
                  
                  <div 
                    className="pt-3 border-t"
                    style={{ borderColor: '#E0E0E0' }}
                  >
                    <div className="flex items-center justify-between text-xs mb-3">
                      <span style={{ color: 'var(--aifix-gray)' }}>발송 시간</span>
                      <span style={{ fontWeight: 600, color: 'var(--aifix-navy)' }}>
                        {record.sentAt}
                      </span>
                    </div>

                    {/* 프로젝트 진입 승인 버튼 - pending_approval 상태일 때만 표시 */}
                    {record.status === "pending_approval" && (
                      <div className="flex items-center gap-2 pt-3 border-t" style={{ borderColor: '#E0E0E0' }}>
                        <div className="flex items-center gap-1 text-xs flex-1" style={{ color: '#FF9800' }}>
                          <Clock className="w-3 h-3" />
                          <span style={{ fontWeight: 600 }}>승인대기</span>
                        </div>
                        <button
                          onClick={() => handleApprove(record.id)}
                          className="flex items-center gap-1 px-3 py-1.5 rounded-lg transition-all hover:scale-105"
                          style={{
                            backgroundColor: '#2196F3',
                            color: 'white',
                            fontSize: '12px',
                            fontWeight: 600
                          }}
                        >
                          <Check className="w-3 h-3" />
                          승인
                        </button>
                        <button
                          onClick={() => handleReject(record.id)}
                          className="flex items-center gap-1 px-3 py-1.5 rounded-lg transition-all hover:scale-105"
                          style={{
                            backgroundColor: '#F44336',
                            color: 'white',
                            fontSize: '12px',
                            fontWeight: 600
                          }}
                        >
                          <Ban className="w-3 h-3" />
                          반려
                        </button>
                      </div>
                    )}

                    {/* 프로젝트 진입 승인 버튼 - contract_signed, registered 상태일 때도 표시 */}
                    {(record.status === "contract_signed" || record.status === "registered") && (
                      <div className="flex items-center gap-2 pt-3 border-t" style={{ borderColor: '#E0E0E0' }}>
                        <div className="text-xs flex-1" style={{ color: 'var(--aifix-gray)' }}>
                          프로젝트 진입 승인
                        </div>
                        <button
                          onClick={() => handleApprove(record.id)}
                          className="flex items-center gap-1 px-3 py-1.5 rounded-lg transition-all hover:scale-105"
                          style={{
                            backgroundColor: '#2196F3',
                            color: 'white',
                            fontSize: '12px',
                            fontWeight: 600
                          }}
                        >
                          <Check className="w-3 h-3" />
                          승인
                        </button>
                        <button
                          onClick={() => handleReject(record.id)}
                          className="flex items-center gap-1 px-3 py-1.5 rounded-lg transition-all hover:scale-105"
                          style={{
                            backgroundColor: '#F44336',
                            color: 'white',
                            fontSize: '12px',
                            fontWeight: 600
                          }}
                        >
                          <Ban className="w-3 h-3" />
                          반려
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Info Banner */}
            <div 
              className="mt-6 p-4 rounded-lg"
              style={{ backgroundColor: '#E3F2FD', border: '1px solid #2196F3' }}
            >
              <div className="flex gap-2">
                <Mail className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: '#2196F3' }} />
                <div>
                  <p style={{ fontSize: '13px', color: '#2196F3', lineHeight: 1.5, fontWeight: 600, marginBottom: '8px' }}>
                    초대 프로세스
                  </p>
                  <div style={{ fontSize: '12px', color: '#2196F3', lineHeight: 1.7 }}>
                    <p className="mb-1">1️⃣ <strong>초대발송</strong> → 이메일 전송</p>
                    <p className="mb-1">2️⃣ <strong>계약서명</strong> → DATA CONTRACT 동의</p>
                    <p className="mb-1">3️⃣ <strong>가입완료</strong> → 회원가입 완료</p>
                    <p className="mb-1">4️⃣ <strong>승인대기</strong> → 상위차사 승인 필요</p>
                    <p>5️⃣ <strong>연결완료</strong> → 공급망 연결</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Permission Info */}
            <div 
              className="mt-3 p-4 rounded-lg"
              style={{ backgroundColor: '#FFF4E6', border: '1px solid #FF9800' }}
            >
              <div className="flex gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: '#FF9800' }} />
                <p style={{ fontSize: '12px', color: '#FF9800', lineHeight: 1.5 }}>
                  1차/2차/3차 협력사는 모두 <strong>직접 하위 협력사</strong>만 초대할 수 있습니다. 
                  상위 협력사나 동일 차수는 초대할 수 없습니다.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}