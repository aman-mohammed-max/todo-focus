import { useState } from "react";
import { Task, Subtask } from "@/data/mock-data";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { Play, CheckCheck, Flag, Clock, ChevronRight, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { DueDateBadge } from "@/components/DueDateBadge";

interface FocusPanelProps {
  task: Task | undefined;
  onComplete?: () => void;
}

export function FocusPanel({ task, onComplete }: FocusPanelProps) {
  const [subtasks, setSubtasks] = useState<Subtask[]>(task?.subtasks ?? []);
  const [started, setStarted] = useState(task?.status === "in-progress");
  const [stepDone, setStepDone] = useState(false);

  if (!task) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-14 text-center">
          <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center mb-3">
            <Flag className="h-5 w-5 text-muted-foreground" />
          </div>
          <p className="text-sm font-medium text-foreground">No active task</p>
          <p className="text-xs text-muted-foreground mt-1">Pick a task from the list below to start focusing</p>
        </CardContent>
      </Card>
    );
  }

  const completedCount = subtasks.filter((s) => s.completed).length;
  const progress = subtasks.length === 0 ? (started ? 50 : 0) : Math.round((completedCount / subtasks.length) * 100);

  const toggleSubtask = (id: string) => {
    setSubtasks((prev) =>
      prev.map((s) => (s.id === id ? { ...s, completed: !s.completed } : s))
    );
  };

  const handleCompleteStep = () => {
    setStepDone(true);
    setTimeout(() => setStepDone(false), 2000);
  };

  return (
    <Card className="border-2 border-violet-200 dark:border-violet-900 bg-gradient-to-br from-violet-50 to-white dark:from-violet-950/20 dark:to-background shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-start gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-2">
              <div className="flex items-center gap-1.5">
                <div className="h-2 w-2 rounded-full bg-violet-500 animate-pulse" />
                <span className="text-xs font-semibold uppercase tracking-wider text-violet-600 dark:text-violet-400">
                  Focus now
                </span>
              </div>
              {task.estimatedMinutes && (
                <Badge variant="secondary" className="h-5 gap-1 text-[10px]">
                  <Clock className="h-2.5 w-2.5" />
                  {task.estimatedMinutes} min
                </Badge>
              )}
              <DueDateBadge dueDate={task.dueDate} size="sm" />
            </div>
            <h2 className="text-xl font-bold text-foreground leading-snug">{task.title}</h2>
            {task.description && (
              <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{task.description}</p>
            )}
          </div>
        </div>

        {subtasks.length > 0 && (
          <div className="mt-3">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs text-muted-foreground">
                {completedCount}/{subtasks.length} subtasks
              </span>
              <span className="text-xs font-semibold">{progress}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        )}
      </CardHeader>

      <CardContent className="pt-0 space-y-4">
        {subtasks.length > 0 && (
          <div className="space-y-1.5">
            {subtasks.map((subtask) => (
              <label
                key={subtask.id}
                className={cn(
                  "flex items-center gap-3 p-2.5 rounded-lg cursor-pointer transition-all",
                  subtask.completed
                    ? "bg-emerald-50 dark:bg-emerald-950/20"
                    : "bg-white dark:bg-white/5 hover:bg-white/70 dark:hover:bg-white/10"
                )}
              >
                <Checkbox
                  checked={subtask.completed}
                  onCheckedChange={() => toggleSubtask(subtask.id)}
                  className="shrink-0"
                />
                <span
                  className={cn(
                    "text-sm leading-snug",
                    subtask.completed
                      ? "line-through text-muted-foreground"
                      : "text-foreground font-medium"
                  )}
                >
                  {subtask.title}
                </span>
              </label>
            ))}
          </div>
        )}

        {stepDone && (
          <div className="flex items-center gap-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900 px-3 py-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span className="text-xs font-medium text-emerald-700 dark:text-emerald-300">
              Step marked complete — keep going!
            </span>
          </div>
        )}

        <div className="flex items-center gap-2 pt-1">
          {!started ? (
            <Button
              className="flex-1 bg-violet-600 hover:bg-violet-700 text-white gap-2"
              onClick={() => setStarted(true)}
            >
              <Play className="h-4 w-4" />
              Start Task
            </Button>
          ) : (
            <>
              <Button
                variant="outline"
                className="flex-1 gap-2 border-violet-200 dark:border-violet-800 text-violet-700 dark:text-violet-300 hover:bg-violet-50 dark:hover:bg-violet-950/30"
                onClick={handleCompleteStep}
              >
                <ChevronRight className="h-4 w-4" />
                Complete Step
              </Button>
              <Button
                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white gap-2"
                onClick={onComplete}
              >
                <CheckCheck className="h-4 w-4" />
                Finish Task
              </Button>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
