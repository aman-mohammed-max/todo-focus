import { useState } from "react";
import { PersonalTask as PersonalTaskType } from "../api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, User, Calendar, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { DueDateBadge, urgencyBorderClass } from "@/components/DueDateBadge";
import { quickDueDate, getUrgency } from "@/lib/due-date";

const priorityConfig: Record<string, { label: string; class: string }> = {
  critical: { label: "Critical", class: "text-red-600 border-red-200 bg-red-50 dark:text-red-400 dark:border-red-900 dark:bg-red-950" },
  high: { label: "High", class: "text-orange-600 border-orange-200 bg-orange-50 dark:text-orange-400 dark:border-orange-900 dark:bg-orange-950" },
  medium: { label: "Medium", class: "text-blue-600 border-blue-200 bg-blue-50 dark:text-blue-400 dark:border-blue-900 dark:bg-blue-950" },
  low: { label: "Low", class: "text-zinc-600 border-zinc-200 bg-zinc-50 dark:text-zinc-400 dark:border-zinc-700 dark:bg-zinc-800" },
};

function groupTasks(tasks: PersonalTaskType[]): {
  overdue: PersonalTaskType[];
  today: PersonalTaskType[];
  upcoming: PersonalTaskType[];
  later: PersonalTaskType[];
  completed: PersonalTaskType[];
} {
  const pending = tasks.filter((t) => !t.completed);
  const completed = tasks.filter((t) => t.completed);

  const overdue = pending.filter((t) => getUrgency(t.due_date) === "overdue");
  const today = pending.filter((t) => getUrgency(t.due_date) === "due-soon");
  const upcoming = pending.filter((t) => getUrgency(t.due_date) === "upcoming");
  const later = pending.filter(
    (t) => getUrgency(t.due_date) === "normal" || getUrgency(t.due_date) === "none"
  );

  return { overdue, today, upcoming, later, completed };
}

interface PersonalTasksViewProps {
  tasks: PersonalTaskType[];
  onCreateTask: (data: { title: string; due_date?: string; priority?: string }) => Promise<void>;
  onUpdateTask: (id: string, data: Partial<PersonalTaskType>) => Promise<void>;
  onDeleteTask: (id: string) => Promise<void>;
}

