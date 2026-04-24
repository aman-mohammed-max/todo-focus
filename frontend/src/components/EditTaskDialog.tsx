import { useState, useEffect } from "react";
import { Task, Priority, Stage, Subtask } from "@/data/mock-data";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { quickDueDate } from "@/lib/due-date";
import { Plus, Trash2, PauseCircle } from "lucide-react";

interface EditTaskDialogProps {
  task: Task | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSave: (updated: Task) => void;
}

export function EditTaskDialog({ task, open, onOpenChange, onSave }: EditTaskDialogProps) {
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [priority, setPriority] = useState<Priority>("medium");
  const [stage, setStage] = useState<Stage>("planning");
  const [dueDate, setDueDate] = useState("");
  const [followPause, setFollowPause] = useState(true);
  const [subtasks, setSubtasks] = useState<Subtask[]>([]);
  const [newSubtask, setNewSubtask] = useState("");

  useEffect(() => {
    if (task) {
      setTitle(task.title);
      setDesc(task.description ?? "");
      setPriority(task.priority);
      setStage(task.stage);
      setDueDate(task.dueDate ?? "");
      setFollowPause(task.followPause ?? true);
      setSubtasks(task.subtasks);
    }
  }, [task]);

  if (!task) return null;

  const addSubtask = () => {
    if (!newSubtask.trim()) return;
    setSubtasks((prev) => [
      ...prev,
      { id: `st-${Date.now()}`, title: newSubtask.trim(), completed: false },
    ]);
    setNewSubtask("");
  };

  const removeSubtask = (id: string) => {
    setSubtasks((prev) => prev.filter((s) => s.id !== id));
  };

  const toggleSubtask = (id: string) => {
    setSubtasks((prev) =>
      prev.map((s) => (s.id === id ? { ...s, completed: !s.completed } : s))
    );
  };

  const handleSave = () => {
    if (!title.trim()) return;
    onSave({
      ...task,
      title: title.trim(),
      description: desc.trim() || undefined,
      priority,
      stage,
      status: stage === "done" ? "done" : stage === "in-progress" ? "in-progress" : "pending",
      dueDate: dueDate || undefined,
      followPause,
      subtasks,
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Task</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-1">
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">Title</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              autoFocus
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-medium">Description</Label>
            <Textarea
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              placeholder="What does this task involve?"
              className="resize-none"
              rows={2}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Priority</Label>
              <Select value={priority} onValueChange={(v) => setPriority(v as Priority)}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="critical">Critical</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Stage</Label>
              <Select value={stage} onValueChange={(v) => setStage(v as Stage)}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="planning">Planning</SelectItem>
                  <SelectItem value="in-progress">In Progress</SelectItem>
                  <SelectItem value="review">Review</SelectItem>
                  <SelectItem value="done">Done</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-medium">Due Date</Label>
            <div className="flex items-center gap-1.5 flex-wrap">
              {(["today", "tomorrow", "in3days", "thisweek"] as const).map((opt) => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => setDueDate(quickDueDate(opt))}
                  className="text-[10px] font-medium px-2 py-1 rounded-md border border-border hover:bg-muted transition-colors"
                >
                  {opt === "today" ? "Today" : opt === "tomorrow" ? "Tomorrow" : opt === "in3days" ? "3 days" : "This week"}
                </button>
              ))}
              {dueDate && (
                <button
                  type="button"
                  onClick={() => setDueDate("")}
                  className="text-[10px] font-medium px-2 py-1 rounded-md border border-red-200 text-red-600 hover:bg-red-50 transition-colors"
                >
                  Clear
                </button>
              )}
            </div>
            <Input
              type="datetime-local"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="h-8 text-xs"
            />
          </div>

          <div className="rounded-xl border border-border bg-muted/30 p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <PauseCircle className="h-4 w-4 text-amber-500" />
                <div>
                  <p className="text-sm font-medium text-foreground">Follow Pause Schedule</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    {followPause
                      ? "Deadline shifts when work is paused"
                      : "Deadline stays fixed regardless of pauses"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {followPause ? (
                  <Badge variant="secondary" className="text-[9px] h-4 px-1.5 gap-1 bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400">
                    Flexible
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="text-[9px] h-4 px-1.5">
                    Fixed
                  </Badge>
                )}
                <Switch checked={followPause} onCheckedChange={setFollowPause} />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-medium">
              Subtasks
              {subtasks.length > 0 && (
                <span className="ml-1.5 text-muted-foreground font-normal">
                  ({subtasks.filter((s) => s.completed).length}/{subtasks.length} done)
                </span>
              )}
            </Label>
            <div className="space-y-1.5">
              {subtasks.map((s) => (
                <div key={s.id} className="flex items-center gap-2 group">
                  <Checkbox
                    checked={s.completed}
                    onCheckedChange={() => toggleSubtask(s.id)}
                    className="shrink-0"
                  />
                  <span className={`text-sm flex-1 ${s.completed ? "line-through text-muted-foreground" : ""}`}>
                    {s.title}
                  </span>
                  <button
                    onClick={() => removeSubtask(s.id)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-red-500"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <Input
                placeholder="Add subtask…"
                value={newSubtask}
                onChange={(e) => setNewSubtask(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addSubtask()}
                className="h-7 text-xs"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-7 w-7 shrink-0"
                onClick={addSubtask}
                disabled={!newSubtask.trim()}
              >
                <Plus className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            size="sm"
            className="bg-violet-600 hover:bg-violet-700 text-white"
            onClick={handleSave}
            disabled={!title.trim()}
          >
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
