import { cn } from "@/lib/cn";

interface AvatarProps {
  name: string;
  photoUrl?: string | null;
  size?: number;
  className?: string;
}

function initials(name: string) {
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase() || "?";
}

export function Avatar({ name, photoUrl, size = 36, className }: AvatarProps) {
  const style = { width: size, height: size };
  if (photoUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- base64 data URLs, next/image can't optimize these anyway
      <img
        src={photoUrl}
        alt={name}
        style={style}
        className={cn("rounded-full object-cover", className)}
      />
    );
  }
  return (
    <div
      style={style}
      className={cn(
        "flex items-center justify-center rounded-full bg-brand text-mist font-medium",
        className
      )}
    >
      <span style={{ fontSize: size * 0.4 }}>{initials(name)}</span>
    </div>
  );
}
