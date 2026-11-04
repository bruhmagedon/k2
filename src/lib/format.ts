const numberFormat = new Intl.NumberFormat("ru-RU", { maximumFractionDigits: 4 });

export function format(value: number): string {
  if (!Number.isFinite(value)) {
    return "∞";
  }
  if (value !== 0 && Math.abs(value) < 0.0001) {
    return value.toExponential(2);
  }
  return numberFormat.format(value);
}
