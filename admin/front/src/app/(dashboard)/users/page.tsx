'use client';

import { useState } from 'react';
import { KeyRound, Pencil, Plus, Trash2, UserCog } from 'lucide-react';
import { toast } from 'sonner';
import { PageHeader } from '@/components/layout/page-header';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';
import { Pagination } from '@/components/ui/pagination';
import { Badge } from '@/components/ui/badge';
import { Toggle } from '@/components/ui/toggle';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { EmptyState } from '@/components/common/empty-state';
import { FilterToolbar } from '@/components/common/filter-toolbar';
import {
  PasswordModal,
  UserModal,
  roleLabel,
} from '@/components/users/user-modals';
import { useLocale } from '@/contexts/locale-context';
import { getApiErrorMessage } from '@/lib/api/client';
import type { AdminUser } from '@/lib/api/users';
import {
  useDeleteUser,
  useRoles,
  useToggleUser,
  useUsers,
} from '@/hooks/use-users';
import { useAuth } from '@/providers/auth-provider';
import { formatDate } from '@/lib/utils';

export default function UsersPage() {
  const { t, strings, locale } = useLocale();
  const { hasPermission, user: me } = useAuth();
  const canCreate = hasPermission('user:create');
  const canUpdate = hasPermission('user:update');
  const canDelete = hasPermission('user:delete');
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState<AdminUser | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [resetting, setResetting] = useState<AdminUser | null>(null);
  const [toDelete, setToDelete] = useState<AdminUser | null>(null);
  const { data, isLoading } = useUsers({
    page,
    limit: 10,
    search: search || undefined,
  });
  const { data: roles = [] } = useRoles(hasPermission('role:read'));
  const toggle = useToggleUser();
  const remove = useDeleteUser();

  async function setActive(user: AdminUser, isActive: boolean) {
    try {
      await toggle.mutateAsync({ id: user.id, isActive });
      toast.success(strings.common.saved);
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  }

  async function confirmDelete() {
    if (!toDelete) return;
    try {
      await remove.mutateAsync(toDelete.id);
      toast.success(strings.common.deleted);
      setToDelete(null);
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  }

  return (
    <div>
      <PageHeader
        title={t('المستخدمون', 'Utilisateurs')}
        description={t(
          'حسابات فريق لوحة الإدارة وأدوارهم. تعطيل حساب يغلق كل جلساته فوراً.',
          'Comptes de l’équipe et leurs rôles. Désactiver un compte ferme immédiatement ses sessions.',
        )}
        action={
          canCreate && (
            <Button
              onClick={() => {
                setEditing(null);
                setFormOpen(true);
              }}
            >
              <Plus className="h-4 w-4" />
              {t('مستخدم جديد', 'Nouvel utilisateur')}
            </Button>
          )
        }
      />
      <FilterToolbar
        resultLabel={
          data ? `${data.meta.total} ${t('مستخدم', 'utilisateurs')}` : undefined
        }
        search={
          <Input
            aria-label={strings.common.search}
            placeholder={t(
              'ابحث بالاسم أو البريد…',
              'Rechercher par nom ou e-mail…',
            )}
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
        }
      />
      <Card>
        {isLoading ? (
          <div className="flex justify-center py-16">
            <Spinner className="h-6 w-6" />
          </div>
        ) : !data?.items.length ? (
          <EmptyState
            icon={UserCog}
            message={t('لا يوجد مستخدمون', 'Aucun utilisateur')}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-[13px]">
              <thead>
                <tr className="border-b border-outline-variant text-xs text-on-surface-variant">
                  <th className="px-4 py-3 text-start font-semibold">
                    {t('المستخدم', 'Utilisateur')}
                  </th>
                  <th className="px-4 py-3 text-start font-semibold">
                    {t('الأدوار', 'Rôles')}
                  </th>
                  <th className="px-4 py-3 text-start font-semibold">
                    {t('آخر دخول', 'Dernière connexion')}
                  </th>
                  <th className="px-4 py-3 text-start font-semibold">
                    {t('مفعّل', 'Actif')}
                  </th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {data.items.map((user) => {
                  const isMe = user.id === me?.id;
                  return (
                    <tr
                      key={user.id}
                      className="border-b border-outline-variant/60 last:border-0"
                    >
                      <td className="px-4 py-3">
                        <p className="font-medium text-on-surface">
                          {user.firstName} {user.lastName}
                          {isMe && (
                            <Badge tone="info" className="ms-2">
                              {t('أنت', 'vous')}
                            </Badge>
                          )}
                        </p>
                        <p
                          className="text-xs text-on-surface-variant"
                          dir="ltr"
                        >
                          {user.email}
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1">
                          {user.roles.map((r) => (
                            <Badge
                              key={r.id}
                              tone={
                                r.name === 'SUPER_ADMIN' ? 'warning' : 'neutral'
                              }
                            >
                              {roleLabel(r.name, locale)}
                            </Badge>
                          ))}
                        </div>
                      </td>
                      <td
                        className="px-4 py-3 text-xs text-on-surface-variant"
                        dir="ltr"
                      >
                        {user.lastLoginAt ? formatDate(user.lastLoginAt) : '—'}
                      </td>
                      <td className="px-4 py-3">
                        <Toggle
                          checked={user.isActive}
                          disabled={!canUpdate || isMe || toggle.isPending}
                          onChange={(value) => setActive(user, value)}
                          label={t('مفعّل', 'Actif')}
                        />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-1">
                          {canUpdate && (
                            <>
                              <button
                                className="rounded p-1.5 text-on-surface-variant hover:bg-surface-container"
                                aria-label={t(
                                  'إعادة تعيين كلمة المرور',
                                  'Réinitialiser le mot de passe',
                                )}
                                title={t(
                                  'إعادة تعيين كلمة المرور',
                                  'Réinitialiser le mot de passe',
                                )}
                                onClick={() => setResetting(user)}
                              >
                                <KeyRound className="h-4 w-4" />
                              </button>
                              <button
                                className="rounded p-1.5 text-on-surface-variant hover:bg-surface-container"
                                aria-label={strings.common.edit}
                                onClick={() => {
                                  setEditing(user);
                                  setFormOpen(true);
                                }}
                              >
                                <Pencil className="h-4 w-4" />
                              </button>
                            </>
                          )}
                          {canDelete && !isMe && (
                            <button
                              className="rounded p-1.5 text-error hover:bg-error-container/40"
                              aria-label={strings.common.delete}
                              onClick={() => setToDelete(user)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        {data && <Pagination meta={data.meta} onPageChange={setPage} />}
      </Card>
      <UserModal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        user={editing}
        roles={roles}
      />
      <PasswordModal user={resetting} onClose={() => setResetting(null)} />
      <ConfirmDialog
        open={Boolean(toDelete)}
        title={strings.common.confirmDelete}
        message={t(
          'حذف هذا المستخدم نهائياً؟ يمكنك تعطيله بدلاً من ذلك.',
          'Supprimer définitivement cet utilisateur ? Vous pouvez plutôt le désactiver.',
        )}
        isLoading={remove.isPending}
        onConfirm={confirmDelete}
        onCancel={() => setToDelete(null)}
      />
    </div>
  );
}
