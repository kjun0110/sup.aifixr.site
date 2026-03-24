'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { Bell, CheckCircle2, XCircle, Slack, Mail } from 'lucide-react';

type ChannelKey = 'system' | 'slack' | 'gmail';
type ChannelSettings = {
  system: boolean; // 기본값(항상 true로 유지)
  slack: boolean;
  gmail: boolean;
  slackWebhookUrl: string;
  slackChannel: string;
  gmailToEmail: string;
};

const LS_KEY = 'aifix_mock_notification_channels_v1';

const defaultSettings: ChannelSettings = {
  system: true,
  slack: false,
  gmail: false,
  slackWebhookUrl: '',
  slackChannel: '',
  gmailToEmail: '',
};

export function NotificationSettings() {
  const [settings, setSettings] = useState<ChannelSettings>(defaultSettings);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as Partial<ChannelSettings>;
      setSettings({
        ...defaultSettings,
        ...parsed,
        system: true, // 정책: system은 기본값
      });
    } catch {
      // mock only
    }
  }, []);

  const selectedChannels = useMemo(() => {
    const list: string[] = ['시스템 내부'];
    if (settings.slack) list.push('Slack');
    if (settings.gmail) list.push('Gmail');
    return list;
  }, [settings.gmail, settings.slack]);

  const setField = (patch: Partial<ChannelSettings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...patch, system: true };
      return next;
    });
    setDirty(true);
  };

  const handleSave = () => {
    // 최소 유효성(모크)
    if (settings.slack) {
      if (!settings.slackWebhookUrl.trim() || !settings.slackChannel.trim()) {
        alert('Slack을 연동하려면 Webhook URL과 채널을 입력해야 합니다.');
        return;
      }
    }
    if (settings.gmail) {
      if (!settings.gmailToEmail.trim() || !settings.gmailToEmail.includes('@')) {
        alert('Gmail을 연동하려면 수신 이메일을 올바르게 입력해주세요.');
        return;
      }
    }

    try {
      localStorage.setItem(LS_KEY, JSON.stringify({ ...settings, system: true }));
    } catch {
      // ignore
    }
    setDirty(false);
    alert('알림 설정이 저장되었습니다(모의).');
  };

  return (
    <div className="max-w-[1200px] mx-auto">
      <div className="mb-10">
        <h1 className="text-5xl mb-4" style={{ fontWeight: 700, color: 'var(--aifix-navy)' }}>
          알림 설정
        </h1>
        <p className="text-lg" style={{ color: 'var(--aifix-gray)' }}>
          기본은 시스템 내부 알림입니다. Slack 또는 Gmail 연동을 선택해 커스터마이징할 수 있어요.
        </p>
      </div>

      <div className="bg-white rounded-[20px] p-8" style={{ boxShadow: '0px 4px 16px rgba(0, 0, 0, 0.05)' }}>
        <div className="mb-6">
          <div className="flex items-center gap-3">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: 'var(--aifix-secondary-light)' }}
            >
              <Bell className="w-6 h-6" style={{ color: 'var(--aifix-primary)' }} />
            </div>
            <div className="flex-1">
              <div style={{ fontWeight: 700, color: 'var(--aifix-navy)' }}>알림 채널</div>
              <div style={{ color: 'var(--aifix-gray)', fontSize: 14, marginTop: 4 }}>
                선택된 채널: {selectedChannels.join(', ')}
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* System (default) */}
          <div className="border rounded-[16px] p-5" style={{ borderColor: '#E9F5FF' }}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5" style={{ color: '#2A64E0' }} />
                <div>
                  <div style={{ fontWeight: 700, color: 'var(--aifix-navy)' }}>시스템 내부</div>
                  <div style={{ color: 'var(--aifix-gray)', fontSize: 13, marginTop: 2 }}>
                    기본값으로 항상 활성화되어 있습니다.
                  </div>
                </div>
              </div>
              <div className="px-3 py-1 rounded-lg text-xs" style={{ backgroundColor: '#E8F5E9', color: '#4CAF50', fontWeight: 700 }}>
                기본
              </div>
            </div>
          </div>

          {/* Slack */}
          <div className="border rounded-[16px] p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <Slack className="w-5 h-5" style={{ color: settings.slack ? '#4A154B' : 'var(--aifix-gray)' }} />
                <div>
                  <div style={{ fontWeight: 700, color: 'var(--aifix-navy)' }}>Slack 연동</div>
                  <div style={{ color: 'var(--aifix-gray)', fontSize: 13, marginTop: 2 }}>
                    Webhook 기반으로 알림을 전송합니다.
                  </div>
                </div>
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.slack}
                  onChange={(e) => setField({ slack: e.target.checked })}
                />
                <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--aifix-gray)' }}>
                  {settings.slack ? '사용' : '미사용'}
                </span>
              </label>
            </div>

            <div className="space-y-3">
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--aifix-navy)', marginBottom: 6 }}>
                  Webhook URL
                </div>
                <input
                  value={settings.slackWebhookUrl}
                  onChange={(e) => setField({ slackWebhookUrl: e.target.value })}
                  disabled={!settings.slack}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm"
                  style={{ outline: 'none', opacity: settings.slack ? 1 : 0.6 }}
                  placeholder="https://hooks.slack.com/services/..."
                />
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--aifix-navy)', marginBottom: 6 }}>
                  채널
                </div>
                <input
                  value={settings.slackChannel}
                  onChange={(e) => setField({ slackChannel: e.target.value })}
                  disabled={!settings.slack}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm"
                  style={{ outline: 'none', opacity: settings.slack ? 1 : 0.6 }}
                  placeholder="#alerts"
                />
              </div>
            </div>
          </div>

          {/* Gmail */}
          <div className="border rounded-[16px] p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <Mail className="w-5 h-5" style={{ color: settings.gmail ? '#0F766E' : 'var(--aifix-gray)' }} />
                <div>
                  <div style={{ fontWeight: 700, color: 'var(--aifix-navy)' }}>Gmail 연동</div>
                  <div style={{ color: 'var(--aifix-gray)', fontSize: 13, marginTop: 2 }}>
                    이메일로 알림을 전송합니다.
                  </div>
                </div>
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.gmail}
                  onChange={(e) => setField({ gmail: e.target.checked })}
                />
                <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--aifix-gray)' }}>
                  {settings.gmail ? '사용' : '미사용'}
                </span>
              </label>
            </div>

            <div className="space-y-3">
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--aifix-navy)', marginBottom: 6 }}>
                  수신 이메일
                </div>
                <input
                  value={settings.gmailToEmail}
                  onChange={(e) => setField({ gmailToEmail: e.target.value })}
                  disabled={!settings.gmail}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm"
                  style={{ outline: 'none', opacity: settings.gmail ? 1 : 0.6 }}
                  placeholder="name@company.com"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 flex items-center justify-end gap-3">
          <button
            className="px-6 py-3 rounded-xl transition-all"
            style={{
              border: '1px solid var(--aifix-gray)',
              color: 'var(--aifix-gray)',
              fontWeight: 700,
              background: 'white',
            }}
            onClick={() => {
              setSettings(defaultSettings);
              setDirty(false);
            }}
          >
            초기화
          </button>
          <button
            className="px-6 py-3 rounded-xl text-white transition-all"
            style={{
              background: 'linear-gradient(90deg, #5B3BFA 0%, #00B4FF 100%)',
              fontWeight: 800,
              opacity: dirty ? 1 : 0.9,
            }}
            onClick={handleSave}
          >
            저장
          </button>
        </div>

        {dirty && (
          <div className="mt-4 text-xs" style={{ color: '#FF9800', fontWeight: 600 }}>
            저장되지 않은 변경 사항이 있습니다.
          </div>
        )}
      </div>

      <div className="mt-8 p-6 rounded-[20px] border-2 border-dashed" style={{ borderColor: 'var(--aifix-primary)', backgroundColor: 'var(--aifix-secondary-light)' }}>
        <div className="flex items-start gap-3">
          <Bell className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: 'var(--aifix-primary)' }} />
          <div>
            <h4 style={{ fontWeight: 700, color: 'var(--aifix-navy)', marginBottom: 4 }}>안내</h4>
            <p style={{ color: 'var(--aifix-gray)', fontSize: 14, lineHeight: 1.6 }}>
              본 화면은 모의 데이터로 동작합니다. 실제 연동은 백엔드/외부 서비스 설정이 필요합니다.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

