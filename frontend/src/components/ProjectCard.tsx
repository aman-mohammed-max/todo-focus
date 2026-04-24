import { Project, getProjectStats, Priority } from "@/data/mock-data";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { ArrowRight, Circle, Clock, CheckCircle2, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const colorMap: Record<string, string> = {
  violet: "bg-violet-500",
  blue: "bg-blue-500",
  emerald: "bg-emerald-500",
  amber: "bg-amber-500",
};

const priorityConfig: Record<Priority, { label: string; className: string }> = {
  critical: { label: "Critical", className: "bg-red-100 text-red-700 border-red-200 dark:bg-red-950 dark:text-red-300 dark:border-red-900" },
  high: { label: "High", className: "bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-950 dark:text-orange-300 dark:border-orange-900" },
  medium: { label: "Medium", className: "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-900" },
  low: { label: "Low", className: "bg-zinc-100 text-zinc-600 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:border-zinc-700" },
};

interface ProjectCardProps {
  project: Project;
  onClick: (id: string) => void;
  onDelete: (id: string) => void;
}

export function ProjectCard({ project, onClick, onDelete }: ProjectCardProps) {
  const stats = getProjectStats(project);
  const activeTask = project.tasks.find((t) => t.id === project.activeTaskId);
  const barColor = colorMap[project.color] ?? "bg-violet-500";
  const priority = priorityConfig[project.priority];

  return (
    <Card
      className="group relative cursor-pointer border hover:border-border/80 hover:shadow-md transition-all duration-200 overflow-hidden"
      onClick={() => onClick(project.id)}
    >
      <div className={cn("absolute left-0 top-0 bottom-0 w-1 rounded-l-lg", barColor)} />
      <CardHeader className="pl-6 pb-3 pt-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <h3 className="text-base font-semibold text-foreground leading-snug truncate">
                {project.name}
              </h3>
              <Badge
                variant="outline"
                className={cn("text-[10px] font-medium px-1.5 py-0 h-4 border shrink-0", priority.className)}
              >
                {priority.label}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground leading-snug line-clamp-2">
              {project.description}
            </p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pl-6 pb-5 pt-0 space-y-4">
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs text-muted-foreground font-medium">Progress</span>
            <span className="text-xs font-semibold text-foreground">{stats.progress}%</span>
          </div>
          <Progress value={stats.progress} className="h-1.5" />
        </div>

        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Circle className="h-3 w-3" />
            <span>{stats.pending} pending</span>
          </div>
          <div className="flex items-center gap-1.5 text-blue-600 dark:text-blue-400">
            <Clock className="h-3 w-3" />
            <span>{stats.inProgress} active</span>
          </div>
          <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="h-3 w-3" />
            <span>{stats.done} done</span>
          </div>
        </div>

        {activeTask && (
          <div className="rounded-lg bg-violet-50 dark:bg-violet-950/30 border border-violet-100 dark:border-violet-900/50 px-3 py-2.5">
            <div className="flex items-center gap-1.5 mb-0.5">
              <div className="h-1.5 w-1.5 rounded-full bg-violet-500 animate-pulse" />
              <span className="text-[10px] font-semibold uppercase tracking-wider text-violet-600 dark:text-violet-400">
                Active now
              </span>
            </div>
            <p className="text-sm font-medium text-foreground line-clamp-1">{activeTask.title}</p>
          </div>
        )}

        <div className="flex items-center justify-between pt-1">
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950 px-2"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(project.id);
            }}
          >
            Delete
          </Button>
          <div className="flex items-center gap-1 text-xs text-muted-foreground group-hover:text-foreground transition-colors">
            <span>Open project</span>
            <ArrowRight className="h-3 w-3 group-hover:translate-x-0.5 transition-transform" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
