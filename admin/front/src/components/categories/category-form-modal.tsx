'use client';

import { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Toggle } from '@/components/ui/toggle';
import type { InterfaceStrings } from '@/config/strings';
import { useLocale } from '@/contexts/locale-context';
import { assetUrl } from '@/lib/utils';
import { getApiErrorMessage } from '@/lib/api/client';
import { uploadCategoryImage } from '@/lib/api/categories';
import type { Category } from '@/lib/api/catalog-types';
import { useCreateCategory, useUpdateCategory } from '@/hooks/use-categories';

const createSchema = (strings: InterfaceStrings) =>
  z.object({
    nameAr: z.string().min(1, strings.common.required),
    nameFr: z.string().min(1, strings.common.required),
    parentId: z.string(),
    sortOrder: z.coerce
      .number({ invalid_type_error: strings.common.required })
      .int(strings.settings.invalid)
      .min(0, strings.settings.invalid),
    isActive: z.boolean(),
    descriptionAr: z.string().optional(),
    descriptionFr: z.string().optional(),
  });

type FormValues = z.infer<ReturnType<typeof createSchema>>;

interface Props {
  open: boolean;
  onClose: () => void;
  category: Category | null;
  parentOptions: Category[];
}

export function CategoryFormModal({
  open,
  onClose,
  category,
  parentOptions,
}: Props) {
  const { strings, t } = useLocale();
  const c = strings.catalog.categories;
  const isEdit = Boolean(category);
  const create = useCreateCategory();
  const update = useUpdateCategory();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(createSchema(strings)),
    values: {
      nameAr: category?.nameAr ?? '',
      nameFr: category?.nameFr ?? '',
      parentId: category?.parentId ?? '',
      sortOrder: category?.sortOrder ?? 0,
      isActive: category?.isActive ?? true,
      descriptionAr: category?.descriptionAr ?? '',
      descriptionFr: category?.descriptionFr ?? '',
    },
  });

  const isActive = watch('isActive');

  const [image, setImage] = useState<string | null>(category?.image ?? null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Keep the image preview in sync when the modal is reused for another row.
  useEffect(() => {
    setImage(category?.image ?? null);
  }, [category, open]);

  const onPickImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ''; // allow re-selecting the same file
    if (!file) return;
    setUploading(true);
    try {
      const { url } = await uploadCategoryImage(file);
      setImage(url);
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    } finally {
      setUploading(false);
    }
  };

  const onSubmit = async (values: FormValues) => {
    const payload = {
      nameAr: values.nameAr,
      nameFr: values.nameFr,
      parentId: values.parentId || null,
      sortOrder: values.sortOrder,
      isActive: values.isActive,
      descriptionAr: values.descriptionAr || undefined,
      descriptionFr: values.descriptionFr || undefined,
      image: image ?? null,
    };
    try {
      if (category) {
        await update.mutateAsync({ id: category.id, input: payload });
      } else {
        await create.mutateAsync(payload);
      }
      toast.success(strings.common.saved);
      reset();
      onClose();
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  };

  // Exclude self from parent options to avoid the obvious cycle.
  const options = parentOptions.filter((o) => o.id !== category?.id);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? c.edit : c.add}
      className="max-w-xl"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="nameAr">{c.nameAr}</Label>
            <Input
              id="nameAr"
              dir="rtl"
              hasError={!!errors.nameAr}
              {...register('nameAr')}
            />
            {errors.nameAr && (
              <p className="mt-1 text-xs text-error">{errors.nameAr.message}</p>
            )}
          </div>
          <div>
            <Label htmlFor="nameFr">{c.nameFr}</Label>
            <Input
              id="nameFr"
              dir="ltr"
              hasError={!!errors.nameFr}
              {...register('nameFr')}
            />
            {errors.nameFr && (
              <p className="mt-1 text-xs text-error">{errors.nameFr.message}</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="parentId">{c.parent}</Label>
            <Select id="parentId" {...register('parentId')}>
              <option value="">{c.noParent}</option>
              {options.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.nameAr} — {o.nameFr}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Label htmlFor="sortOrder">{c.sortOrder}</Label>
            <Input
              id="sortOrder"
              type="number"
              dir="ltr"
              {...register('sortOrder')}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="descriptionAr">{c.descAr}</Label>
            <Textarea
              id="descriptionAr"
              dir="rtl"
              rows={2}
              {...register('descriptionAr')}
            />
          </div>
          <div>
            <Label htmlFor="descriptionFr">{c.descFr}</Label>
            <Textarea
              id="descriptionFr"
              dir="ltr"
              rows={2}
              {...register('descriptionFr')}
            />
          </div>
        </div>

        <div>
          <Label>{t('صورة الفئة', 'Image de la catégorie')}</Label>
          <div className="mt-1 flex items-center gap-4">
            <div className="h-20 w-20 shrink-0 overflow-hidden rounded-md border border-black/10 bg-black/5">
              {image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={assetUrl(image) ?? ''}
                  alt=""
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-xs text-black/40">
                  —
                </div>
              )}
            </div>
            <div className="flex flex-col items-start gap-1.5">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={onPickImage}
              />
              <Button
                type="button"
                variant="secondary"
                isLoading={uploading}
                onClick={() => fileInputRef.current?.click()}
              >
                {image
                  ? t('تغيير الصورة', 'Changer l’image')
                  : t('رفع صورة', 'Importer une image')}
              </Button>
              {image && (
                <button
                  type="button"
                  onClick={() => setImage(null)}
                  className="text-xs text-error hover:underline"
                >
                  {t('إزالة الصورة', 'Supprimer l’image')}
                </button>
              )}
            </div>
          </div>
        </div>

        <Toggle
          checked={isActive}
          onChange={(v) => setValue('isActive', v)}
          label={strings.common.active}
        />

        <div className="flex justify-start gap-3 pt-2">
          <Button
            type="submit"
            isLoading={create.isPending || update.isPending}
          >
            {strings.common.save}
          </Button>
          <Button type="button" variant="secondary" onClick={onClose}>
            {strings.common.cancel}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
