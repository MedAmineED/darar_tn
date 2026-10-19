/**
 * Shop route loading skeleton. Scoped to /shop (not the root) so that a
 * missing product page can still return a proper 404 status rather than a
 * soft-404 caused by an early-streamed loading shell.
 */
export default function ShopLoading() {
  return (
    <main className="max-w-container mx-auto px-5 md:px-16 pt-24 lg:pt-28 pb-20">
      <div className="h-10 w-56 rounded bg-surface-high animate-pulse" />
      <div className="mt-8 flex gap-10 lg:gap-14">
        <div className="hidden lg:block w-64 shrink-0 space-y-4">
          <div className="h-40 rounded bg-surface-high animate-pulse" />
          <div className="h-40 rounded bg-surface-high animate-pulse" />
        </div>
        <div className="flex-1 grid grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="rounded-lg overflow-hidden bg-white">
              <div className="aspect-square bg-surface-high animate-pulse" />
              <div className="p-4 space-y-2">
                <div className="h-4 w-3/4 rounded bg-surface-high animate-pulse" />
                <div className="h-3 w-1/3 rounded bg-surface-high animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
