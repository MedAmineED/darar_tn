import type { Metadata } from 'next';
import { LocaleProvider } from '@/contexts/locale-context';
import { strings } from '@/config/strings';
import { AuthProvider } from '@/providers/auth-provider';
import { QueryProvider } from '@/providers/query-provider';
import { MotionProvider } from '@/components/motion/motion-provider';
import './globals.css';

export const metadata: Metadata = {
  title: `${strings.appName} — ${strings.appSubtitle}`,
  description: 'لوحة إدارة داريا لإدارة المنتجات والطلبات والعملاء',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ar" dir="rtl">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+Arabic:wght@400;500;600;700&family=Inter:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-sans antialiased">
        <QueryProvider>
          <LocaleProvider>
            <MotionProvider>
              <AuthProvider>{children}</AuthProvider>
            </MotionProvider>
          </LocaleProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
