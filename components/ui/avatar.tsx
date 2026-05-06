import Image from "next/image";
import { cn, getInitials, getAvatarColor } from "@/lib/utils";

interface AvatarProps {
  name?: string | null;
  src?: string | null;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  className?: string;
  ring?: boolean;
}

const sizeMap = {
  xs: { cls: "h-6 w-6",   text: "text-[10px]" },
  sm: { cls: "h-8 w-8",   text: "text-xs"  },
  md: { cls: "h-9 w-9",   text: "text-sm"  },
  lg: { cls: "h-11 w-11", text: "text-sm"  },
  xl: { cls: "h-16 w-16", text: "text-lg"  },
};

export function Avatar({ name, src, size = "md", className, ring = false }: AvatarProps) {
  const { cls, text } = sizeMap[size];
  const initials = getInitials(name);

  // Map initials to a gradient rather than flat bg
  const gradients = [
    "from-violet-500 to-purple-600",
    "from-blue-500 to-indigo-600",
    "from-emerald-500 to-teal-600",
    "from-orange-500 to-amber-600",
    "from-pink-500 to-rose-600",
    "from-cyan-500 to-sky-600",
  ];
  let idx = 0;
  if (name) for (let i = 0; i < name.length; i++) idx = (idx + name.charCodeAt(i)) % gradients.length;
  const grad = gradients[idx];

  if (src) {
    // data: URIs can't go through next/image — use a plain img tag
    const isDataUri = src.startsWith("data:");
    return (
      <div className={cn(
        "relative rounded-full overflow-hidden shrink-0",
        cls,
        ring && "ring-2 ring-[var(--surface)] ring-offset-1 ring-offset-[var(--surface)]",
        className
      )}>
        {isDataUri ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={src} alt={name || "User"} className="object-cover w-full h-full" />
        ) : (
          <Image src={src} alt={name || "User"} fill className="object-cover" />
        )}
      </div>
    );
  }

  return (
    <div className={cn(
      "rounded-full shrink-0 flex items-center justify-center font-bold text-white",
      `bg-gradient-to-br ${grad}`,
      cls, text,
      ring && "ring-2 ring-[var(--surface)]",
      className
    )}>
      {initials}
    </div>
  );
}

export function AvatarGroup({
  users,
  max = 3,
  size = "sm",
}: {
  users: { name?: string | null; avatar?: string | null; id: string }[];
  max?: number;
  size?: "xs" | "sm" | "md";
}) {
  const visible = users.slice(0, max);
  const overflow = users.length - max;
  const { cls, text } = sizeMap[size];

  return (
    <div className="flex -space-x-2">
      {visible.map((u) => (
        <Avatar key={u.id} name={u.name} src={u.avatar} size={size} ring />
      ))}
      {overflow > 0 && (
        <div className={cn(
          "rounded-full flex items-center justify-center font-semibold ring-2 ring-[var(--surface)]",
          "bg-[var(--surface-2)] text-[var(--text-secondary)] border border-[var(--border)]",
          text, cls
        )}>
          +{overflow}
        </div>
      )}
    </div>
  );
}
