"use client";

import { useFormStatus } from "react-dom";

type SubmitButtonProps = {
  label: string;
  pendingLabel: string;
  tone?: "primary" | "secondary";
};

export function SubmitButton({ label, pendingLabel, tone = "primary" }: SubmitButtonProps) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className={
        tone === "primary"
          ? "inline-flex min-h-12 w-full items-center justify-center rounded-full bg-foreground px-5 py-3 text-sm font-semibold text-background transition hover:bg-accent-deep disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
          : "inline-flex min-h-12 w-full items-center justify-center rounded-full border border-line-strong bg-white/70 px-5 py-3 text-sm font-semibold text-foreground transition hover:border-foreground disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
      }
    >
      {pending ? pendingLabel : label}
    </button>
  );
}