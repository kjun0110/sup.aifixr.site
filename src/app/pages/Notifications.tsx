'use client';

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { 
  Check, 
  FileText, 
  Search, 
  Calendar as CalendarIcon,
  CirclePlus,
  RotateCcw,
  Send as SendIcon,
  FileCheck,
  ThumbsUp,
  ThumbsDown,
  Users,
} from "lucide-react";
import { format, isWithinInterval, startOfDay, endOfDay } from "date-fns";
import { ko } from "date-fns/locale";
import { Button } from "../components/ui/button";
import { Calendar } from "../components/ui/calendar";
import { Input } from "../components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "../components/ui/popover";
import { toast } from "sonner";
import { cn } from "../components/ui/utils";
import {
  listMyNotifications,
  markNotificationRead,
  type NotificationItemOut,
} from "../../lib/api/notification";
import { approveSignupRequest, rejectSignupRequest } from "../../lib/api/signup-review";

type DateRange = { from: Date | undefined; to?: Date | undefined };

// timestamp "YYYY-MM-DD HH:mm:ss" → Date
const parseTimestamp = (ts: string): Date => {
  const iso = ts.replace(" ", "T");
  return new Date(iso);
};

type HistoryType =
  | "save"
  | "request"
  | "calculate"
  | "send"
  | "complete"
  | "entry_request"
  | "entry_approved"
  | "partner_tier_entry";

type HistoryRecord = {
  id: string;
  timestamp: string;
  type: HistoryType;
  changeContent: string;
  user: string;
  version: string;
  projectName: string;
  projectStatus: "진행중" | "완료";
  clientName: string;
  supplyItem: string;
  contractNumber: string;
  deadline: string;
  lastUpdate: string;
  fromUser: string;
  toUser: string;
  isDirectSubordinate?: boolean;
  isRead?: boolean;
  direction: "inbox" | "outbox"; // 수신함: toUser===우리회사, 발신함: fromUser===우리회사
  requesterEmail?: string;
  requestMessage?: string;
  /** KJ nt_user_notifications.id */
  backendId?: number;
  fromApi?: boolean;
  signupRequestId?: number;
};

function isoToLocalTimestamp(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) {
    return iso.replace("T", " ").slice(0, 19);
  }
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const h = String(d.getHours()).padStart(2, "0");
  const min = String(d.getMinutes()).padStart(2, "0");
  const s = String(d.getSeconds()).padStart(2, "0");
  return `${y}-${m}-${day} ${h}:${min}:${s}`;
}

function mapKjToHistoryRecord(row: NotificationItemOut): HistoryRecord {
  const ts = row.created_at ? isoToLocalTimestamp(row.created_at) : isoToLocalTimestamp(new Date().toISOString());
  const base = {
    id: `kj-${row.id}`,
    backendId: row.id,
    fromApi: true as const,
    timestamp: ts,
    version: "-",
    projectStatus: "진행중" as const,
    contractNumber: "-",
    deadline: "-",
    lastUpdate: "-",
    isRead: Boolean(row.read_at),
    direction: "inbox" as const,
    toUser: "우리회사",
  };

  if (row.notification_type === "signup_submitted_for_review") {
    const companyMatch = row.body?.match(/「([^」]+)」/);
    const fromUser = companyMatch?.[1]?.replace(/님$/, "")?.trim() || "직하위 협력사";
    return {
      ...base,
      type: "entry_request",
      changeContent: row.body || "프로젝트 진입 요청이 발생했습니다.",
      user: fromUser,
      projectName: row.title,
      clientName: row.title,
      supplyItem: "—",
      fromUser,
      isDirectSubordinate: true,
      signupRequestId: row.signup_request_id ?? undefined,
      requestMessage: row.body || undefined,
    };
  }

  if (row.notification_type === "signup_approved_broadcast") {
    return {
      ...base,
      type: "partner_tier_entry",
      changeContent: row.body || "",
      user: "공급망",
      projectName: row.title,
      clientName: row.title,
      supplyItem: "—",
      fromUser: "공급망 알림",
      isDirectSubordinate: false,
    };
  }

  if (row.notification_type === "modification_request") {
    return {
      ...base,
      type: "request",
      changeContent: row.body || row.title,
      user: "상위차사",
      projectName: row.title,
      clientName: row.title,
      supplyItem: "—",
      fromUser: "상위차사",
    };
  }

  return {
    ...base,
    type: "complete",
    changeContent: row.body || row.title,
    user: "-",
    projectName: row.title,
    clientName: row.title,
    supplyItem: "—",
    fromUser: "알림",
    isDirectSubordinate: false,
  };
}

