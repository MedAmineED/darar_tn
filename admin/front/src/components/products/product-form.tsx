'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import Link from 'next/link';
import { PackagePlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Toggle } from '@/components/ui/toggle';
import { useLocale } from '@/contexts/locale-context';
import { useAuth } from '@/providers/auth-provider';
import { getApiErrorMessage } from '@/lib/api/client';
import type {
  Category,
  Product,
  ProductInput,
  ProductStatus,
} from '@/lib/api/catalog-types';
import { useCreateProduct, useUpdateProduct } from '@/hooks/use-products';

const STATUSES: ProductStatus[] = ['DRAFT', 'ACTIVE', 'INACTIVE', 'ARCHIVED'];

const createSchema = (
  required: string,
  invalidStock: string,
  requiredReason: string,
) =>
  z
    .object({
      nameAr: z.string().min(1, required),
      nameFr: z.string().min(1, required),
      shortDescriptionAr: z.string().optional(),
      shortDescriptionFr: z.string().optional(),
      descriptionAr: z.string().optional(),
      descriptionFr: z.string().optional(),
      sku: z.string().optional(),
      price: z.coerce.number().min(0, required),
      oldPrice: z.union([z.coerce.number().min(0), z.literal('')]).optional(),
      costPrice: z.union([z.coerce.number().min(0), z.literal('')]).optional(),
      status: z.enum(['DRAFT', 'ACTIVE', 'INACTIVE', 'ARCHIVED']),
      isFeatured: z.boolean(),
      categoryId: z.string(),
      initialQuantity: z.coerce
        .number()
        .int(invalidStock)
        .min(0, invalidStock)
        .max(1000000000, invalidStock),
      lowStockThreshold: z.coerce
        .number()
        .int(invalidStock)
        .min(0, invalidStock)
        .max(1000000000, invalidStock),
      stockReason: z.string().trim().max(500, requiredReason),
    })
    .superRefine((values, ctx) => {
      if (
        (values.initialQuantity > 0 || values.lowStockThreshold > 0) &&
        !values.stockReason
      )
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['stockReason'],
          message: requiredReason,
        });
    });

type FormValues = z.infer<ReturnType<typeof createSchema>>;

interface Props {
  product?: Product;
  categories: Category[];
  onSaved: (product: Product) => void;
}

