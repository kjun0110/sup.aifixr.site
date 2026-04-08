'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
import { toast } from "sonner";
import {
  getInvitationAttachmentDataContractRevision,
  getInvitationHistory,
  postSupInvitation,
  type InvitationAttachmentContractRevision,
  type InvitationHistoryItem,
  type SupInvitePayload,
} from "@/lib/api/invitation";
import { AIFIXR_SESSION_UPDATED_EVENT } from "@/lib/api/client";
import { approveSignupRequest, rejectSignupRequest } from "@/lib/api/signup-review";
import {
  SUP_PENDING_INVITE_SEND_STORAGE_KEY,
  startSupGoogleLinkFlow,
} from "@/lib/api/supGoogleLink";

const SUPPLIER_INVITE_DEFAULT_BODY = `안녕하세요.

귀사는 우리회사의 직하위 협력사로,
공급망 탄소데이터 및 PCF 산정을 위해 AIFIX 시스템 등록이 필요합니다.

아래 링크를 통해 회원가입을 진행해 주시기 바랍니다.

https://aifixr.site/signup

(발송 시 수신자별 보안 링크로 치환됩니다.)

회원가입 시 제3자 제공 동의서 동의가 필요하며, 메일에 PDF가 첨부됩니다.

감사합니다.`;

type InviteRecord = {
  id: string;
  companyName: string;
  email: string;
  sentAt: string;
  status: "invited" | "contract_signed" | "registered" | "pending_approval" | "connected";
  signupRequestId?: number;
};

export type SupplierInviteContext = {
  projectId: number;
  parentNodeId: number | null;
};

function mapApiRowToRecord(r: InvitationHistoryItem): InviteRecord {
  const pendingId = r.pending_signup_request_id;
  const signupRequestId =
    pendingId != null && pendingId > 0 ? pendingId : undefined;

  let status: InviteRecord["status"] = "invited";
  if (signupRequestId != null) {
    // DB에 승인 대기(pending_approval) 신청이 있을 때만 승인/반려 UI
    status = "pending_approval";
  } else if (r.status === "completed") status = "connected";
  else if (r.status === "sent") status = "invited";
  else if (r.status === "in_progress") status = "contract_signed";
  else if (r.status === "revoked" || r.status === "expired") status = "invited";

  return {
    id: String(r.id),
    companyName: r.invitee_company_hint || "-",
    email: r.invitee_email || "-",
    sentAt: new Date(r.created_at).toLocaleString(),
    status,
    signupRequestId,
  };
}

type RegisteredChildOption = { id: number; company_name: string; status?: string };

function formatRegisteredChildLabel(o: RegisteredChildOption): string {
  const labels: Record<string, string> = {
    added: "등록",
    invited: "초대 발송",
    signed_up: "가입 진행",
    approved: "연결완료",
  };
  const s = (o.status ?? "").toLowerCase();
  const suffix = labels[s];
  return suffix ? `${o.company_name} (${suffix})` : o.company_name;
}

