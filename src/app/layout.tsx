import type { Metadata } from 'next';
import { SiteProvider } from './contexts/SiteContext';
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
        <SiteProvider>{children}</SiteProvider>
      </body>
    </html>
  );
}
