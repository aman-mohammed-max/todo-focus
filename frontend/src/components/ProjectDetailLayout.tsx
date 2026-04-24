import { useState } from "react";
import { useLocation } from "wouter";
import { Project, Task, Stage, getProjectStats, Priority } from "@/data/mock-data";
import { FocusPanel } from "@/components/FocusPanel";
import { TaskGroup } from "@/components/TaskGroup";
import { NextTasks } from "@/components/NextTasks";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Plus, CheckCircle2, Clock, Circle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { quickDueDate } from "@/lib/due-date";

const priorityConfig: Record<Priority, { label: string; className: string }> = {
  critical: { label: "Critical", className: "bg-red-100 text-red-700 border-red-200 dark:bg-red-950 dark:text-red-300 dark:border-red-900" },
  high: { label: "High", className: "bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-950 dark:text-orange-300 dark:border-orange-900" },
  medium: { label: "Medium", className: "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-900" },
  low: { label: "Low", className: "bg-zinc-100 text-zinc-600 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:border-zinc-700" },
};

const colorMap: Record<string, string> = {
  violet: "bg-violet-500",
  blue: "bg-blue-500",
  emerald: "bg-emerald-500",
  amber: "bg-amber-500",
};

const STAGES: Stage[] = ["planning", "in-progress", "review", "done"];

interface ProjectDetailLayoutProps {
  project: Project;
  onBack: () => void;
  onUpdate: (project: Project) => void;
}

