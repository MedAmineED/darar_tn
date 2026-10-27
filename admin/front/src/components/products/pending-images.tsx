'use client';

import { useEffect, useMemo, useRef } from 'react';
import { ImagePlus, Trash2, UploadCloud } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useLocale } from '@/contexts/locale-context';

/**
 * Image picker for a product that does not exist yet: files are kept in
 * memory and uploaded by the create page right after the product is saved.
 * The first image becomes the primary one.
 */
export function PendingImages({
  files,
  onChange,
}: {
  files: File[];
  onChange: (files: File[]) => void;
}) {
  const { strings } = useLocale();
  const p = strings.catalog.products;
  const inputRef = useRef<HTMLInputElement>(null);

  const previews = useMemo(
    () => files.map((file) => URL.createObjectURL(file)),
    [files],
  );
  useEffect(
    () => () => previews.forEach((url) => URL.revokeObjectURL(url)),
    [previews],
  );

  const add = (list: FileList | null) => {
    if (list && list.length > 0) onChange([...files, ...Array.from(list)]);
    if (inputRef.current) inputRef.current.value = '';
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>{p.images}</CardTitle>
        <Button
          type="button"
          variant="secondary"
          size="sm"
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
          onChange={(e) => add(e.target.files)}
        />
      </CardHeader>
      <CardContent>
        {files.length === 0 ? (
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
            {files.map((file, index) => (
              <div
                key={`${file.name}-${file.lastModified}-${index}`}
                className="group relative overflow-hidden rounded-lg border border-outline-variant"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={previews[index]}
                  alt={file.name}
                  className="aspect-square w-full object-cover"
                />
                {index === 0 && (
                  <Badge tone="info" className="absolute start-2 top-2">
                    {p.primary}
                  </Badge>
                )}
                <div className="absolute inset-x-0 bottom-0 flex justify-end bg-black/50 p-1.5 opacity-0 transition-opacity group-hover:opacity-100">
                  <button
                    type="button"
                    onClick={() => onChange(files.filter((_, i) => i !== index))}
                    className="rounded p-1 text-white hover:bg-white/20"
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
