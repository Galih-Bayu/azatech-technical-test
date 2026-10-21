/**
 * Format a number into Indonesian Rupiah (e.g. Rp 12.000).
 */
export function formatRupiah(amount: number | string | null | undefined): string {
  if (amount === null || amount === undefined || isNaN(Number(amount))) {
    return 'Rp 0';
  }
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Number(amount));
}

/**
 * Format date string into Indonesian readable date (e.g. 22 Oktober 2026, 14:30).
 */
export function formatDate(dateString: string | null | undefined, includeTime = false): string {
  if (!dateString) return '-';
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;

    const options: Intl.DateTimeFormatOptions = {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      ...(includeTime ? { hour: '2-digit', minute: '2-digit' } : {}),
    };

    return new Intl.DateTimeFormat('id-ID', options).format(date);
  } catch {
    return dateString;
  }
}

/**
 * Utility to conditionally merge CSS classes.
 */
export function cn(...classes: (string | boolean | undefined | null)[]): string {
  return classes.filter(Boolean).join(' ');
}
