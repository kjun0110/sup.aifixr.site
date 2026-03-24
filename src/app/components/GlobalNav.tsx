'use client';

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Briefcase, Building2, Settings, Bell, LogOut } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";

export function GlobalNav() {
  const pathname = usePathname();
  const router = useRouter();

  const navItems = [
    { path: "/projects", label: "프로젝트", icon: Briefcase },
    { path: "/notifications", label: "알림", icon: Bell },
    { path: "/company-profile", label: "회사 프로필", icon: Building2 },
    { path: "/settings", label: "설정", icon: Settings },
  ];

  const isActive = (path: string) => {
    if (path === "/projects") {
      return pathname === "/projects" || pathname.startsWith("/projects");
    }
    return pathname === path;
  };

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-[1600px] mx-auto px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <Link href="/projects" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{
              background: 'linear-gradient(135deg, #5B3BFA 0%, #00B4FF 100%)'
            }}>
              <span className="text-white font-bold text-xl">A</span>
            </div>
            <span className="text-2xl tracking-tight" style={{ color: 'var(--aifix-navy)' }}>
              <span style={{ fontWeight: 700 }}>AIFIX</span>
              <span style={{ fontWeight: 300, color: 'var(--aifix-gray)', marginLeft: '8px' }}>
                협력사 포털
              </span>
            </span>
          </Link>

          {/* Navigation Items */}
          <div className="flex items-center gap-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.path);
              
              return (
                <Link
                  key={item.path}
                  href={item.path}
                  className="flex items-center gap-2 px-6 py-3 rounded-xl transition-all duration-200"
                  style={{
                    backgroundColor: active ? 'var(--aifix-secondary-light)' : 'transparent',
                    color: active ? 'var(--aifix-primary)' : 'var(--aifix-gray)',
                    fontWeight: active ? 600 : 400,
                  }}
                >
                  <Icon className="w-5 h-5" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>

          {/* User Profile */}
          <div className="flex items-center gap-3">
            <div className="text-right">
              <div style={{ fontWeight: 600, color: 'var(--aifix-navy)' }}>협력사명</div>
              <div style={{ fontSize: '14px', color: 'var(--aifix-gray)' }}>사용자명</div>
            </div>
            <DropdownMenu modal={false}>
              <DropdownMenuTrigger asChild>
                <button
                  className="w-10 h-10 rounded-full bg-gray-200 hover:bg-gray-300 transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-[var(--aifix-primary)] focus:ring-offset-1"
                  aria-label="계정 메뉴"
                />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-40">
                <DropdownMenuItem
                  variant="destructive"
                  onClick={() => router.push('/')}
                  className="cursor-pointer"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  로그아웃
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </nav>
  );
}
