'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Sidebar } from '@/components/layout/sidebar';
import { MobileNavigation } from '@/components/layout/mobile-navigation';
import { Header } from '@/components/layout/header';
import { FullScreenLoader } from '@/components/ui/spinner';
import { useLocale } from '@/contexts/locale-context';
import { useAuth } from '@/providers/auth-provider';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { strings } = useLocale();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const { status } = useAuth();

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.replace('/login');
    }
  }, [status, router]);

  if (status !== 'authenticated') {
    return <FullScreenLoader label={strings.common.loading} />;
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <div id="desktop-sidebar" className="hidden shrink-0 lg:block">
        <Sidebar />
      </div>
      <MobileNavigation open={menuOpen} onClose={() => setMenuOpen(false)} />
      <div className="flex min-w-0 flex-1 flex-col">
        <Header onToggleMenu={() => setMenuOpen(true)} />
        <main className="admin-workspace scrollbar-thin relative min-h-0 flex-1 overflow-y-auto px-3 py-4 sm:px-5 sm:py-5">
          <div className="min-w-0">{children}</div>
        </main>
      </div>
    </div>
  );
}
