type BalanceExpense = {
  amountCents: number;
  paidById: string;
  shares: Array<{
    userId: string;
    amountCents: number;
  }>;
};

type BalancePayment = {
  amountCents: number;
  fromUserId: string;
  toUserId: string;
};

type WeightedShare = {
  userId: string;
  weight: number;
};

export function splitEvenly(amountCents: number, memberCount: number) {
  if (memberCount <= 0) {
    return [];
  }

  const baseShare = Math.floor(amountCents / memberCount);
  const remainder = amountCents % memberCount;

  return Array.from({ length: memberCount }, (_, index) => baseShare + (index < remainder ? 1 : 0));
}

export function splitByWeights(amountCents: number, shares: WeightedShare[]) {
  const totalWeight = shares.reduce((sum, share) => sum + share.weight, 0);

  if (totalWeight <= 0 || shares.length === 0) {
    return [] as Array<{ userId: string; amountCents: number }>;
  }

  const baseAllocations = shares.map((share) => {
    const exact = (amountCents * share.weight) / totalWeight;
    const amount = Math.floor(exact);

    return {
      userId: share.userId,
      amountCents: amount,
      remainder: exact - amount,
    };
  });

  let remainderCents = amountCents - baseAllocations.reduce((sum, share) => sum + share.amountCents, 0);

  const sortedByRemainder = [...baseAllocations].sort((left, right) => {
    if (right.remainder === left.remainder) {
      return left.userId.localeCompare(right.userId);
    }

    return right.remainder - left.remainder;
  });

  for (let index = 0; index < sortedByRemainder.length && remainderCents > 0; index += 1) {
    sortedByRemainder[index]!.amountCents += 1;
    remainderCents -= 1;
  }

  const byUserId = new Map(sortedByRemainder.map((share) => [share.userId, share.amountCents]));

  return shares.map((share) => ({
    userId: share.userId,
    amountCents: byUserId.get(share.userId) ?? 0,
  }));
}

export function calculateBalances(
  memberIds: string[],
  expenses: BalanceExpense[],
  payments: BalancePayment[] = [],
) {
  const balances = Object.fromEntries(memberIds.map((memberId) => [memberId, 0]));

  for (const expense of expenses) {
    balances[expense.paidById] = (balances[expense.paidById] ?? 0) + expense.amountCents;

    for (const share of expense.shares) {
      balances[share.userId] = (balances[share.userId] ?? 0) - share.amountCents;
    }
  }

  for (const payment of payments) {
    balances[payment.fromUserId] = (balances[payment.fromUserId] ?? 0) + payment.amountCents;
    balances[payment.toUserId] = (balances[payment.toUserId] ?? 0) - payment.amountCents;
  }

  return balances;
}

export function buildSettlementPlan(
  balances: Array<{
    userId: string;
    name: string;
    balanceCents: number;
  }>,
) {
  const creditors = balances
    .filter((entry) => entry.balanceCents > 0)
    .map((entry) => ({ ...entry }))
    .sort((left, right) => right.balanceCents - left.balanceCents);

  const debtors = balances
    .filter((entry) => entry.balanceCents < 0)
    .map((entry) => ({ ...entry, balanceCents: Math.abs(entry.balanceCents) }))
    .sort((left, right) => right.balanceCents - left.balanceCents);

  const settlements: Array<{
    from: string;
    to: string;
    amountCents: number;
  }> = [];

  let creditorIndex = 0;
  let debtorIndex = 0;

  while (creditorIndex < creditors.length && debtorIndex < debtors.length) {
    const creditor = creditors[creditorIndex];
    const debtor = debtors[debtorIndex];
    const transferAmount = Math.min(creditor.balanceCents, debtor.balanceCents);

    settlements.push({
      from: debtor.name,
      to: creditor.name,
      amountCents: transferAmount,
    });

    creditor.balanceCents -= transferAmount;
    debtor.balanceCents -= transferAmount;

    if (creditor.balanceCents === 0) {
      creditorIndex += 1;
    }

    if (debtor.balanceCents === 0) {
      debtorIndex += 1;
    }
  }

  return settlements;
}