/** 데모용 보조 목록 — 진입 요청/승인은 API만 사용(중복 방지) */
const RAW_MOCK_NOTIFICATIONS: HistoryRecord[] = [
    {
      id: "monthly-reminder-hardcoded-1",
      timestamp: "2026-04-01 00:05:00",
      type: "request",
      changeContent: "매월 1일 자동으로 전월데이터 입력을 진행해주세요",
      user: "시스템",
      version: "-",
      projectName: "전월 데이터 입력 리마인드",
      projectStatus: "진행중",
      clientName: "AIFIX",
      supplyItem: "전월 데이터",
      contractNumber: "-",
      deadline: "-",
      lastUpdate: "2026-04-01",
      fromUser: "시스템",
      toUser: "우리회사",
      isRead: false,
      direction: "inbox",
    },
    {
      id: "1",
      timestamp: "2026-03-04 16:10:23",
      type: "save",
      changeContent: "PCF 계산 결과 값 변경 (탄소 배출량 업데이트)",
      user: "협력사 A",
      version: "v2.3",
      projectName: "전기차 배터리 팩 프로젝트",
      projectStatus: "진행중",
      clientName: "원청사 A",
      supplyItem: "리튬이온 배터리 팩",
      contractNumber: "CT-2026-001",
      deadline: "2026-06-30",
      lastUpdate: "2026-03-01",
      fromUser: "협력사 A",
      toUser: "원청사 A",
      isRead: true,
      direction: "outbox",
    },
    {
      id: "2",
      timestamp: "2026-03-04 15:24:15",
      type: "request",
      changeContent: "인력 정보 수정 요청 (HI-72023 근무자)",
      user: "인력 담당자",
      version: "v2.3",
      projectName: "반도체 부품 공급 프로젝트",
      projectStatus: "진행중",
      clientName: "협력사 B",
      supplyItem: "실리콘 웨이퍼",
      contractNumber: "CT-2026-002",
      deadline: "2026-05-15",
      lastUpdate: "2026-02-28",
      fromUser: "인력 담당자",
      toUser: "우리회사",
      isRead: false,
      direction: "inbox",
    },
    {
      id: "3",
      timestamp: "2026-03-04 14:44:32",
      type: "calculate",
      changeContent: "동영상인력 연계분 수치 변경 지점 전송 (3건)",
      user: "모빌리티",
      version: "v2.3",
      projectName: "전기차 배터리 팩 프로젝트",
      projectStatus: "진행중",
      clientName: "원청사 A",
      supplyItem: "리튬이온 배터리 팩",
      contractNumber: "CT-2026-001",
      deadline: "2026-06-30",
      lastUpdate: "2026-03-01",
      fromUser: "모빌리티",
      toUser: "원청사 A",
      isRead: true,
      direction: "outbox",
    },
    {
      id: "4",
      timestamp: "2026-03-04 11:20:18",
      type: "send",
      changeContent: "부품 검증 보고서 전송 (최초 수행 시작)",
      user: "지속가능팀",
      version: "",
      projectName: "대양앙 모듈 제조 프로젝트",
      projectStatus: "진행중",
      clientName: "협력사 C",
      supplyItem: "폴리실리콘 원자재",
      contractNumber: "CT-2026-003",
      deadline: "2026-07-20",
      lastUpdate: "2026-03-03",
      fromUser: "지속가능팀",
      toUser: "협력사 C",
      isRead: true,
      direction: "outbox",
    },
    {
      id: "6",
      timestamp: "2026-03-03 14:12:08",
      type: "calculate",
      changeContent: "PCF 계산 값변경 PCF+1988.8 kg (CO2e)",
      user: "인력 담당자",
      version: "v2.2",
      projectName: "반도체 부품 공급 프로젝트",
      projectStatus: "진행중",
      clientName: "협력사 B",
      supplyItem: "실리콘 웨이퍼",
      contractNumber: "CT-2026-002",
      deadline: "2026-05-15",
      lastUpdate: "2026-02-28",
      fromUser: "우리회사",
      toUser: "협력사 B",
      isRead: true,
      direction: "outbox",
    },
    {
      id: "7",
      timestamp: "2026-03-04 10:30:00",
      type: "entry_request",
      changeContent: "프로젝트 진입 요청이 도착했습니다.",
      user: "동우전자부품",
      version: "-",
      projectName: "전기차 배터리 팩 프로젝트",
      projectStatus: "진행중",
      clientName: "원청사 A",
      supplyItem: "리튬이온 배터리 팩",
      contractNumber: "CT-2026-001",
      deadline: "2026-06-30",
      lastUpdate: "2026-03-04",
      fromUser: "동우전자부품",
      toUser: "우리회사",
      isDirectSubordinate: true,
      isRead: false,
      direction: "inbox",
      requesterEmail: "contact@dongwoo.co.kr",
      requestMessage: "프로젝트 진입 승인 부탁드립니다.",
    },
    {
      id: "8",
      timestamp: "2026-03-04 09:15:00",
      type: "entry_approved",
      changeContent: "프로젝트 진입 승인 완료",
      user: "세진케미칼",
      version: "-",
      projectName: "전기차 배터리 팩 프로젝트",
      projectStatus: "진행중",
      clientName: "원청사 A",
      supplyItem: "리튬이온 배터리 팩",
      contractNumber: "CT-2026-001",
      deadline: "2026-06-30",
      lastUpdate: "2026-03-04",
      fromUser: "우리회사",
      toUser: "세진케미칼",
      isDirectSubordinate: false,
      isRead: true,
      direction: "outbox",
    },
  ];

