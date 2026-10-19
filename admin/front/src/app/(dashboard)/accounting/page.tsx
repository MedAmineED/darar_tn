'use client';

import { useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowDownCircle,
  ArrowUpCircle,
  HandCoins,
  Pencil,
  Receipt,
  Trash2,
  UserPlus,
} from 'lucide-react';
import { toast } from 'sonner';
import { PageHeader } from '@/components/layout/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Spinner } from '@/components/ui/spinner';
import { Pagination } from '@/components/ui/pagination';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { EmptyState } from '@/components/common/empty-state';
import {
  EntryModal,
  ExpenseModal,
  PartnerModal,
  today,
} from '@/components/accounting/accounting-forms';
import { useLocale } from '@/contexts/locale-context';
import { getApiErrorMessage } from '@/lib/api/client';
import type {
  DateRange,
  Partner,
  PartnerEntryKind,
} from '@/lib/api/accounting';
import {
  useAccountingSummary,
  useDeleteEntry,
  useDeleteExpense,
  useDeletePartner,
  useEntries,
  useExpenses,
  usePartners,
} from '@/hooks/use-accounting';
import { useAuth } from '@/providers/auth-provider';
import { cn, formatDate, formatPrice } from '@/lib/utils';

type Preset = 'month' | 'lastMonth' | 'year' | 'all' | 'custom';

function presetRange(preset: Preset): DateRange {
  const now = today();
  const [y, m] = now.split('-').map(Number);
  const pad = (n: number) => String(n).padStart(2, '0');
  if (preset === 'month') return { from: `${y}-${pad(m)}-01`, to: now };
  if (preset === 'lastMonth') {
    const py = m === 1 ? y - 1 : y;
    const pm = m === 1 ? 12 : m - 1;
    const last = new Date(Date.UTC(py, pm, 0)).getUTCDate();
    return { from: `${py}-${pad(pm)}-01`, to: `${py}-${pad(pm)}-${pad(last)}` };
  }
  if (preset === 'year') return { from: `${y}-01-01`, to: now };
  return {};
}

function Kpi({
  label,
  value,
  hint,
  tone,
}: {
  label: string;
  value: string;
  hint?: string;
  tone?: 'good' | 'bad';
}) {
  return (
    <Card className="p-4">
      <p className="text-xs text-on-surface-variant">{label}</p>
      <p
        dir="ltr"
        className={cn(
          'mt-1 text-start font-heading text-xl font-semibold',
          tone === 'good' && 'text-tertiary',
          tone === 'bad' && 'text-error',
        )}
      >
        {value}
      </p>
      {hint && (
        <p className="mt-1 text-[11px] text-on-surface-variant">{hint}</p>
      )}
    </Card>
  );
}

