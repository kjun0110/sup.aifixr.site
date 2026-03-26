'use client';

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Mail, Lock, FileText } from "lucide-react";
import { login } from "@/lib/api/iam";
import { toast } from "sonner";

export function Login() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast.error("이메일과 비밀번호를 입력해주세요");
      return;
    }

    setIsLoading(true);
    try {
      const response = await login(email, password);
      
      // 로그인 성공 시 토큰 및 사용자 정보 저장 (Gateway 응답 형식)
      localStorage.setItem("access_token", response.accessToken);
      localStorage.setItem("user_id", response.user.id);
      localStorage.setItem("user_type", response.user.userType);
      localStorage.setItem("x-actor-user-id", response.user.id);
      if (response.user.companyName) {
        localStorage.setItem("company_name", response.user.companyName);
      }
      
      toast.success("로그인 성공!");
      router.push("/projects");
    } catch (error) {
      console.error("로그인 실패:", error);
      toast.error("로그인에 실패했습니다. 이메일과 비밀번호를 확인해주세요.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSocialLogin = (provider: string) => {
    if (provider === 'google') {
      // Google OAuth 로그인 플로우
      window.location.href = 'http://localhost:8080/api/oauth/google/login';
    } else {
      // Mock social login - 실제로는 OAuth 플로우
      console.log(`${provider} 로그인`);
      router.push("/projects");
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Brand Section */}
      <div 
        className="hidden lg:flex lg:w-1/2 flex-col justify-center items-center p-12 text-white relative overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, #6B23C0 0%, #9C41E6 100%)',
        }}
      >
        {/* Decorative elements */}
        <div 
          className="absolute top-20 right-20 w-64 h-64 rounded-full opacity-20"
          style={{
            background: 'radial-gradient(circle, rgba(255,255,255,0.3) 0%, transparent 70%)',
          }}
        />
        <div 
          className="absolute bottom-20 left-20 w-96 h-96 rounded-full opacity-10"
          style={{
            background: 'radial-gradient(circle, rgba(255,255,255,0.3) 0%, transparent 70%)',
          }}
        />

        <div className="relative z-10 max-w-md">
          {/* Logo */}
          <div className="flex items-center gap-3 mb-8">
            <div 
              className="w-14 h-14 rounded-xl flex items-center justify-center"
              style={{ 
                backgroundColor: 'rgba(255, 255, 255, 0.2)',
                backdropFilter: 'blur(10px)'
              }}
            >
              <FileText className="w-8 h-8" />
            </div>
            <h1 className="text-5xl" style={{ fontWeight: 800, letterSpacing: '-0.02em' }}>
              AIFIX
            </h1>
          </div>

          {/* Description */}
          <h2 className="text-3xl mb-4" style={{ fontWeight: 700, lineHeight: 1.4 }}>
            AI 기반 공급망 관리 플랫폼
          </h2>
          <p className="text-lg leading-relaxed opacity-90">
            ESG 데이터 수집부터 공급망 분석까지,<br />
            스마트한 공급망 관리의 시작
          </p>

          {/* Features */}
          <div className="mt-12 space-y-4">
            <div className="flex items-start gap-3">
              <div 
                className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: 'rgba(255, 255, 255, 0.2)' }}
              >
                <span className="text-lg" style={{ fontWeight: 700 }}>✓</span>
              </div>
              <div>
                <h3 className="font-semibold mb-1">실시간 공급망 가시성</h3>
                <p className="text-sm opacity-80">다단계 협력사 관리와 데이터 추적</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div 
                className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: 'rgba(255, 255, 255, 0.2)' }}
              >
                <span className="text-lg" style={{ fontWeight: 700 }}>✓</span>
              </div>
              <div>
                <h3 className="font-semibold mb-1">자동화된 PCF 산정</h3>
                <p className="text-sm opacity-80">AI 기반 탄소발자국 계산 및 분석</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div 
                className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: 'rgba(255, 255, 255, 0.2)' }}
              >
                <span className="text-lg" style={{ fontWeight: 700 }}>✓</span>
              </div>
              <div>
                <h3 className="font-semibold mb-1">원활한 협력사 소통</h3>
                <p className="text-sm opacity-80">데이터 요청부터 승인까지 통합 관리</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-gray-50">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <div 
              className="w-10 h-10 rounded-lg flex items-center justify-center"
              style={{ 
                background: 'linear-gradient(135deg, #5B3BFA 0%, #00B4FF 100%)',
              }}
            >
              <FileText className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-3xl" style={{ fontWeight: 800, color: 'var(--aifix-navy)' }}>
              AIFIX
            </h1>
          </div>

          {/* Login Card */}
          <div 
            className="bg-white rounded-2xl p-8"
            style={{ boxShadow: '0px 4px 24px rgba(0, 0, 0, 0.08)' }}
          >
            <h2 className="text-2xl mb-2" style={{ fontWeight: 700, color: 'var(--aifix-navy)' }}>
              로그인
            </h2>
            <p className="mb-6" style={{ fontSize: '14px', color: 'var(--aifix-gray)' }}>
              계정에 로그인 후 작업을 시작하세요
            </p>

            {/* Email/Password Form */}
            <form onSubmit={handleLogin} className="space-y-4">
              {/* Email */}
              <div>
                <label 
                  htmlFor="email" 
                  className="block text-sm mb-2"
                  style={{ fontWeight: 600, color: 'var(--aifix-navy)' }}
                >
                  이메일
                </label>
                <div className="relative">
                  <Mail 
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5"
                    style={{ color: 'var(--aifix-gray)' }}
                  />
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="이메일을 입력하세요"
                    className="w-full pl-10 pr-4 py-3 rounded-xl border transition-all"
                    style={{
                      borderColor: '#E0E0E0',
                      fontSize: '15px',
                      outline: 'none'
                    }}
                    onFocus={(e) => e.target.style.borderColor = '#5B3BFA'}
                    onBlur={(e) => e.target.style.borderColor = '#E0E0E0'}
                    required
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label 
                  htmlFor="password" 
                  className="block text-sm mb-2"
                  style={{ fontWeight: 600, color: 'var(--aifix-navy)' }}
                >
                  비밀번호
                </label>
                <div className="relative">
                  <Lock 
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5"
                    style={{ color: 'var(--aifix-gray)' }}
                  />
                  <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="비밀번호를 입력하세요"
                    className="w-full pl-10 pr-4 py-3 rounded-xl border transition-all"
                    style={{
                      borderColor: '#E0E0E0',
                      fontSize: '15px',
                      outline: 'none'
                    }}
                    onFocus={(e) => e.target.style.borderColor = '#5B3BFA'}
                    onBlur={(e) => e.target.style.borderColor = '#E0E0E0'}
                    required
                  />
                </div>
              </div>

              {/* Login Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 rounded-xl text-white transition-all hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  background: 'linear-gradient(90deg, #5B3BFA 0%, #00B4FF 100%)',
                  fontWeight: 600,
                  fontSize: '15px',
                  boxShadow: '0px 4px 12px rgba(91, 59, 250, 0.3)'
                }}
              >
                {isLoading ? "로그인 중..." : "로그인"}
              </button>
            </form>

            {/* Divider */}
            <div className="flex items-center gap-4 my-6">
              <div className="flex-1 h-px bg-gray-200" />
              <span style={{ fontSize: '13px', color: 'var(--aifix-gray)' }}>
                또는
              </span>
              <div className="flex-1 h-px bg-gray-200" />
            </div>

            {/* Social Login Buttons */}
            <div className="space-y-3">
              {/* Kakao */}
              <button
                type="button"
                onClick={() => handleSocialLogin('kakao')}
                className="w-full py-3 rounded-xl flex items-center justify-center gap-2 transition-all hover:opacity-90"
                style={{
                  backgroundColor: '#FEE500',
                  color: '#000000',
                  fontWeight: 600,
                  fontSize: '14px'
                }}
              >
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                  <path d="M9 3C5.13 3 2 5.69 2 9C2 11.17 3.34 13.05 5.35 14.13L4.5 17.25L7.82 15.29C8.19 15.33 8.59 15.35 9 15.35C12.87 15.35 16 12.66 16 9.35C16 6.04 12.87 3 9 3Z" fill="#000000"/>
                </svg>
                카카오로 계속하기
              </button>

              {/* Naver */}
              <button
                type="button"
                onClick={() => handleSocialLogin('naver')}
                className="w-full py-3 rounded-xl flex items-center justify-center gap-2 transition-all hover:opacity-90"
                style={{
                  backgroundColor: '#03C75A',
                  color: '#FFFFFF',
                  fontWeight: 600,
                  fontSize: '14px'
                }}
              >
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                  <path d="M11.4545 9.54545L6.27273 3H3V15H6.54545V8.45455L11.7273 15H15V3H11.4545V9.54545Z" fill="white"/>
                </svg>
                네이버로 계속하기
              </button>

              {/* Google */}
              <button
                type="button"
                onClick={() => handleSocialLogin('google')}
                className="w-full py-3 rounded-xl flex items-center justify-center gap-2 transition-all hover:bg-gray-50"
                style={{
                  backgroundColor: '#FFFFFF',
                  border: '1px solid #E0E0E0',
                  color: '#000000',
                  fontWeight: 600,
                  fontSize: '14px'
                }}
              >
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                  <path d="M17.64 9.2C17.64 8.46 17.58 7.92 17.45 7.36H9V10.7H13.96C13.86 11.53 13.32 12.78 12.12 13.62L12.1 13.78L14.77 15.82L14.96 15.84C16.66 14.27 17.64 11.94 17.64 9.2Z" fill="#4285F4"/>
                  <path d="M9 18C11.43 18 13.47 17.19 14.96 15.84L12.12 13.62C11.36 14.15 10.34 14.52 9 14.52C6.62 14.52 4.61 12.95 3.88 10.82L3.73 10.83L0.96 12.95L0.91 13.09C2.39 16 5.43 18 9 18Z" fill="#34A853"/>
                  <path d="M3.88 10.82C3.69 10.25 3.58 9.64 3.58 9C3.58 8.36 3.69 7.75 3.87 7.18L3.87 7.01L1.06 4.85L0.91 4.91C0.33 6.07 0 7.39 0 9C0 10.61 0.33 11.93 0.91 13.09L3.88 10.82Z" fill="#FBBC05"/>
                  <path d="M9 3.48C10.62 3.48 11.74 4.13 12.37 4.72L14.89 2.28C13.46 0.99 11.43 0 9 0C5.43 0 2.39 2 0.91 4.91L3.87 7.18C4.61 5.05 6.62 3.48 9 3.48Z" fill="#EB4335"/>
                </svg>
                Google로 계속하기
              </button>
            </div>

            {/* Footer Links */}
            <div className="mt-6 text-center">
              <button
                type="button"
                className="text-sm hover:underline"
                style={{ color: 'var(--aifix-primary)', fontWeight: 600 }}
              >
                비밀번호 찾기
              </button>
            </div>
          </div>

          {/* Footer Note */}
          <p className="mt-6 text-center text-xs" style={{ color: 'var(--aifix-gray)' }}>
            ⓒ 2026 AIFIX. 모든 권리 보유.
          </p>
        </div>
      </div>
    </div>
  );
}
