import { ArrowRight, Coins, ReceiptText, Users } from "lucide-react";
import { redirect } from "next/navigation";

import { getCurrentUser } from "@/lib/auth";
import { LoginForm } from "@/components/login-form";
import { SignUpForm } from "@/components/sign-up-form";

const featureCards = [
  {
    icon: Users,
    title: "Groups that stay readable",
    description: "Every membership, every payer, every share tracked in one place without spreadsheet drift.",
  },
  {
    icon: ReceiptText,
    title: "Equal splits by default",
    description: "Add a dinner, trip, or rent payment once and CashSplit spreads it evenly down to the last krona.",
  },
  {
    icon: Coins,
    title: "Balances people understand",
    description: "See who should get paid back and the shortest settlement plan to close the loop.",
  },
];

export default async function Home() {
  const user = await getCurrentUser();

  if (user) {
    redirect("/dashboard");
  }

  return (
    <main className="fine-grid min-h-screen px-4 py-4 sm:px-6 sm:py-6 lg:px-14 lg:py-8">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-8">
        <header className="rise-in flex items-center justify-between rounded-full border border-line bg-white/70 px-4 py-2.5 backdrop-blur sm:px-7 sm:py-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.32em] text-accent-deep">CashSplit</p>
          </div>
          <p className="text-sm text-muted">Clean shared expense tracking.</p>
        </header>

        <section className="grid gap-4 lg:grid-cols-[1.12fr_0.88fr] lg:gap-8">
          <div className="rise-in glass-panel relative overflow-hidden rounded-[1.5rem] px-4 py-5 sm:rounded-[2rem] sm:px-10 sm:py-12">
            <div className="float-gentle absolute right-[-5rem] top-[-4rem] h-44 w-44 rounded-full bg-accent-soft blur-3xl" />
            <div className="relative flex flex-col gap-6 sm:gap-8">
              <div className="inline-flex w-fit items-center gap-2 rounded-full border border-line bg-white/70 px-4 py-2 text-xs text-muted sm:text-sm">
                Built for shared homes, trips, weddings, and recurring group costs
              </div>
              <div className="max-w-3xl space-y-4 sm:space-y-5">
                <h1 className="display-type text-3xl leading-none tracking-tight text-foreground sm:text-5xl lg:text-7xl">
                  Shared expenses without the vague math.
                </h1>
                <p className="max-w-2xl text-base leading-7 text-muted sm:text-xl sm:leading-8">
                  Create a group, add the people in it, log what was paid, and let CashSplit keep the equal-split ledger and settlement plan honest.
                </p>
              </div>

              <div className="grid gap-3 sm:gap-4 md:grid-cols-3">
                {featureCards.map(({ icon: Icon, title, description }, index) => (
                  <article
                    key={title}
                    className={`rise-in rounded-[1.25rem] border border-line bg-white/72 p-4 sm:rounded-[1.5rem] sm:p-5 ${index === 0 ? "stagger-1" : index === 1 ? "stagger-2" : "stagger-3"}`}
                  >
                    <div className="mb-4 inline-flex rounded-2xl bg-accent-soft p-3 text-accent-deep">
                      <Icon size={20} />
                    </div>
                    <h2 className="mb-2 text-lg font-semibold">{title}</h2>
                    <p className="text-sm leading-6 text-muted">{description}</p>
                  </article>
                ))}
              </div>

              <div className="flex flex-wrap items-center gap-3 text-sm text-muted sm:gap-5">
                <div className="inline-flex items-center gap-2 rounded-full bg-white/65 px-4 py-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-success" />
                  Equal split down to cents
                </div>
                <div className="inline-flex items-center gap-2 rounded-full bg-white/65 px-4 py-2">
                  <ArrowRight size={16} className="text-accent-deep" />
                  Session-based auth and a container-ready SQLite setup
                </div>
              </div>
            </div>
          </div>

            <div className="grid gap-4 self-start">
            <SignUpForm />
            <LoginForm />
          </div>
        </section>
      </div>
    </main>
  );
}