const MOCK_SUPPLEMENT_RECORDS: HistoryRecord[] = RAW_MOCK_NOTIFICATIONS.filter(
  (r) => r.type !== "entry_request" && r.type !== "entry_approved",
);

export function Notifications() {
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRecord, setSelectedRecord] = useState<HistoryRecord | null>(null);
  const [records, setRecords] = useState<HistoryRecord[]>([]);
  const [listLoading, setListLoading] = useState(true);
  const [listError, setListError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const loadNotifications = useCallback(async () => {
    setListLoading(true);
    setListError(null);
    try {
      const rows = await listMyNotifications({ limit: 100, offset: 0 });
      const apiMapped = rows.map(mapKjToHistoryRecord);
      const merged = [...apiMapped, ...MOCK_SUPPLEMENT_RECORDS].sort(
        (a, b) => parseTimestamp(b.timestamp).getTime() - parseTimestamp(a.timestamp).getTime(),
      );
      setRecords(merged);
    } catch (e) {
      setListError(e instanceof Error ? e.message : "알림을 불러오지 못했습니다.");
      setRecords(
        [...MOCK_SUPPLEMENT_RECORDS].sort(
          (a, b) => parseTimestamp(b.timestamp).getTime() - parseTimestamp(a.timestamp).getTime(),
        ),
      );
    } finally {
      setListLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadNotifications();
  }, [loadNotifications]);

  const [mailbox, setMailbox] = useState<"inbox" | "outbox">("inbox");
  const [showUnreadOnly, setShowUnreadOnly] = useState(false);
  const [showActionRequiredOnly, setShowActionRequiredOnly] = useState(false);

  const getProjectDisplayName = (r: HistoryRecord) => `[${r.clientName}] ${r.supplyItem} 구성`;
  const getBriefMessage = (r: HistoryRecord) => `(${r.fromUser}) ${r.changeContent}`;

  const shouldShowApprovalActions =
    selectedRecord?.type === "entry_request" &&
    selectedRecord?.isDirectSubordinate === true &&
    (Boolean(selectedRecord.signupRequestId) || selectedRecord.fromApi !== true);

  const handleApprove = async () => {
    if (!selectedRecord) return;
    if (selectedRecord.signupRequestId != null) {
      setActionLoading(true);
      try {
        await approveSignupRequest(selectedRecord.signupRequestId);
        toast.success("프로젝트 진입을 승인했습니다.");
        setSelectedRecord(null);
        await loadNotifications();
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "승인 처리에 실패했습니다.");
      } finally {
        setActionLoading(false);
      }
      return;
    }
    toast.success("진입 승인 처리되었습니다 (mock)");
    setSelectedRecord(null);
  };

  const handleReject = async () => {
    if (!selectedRecord) return;
    if (selectedRecord.signupRequestId != null) {
      const reason = window.prompt("반려 사유를 입력하세요. (선택)") ?? undefined;
      setActionLoading(true);
      try {
        await rejectSignupRequest(selectedRecord.signupRequestId, reason || undefined);
        toast.success("진입 요청을 반려했습니다.");
        setSelectedRecord(null);
        await loadNotifications();
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "반려 처리에 실패했습니다.");
      } finally {
        setActionLoading(false);
      }
      return;
    }
    toast.success("진입 반려 처리되었습니다 (mock)");
    setSelectedRecord(null);
  };

  const getTypeIcon = (type: HistoryType) => {
    switch (type) {
      case "save":
        return <FileCheck className="w-4 h-4" />;
      case "request":
        return <CirclePlus className="w-4 h-4" />;
      case "calculate":
        return <RotateCcw className="w-4 h-4" />;
      case "send":
        return <SendIcon className="w-4 h-4" />;
      case "complete":
        return <Check className="w-4 h-4" />;
      case "entry_request":
        return <CirclePlus className="w-4 h-4" />;
      case "entry_approved":
        return <Check className="w-4 h-4" />;
      case "partner_tier_entry":
        return <Users className="w-4 h-4" />;
      default:
        return <FileText className="w-4 h-4" />;
    }
  };

  const getTypeLabel = (type: HistoryType) => {
    switch (type) {
      case "save":
        return "저장";
      case "request":
        return "요청 수정";
      case "calculate":
        return "계산";
      case "send":
        return "전송";
      case "complete":
        return "완료";
      case "entry_request":
        return "진입 요청";
      case "entry_approved":
        return "진입 승인";
      case "partner_tier_entry":
        return "협력사 진입";
      default:
        return type;
    }
  };

  const getTypeColor = (type: HistoryType) => {
    switch (type) {
      case "save":
        return "#4CAF50";
      case "request":
        return "#FF9800";
      case "calculate":
        return "#00B4FF";
      case "send":
        return "#9C27B0";
      case "complete":
        return "#009688";
      case "entry_request":
        return "#FF9800";
      case "entry_approved":
        return "#4CAF50";
      case "partner_tier_entry":
        return "#00897B";
      default:
        return "#757575";
    }
  };

  const isActionRequired = (r: HistoryRecord) =>
    r.type === "entry_request" && r.isDirectSubordinate === true;

  const filteredRecords = records.filter((record) => {
    if (record.direction !== mailbox) return false;

    if (mailbox === "inbox") {
      if (showUnreadOnly && record.isRead) return false;
      if (showActionRequiredOnly && !isActionRequired(record)) return false;
    }

    if (dateRange?.from) {
      const notifDate = startOfDay(parseTimestamp(record.timestamp));
      if (dateRange.to) {
        const rangeStart = startOfDay(dateRange.from);
        const rangeEnd = endOfDay(dateRange.to);
        if (!isWithinInterval(notifDate, { start: rangeStart, end: rangeEnd })) return false;
      } else {
        const targetDay = startOfDay(dateRange.from);
        if (notifDate.getTime() !== targetDay.getTime()) return false;
      }
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const projectDisplay = getProjectDisplayName(record);
      const briefMsg = getBriefMessage(record);
      const matches =
        record.changeContent.toLowerCase().includes(q) ||
        projectDisplay.toLowerCase().includes(q) ||
        record.fromUser.toLowerCase().includes(q) ||
        record.toUser.toLowerCase().includes(q) ||
        record.clientName.toLowerCase().includes(q) ||
        briefMsg.toLowerCase().includes(q);
      if (!matches) return false;
    }
    return true;
  });

  const inboxCounts = {
    total: records.filter((r) => r.direction === "inbox").length,
    unread: records.filter((r) => r.direction === "inbox" && !r.isRead).length,
    actionRequired: records.filter((r) => r.direction === "inbox" && isActionRequired(r)).length,
  };
  const outboxCount = records.filter((r) => r.direction === "outbox").length;

  const handleSelectRecord = (record: HistoryRecord) => {
    setSelectedRecord(record);
    const markLocalRead = () => {
      setRecords((prev) => prev.map((r) => (r.id === record.id ? { ...r, isRead: true } : r)));
      setSelectedRecord((cur) => (cur?.id === record.id ? { ...cur, isRead: true } : cur));
    };
    if (record.fromApi && record.backendId != null && !record.isRead) {
      void markNotificationRead(record.backendId).then(markLocalRead).catch(markLocalRead);
    } else {
      markLocalRead();
    }
  };

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="mb-8">
        <h1 className="text-5xl mb-4" style={{ fontWeight: 700, color: 'var(--aifix-navy)' }}>
          알림
        </h1>
    
      </div>

      {/* 필터 영역 - 기간 선택 + 검색 */}
      <div 
        className="bg-white p-6 rounded-2xl border border-gray-200 mb-6"
        style={{ boxShadow: "0px 2px 8px rgba(0, 0, 0, 0.04)" }}
      >
        <div className="flex flex-wrap items-end gap-4">
          <div>
            <label className="block mb-2 text-base font-medium text-gray-700">
              기간 선택
            </label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "min-w-[260px] justify-start text-left font-normal",
                    !dateRange?.from && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateRange?.from ? (
                    dateRange.to ? (
                      <>
                        {format(dateRange.from, "yyyy.MM.dd", { locale: ko })} ~{" "}
                        {format(dateRange.to, "yyyy.MM.dd", { locale: ko })}
                      </>
                    ) : (
                      format(dateRange.from, "yyyy.MM.dd", { locale: ko })
                    )
                  ) : (
                    "기간을 선택하세요 (하루 또는 구간)"
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="range"
                  defaultMonth={dateRange?.from ?? new Date()}
                  selected={dateRange}
                  onSelect={setDateRange}
                  numberOfMonths={2}
                  locale={ko}
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="flex-1 min-w-[200px] max-w-md">
            <label className="block mb-2 text-base font-medium text-gray-700">
              검색
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="상위차사/협력사/메시지 검색"
                className="pl-9"
              />
            </div>
          </div>

          <Button
            variant="outline"
            onClick={() => {
              setDateRange(undefined);
              setSearchQuery("");
              setShowUnreadOnly(false);
              setShowActionRequiredOnly(false);
            }}
            className="flex items-center gap-2"
          >
            <RotateCcw className="w-4 h-4" />
            필터 초기화
          </Button>
        </div>
      </div>

      {/* 수신함 / 발신함 탭 */}
      <div className="flex items-center gap-2 border-b border-gray-200 mb-4">
        <button
          type="button"
          onClick={() => setMailbox("inbox")}
          className={cn(
            "px-4 py-3 text-xl font-bold border-b-2 -mb-px transition-colors",
            mailbox === "inbox"
              ? "border-[var(--aifix-primary)] text-[var(--aifix-primary)]"
              : "border-transparent text-gray-500 hover:text-gray-700"
          )}
        >
          수신함 ({inboxCounts.total}건)
        </button>
        <button
          type="button"
          onClick={() => {
            setMailbox("outbox");
            setShowUnreadOnly(false);
            setShowActionRequiredOnly(false);
          }}
          className={cn(
            "px-4 py-3 text-xl font-bold border-b-2 -mb-px transition-colors",
            mailbox === "outbox"
              ? "border-[var(--aifix-primary)] text-[var(--aifix-primary)]"
              : "border-transparent text-gray-500 hover:text-gray-700"
          )}
        >
          발신함 ({outboxCount}건)
        </button>

        {mailbox === "inbox" && (
          <div className="ml-6 flex items-center gap-2">
            <span className="text-sm text-gray-500">
              빠른 필터:
            </span>
            <button
              type="button"
              onClick={() => setShowUnreadOnly(!showUnreadOnly)}
              className={cn(
                "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-colors",
                showUnreadOnly
                  ? "bg-purple-100 text-purple-800 border border-purple-200"
                  : "bg-gray-100 text-gray-600 border border-gray-200 hover:bg-gray-200"
              )}
            >
              <span className={cn("w-2 h-2 rounded-full", showUnreadOnly ? "bg-purple-500" : "bg-gray-400")} />
              미읽음 {inboxCounts.unread > 0 && `(${inboxCounts.unread})`}
            </button>
            <button
              type="button"
              onClick={() => setShowActionRequiredOnly(!showActionRequiredOnly)}
              className={cn(
                "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-colors",
                showActionRequiredOnly
                  ? "bg-amber-100 text-amber-800 border border-amber-200"
                  : "bg-gray-100 text-gray-600 border border-gray-200 hover:bg-gray-200"
              )}
            >
              <span className={cn("w-2 h-2 rounded-full", showActionRequiredOnly ? "bg-amber-500" : "bg-gray-400")} />
              액션 필요 {inboxCounts.actionRequired > 0 && `(${inboxCounts.actionRequired})`}
            </button>
          </div>
        )}
      </div>

      {/* 이력 목록 */}
      <div className="grid grid-cols-12 gap-6">
        {/* 왼쪽: 이력 리스트 */}
        <div className="col-span-7">
          <div 
            className="bg-white rounded-2xl border border-gray-200 overflow-hidden"
            style={{ boxShadow: "0px 4px 16px rgba(0, 0, 0, 0.05)" }}
          >
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-xl font-bold" style={{ color: 'var(--aifix-navy)' }}>
                {mailbox === "inbox" ? "수신함" : "발신함"} 목록
              </h3>
              <p className="text-base mt-1 text-gray-500">
                총 {filteredRecords.length}건의 알림
                {listLoading ? " · 불러오는 중…" : null}
              </p>
              {listError ? (
                <p className="text-sm text-amber-700 mt-2">{listError} (데모 목록만 표시됩니다)</p>
              ) : null}
            </div>

            {/* 테이블 헤더 */}
            <div 
              className="grid grid-cols-12 gap-4 px-6 py-4 border-b border-gray-200"
              style={{ backgroundColor: '#F9FAFB' }}
            >
              <div className="col-span-2 text-sm font-semibold text-gray-500">
                시간
              </div>
              <div className="col-span-2 text-sm font-semibold text-gray-500">
                유형
              </div>
              <div className="col-span-4 text-sm font-semibold text-gray-500">
                프로젝트
              </div>
              <div className="col-span-4 text-sm font-semibold text-gray-500">
                발신 → 수신
              </div>
            </div>

            {/* 테이블 바디 */}
            <div style={{ maxHeight: '600px', overflowY: 'auto' }}>
              {listLoading && records.length === 0 ? (
                <div className="px-6 py-12 text-center text-gray-500 text-sm">알림을 불러오는 중입니다…</div>
              ) : null}
              {filteredRecords.map((record) => {
                const isSelected = selectedRecord?.id === record.id;

                return (
                  <div
                    key={record.id}
                    onClick={() => handleSelectRecord(record)}
                    className={cn(
                      "grid grid-cols-12 gap-4 px-6 py-4 border-b border-gray-100 cursor-pointer transition-all hover:bg-gray-50",
                      mailbox === "inbox" && !record.isRead && "bg-blue-50/50"
                    )}
                    style={{
                      backgroundColor: isSelected ? 'var(--aifix-secondary-light)' : undefined
                    }}
                  >
                    {/* 시간 (미읽음 시 파란점) */}
                    <div className="col-span-2 flex items-start gap-1.5">
                      {mailbox === "inbox" && !record.isRead && (
                        <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0 mt-1.5" />
                      )}
                      <div>
                        <div className="text-sm font-medium" style={{ color: 'var(--aifix-navy)' }}>
                          {record.timestamp.split(' ')[0]}
                        </div>
                        <div className="text-sm text-gray-500">
                          {record.timestamp.split(' ')[1]}
                        </div>
                      </div>
                    </div>

                    {/* 유형 */}
                    <div className="col-span-2 flex flex-wrap items-center gap-1">
                      <div 
                        className="flex items-center gap-1 px-2 py-1 rounded text-sm font-semibold"
                        style={{ 
                          backgroundColor: getTypeColor(record.type) + '20',
                          color: getTypeColor(record.type),
                          width: 'fit-content'
                        }}
                      >
                        {getTypeIcon(record.type)}
                        <span>{getTypeLabel(record.type)}</span>
                      </div>
                    </div>

                    {/* 프로젝트 - [상위차사] 납품항목 구성 형식 */}
                    <div className="col-span-4">
                      <div className="text-sm font-semibold" style={{ color: 'var(--aifix-navy)' }}>
                        {getProjectDisplayName(record).length > 25 
                          ? getProjectDisplayName(record).substring(0, 25) + '...' 
                          : getProjectDisplayName(record)}
                      </div>
                    </div>

                    {/* 발신 → 수신 */}
                    <div className="col-span-4">
                      <div className="text-sm" style={{ color: 'var(--aifix-navy)' }}>
                        <span style={{ fontWeight: 500 }}>{record.fromUser}</span>
                        <span style={{ color: 'var(--aifix-gray)', margin: '0 4px' }}>→</span>
                        <span style={{ fontWeight: 500 }}>{record.toUser}</span>
                      </div>
                    </div>

                    {/* 한줄설명 (원청사와 동일) */}
                    <div className="col-span-12 mt-1.5 pt-1.5 border-t border-gray-100 text-sm text-gray-500 min-w-0 overflow-hidden">
                      <span className="truncate block">{getBriefMessage(record)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* 오른쪽: 알림 상세 (원청사와 동일 구조) */}
        <div className="col-span-5">
          {selectedRecord ? (
            <div 
              className="bg-white rounded-2xl border border-gray-200 p-5"
              style={{ boxShadow: "0px 2px 8px rgba(0, 0, 0, 0.04)", position: 'sticky', top: '24px' }}
            >
              <h3 className="text-xl font-bold mb-5 text-gray-900">알림 상세</h3>

              <div className="space-y-5">
                {/* 헤더: 배지 + ID */}
                <div className="flex items-start justify-between gap-3">
                  <div 
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-sm font-semibold border"
                    style={{ 
                      backgroundColor: getTypeColor(selectedRecord.type) + '15',
                      color: getTypeColor(selectedRecord.type),
                      borderColor: getTypeColor(selectedRecord.type) + '40'
                    }}
                  >
                    {getTypeIcon(selectedRecord.type)}
                    <span>{getTypeLabel(selectedRecord.type)}</span>
                  </div>
                  <span className="text-sm text-gray-400 shrink-0">ID: {selectedRecord.id}</span>
                </div>

                {/* 프로젝트 */}
                <div>
                  <div className="text-base font-semibold text-gray-900 break-words">
                    {getProjectDisplayName(selectedRecord)}
                  </div>
                  <div className="text-sm text-gray-500 mt-1">
                    {selectedRecord.clientName} · {selectedRecord.supplyItem}
                  </div>
                </div>

                {/* 시간 */}
                <div className="text-sm text-gray-500">
                  {selectedRecord.timestamp}
                </div>

                <hr className="border-gray-100 my-1" />

                {/* 메시지(변경 내용) */}
                <div className="text-sm text-gray-700 break-words leading-relaxed">
                  {selectedRecord.changeContent}
                </div>

                {/* 발신 → 수신 */}
                <div className="text-sm text-gray-600">
                  <span className="font-medium">{selectedRecord.fromUser}</span>
                  <span className="text-gray-400 mx-1">→</span>
                  <span className="font-medium">{selectedRecord.toUser}</span>
                </div>

                {/* 승인 요청 상세 */}
                {shouldShowApprovalActions && (
                  <div className="space-y-4 pt-2">
                    <hr className="border-gray-100" />
                    <div>
                      <div className="text-sm font-semibold text-gray-900 mb-3">승인 요청 상세</div>
                      <div className="space-y-2 text-sm">
                        <div className="flex gap-2">
                          <span className="text-gray-500 shrink-0 w-20">요청자</span>
                          <span className="text-gray-800">{selectedRecord.fromUser} 담당자</span>
                        </div>
                        {selectedRecord.requesterEmail && (
                          <div className="flex gap-2">
                            <span className="text-gray-500 shrink-0 w-20">이메일</span>
                            <span className="text-gray-800 break-all">{selectedRecord.requesterEmail}</span>
                          </div>
                        )}
                        {selectedRecord.requestMessage && (
                          <div className="flex gap-2">
                            <span className="text-gray-500 shrink-0 w-20">요청 메시지</span>
                            <span className="text-gray-800 break-words">{selectedRecord.requestMessage}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        onClick={() => void handleApprove()}
                        size="sm"
                        disabled={actionLoading}
                        className="bg-green-600 hover:bg-green-700 text-white"
                      >
                        <ThumbsUp size={14} className="mr-1.5" />
                        승인
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => void handleReject()}
                        disabled={actionLoading}
                        className="border-red-200 text-red-600 hover:bg-red-50"
                      >
                        <ThumbsDown size={14} className="mr-1.5" />
                        반려
                      </Button>
                    </div>
                    <p className="text-xs text-gray-400">
                      직하위 협력사의 가입 제출 알림이며, 서버에 신청 ID가 연결된 경우에만 승인·반려할 수 있습니다.
                    </p>
                  </div>
                )}

                {/* 프로젝트 일정 (협력사 전용) */}
                <div className="pt-2 pb-1">
                  <div className="flex items-center justify-between text-sm py-2 border-t border-gray-100">
                    <span className="text-gray-500">마감일</span>
                    <span className="text-gray-800 font-medium">{selectedRecord.deadline}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm py-2 border-t border-gray-100">
                    <span className="text-gray-500">최근 업데이트</span>
                    <span className="text-gray-800 font-medium">{selectedRecord.lastUpdate}</span>
                  </div>
                </div>

                <div className="pt-1">
                  <Button asChild variant="outline" size="sm">
                    <Link href="/projects">프로젝트 보기</Link>
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div 
              className="bg-white rounded-2xl border border-gray-200 p-12 text-center"
              style={{ boxShadow: "0px 2px 8px rgba(0, 0, 0, 0.04)" }}
            >
              <FileText 
                className="w-16 h-16 mx-auto mb-4" 
                style={{ color: 'var(--aifix-gray)', opacity: 0.5 }} 
              />
              <p className="text-base text-gray-500">
                알림 행을 선택하면<br />상세 정보가 표시됩니다
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
