'use client';

import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { ImagePlus, Minus, Plus, Trash2 } from 'lucide-react';
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
import type { Product, ProductStatus } from '@/lib/api/catalog-types';
import type { Pack, PackInput } from '@/lib/api/packs';
import { useProducts } from '@/hooks/use-products';
import {
  useCreatePack,
  useUpdatePack,
  useUploadPackImage,
} from '@/hooks/use-packs';
import { assetUrl, formatPrice } from '@/lib/utils';

interface Line {
  productId: string;
  nameAr: string;
  nameFr: string;
  price: number;
  cost: number | null;
  quantity: number;
}

const STATUSES: ProductStatus[] = ['DRAFT', 'ACTIVE', 'INACTIVE', 'ARCHIVED'];

export function PackFormModal({
  open,
  onClose,
  pack,
}: {
  open: boolean;
  onClose: () => void;
  pack: Pack | null;
}) {
  const { t, strings, locale } = useLocale();
  const create = useCreatePack();
  const update = useUpdatePack();
  const upload = useUploadPackImage();
  const [nameAr, setNameAr] = useState('');
  const [nameFr, setNameFr] = useState('');
  const [descriptionAr, setDescriptionAr] = useState('');
  const [descriptionFr, setDescriptionFr] = useState('');
  const [price, setPrice] = useState('');
  const [status, setStatus] = useState<ProductStatus>('DRAFT');
  const [isFeatured, setFeatured] = useState(false);
  const [lines, setLines] = useState<Line[]>([]);
  const [search, setSearch] = useState('');
  const [file, setFile] = useState<File | null>(null);

  useEffect(() => {
    if (!open) return;
    setNameAr(pack?.nameAr ?? '');
    setNameFr(pack?.nameFr ?? '');
    setDescriptionAr(pack?.descriptionAr ?? '');
    setDescriptionFr(pack?.descriptionFr ?? '');
    setPrice(pack ? String(pack.price) : '');
    setStatus(pack?.status ?? 'DRAFT');
    setFeatured(pack?.isFeatured ?? false);
    setLines(
      pack?.items.map((i) => ({
        productId: i.productId,
        nameAr: i.nameAr,
        nameFr: i.nameFr,
        price: i.unitPrice,
        cost: i.unitCost,
        quantity: i.quantity,
      })) ?? [],
    );
    setSearch('');
    setFile(null);
  }, [open, pack]);

  const { data: found } = useProducts({
    page: 1,
    limit: 8,
    search: search || undefined,
  });

  const regular = useMemo(
    () => lines.reduce((sum, l) => sum + l.price * l.quantity, 0),
    [lines],
  );
  const cost = lines.some((l) => l.cost === null)
    ? null
    : lines.reduce((sum, l) => sum + (l.cost ?? 0) * l.quantity, 0);
  const priceValue = Number(price);
  const name = (l: { nameAr: string; nameFr: string }) =>
    locale === 'ar' ? l.nameAr : l.nameFr;

  function addProduct(product: Product) {
    setLines((current) =>
      current.some((l) => l.productId === product.id)
        ? current.map((l) =>
            l.productId === product.id
              ? { ...l, quantity: Math.min(99, l.quantity + 1) }
              : l,
          )
        : [
            ...current,
            {
              productId: product.id,
              nameAr: product.nameAr,
              nameFr: product.nameFr,
              price: product.price,
              cost: product.costPrice,
              quantity: 1,
            },
          ],
    );
  }

  function setQuantity(productId: string, quantity: number) {
    setLines((current) =>
      current.map((l) =>
        l.productId === productId
          ? { ...l, quantity: Math.max(1, Math.min(99, quantity)) }
          : l,
      ),
    );
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (
      !nameAr.trim() ||
      !nameFr.trim() ||
      !lines.length ||
      !(priceValue >= 0) ||
      price === ''
    ) {
      toast.error(
        t(
          'أدخل الاسمين والسعر وأضف منتجاً واحداً على الأقل.',
          'Renseignez les deux noms, le prix et au moins un produit.',
        ),
      );
      return;
    }
    const input: PackInput = {
      nameAr: nameAr.trim(),
      nameFr: nameFr.trim(),
      descriptionAr: descriptionAr.trim() || undefined,
      descriptionFr: descriptionFr.trim() || undefined,
      price: Math.round(priceValue * 100) / 100,
      status,
      isFeatured,
      items: lines.map((l) => ({
        productId: l.productId,
        quantity: l.quantity,
      })),
    };
    try {
      const saved = pack
        ? await update.mutateAsync({ id: pack.id, input })
        : await create.mutateAsync(input);
      if (file) await upload.mutateAsync({ id: saved.id, file });
      toast.success(strings.common.saved);
      onClose();
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  }

  const saving = create.isPending || update.isPending || upload.isPending;
  const preview = file ? URL.createObjectURL(file) : assetUrl(pack?.image);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={
        pack
          ? t('تعديل الباقة', 'Modifier le pack')
          : t('باقة جديدة', 'Nouveau pack')
      }
      className="max-w-3xl"
    >
      <form onSubmit={submit} className="space-y-4 p-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="pack-name-ar">
              {t('الاسم (عربي)', 'Nom (arabe)')}
            </Label>
            <Input
              id="pack-name-ar"
              dir="rtl"
              value={nameAr}
              onChange={(e) => setNameAr(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="pack-name-fr">
              {t('الاسم (فرنسي)', 'Nom (français)')}
            </Label>
            <Input
              id="pack-name-fr"
              dir="ltr"
              value={nameFr}
              onChange={(e) => setNameFr(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="pack-desc-ar">
              {t('الوصف (عربي)', 'Description (arabe)')}
            </Label>
            <Textarea
              id="pack-desc-ar"
              dir="rtl"
              rows={2}
              value={descriptionAr}
              onChange={(e) => setDescriptionAr(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="pack-desc-fr">
              {t('الوصف (فرنسي)', 'Description (français)')}
            </Label>
            <Textarea
              id="pack-desc-fr"
              dir="ltr"
              rows={2}
              value={descriptionFr}
              onChange={(e) => setDescriptionFr(e.target.value)}
            />
          </div>
        </div>

        <div className="rounded-lg border border-outline-variant/60 p-3">
          <Label htmlFor="pack-search">
            {t('منتجات الباقة', 'Produits du pack')}
          </Label>
          <Input
            id="pack-search"
            placeholder={t(
              'ابحث عن منتج لإضافته…',
              'Rechercher un produit à ajouter…',
            )}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <div className="mt-2 flex flex-wrap gap-1.5">
            {(found?.items ?? []).map((product) => (
              <button
                key={product.id}
                type="button"
                onClick={() => addProduct(product)}
                className="inline-flex items-center gap-1 rounded-md border border-outline-variant/70 px-2 py-1 text-xs hover:bg-surface-container"
              >
                <Plus className="h-3 w-3" />
                {name(product)}
                <span className="text-on-surface-variant" dir="ltr">
                  {formatPrice(product.price)}
                </span>
              </button>
            ))}
          </div>
          {lines.length > 0 && (
            <table className="mt-3 w-full text-[13px]">
              <tbody>
                {lines.map((line) => (
                  <tr
                    key={line.productId}
                    className="border-t border-outline-variant/50"
                  >
                    <td className="py-2">
                      {name(line)}
                      {line.cost === null && (
                        <span className="ms-2 text-[11px] text-amber-700">
                          {t('بدون تكلفة', 'sans coût')}
                        </span>
                      )}
                    </td>
                    <td className="py-2" dir="ltr">
                      {formatPrice(line.price)}
                    </td>
                    <td className="py-2">
                      <div className="flex items-center gap-1" dir="ltr">
                        <button
                          type="button"
                          aria-label="-"
                          className="rounded p-1 hover:bg-surface-container"
                          onClick={() =>
                            setQuantity(line.productId, line.quantity - 1)
                          }
                        >
                          <Minus className="h-3.5 w-3.5" />
                        </button>
                        <span className="w-6 text-center tabular-nums">
                          {line.quantity}
                        </span>
                        <button
                          type="button"
                          aria-label="+"
                          className="rounded p-1 hover:bg-surface-container"
                          onClick={() =>
                            setQuantity(line.productId, line.quantity + 1)
                          }
                        >
                          <Plus className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                    <td className="py-2 text-end">
                      <button
                        type="button"
                        aria-label={strings.common.delete}
                        className="rounded p-1 text-error hover:bg-error-container/40"
                        onClick={() =>
                          setLines((c) =>
                            c.filter((l) => l.productId !== line.productId),
                          )
                        }
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <Label htmlFor="pack-price">
              {t('سعر الباقة الخاص', 'Prix spécial du pack')}
            </Label>
            <Input
              id="pack-price"
              type="number"
              step="0.01"
              min="0"
              dir="ltr"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="pack-status">{t('الحالة', 'Statut')}</Label>
            <Select
              id="pack-status"
              value={status}
              onChange={(e) => setStatus(e.target.value as ProductStatus)}
            >
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {strings.catalog.status[s]}
                </option>
              ))}
            </Select>
          </div>
          <div className="flex items-end pb-1">
            <Toggle
              checked={isFeatured}
              onChange={setFeatured}
              label={t('عرض مميّز', 'Mis en avant')}
            />
          </div>
        </div>

        <div
          className="grid gap-2 rounded-lg bg-surface-low p-3 text-xs sm:grid-cols-4"
          dir="auto"
        >
          <p>
            {t('السعر العادي', 'Prix normal')}:{' '}
            <b dir="ltr">{formatPrice(regular)}</b>
          </p>
          <p>
            {t('التخفيض', 'Remise')}:{' '}
            <b dir="ltr">
              {regular > 0 && price !== ''
                ? `${Math.round(((regular - priceValue) / regular) * 100)}%`
                : '—'}
            </b>
          </p>
          <p>
            {t('التكلفة', 'Coût')}:{' '}
            <b dir="ltr">{cost === null ? '—' : formatPrice(cost)}</b>
          </p>
          <p>
            {t('الربح المتوقع', 'Marge estimée')}:{' '}
            <b
              dir="ltr"
              className={
                cost !== null && priceValue - cost < 0 ? 'text-error' : ''
              }
            >
              {cost === null || price === ''
                ? '—'
                : formatPrice(priceValue - cost)}
            </b>
          </p>
        </div>

        <div className="flex items-center gap-3">
          {preview && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={preview}
              alt=""
              className="h-16 w-16 rounded object-cover"
            />
          )}
          <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-outline-variant/70 px-3 py-2 text-xs hover:bg-surface-container">
            <ImagePlus className="h-4 w-4" />
            {t('صورة الباقة (اختياري)', 'Image du pack (facultatif)')}
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,image/avif"
              className="sr-only"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            />
          </label>
          <span className="text-[11px] text-on-surface-variant">
            {t(
              'بدون صورة تُستعمل صورة أول منتج.',
              "Sinon, l'image du premier produit est utilisée.",
            )}
          </span>
        </div>

        <div className="flex justify-end gap-2 border-t border-outline-variant/60 pt-4">
          <Button type="button" variant="secondary" onClick={onClose}>
            {strings.common.cancel}
          </Button>
          <Button type="submit" isLoading={saving}>
            {strings.common.save}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