export function ProjectDetailLayout({ project, onBack, onUpdate }: ProjectDetailLayoutProps) {
  const [localProject, setLocalProject] = useState(project);
  const [addTaskOpen, setAddTaskOpen] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskDesc, setNewTaskDesc] = useState("");
  const [newTaskPriority, setNewTaskPriority] = useState<Priority>("medium");
  const [newTaskStage, setNewTaskStage] = useState<Stage>("planning");
  const [newTaskDue, setNewTaskDue] = useState("");
  const [, navigate] = useLocation();

  const stats = getProjectStats(localProject);
  const activeTask = localProject.tasks.find((t) => t.id === localProject.activeTaskId);
  const barColor = colorMap[localProject.color] ?? "bg-violet-500";
  const priority = priorityConfig[localProject.priority];

  const handleSetActive = (taskId: string) => {
    const updated = { ...localProject, activeTaskId: taskId };
    setLocalProject(updated);
    onUpdate(updated);
  };

  const handleDeleteTask = (taskId: string) => {
    const updated = {
      ...localProject,
      tasks: localProject.tasks.filter((t) => t.id !== taskId),
      activeTaskId: localProject.activeTaskId === taskId ? undefined : localProject.activeTaskId,
    };
    setLocalProject(updated);
    onUpdate(updated);
  };

  const handleEditTask = (updatedTask: Task) => {
    const updated = {
      ...localProject,
      tasks: localProject.tasks.map((t) => (t.id === updatedTask.id ? updatedTask : t)),
    };
    setLocalProject(updated);
    onUpdate(updated);
  };

  const handleCompleteActive = () => {
    const updated = {
      ...localProject,
      tasks: localProject.tasks.map((t) =>
        t.id === localProject.activeTaskId ? { ...t, status: "done" as const, stage: "done" as Stage } : t
      ),
      activeTaskId: undefined,
    };
    setLocalProject(updated);
    onUpdate(updated);
  };

  const handleAddTask = () => {
    if (!newTaskTitle.trim()) return;
    const newTask: Task = {
      id: `task-${Date.now()}`,
      title: newTaskTitle.trim(),
      description: newTaskDesc.trim() || undefined,
      status: newTaskStage === "done" ? "done" : newTaskStage === "in-progress" ? "in-progress" : "pending",
      stage: newTaskStage,
      priority: newTaskPriority,
      subtasks: [],
      dueDate: newTaskDue || undefined,
    };
    const updated = { ...localProject, tasks: [...localProject.tasks, newTask] };
    setLocalProject(updated);
    onUpdate(updated);
    setNewTaskTitle("");
    setNewTaskDesc("");
    setNewTaskPriority("medium");
    setNewTaskStage("planning");
    setNewTaskDue("");
    setAddTaskOpen(false);
  };

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Button
          variant="ghost"
          size="sm"
          className="gap-1.5 text-muted-foreground hover:text-foreground pl-0"
          onClick={() => navigate("/dashboard")}
        >
          <ArrowLeft className="h-4 w-4" />
          All Projects
        </Button>
      </div>

      <div className="flex items-start justify-between gap-4 mb-6">
        <div className="flex items-start gap-3">
          <div className={cn("mt-1 h-3 w-3 rounded-full shrink-0", barColor)} />
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl font-bold text-foreground">{localProject.name}</h1>
              <Badge
                variant="outline"
                className={cn("text-[10px] font-medium px-1.5 py-0 h-4 border", priority.className)}
              >
                {priority.label}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground mt-1 max-w-xl">{localProject.description}</p>
          </div>
        </div>
        <Button
          size="sm"
          className="gap-1.5 bg-violet-600 hover:bg-violet-700 text-white shrink-0"
          onClick={() => setAddTaskOpen(true)}
        >
          <Plus className="h-3.5 w-3.5" />
          Add Task
        </Button>
      </div>

      <div className="flex items-center gap-6 mb-8">
        <div className="flex-1 max-w-xs">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs text-muted-foreground font-medium">Progress</span>
            <span className="text-xs font-bold">{stats.progress}%</span>
          </div>
          <Progress value={stats.progress} className="h-2" />
        </div>
        <div className="flex items-center gap-5 text-xs">
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Circle className="h-3.5 w-3.5" />
            <span>{stats.pending} pending</span>
          </div>
          <div className="flex items-center gap-1.5 text-blue-600 dark:text-blue-400">
            <Clock className="h-3.5 w-3.5" />
            <span>{stats.inProgress} active</span>
          </div>
          <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="h-3.5 w-3.5" />
            <span>{stats.done} done</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-6">
        <div>
          <Tabs defaultValue="roadmap">
            <TabsList className="mb-5 h-9">
              <TabsTrigger value="roadmap" className="text-xs">Roadmap</TabsTrigger>
              <TabsTrigger value="next" className="text-xs">Up Next</TabsTrigger>
            </TabsList>

            <TabsContent value="roadmap" className="mt-0 space-y-1">
              {STAGES.map((stage) => (
                <TaskGroup
                  key={stage}
                  stage={stage}
                  tasks={localProject.tasks.filter((t) => t.stage === stage)}
                  activeTaskId={localProject.activeTaskId}
                  onSetActive={handleSetActive}
                  onDeleteTask={handleDeleteTask}
                  onEditTask={handleEditTask}
                  defaultOpen={stage === "in-progress" || stage === "planning"}
                />
              ))}
            </TabsContent>

            <TabsContent value="next" className="mt-0">
              <NextTasks tasks={localProject.tasks} onFocus={handleSetActive} />
            </TabsContent>
          </Tabs>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-foreground">Focus Panel</h3>
          </div>
          <FocusPanel task={activeTask} onComplete={handleCompleteActive} />
        </div>
      </div>

      <Dialog open={addTaskOpen} onOpenChange={setAddTaskOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add Task</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Title</Label>
              <Input
                placeholder="Task title"
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAddTask()}
                autoFocus
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Description (optional)</Label>
              <Textarea
                placeholder="What does this task involve?"
                value={newTaskDesc}
                onChange={(e) => setNewTaskDesc(e.target.value)}
                className="resize-none"
                rows={2}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Priority</Label>
                <Select value={newTaskPriority} onValueChange={(v) => setNewTaskPriority(v as Priority)}>
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
                <Select value={newTaskStage} onValueChange={(v) => setNewTaskStage(v as Stage)}>
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
              <Label className="text-xs font-medium">Due Date (optional)</Label>
              <div className="flex items-center gap-1.5 flex-wrap mb-1">
                {(["today", "tomorrow", "in3days", "thisweek"] as const).map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => setNewTaskDue(quickDueDate(opt))}
                    className="text-[10px] font-medium px-2 py-1 rounded-md border border-border hover:bg-muted transition-colors"
                  >
                    {opt === "today" ? "Today" : opt === "tomorrow" ? "Tomorrow" : opt === "in3days" ? "In 3 days" : "This week"}
                  </button>
                ))}
              </div>
              <Input
                type="datetime-local"
                value={newTaskDue}
                onChange={(e) => setNewTaskDue(e.target.value)}
                className="h-8 text-xs"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setAddTaskOpen(false)}>
              Cancel
            </Button>
            <Button
              size="sm"
              className="bg-violet-600 hover:bg-violet-700 text-white"
              onClick={handleAddTask}
              disabled={!newTaskTitle.trim()}
            >
              Add Task
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
