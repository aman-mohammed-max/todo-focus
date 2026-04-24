import { getUrgency, formatDueLabel, Urgency } from "@/lib/due-date";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, Clock, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";

const urgencyConfig: Record<Urgency, { class: string; icon: React.ElementType | null; show: boolean }> = {
  overdue: {
    class: "bg-red-100 text-red-700 border-red-200 dark:bg-red-950 dark:text-red-300 dark:border-red-900",
    icon: AlertCircle,
    show: true,
  },
  "due-soon": {
    class: "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-900",
    icon: Clock,
    show: true,
  },
  upcoming: {
    class: "bg-blue-100 text-blue-600 border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-900",
    icon: Calendar,
    show: true,
  },
  normal: {
    class: "bg-zinc-100 text-zinc-500 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:border-zinc-700",
    icon: Calendar,
    show: true,
  },
  none: { class: "", icon: null, show: false },
};

interface DueDateBadgeProps {
  dueDate: string | undefined;
  className?: string;
  size?: "sm" | "xs";
}

export function DueDateBadge({ dueDate, className, size = "xs" }: DueDateBadgeProps) {
  const urgency = getUrgency(dueDate);
  const config = urgencyConfig[urgency];
  if (!config.show || !dueDate) return null;

  const Icon = config.icon;
  const label = formatDueLabel(dueDate);

  return (
    <Badge
      variant="outline"
      className={cn(
        "gap-1 border font-medium shrink-0",
        size === "xs" ? "h-4 text-[9px] px-1.5" : "h-5 text-[10px] px-2",
        config.class,
        className
      )}
    >
      {Icon && <Icon className={size === "xs" ? "h-2 w-2" : "h-2.5 w-2.5"} />}
      {label}
    </Badge>
  );
}

export function urgencyBorderClass(dueDate: string | undefined): string {
  const urgency = getUrgency(dueDate);
  if (urgency === "overdue") return "border-l-red-500";
  if (urgency === "due-soon") return "border-l-amber-400";
  return "";
}
