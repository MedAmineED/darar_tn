'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight } from 'lucide-react';
import { PageHeader } from '@/components/layout/page-header';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { ProductForm } from '@/components/products/product-form';
import { useLocale } from '@/contexts/locale-context';
import { useCategories } from '@/hooks/use-categories';

export default function CreateProductPage() {
  const { strings } = useLocale();
  const router = useRouter();
  const [returnToInventory, setReturnToInventory] = useState(false);
  useEffect(() => {
    setReturnToInventory(
      new URLSearchParams(window.location.search).get('returnTo') ===
        'inventory',
    );
  }, []);
  const { data, isLoading } = useCategories({ limit: 100 });

  return (
    <div>
      <PageHeader
        title={strings.catalog.products.create}
        action={
          <Button
            variant="secondary"
            onClick={() =>
              router.push(returnToInventory ? '/inventory' : '/products')
            }
          >
            <ArrowRight className="h-4 w-4 ltr:rotate-180" />
            {strings.common.back}
          </Button>
        }
      />
      {isLoading ? (
        <div className="flex justify-center py-16">
          <Spinner className="h-6 w-6" />
        </div>
      ) : (
        <ProductForm
          categories={data?.items ?? []}
          onSaved={(product) =>
            router.push(
              returnToInventory
                ? `/inventory?search=${encodeURIComponent(product.sku || product.nameFr)}`
                : `/products/${product.id}/edit`,
            )
          }
        />
      )}
    </div>
  );
}