export function SupplierInviteModal({
  isOpen,
  onClose,
  inviteContext,
  fetchRegisteredChildren,
  childrenReloadToken = 0,
}: {
  isOpen: boolean;
  onClose: () => void;
  /** 실제 프로젝트(real-*)에서만 전달 — 공급망 노드 기준 초대·이력 API 연동 */
  inviteContext?: SupplierInviteContext | null;
  /** 직하위 등록 노드 목록(added~승인까지, 동일 법인 추가 담당자 초대용) */
  fetchRegisteredChildren?: () => Promise<RegisteredChildOption[]>;
  /** 직하위 등록 후 목록 갱신용 */
  childrenReloadToken?: number;
}) {
  type RecipientDraft = {
    id: string;
    companyName: string;
    contactName: string;
    contactEmail: string;
    childSupplyChainNodeId?: number | null;
  };

  const [recipients, setRecipients] = useState<RecipientDraft[]>([
    { id: 'r-1', companyName: '', contactName: '', contactEmail: '', childSupplyChainNodeId: null },
  ]);
  const [attachmentRevision, setAttachmentRevision] =
    useState<InvitationAttachmentContractRevision | null>(null);
  const [attachmentRevisionLoading, setAttachmentRevisionLoading] = useState(false);
  const [attachmentRevisionError, setAttachmentRevisionError] = useState<string | null>(null);
  const initialMockRecords: InviteRecord[] = [
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
  ];

  const useLiveApi = Boolean(
    inviteContext?.projectId != null && inviteContext.parentNodeId != null,
  );

  const [registeredOptions, setRegisteredOptions] = useState<RegisteredChildOption[]>([]);
  const [registeredLoading, setRegisteredLoading] = useState(false);

  /** 실제 API 모드에서는 빈 배열로 시작 — 목(mock)이 API 실패 시 그대로 남는 문제 방지 */
  const [inviteRecords, setInviteRecords] = useState<InviteRecord[]>([]);
  const [emailSubject, setEmailSubject] = useState("[AIFIX] 공급망 데이터 등록 요청");
  const [emailBody, setEmailBody] = useState(SUPPLIER_INVITE_DEFAULT_BODY);
  const [selectedContract, setSelectedContract] = useState("v2.0");
  const [openCompanyDropdownId, setOpenCompanyDropdownId] = useState<string | null>(null);
  const [sendInvitesLoading, setSendInvitesLoading] = useState(false);
  const inviteResumeInFlightRef = useRef(false);

  const companyCandidates = useMemo(() => {
    const base = ["세진케미칼", "동아소재", "한빛정밀", "그린테크", "코어메탈"];
    const merged = [...base, ...inviteRecords.map((r) => r.companyName)];
    return Array.from(new Set(merged.map((name) => name.trim()).filter(Boolean)));
  }, [inviteRecords]);

  useEffect(() => {
    const onMouseDown = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target?.closest('[data-company-combobox="true"]')) {
        setOpenCompanyDropdownId(null);
      }
    };
    document.addEventListener("mousedown", onMouseDown);
    return () => document.removeEventListener("mousedown", onMouseDown);
  }, []);

  const reloadHistory = useCallback(async () => {
    if (!inviteContext?.projectId || inviteContext.parentNodeId == null) return;
    try {
      const rows = await getInvitationHistory({ limit: 80 });
      const filtered = rows.filter(
        (row) =>
          row.project_id === inviteContext.projectId &&
          row.parent_supply_chain_node_id === inviteContext.parentNodeId,
      );
      setInviteRecords(filtered.map(mapApiRowToRecord));
    } catch (e) {
      setInviteRecords([]);
      toast.error(
        e instanceof Error ? e.message : "발송 기록을 불러오지 못했습니다.",
      );
    }
  }, [inviteContext?.projectId, inviteContext?.parentNodeId]);

  /** Gmail 연동 복귀 후 sessionStorage에 남은 협력사 초대 페이로드 자동 발송 */
  const resumePendingSupInvites = useCallback(async () => {
    if (inviteResumeInFlightRef.current) return;
    if (typeof window === "undefined") return;
    if (!useLiveApi || inviteContext?.parentNodeId == null) return;

    const raw = sessionStorage.getItem(SUP_PENDING_INVITE_SEND_STORAGE_KEY);
    if (!raw?.trim()) return;

    let payloads: SupInvitePayload[];
    try {
      const parsed = JSON.parse(raw) as unknown;
      if (!Array.isArray(parsed) || parsed.length === 0) {
        sessionStorage.removeItem(SUP_PENDING_INVITE_SEND_STORAGE_KEY);
        return;
      }
      payloads = parsed as SupInvitePayload[];
    } catch {
      sessionStorage.removeItem(SUP_PENDING_INVITE_SEND_STORAGE_KEY);
      return;
    }

    if (payloads[0]?.parent_supply_chain_node_id !== inviteContext.parentNodeId) {
      sessionStorage.removeItem(SUP_PENDING_INVITE_SEND_STORAGE_KEY);
      return;
    }

    inviteResumeInFlightRef.current = true;
    setSendInvitesLoading(true);
    try {
      let ok = 0;
      for (let i = 0; i < payloads.length; i++) {
        try {
          await postSupInvitation(payloads[i]);
          ok += 1;
        } catch (e) {
          const msg = e instanceof Error ? e.message : "발송 실패";
          if (msg.includes("428") || msg.toLowerCase().includes("gmail")) {
            sessionStorage.setItem(
              SUP_PENDING_INVITE_SEND_STORAGE_KEY,
              JSON.stringify(payloads.slice(i)),
            );
            toast.message(
              "초대 메일은 연동된 Google 계정(Gmail)으로 발송됩니다. Google 연동 화면으로 이동합니다.",
            );
            try {
              await startSupGoogleLinkFlow({ reopenInviteModal: true });
            } catch (e2) {
              toast.error(
                e2 instanceof Error ? e2.message : "Google 연동을 시작할 수 없습니다.",
              );
            }
            return;
          }
          toast.error(msg);
        }
      }
      sessionStorage.removeItem(SUP_PENDING_INVITE_SEND_STORAGE_KEY);
      if (ok > 0) {
        toast.success(`${ok}건 초대 메일을 발송했습니다.`);
        setRecipients([
          {
            id: "r-1",
            companyName: "",
            contactName: "",
            contactEmail: "",
            childSupplyChainNodeId: null,
          },
        ]);
        await reloadHistory();
      }
    } finally {
      inviteResumeInFlightRef.current = false;
      setSendInvitesLoading(false);
    }
  }, [useLiveApi, inviteContext?.parentNodeId, reloadHistory]);

  useEffect(() => {
    if (!isOpen || !useLiveApi) return;
    const t = window.setTimeout(() => {
      void resumePendingSupInvites();
    }, 500);
    const onSession = () => {
      void resumePendingSupInvites();
    };
    window.addEventListener(AIFIXR_SESSION_UPDATED_EVENT, onSession);
    return () => {
      window.clearTimeout(t);
      window.removeEventListener(AIFIXR_SESSION_UPDATED_EVENT, onSession);
    };
  }, [
    isOpen,
    useLiveApi,
    inviteContext?.projectId,
    inviteContext?.parentNodeId,
    resumePendingSupInvites,
  ]);

  useEffect(() => {
    if (!isOpen) return;
    if (!useLiveApi) {
      setInviteRecords(initialMockRecords);
      return;
    }
    void reloadHistory();
  }, [isOpen, useLiveApi, reloadHistory]);

  useEffect(() => {
    if (!isOpen || !useLiveApi) {
      setAttachmentRevision(null);
      setAttachmentRevisionError(null);
      setAttachmentRevisionLoading(false);
      return;
    }
    let cancelled = false;
    setAttachmentRevisionLoading(true);
    setAttachmentRevisionError(null);
    void (async () => {
      try {
        const rev = await getInvitationAttachmentDataContractRevision();
        if (!cancelled) {
          setAttachmentRevision(rev);
          setAttachmentRevisionError(null);
        }
      } catch (e) {
        if (!cancelled) {
          setAttachmentRevision(null);
          setAttachmentRevisionError(
            e instanceof Error ? e.message : "첨부 동의서 정보를 불러오지 못했습니다.",
          );
        }
      } finally {
        if (!cancelled) setAttachmentRevisionLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isOpen, useLiveApi]);

  useEffect(() => {
    if (!isOpen || !useLiveApi || !fetchRegisteredChildren) {
      setRegisteredOptions([]);
      return;
    }
    let cancelled = false;
    setRegisteredLoading(true);
    void (async () => {
      try {
        const rows = await fetchRegisteredChildren();
        if (!cancelled) setRegisteredOptions(rows ?? []);
      } catch (e) {
        if (!cancelled) {
          setRegisteredOptions([]);
          toast.error(
            e instanceof Error ? e.message : "등록된 직하위 목록을 불러오지 못했습니다.",
          );
        }
      } finally {
        if (!cancelled) setRegisteredLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isOpen, useLiveApi, fetchRegisteredChildren, childrenReloadToken]);

  const handleApprove = async (record: InviteRecord) => {
    if (useLiveApi) {
      if (!record.signupRequestId) {
        toast.message("가입 신청이 접수된 뒤 승인할 수 있습니다.");
        return;
      }
      try {
        await approveSignupRequest(record.signupRequestId);
        toast.success("프로젝트 진입을 승인했습니다.");
        await reloadHistory();
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "승인 처리에 실패했습니다.");
      }
      return;
    }
    setInviteRecords((prev) =>
      prev.map((r) =>
        r.id === record.id ? { ...r, status: "connected" as const } : r,
      ),
    );
  };

  const handleReject = async (record: InviteRecord) => {
    if (useLiveApi) {
      if (!record.signupRequestId) {
        toast.message("가입 신청이 접수된 뒤 반려할 수 있습니다.");
        return;
      }
      try {
        await rejectSignupRequest(record.signupRequestId);
        toast.success("반려 처리했습니다.");
        await reloadHistory();
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "반려 처리에 실패했습니다.");
      }
      return;
    }
    setInviteRecords((prev) =>
      prev.map((r) =>
        r.id === record.id ? { ...r, status: "invited" as const } : r,
      ),
    );
  };

  const createId = () => `r-${Math.random().toString(36).slice(2, 9)}`;

  const updateRecipient = (id: string, patch: Partial<RecipientDraft>) => {
    setRecipients((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  };

  const addRecipient = () => {
    setRecipients((prev) => [
      ...prev,
      { id: createId(), companyName: '', contactName: '', contactEmail: '', childSupplyChainNodeId: null },
    ]);
  };

  const removeRecipient = (id: string) => {
    setRecipients((prev) => {
      const next = prev.filter((r) => r.id !== id);
      // 첫 발신인 카드(r-1) 삭제 버튼은 숨기지만, 혹시 모를 상태를 대비해 최소 1개는 유지
      return next.length > 0
        ? next
        : [{ id: 'r-1', companyName: '', contactName: '', contactEmail: '', childSupplyChainNodeId: null }];
    });
  };

  const handleSendInvites = async () => {
    if (sendInvitesLoading) return;

    const filled = recipients
      .map((r) => ({
        ...r,
        companyName: r.companyName.trim(),
        contactName: r.contactName.trim(),
        contactEmail: r.contactEmail.trim(),
      }))
      .filter((r) => r.companyName || r.contactName || r.contactEmail);

    if (filled.length === 0) {
      toast.error("발신인(협력사) 정보를 입력해주세요.");
      return;
    }

    const invalid = filled.find((r) => !r.companyName || !r.contactName || !r.contactEmail);
    if (invalid) {
      toast.error(
        "모든 발신인 항목의 회사명·담당자 이름·담당자 이메일을 입력해주세요.",
      );
      return;
    }

    if (useLiveApi && inviteContext != null && inviteContext.parentNodeId != null) {
      const parentSupplyChainNodeId = inviteContext.parentNodeId;
      const missingChild = filled.find(
        (r) => r.childSupplyChainNodeId == null || r.childSupplyChainNodeId < 1,
      );
      if (missingChild) {
        toast.error("각 수신인마다 직하위 등록 목록에서 협력사를 선택해 주세요.");
        return;
      }
      const bodyForBackend = emailBody.trim().replace(/https?:\/\/[^\s]+/g, "{link}");

      const payloads: SupInvitePayload[] = filled.map((r) => ({
        parent_supply_chain_node_id: parentSupplyChainNodeId,
        child_supply_chain_node_id: r.childSupplyChainNodeId ?? undefined,
        invitee: {
          company_name: r.companyName,
          contact_name: r.contactName,
          email: r.contactEmail,
        },
        expire_days: 7,
        email_subject: emailSubject.trim(),
        email_body: bodyForBackend,
      }));

      setSendInvitesLoading(true);
      try {
        let ok = 0;
        for (let i = 0; i < payloads.length; i++) {
          try {
            await postSupInvitation(payloads[i]);
            ok += 1;
          } catch (e) {
            const msg = e instanceof Error ? e.message : "발송 실패";
            if (msg.includes("428") || msg.toLowerCase().includes("gmail")) {
              sessionStorage.setItem(
                SUP_PENDING_INVITE_SEND_STORAGE_KEY,
                JSON.stringify(payloads.slice(i)),
              );
              toast.message(
                "초대 메일은 연동된 Google 계정(Gmail)으로 발송됩니다. Google 연동 화면으로 이동합니다.",
              );
              try {
                await startSupGoogleLinkFlow({ reopenInviteModal: true });
              } catch (e2) {
                toast.error(
                  e2 instanceof Error ? e2.message : "Google 연동을 시작할 수 없습니다.",
                );
              }
              return;
            }
            toast.error(msg);
          }
        }
        if (ok > 0) {
          sessionStorage.removeItem(SUP_PENDING_INVITE_SEND_STORAGE_KEY);
          toast.success(`${ok}건 초대 메일을 발송했습니다.`);
          setRecipients([
            {
              id: "r-1",
              companyName: "",
              contactName: "",
              contactEmail: "",
              childSupplyChainNodeId: null,
            },
          ]);
          await reloadHistory();
        }
      } finally {
        setSendInvitesLoading(false);
      }
      return;
    }

    if (inviteContext?.projectId != null && inviteContext.parentNodeId == null) {
      toast.error(
        "공급망에서 승인된 내 노드가 없어 초대를 보낼 수 없습니다. 원청 승인 후 다시 시도해 주세요.",
      );
      return;
    }

    const now = new Date().toISOString().slice(0, 16).replace("T", " ");
    const newRecords: InviteRecord[] = filled.map((r, idx) => ({
      id: `inv-${Date.now()}-${idx}`,
      companyName: r.companyName,
      email: r.contactEmail,
      sentAt: now,
      status: "invited",
    }));

    setInviteRecords((prev) => [...newRecords, ...prev]);
    setRecipients([
      { id: "r-1", companyName: "", contactName: "", contactEmail: "", childSupplyChainNodeId: null },
    ]);
  };

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
              하위협력사 초대 및 관리
            </h2>
            <p style={{ fontSize: '14px', color: 'var(--aifix-gray)' }}>
              직접 하위 협력사에게 AIFIX 시스템 등록 안내 메일을 발송합니다
            </p>
            {inviteContext?.projectId != null && inviteContext.parentNodeId == null && (
              <p
                className="mt-2 text-sm rounded-lg px-3 py-2"
                style={{ backgroundColor: "#FFF4E6", color: "#E65100" }}
              >
                이 프로젝트에서 승인된 공급망 노드가 없어 실제 초대 메일을 보낼 수 없습니다. 원청
                승인(공급망 노드 활성화) 후 다시 시도해 주세요.
              </p>
            )}
            {useLiveApi && fetchRegisteredChildren && !registeredLoading && registeredOptions.length === 0 && (
              <p
                className="mt-2 text-sm rounded-lg px-3 py-2"
                style={{ backgroundColor: "#E3F2FD", color: "#1565C0" }}
              >
                직하위로 등록된 협력사가 없습니다. 공급망 관리에서「직하위차사 등록」으로 먼저 등록한 뒤
                초대해 주세요.
              </p>
            )}
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
                      {useLiveApi && fetchRegisteredChildren ? (
                        <div className="relative">
                          <Building2
                            className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 z-[1] pointer-events-none"
                            style={{ color: 'var(--aifix-gray)' }}
                          />
                          <select
                            value={r.childSupplyChainNodeId != null ? String(r.childSupplyChainNodeId) : ''}
                            onChange={(e) => {
                              const v = e.target.value;
                              const nid = v ? Number(v) : null;
                              const opt = registeredOptions.find((o) => o.id === nid);
                              updateRecipient(r.id, {
                                childSupplyChainNodeId: nid,
                                companyName: opt?.company_name ?? '',
                              });
                            }}
                            disabled={registeredLoading}
                            className="w-full pl-10 pr-3 py-2.5 rounded-lg border border-gray-300 text-sm transition-all focus:border-[var(--aifix-primary)] focus:outline-none bg-white appearance-none"
                          >
                            <option value="">
                              {registeredLoading ? '목록 불러오는 중…' : '등록한 직하위 협력사 선택'}
                            </option>
                            {registeredOptions.map((o) => (
                              <option key={o.id} value={o.id}>
                                {formatRegisteredChildLabel(o)}
                              </option>
                            ))}
                          </select>
                        </div>
                      ) : (
                        <div className="relative" data-company-combobox="true">
                          <Building2
                            className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4"
                            style={{ color: "var(--aifix-gray)" }}
                          />
                          <input
                            type="text"
                            value={r.companyName}
                            onFocus={() => setOpenCompanyDropdownId(r.id)}
                            onChange={(e) => {
                              updateRecipient(r.id, { companyName: e.target.value });
                              setOpenCompanyDropdownId(r.id);
                            }}
                            placeholder="협력사 검색 또는 직접 입력"
                            className="w-full pl-10 pr-3 py-2.5 rounded-lg border border-gray-300 text-sm transition-all focus:border-[var(--aifix-primary)] focus:outline-none"
                          />
                          {openCompanyDropdownId === r.id && (
                            <div className="absolute left-0 right-0 z-30 mt-1 max-h-44 overflow-auto rounded-lg border border-gray-200 bg-white shadow-lg">
                              {companyCandidates
                                .filter((name) => {
                                  const q = r.companyName.trim().toLowerCase();
                                  if (!q) return true;
                                  return name.toLowerCase().includes(q);
                                })
                                .slice(0, 12)
                                .map((name) => (
                                  <button
                                    key={name}
                                    type="button"
                                    onClick={() => {
                                      updateRecipient(r.id, { companyName: name });
                                      setOpenCompanyDropdownId(null);
                                    }}
                                    className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50"
                                  >
                                    {name}
                                  </button>
                                ))}
                              {r.companyName.trim() &&
                                !companyCandidates.some((name) => name === r.companyName.trim()) && (
                                  <button
                                    type="button"
                                    onClick={() => setOpenCompanyDropdownId(null)}
                                    className="w-full border-t border-gray-100 px-3 py-2 text-left text-sm text-[var(--aifix-primary)] hover:bg-gray-50"
                                  >
                                    직접 입력값 사용: {r.companyName.trim()}
                                  </button>
                                )}
                            </div>
                          )}
                        </div>
                      )}
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
                value={emailSubject}
                onChange={(e) => setEmailSubject(e.target.value)}
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
                value={emailBody}
                onChange={(e) => setEmailBody(e.target.value)}
                style={{ resize: "none", lineHeight: 1.6 }}
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

              {useLiveApi ? (
                <div
                  className="w-full px-3 py-2.5 rounded-lg border border-gray-200 bg-white text-sm"
                  style={{ color: 'var(--aifix-navy)' }}
                >
                  {attachmentRevisionLoading ? (
                    <span className="text-gray-500">불러오는 중…</span>
                  ) : attachmentRevision ? (
                    <>
                      <span style={{ fontWeight: 700 }}>{attachmentRevision.version_code}</span>
                      {attachmentRevision.title ? (
                        <span className="text-gray-600"> · {attachmentRevision.title}</span>
                      ) : null}
                      <div className="mt-1 text-xs text-gray-500">
                        시행일{" "}
                        {new Date(attachmentRevision.effective_from).toLocaleDateString("ko-KR", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
                      </div>
                    </>
                  ) : (
                    <span className="text-amber-700">{attachmentRevisionError ?? "정보 없음"}</span>
                  )}
                </div>
              ) : (
                <select
                  value={selectedContract}
                  onChange={(e) => setSelectedContract(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm"
                  style={{ outline: "none" }}
                >
                  <option value="v2.0">v2.0 (2026.01)</option>
                  <option value="v1.9">v1.9 (2025.12)</option>
                  <option value="v1.8">v1.8 (2025.11)</option>
                </select>
              )}

              <p style={{ fontSize: '12px', color: 'var(--aifix-gray)', marginTop: '8px' }}>
                {useLiveApi
                  ? "위 내용은 초대 메일에 실제로 붙는 PDF와 동일한 개정입니다. 메일은 연동된 Gmail로 발송되며, 미연동 시「초대 메일 발송」을 누르면 Google 연동으로 안내됩니다."
                  : "선택한 버전의 DATA CONTRACT PDF가 자동으로 첨부됩니다"}
              </p>
            </div>

            {/* Send Button */}
            <button
              type="button"
              onClick={() => void handleSendInvites()}
              disabled={sendInvitesLoading}
              aria-busy={sendInvitesLoading}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-lg transition-all hover:scale-[1.02] disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100"
              style={{
                background: 'linear-gradient(90deg, #5B3BFA 0%, #00B4FF 100%)',
                boxShadow: '0px 4px 12px rgba(91, 59, 250, 0.2)',
                color: 'white',
                fontWeight: 600
              }}
            >
              <Send className="w-5 h-5" />
              {sendInvitesLoading ? "발송 중…" : "초대 메일 발송"}
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
                          onClick={() => void handleApprove(record)}
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
                          onClick={() => void handleReject(record)}
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

                    {record.status === "contract_signed" && (
                      <div className="flex items-center gap-2 pt-3 border-t" style={{ borderColor: '#E0E0E0' }}>
                        <div className="text-xs flex-1" style={{ color: 'var(--aifix-gray)' }}>
                          프로젝트 진입 승인
                        </div>
                        <span
                          className="flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium"
                          style={{ backgroundColor: '#FFF8E1', color: '#F57F17' }}
                        >
                          <Clock className="w-3 h-3" />
                          회원가입 대기
                        </span>
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