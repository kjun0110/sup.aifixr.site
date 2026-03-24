import Link from "next/link";
import { User, Bell, Shield, Globe, AlertCircle } from "lucide-react";

export function Settings() {
  return (
    <div className="max-w-[1200px] mx-auto">
      {/* Page Header */}
      <div className="mb-12">
        <h1 className="text-5xl mb-4" style={{ fontWeight: 700, color: 'var(--aifix-navy)' }}>
          설정
        </h1>
        <p className="text-lg" style={{ color: 'var(--aifix-gray)' }}>
          계정 및 시스템 설정을 관리합니다
        </p>
      </div>

      {/* Settings Categories */}
      <div className="space-y-4">
        <div 
          className="bg-white rounded-[20px] p-6 cursor-pointer transition-all duration-200 hover:-translate-y-0.5"
          style={{ boxShadow: "0px 4px 16px rgba(0, 0, 0, 0.05)" }}
        >
          <div className="flex items-center gap-4">
            <div 
              className="w-12 h-12 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: 'var(--aifix-secondary-light)' }}
            >
              <User className="w-6 h-6" style={{ color: 'var(--aifix-primary)' }} />
            </div>
            <div className="flex-1">
              <h3 style={{ fontWeight: 600, color: 'var(--aifix-navy)', marginBottom: '4px' }}>
                계정 설정
              </h3>
              <p style={{ fontSize: '14px', color: 'var(--aifix-gray)' }}>
                사용자 프로필, 비밀번호 변경
              </p>
            </div>
          </div>
        </div>

        <Link
          href="/settings/notifications"
          className="block"
          aria-label="알림 설정으로 이동"
        >
          <div 
            className="bg-white rounded-[20px] p-6 cursor-pointer transition-all duration-200 hover:-translate-y-0.5"
            style={{ boxShadow: "0px 4px 16px rgba(0, 0, 0, 0.05)" }}
          >
            <div className="flex items-center gap-4">
              <div 
                className="w-12 h-12 rounded-xl flex items-center justify-center"
                style={{ backgroundColor: 'var(--aifix-secondary-light)' }}
              >
                <Bell className="w-6 h-6" style={{ color: 'var(--aifix-primary)' }} />
              </div>
              <div className="flex-1">
                <h3 style={{ fontWeight: 600, color: 'var(--aifix-navy)', marginBottom: '4px' }}>
                  알림 설정
                </h3>
                <p style={{ fontSize: '14px', color: 'var(--aifix-gray)' }}>
                  이메일 알림, 푸시 알림 관리
                </p>
              </div>
            </div>
          </div>
        </Link>

        <div 
          className="bg-white rounded-[20px] p-6 cursor-pointer transition-all duration-200 hover:-translate-y-0.5"
          style={{ boxShadow: "0px 4px 16px rgba(0, 0, 0, 0.05)" }}
        >
          <div className="flex items-center gap-4">
            <div 
              className="w-12 h-12 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: 'var(--aifix-secondary-light)' }}
            >
              <Shield className="w-6 h-6" style={{ color: 'var(--aifix-primary)' }} />
            </div>
            <div className="flex-1">
              <h3 style={{ fontWeight: 600, color: 'var(--aifix-navy)', marginBottom: '4px' }}>
                보안 설정
              </h3>
              <p style={{ fontSize: '14px', color: 'var(--aifix-gray)' }}>
                2단계 인증, 접근 권한 관리
              </p>
            </div>
          </div>
        </div>

        <div 
          className="bg-white rounded-[20px] p-6 cursor-pointer transition-all duration-200 hover:-translate-y-0.5"
          style={{ boxShadow: "0px 4px 16px rgba(0, 0, 0, 0.05)" }}
        >
          <div className="flex items-center gap-4">
            <div 
              className="w-12 h-12 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: 'var(--aifix-secondary-light)' }}
            >
              <Globe className="w-6 h-6" style={{ color: 'var(--aifix-primary)' }} />
            </div>
            <div className="flex-1">
              <h3 style={{ fontWeight: 600, color: 'var(--aifix-navy)', marginBottom: '4px' }}>
                언어 및 지역
              </h3>
              <p style={{ fontSize: '14px', color: 'var(--aifix-gray)' }}>
                표시 언어, 시간대, 날짜 형식
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Note */}
      <div 
        className="mt-8 p-6 rounded-[20px] border-2 border-dashed"
        style={{ borderColor: 'var(--aifix-primary)', backgroundColor: 'var(--aifix-secondary-light)' }}
      >
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: 'var(--aifix-primary)' }} />
          <div>
            <h4 style={{ fontWeight: 700, color: 'var(--aifix-navy)', marginBottom: '4px' }}>
              구조 설계 단계 안내
            </h4>
            <p style={{ color: 'var(--aifix-gray)', fontSize: '14px' }}>
              각 설정 항목의 상세 페이지 및 편집 기능은 다음 단계에서 설계됩니다
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
