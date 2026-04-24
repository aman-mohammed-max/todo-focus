import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Bell, AlertCircle, Clock, CheckCircle2, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { getUrgency, formatDueLabel, MOCK_DATES } from "@/lib/due-date";

interface NotifItem {
  id: string;
  type: "overdue" | "due-soon" | "completed";
  title: string;
  project?: string;
  dueDate?: string;
  read: boolean;
}

const MOCK_NOTIFS: NotifItem[] = [
  { id: "n1", type: "overdue", title: "Design GraphQL schema", project: "API Redesign", dueDate: MOCK_DATES.overdue, read: false },
  { id: "n2", type: "due-soon", title: "Build chart components", project: "Dashboard v2", dueDate: MOCK_DATES.todayEvening, read: false },
  { id: "n3", type: "due-soon", title: "Review PR #142", project: "Personal", dueDate: MOCK_DATES.todayMorning, read: false },
  { id: "n4", type: "completed", title: "Design system tokens", project: "Mobile App", read: true },
  { id: "n5", type: "completed", title: "Audit existing REST endpoints", project: "API Redesign", read: true },
];

const typeConfig = {
  overdue: {
    icon: AlertCircle,
    label: "Overdue",
    iconClass: "text-red-500",
    badgeClass: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300",
  },
  "due-soon": {
    icon: Clock,
    label: "Due soon",
    iconClass: "text-amber-500",
    badgeClass: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
  },
  completed: {
    icon: CheckCircle2,
    label: "Done",
    iconClass: "text-emerald-500",
    badgeClass: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
  },
};

export function NotificationPanel() {
  const [notifs, setNotifs] = useState<NotifItem[]>(MOCK_NOTIFS);
  const unread = notifs.filter((n) => !n.read).length;

  const dismiss = (id: string) => setNotifs((prev) => prev.filter((n) => n.id !== id));
  const markAllRead = () => setNotifs((prev) => prev.map((n) => ({ ...n, read: true })));

  const overdue = notifs.filter((n) => n.type === "overdue");
  const dueSoon = notifs.filter((n) => n.type === "due-soon");
  const completed = notifs.filter((n) => n.type === "completed");

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative h-8 w-8">
          <Bell className="h-4 w-4" />
          {unread > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white">
              {unread}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 p-0" sideOffset={8}>
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-foreground">Notifications</span>
            {unread > 0 && (
              <Badge className="h-4 px-1.5 text-[9px] bg-red-500 hover:bg-red-500 text-white">
                {unread} new
              </Badge>
            )}
          </div>
          {unread > 0 && (
            <button
              onClick={markAllRead}
              className="text-[10px] text-violet-600 dark:text-violet-400 font-medium hover:underline"
            >
              Mark all read
            </button>
          )}
        </div>

        <div className="max-h-[400px] overflow-y-auto">
          {overdue.length > 0 && (
            <NotifSection label="Overdue" items={overdue} onDismiss={dismiss} />
          )}
          {dueSoon.length > 0 && (
            <NotifSection label="Due Soon" items={dueSoon} onDismiss={dismiss} />
          )}
          {completed.length > 0 && (
            <NotifSection label="Recently Completed" items={completed} onDismiss={dismiss} />
          )}
          {notifs.length === 0 && (
            <div className="flex flex-col items-center justify-center py-10 text-center px-4">
              <Bell className="h-7 w-7 text-muted-foreground mb-2" />
              <p className="text-sm font-medium text-foreground">All caught up</p>
              <p className="text-xs text-muted-foreground mt-0.5">No new notifications</p>
            </div>
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function NotifSection({
  label,
  items,
  onDismiss,
}: {
  label: string;
  items: NotifItem[];
  onDismiss: (id: string) => void;
}) {
  return (
    <div>
      <div className="px-4 py-2 bg-muted/40">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          {label}
        </span>
      </div>
      {items.map((item) => {
        const cfg = typeConfig[item.type];
        const Icon = cfg.icon;
        return (
          <div
            key={item.id}
            className={cn(
              "flex items-start gap-3 px-4 py-3 border-b border-border/50 last:border-0 transition-colors hover:bg-muted/30",
              !item.read && "bg-violet-50/50 dark:bg-violet-950/10"
            )}
          >
            <Icon className={cn("h-4 w-4 mt-0.5 shrink-0", cfg.iconClass)} />
            <div className="flex-1 min-w-0">
              <p className={cn("text-xs font-medium leading-snug", !item.read && "text-foreground", item.read && "text-muted-foreground")}>
                {item.title}
              </p>
              <div className="flex items-center gap-2 mt-0.5">
                {item.project && (
                  <span className="text-[10px] text-muted-foreground">{item.project}</span>
                )}
                {item.dueDate && (
                  <span className="text-[10px] text-muted-foreground">
                    {formatDueLabel(item.dueDate)}
                  </span>
                )}
              </div>
            </div>
            <button
              onClick={() => onDismiss(item.id)}
              className="shrink-0 text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