export default function AccountingPage() {
  const { t } = useLocale();
  const { hasPermission } = useAuth();
  const canManage = hasPermission('accounting:manage');
  const [preset, setPreset] = useState<Preset>('month');
  const [custom, setCustom] = useState<DateRange>(presetRange('month'));
  const range = preset === 'custom' ? custom : presetRange(preset);
  const { data, isLoading } = useAccountingSummary(range);
  const { data: partners = [] } = usePartners();

  const [tab, setTab] = useState<'entries' | 'expenses'>('entries');
  const [ledgerPage, setLedgerPage] = useState(1);
  const [ledgerPartner, setLedgerPartner] = useState('');
  const ledgerParams = {
    ...range,
    page: ledgerPage,
    limit: 10,
    partnerId: ledgerPartner || undefined,
  };
  const entries = useEntries(ledgerParams);
  const expenses = useExpenses(ledgerParams);

  const [partnerModal, setPartnerModal] = useState<{
    open: boolean;
    partner: Partner | null;
  }>({ open: false, partner: null });
  const [entryModal, setEntryModal] = useState<{
    open: boolean;
    partnerId?: string;
    kind?: PartnerEntryKind;
  }>({ open: false });
  const [expenseOpen, setExpenseOpen] = useState(false);
  const [toDelete, setToDelete] = useState<{
    type: 'entry' | 'expense' | 'partner';
    id: string;
  } | null>(null);
  const deleteEntry = useDeleteEntry();
  const deleteExpense = useDeleteExpense();
  const deletePartner = useDeletePartner();

  const categories = useMemo(
    () =>
      (data?.expensesByCategory ?? [])
        .map((c) => c.category)
        .filter((c): c is string => Boolean(c)),
    [data],
  );

  async function confirmDelete() {
    if (!toDelete) return;
    try {
      if (toDelete.type === 'entry') await deleteEntry.mutateAsync(toDelete.id);
      if (toDelete.type === 'expense')
        await deleteExpense.mutateAsync(toDelete.id);
      if (toDelete.type === 'partner')
        await deletePartner.mutateAsync(toDelete.id);
      toast.success(t('تم الحذف', 'Supprimé'));
      setToDelete(null);
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  }

  const p = data?.period;
  const presets: { key: Preset; label: string }[] = [
    { key: 'month', label: t('هذا الشهر', 'Ce mois') },
    { key: 'lastMonth', label: t('الشهر الماضي', 'Mois dernier') },
    { key: 'year', label: t('هذه السنة', 'Cette année') },
    { key: 'all', label: t('منذ البداية', 'Depuis le début') },
    { key: 'custom', label: t('فترة مخصّصة', 'Personnalisé') },
  ];

  return (
    <div className="space-y-4">
      <PageHeader
        title={t('المحاسبة والشركاء', 'Comptabilité & associés')}
        description={t(
          'الربح = ما دفعه الزبائن − تكلفة شراء القطع المباعة − المصاريف. بدون أداءات (TVA). نصيب كل شريك حسب نسبة ما صرفه.',
          'Bénéfice = encaissé − coût d’achat des pièces vendues − dépenses. Sans TVA. Part de chaque associé selon ce qu’il a apporté.',
        )}
        action={
          canManage && (
            <div className="flex flex-wrap gap-2">
              <Button
                variant="secondary"
                onClick={() => setPartnerModal({ open: true, partner: null })}
              >
                <UserPlus className="h-4 w-4" />
                {t('شريك', 'Associé')}
              </Button>
              <Button variant="secondary" onClick={() => setExpenseOpen(true)}>
                <Receipt className="h-4 w-4" />
                {t('مصروف', 'Dépense')}
              </Button>
              <Button
                disabled={!partners.length}
                onClick={() => setEntryModal({ open: true })}
              >
                <HandCoins className="h-4 w-4" />
                {t('حركة شريك', 'Mouvement')}
              </Button>
            </div>
          )
        }
      />

      <Card className="flex flex-wrap items-end gap-2 p-3">
        {presets.map((item) => (
          <Button
            key={item.key}
            size="sm"
            variant={preset === item.key ? 'primary' : 'secondary'}
            onClick={() => {
              setPreset(item.key);
              setLedgerPage(1);
            }}
          >
            {item.label}
          </Button>
        ))}
        {preset === 'custom' && (
          <>
            <Input
              type="date"
              dir="ltr"
              className="w-40"
              aria-label={t('من', 'Du')}
              value={custom.from ?? ''}
              onChange={(e) =>
                setCustom((c) => ({ ...c, from: e.target.value || undefined }))
              }
            />
            <Input
              type="date"
              dir="ltr"
              className="w-40"
              aria-label={t('إلى', 'Au')}
              value={custom.to ?? ''}
              onChange={(e) =>
                setCustom((c) => ({ ...c, to: e.target.value || undefined }))
              }
            />
          </>
        )}
      </Card>

      {isLoading || !data || !p ? (
        <div className="flex justify-center py-16">
          <Spinner className="h-6 w-6" />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
            <Kpi
              label={t(
                'المداخيل (طلبات مدفوعة)',
                'Encaissé (commandes payées)',
              )}
              value={formatPrice(p.revenue)}
              hint={`${p.orders} ${t('طلب', 'commandes')} · ${t('توصيل', 'livraison')} ${formatPrice(p.shippingCollected)}`}
            />
            <Kpi
              label={t('تكلفة القطع المباعة', 'Coût des pièces vendues')}
              value={formatPrice(p.cogs)}
            />
            <Kpi
              label={t('المصاريف', 'Dépenses')}
              value={formatPrice(p.expenses)}
            />
            <Kpi
              label={t('الربح الصافي', 'Bénéfice net')}
              value={formatPrice(p.netProfit)}
              hint={
                data.margin !== null
                  ? `${t('الهامش', 'Marge')} ${data.margin}%`
                  : undefined
              }
              tone={p.netProfit >= 0 ? 'good' : 'bad'}
            />
            <Kpi
              label={t('قيمة المخزون بالتكلفة', 'Stock au prix d’achat')}
              value={formatPrice(data.stock.valueAtCost)}
              hint={`${data.stock.units} ${t('قطعة', 'pièces')}`}
            />
          </div>

          {(p.linesWithoutCost > 0 || data.stock.productsWithoutCost > 0) && (
            <div className="flex items-start gap-2 rounded-lg border border-amber-300 bg-amber-50 p-3 text-xs text-amber-800">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              <p>
                {t(
                  `${p.linesWithoutCost} سطر مبيع (${formatPrice(p.revenueWithoutCost)}) بدون سعر شراء، فالربح مضخّم. أضف سعر الشراء في صفحة كل منتج — يُطبّق على الطلبات الجديدة.`,
                  `${p.linesWithoutCost} ligne(s) vendue(s) (${formatPrice(p.revenueWithoutCost)}) sans prix d’achat : bénéfice surestimé. Renseignez le prix d’achat de chaque produit (appliqué aux nouvelles commandes).`,
                )}
                {data.stock.productsWithoutCost > 0 &&
                  ` ${t(`${data.stock.productsWithoutCost} منتج في المخزون بدون تكلفة.`, `${data.stock.productsWithoutCost} produit(s) en stock sans coût.`)}`}
              </p>
            </div>
          )}

          <Card>
            <CardHeader>
              <CardTitle>
                {t(
                  'الشركاء: ما صرفه كل واحد ونصيبه',
                  'Associés : apports et parts',
                )}
              </CardTitle>
            </CardHeader>
            {data.partners.length === 0 ? (
              <EmptyState
                icon={UserPlus}
                message={t(
                  'أضف الشركاء لحساب النسب والأرباح',
                  'Ajoutez les associés pour calculer les parts',
                )}
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[900px] text-[13px]">
                  <thead>
                    <tr className="border-b border-outline-variant text-xs text-on-surface-variant">
                      <th className="px-4 py-3 text-start font-semibold">
                        {t('الشريك', 'Associé')}
                      </th>
                      <th className="px-4 py-3 text-start font-semibold">
                        {t('المساهمات', 'Apports')}
                      </th>
                      <th className="px-4 py-3 text-start font-semibold">
                        {t('مصاريف دفعها', 'Dépenses payées')}
                      </th>
                      <th className="px-4 py-3 text-start font-semibold">
                        {t('مجموع ما صرفه', 'Total dépensé')}
                      </th>
                      <th className="px-4 py-3 text-start font-semibold">
                        {t('النسبة', 'Part %')}
                      </th>
                      <th className="px-4 py-3 text-start font-semibold">
                        {t('نصيبه من ربح الفترة', 'Part du bénéfice (période)')}
                      </th>
                      <th className="px-4 py-3 text-start font-semibold">
                        {t('سحوبات', 'Retraits')}
                      </th>
                      <th className="px-4 py-3 text-start font-semibold">
                        {t('رصيده', 'Solde dû')}
                      </th>
                      <th className="px-4 py-3" />
                    </tr>
                  </thead>
                  <tbody>
                    {data.partners.map((row) => {
                      const partner =
                        partners.find((x) => x.id === row.id) ?? null;
                      return (
                        <tr
                          key={row.id}
                          className={cn(
                            'border-b border-outline-variant/60 last:border-0',
                            !row.isActive && 'opacity-60',
                          )}
                        >
                          <td className="px-4 py-3 font-medium">{row.name}</td>
                          <td className="px-4 py-3" dir="ltr">
                            {formatPrice(row.contributions)}
                          </td>
                          <td className="px-4 py-3" dir="ltr">
                            {formatPrice(row.expensesPaid)}
                          </td>
                          <td className="px-4 py-3 font-semibold" dir="ltr">
                            {formatPrice(row.spent)}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <div
                                className="h-1.5 w-16 overflow-hidden rounded-full bg-surface-container"
                                aria-hidden
                              >
                                <div
                                  className="h-full rounded-full bg-primary-container"
                                  style={{ width: `${row.percent}%` }}
                                />
                              </div>
                              <span dir="ltr" className="tabular-nums">
                                {row.percent}%
                              </span>
                            </div>
                          </td>
                          <td
                            className={cn(
                              'px-4 py-3 font-semibold',
                              row.profitShare < 0
                                ? 'text-error'
                                : 'text-tertiary',
                            )}
                            dir="ltr"
                          >
                            {formatPrice(row.profitShare)}
                          </td>
                          <td className="px-4 py-3" dir="ltr">
                            {formatPrice(row.withdrawals)}
                          </td>
                          <td className="px-4 py-3 font-semibold" dir="ltr">
                            {formatPrice(row.balance)}
                          </td>
                          <td className="px-4 py-3">
                            {canManage && (
                              <div className="flex justify-end gap-1">
                                <button
                                  className="rounded p-1.5 text-tertiary hover:bg-surface-container"
                                  aria-label={t('مساهمة', 'Apport')}
                                  title={t('مساهمة', 'Apport')}
                                  onClick={() =>
                                    setEntryModal({
                                      open: true,
                                      partnerId: row.id,
                                      kind: 'CONTRIBUTION',
                                    })
                                  }
                                >
                                  <ArrowDownCircle className="h-4 w-4" />
                                </button>
                                <button
                                  className="rounded p-1.5 text-on-surface-variant hover:bg-surface-container"
                                  aria-label={t('سحب', 'Retrait')}
                                  title={t('سحب', 'Retrait')}
                                  onClick={() =>
                                    setEntryModal({
                                      open: true,
                                      partnerId: row.id,
                                      kind: 'WITHDRAWAL',
                                    })
                                  }
                                >
                                  <ArrowUpCircle className="h-4 w-4" />
                                </button>
                                <button
                                  className="rounded p-1.5 text-on-surface-variant hover:bg-surface-container"
                                  aria-label={t('تعديل', 'Modifier')}
                                  onClick={() =>
                                    setPartnerModal({ open: true, partner })
                                  }
                                >
                                  <Pencil className="h-4 w-4" />
                                </button>
                                <button
                                  className="rounded p-1.5 text-error hover:bg-error-container/40"
                                  aria-label={t('حذف', 'Supprimer')}
                                  onClick={() =>
                                    setToDelete({ type: 'partner', id: row.id })
                                  }
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot>
                    <tr className="border-t border-outline-variant bg-surface-low text-xs font-semibold">
                      <td className="px-4 py-3">{t('المجموع', 'Total')}</td>
                      <td colSpan={2} />
                      <td className="px-4 py-3" dir="ltr">
                        {formatPrice(data.totals.spent)}
                      </td>
                      <td className="px-4 py-3">100%</td>
                      <td className="px-4 py-3" dir="ltr">
                        {formatPrice(p.netProfit)}
                      </td>
                      <td className="px-4 py-3" dir="ltr">
                        {formatPrice(data.totals.withdrawals)}
                      </td>
                      <td className="px-4 py-3" dir="ltr">
                        {formatPrice(data.totals.balance)}
                      </td>
                      <td />
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
            <CardContent className="text-[11px] text-on-surface-variant">
              {t(
                `النسبة = ما صرفه الشريك ÷ مجموع ما صرفه الجميع (حتى نهاية الفترة). الرصيد = ما صرفه + نصيبه من كل الأرباح منذ البداية (${formatPrice(data.cumulativeNetProfit)}) − ما سحبه.`,
                `Part = apports de l’associé ÷ apports de tous (jusqu’à la fin de la période). Solde = apports + part de tout le bénéfice depuis le début (${formatPrice(data.cumulativeNetProfit)}) − retraits.`,
              )}
            </CardContent>
          </Card>

          <div className="grid gap-4 lg:grid-cols-3">
            <Card className="lg:col-span-2">
              <CardHeader className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex gap-1">
                  <Button
                    size="sm"
                    variant={tab === 'entries' ? 'primary' : 'ghost'}
                    onClick={() => {
                      setTab('entries');
                      setLedgerPage(1);
                    }}
                  >
                    {t('حركات الشركاء', 'Mouvements associés')}
                  </Button>
                  <Button
                    size="sm"
                    variant={tab === 'expenses' ? 'primary' : 'ghost'}
                    onClick={() => {
                      setTab('expenses');
                      setLedgerPage(1);
                    }}
                  >
                    {t('المصاريف', 'Dépenses')}
                  </Button>
                </div>
                <Select
                  className="w-44"
                  aria-label={t('الشريك', 'Associé')}
                  value={ledgerPartner}
                  onChange={(e) => {
                    setLedgerPartner(e.target.value);
                    setLedgerPage(1);
                  }}
                >
                  <option value="">
                    {t('كل الشركاء', 'Tous les associés')}
                  </option>
                  {partners.map((x) => (
                    <option key={x.id} value={x.id}>
                      {x.name}
                    </option>
                  ))}
                </Select>
              </CardHeader>
              {tab === 'entries' ? (
                <Ledger
                  loading={entries.isLoading}
                  rows={(entries.data?.items ?? []).map((e) => ({
                    id: e.id,
                    date: e.date,
                    title:
                      e.note ||
                      (e.kind === 'CONTRIBUTION'
                        ? t('مساهمة', 'Apport')
                        : t('سحب', 'Retrait')),
                    who: e.partner.name,
                    amount: e.kind === 'WITHDRAWAL' ? -e.amount : e.amount,
                  }))}
                  onDelete={
                    canManage
                      ? (id) => setToDelete({ type: 'entry', id })
                      : undefined
                  }
                />
              ) : (
                <Ledger
                  loading={expenses.isLoading}
                  rows={(expenses.data?.items ?? []).map((e) => ({
                    id: e.id,
                    date: e.date,
                    title: e.category ? `${e.label} · ${e.category}` : e.label,
                    who: e.paidBy?.name ?? t('صندوق المشروع', 'Caisse'),
                    amount: -e.amount,
                  }))}
                  onDelete={
                    canManage
                      ? (id) => setToDelete({ type: 'expense', id })
                      : undefined
                  }
                />
              )}
              {tab === 'entries' && entries.data && (
                <Pagination
                  meta={entries.data.meta}
                  onPageChange={setLedgerPage}
                />
              )}
              {tab === 'expenses' && expenses.data && (
                <Pagination
                  meta={expenses.data.meta}
                  onPageChange={setLedgerPage}
                />
              )}
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>
                  {t('المصاريف حسب الفئة', 'Dépenses par catégorie')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {data.expensesByCategory.length === 0 ? (
                  <p className="py-6 text-center text-xs text-on-surface-variant">
                    {t(
                      'لا مصاريف في هذه الفترة',
                      'Aucune dépense sur la période',
                    )}
                  </p>
                ) : (
                  <ul className="space-y-3">
                    {data.expensesByCategory.map((c) => (
                      <li key={c.category ?? '—'}>
                        <div className="mb-1 flex justify-between text-xs">
                          <span>
                            {c.category ?? t('بدون فئة', 'Sans catégorie')}
                          </span>
                          <span dir="ltr">{formatPrice(c.amount)}</span>
                        </div>
                        <div
                          className="h-1.5 overflow-hidden rounded-full bg-surface-container"
                          aria-hidden
                        >
                          <div
                            className="h-full rounded-full bg-primary-container"
                            style={{
                              width: `${p.expenses ? (c.amount / p.expenses) * 100 : 0}%`,
                            }}
                          />
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          </div>
        </>
      )}

      <PartnerModal
        open={partnerModal.open}
        partner={partnerModal.partner}
        onClose={() => setPartnerModal({ open: false, partner: null })}
      />
      <EntryModal
        open={entryModal.open}
        partners={partners.filter((x) => x.isActive)}
        defaultPartnerId={entryModal.partnerId}
        defaultKind={entryModal.kind}
        onClose={() => setEntryModal({ open: false })}
      />
      <ExpenseModal
        open={expenseOpen}
        partners={partners.filter((x) => x.isActive)}
        categories={categories}
        onClose={() => setExpenseOpen(false)}
      />
      <ConfirmDialog
        open={Boolean(toDelete)}
        title={t('تأكيد الحذف', 'Confirmer la suppression')}
        message={
          toDelete?.type === 'partner'
            ? t(
                'حذف الشريك؟ غير ممكن إن كانت له حركات — عطّله بدلاً من ذلك.',
                'Supprimer l’associé ? Impossible s’il a des mouvements — désactivez-le.',
              )
            : t(
                'حذف هذا السطر؟ ستتغيّر الحسابات فوراً.',
                'Supprimer cette ligne ? Les calculs seront mis à jour.',
              )
        }
        isLoading={
          deleteEntry.isPending ||
          deleteExpense.isPending ||
          deletePartner.isPending
        }
        onConfirm={confirmDelete}
        onCancel={() => setToDelete(null)}
      />
    </div>
  );
}

function Ledger({
  rows,
  loading,
  onDelete,
}: {
  rows: {
    id: string;
    date: string;
    title: string;
    who: string;
    amount: number;
  }[];
  loading: boolean;
  onDelete?: (id: string) => void;
}) {
  const { t } = useLocale();
  if (loading)
    return (
      <div className="flex justify-center py-10">
        <Spinner className="h-5 w-5" />
      </div>
    );
  if (!rows.length)
    return (
      <p className="py-10 text-center text-xs text-on-surface-variant">
        {t('لا توجد سطور في هذه الفترة', 'Aucune ligne sur la période')}
      </p>
    );
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[520px] text-[13px]">
        <tbody>
          {rows.map((row) => (
            <tr
              key={row.id}
              className="border-b border-outline-variant/60 last:border-0"
            >
              <td
                className="px-4 py-2.5 text-xs text-on-surface-variant"
                dir="ltr"
              >
                {formatDate(row.date)}
              </td>
              <td className="px-4 py-2.5">{row.title}</td>
              <td className="px-4 py-2.5 text-xs text-on-surface-variant">
                {row.who}
              </td>
              <td
                className={cn(
                  'px-4 py-2.5 font-semibold',
                  row.amount < 0 ? 'text-error' : 'text-tertiary',
                )}
                dir="ltr"
              >
                {row.amount > 0 ? '+' : ''}
                {formatPrice(row.amount)}
              </td>
              <td className="px-2 py-2.5 text-end">
                {onDelete && (
                  <button
                    className="rounded p-1.5 text-error hover:bg-error-container/40"
                    aria-label={t('حذف', 'Supprimer')}
                    onClick={() => onDelete(row.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
