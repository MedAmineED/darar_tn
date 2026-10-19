'use client';

import { useRef } from 'react';
import { ImagePlus, Star, Trash2, UploadCloud } from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useLocale } from '@/contexts/locale-context';
import { assetUrl } from '@/lib/utils';
import { getApiErrorMessage } from '@/lib/api/client';
import type { Product } from '@/lib/api/catalog-types';
import { useProductImages } from '@/hooks/use-products';

export function ImageManager({ product }: { product: Product }) {
  const { strings, locale } = useLocale();
  const p = strings.catalog.products;
  const inputRef = useRef<HTMLInputElement>(null);
  const { upload, setPrimary, remove } = useProductImages(product.id);

  const onFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    try {
      await upload.mutateAsync(Array.from(files));
      toast.success(strings.common.saved);
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    } finally {
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const onSetPrimary = async (imageId: string) => {
    try {
      await setPrimary.mutateAsync(imageId);
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  };

  const onRemove = async (imageId: string) => {
    try {
      await remove.mutateAsync(imageId);
      toast.success(strings.common.deleted);
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>{p.images}</CardTitle>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          isLoading={upload.isPending}
          onClick={() => inputRef.current?.click()}
        >
          <UploadCloud className="h-4 w-4" />
          {p.uploadImages}
        </Button>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          hidden
          onChange={(e) => onFiles(e.target.files)}
        />
      </CardHeader>
      <CardContent>
        {product.images.length === 0 ? (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="flex w-full flex-col items-center gap-2 rounded-lg border border-dashed border-outline-variant py-10 text-on-surface-variant hover:bg-surface-container/40"
          >
            <ImagePlus className="h-8 w-8" />
            <span className="text-sm">{p.dropHint}</span>
          </button>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
            {product.images.map((image) => (
              <div
                key={image.id}
                className="group relative overflow-hidden rounded-lg border border-outline-variant"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={assetUrl(image.url) ?? ''}
                  alt={(locale === 'ar' ? image.altAr : image.altFr) ?? ''}
                  className="aspect-square w-full object-cover"
                />
                {image.isPrimary && (
                  <Badge tone="info" className="absolute start-2 top-2">
                    {p.primary}
                  </Badge>
                )}
                <div className="absolute inset-x-0 bottom-0 flex justify-between gap-1 bg-black/50 p-1.5 opacity-0 transition-opacity group-hover:opacity-100">
                  {!image.isPrimary && (
                    <button
                      type="button"
                      onClick={() => onSetPrimary(image.id)}
                      className="rounded p-1 text-white hover:bg-white/20"
                      title={p.setPrimary}
                    >
                      <Star className="h-4 w-4" />
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => onRemove(image.id)}
                    className="ms-auto rounded p-1 text-white hover:bg-white/20"
                    title={strings.common.delete}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
