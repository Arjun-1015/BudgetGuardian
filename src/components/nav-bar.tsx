"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { cn } from "@/lib/cn";
import { Button } from "@/components/ui/button";
import { NotificationBell } from "@/components/notification-bell";
import { Avatar } from "@/components/avatar";
import { LogoutOverlay } from "@/components/logout-overlay";
import { OfflineIndicator } from "@/components/offline-indicator";
import { ThemeToggle } from "@/components/theme-toggle";
import { apiFetch } from "@/lib/api-client";

const LINKS = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/expenses", label: "Expenses" },
  { href: "/income", label: "Income" },
  { href: "/dependents", label: "Family" },
  { href: "/bills", label: "Bills" },
  { href: "/goals", label: "Goals" },
  { href: "/calendar", label: "Calendar" },
  { href: "/reports", label: "Reports" },
  { href: "/advisor", label: "Advisor" },
];

interface NavProfile {
  name?: string;
  profilePhoto?: string | null;
  isAdmin?: boolean;
}

export function NavBar() {
  const pathname = usePathname();
  const router = useRouter();
  const [profile, setProfile] = useState<NavProfile>({});
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    apiFetch<NavProfile>("/api/user/profile")
      .then(setProfile)
      .catch(() => {});
    // Intentionally fetch once on mount, not on every route change — this
    // used to run on every nav click via a `[pathname]` dependency, adding
    // an avoidable DB round-trip to every single navigation. The avatar/name
    // only change on the Settings page, which is a rare action, so this
    // trade-off (avatar updates on next full page load, not instantly) is
    // worth the snappier everyday navigation.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleLogout() {
    // Set immediately (before the await) so the overlay appears on the
    // very next paint, regardless of how long the network request takes —
    // this is what actually fixes the "did my click even register?" feeling,
    // not just making the request itself faster.
    setLoggingOut(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } finally {
      router.push("/");
      router.refresh();
    }
  }

  return (
    <header className="border-b border-ink/10 dark:border-white/10">
      {loggingOut && <LogoutOverlay />}
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-4">
        <Link href="/dashboard" className="shrink-0 font-display text-lg font-semibold text-ink dark:text-mist">
          BudgetGuardian
        </Link>
        <nav className="flex flex-1 flex-wrap items-center gap-1 overflow-x-auto">
          {LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "whitespace-nowrap rounded-pill px-3 py-2 text-sm font-medium transition-colors",
                pathname.startsWith(link.href)
                  ? "bg-brand text-mist"
                  : "text-ink-soft hover:bg-ink/5 dark:text-mist/70 dark:hover:bg-white/10"
              )}
            >
              {link.label}
            </Link>
          ))}
          {profile.isAdmin && (
            <Link
              href="/admin"
              className={cn(
                "whitespace-nowrap rounded-pill px-3 py-2 text-sm font-medium transition-colors",
                pathname.startsWith("/admin")
                  ? "bg-brand text-mist"
                  : "text-ink-soft hover:bg-ink/5 dark:text-mist/70 dark:hover:bg-white/10"
              )}
            >
              Admin
            </Link>
          )}
        </nav>
        <div className="flex shrink-0 items-center gap-3">
          <OfflineIndicator />
          <ThemeToggle />
          <NotificationBell />
          <Link href="/settings" aria-label="Settings" className="shrink-0">
            <Avatar name={profile.name ?? "?"} photoUrl={profile.profilePhoto} size={32} />
          </Link>
          <Button variant="ghost" size="sm" onClick={handleLogout} disabled={loggingOut}>
            {loggingOut ? "Logging out…" : "Log out"}
          </Button>
        </div>
      </div>
    </header>
  );
}
