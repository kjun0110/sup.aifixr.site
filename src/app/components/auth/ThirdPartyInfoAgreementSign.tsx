'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AlertCircle, ShieldCheck } from 'lucide-react';

import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/card';
import { Checkbox } from '../ui/checkbox';
import { Input } from '../ui/input';
import { acceptAgreement, getInvitationPreview } from '@/lib/api/invitation';

const LS_INVITE_KEY = 'aifix_mock_invite';
const LS_AGREEMENT_SIGNED_KEY = 'aifix_mock_third_party_signed';

/** apiFetch 오류 메시지에서 서버 `detail` 문자열 추출 */
function parseApiDetailMessage(err: unknown): string {
  if (!(err instanceof Error)) return '초대 정보를 불러오지 못했습니다.';
  const raw = err.message;
  const m = raw.match(/API \d+:\s*([\s\S]+)/);
  if (!m) return raw || '초대 정보를 불러오지 못했습니다.';
  try {
    const j = JSON.parse(m[1].trim()) as { detail?: unknown };
    if (typeof j.detail === 'string') return j.detail;
    if (Array.isArray(j.detail)) {
      return j.detail
        .map((x) => (typeof x === 'object' && x && 'msg' in x ? String((x as { msg: string }).msg) : String(x)))
        .join(' ');
    }
  } catch {
    /* JSON 아니면 본문 그대로 */
  }
  return m[1].trim();
}

const MAX_WIDTH = 720;
const CARD_RADIUS = 12;
const SECTION_PADDING = '24px 32px';
const WARNING_BG = '#FFF4E5';
const BORDER_COLOR = '#E5E7EB';

function SectionCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <Card
      className="mb-6 transition-all hover:shadow-md"
      style={{
        borderRadius: CARD_RADIUS,
        borderColor: BORDER_COLOR,
      }}
    >
      <CardContent className="p-6" style={{ padding: SECTION_PADDING }}>
        <h2 className="font-bold text-gray-900 mb-4 text-base">{title}</h2>
        {children}
      </CardContent>
    </Card>
  );
}

export function ThirdPartyInfoAgreementSign({ invite }: { invite?: string }) {
  return <ThirdPartyInfoAgreementSignInner invite={invite} />;
}

