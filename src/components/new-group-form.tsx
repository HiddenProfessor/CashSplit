"use client";

import { useActionState } from "react";

import { createGroupAction } from "@/app/actions/groups";
import { EMPTY_FORM_STATE } from "@/lib/form-state";
import { SubmitButton } from "@/components/submit-button";

export function NewGroupForm() {
  const [state, formAction] = useActionState(createGroupAction, EMPTY_FORM_STATE);

  return (
    <section className="glass-panel rounded-[1.75rem] p-5 sm:rounded-[2rem] sm:p-6">
      <div className="mb-5">
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-accent-deep">New group</p>
        <h2 className="mt-3 text-2xl font-semibold">Create a split circle</h2>
        <p className="mt-2 text-sm leading-6 text-muted">Add email addresses separated by commas or new lines. Everyone listed here needs an account already.</p>
      </div>

      <form action={formAction} className="space-y-4">
        <label className="block space-y-2 text-sm font-medium">
          <span>Group name</span>
          <input name="name" placeholder="Wedding planning" className="w-full rounded-2xl border border-line bg-white/80 px-4 py-3 outline-none transition focus:border-accent" />
          {state.fieldErrors?.name ? <p className="text-sm text-danger">{state.fieldErrors.name[0]}</p> : null}
        </label>

        <label className="block space-y-2 text-sm font-medium">
          <span>Description</span>
          <textarea name="description" rows={3} placeholder="Venue, flowers, dinners, transport, and the rest." className="w-full rounded-2xl border border-line bg-white/80 px-4 py-3 outline-none transition focus:border-accent" />
          {state.fieldErrors?.description ? <p className="text-sm text-danger">{state.fieldErrors.description[0]}</p> : null}
        </label>

        <label className="block space-y-2 text-sm font-medium">
          <span>Member emails</span>
          <textarea name="memberEmails" rows={4} placeholder={"oscar@example.com\nlinda@example.com"} className="w-full rounded-2xl border border-line bg-white/80 px-4 py-3 outline-none transition focus:border-accent" />
          {state.fieldErrors?.memberEmails ? <p className="text-sm text-danger">{state.fieldErrors.memberEmails[0]}</p> : null}
        </label>

        {state.message ? <p className="rounded-2xl bg-accent-soft px-4 py-3 text-sm text-accent-deep">{state.message}</p> : null}

        <SubmitButton label="Create group" pendingLabel="Creating group..." />
      </form>
    </section>
  );
}