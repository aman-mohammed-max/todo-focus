import { useState } from "react";
import { useLocation } from "wouter";
import { Project, Task, PersonalTask as PersonalTaskType, PausePeriod } from "../api-client-react";
import { ProjectCard } from "@/components/ProjectCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Plus, LayoutGrid } from "lucide-react";

const colorOptions = [
  { value: "violet", label: "Violet" },
  { value: "blue", label: "Blue" },
  { value: "emerald", label: "Emerald" },
  { value: "amber", label: "Amber" },
];

interface DashboardProps {
  onOpenProject?: (id: string) => void;
  projects: Project[];
  personalTasks: PersonalTaskType[];
  pausePeriods: PausePeriod[];
  onCreateProject: (data: { name: string; description?: string; priority?: string; color?: string }) => Promise<void>;
  onUpdateProject: (id: string, data: Partial<Project>) => Promise<void>;
  onDeleteProject: (id: string) => Promise<void>;
  onCreateTask: (data: Parameters<typeof import("../api-client-react").api.createTask>[0]) => Promise<void>;
  onUpdateTask: (id: string, data: Parameters<typeof import("../api-client-react").api.updateTask>[1]) => Promise<void>;
  onDeleteTask: (id: string) => Promise<void>;
  onCreateSubtask: (taskId: string, title: string) => Promise<void>;
  onUpdateSubtask: (id: string, data: { title?: string; completed?: boolean }) => Promise<void>;
  onDeleteSubtask: (id: string) => Promise<void>;
  onCreatePersonalTask: (data: { title: string; due_date?: string; priority?: string }) => Promise<void>;
  onUpdatePersonalTask: (id: string, data: Partial<PersonalTaskType>) => Promise<void>;
  onDeletePersonalTask: (id: string) => Promise<void>;
  onCreatePause: (startDate: string, endDate: string) => Promise<void>;
  onDeletePause: (id: string) => Promise<void>;
}

export function Dashboard({
  projects,
  onCreateProject,
  onDeleteProject,
}: DashboardProps) {
  const [addOpen, setAddOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newPriority, setNewPriority] = useState<"critical" | "high" | "medium" | "low">("medium");
  const [newColor, setNewColor] = useState("violet");
  const [, navigate] = useLocation();
  const [isCreating, setIsCreating] = useState(false);

  const handleDelete = async (id: string) => {
    await onDeleteProject(id);
  };

  const handleAdd = async () => {
    if (!newName.trim()) return;
    setIsCreating(true);
    try {
      await onCreateProject({
        name: newName.trim(),
        description: newDesc.trim() || undefined,
        priority: newPriority,
        color: newColor,
      });
      setNewName("");
      setNewDesc("");
      setNewPriority("medium");
      setNewColor("violet");
      setAddOpen(false);
    } finally {
      setIsCreating(false);
    }
  };

  const active = projects.filter((p) => p.tasks?.some((t) => t.status === "in-progress"));
  const total = projects.length;
  const done = projects.filter((p) => {
    const ts = p.tasks || [];
    return ts.length > 0 && ts.every((t) => t.status === "done");
  }).length;

  return (
    <div>
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <LayoutGrid className="h-5 w-5 text-muted-foreground" />
            <h1 className="text-2xl font-bold text-foreground">Projects</h1>
          </div>
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <span>{total} total</span>
            <span className="text-border">·</span>
            <span className="text-blue-600 dark:text-blue-400 font-medium">{active.length} active</span>
            <span className="text-border">·</span>
            <span className="text-emerald-600 dark:text-emerald-400 font-medium">{done} complete</span>
          </div>
        </div>
        <Button
          size="sm"
          className="gap-1.5 bg-violet-600 hover:bg-violet-700 text-white shrink-0"
          onClick={() => setAddOpen(true)}
        >
          <Plus className="h-3.5 w-3.5" />
          New Project
        </Button>
      </div>

      {active.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-3">
            <div className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-pulse" />
            <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Active
            </h2>
            <Badge variant="secondary" className="h-4 text-[10px] px-1.5">{active.length}</Badge>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {active.map((p) => (
              <ProjectCard key={p.id} project={p} onClick={(id) => navigate(`/project/${id}`)} onDelete={handleDelete} />
            ))}
          </div>
        </div>
      )}

      {projects.filter((p) => !active.includes(p)).length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              All Projects
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {projects
              .filter((p) => !active.includes(p))
              .map((p) => (
                <ProjectCard key={p.id} project={p} onClick={(id) => navigate(`/project/${id}`)} onDelete={handleDelete} />
              ))}
          </div>
        </div>
      )}

      {projects.length === 0 && (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="h-14 w-14 rounded-2xl bg-muted flex items-center justify-center mb-4">
            <LayoutGrid className="h-7 w-7 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-1">No projects yet</h3>
          <p className="text-sm text-muted-foreground mb-5 max-w-xs">
            Create your first project to start tracking tasks and making progress.
          </p>
          <Button
            className="gap-1.5 bg-violet-600 hover:bg-violet-700 text-white"
            onClick={() => setAddOpen(true)}
          >
            <Plus className="h-4 w-4" />
            Create a project
          </Button>
        </div>
      )}

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>New Project</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Project Name</Label>
              <Input
                placeholder="e.g., API Redesign"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAdd()}
                autoFocus
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Description (optional)</Label>
              <Textarea
                placeholder="What is this project about?"
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
                className="resize-none"
                rows={2}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Priority</Label>
                <Select value={newPriority} onValueChange={(v) => setNewPriority(v as "critical" | "high" | "medium" | "low")}>
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
                <Label className="text-xs font-medium">Color</Label>
                <Select value={newColor} onValueChange={setNewColor}>
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {colorOptions.map((c) => (
                      <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setAddOpen(false)}>
              Cancel
            </Button>
            <Button
              size="sm"
              className="bg-violet-600 hover:bg-violet-700 text-white"
              onClick={handleAdd}
              disabled={!newName.trim() || isCreating}
            >
              {isCreating ? "Creating..." : "Create Project"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}