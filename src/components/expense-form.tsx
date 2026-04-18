"use client";

import { useMemo, useState } from "react";
import { useActionState } from "react";

import { createExpenseAction } from "@/app/actions/expenses";
import { SUPPORTED_CURRENCIES } from "@/lib/currency";
import { EMPTY_FORM_STATE } from "@/lib/form-state";
import { SubmitButton } from "@/components/submit-button";

const PERCENT_STEP = 0.5;
const TOTAL_PERCENT = 100;

type RawAllocation = {
  userId: string;
  rawPercent: number;
};

function allocateToStep(totalPercent: number, allocations: RawAllocation[]) {
  const totalUnits = Math.round(totalPercent / PERCENT_STEP);
  const withUnits = allocations.map((allocation) => {
    const rawUnits = allocation.rawPercent / PERCENT_STEP;
    const units = Math.floor(rawUnits);

    return {
      userId: allocation.userId,
      units,
      remainder: rawUnits - units,
    };
  });

  let remainderUnits = totalUnits - withUnits.reduce((sum, allocation) => sum + allocation.units, 0);

  const sorted = [...withUnits].sort((left, right) => {
    if (right.remainder === left.remainder) {
      return left.userId.localeCompare(right.userId);
    }

    return right.remainder - left.remainder;
  });

  for (let index = 0; index < sorted.length && remainderUnits > 0; index += 1) {
    sorted[index]!.units += 1;
    remainderUnits -= 1;
  }

  return Object.fromEntries(sorted.map((allocation) => [allocation.userId, allocation.units * PERCENT_STEP]));
}

function buildInitialShares(memberIds: string[]) {
  const equalRaw = memberIds.map((userId) => ({
    userId,
    rawPercent: TOTAL_PERCENT / memberIds.length,
  }));

  return allocateToStep(TOTAL_PERCENT, equalRaw);
}

type ExpenseFormProps = {
  groupId: string;
  members: Array<{
    userId: string;
    name: string;
  }>;
  defaultPayerId: string;
  groupCurrency: string;
};

