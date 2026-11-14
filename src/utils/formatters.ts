export type CurrencyMode = 'MMK' | 'USD';

export function formatPrice(amount: number, currency: CurrencyMode = 'MMK'): string {
  if (currency === 'MMK') {
    return `${Math.round(amount).toLocaleString('en-US')} Ks`;
  }
  return `$${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
