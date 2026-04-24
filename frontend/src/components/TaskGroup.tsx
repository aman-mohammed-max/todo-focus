import { useState } from "react";
import { Task, Stage, Priority } from "@/data/mock-data";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ChevronDown, Clock, Trash2, Pencil, PauseCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { DueDateBadge, urgencyBorderClass } from "@/components/DueDateBadge";
import { getUrgency } from "@/lib/due-date";
import { EditTaskDialog } from "@/components/EditTaskDialog";

const stageConfig: Record<Stage, { label: string; dotClass: string; badgeClass: string }> = {
  planning: {
    label: "Planning",
    dotClass: "bg-zinc-400",
    badgeClass: "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400",
  },
  "in-progress": {
    label: "In Progress",
    dotClass: "bg-blue-500",
    badgeClass: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300",
  },
  review: {
    label: "Review",
    dotClass: "bg-amber-500",
    badgeClass: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
  },
  done: {
    label: "Done",
    dotClass: "bg-emerald-500",
    badgeClass: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
  },
};

const priorityDot: Record<Priority, string> = {
  critical: "bg-red-500",
  high: "bg-orange-400",
  medium: "bg-blue-400",
  low: "bg-zinc-400",
};

interface TaskGroupProps {
  stage: Stage;
  tasks: Task[];
  activeTaskId?: string;
  onSetActive: (taskId: string) => void;
  onDeleteTask: (taskId: string) => void;
  onEditTask?: (updated: Task) => void;
  defaultOpen?: boolean;
}

export function TaskGroup({
  stage,
  tasks,
  activeTaskId,
  onSetActive,
  onDeleteTask,
  onEditTask,
  defaultOpen = false,
}: TaskGroupProps) {
  const [open, setOpen] = useState(defaultOpen);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [editTarget, setEditTarget] = useState<Task | null>(null);

  const config = stageConfig[stage];

  if (tasks.length === 0) return null;

  const urgentCount = tasks.filter((t) => {
    const u = getUrgency(t.dueDate);
    return u === "overdue" || u === "due-soon";
  }).length;

  return (
    <>
      <Collapsible open={open} onOpenChange={setOpen}>
        <CollapsibleTrigger asChild>
          <button className="w-full flex items-center justify-between py-2 px-1 group hover:bg-muted/40 rounded-lg transition-colors">
            <div className="flex items-center gap-2.5">
              <div className={cn("h-2 w-2 rounded-full shrink-0", config.dotClass)} />
              <span className="text-sm font-semibold text-foreground">{config.label}</span>
              <span className={cn("text-[10px] font-semibold px-1.5 py-0.5 rounded-full", config.badgeClass)}>
                {tasks.length}
              </span>
              {urgentCount > 0 && (
                <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300">
                  {urgentCount} urgent
                </span>
              )}
            </div>
            <ChevronDown
              className={cn(
                "h-4 w-4 text-muted-foreground transition-transform duration-200",
                open && "rotate-180"
              )}
            />
          </button>
        </CollapsibleTrigger>

        <CollapsibleContent className="space-y-1.5 mt-1 mb-3">
          {tasks.map((task) => {
            const isActive = task.id === activeTaskId;
            const urgency = getUrgency(task.dueDate);
            const isUrgent = urgency === "overdue" || urgency === "due-soon";
            const isFlexible = task.followPause !== false;

            return (
              <Card
                key={task.id}
                className={cn(
                  "border-l-2 transition-all duration-150",
                  isActive
                    ? "border-violet-300 dark:border-violet-800 bg-violet-50/60 dark:bg-violet-950/20 border-l-violet-500"
                    : isUrgent
                    ? cn("hover:shadow-sm", urgencyBorderClass(task.dueDate))
                    : "border-l-transparent hover:border-l-border hover:shadow-sm"
                )}
              >
                <CardContent className="p-3">
                  <div className="flex items-start gap-3">
                    <div className={cn("mt-1.5 h-2 w-2 rounded-full shrink-0", priorityDot[task.priority])} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <p className={cn("text-sm font-medium leading-snug", isActive && "text-violet-700 dark:text-violet-300")}>
                          {task.title}
                        </p>
                        <div className="flex items-center gap-1.5 shrink-0 flex-wrap">
                          {isActive && (
                            <Badge className="text-[9px] px-1.5 h-4 bg-violet-600 hover:bg-violet-600 text-white">
                              Active
                            </Badge>
                          )}
                          {isFlexible && (
                            <Badge variant="secondary" className="text-[9px] px-1.5 h-4 gap-1 bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400">
                              <PauseCircle className="h-2 w-2" />
                              Flex
                            </Badge>
                          )}
                          <DueDateBadge dueDate={task.dueDate} />
                        </div>
                      </div>
                      {task.description && (
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{task.description}</p>
                      )}
                      <div className="flex items-center gap-3 mt-2">
                        {task.subtasks.length > 0 && (
                          <span className="text-[10px] text-muted-foreground">
                            {task.subtasks.filter((s) => s.completed).length}/{task.subtasks.length} subtasks
                          </span>
                        )}
                        {task.estimatedMinutes && (
                          <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                            <Clock className="h-2.5 w-2.5" />
                            {task.estimatedMinutes}m
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-0.5 shrink-0">
                      {!isActive && task.status !== "done" && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 text-[10px] px-2 text-violet-600 hover:text-violet-700 hover:bg-violet-50 dark:hover:bg-violet-950"
                          onClick={() => onSetActive(task.id)}
                        >
                          Focus
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-muted-foreground hover:text-foreground hover:bg-muted"
                        onClick={() => setEditTarget(task)}
                        title="Edit task"
                      >
                        <Pencil className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-muted-foreground hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950"
                        onClick={() => setDeleteTarget(task.id)}
                        title="Delete task"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </CollapsibleContent>
      </Collapsible>

      <AlertDialog open={!!deleteTarget} onOpenChange={(v) => !v && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete task?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The task will be permanently removed from this project.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700 text-white"
              onClick={() => {
                if (deleteTarget) onDeleteTask(deleteTarget);
                setDeleteTarget(null);
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <EditTaskDialog
        task={editTarget}
        open={!!editTarget}
        onOpenChange={(v) => !v && setEditTarget(null)}
        onSave={(updated) => {
          onEditTask?.(updated);
          setEditTarget(null);
        }}
      />
    </>
  );
}
