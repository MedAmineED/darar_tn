'use client';

import { useRouter } from 'next/navigation';
import { LogOut, Menu } from 'lucide-react';
import { LanguageSwitch } from './language-switch';
import { Breadcrumbs } from './breadcrumbs';
import { Button } from '@/components/ui/button';
import { useLocale } from '@/contexts/locale-context';
import { useAuth } from '@/providers/auth-provider';

export function Header({ onToggleMenu }: { onToggleMenu?: () => void }) {
  const { strings, locale, t } = useLocale();
  const router = useRouter();
  const { user, signOut } = useAuth();

  const handleLogout = async () => {
    await signOut();
    router.replace('/login');
  };

  const initials = user
    ? `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`
    : '';

  return (
    <header className="flex h-header shrink-0 items-center justify-between gap-3 border-b border-outline-variant/60 bg-surface-lowest px-3 sm:px-5">
      <div className="flex min-w-0 items-center gap-2.5">
        <button
          type="button"
          onClick={onToggleMenu}
          className="rounded p-2 text-on-surface hover:bg-surface-container focus-visible:outline focus-visible:outline-primary lg:hidden"
          aria-label={t('فتح قائمة التنقل', 'Ouvrir la navigation')}
        >
          <Menu className="h-5 w-5" />
        </button>
        <Breadcrumbs />
      </div>

      <div className="flex shrink-0 items-center gap-2 sm:gap-3">
        <LanguageSwitch />
        <div
          className="flex items-center gap-2"
          title={
            user
              ? `${user.firstName} ${user.lastName} · ${user.roles.join(', ')}`
              : ''
          }
        >
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-[11px] font-semibold text-primary">
            {initials}
          </div>
          <div className="hidden text-start leading-tight sm:block">
            <p className="text-xs font-medium text-on-surface">
              {user ? `${user.firstName} ${user.lastName}` : ''}
            </p>
            <p className="text-[10px] text-on-surface-variant">
              {user?.roles
                .map(
                  (role) =>
                    ({
                      SUPER_ADMIN: t('مدير عام', 'Super administrateur'),
                      ADMIN: t('مدير', 'Administrateur'),
                      MANAGER: t('مسؤول', 'Responsable'),
                      STAFF: t('موظف', 'Équipe'),
                    })[role] ?? role,
                )
                .join(locale === 'ar' ? '، ' : ', ')}
            </p>
          </div>
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={handleLogout}
          aria-label={strings.common.logout}
        >
          <LogOut className="h-4 w-4" />
          <span className="hidden sm:inline">{strings.common.logout}</span>
        </Button>
      </div>
    </header>
  );
}
