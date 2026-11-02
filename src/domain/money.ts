const rupiahNumberFormatter = new Intl.NumberFormat('id-ID', {
  maximumFractionDigits: 0,
});

export function formatRupiahNumber(amount: number): string {
  if (!Number.isFinite(amount)) return '0';
  return rupiahNumberFormatter.format(Math.trunc(amount));
}

export function formatRupiah(amount: number): string {
  return `Rp${formatRupiahNumber(amount)}`;
}

export function parseRupiahInput(raw: string): number | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  if (trimmed.includes('-')) return null;
  // Allow digits and thousand separators (.)
  if (!/^[Rp\s]*[\d.]+$/i.test(trimmed)) return null;
  const digitsOnly = trimmed.replace(/[^\d]/g, '');
  if (!digitsOnly) return null;
  const parsed = Number(digitsOnly);
  if (!Number.isSafeInteger(parsed) || parsed < 0) return null;
  return parsed;
}

export function calculateLineSubtotal(quantity: number, unitPriceRupiah: number): number {
  if (!Number.isInteger(quantity) || quantity <= 0) return 0;
  if (!Number.isInteger(unitPriceRupiah) || unitPriceRupiah < 0) return 0;
  return quantity * unitPriceRupiah;
}

export function calculatePaymentSummary(totalRupiah: number, cashReceivedRupiah: number | null) {
  const validTotal = Number.isInteger(totalRupiah) && totalRupiah > 0;
  const validCash =
    cashReceivedRupiah !== null &&
    Number.isInteger(cashReceivedRupiah) &&
    cashReceivedRupiah >= 0;

  if (!validTotal) {
    return {
      isValidPayment: false,
      changeRupiah: 0,
      shortageRupiah: 0,
      reason: 'Keranjang masih kosong.',
    };
  }

  if (!validCash) {
    return {
      isValidPayment: false,
      changeRupiah: 0,
      shortageRupiah: totalRupiah,
      reason: 'Masukkan nominal uang diterima.',
    };
  }

  if (cashReceivedRupiah < totalRupiah) {
    const shortage = totalRupiah - cashReceivedRupiah;
    return {
      isValidPayment: false,
      changeRupiah: 0,
      shortageRupiah: shortage,
      reason: `Kurang ${formatRupiah(shortage)}`,
    };
  }

  return {
    isValidPayment: true,
    changeRupiah: cashReceivedRupiah - totalRupiah,
    shortageRupiah: 0,
    reason: null,
  };
}

export function formatJakartaDateTime(isoString: string): string {
  try {
    return new Intl.DateTimeFormat('id-ID', {
      timeZone: 'Asia/Jakarta',
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(isoString));
  } catch {
    return isoString;
  }
}

export function formatJakartaTimeOnly(isoString: string): string {
  try {
    return new Intl.DateTimeFormat('id-ID', {
      timeZone: 'Asia/Jakarta',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(isoString));
  } catch {
    return isoString;
  }
}
