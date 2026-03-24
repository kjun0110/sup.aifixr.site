'use client';

import { GlobalNav } from "../components/GlobalNav";

export function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <GlobalNav />
      <main className="max-w-[1600px] mx-auto px-8 py-12 overflow-x-hidden min-w-0">
        {children}
      </main>
    </div>
  );
}
