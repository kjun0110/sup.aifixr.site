import type { Metadata } from 'next';
import { SiteProvider } from './contexts/SiteContext';
import SupSessionRestore from './components/SupSessionRestore';
import { AppToaster } from './components/AppToaster';
import { SupGoogleLinkReturnHandler } from './components/SupGoogleLinkReturnHandler';
import '../styles/index.css';

export const metadata: Metadata = {
  title: 'sup portal',
  description: 'AIFIX 협력사 포털',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body>
        <SiteProvider>
          <SupSessionRestore />
          <AppToaster />
          <SupGoogleLinkReturnHandler />
          {children}
        </SiteProvider>
      </body>
    </html>
  );
}
