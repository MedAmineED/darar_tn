'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowDown,
  ArrowRight,
  ArrowUp,
  ImageOff,
  Plus,
  Search,
  X,
} from 'lucide-react';
import { toast } from 'sonner';
import { PageHeader } from '@/components/layout/page-header';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';
import { StatusBadge } from '@/components/products/status-badge';
import { useLocale } from '@/contexts/locale-context';
import { assetUrl, formatPrice } from '@/lib/utils';
import { getApiErrorMessage } from '@/lib/api/client';
import type { Product } from '@/lib/api/catalog-types';
import { useProducts, useSetFeaturedProducts } from '@/hooks/use-products';

/** How many products the storefront homepage section displays. */
const HOMEPAGE_SLOTS = 4;

function Thumb({ product }: { product: Product }) {
  const primary =
    product.images.find((img) => img.isPrimary) ?? product.images[0];
  return (
    <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-surface-container">
      {primary ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={assetUrl(primary.url) ?? ''}
          alt=""
          className="h-full w-full object-cover"
        />
      ) : (
        <ImageOff className="h-4 w-4 text-on-surface-variant" />
      )}
    </div>
  );
}

export default function FeaturedProductsPage() {
  const { locale, t, strings } = useLocale();
  const router = useRouter();
  const { data, isLoading } = useProducts({ page: 1, limit: 100 });
  const save = useSetFeaturedProducts();

  const all = useMemo(() => data?.items ?? [], [data]);
  const byId = useMemo(() => new Map(all.map((p) => [p.id, p])), [all]);

  const [selected, setSelected] = useState<string[] | null>(null);
  const [search, setSearch] = useState('');

  // Start from the current homepage selection once products have loaded.
  useEffect(() => {
    if (data && selected === null) {
      setSelected(
        data.items
          .filter((p) => p.isFeatured)
          .sort((a, b) => a.featuredOrder - b.featuredOrder)
          .map((p) => p.id),
      );
    }
  }, [data, selected]);

  const ids = selected ?? [];
  const name = (p: Product) => (locale === 'ar' ? p.nameAr : p.nameFr);
  const query = search.trim().toLowerCase();
  const available = all.filter(
    (p) =>
      !ids.includes(p.id) &&
      (!query ||
        p.nameAr.toLowerCase().includes(query) ||
        p.nameFr.toLowerCase().includes(query)),
  );

  const move = (index: number, delta: number) => {
    const next = [...ids];
    const target = index + delta;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    setSelected(next);
  };

  const onSave = async () => {
    try {
      await save.mutateAsync(ids);
      toast.success(strings.common.saved);
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  };

  return (
    <div>
      <PageHeader
        title={t('منتجات الصفحة الرئيسية', 'Produits de l’accueil')}
        description={t(
          `اختر المنتجات التي تظهر في قسم «قطع مختارة» ورتّبها. يظهر أول ${HOMEPAGE_SLOTS} منتجات مفعّلة.`,
          `Choisissez et ordonnez les produits de la section « Pièces choisies ». Les ${HOMEPAGE_SLOTS} premiers produits actifs sont affichés.`,
        )}
        action={
          <Button variant="secondary" onClick={() => router.push('/products')}>
            <ArrowRight className="h-4 w-4 ltr:rotate-180" />
            {strings.common.back}
          </Button>
        }
      />

      {isLoading || selected === null ? (
        <div className="flex justify-center py-16">
          <Spinner className="h-6 w-6" />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>
                {t('المعروضة (بالترتيب)', 'Affichés (dans l’ordre)')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {ids.length === 0 ? (
                <p className="py-8 text-center text-sm text-on-surface-variant">
                  {t(
                    'لا توجد منتجات مختارة. أضف منتجات من القائمة.',
                    'Aucun produit choisi. Ajoutez-en depuis la liste.',
                  )}
                </p>
              ) : (
                <ol className="space-y-2">
                  {ids.map((id, index) => {
                    const product = byId.get(id);
                    if (!product) return null;
                    const visible = product.status === 'ACTIVE';
                    return (
                      <li
                        key={id}
                        className="flex items-center gap-3 rounded-lg border border-outline-variant/70 p-2"
                      >
                        <span className="w-6 text-center text-sm font-semibold text-on-surface-variant">
                          {index + 1}
                        </span>
                        <Thumb product={product} />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium text-on-surface">
                            {name(product)}
                          </p>
                          <div className="mt-0.5 flex items-center gap-2">
                            {!visible && (
                              <StatusBadge status={product.status} />
                            )}
                            {index >= HOMEPAGE_SLOTS && (
                              <Badge tone="neutral">
                                {t('احتياطي', 'En réserve')}
                              </Badge>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-1">
                          <button
                            type="button"
                            onClick={() => move(index, -1)}
                            disabled={index === 0}
                            className="rounded p-1.5 text-on-surface-variant hover:bg-surface-container disabled:opacity-30"
                            aria-label={t('إلى الأعلى', 'Monter')}
                          >
                            <ArrowUp className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => move(index, 1)}
                            disabled={index === ids.length - 1}
                            className="rounded p-1.5 text-on-surface-variant hover:bg-surface-container disabled:opacity-30"
                            aria-label={t('إلى الأسفل', 'Descendre')}
                          >
                            <ArrowDown className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              setSelected(ids.filter((x) => x !== id))
                            }
                            className="rounded p-1.5 text-error hover:bg-error-container/40"
                            aria-label={t('إزالة', 'Retirer')}
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      </li>
                    );
                  })}
                </ol>
              )}
              <div className="mt-4 flex justify-start">
                <Button onClick={onSave} isLoading={save.isPending}>
                  {strings.common.save}
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t('كل المنتجات', 'Tous les produits')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="relative mb-3">
                <Search className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-on-surface-variant" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder={t('بحث…', 'Rechercher…')}
                  className="ps-9"
                />
              </div>
              <ul className="space-y-2">
                {available.map((product) => (
                  <li
                    key={product.id}
                    className="flex items-center gap-3 rounded-lg border border-outline-variant/70 p-2"
                  >
                    <Thumb product={product} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-on-surface">
                        {name(product)}
                      </p>
                      <div className="mt-0.5 flex items-center gap-2">
                        <span className="text-xs text-on-surface-variant" dir="ltr">
                          {formatPrice(product.price)}
                        </span>
                        <StatusBadge status={product.status} />
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => setSelected([...ids, product.id])}
                    >
                      <Plus className="h-4 w-4" />
                      {t('إضافة', 'Ajouter')}
                    </Button>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
