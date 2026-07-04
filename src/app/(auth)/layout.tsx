import Link from "next/link";
import { ThemeToggle } from "@/components/theme-toggle";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="relative flex min-h-screen items-center justify-center bg-mist dark:bg-charcoal px-6">
      <div className="absolute right-6 top-6">
        <ThemeToggle />
      </div>
      <div className="w-full max-w-sm animate-fade-in-up">
        <Link href="/" className="mb-8 block text-center font-display text-xl font-semibold text-ink dark:text-mist">
          BudgetGuardian
        </Link>
        <div className="glass-card p-8">{children}</div>
      </div>
    </main>
  );
}