export function PersonalTasksView({ tasks, onCreateTask, onDeleteTask, onUpdateTask }: PersonalTasksViewProps) {
  const [newTask, setNewTask] = useState("");
  const [newPriority, setNewPriority] = useState<"critical" | "high" | "medium" | "low">("medium");
  const [newDue, setNewDue] = useState("");
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  const { overdue, today, upcoming, later, completed } = groupTasks(tasks);
  const pendingCount = overdue.length + today.length + upcoming.length + later.length;

  const toggleTask = async (id: string, currentCompleted: boolean) => {
    await onUpdateTask(id, { completed: !currentCompleted });
  };

  const deleteTask = async (id: string) => {
    await onDeleteTask(id);
  };

  const addTask = async () => {
    if (!newTask.trim()) return;
    setIsCreating(true);
    try {
      await onCreateTask({
        title: newTask.trim(),
        due_date: newDue || undefined,
        priority: newPriority,
      });
      setNewTask("");
      setNewDue("");
      setNewPriority("medium");
      setShowDatePicker(false);
    } finally {
      setIsCreating(false);
    }
  };

  const setQuickDue = (opt: "today" | "tomorrow" | "in3days" | "thisweek") => {
    setNewDue(quickDueDate(opt));
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-8">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-100 dark:bg-violet-900/40">
          <User className="h-4 w-4 text-violet-600 dark:text-violet-400" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-foreground">Personal Tasks</h1>
          <p className="text-sm text-muted-foreground">
            {overdue.length > 0 ? (
              <span className="text-red-600 dark:text-red-400 font-medium">{overdue.length} overdue · </span>
            ) : null}
            {pendingCount} remaining
          </p>
        </div>
      </div>

      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex items-center gap-2">
            <Input
              placeholder="What do you need to do today?"
              value={newTask}
              onChange={(e) => setNewTask(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addTask()}
              className="border-0 shadow-none focus-visible:ring-0 px-0 text-sm placeholder:text-muted-foreground"
            />
            <Button
              variant="ghost"
              size="icon"
              className={cn("h-7 w-7 shrink-0", showDatePicker && "text-violet-600 bg-violet-50 dark:bg-violet-950")}
              onClick={() => setShowDatePicker(!showDatePicker)}
              title="Add due date"
            >
              <Calendar className="h-3.5 w-3.5" />
            </Button>
            <Button
              size="sm"
              className="h-8 gap-1.5 bg-violet-600 hover:bg-violet-700 text-white shrink-0"
              onClick={addTask}
              disabled={!newTask.trim() || isCreating}
            >
              {isCreating ? "..." : <><Plus className="h-3.5 w-3.5" /> Add</>}
            </Button>
          </div>

          {showDatePicker && (
            <div className="mt-3 pt-3 border-t border-border space-y-3">
              <div className="flex items-center gap-1.5 flex-wrap">
                {(["today", "tomorrow", "in3days", "thisweek"] as const).map((opt) => (
                  <button
                    key={opt}
                    onClick={() => setQuickDue(opt)}
                    className="text-[10px] font-medium px-2 py-1 rounded-md border border-border hover:bg-muted transition-colors"
                  >
                    {opt === "today" ? "Today" : opt === "tomorrow" ? "Tomorrow" : opt === "in3days" ? "In 3 days" : "This week"}
                  </button>
                ))}
              </div>
              <div className="grid grid-cols-[1fr_auto_auto] gap-2 items-end">
                <div className="space-y-1">
                  <Label className="text-[10px] font-medium text-muted-foreground">Due date & time</Label>
                  <Input
                    type="datetime-local"
                    value={newDue}
                    onChange={(e) => setNewDue(e.target.value)}
                    className="h-8 text-xs"
                  />
                </div>
                <Select value={newPriority} onValueChange={(v) => setNewPriority(v as "critical" | "high" | "medium" | "low")}>
                  <SelectTrigger className="h-8 text-xs w-24">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="critical">Critical</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                  </SelectContent>
                </Select>
                {newDue && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground"
                    onClick={() => setNewDue("")}
                  >
                    <X className="h-3.5 w-3.5" />
                  </Button>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="space-y-6">
        {overdue.length > 0 && (
          <TaskSection
            label="Overdue"
            count={overdue.length}
            tasks={overdue}
            onToggle={toggleTask}
            onDelete={deleteTask}
            urgentStyle="text-red-600 dark:text-red-400"
          />
        )}
        {today.length > 0 && (
          <TaskSection
            label="Today"
            count={today.length}
            tasks={today}
            onToggle={toggleTask}
            onDelete={deleteTask}
            urgentStyle="text-amber-600 dark:text-amber-400"
          />
        )}
        {upcoming.length > 0 && (
          <TaskSection
            label="Upcoming"
            count={upcoming.length}
            tasks={upcoming}
            onToggle={toggleTask}
            onDelete={deleteTask}
          />
        )}
        {later.length > 0 && (
          <TaskSection
            label="Later"
            count={later.length}
            tasks={later}
            onToggle={toggleTask}
            onDelete={deleteTask}
          />
        )}
        {completed.length > 0 && (
          <TaskSection
            label="Completed"
            count={completed.length}
            tasks={completed}
            onToggle={toggleTask}
            onDelete={deleteTask}
            faded
          />
        )}
      </div>
    </div>
  );
}

function TaskSection({
  label,
  count,
  tasks,
  onToggle,
  onDelete,
  urgentStyle,
  faded,
}: {
  label: string;
  count: number;
  tasks: PersonalTaskType[];
  onToggle: (id: string, completed: boolean) => void;
  onDelete: (id: string) => void;
  urgentStyle?: string;
  faded?: boolean;
}) {
  return (
    <div className={faded && "opacity-60"}>
      <div className="flex items-center gap-2 mb-3">
        <h3 className={cn("text-xs font-semibold uppercase tracking-wider", urgentStyle ?? "text-muted-foreground")}>
          {label}
        </h3>
        <span className="text-xs text-muted-foreground">{count}</span>
      </div>
      <div className="space-y-1.5">
        {tasks.map((task) => (
          <TaskRow key={task.id} task={task} onToggle={onToggle} onDelete={onDelete} />
        ))}
      </div>
    </div>
  );
}

function TaskRow({
  task,
  onToggle,
  onDelete,
}: {
  task: PersonalTaskType;
  onToggle: (id: string, completed: boolean) => void;
  onDelete: (id: string) => void;
}) {
  const p = priorityConfig[task.priority] || priorityConfig.medium;
  const urgency = getUrgency(task.due_date);
  const isUrgent = urgency === "overdue" || urgency === "due-soon";

  return (
    <div
      className={cn(
        "group flex items-center gap-3 p-3 rounded-xl border-l-2 border transition-all",
        task.completed
          ? "border-transparent border-l-transparent bg-muted/20"
          : isUrgent
          ? cn("border-border hover:shadow-sm bg-card", urgencyBorderClass(task.due_date))
          : "border-l-transparent border-border hover:border-border/80 hover:shadow-sm bg-card"
      )}
    >
      <Checkbox
        checked={task.completed}
        onCheckedChange={() => onToggle(task.id, task.completed)}
        className="shrink-0"
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span
            className={cn(
              "text-sm font-medium",
              task.completed ? "line-through text-muted-foreground" : "text-foreground"
            )}
          >
            {task.title}
          </span>
        </div>
        {task.due_date && !task.completed && (
          <div className="mt-1">
            <DueDateBadge dueDate={task.due_date} size="xs" />
          </div>
        )}
      </div>
      {!task.completed && (
        <Badge
          variant="outline"
          className={cn("h-4 text-[9px] px-1.5 font-medium shrink-0 border", p.class)}
        >
          {p.label}
        </Badge>
      )}
      <Button
        variant="ghost"
        size="icon"
        className="h-6 w-6 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950"
        onClick={() => onDelete(task.id)}
      >
        <Trash2 className="h-3 w-3" />
      </Button>
    </div>
  );
}