export function ProductForm({ product, categories, onSaved }: Props) {
  const { strings, t } = useLocale();
  const { hasPermission } = useAuth();
  const canOpenStock = !product && hasPermission('inventory:adjust');
  const schema = createSchema(
    strings.common.required,
    t(
      'أدخل عددًا صحيحًا بين 0 و1000000000.',
      'Indiquez un entier entre 0 et 1 000 000 000.',
    ),
    t(
      'سبب المخزون مطلوب (1 إلى 500 حرف).',
      'Un motif de stock est requis (1 à 500 caractères).',
    ),
  );
  const p = strings.catalog.products;
  const create = useCreateProduct();
  const update = useUpdateProduct();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    values: {
      nameAr: product?.nameAr ?? '',
      nameFr: product?.nameFr ?? '',
      shortDescriptionAr: product?.shortDescriptionAr ?? '',
      shortDescriptionFr: product?.shortDescriptionFr ?? '',
      descriptionAr: product?.descriptionAr ?? '',
      descriptionFr: product?.descriptionFr ?? '',
      sku: product?.sku ?? '',
      price: product?.price ?? 0,
      oldPrice: product?.oldPrice ?? '',
      costPrice: product?.costPrice ?? '',
      status: product?.status ?? 'DRAFT',
      isFeatured: product?.isFeatured ?? false,
      categoryId: product?.categoryId ?? '',
      initialQuantity: 0,
      lowStockThreshold: 0,
      stockReason: '',
    },
  });

  const isFeatured = watch('isFeatured');

  const onSubmit = async (values: FormValues) => {
    const payload: ProductInput = {
      nameAr: values.nameAr,
      nameFr: values.nameFr,
      shortDescriptionAr: values.shortDescriptionAr || undefined,
      shortDescriptionFr: values.shortDescriptionFr || undefined,
      descriptionAr: values.descriptionAr || undefined,
      descriptionFr: values.descriptionFr || undefined,
      sku: values.sku || undefined,
      price: values.price,
      oldPrice: values.oldPrice === '' ? null : values.oldPrice,
      costPrice:
        values.costPrice === '' || values.costPrice === undefined
          ? null
          : values.costPrice,
      status: values.status,
      isFeatured: values.isFeatured,
      categoryId: values.categoryId || null,
    };
    try {
      const saved = product
        ? await update.mutateAsync({ id: product.id, input: payload })
        : await create.mutateAsync({
            ...payload,
            ...(canOpenStock
              ? {
                  initialQuantity: values.initialQuantity,
                  lowStockThreshold: values.lowStockThreshold,
                  stockReason: values.stockReason || undefined,
                }
              : {}),
          });
      toast.success(strings.common.saved);
      onSaved(saved);
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Arabic content (RTL) */}
        <Card>
          <CardHeader>
            <CardTitle>{p.arabicSection}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4" dir="rtl">
            <div>
              <Label htmlFor="nameAr">{p.name}</Label>
              <Input
                id="nameAr"
                hasError={!!errors.nameAr}
                {...register('nameAr')}
              />
              {errors.nameAr && (
                <p className="mt-1 text-xs text-error">
                  {errors.nameAr.message}
                </p>
              )}
            </div>
            <div>
              <Label htmlFor="shortDescriptionAr">{p.shortDesc}</Label>
              <Textarea
                id="shortDescriptionAr"
                rows={2}
                {...register('shortDescriptionAr')}
              />
            </div>
            <div>
              <Label htmlFor="descriptionAr">{p.fullDesc}</Label>
              <Textarea
                id="descriptionAr"
                rows={4}
                {...register('descriptionAr')}
              />
            </div>
          </CardContent>
        </Card>

        {/* French content (LTR) */}
        <Card>
          <CardHeader>
            <CardTitle>{p.frenchSection}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4" dir="ltr">
            <div>
              <Label htmlFor="nameFr">{p.name}</Label>
              <Input
                id="nameFr"
                hasError={!!errors.nameFr}
                {...register('nameFr')}
              />
              {errors.nameFr && (
                <p className="mt-1 text-xs text-error">
                  {errors.nameFr.message}
                </p>
              )}
            </div>
            <div>
              <Label htmlFor="shortDescriptionFr">{p.shortDesc}</Label>
              <Textarea
                id="shortDescriptionFr"
                rows={2}
                {...register('shortDescriptionFr')}
              />
            </div>
            <div>
              <Label htmlFor="descriptionFr">{p.fullDesc}</Label>
              <Textarea
                id="descriptionFr"
                rows={4}
                {...register('descriptionFr')}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{p.pricing}</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="price">{p.price}</Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                dir="ltr"
                hasError={!!errors.price}
                {...register('price')}
              />
              {errors.price && (
                <p className="mt-1 text-xs text-error">
                  {errors.price.message}
                </p>
              )}
            </div>
            <div>
              <Label htmlFor="oldPrice">{p.oldPrice}</Label>
              <Input
                id="oldPrice"
                type="number"
                step="0.01"
                dir="ltr"
                {...register('oldPrice')}
              />
            </div>
            <div className="col-span-2">
              <Label htmlFor="costPrice">
                {t('سعر الشراء / التكلفة', "Prix d'achat / coût")}
              </Label>
              <Input
                id="costPrice"
                type="number"
                step="0.01"
                min="0"
                dir="ltr"
                {...register('costPrice')}
              />
              <p className="mt-1 text-xs text-on-surface-variant">
                {t(
                  'لحساب الربح فقط — لا يظهر للزبائن.',
                  'Sert au calcul du bénéfice — jamais affiché aux clients.',
                )}
              </p>
            </div>
            <div className="col-span-2">
              <Label htmlFor="sku">{p.sku}</Label>
              <Input id="sku" dir="ltr" {...register('sku')} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{p.organization}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="categoryId">{p.category}</Label>
              <Select id="categoryId" {...register('categoryId')}>
                <option value="">{p.noCategory}</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.nameAr} — {cat.nameFr}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <Label htmlFor="status">{p.status}</Label>
              <Select id="status" {...register('status')}>
                {STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {strings.catalog.status[s]}
                  </option>
                ))}
              </Select>
            </div>
            <Toggle
              checked={isFeatured}
              onChange={(v) => setValue('isFeatured', v)}
              label={p.featured}
            />
          </CardContent>
        </Card>
      </div>

      <Card className="border-primary/25">
        <CardHeader className="flex items-center gap-3 bg-primary/5">
          <PackagePlus className="h-5 w-5 text-primary" />
          <CardTitle>{t('المخزون', 'Stock')}</CardTitle>
        </CardHeader>
        <CardContent>
          {canOpenStock ? (
            <div className="space-y-4">
              <p className="text-sm text-on-surface-variant">
                {t(
                  'سجّل الكمية الفعلية المتوفرة الآن. تُحفظ مع المنتج كحركة افتتاحية في سجل المخزون.',
                  'Renseignez la quantité réellement disponible. Elle sera enregistrée avec le produit et son mouvement d’ouverture.',
                )}
              </p>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="initialQuantity">
                    {t('الكمية الافتتاحية', 'Quantité initiale')}
                  </Label>
                  <Input
                    id="initialQuantity"
                    type="number"
                    min={0}
                    max={1000000000}
                    step={1}
                    dir="ltr"
                    hasError={!!errors.initialQuantity}
                    {...register('initialQuantity')}
                  />
                  {errors.initialQuantity && (
                    <p role="alert" className="mt-1 text-xs text-error">
                      {errors.initialQuantity.message}
                    </p>
                  )}
                </div>
                <div>
                  <Label htmlFor="initialThreshold">
                    {t('حد المخزون المنخفض', 'Seuil de stock faible')}
                  </Label>
                  <Input
                    id="initialThreshold"
                    type="number"
                    min={0}
                    max={1000000000}
                    step={1}
                    dir="ltr"
                    hasError={!!errors.lowStockThreshold}
                    {...register('lowStockThreshold')}
                  />
                  {errors.lowStockThreshold && (
                    <p role="alert" className="mt-1 text-xs text-error">
                      {errors.lowStockThreshold.message}
                    </p>
                  )}
                </div>
              </div>
              <div>
                <Label htmlFor="initialStockReason">
                  {t('سبب المخزون الافتتاحي', 'Motif du stock initial')}
                </Label>
                <Textarea
                  id="initialStockReason"
                  rows={2}
                  maxLength={500}
                  placeholder={t(
                    'مثال: جرد أولي أو دفعة من الورشة',
                    'Ex. : inventaire initial ou livraison de l’atelier',
                  )}
                  hasError={!!errors.stockReason}
                  {...register('stockReason')}
                />
                {errors.stockReason && (
                  <p role="alert" className="mt-1 text-xs text-error">
                    {errors.stockReason.message}
                  </p>
                )}
                <p className="mt-1 text-xs text-on-surface-variant">
                  {t(
                    'مطلوب عند إدخال كمية أو حد تنبيه أكبر من صفر.',
                    'Requis si la quantité ou le seuil est supérieur à zéro.',
                  )}
                </p>
              </div>
            </div>
          ) : product ? (
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm text-on-surface-variant">
                {t(
                  'أضف الكميات المستلمة أو عدّل الرصيد من صفحة المخزون للحفاظ على سجل الحركات.',
                  'Réceptionnez ou ajustez les quantités depuis la page Stock pour conserver l’historique.',
                )}
              </p>
              {hasPermission('inventory:read') && (
                <Link
                  className="rounded border border-outline-variant px-4 py-2 text-sm font-medium text-primary hover:bg-surface-low"
                  href={`/inventory?search=${encodeURIComponent(product.sku || product.nameFr)}`}
                >
                  {t('إدارة المخزون', 'Gérer le stock')}
                </Link>
              )}
            </div>
          ) : (
            <p className="text-sm text-on-surface-variant">
              {t(
                'يبدأ المخزون بصفر. يمكن لمن لديه صلاحية تعديل المخزون إضافة الكمية لاحقًا.',
                'Le stock commence à zéro. Une personne autorisée à ajuster le stock pourra ajouter les quantités ensuite.',
              )}
            </p>
          )}
        </CardContent>
      </Card>
      <div className="sticky bottom-0 flex justify-start gap-3 border-t border-outline-variant bg-background/95 py-4">
        <Button
          type="submit"
          size="lg"
          isLoading={create.isPending || update.isPending}
        >
          {strings.common.save}
        </Button>
      </div>
    </form>
  );
}
