import Link from "next/link";
import { Button } from "@/components/ui/button";
import { SurvivalGauge } from "@/components/dashboard/survival-gauge";
import { SalaryCountdown } from "@/components/dashboard/salary-countdown";
import { ThemeToggle } from "@/components/theme-toggle";

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-mist dark:bg-charcoal">
      <div className="mx-auto max-w-6xl px-6 py-20 lg:py-28">
        <nav className="mb-16 flex animate-fade-in items-center justify-between">
          <span className="font-display text-xl font-semibold text-ink dark:text-mist">
            BudgetGuardian
          </span>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Link href="/login">
              <Button variant="ghost" size="sm">Log in</Button>
            </Link>
            <Link href="/register">
              <Button size="sm">Get started</Button>
            </Link>
          </div>
        </nav>

        <div className="grid items-center gap-16 lg:grid-cols-2">
          <div>
            <p className="mb-4 animate-fade-in-up text-sm font-medium uppercase tracking-wide text-brand">
              A weather forecast for your money
            </p>
            <h1 className="animate-fade-in-up font-display text-4xl leading-tight text-ink dark:text-mist sm:text-5xl [animation-delay:80ms]">
              Know exactly how much you can safely spend today.
            </h1>
            <p className="mt-6 max-w-md animate-fade-in-up text-lg text-ink-soft dark:text-mist/70 [animation-delay:160ms]">
              BudgetGuardian watches your balance, your bills, and the days until
              payday — then tells you your safe daily budget before you overspend,
              not after.
            </p>
            <div className="mt-8 flex animate-fade-in-up gap-3 [animation-delay:240ms]">
              <Link href="/register">
                <Button size="lg">Create your account</Button>
              </Link>
              <Link href="/login">
                <Button size="lg" variant="secondary">I already have one</Button>
              </Link>
            </div>
            <dl className="mt-12 grid animate-fade-in-up grid-cols-3 gap-6 text-sm [animation-delay:320ms]">
              <div>
                <dt className="text-ink-soft dark:text-mist/60">Categories</dt>
                <dd className="num text-xl font-semibold text-ink dark:text-mist">14</dd>
              </div>
              <div>
                <dt className="text-ink-soft dark:text-mist/60">Currencies</dt>
                <dd className="num text-xl font-semibold text-ink dark:text-mist">7</dd>
              </div>
              <div>
                <dt className="text-ink-soft dark:text-mist/60">Risk levels</dt>
                <dd className="num text-xl font-semibold text-ink dark:text-mist">3</dd>
              </div>
            </dl>
          </div>

          <div className="glass-card animate-scale-in p-8 [animation-delay:120ms]">
            <p className="mb-6 text-sm font-medium text-ink-soft dark:text-mist/60">
              Preview — your dashboard on a tight week
            </p>
            <div className="flex items-center justify-around gap-4">
              <SurvivalGauge dailyBudget={125} riskLevel="danger" currencySymbol="₹" />
              <SalaryCountdown daysLeft={12} cycleLength={30} />
            </div>
            <div className="mt-6 rounded-xl bg-danger/10 p-4 text-sm text-danger">
              You may run out of money before payday at this pace. Try to stay under ₹125/day.
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
