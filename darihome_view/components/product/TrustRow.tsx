import type { Dictionary } from '@/lib/i18n/dictionaries';
import { Icon } from '@/components/ui/Icon';

/** Delivery and payment information, placed directly under the buy box. */
export function TrustRow({ dict }: { dict: Dictionary }) {
  const items = [
    {
      icon: 'local_shipping',
      title: dict.product.trustDelivery,
      note: dict.product.trustDeliveryNote,
    },
    {
      icon: 'payments',
      title: dict.product.trustCod,
      note: dict.product.trustCodNote,
    },
  ];

  return (
    <ul className="mt-8 grid grid-cols-1 gap-x-6 gap-y-4 border-t hairline pt-6 sm:grid-cols-2">
      {items.map((item) => (
        <li key={item.title} className="flex items-start gap-3">
          <Icon
            name={item.icon}
            className="!text-[20px] mt-0.5 shrink-0 text-primary"
          />
          <div className="min-w-0">
            <p className="text-sm font-semibold leading-tight">{item.title}</p>
            <p className="mt-0.5 text-xs text-on-surface-variant">
              {item.note}
            </p>
          </div>
        </li>
      ))}
    </ul>
  );
}
