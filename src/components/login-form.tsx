"use client";

import { useActionState } from "react";

import { loginAction } from "@/app/actions/auth";
import { EMPTY_FORM_STATE } from "@/lib/form-state";
import { SubmitButton } from "@/components/submit-button";

export function LoginForm() {
  const [state, formAction] = useActionState(loginAction, EMPTY_FORM_STATE);

  return (
    <section className="rise-in glass-panel rounded-[1.75rem] p-5 sm:rounded-[2rem] sm:p-7 stagger-1">
      <div className="mb-5">
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-accent-deep">Welcome back</p>
        <h2 className="mt-3 text-2xl font-semibold">Log in to your groups</h2>
        <p className="mt-2 text-sm leading-6 text-muted">See current balances, open groups, and every shared expense in one place.</p>
      </div>

      <form action={formAction} className="space-y-4">
        <label className="block space-y-2 text-sm font-medium">
          <span>Username</span>
          <input name="username" placeholder="lovisa" autoComplete="username" className="w-full rounded-2xl border border-line bg-white/80 px-4 py-3 outline-none transition focus:border-accent" />
          {state.fieldErrors?.username ? <p className="text-sm text-danger">{state.fieldErrors.username[0]}</p> : null}
        </label>

        <label className="block space-y-2 text-sm font-medium">
          <span>Password</span>
          <input name="password" type="password" placeholder="Your password" className="w-full rounded-2xl border border-line bg-white/80 px-4 py-3 outline-none transition focus:border-accent" />
          {state.fieldErrors?.password ? <p className="text-sm text-danger">{state.fieldErrors.password[0]}</p> : null}
        </label>

        {state.message ? <p className="rounded-2xl bg-accent-soft px-4 py-3 text-sm text-accent-deep">{state.message}</p> : null}

        <SubmitButton label="Log in" pendingLabel="Logging in..." tone="secondary" />
      </form>
    </section>
  );
}