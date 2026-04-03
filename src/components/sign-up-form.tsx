"use client";

import { useActionState } from "react";

import { signupAction } from "@/app/actions/auth";
import { EMPTY_FORM_STATE } from "@/lib/form-state";
import { SubmitButton } from "@/components/submit-button";

export function SignUpForm() {
  const [state, formAction] = useActionState(signupAction, EMPTY_FORM_STATE);

  return (
    <section className="rise-in glass-panel rounded-[1.75rem] p-5 sm:rounded-[2rem] sm:p-7">
      <div className="mb-5">
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-accent-deep">Create account</p>
        <h2 className="mt-3 text-2xl font-semibold">Start a new shared ledger</h2>
        <p className="mt-2 text-sm leading-6 text-muted">Create your account, log in, and start a clean shared ledger with the people you split things with.</p>
      </div>

      <form action={formAction} className="space-y-4">
        <label className="block space-y-2 text-sm font-medium">
          <span>Name</span>
          <input name="name" placeholder="Lovisa Andersson" className="w-full rounded-2xl border border-line bg-white/80 px-4 py-3 outline-none transition focus:border-accent" />
          {state.fieldErrors?.name ? <p className="text-sm text-danger">{state.fieldErrors.name[0]}</p> : null}
        </label>

        <label className="block space-y-2 text-sm font-medium">
          <span>Email</span>
          <input name="email" type="email" placeholder="you@example.com" className="w-full rounded-2xl border border-line bg-white/80 px-4 py-3 outline-none transition focus:border-accent" />
          {state.fieldErrors?.email ? <p className="text-sm text-danger">{state.fieldErrors.email[0]}</p> : null}
        </label>

        <label className="block space-y-2 text-sm font-medium">
          <span>Password</span>
          <input name="password" type="password" placeholder="At least 8 characters" className="w-full rounded-2xl border border-line bg-white/80 px-4 py-3 outline-none transition focus:border-accent" />
          {state.fieldErrors?.password ? <p className="text-sm text-danger">{state.fieldErrors.password[0]}</p> : null}
        </label>

        {state.message ? <p className="rounded-2xl bg-accent-soft px-4 py-3 text-sm text-accent-deep">{state.message}</p> : null}

        <SubmitButton label="Create account" pendingLabel="Creating account..." />
      </form>
    </section>
  );
}