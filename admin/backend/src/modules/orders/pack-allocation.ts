const round2 = (n: number): number => Math.round(n * 100) / 100;

export interface PackComponent {
  productId: string;
  quantity: number;
  unitPrice: number;
}

/**
 * Spreads one pack's special price across its components, proportionally to
 * their regular prices, so the line totals add up to the pack price exactly.
 * The rounding remainder lands on the last line. Returns per-pack totals.
 */
export function allocatePackPrice(
  packPrice: number,
  components: PackComponent[],
): number[] {
  const regular = components.map((c) => c.unitPrice * c.quantity);
  const base = regular.reduce((sum, v) => sum + v, 0);
  const units = components.reduce((sum, c) => sum + c.quantity, 0);
  const weights =
    base > 0
      ? regular.map((v) => v / base)
      : components.map((c) => c.quantity / units);
  let allocated = 0;
  return components.map((_, i) => {
    if (i === components.length - 1) return round2(packPrice - allocated);
    const share = round2(packPrice * weights[i]);
    allocated = round2(allocated + share);
    return share;
  });
}
