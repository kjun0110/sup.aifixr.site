'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ShieldCheck } from 'lucide-react';

import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/card';
import { Checkbox } from '../ui/checkbox';
import { Input } from '../ui/input';
import { acceptAgreement, getInvitationPreview } from '@/lib/api/invitation';

const LS_REGISTERED_KEY = 'aifix_mock_registered';
const LS_INVITE_KEY = 'aifix_mock_invite';
const LS_AGREEMENT_SIGNED_KEY = 'aifix_mock_third_party_signed';

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
  const [approvalPopupOpen, setApprovalPopupOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const isRegisteredMock = () => {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem(LS_REGISTERED_KEY) === 'true';
  };

  const canSubmit =
    agreeCollection && agreeThirdParty && signerName.trim() === '동의합니다';

  // 페이지 로드 시 이미 동의했는지 확인
  useEffect(() => {
    if (!invite) {
      setIsLoading(false);
      return;
    }

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
      await acceptAgreement(invite);

      localStorage.setItem(LS_INVITE_KEY, invite || '');
      localStorage.setItem(LS_AGREEMENT_SIGNED_KEY, 'true');

      if (isRegisteredMock()) {
        setApprovalPopupOpen(true);
      } else {
        router.push(`/signup/${encodeURIComponent(invite)}/register`);
      }
    } catch (error) {
      console.error('데이터 계약 동의 실패:', error);
      alert('데이터 계약 동의 처리 중 오류가 발생했습니다.');
    } finally {
      setAgreeSubmitting(false);
    }
  };

  const handleApprovalConfirm = () => {
    setApprovalPopupOpen(false);
    router.push('/projects');
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

        {/* 문의 */}
        <SectionCard title="문의">
          <p className="text-sm text-gray-700">
            [원청사] 운영팀 홍길동
          </p>
          <p className="text-sm text-gray-500 mt-1">(이메일 / 연락처)</p>
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
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                서명 <span className="text-red-500">*</span>
              </label>
              <Input
                value={signerName}
                onChange={(e) => setSignerName(e.target.value)}
                placeholder="동의합니다"
                className="bg-white max-w-xs"
              />
              <p className="text-xs text-gray-500 mt-1">서명란에 &quot;동의합니다&quot;를 입력해주세요.</p>
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

      {/* Approval Popup */}
      {approvalPopupOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4"
          onClick={() => setApprovalPopupOpen(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-lg font-bold text-gray-900 mb-2">
              프로젝트 진입 승인요청이 전송되었습니다
            </div>
            <div className="text-sm text-gray-600 leading-relaxed mb-5">
              기존에 가입된 이력이 확인되어 회원가입 화면으로 이동하지 않습니다.
              요청 결과는 승인 단계에서 확인하실 수 있어요.
            </div>
            <div className="flex justify-end">
              <Button
                onClick={handleApprovalConfirm}
                className="px-6 py-2.5 rounded-xl font-semibold"
                style={{
                  background:
                    'linear-gradient(90deg, #5B3BFA 0%, #00B4FF 100%)',
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
