'use client';

import { useState, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { Building2, User, Mail, Phone, Lock, Briefcase, ArrowLeft } from 'lucide-react';

import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/card';
import { Checkbox } from '../ui/checkbox';
import { Input } from '../ui/input';

const LS_REGISTERED_KEY = 'aifix_mock_registered';
const LS_INVITE_KEY = 'aifix_mock_invite';

type SignupMethod = 'none' | 'google' | 'email';

export function SignupRegister({ invite }: { invite?: string }) {
  const router = useRouter();

  const [signupMethod, setSignupMethod] = useState<SignupMethod>('none');
  const [googleEmail, setGoogleEmail] = useState<string | null>(null);

  const [companyName, setCompanyName] = useState('');
  const [representativeName, setRepresentativeName] = useState('');
  const [companyRegNumber, setCompanyRegNumber] = useState('');
  const [companyLocation, setCompanyLocation] = useState('');

  const [contactName, setContactName] = useState('');
  const [contactDepartment, setContactDepartment] = useState('');
  const [contactPosition, setContactPosition] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');

  const [agreeAll, setAgreeAll] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const isGoogleSignup = signupMethod === 'google' && googleEmail;
  const displayEmail = isGoogleSignup ? googleEmail : contactEmail;

  const handleGoogleSignup = () => {
    // TODO: 실제 Google OAuth 연동 시 popup/redirect 처리
    // Mock: Google 계정 연동 완료 시뮬레이션 - 이메일만 자동 입력
    const mockEmail = 'user@gmail.com';
    setGoogleEmail(mockEmail);
    setContactEmail(mockEmail);
  };

  const validate = () => {
    if (!companyName.trim()) return '회사명을 입력해주세요.';
    if (!representativeName.trim()) return '대표자명을 입력해주세요.';
    if (!companyRegNumber.trim()) return '사업자등록번호를 입력해주세요.';
    if (!companyLocation.trim()) return '소재지를 입력해주세요.';
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
    const error = validate();
    if (error) {
      alert(error);
      return;
    }

    setSubmitting(true);
    try {
      // TODO: 실제 회원가입 API 연동 필요
      localStorage.setItem(LS_REGISTERED_KEY, 'true');
      localStorage.setItem(LS_INVITE_KEY, invite || '');
      router.push('/projects');
    } finally {
      setSubmitting(false);
    }
  };

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
                onClick={() => {
                  setSignupMethod('google');
                  handleGoogleSignup();
                }}
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
                onClick={() => setSignupMethod('email')}
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
                <Field
                  label="사업자등록번호"
                  required
                  icon={<Building2 className="w-4 h-4" />}
                  value={companyRegNumber}
                  onChange={setCompanyRegNumber}
                  placeholder="000-00-00000"
                />
                <Field
                  label="소재지"
                  required
                  icon={<Building2 className="w-4 h-4" />}
                  value={companyLocation}
                  onChange={setCompanyLocation}
                  placeholder="예: 서울시 강남구 ..."
                />
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
                      onChange={(e) => !isGoogleSignup && setContactEmail(e.target.value)}
                      placeholder="contact@company.com"
                      className="pl-10 bg-white"
                      disabled={!!isGoogleSignup}
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

