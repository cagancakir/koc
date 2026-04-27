export const ORDER_GAP_MIN = 0.001;
export const ORDER_STEP = 1.0;

export function midpoint(prev: number | null, next: number | null): number {
  if (prev === null && next === null) return ORDER_STEP;
  if (prev === null && next !== null) return next / 2;
  if (prev !== null && next === null) return prev + ORDER_STEP;
  return (prev! + next!) / 2;
}

export function needsRebalance(prev: number | null, next: number | null): boolean {
  if (prev === null || next === null) return false;
  return Math.abs(next - prev) < ORDER_GAP_MIN;
}

export function rebalancedOrders(count: number): number[] {
  return Array.from({ length: count }, (_, i) => (i + 1) * ORDER_STEP);
}
