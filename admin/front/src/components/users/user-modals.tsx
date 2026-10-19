'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { toast } from 'sonner';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Toggle } from '@/components/ui/toggle';
import { useLocale } from '@/contexts/locale-context';
import { getApiErrorMessage } from '@/lib/api/client';
import type { AdminUser, Role } from '@/lib/api/users';
import { useResetPassword, useSaveUser } from '@/hooks/use-users';

export const ROLE_LABELS: Record<string, [string, string]> = {
  SUPER_ADMIN: ['مدير عام (كل الصلاحيات)', 'Super admin (tous les droits)'],
  ADMIN: ['مدير', 'Administrateur'],
  MANAGER: ['مسيّر (قراءة + الطلبات)', 'Gestionnaire (lecture + commandes)'],
};

export function roleLabel(name: string, locale: 'ar' | 'fr'): string {
  const known = ROLE_LABELS[name];
  return known ? known[locale === 'ar' ? 0 : 1] : name;
}

export function UserModal({
  open,
  onClose,
  user,
  roles,
}: {
  open: boolean;
  onClose: () => void;
  user: AdminUser | null;
  roles: Role[];
}) {
  const { t, strings, locale } = useLocale();
  const save = useSaveUser();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isActive, setActive] = useState(true);
  const [roleIds, setRoleIds] = useState<string[]>([]);

  useEffect(() => {
    if (!open) return;
    setFirstName(user?.firstName ?? '');
    setLastName(user?.lastName ?? '');
    setEmail(user?.email ?? '');
    setPassword('');
    setActive(user?.isActive ?? true);
    setRoleIds(user?.roles.map((r) => r.id) ?? []);
  }, [open, user]);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!firstName.trim() || !lastName.trim() || !email.trim())
      return void toast.error(strings.common.required);
    if (!user && password.length < 8)
      return void toast.error(
        t(
          'كلمة المرور 8 أحرف على الأقل',
          'Mot de passe : 8 caractères minimum',
        ),
      );
    if (!roleIds.length)
      return void toast.error(
        t('اختر دوراً واحداً على الأقل', 'Choisissez au moins un rôle'),
      );
    try {
      await save.mutateAsync({
        id: user?.id,
        input: {
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          email: email.trim().toLowerCase(),
          password: user ? undefined : password,
          isActive,
          roleIds,
        },
      });
      toast.success(strings.common.saved);
      onClose();
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={
        user
          ? t('تعديل المستخدم', 'Modifier l’utilisateur')
          : t('مستخدم جديد', 'Nouvel utilisateur')
      }
    >
      <form onSubmit={submit} className="space-y-4 p-5">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="user-first">{t('الاسم', 'Prénom')}</Label>
            <Input
              id="user-first"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="user-last">{t('اللقب', 'Nom')}</Label>
            <Input
              id="user-last"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
            />
          </div>
        </div>
        <div>
          <Label htmlFor="user-email">{t('البريد الإلكتروني', 'E-mail')}</Label>
          <Input
            id="user-email"
            type="email"
            dir="ltr"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        {!user && (
          <div>
            <Label htmlFor="user-password">
              {t('كلمة المرور', 'Mot de passe')}
            </Label>
            <Input
              id="user-password"
              type="password"
              dir="ltr"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
        )}
        <fieldset>
          <legend className="mb-1.5 text-xs font-medium text-on-surface-variant">
            {t('الأدوار والصلاحيات', 'Rôles et droits')}
          </legend>
          <div className="space-y-1.5">
            {roles.map((role) => (
              <label
                key={role.id}
                className="flex cursor-pointer items-start gap-2 rounded-lg border border-outline-variant/60 p-2.5 text-[13px] hover:bg-surface-low"
              >
                <input
                  type="checkbox"
                  className="mt-0.5"
                  checked={roleIds.includes(role.id)}
                  onChange={(e) =>
                    setRoleIds((ids) =>
                      e.target.checked
                        ? [...ids, role.id]
                        : ids.filter((id) => id !== role.id),
                    )
                  }
                />
                <span>
                  <span className="font-medium">
                    {roleLabel(role.name, locale)}
                  </span>
                  {role.description && (
                    <span className="block text-[11px] text-on-surface-variant">
                      {role.description}
                    </span>
                  )}
                </span>
              </label>
            ))}
          </div>
        </fieldset>
        <Toggle
          checked={isActive}
          onChange={setActive}
          label={t('حساب مفعّل', 'Compte actif')}
        />
        <div className="flex justify-end gap-2 border-t border-outline-variant/60 pt-4">
          <Button type="button" variant="secondary" onClick={onClose}>
            {strings.common.cancel}
          </Button>
          <Button type="submit" isLoading={save.isPending}>
            {strings.common.save}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

export function PasswordModal({
  user,
  onClose,
}: {
  user: AdminUser | null;
  onClose: () => void;
}) {
  const { t, strings } = useLocale();
  const reset = useResetPassword();
  const [password, setPassword] = useState('');
  useEffect(() => setPassword(''), [user]);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!user) return;
    if (password.length < 8)
      return void toast.error(
        t(
          'كلمة المرور 8 أحرف على الأقل',
          'Mot de passe : 8 caractères minimum',
        ),
      );
    try {
      await reset.mutateAsync({ id: user.id, password });
      toast.success(
        t(
          'تم تغيير كلمة المرور وإغلاق جلساته',
          'Mot de passe changé, sessions fermées',
        ),
      );
      onClose();
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  }

  return (
    <Modal
      open={Boolean(user)}
      onClose={onClose}
      title={t('إعادة تعيين كلمة المرور', 'Réinitialiser le mot de passe')}
    >
      <form onSubmit={submit} className="space-y-4 p-5">
        <p className="text-xs text-on-surface-variant">
          {user?.email} —{' '}
          {t(
            'سيتم تسجيل خروجه من كل الأجهزة.',
            'Il sera déconnecté de tous ses appareils.',
          )}
        </p>
        <div>
          <Label htmlFor="reset-password">
            {t('كلمة المرور الجديدة', 'Nouveau mot de passe')}
          </Label>
          <Input
            id="reset-password"
            type="password"
            dir="ltr"
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        <div className="flex justify-end gap-2 border-t border-outline-variant/60 pt-4">
          <Button type="button" variant="secondary" onClick={onClose}>
            {strings.common.cancel}
          </Button>
          <Button type="submit" isLoading={reset.isPending}>
            {strings.common.save}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
