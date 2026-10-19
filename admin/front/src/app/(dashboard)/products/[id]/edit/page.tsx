'use client';

import { useParams, useRouter } from 'next/navigation';
import { ArrowRight } from 'lucide-react';
import { PageHeader } from '@/components/layout/page-header';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { EmptyState } from '@/components/common/empty-state';
import { Package } from 'lucide-react';
import { ProductForm } from '@/components/products/product-form';
import { ImageManager } from '@/components/products/image-manager';
import { useLocale } from '@/contexts/locale-context';
import { useProduct } from '@/hooks/use-products';
import { useCategories } from '@/hooks/use-categories';

export default function EditProductPage() {
  const { strings } = useLocale();
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const { data: product, isLoading, isError } = useProduct(params.id);
  const { data: cats } = useCategories({ limit: 100 });

  return (
    <div>
      <PageHeader
        title={strings.catalog.products.edit}
        description={
          product ? `${product.nameAr} — ${product.nameFr}` : undefined
        }
        action={
          <Button variant="secondary" onClick={() => router.push('/products')}>
            <ArrowRight className="h-4 w-4 ltr:rotate-180" />
            {strings.common.back}
          </Button>
        }
      />

      {isLoading ? (
        <div className="flex justify-center py-16">
          <Spinner className="h-6 w-6" />
        </div>
      ) : isError || !product ? (
        <EmptyState icon={Package} message={strings.common.noResults} />
      ) : (
        <div className="space-y-6">
          <ProductForm
            product={product}
            categories={cats?.items ?? []}
            onSaved={() => undefined}
          />
          <ImageManager product={product} />
        </div>
      )}
    </div>
  );
}
