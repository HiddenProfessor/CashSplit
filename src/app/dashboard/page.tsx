import Link from "next/link";

import { AppShell } from "@/components/app-shell";
import { NewGroupForm } from "@/components/new-group-form";
import { requireUser } from "@/lib/auth";
import { calculateBalances } from "@/lib/balances";
import { describeBalance, formatCurrency } from "@/lib/currency";
import { db } from "@/lib/db";

export default async function DashboardPage() {
  const user = await requireUser();
  const memberships = await db.groupMember.findMany({
    where: { userId: user.id },
    include: {
      group: {
        include: {
          members: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
          expenses: {
            include: {
              shares: {
                select: {
                  userId: true,
                  amountCents: true,
                },
              },
            },
            orderBy: {
              expenseDate: "desc",
            },
          },
          payments: {
            select: {
              amountCents: true,
              fromUserId: true,
              toUserId: true,
            },
          },
        },
      },
    },
    orderBy: {
      joinedAt: "desc",
    },
  });

  const groups = memberships.map(({ group }) => {
    const openExpenses = group.expenses.filter((expense) => expense.settledAt === null);
    const balances = calculateBalances(
      group.members.map((member) => member.userId),
      openExpenses,
      group.payments,
    );
    const currentUserBalance = balances[user.id] ?? 0;
    const totalSpend = group.expenses.reduce((sum, expense) => sum + expense.amountCents, 0);

    return {
      id: group.id,
      name: group.name,
      description: group.description,
      currency: group.currency,
      memberCount: group.members.length,
      expenseCount: openExpenses.length,
      lifetimeExpenseCount: group.expenses.length,
      totalSpend,
      currentUserBalance,
      isSettled: openExpenses.length === 0 && currentUserBalance === 0,
    };
  });

  const overallBalance = groups.reduce((sum, group) => sum + group.currentUserBalance, 0);
  const overallSpend = groups.reduce((sum, group) => sum + group.totalSpend, 0);

  return (
    <AppShell
      user={user}
      eyebrow="Dashboard"
      title="Your groups and live balances"
      subtitle="Create a group, invite people who already have accounts, and keep the running balance clear on the smallest screen first."
    >
      <section className="grid gap-4 xl:grid-cols-[1.05fr_0.95fr] xl:gap-5">
        <div className="grid gap-5">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <article className="glass-panel rounded-[1.5rem] p-4 sm:rounded-[1.75rem] sm:p-5">
              <p className="text-sm text-muted">Groups</p>
              <p className="mt-3 text-3xl font-semibold">{groups.length}</p>
            </article>
            <article className="glass-panel rounded-[1.5rem] p-4 sm:rounded-[1.75rem] sm:p-5">
              <p className="text-sm text-muted">You currently</p>
              <p className="mt-3 text-2xl font-semibold sm:text-3xl">{describeBalance(overallBalance)}</p>
            </article>
            <article className="glass-panel rounded-[1.5rem] p-4 sm:rounded-[1.75rem] sm:p-5 col-span-2 sm:col-span-1">
              <p className="text-sm text-muted">Lifetime tracked spend</p>
              <p className="mt-3 text-3xl font-semibold">{formatCurrency(overallSpend)}</p>
            </article>
          </div>

          <section className="glass-panel rounded-[1.75rem] p-5 sm:rounded-[2rem] sm:p-6">
            <div className="mb-5 flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-accent-deep">Your circles</p>
                <h2 className="mt-3 text-2xl font-semibold">Groups you belong to</h2>
              </div>
            </div>

            <div className="grid gap-4">
              {groups.length === 0 ? (
                <div className="rounded-[1.5rem] border border-dashed border-line-strong bg-white/70 p-6 text-sm leading-7 text-muted">
                  You are not in any groups yet. Create one to start splitting shared expenses.
                </div>
              ) : (
                groups.map((group) => (
                  <Link
                    key={group.id}
                    href={`/groups/${group.id}`}
                    className="rounded-[1.25rem] border border-line bg-white/72 p-4 transition hover:border-line-strong hover:shadow-lg sm:rounded-[1.5rem] sm:p-5"
                  >
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <h3 className="text-xl font-semibold">{group.name}</h3>
                        <p className="mt-2 max-w-xl text-sm leading-6 text-muted">
                          {group.description || "No description yet."}
                        </p>
                      </div>
                      <div className={`rounded-full px-4 py-2 text-sm font-semibold ${group.isSettled ? "bg-success-soft text-success" : "bg-accent-soft text-accent-deep"}`}>
                        {group.isSettled ? "All clear" : describeBalance(group.currentUserBalance, group.currency)}
                      </div>
                    </div>

                    <div className="mt-5 flex flex-wrap gap-3 text-sm text-muted">
                      <span className="rounded-full bg-badge px-3 py-2">{group.memberCount} members</span>
                      <span className="rounded-full bg-badge px-3 py-2">{group.expenseCount} open expenses</span>
                      <span className="rounded-full bg-badge px-3 py-2">{group.lifetimeExpenseCount} total entries</span>
                      <span className="rounded-full bg-badge px-3 py-2">{formatCurrency(group.totalSpend, group.currency)} lifetime tracked</span>
                    </div>
                  </Link>
                ))
              )}
            </div>
          </section>
        </div>

        <NewGroupForm />
      </section>
    </AppShell>
  );
}