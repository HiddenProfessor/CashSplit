"use client";

import { useTransition } from "react";

import { settleExpensesAction } from "@/app/actions/expenses";

type SettleButtonProps = {
  groupId: string;
};

export function SettleButton({ groupId }: SettleButtonProps) {
  const [isPending, startTransition] = useTransition();

  function handleClick() {
    if (!confirm("Mark all open expenses as settled? They will move to the settled history.")) {
      return;
    }

    startTransition(() => {
      settleExpensesAction(groupId);
    });
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isPending}
      className="w-full rounded-full border border-success/30 bg-success-soft px-4 py-3 text-sm font-semibold text-success transition hover:border-success hover:bg-success/20 disabled:opacity-50"
    >
      {isPending ? "Settling…" : "Mark all open expenses as settled"}
    </button>
  );
}
