'use client';

import { useState, useEffect, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { Building2, User, Mail, Phone, Lock, Briefcase, ArrowLeft, AlertCircle, MapPin, X } from 'lucide-react';

import { Button } from '../ui/button';
import { cn } from '../ui/utils';
import { Card, CardContent } from '../ui/card';
import { Checkbox } from '../ui/checkbox';
import { Input } from '../ui/input';
import { getInvitationPreview } from '@/lib/api/invitation';
import { submitSignup, submitGoogleSignup } from '@/lib/api/iam';
import { getIso3166Alpha2KoOptions } from '@/lib/iso3166Alpha2Ko';

const LS_INVITE_KEY = 'aifix_mock_invite';
type SignupMethod = 'none' | 'google' | 'email';

/** 사업자등록번호: 숫자만 추출 */
function businessRegDigitsOnly(raw: string): string {
  return raw.replace(/\D/g, '');
}

/** 10자리 숫자 → 000-00-00000 (표시·저장용) */
function formatBusinessRegNoForSubmit(digits10: string): string {
  if (digits10.length !== 10) return digits10;
  return `${digits10.slice(0, 3)}-${digits10.slice(3, 5)}-${digits10.slice(5)}`;
}

// Field 컴포넌트를 외부로 이동하여 재생성 방지
const Field = ({
  label,
  icon,
  value,
  onChange,
  placeholder,
  type = 'text',
  required,
}: {
  label: string;
  icon: ReactNode;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  required?: boolean;
}) => {
  return (
    <div>
      <label className="block text-sm font-semibold text-gray-900 mb-2">
        {label}
        {required ? <span className="text-red-500 ml-1">*</span> : null}
      </label>
      <div className="relative">
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">{icon}</div>
        <Input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="pl-10 bg-white"
        />
      </div>
    </div>
  );
};

function CountryLocationPicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const entries = getIso3166Alpha2KoOptions();

  const normalized = q.trim().toLowerCase();
  const filtered = entries.filter((e) => {
    if (!normalized) return true;
    return e.nameKo.toLowerCase().includes(normalized) || e.code.toLowerCase().includes(normalized);
  });

  const close = () => {
    setOpen(false);
    setQ('');
  };

  return (
    <div>
      <label className="block text-sm font-semibold text-gray-900 mb-2">
        국가소재지
        <span className="text-red-500 ml-1">*</span>
      </label>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-left text-sm text-gray-900 transition-all hover:border-gray-400"
      >
        <span className="flex items-center gap-2">
          <MapPin className="w-4 h-4 text-gray-400" />
          <span className="truncate">{value || '국가명 검색 (클릭)'}</span>
        </span>
      </button>
      {open && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4" onClick={close}>
          <div
            className="flex max-h-[min(32rem,85vh)] w-full max-w-lg min-h-0 flex-col overflow-hidden rounded-2xl bg-white shadow-xl"
            role="dialog"
            aria-modal="true"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
              <div className="flex items-center gap-2">
                <MapPin className="h-5 w-5 text-[#5B3BFA]" />
                <h2 className="text-lg font-bold text-gray-900">국가 선택</h2>
              </div>
              <button
                type="button"
                onClick={close}
                className="rounded-lg p-2 text-gray-500 hover:bg-gray-100"
                aria-label="닫기"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="shrink-0 space-y-2 border-b border-gray-100 px-5 py-3">
              <Input
                type="text"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="국가명·코드 검색 (예: 한국, KR)"
                className="bg-white"
              />
              <p className="text-xs text-gray-500">국가명(한글) 또는 ISO 코드로 검색합니다. ({filtered.length}건)</p>
            </div>
            <ul className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-2 py-2">
              {filtered.map((e) => (
                <li key={e.code}>
                  <button
                    type="button"
                    className="w-full rounded-lg px-3 py-2 text-left text-sm text-[var(--aifix-navy)] hover:bg-violet-50"
                    onClick={() => {
                      onChange(e.nameKo);
                      close();
                    }}
                  >
                    {e.nameKo} <span className="font-mono text-xs text-gray-500">({e.code})</span>
                  </button>
                </li>
              ))}
              {filtered.length === 0 && <li className="px-3 py-6 text-center text-sm text-gray-400">검색 결과 없음</li>}
            </ul>
            <div className="flex justify-end border-t border-gray-200 px-5 py-3">
              <button
                type="button"
                onClick={close}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export function SignupRegister({ invite }: { invite?: string }) {
  const router = useRouter();

  const [signupMethod, setSignupMethod] = useState<SignupMethod>('none');
  const [googleEmail, setGoogleEmail] = useState<string | null>(null);
  const [googleName, setGoogleName] = useState<string | null>(null);
  const [googleUserId, setGoogleUserId] = useState<string | null>(null);
  const [googleRefreshToken, setGoogleRefreshToken] = useState<string | null>(null);
  const [googleScope, setGoogleScope] = useState<string | null>(null);

  const [companyName, setCompanyName] = useState('');
  const [representativeName, setRepresentativeName] = useState('');
  const [companyRegNumber, setCompanyRegNumber] = useState('');
  const [companyCountryLocation, setCompanyCountryLocation] = useState('');
  const [companyAddressDetail, setCompanyAddressDetail] = useState('');

  const [contactName, setContactName] = useState('');
  const [contactDepartment, setContactDepartment] = useState('');
  const [contactPosition, setContactPosition] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [invitedEmail, setInvitedEmail] = useState(''); // 초대받은 이메일 (변경 불가)
  const [contactPhone, setContactPhone] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');

  const [agreeAll, setAgreeAll] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const isGoogleSignup = signupMethod === 'google';
  // 초대받은 이메일을 항상 표시 (Google 연동 여부와 무관)
  const displayEmail = contactEmail;

  const brnTrimmed = companyRegNumber.trim();
  const brnHasInput = brnTrimmed.length > 0;
  const brnOnlyDigitsAndHyphen = /^[\d-]*$/.test(brnTrimmed);
  const brnDigitsCount = businessRegDigitsOnly(companyRegNumber).length;
  const businessRegInvalid =
    brnHasInput && (!brnOnlyDigitsAndHyphen || brnDigitsCount !== 10);

  // Google OAuth 콜백 처리
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const params = new URLSearchParams(window.location.search);
    const googleUserId = params.get('userId');
    const googleEmail = params.get('email');
    const googleName = params.get('name');
    const googleRefreshToken = params.get('googleRefreshToken');
    const googleScope = params.get('scope');
    const error = params.get('error');

    if (error) {
      alert('Google 인증 실패: ' + error);
      setSignupMethod('none');
      return;
    }

    if (googleUserId && googleEmail && googleRefreshToken) {
      setSignupMethod('google');
      setGoogleUserId(googleUserId);
      setGoogleEmail(googleEmail);
      setGoogleName(googleName);
      setGoogleRefreshToken(googleRefreshToken);
      setGoogleScope(googleScope);
      // Google 이메일은 저장만 하고, contactEmail은 초대받은 이메일 유지
      if (googleName) {
        setContactName(googleName);
      }
      
      // localStorage에서 폼 데이터 복원
      const savedFormData = localStorage.getItem('signup_form_data');
      if (savedFormData) {
        try {
          const formData = JSON.parse(savedFormData);
          setCompanyName(formData.companyName || '');
          setRepresentativeName(formData.representativeName || '');
          setCompanyRegNumber(formData.companyRegNumber || '');
          setCompanyCountryLocation(formData.companyCountryLocation || '');
          setCompanyAddressDetail(
            formData.companyAddressDetail || formData.companyLocation || '',
          );
          // 초대받은 이메일 복원 (Google 이메일로 덮어쓰지 않음)
          setContactEmail(formData.contactEmail || '');
          setContactName(formData.contactName || googleName || '');
          setContactDepartment(formData.contactDepartment || '');
          setContactPosition(formData.contactPosition || '');
          setContactPhone(formData.contactPhone || '');
          setAgreeAll(formData.agreeAll || false);
          localStorage.removeItem('signup_form_data');
        } catch (e) {
          console.error('폼 데이터 복원 실패:', e);
        }
      }
      
      // URL 파라미터 정리
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  // 초대 정보로 폼 자동 채우기
  useEffect(() => {
    if (!invite) return;

    getInvitationPreview(invite)
      .then((data) => {
        if (data.invitee_company_hint) {
          setCompanyName(data.invitee_company_hint);
        }
        if (data.invitee_name && !googleName) {
          setContactName(data.invitee_name);
        }
        // 초대받은 이메일 저장 (이메일 회원가입 시 사용)
        if (data.invitee_email) {
          setInvitedEmail(data.invitee_email);
        }
        if (data.invitee_business_registration_hint) {
          setCompanyRegNumber(data.invitee_business_registration_hint);
        }
      })
      .catch((error) => {
        console.error('초대 정보 조회 실패:', error);
      });
  }, [invite, googleName]);

  const handleGoogleSignup = () => {
    // Google 회원가입 방식 선택 - 이메일 필드는 비움 (사용자가 직접 입력)
    setSignupMethod('google');
    setContactEmail('');
  };
  
  const handleEmailSignup = () => {
    // 이메일 회원가입 방식 선택 - 초대받은 이메일 자동 채움
    setSignupMethod('email');
  };

  // 이메일 회원가입 모드일 때 초대받은 이메일 자동 채우기
  useEffect(() => {
    if (signupMethod === 'email' && invitedEmail && !contactEmail) {
      setContactEmail(invitedEmail);
    }
  }, [signupMethod, invitedEmail, contactEmail]);

  const validate = () => {
    if (!companyName.trim()) return '회사명을 입력해주세요.';
    if (!representativeName.trim()) return '대표자명을 입력해주세요.';
    if (!companyRegNumber.trim()) return '사업자등록번호를 입력해주세요.';
    const brnClean = companyRegNumber.trim();
    if (!/^[\d-]+$/.test(brnClean)) {
      return '사업자등록번호는 숫자와 하이픈(-)만 입력해 주세요.';
    }
    const brnDigits = businessRegDigitsOnly(companyRegNumber);
    if (brnDigits.length !== 10) {
      return '사업자등록번호는 숫자 10자리여야 합니다.';
    }
    if (!companyCountryLocation.trim()) return '국가소재지를 입력해주세요.';
    if (!companyAddressDetail.trim()) return '상세주소를 입력해주세요.';
    if (!contactName.trim()) return '담당자 이름을 입력해주세요.';
    if (!displayEmail.trim()) return '이메일을 입력해주세요.';
    if (!contactPhone.trim()) return '연락처를 입력해주세요.';
    if (!isGoogleSignup) {
      if (password.length < 8) return '비밀번호는 최소 8자 이상 입력해주세요.';
      if (password !== passwordConfirm) return '비밀번호 확인이 일치하지 않습니다.';
    }
    if (!agreeAll) return '약관 동의 체크 후 진행해주세요.';
    return null;
  };

  const handleSubmit = async () => {
    if (!invite) {
      alert('초대 정보가 없습니다.');
      return;
    }

    const error = validate();
    if (error) {
      alert(error);
      return;
    }

    setSubmitting(true);
    try {
      if (signupMethod === 'google' && !googleUserId) {
        // Google 회원가입인데 아직 OAuth 인증을 안 한 경우 - 폼 데이터를 localStorage에 저장하고 OAuth 시작
        localStorage.setItem('signup_form_data', JSON.stringify({
          companyName,
          representativeName,
          companyRegNumber,
          companyCountryLocation,
          companyAddressDetail,
          contactEmail, // 초대받은 이메일 저장
          contactName,
          contactDepartment,
          contactPosition,
          contactPhone,
          agreeAll,
        }));
        
        // Google OAuth로 리다이렉트
        window.location.href = `http://localhost:8080/api/oauth/google/signup/sup?invite=${encodeURIComponent(invite)}`;
        return;
      }
      
      const businessRegNoNormalized = formatBusinessRegNoForSubmit(
        businessRegDigitsOnly(companyRegNumber),
      );

      let response;

      if (isGoogleSignup && googleUserId && googleRefreshToken) {
        // Google OAuth 회원가입 (OAuth 인증 완료 후)
        response = await submitGoogleSignup(invite, {
          google_user_id: googleUserId,
          google_email: googleEmail!,
          google_name: googleName,
          google_refresh_token: googleRefreshToken,
          google_scope: googleScope,
          company_name: companyName,
          rep_name: representativeName,
          business_reg_no: businessRegNoNormalized,
          country_location: companyCountryLocation.trim(),
          address: companyAddressDetail.trim(),
          name: contactName,
          contact: contactPhone,
          department_name: contactDepartment || null,
          position: contactPosition || null,
          terms_agreed: agreeAll,
        });
      } else {
        // 이메일 회원가입
        response = await submitSignup(invite, {
          company_name: companyName,
          rep_name: representativeName,
          business_reg_no: businessRegNoNormalized,
          country_location: companyCountryLocation.trim(),
          address: companyAddressDetail.trim(),
          name: contactName,
          contact: contactPhone,
          email: displayEmail,
          department_name: contactDepartment.trim() || null,
          position: contactPosition.trim() || null,
          password: password,
          password_confirm: passwordConfirm,
          terms_agreed: agreeAll,
        });
      }

      if (response.success) {
        alert(response.message || '회원가입 신청이 완료되었습니다. 직상위 차사 승인 후 로그인 가능합니다.');
        localStorage.setItem(LS_INVITE_KEY, invite);
        localStorage.removeItem('signup_form_data');
        
        // 로그인 페이지로 이동
        router.push('/');
      } else {
        alert(response.message || '회원가입 신청 중 오류가 발생했습니다.');
      }
    } catch (error) {
      console.error('회원가입 신청 실패:', error);
      alert('회원가입 신청 중 오류가 발생했습니다. 다시 시도해주세요.');
    } finally {
      setSubmitting(false);
    }
  };

  // 1단계: 회원가입 방법 선택
  if (signupMethod === 'none') {
    return (
      <div className="min-h-screen bg-[#EEF3FF] flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          <div className="mb-6">
            <div className="text-2xl font-bold text-gray-900 mb-1">회원가입</div>
            <div className="text-sm text-gray-500">회원가입 방법을 선택해주세요</div>
          </div>

          <Card className="rounded-2xl overflow-hidden">
            <CardContent className="p-6 space-y-4">
              <button
                type="button"
                onClick={handleGoogleSignup}
                className="w-full py-3.5 rounded-xl flex items-center justify-center gap-2 transition-all hover:bg-gray-50 border border-gray-200 bg-white"
              >
                <svg width="20" height="20" viewBox="0 0 18 18" fill="none">
                  <path d="M17.64 9.2C17.64 8.46 17.58 7.92 17.45 7.36H9V10.7H13.96C13.86 11.53 13.32 12.78 12.12 13.62L12.1 13.78L14.77 15.82L14.96 15.84C16.66 14.27 17.64 11.94 17.64 9.2Z" fill="#4285F4"/>
                  <path d="M9 18C11.43 18 13.47 17.19 14.96 15.84L12.12 13.62C11.36 14.15 10.34 14.52 9 14.52C6.62 14.52 4.61 12.95 3.88 10.82L3.73 10.83L0.96 12.95L0.91 13.09C2.39 16 5.43 18 9 18Z" fill="#34A853"/>
                  <path d="M3.88 10.82C3.69 10.25 3.58 9.64 3.58 9C3.58 8.36 3.69 7.75 3.87 7.18L3.87 7.01L1.06 4.85L0.91 4.91C0.33 6.07 0 7.39 0 9C0 10.61 0.33 11.93 0.91 13.09L3.88 10.82Z" fill="#FBBC05"/>
                  <path d="M9 3.48C10.62 3.48 11.74 4.13 12.37 4.72L14.89 2.28C13.46 0.99 11.43 0 9 0C5.43 0 2.39 2 0.91 4.91L3.87 7.18C4.61 5.05 6.62 3.48 9 3.48Z" fill="#EB4335"/>
                </svg>
                <span className="font-semibold text-gray-900">Google 계정으로 가입하기</span>
              </button>

              <div className="flex items-center gap-3">
                <div className="flex-1 h-px bg-gray-200" />
                <span className="text-sm text-gray-500">또는</span>
                <div className="flex-1 h-px bg-gray-200" />
              </div>

              <button
                type="button"
                onClick={handleEmailSignup}
                className="w-full py-3.5 rounded-xl flex items-center justify-center gap-2 transition-all border-2 font-semibold"
                style={{
                  borderColor: 'var(--aifix-primary)',
                  color: 'var(--aifix-primary)',
                  backgroundColor: 'rgba(91, 59, 250, 0.06)',
                }}
              >
                <Mail className="w-5 h-5" />
                이메일로 직접 가입하기
              </button>
            </CardContent>
          </Card>

          <button
            type="button"
            onClick={() => router.back()}
            className="mt-4 flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="w-4 h-4" />
            뒤로
          </button>
        </div>
      </div>
    );
  }

  // 2단계: 정보 입력 (구글 또는 이메일 선택 후)
  return (
    <div className="min-h-screen bg-[#EEF3FF] flex items-center justify-center p-6">
      <div className="w-full max-w-4xl">
        <div className="mb-6 flex items-start justify-between">
          <div>
            <div className="text-2xl font-bold text-gray-900 mb-1">회원가입 정보 입력</div>
            <div className="text-sm text-gray-500">
              {isGoogleSignup
                ? 'Google 계정으로 연결되었습니다. 아래 정보를 입력하고 회원가입을 완료하세요'
                : '아래 정보를 입력하고 회원가입을 완료하세요'}
            </div>
            {isGoogleSignup && (
              <div className="mt-2 inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-green-50 text-green-800 text-sm">
                <svg width="16" height="16" viewBox="0 0 18 18" fill="none">
                  <path d="M17.64 9.2C17.64 8.46 17.58 7.92 17.45 7.36H9V10.7H13.96C13.86 11.53 13.32 12.78 12.12 13.62L12.1 13.78L14.77 15.82L14.96 15.84C16.66 14.27 17.64 11.94 17.64 9.2Z" fill="#4285F4"/>
                  <path d="M9 18C11.43 18 13.47 17.19 14.96 15.84L12.12 13.62C11.36 14.15 10.34 14.52 9 14.52C6.62 14.52 4.61 12.95 3.88 10.82L3.73 10.83L0.96 12.95L0.91 13.09C2.39 16 5.43 18 9 18Z" fill="#34A853"/>
                </svg>
                <span className="font-medium">{displayEmail}</span>
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={() => {
              setSignupMethod('none');
              setGoogleEmail(null);
              setGoogleName(null);
              setGoogleUserId(null);
              setGoogleRefreshToken(null);
              setGoogleScope(null);
              // 이메일 필드 비우기 (다시 선택 시 자동 채움)
              setContactEmail('');
              setPassword('');
              setPasswordConfirm('');
            }}
            className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1"
          >
            <ArrowLeft className="w-4 h-4" />
            방법 변경
          </button>
        </div>

        <Card className="rounded-2xl overflow-hidden">
          <CardContent className="p-6 space-y-6">
            {/* Company Info */}
            <div className="rounded-xl border border-gray-200 p-4">
              <div className="flex items-center gap-2 mb-4">
                <Building2 className="w-4 h-4" style={{ color: 'var(--aifix-primary)' }} />
                <div className="font-bold text-gray-900">회사 정보</div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Field
                  label="회사명"
                  required
                  icon={<Building2 className="w-4 h-4" />}
                  value={companyName}
                  onChange={setCompanyName}
                  placeholder="예: 에코솔루션"
                />
                <Field
                  label="대표자명"
                  required
                  icon={<User className="w-4 h-4" />}
                  value={representativeName}
                  onChange={setRepresentativeName}
                  placeholder="예: 김철수"
                />
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    사업자등록번호
                    <span className="text-red-500 ml-1">*</span>
                  </label>
                  <div className="relative">
                    <Building2
                      className={cn(
                        'pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2',
                        businessRegInvalid ? 'text-red-400' : 'text-gray-400',
                      )}
                      aria-hidden
                    />
                    <Input
                      type="text"
                      inputMode="numeric"
                      autoComplete="off"
                      value={companyRegNumber}
                      onChange={(e) => setCompanyRegNumber(e.target.value)}
                      placeholder="000-00-00000 (숫자 10자리)"
                      aria-invalid={businessRegInvalid}
                      className={cn(
                        'pl-10 bg-white',
                        businessRegInvalid &&
                          'border-red-500 focus-visible:border-red-600 focus-visible:ring-red-500/50',
                      )}
                    />
                  </div>
                  {businessRegInvalid ? (
                    <p
                      className="mt-1.5 flex items-start gap-1.5 text-xs text-red-600"
                      role="alert"
                    >
                      <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
                      <span>
                        숫자 10자리로 입력해 주세요. 하이픈(-)만 추가로 사용할 수 있으며, 그 외 문자는 입력할 수
                        없습니다.
                      </span>
                    </p>
                  ) : null}
                </div>
                <div className="col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <CountryLocationPicker
                    value={companyCountryLocation}
                    onChange={setCompanyCountryLocation}
                  />
                  <Field
                    label="상세주소"
                    required
                    icon={<Building2 className="w-4 h-4" />}
                    value={companyAddressDetail}
                    onChange={setCompanyAddressDetail}
                    placeholder="예: 경기도 성남시 분당구 판교로 …"
                  />
                </div>
              </div>
            </div>

            {/* Contact Info */}
            <div className="rounded-xl border border-gray-200 p-4">
              <div className="flex items-center gap-2 mb-4">
                <User className="w-4 h-4" style={{ color: 'var(--aifix-primary)' }} />
                <div className="font-bold text-gray-900">담당자 정보</div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Field
                  label="담당자 이름"
                  required
                  icon={<User className="w-4 h-4" />}
                  value={contactName}
                  onChange={setContactName}
                  placeholder="예: 홍길동"
                />
                <Field
                  label="부서명"
                  icon={<Briefcase className="w-4 h-4" />}
                  value={contactDepartment}
                  onChange={setContactDepartment}
                  placeholder="예: 영업부"
                />
                <Field
                  label="직급"
                  icon={<Briefcase className="w-4 h-4" />}
                  value={contactPosition}
                  onChange={setContactPosition}
                  placeholder="예: 팀장"
                />
                <Field
                  label="연락처"
                  required
                  icon={<Phone className="w-4 h-4" />}
                  value={contactPhone}
                  onChange={setContactPhone}
                  placeholder="010-0000-0000"
                />
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    아이디(이메일)<span className="text-red-500 ml-1">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                      <Mail className="w-4 h-4" />
                    </div>
                    <Input
                      type="email"
                      value={displayEmail}
                      onChange={(e) => setContactEmail(e.target.value)}
                      placeholder={isGoogleSignup ? "contact@gmail.com" : "contact@company.com"}
                      className="pl-10 bg-white"
                    />
                    {isGoogleSignup && (
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-500">
                        Google 연동
                      </div>
                    )}
                  </div>
                </div>
                {!isGoogleSignup && (
                  <>
                    <div>
                      <label className="block text-sm font-semibold text-gray-900 mb-2">
                        비밀번호<span className="text-red-500 ml-1">*</span>
                      </label>
                      <div className="relative">
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                          <Lock className="w-4 h-4" />
                        </div>
                        <Input
                          type="password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="비밀번호 (최소 8자)"
                          className="pl-10 bg-white"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-900 mb-2">
                        비밀번호 확인<span className="text-red-500 ml-1">*</span>
                      </label>
                      <div className="relative">
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                          <Lock className="w-4 h-4" />
                        </div>
                        <Input
                          type="password"
                          value={passwordConfirm}
                          onChange={(e) => setPasswordConfirm(e.target.value)}
                          placeholder="비밀번호 확인"
                          className="pl-10 bg-white"
                        />
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Agreement Checkbox */}
            <div className="rounded-xl border border-gray-200 p-4">
              <div className="flex items-start gap-3">
                <Checkbox checked={agreeAll} onCheckedChange={(v) => setAgreeAll(Boolean(v))} />
                <div>
                  <div className="text-sm font-semibold text-gray-900">약관에 동의합니다</div>
                  <div className="text-xs text-gray-500 mt-1">
                    개인정보 처리방침 및 서비스 이용약관에 동의합니다. (예시 화면)
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={() => router.back()}
                className="px-6 py-2.5 rounded-xl border border-gray-300 text-gray-700 font-semibold hover:bg-gray-50 transition-colors"
              >
                뒤로
              </button>
              <Button
                onClick={handleSubmit}
                disabled={submitting}
                className="px-6 py-2.5 rounded-xl font-semibold"
                style={{
                  background: 'linear-gradient(90deg, #5B3BFA 0%, #00B4FF 100%)',
                  color: 'white',
                }}
              >
                {submitting ? '가입 처리 중...' : '회원가입 완료하기'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

