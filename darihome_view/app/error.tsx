'use client';

import { useEffect, useState } from 'react';

/**
 * Global error boundary. Never surfaces raw backend errors to customers — it
 * shows a friendly, localized message and a retry.
 */
export default function Error({ reset }: { error: Error; reset: () => void }) {
  const [isFr, setIsFr] = useState(false);
  useEffect(() => {
    setIsFr(document.documentElement.lang === 'fr');
  }, []);

  const title = isFr ? 'Une erreur est survenue' : 'حدث خطأ ما';
  const body = isFr
    ? 'Quelque chose s’est mal passé. Veuillez réessayer.'
    : 'حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى.';
  const retry = isFr ? 'Réessayer' : 'إعادة المحاولة';

  return (
    <main className="max-w-container mx-auto px-5 md:px-16 pt-32 pb-24 min-h-[60vh] grid place-items-center text-center">
      <div>
        <h1 className="font-display text-3xl md:text-4xl font-semibold text-primary">
          {title}
        </h1>
        <p className="text-on-surface-variant mt-3 max-w-md mx-auto">{body}</p>
        <button
          type="button"
          onClick={reset}
          className="btn btn-primary px-8 py-4 text-sm mt-8"
        >
          {retry}
        </button>
      </div>
    </main>
  );
}
