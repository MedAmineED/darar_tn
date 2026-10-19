'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { toast } from 'sonner';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Toggle } from '@/components/ui/toggle';
import { useLocale } from '@/contexts/locale-context';
import { getApiErrorMessage } from '@/lib/api/client';
import type { Partner, PartnerEntryKind } from '@/lib/api/accounting';
import {
  useCreateEntry,
  useCreateExpense,
  useSavePartner,
} from '@/hooks/use-accounting';

export const today = () =>
  new Date(Date.now() + 3_600_000).toISOString().slice(0, 10);

function Actions({
  onClose,
  saving,
}: {
  onClose: () => void;
  saving: boolean;
}) {
  const { strings } = useLocale();
  return (
    <div className="flex justify-end gap-2 border-t border-outline-variant/60 pt-4">
      <Button type="button" variant="secondary" onClick={onClose}>
        {strings.common.cancel}
      </Button>
      <Button type="submit" isLoading={saving}>
        {strings.common.save}
      </Button>
    </div>
  );
}

export function PartnerModal({
  open,
  onClose,
  partner,
}: {
  open: boolean;
  onClose: () => void;
  partner: Partner | null;
}) {
  const { t, strings } = useLocale();
  const save = useSavePartner();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [isActive, setActive] = useState(true);
  useEffect(() => {
    if (!open) return;
    setName(partner?.name ?? '');
    setPhone(partner?.phone ?? '');
    setNotes(partner?.notes ?? '');
    setActive(partner?.isActive ?? true);
  }, [open, partner]);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!name.trim()) return void toast.error(strings.common.required);
    try {
      await save.mutateAsync({
        id: partner?.id,
        input: {
          name: name.trim(),
          phone: phone.trim() || undefined,
          notes: notes.trim() || undefined,
          isActive,
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
        partner
          ? t('تعديل الشريك', 'Modifier l’associé')
          : t('شريك جديد', 'Nouvel associé')
      }
    >
      <form onSubmit={submit} className="space-y-4 p-5">
        <div>
          <Label htmlFor="partner-name">{t('الاسم', 'Nom')}</Label>
          <Input
            id="partner-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="partner-phone">{t('الهاتف', 'Téléphone')}</Label>
          <Input
            id="partner-phone"
            dir="ltr"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="partner-notes">{t('ملاحظات', 'Notes')}</Label>
          <Textarea
            id="partner-notes"
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>
        <Toggle
          checked={isActive}
          onChange={setActive}
          label={t('نشط', 'Actif')}
        />
        <Actions onClose={onClose} saving={save.isPending} />
      </form>
    </Modal>
  );
}

export function EntryModal({
  open,
  onClose,
  partners,
  defaultPartnerId,
  defaultKind = 'CONTRIBUTION',
}: {
  open: boolean;
  onClose: () => void;
  partners: Partner[];
  defaultPartnerId?: string;
  defaultKind?: PartnerEntryKind;
}) {
  const { t, strings } = useLocale();
  const create = useCreateEntry();
  const [partnerId, setPartnerId] = useState('');
  const [kind, setKind] = useState<PartnerEntryKind>('CONTRIBUTION');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(today());
  const [note, setNote] = useState('');
  useEffect(() => {
    if (!open) return;
    setPartnerId(defaultPartnerId ?? partners[0]?.id ?? '');
    setKind(defaultKind);
    setAmount('');
    setDate(today());
    setNote('');
  }, [open, defaultPartnerId, defaultKind, partners]);

  async function submit(event: FormEvent) {
    event.preventDefault();
    const value = Number(amount);
    if (!partnerId || !(value > 0) || !date)
      return void toast.error(strings.common.required);
    try {
      await create.mutateAsync({
        partnerId,
        kind,
        amount: Math.round(value * 100) / 100,
        date,
        note: note.trim() || undefined,
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
      title={t('حركة شريك', 'Mouvement d’associé')}
    >
      <form onSubmit={submit} className="space-y-4 p-5">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="entry-partner">{t('الشريك', 'Associé')}</Label>
            <Select
              id="entry-partner"
              value={partnerId}
              onChange={(e) => setPartnerId(e.target.value)}
            >
              {partners.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Label htmlFor="entry-kind">{t('النوع', 'Type')}</Label>
            <Select
              id="entry-kind"
              value={kind}
              onChange={(e) => setKind(e.target.value as PartnerEntryKind)}
            >
              <option value="CONTRIBUTION">
                {t('مساهمة / مصروف دفعه', 'Apport / dépense payée')}
              </option>
              <option value="WITHDRAWAL">{t('سحب', 'Retrait')}</option>
            </Select>
          </div>
          <div>
            <Label htmlFor="entry-amount">{t('المبلغ', 'Montant')}</Label>
            <Input
              id="entry-amount"
              type="number"
              min="0.01"
              step="0.01"
              dir="ltr"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="entry-date">{t('التاريخ', 'Date')}</Label>
            <Input
              id="entry-date"
              type="date"
              dir="ltr"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>
        </div>
        <div>
          <Label htmlFor="entry-note">
            {t('ملاحظة (مثال: شراء خشب)', 'Note (ex. achat de bois)')}
          </Label>
          <Input
            id="entry-note"
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
        </div>
        <Actions onClose={onClose} saving={create.isPending} />
      </form>
    </Modal>
  );
}

export function ExpenseModal({
  open,
  onClose,
  partners,
  categories,
}: {
  open: boolean;
  onClose: () => void;
  partners: Partner[];
  categories: string[];
}) {
  const { t, strings } = useLocale();
  const create = useCreateExpense();
  const [label, setLabel] = useState('');
  const [category, setCategory] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(today());
  const [paidBy, setPaidBy] = useState('');
  useEffect(() => {
    if (!open) return;
    setLabel('');
    setCategory('');
    setAmount('');
    setDate(today());
    setPaidBy('');
  }, [open]);

  async function submit(event: FormEvent) {
    event.preventDefault();
    const value = Number(amount);
    if (!label.trim() || !(value > 0) || !date)
      return void toast.error(strings.common.required);
    try {
      await create.mutateAsync({
        label: label.trim(),
        category: category.trim() || undefined,
        amount: Math.round(value * 100) / 100,
        date,
        paidByPartnerId: paidBy || undefined,
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
      title={t('مصروف جديد', 'Nouvelle dépense')}
    >
      <form onSubmit={submit} className="space-y-4 p-5">
        <div>
          <Label htmlFor="expense-label">{t('الوصف', 'Libellé')}</Label>
          <Input
            id="expense-label"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="expense-category">{t('الفئة', 'Catégorie')}</Label>
            <Input
              id="expense-category"
              list="expense-categories"
              placeholder={t(
                'إشهار، نقل، تغليف…',
                'Pub, transport, emballage…',
              )}
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            />
            <datalist id="expense-categories">
              {categories.map((c) => (
                <option key={c} value={c} />
              ))}
            </datalist>
          </div>
          <div>
            <Label htmlFor="expense-amount">{t('المبلغ', 'Montant')}</Label>
            <Input
              id="expense-amount"
              type="number"
              min="0.01"
              step="0.01"
              dir="ltr"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="expense-date">{t('التاريخ', 'Date')}</Label>
            <Input
              id="expense-date"
              type="date"
              dir="ltr"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="expense-paid">
              {t('دفعه من جيبه', 'Payé de sa poche par')}
            </Label>
            <Select
              id="expense-paid"
              value={paidBy}
              onChange={(e) => setPaidBy(e.target.value)}
            >
              <option value="">
                {t('صندوق المشروع', 'Caisse de l’entreprise')}
              </option>
              {partners.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </Select>
          </div>
        </div>
        <p className="text-[11px] text-on-surface-variant">
          {t(
            'إذا دفعه شريك من ماله الخاص، يُحسب ضمن ما صرفه ويرفع نسبته.',
            'Payée par un associé, elle compte dans ses apports et sa part.',
          )}
        </p>
        <Actions onClose={onClose} saving={create.isPending} />
      </form>
    </Modal>
  );
}
