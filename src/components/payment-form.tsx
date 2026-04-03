"use client";

import { useActionState } from "react";

import { recordPaymentAction } from "@/app/actions/groups";
import { SubmitButton } from "@/components/submit-button";
import { EMPTY_FORM_STATE } from "@/lib/form-state";

type PaymentFormProps = {
  groupId: string;
  defaultFromUserId: string;
  members: Array<{
    userId: string;
    name: string;
  }>;
};

export function PaymentForm({ groupId, defaultFromUserId, members }: PaymentFormProps) {
  const action = recordPaymentAction.bind(null, groupId);
  const [state, formAction] = useActionState(action, EMPTY_FORM_STATE);
  const defaultToUserId = members.find((member) => member.userId !== defaultFromUserId)?.userId ?? defaultFromUserId;

  return (
    <form action={formAction} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block space-y-2 text-sm font-medium">
          <span>Amount paid</span>
          <input
            name="amount"
            inputMode="decimal"
            placeholder="249.90"
            className="w-full rounded-2xl border border-line bg-white/80 px-4 py-3 outline-none transition focus:border-accent"
          />
          {state.fieldErrors?.amount ? <p className="text-sm text-danger">{state.fieldErrors.amount[0]}</p> : null}
        </label>

        <label className="block space-y-2 text-sm font-medium">
          <span>Date</span>
          <input
            name="paymentDate"
            type="date"
            defaultValue={new Date().toISOString().slice(0, 10)}
            className="w-full rounded-2xl border border-line bg-white/80 px-4 py-3 outline-none transition focus:border-accent"
          />
          {state.fieldErrors?.paymentDate ? <p className="text-sm text-danger">{state.fieldErrors.paymentDate[0]}</p> : null}
        </label>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block space-y-2 text-sm font-medium">
          <span>Who paid</span>
          <select
            name="fromUserId"
            defaultValue={defaultFromUserId}
            className="w-full rounded-2xl border border-line bg-white/80 px-4 py-3 outline-none transition focus:border-accent"
          >
            {members.map((member) => (
              <option key={member.userId} value={member.userId}>
                {member.name}
              </option>
            ))}
          </select>
          {state.fieldErrors?.fromUserId ? <p className="text-sm text-danger">{state.fieldErrors.fromUserId[0]}</p> : null}
        </label>

        <label className="block space-y-2 text-sm font-medium">
          <span>Who received</span>
          <select
            name="toUserId"
            defaultValue={defaultToUserId}
            className="w-full rounded-2xl border border-line bg-white/80 px-4 py-3 outline-none transition focus:border-accent"
          >
            {members.map((member) => (
              <option key={member.userId} value={member.userId}>
                {member.name}
              </option>
            ))}
          </select>
          {state.fieldErrors?.toUserId ? <p className="text-sm text-danger">{state.fieldErrors.toUserId[0]}</p> : null}
        </label>
      </div>

      <label className="block space-y-2 text-sm font-medium">
        <span>Note</span>
        <textarea
          name="note"
          rows={3}
          placeholder="Optional: Swish transfer for dinner"
          className="w-full rounded-2xl border border-line bg-white/80 px-4 py-3 outline-none transition focus:border-accent"
        />
        {state.fieldErrors?.note ? <p className="text-sm text-danger">{state.fieldErrors.note[0]}</p> : null}
      </label>

      {state.message ? <p className="rounded-2xl bg-accent-soft px-4 py-3 text-sm text-accent-deep">{state.message}</p> : null}

      <SubmitButton label="Record payment" pendingLabel="Recording payment..." tone="secondary" />
    </form>
  );
}