function ThirdPartyInfoAgreementSignInner({ invite }: { invite?: string }) {
  const router = useRouter();

  const [agreeCollection, setAgreeCollection] = useState(false);
  const [agreeThirdParty, setAgreeThirdParty] = useState(false);
  const [agreeEsgOptional, setAgreeEsgOptional] = useState(false);

  const [signerName, setSignerName] = useState('');

  const [agreeSubmitting, setAgreeSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [showSkipModal, setShowSkipModal] = useState(false);

  const canSubmit =
    agreeCollection && agreeThirdParty && signerName.trim() === '동의합니다';

  // 페이지 로드 시 이미 동의했는지 확인
  useEffect(() => {
    if (!invite) {
      setLoadError('초대 링크가 올바르지 않습니다.');
      setIsLoading(false);
      return;
    }

    setLoadError(null);
    getInvitationPreview(invite)
      .then((data) => {
        if (data.contract_agreed_at) {
          // DB에 동의 시각이 있으면 동의서 화면 생략 → 정보 입력으로
          router.replace(`/signup/${encodeURIComponent(invite)}/register`);
        } else {
          setIsLoading(false);
        }
      })
      .catch((error) => {
        console.error('초대 정보 조회 실패:', error);
        setLoadError(parseApiDetailMessage(error));
        setIsLoading(false);
      });
  }, [invite, router]);

  const handleSignSubmit = async () => {
    if (!invite) {
      alert('초대 정보가 없습니다.');
      return;
    }
    if (!canSubmit) {
      alert('필수 동의 2개를 모두 체크하고 서명란에 \'동의합니다\'를 입력해주세요.');
      return;
    }

    setAgreeSubmitting(true);
    try {
      // API 호출: 데이터 계약 동의
      const response = await acceptAgreement(invite);

      localStorage.setItem(LS_INVITE_KEY, invite || '');
      localStorage.setItem(LS_AGREEMENT_SIGNED_KEY, 'true');

      // 기존 사용자인 경우 (회사명·이메일 일치) 회원가입 폼 건너뛰기
      if (response.existing_user_skip_signup) {
        setShowSkipModal(true);
        return;
      }

      // 신규 사용자인 경우 회원가입 폼으로 이동
      router.push(`/signup/${encodeURIComponent(invite)}/register`);
    } catch (error) {
      console.error('데이터 계약 동의 실패:', error);
      alert(parseApiDetailMessage(error));
    } finally {
      setAgreeSubmitting(false);
    }
  };

  // 로딩 중
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#EEF3FF] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">초대 정보를 확인하고 있습니다...</p>
        </div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="min-h-screen bg-[#EEF3FF] flex items-center justify-center p-6">
        <Card
          className="w-full max-w-lg shadow-lg"
          style={{ borderRadius: CARD_RADIUS, borderColor: BORDER_COLOR }}
        >
          <CardContent className="p-8">
            <div className="flex items-start gap-3 mb-4">
              <div
                className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 bg-red-50 text-red-600"
                aria-hidden
              >
                <AlertCircle className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-gray-900">초대 링크를 열 수 없습니다</h1>
                <p className="text-sm text-gray-600 mt-1" role="alert">
                  {loadError}
                </p>
              </div>
            </div>
            <p className="text-xs text-gray-500 leading-relaxed border-t border-gray-100 pt-4">
              초대 메일을 받은 <strong>처음 연 기기·브라우저</strong>에서 링크를 여는 경우에만 이어서 진행할 수
              있습니다. 다른 브라우저나 시크릿 창에서는 열리지 않을 수 있습니다.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#EEF3FF] flex justify-center p-6 md:p-8">
      <div className="w-full" style={{ maxWidth: MAX_WIDTH }}>
        {/* Header */}
        <div className="flex items-start gap-3 mb-6">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
            style={{
              background: 'rgba(91, 59, 250, 0.12)',
              color: 'var(--aifix-primary)',
            }}
          >
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 leading-tight">
              제3자 데이터 제공 및 활용 동의서
            </h1>
          </div>
        </div>

        {/* 1. 안내 목적 */}
        <SectionCard title="1. 안내 목적">
          <p className="text-sm text-gray-700 leading-relaxed mb-3">
            AIFIX는 [원청사]의 공급망 탄소정보를 기반으로 제품 배출량 산정 및 ESG 대응을 지원하는 시스템입니다.
          </p>
          <p className="text-sm text-gray-700 leading-relaxed">
            귀사가 제공하는 데이터는 공급망 관리 및 고객사 요구 대응을 위한 자료로 활용됩니다.
          </p>
        </SectionCard>

        {/* 2. 수집 항목 */}
        <SectionCard title="2. 수집 항목">
          <ul className="list-disc pl-5 space-y-2 text-sm text-gray-700">
            <li>회사 및 사업장 정보</li>
            <li>납품 제품 및 물량</li>
            <li>생산 활동 데이터</li>
            <li>배출계수 등 환경 정보</li>
          </ul>
        </SectionCard>

        {/* 3. 활용 범위 */}
        <SectionCard title="3. 활용 범위">
          <p className="text-sm text-gray-700 leading-relaxed mb-4">
            수집된 정보는 다음 목적을 위해 활용됩니다.
          </p>
          <ul className="list-disc pl-5 space-y-2 text-sm text-gray-700 mb-4">
            <li>제품 단위 배출량(PCF) 산정 및 검증</li>
            <li>공급망 단위 탄소정보 관리</li>
            <li>ESG 보고 및 대응</li>
          </ul>
          <p className="text-sm text-gray-700 leading-relaxed mb-4">
            또한, 필요 시 다음 범위 내에서 공유될 수 있습니다.
          </p>
          <ul className="list-disc pl-5 space-y-2 text-sm text-gray-700 mb-4">
            <li>본 프로젝트에 참여하는 상위 기업</li>
            <li>최종 수요 기업</li>
            <li>관련 규제기관</li>
          </ul>
          <div
            className="rounded-lg p-4 text-sm font-medium"
            style={{ backgroundColor: WARNING_BG, color: '#92400E' }}
          >
            ※ 일부 정보는 공급망 협업 및 대응을 위해 참여 기업 간 공유될 수 있습니다.
          </div>
        </SectionCard>

        {/* 4. 보유 및 관리 */}
        <SectionCard title="4. 보유 및 관리">
          <ul className="list-disc pl-5 space-y-2 text-sm text-gray-700">
            <li>수집된 정보는 서비스 운영 및 ESG 대응을 위해 일정 기간 보관됩니다.</li>
            <li>보관 기간 경과 또는 이용 목적이 변경되는 경우, 관련 기준에 따라 안전하게 관리 또는 파기됩니다.</li>
            <li>데이터는 내부 보안 정책 및 관리 기준에 따라 보호됩니다.</li>
          </ul>
        </SectionCard>

        {/* 5. 참고 사항 */}
        <SectionCard title="5. 참고 사항">
          <ul className="list-disc pl-5 space-y-2 text-sm text-gray-700">
            <li>제공된 정보는 정확한 ESG 대응을 위한 기초 자료로 활용됩니다.</li>
            <li>정보 제공 여부에 따라 일부 서비스 이용에 차이가 있을 수 있습니다.</li>
          </ul>
        </SectionCard>

        {/* 문의 — 원청 구매팀 (개발 시드 담당과 동일 계열) */}
        <SectionCard title="문의">
          <p className="text-sm font-semibold text-gray-900">원청사 구매팀</p>
          <p className="text-sm text-gray-700 mt-2">
            <span className="text-gray-500">담당</span> 박구매
          </p>
          <p className="text-sm text-gray-700 mt-1">
            <span className="text-gray-500">이메일</span>{" "}
            <a href="mailto:aifixr0930@gmail.com" className="text-[#5B3BFA] underline underline-offset-2">
              aifixr0930@gmail.com
            </a>
          </p>
          <p className="text-sm text-gray-700 mt-1">
            <span className="text-gray-500">연락처</span> 02-3456-7890
          </p>
        </SectionCard>

        {/* Agreement Checkboxes */}
        <Card
          className="mb-6"
          style={{
            borderRadius: CARD_RADIUS,
            borderColor: BORDER_COLOR,
          }}
        >
          <CardContent className="p-6" style={{ padding: SECTION_PADDING }}>
            <div className="font-semibold text-gray-900 mb-4">동의 항목</div>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <Checkbox
                  id="agree-collection"
                  checked={agreeCollection}
                  onCheckedChange={(v) => setAgreeCollection(Boolean(v))}
                />
                <label
                  htmlFor="agree-collection"
                  className="text-sm font-medium text-gray-900 cursor-pointer flex-1"
                >
                  [필수] 데이터 수집 및 이용 동의
                </label>
              </div>
              <div className="flex items-start gap-3">
                <Checkbox
                  id="agree-third-party"
                  checked={agreeThirdParty}
                  onCheckedChange={(v) => setAgreeThirdParty(Boolean(v))}
                />
                <label
                  htmlFor="agree-third-party"
                  className="text-sm font-medium text-gray-900 cursor-pointer flex-1"
                >
                  [필수] 제3자 제공 동의
                </label>
              </div>
              <div className="flex items-start gap-3">
                <Checkbox
                  id="agree-esg"
                  checked={agreeEsgOptional}
                  onCheckedChange={(v) => setAgreeEsgOptional(Boolean(v))}
                />
                <label
                  htmlFor="agree-esg"
                  className="text-sm font-medium text-gray-500 cursor-pointer flex-1"
                >
                  [선택] ESG 분석 및 고도화 활용 동의
                </label>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Signature Form */}
        <Card
          className="mb-6"
          style={{
            borderRadius: CARD_RADIUS,
            borderColor: BORDER_COLOR,
          }}
        >
          <CardContent className="p-6" style={{ padding: SECTION_PADDING }}>
            <div className="font-semibold text-gray-900 mb-4">서명 정보</div>
            <div className="flex items-start gap-3">
              <Checkbox
                id="agree-sign"
                checked={signerName === "동의합니다"}
                onCheckedChange={(v) => setSignerName(v ? "동의합니다" : "")}
              />
              <label
                htmlFor="agree-sign"
                className="text-sm font-medium text-gray-900 cursor-pointer flex-1"
              >
                동의합니다 <span className="text-red-500">*</span>
                <p className="text-xs text-gray-500 mt-1 font-normal">위 내용에 동의합니다.</p>
              </label>
            </div>
          </CardContent>
        </Card>

        {/* CTA Button */}
        <div className="flex justify-end">
          <Button
            onClick={handleSignSubmit}
            disabled={!canSubmit || agreeSubmitting}
            className="px-8 py-3 rounded-xl font-semibold text-base disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:opacity-50"
            style={{
              background: 'linear-gradient(90deg, #5B3BFA 0%, #00B4FF 100%)',
              color: 'white',
              boxShadow: '0px 8px 20px rgba(91, 59, 250, 0.18)',
            }}
          >
            {agreeSubmitting ? '처리 중...' : '동의하고 계속하기'}
          </Button>
        </div>
      </div>

      {/* 기존 회원 건너뛰기 모달 */}
      {showSkipModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4" style={{ boxShadow: '0px 8px 32px rgba(0, 0, 0, 0.12)' }}>
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
                <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">동의가 완료되었습니다</h3>
              <p className="text-gray-600 mb-2 text-center">이미 등록된 계정(동일 회사명·이메일)이므로</p>
              <p className="text-gray-600 mb-2 text-center">회원가입을 건너뛰고 직상위 차사에게</p>
              <p className="text-gray-600 mb-4 text-center">승인 요청이 전달되었습니다.</p>
              <p className="text-sm text-gray-500 mb-6 text-center">지금도 기존 계정으로 로그인할 수 있습니다.<br/>프로젝트 진입·메뉴는 직상위 차사 승인 후 표시됩니다.</p>
              <Button
                onClick={() => {
                  setShowSkipModal(false);
                  router.push('/');
                }}
                className="w-full"
                style={{
                  background: 'linear-gradient(90deg, #5B3BFA 0%, #00B4FF 100%)',
                  color: 'white',
                }}
              >
                확인
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
