const formatterCache = new Map<string, Intl.NumberFormat>();

function getCurrencyFormatter(currency: string) {
  let formatter = formatterCache.get(currency);

  if (!formatter) {
    formatter = new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      maximumFractionDigits: 2,
    });
    formatterCache.set(currency, formatter);
  }

  return formatter;
}

const dateFormatter = new Intl.DateTimeFormat("sv-SE", {
  year: "numeric",
  month: "short",
  day: "numeric",
});

const dateTimeFormatter = new Intl.DateTimeFormat("sv-SE", {
  year: "numeric",
  month: "short",
  day: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

export function formatCurrency(amountCents: number, currency = "SEK") {
  return getCurrencyFormatter(currency).format(amountCents / 100);
}

export function formatDate(value: Date | string) {
  return dateFormatter.format(new Date(value));
}

export function formatDateTime(value: Date | string) {
  return dateTimeFormatter.format(new Date(value));
}

export function describeBalance(amountCents: number, currency = "SEK") {
  if (amountCents > 0) {
    return `gets back ${formatCurrency(amountCents, currency)}`;
  }

  if (amountCents < 0) {
    return `owes ${formatCurrency(Math.abs(amountCents), currency)}`;
  }

  return "is settled up";
}

export const SUPPORTED_CURRENCIES = [
  "SEK", "EUR", "USD", "GBP", "NOK", "DKK", "CHF", "JPY",
  "CAD", "AUD", "PLN", "CZK", "HUF", "THB", "BRL", "INR",
] as const;