import { NavBar } from "@/components/nav-bar";
import { AnnouncementBanner } from "@/components/announcement-banner";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-mist dark:bg-charcoal">
      <NavBar />
      <AnnouncementBanner />
      <main className="mx-auto max-w-6xl px-6 py-8">{children}</main>
    </div>
  );
}
