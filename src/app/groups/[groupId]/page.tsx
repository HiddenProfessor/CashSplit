import { notFound } from "next/navigation";

import { AppShell } from "@/components/app-shell";
import { ExpenseForm } from "@/components/expense-form";
import { LeaveGroupButton } from "@/components/leave-group-button";
import { PaymentForm } from "@/components/payment-form";
import { SettleButton } from "@/components/settle-button";
import { buildSettlementPlan, calculateBalances } from "@/lib/balances";
import { requireUser } from "@/lib/auth";
import { describeBalance, formatCurrency, formatDate } from "@/lib/currency";
import { db } from "@/lib/db";

type GroupPageProps = {
  params: Promise<{
    groupId: string;
  }>;
};

export default async function GroupPage({ params }: GroupPageProps) {
  const { groupId } = await params;
  const user = await requireUser();
  const group = await db.group.findFirst({
    where: {
      id: groupId,
      members: {
        some: {
          userId: user.id,
        },
      },
    },
    include: {
      members: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              username: true,
            },
          },
        },
        orderBy: {
          joinedAt: "asc",
        },
      },
      expenses: {
        include: {
          paidBy: {
            select: {
              id: true,
              name: true,
            },
          },
          shares: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
        },
        orderBy: [
          {
            expenseDate: "desc",
          },
          {
            createdAt: "desc",
          },
        ],
      },
      payments: {
        include: {
          fromUser: {
            select: {
              id: true,
              name: true,
            },
          },
          toUser: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: [
          {
            paymentDate: "desc",
          },
          {
            createdAt: "desc",
          },
        ],
      },
    },
  });

  if (!group) {
    notFound();
  }

  const openExpenses = group.expenses.filter((expense) => expense.settledAt === null);
  const settledExpenses = group.expenses.filter((expense) => expense.settledAt !== null);

  const balanceMap = calculateBalances(
    group.members.map((member) => member.userId),
    openExpenses,
    group.payments,
  );
  const memberBalances = group.members.map((member) => ({
    userId: member.userId,
    name: member.user.name,
    username: member.user.username,
    balanceCents: balanceMap[member.userId] ?? 0,
  }));
  const settlements = buildSettlementPlan(memberBalances);
  const openSpend = openExpenses.reduce((sum, expense) => sum + expense.amountCents, 0);
  const settledTotal = settledExpenses.reduce((sum, expense) => sum + expense.amountCents, 0);

  return (
    <AppShell
      user={user}
      eyebrow="Group detail"
      title={group.name}
      subtitle={group.description || "Every new expense is split equally across current group members, and direct payments reduce debt without wiping history."}
      backHref="/dashboard"
      backLabel="Back to dashboard"
    >
      <section className="grid gap-4 xl:grid-cols-[0.92fr_1.08fr] xl:gap-5">
        <div className="grid gap-5 self-start">
          <div className="grid grid-cols-2 gap-3 xl:grid-cols-1">
            <article className="glass-panel rounded-[1.5rem] p-4 sm:rounded-[1.75rem] sm:p-5">
              <p className="text-sm text-muted">Members</p>
              <p className="mt-3 text-3xl font-semibold">{group.members.length}</p>
            </article>
            <article className="glass-panel rounded-[1.5rem] p-4 sm:rounded-[1.75rem] sm:p-5">
              <p className="text-sm text-muted">Open expenses</p>
              <p className="mt-3 text-3xl font-semibold">{openExpenses.length}</p>
            </article>
            <article className="glass-panel rounded-[1.5rem] p-4 sm:rounded-[1.75rem] sm:p-5 col-span-2 xl:col-span-1">
              <p className="text-sm text-muted">Open balance pool</p>
              <p className="mt-3 text-3xl font-semibold">{formatCurrency(openSpend, group.currency)}</p>
            </article>
          </div>

          <ExpenseForm
            groupId={group.id}
            defaultPayerId={user.id}
            groupCurrency={group.currency}
            members={group.members.map((member) => ({
              userId: member.userId,
              name: member.user.name,
            }))}
          />

          <section className="glass-panel rounded-[1.75rem] p-5 sm:rounded-[2rem] sm:p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-accent-deep">Balances</p>
            <h2 className="mt-3 text-2xl font-semibold">Who is up and who owes</h2>
            <p className="mt-2 text-sm leading-6 text-muted">These numbers include open expenses and all recorded payments.</p>

            <div className="mt-5 grid gap-3">
              {memberBalances.map((member) => (
                <article key={member.userId} className="flex flex-col gap-3 rounded-[1.25rem] border border-line bg-white/72 p-4 sm:rounded-[1.5rem] sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="font-semibold">{member.name}</p>
                    <p className="text-sm text-muted">@{member.username}</p>
                  </div>
                  <div className={`rounded-full px-4 py-2 text-sm font-semibold ${member.balanceCents >= 0 ? "bg-success-soft text-success" : "bg-danger-soft text-danger"}`}>
                    {describeBalance(member.balanceCents, group.currency)}
                  </div>
                </article>
              ))}
            </div>
          </section>

          <section className="glass-panel rounded-[1.75rem] p-5 sm:rounded-[2rem] sm:p-6">
            <details>
              <summary className="flex list-none cursor-pointer items-center justify-between rounded-full border border-line-strong bg-white/80 px-4 py-3 text-sm font-semibold text-foreground transition hover:border-foreground [&::-webkit-details-marker]:hidden">
                <span>Open settle up tools</span>
                <span className="text-xs uppercase tracking-[0.16em] text-muted">{settlements.length} suggestions</span>
              </summary>

              <div className="mt-5">
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-accent-deep">Settle up</p>
                <h2 className="mt-3 text-2xl font-semibold">Shortest repayment plan</h2>

                <div className="mt-5 grid gap-3">
                  {settlements.length === 0 ? (
                    <div className="rounded-[1.5rem] border border-dashed border-line-strong bg-white/72 p-4 text-sm text-muted">
                      Everyone is settled right now.
                    </div>
                  ) : (
                    settlements.map((settlement) => (
                      <article key={`${settlement.from}-${settlement.to}-${settlement.amountCents}`} className="rounded-[1.5rem] border border-line bg-white/72 p-4 text-sm leading-7">
                        <span className="font-semibold">{settlement.from}</span> pays <span className="font-semibold">{settlement.to}</span> <span className="font-semibold text-accent-deep">{formatCurrency(settlement.amountCents, group.currency)}</span>
                      </article>
                    ))
                  )}
                </div>

                {openExpenses.length > 0 ? (
                  <div className="mt-5">
                    <SettleButton groupId={group.id} />
                  </div>
                ) : null}

                <div className="mt-6 border-t border-line pt-5">
                  <p className="mb-4 text-sm leading-6 text-muted">
                    Record a real payment whenever money changes hands. This updates balances immediately and keeps a traceable history.
                  </p>
                  <PaymentForm
                    groupId={group.id}
                    defaultFromUserId={user.id}
                    members={group.members.map((member) => ({
                      userId: member.userId,
                      name: member.user.name,
                    }))}
                  />
                </div>
              </div>
            </details>
          </section>

          {/* Group management */}
          <section className="glass-panel rounded-[1.75rem] p-5 sm:rounded-[2rem] sm:p-6">
            <details>
              <summary className="flex list-none cursor-pointer items-center justify-between rounded-full border border-line-strong bg-white/80 px-4 py-3 text-sm font-semibold text-foreground transition hover:border-foreground [&::-webkit-details-marker]:hidden">
                <span>Group settings</span>
              </summary>
              <div className="mt-5 flex flex-col gap-4">
                <p className="text-sm text-muted">Leaving a group removes you from future expenses. If you are the last member, the group and all its data will be deleted.</p>
                <LeaveGroupButton groupId={group.id} />
              </div>
            </details>
          </section>
        </div>

        <section className="glass-panel rounded-[1.75rem] p-5 sm:rounded-[2rem] sm:p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-accent-deep">Expense feed</p>
          <h2 className="mt-3 text-2xl font-semibold">Current spending</h2>

          <div className="mt-5 grid gap-5">
            {/* Open expenses — always visible */}
            <section>
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-lg font-semibold">Open expenses</h3>
                <span className="rounded-full bg-badge px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-muted">
                  {openExpenses.length}
                </span>
              </div>

              <div className="mt-4 grid gap-4">
                {openExpenses.length === 0 ? (
                  <div className="rounded-[1.5rem] border border-dashed border-line-strong bg-white/72 p-6 text-sm leading-7 text-muted">
                    No open expenses. If everyone has paid each other back, this group is clear for the next round.
                  </div>
                ) : (
                  openExpenses.map((expense) => (
                    <article key={expense.id} className="rounded-[1.25rem] border border-line bg-white/72 p-4 sm:rounded-[1.5rem] sm:p-5">
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <div className="flex flex-wrap items-center gap-3">
                            <h3 className="text-xl font-semibold">{expense.title}</h3>
                            <span className="rounded-full bg-badge px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-muted">
                              {formatDate(expense.expenseDate)}
                            </span>
                          </div>
                          <p className="mt-2 text-sm leading-6 text-muted">
                            Paid by {expense.paidBy.name}
                            {expense.notes ? ` · ${expense.notes}` : ""}
                          </p>
                        </div>
                        <div className="rounded-full bg-accent-soft px-4 py-2 text-sm font-semibold text-accent-deep">
                          {formatCurrency(expense.amountCents, group.currency)}
                        </div>
                      </div>

                      <div className="mt-4 flex flex-wrap gap-2 text-sm text-muted">
                        {expense.shares.map((share) => (
                          <span key={share.id} className="rounded-full border border-line bg-white/70 px-3 py-2">
                            {share.user.name}: {formatCurrency(share.amountCents, group.currency)}
                          </span>
                        ))}
                      </div>
                    </article>
                  ))
                )}
              </div>
            </section>

            {/* Settled expenses — collapsed, compact */}
            {settledExpenses.length > 0 ? (
              <section className="border-t border-line pt-5">
                <details>
                  <summary className="flex list-none cursor-pointer items-center justify-between rounded-full border border-line bg-white/70 px-4 py-2.5 text-sm text-muted transition hover:border-line-strong [&::-webkit-details-marker]:hidden">
                    <span>{settledExpenses.length} settled expense{settledExpenses.length !== 1 ? "s" : ""}</span>
                    <span>{formatCurrency(settledTotal, group.currency)}</span>
                  </summary>
                  <div className="mt-3 grid gap-2">
                    {settledExpenses.map((expense) => (
                      <div key={expense.id} className="flex items-center justify-between gap-3 rounded-xl border border-line/60 bg-white/50 px-4 py-2.5 text-sm text-muted">
                        <div className="flex items-center gap-2 overflow-hidden">
                          <span className="truncate font-medium">{expense.title}</span>
                          <span className="shrink-0 text-xs">{formatDate(expense.expenseDate)}</span>
                        </div>
                        <span className="shrink-0 font-medium">{formatCurrency(expense.amountCents, group.currency)}</span>
                      </div>
                    ))}
                  </div>
                </details>
              </section>
            ) : null}

            {/* Payment history — collapsed, compact */}
            <section className="border-t border-line pt-5">
              <details>
                <summary className="flex list-none cursor-pointer items-center justify-between rounded-full border border-line bg-white/70 px-4 py-2.5 text-sm text-muted transition hover:border-line-strong [&::-webkit-details-marker]:hidden">
                  <span>Payment history</span>
                  <span>{group.payments.length} payment{group.payments.length !== 1 ? "s" : ""}</span>
                </summary>
                <div className="mt-3 grid gap-2">
                  {group.payments.length === 0 ? (
                    <p className="px-4 py-3 text-sm text-muted">No payments recorded yet.</p>
                  ) : (
                    group.payments.map((payment) => (
                      <div key={payment.id} className="flex items-center justify-between gap-3 rounded-xl border border-line/60 bg-white/50 px-4 py-2.5 text-sm text-muted">
                        <div className="flex items-center gap-2 overflow-hidden">
                          <span className="truncate font-medium">{payment.fromUser.name} &rarr; {payment.toUser.name}</span>
                          <span className="shrink-0 text-xs">{formatDate(payment.paymentDate)}</span>
                        </div>
                        <span className="shrink-0 font-medium text-success">{formatCurrency(payment.amountCents, group.currency)}</span>
                      </div>
                    ))
                  )}
                </div>
              </details>
            </section>

          </div>
        </section>
      </section>
    </AppShell>
  );
}