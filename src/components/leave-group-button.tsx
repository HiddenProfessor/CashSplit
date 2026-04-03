"use client";

import { useTransition } from "react";

import { leaveGroupAction } from "@/app/actions/groups";

type LeaveGroupButtonProps = {
  groupId: string;
};

export function LeaveGroupButton({ groupId }: LeaveGroupButtonProps) {
  const [isPending, startTransition] = useTransition();

  function handleClick() {
    if (!confirm("Are you sure you want to leave this group? This cannot be undone.")) {
      return;
    }

    startTransition(() => {
      leaveGroupAction(groupId);
    });
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isPending}
      className="rounded-full border border-danger/30 px-4 py-2 text-sm font-semibold text-danger transition hover:border-danger hover:bg-danger/10 disabled:opacity-50"
    >
      {isPending ? "Leaving…" : "Leave group"}
    </button>
  );
}
