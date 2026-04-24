import { Task, Priority } from "@/data/mock-data";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowRight, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

const priorityConfig: Record<Priority, { label: string; dotClass: string }> = {
  critical: { label: "Critical", dotClass: "bg-red-500" },
  high: { label: "High", dotClass: "bg-orange-400" },
  medium: { label: "Medium", dotClass: "bg-blue-400" },
  low: { label: "Low", dotClass: "bg-zinc-400" },
};

interface NextTasksProps {
  tasks: Task[];
  onFocus: (taskId: string) => void;
}

export function NextTasks({ tasks, onFocus }: NextTasksProps) {
  const nextTasks = tasks
    .filter((t) => t.status === "pending")
    .slice(0, 4);

  if (nextTasks.length === 0) return null;

  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <h3 className="text-sm font-semibold text-foreground">Up Next</h3>
        <Badge variant="secondary" className="h-4 text-[10px] px-1.5">
          {nextTasks.length}
        </Badge>
      </div>
      <div className="space-y-2">
        {nextTasks.map((task, i) => {
          const p = priorityConfig[task.priority];
          return (
            <div
              key={task.id}
              className="flex items-center gap-3 p-3 rounded-lg border border-border hover:border-border/80 hover:bg-muted/30 transition-all group"
            >
              <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-muted text-[10px] font-bold text-muted-foreground">
                {i + 1}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <div className={cn("h-1.5 w-1.5 rounded-full shrink-0", p.dotClass)} />
                  <p className="text-sm font-medium text-foreground truncate">{task.title}</p>
                </div>
                {task.estimatedMinutes && (
                  <div className="flex items-center gap-1 mt-0.5">
                    <Clock className="h-2.5 w-2.5 text-muted-foreground" />
                    <span className="text-[10px] text-muted-foreground">{task.estimatedMinutes}m</span>
                  </div>
                )}
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity text-violet-600 hover:bg-violet-50 dark:hover:bg-violet-950"
                onClick={() => onFocus(task.id)}
              >
                <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
