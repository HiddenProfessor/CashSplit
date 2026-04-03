const currencyFormatter = new Intl.NumberFormat("sv-SE", {
  style: "currency",
  currency: "SEK",
  maximumFractionDigits: 2,
});

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

export function formatCurrency(amountCents: number) {
  return currencyFormatter.format(amountCents / 100);
}

export function formatDate(value: Date | string) {
  return dateFormatter.format(new Date(value));
}

export function formatDateTime(value: Date | string) {
  return dateTimeFormatter.format(new Date(value));
}

export function describeBalance(amountCents: number) {
  if (amountCents > 0) {
    return `gets back ${formatCurrency(amountCents)}`;
  }

  if (amountCents < 0) {
    return `owes ${formatCurrency(Math.abs(amountCents))}`;
  }

  return "is settled up";
}