export function ExpenseForm({ groupId, members, defaultPayerId, groupCurrency }: ExpenseFormProps) {
  const action = createExpenseAction.bind(null, groupId);
  const [state, formAction] = useActionState(action, EMPTY_FORM_STATE);
  const [paidById, setPaidById] = useState(defaultPayerId);
  const [expenseCurrency, setExpenseCurrency] = useState(groupCurrency);
  const [splitMode, setSplitMode] = useState<"equal" | "preset" | "custom">("equal");
  const [preset, setPreset] = useState<"25-75" | "50-50" | "75-25">("50-50");
  const [customShares, setCustomShares] = useState<Record<string, number>>(() =>
    buildInitialShares(members.map((member) => member.userId)),
  );

  const isTwoPersonGroup = members.length === 2;

  const splitSharesPayload = useMemo(() => {
    if (splitMode === "equal") {
      return "";
    }

    if (splitMode === "preset" && isTwoPersonGroup) {
      const payer = paidById;
      const other = members.find((member) => member.userId !== payer);

      if (!other) {
        return "";
      }

      const [payerPercent, otherPercent] = preset.split("-").map((entry) => Number(entry));

      return JSON.stringify([
        { userId: payer, percentage: payerPercent },
        { userId: other.userId, percentage: otherPercent },
      ]);
    }

    return JSON.stringify(
      members.map((member) => ({
        userId: member.userId,
        percentage: Number(customShares[member.userId] ?? 0),
      })),
    );
  }, [customShares, isTwoPersonGroup, members, paidById, preset, splitMode]);

  const customShareTotal = useMemo(
    () => members.reduce((sum, member) => sum + Number(customShares[member.userId] ?? 0), 0),
    [customShares, members],
  );

  function updateCustomShare(changedUserId: string, nextValue: number) {
    setCustomShares((previous) => {
      const clampedValue = Math.max(0, Math.min(TOTAL_PERCENT, nextValue));
      const otherMembers = members.filter((member) => member.userId !== changedUserId);

      if (otherMembers.length === 0) {
        return { [changedUserId]: TOTAL_PERCENT };
      }

      const remaining = TOTAL_PERCENT - clampedValue;
      const previousOtherTotal = otherMembers.reduce(
        (sum, member) => sum + Number(previous[member.userId] ?? 0),
        0,
      );

      const rawOtherAllocations =
        previousOtherTotal > 0
          ? otherMembers.map((member) => ({
              userId: member.userId,
              rawPercent: ((Number(previous[member.userId] ?? 0) / previousOtherTotal) * remaining),
            }))
          : otherMembers.map((member) => ({
              userId: member.userId,
              rawPercent: remaining / otherMembers.length,
            }));

      const normalizedOthers = allocateToStep(remaining, rawOtherAllocations);

      return {
        ...normalizedOthers,
        [changedUserId]: clampedValue,
      };
    });
  }

  return (
    <section className="glass-panel rounded-[1.75rem] p-5 sm:rounded-[2rem] sm:p-6">
      <div className="mb-5">
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-accent-deep">Log expense</p>
        <h2 className="mt-3 text-2xl font-semibold">Add something the group shared</h2>
        <p className="mt-2 text-sm leading-6 text-muted">CashSplit divides the cost equally across everyone who is currently in the group.</p>
      </div>

      <form action={formAction} className="space-y-4">
        <label className="block space-y-2 text-sm font-medium">
          <span>What was paid?</span>
          <input name="title" placeholder="Dinner at Babette" className="w-full rounded-2xl border border-line bg-white/80 px-4 py-3 outline-none transition focus:border-accent" />
          {state.fieldErrors?.title ? <p className="text-sm text-danger">{state.fieldErrors.title[0]}</p> : null}
        </label>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block space-y-2 text-sm font-medium">
            <span>Amount</span>
            <input name="amount" inputMode="decimal" placeholder="249.90" className="w-full rounded-2xl border border-line bg-white/80 px-4 py-3 outline-none transition focus:border-accent" />
            {state.fieldErrors?.amount ? <p className="text-sm text-danger">{state.fieldErrors.amount[0]}</p> : null}
          </label>

          <label className="block space-y-2 text-sm font-medium">
            <span>Date</span>
            <input name="expenseDate" type="date" defaultValue={new Date().toISOString().slice(0, 10)} className="w-full rounded-2xl border border-line bg-white/80 px-4 py-3 outline-none transition focus:border-accent" />
            {state.fieldErrors?.expenseDate ? <p className="text-sm text-danger">{state.fieldErrors.expenseDate[0]}</p> : null}
          </label>
        </div>

        <div className={`grid gap-4 ${expenseCurrency !== groupCurrency ? "sm:grid-cols-2" : ""}`}>
          <label className="block space-y-2 text-sm font-medium">
            <span>Currency</span>
            <select
              name="expenseCurrency"
              value={expenseCurrency}
              onChange={(event) => setExpenseCurrency(event.currentTarget.value)}
              className="w-full rounded-2xl border border-line bg-white/80 px-4 py-3 outline-none transition focus:border-accent"
            >
              {SUPPORTED_CURRENCIES.map((code) => (
                <option key={code} value={code}>{code}</option>
              ))}
            </select>
          </label>

          {expenseCurrency !== groupCurrency ? (
            <label className="block space-y-2 text-sm font-medium">
              <span>Exchange rate (1 {expenseCurrency} = ? {groupCurrency})</span>
              <input name="exchangeRate" inputMode="decimal" placeholder="1.00" defaultValue="1" className="w-full rounded-2xl border border-line bg-white/80 px-4 py-3 outline-none transition focus:border-accent" />
              {state.fieldErrors?.exchangeRate ? <p className="text-sm text-danger">{state.fieldErrors.exchangeRate[0]}</p> : null}
            </label>
          ) : null}
        </div>

        <label className="block space-y-2 text-sm font-medium">
          <span>Who paid?</span>
          <select
            name="paidById"
            defaultValue={defaultPayerId}
            onChange={(event) => setPaidById(event.currentTarget.value)}
            className="w-full rounded-2xl border border-line bg-white/80 px-4 py-3 outline-none transition focus:border-accent"
          >
            {members.map((member) => (
              <option key={member.userId} value={member.userId}>
                {member.name}
              </option>
            ))}
          </select>
          {state.fieldErrors?.paidById ? <p className="text-sm text-danger">{state.fieldErrors.paidById[0]}</p> : null}
        </label>

        <section className="rounded-2xl border border-line bg-white/70 p-4">
          <p className="text-sm font-semibold">Split mode</p>
          <p className="mt-1 text-sm text-muted">Default is equal split across everyone in this group.</p>

          <div className="mt-3 grid gap-2 sm:grid-cols-3">
            {[
              { key: "equal", label: "Equal" },
              { key: "preset", label: "Preset %" },
              { key: "custom", label: "Custom slider" },
            ].map((mode) => (
              <button
                key={mode.key}
                type="button"
                onClick={() => setSplitMode(mode.key as "equal" | "preset" | "custom")}
                className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${
                  splitMode === mode.key
                    ? "border-accent bg-accent-soft text-accent-deep"
                    : "border-line-strong bg-white/80 text-foreground"
                }`}
              >
                {mode.label}
              </button>
            ))}
          </div>

          {splitMode === "preset" ? (
            <div className="mt-4 space-y-3">
              {!isTwoPersonGroup ? (
                <p className="text-sm text-muted">Preset percentages are available for 2-person groups only. Use equal or custom for larger groups.</p>
              ) : (
                <>
                  <p className="text-sm text-muted">Order follows payer first, then the other member.</p>
                  <div className="flex flex-wrap gap-2">
                    {(["25-75", "50-50", "75-25"] as const).map((presetOption) => (
                      <button
                        key={presetOption}
                        type="button"
                        onClick={() => setPreset(presetOption)}
                        className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${
                          preset === presetOption
                            ? "border-accent bg-accent-soft text-accent-deep"
                            : "border-line-strong bg-white/80 text-foreground"
                        }`}
                      >
                        {presetOption}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          ) : null}

          {splitMode === "custom" ? (
            <div className="mt-4 space-y-4">
              {members.map((member) => {
                const value = Number(customShares[member.userId] ?? 0);

                return (
                  <label key={member.userId} className="block space-y-2 text-sm font-medium">
                    <span>{member.name}: {value.toFixed(1)}%</span>
                    <input
                      type="range"
                      min={0}
                      max={100}
                      step={0.5}
                      value={value}
                      onChange={(event) => {
                        const nextValue = Number(event.currentTarget.value);
                        updateCustomShare(member.userId, nextValue);
                      }}
                      className="w-full"
                    />
                  </label>
                );
              })}
              <p className="text-sm text-success">
                Total: {customShareTotal.toFixed(1)}%
              </p>
              <p className="text-sm text-muted">The other sliders auto-adjust so the total always stays at 100%.</p>
            </div>
          ) : null}
        </section>

        <input type="hidden" name="splitMode" value={splitMode} />
        <input type="hidden" name="splitShares" value={splitSharesPayload} />

        <label className="block space-y-2 text-sm font-medium">
          <span>Notes</span>
          <textarea name="notes" rows={3} placeholder="Optional context, like what was included." className="w-full rounded-2xl border border-line bg-white/80 px-4 py-3 outline-none transition focus:border-accent" />
          {state.fieldErrors?.notes ? <p className="text-sm text-danger">{state.fieldErrors.notes[0]}</p> : null}
        </label>

        {state.message ? <p className="rounded-2xl bg-accent-soft px-4 py-3 text-sm text-accent-deep">{state.message}</p> : null}

        <SubmitButton label="Save expense" pendingLabel="Saving expense..." />
      </form>
    </section>
  );
}