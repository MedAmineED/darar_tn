import { randomInt } from 'node:crypto';

/**
 * Human-readable order reference, e.g. "DH-LZ9K3F-482". Collisions are
 * astronomically unlikely; the unique DB constraint is the final safety net.
 */
export function generateOrderNumber(): string {
  const stamp = Date.now().toString(36).toUpperCase();
  const suffix = randomInt(0, 1000).toString().padStart(3, '0');
  return `DH-${stamp}-${suffix}`;
}
