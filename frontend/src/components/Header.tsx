import { useState } from "react";
import { useLocation } from "wouter";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronDown, Zap, Settings, PauseCircle, LogOut, User } from "lucide-react";
import { NotificationPanel } from "@/components/NotificationPanel";
import { PauseDialog } from "@/components/PauseDialog";
import { mockProjects } from "@/data/mock-data";

interface HeaderProps {
  onLogout: () => void;
}

export function Header({ onLogout }: HeaderProps) {
  const [location, navigate] = useLocation();
  const [pauseOpen, setPauseOpen] = useState(false);

  const allTasks = mockProjects.flatMap((p) => p.tasks);
  const totalTasks = allTasks.length;
  const flexibleTaskCount = allTasks.filter((t) => t.followPause !== false).length;

  const workspace = location.startsWith("/personal") ? "personal" : "projects";

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-violet-600">
              <Zap className="h-4 w-4 text-white" strokeWidth={2.5} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[15px] font-semibold tracking-tight text-foreground">
                  FocusFlow
                </span>
                <Badge variant="secondary" className="h-4 px-1.5 text-[10px] font-medium uppercase tracking-wider">
                  Beta
                </Badge>
              </div>
              <p className="text-[11px] text-muted-foreground leading-none mt-0.5">
                Do one thing at a time
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <Button
              variant="outline"
              size="sm"
              className="h-8 gap-1.5 text-xs font-medium text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800 hover:bg-amber-50 dark:hover:bg-amber-950"
              onClick={() => setPauseOpen(true)}
            >
              <PauseCircle className="h-3.5 w-3.5" />
              Pause Work
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-8 gap-1.5 text-sm font-medium">
                  {workspace === "projects" ? "Projects" : "Personal"}
                  <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-44">
                <DropdownMenuItem
                  onClick={() => navigate("/dashboard")}
                  className="flex items-center justify-between"
                >
                  Projects
                  {workspace === "projects" && (
                    <div className="h-1.5 w-1.5 rounded-full bg-violet-500" />
                  )}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => navigate("/personal")}
                  className="flex items-center justify-between"
                >
                  Personal
                  {workspace === "personal" && (
                    <div className="h-1.5 w-1.5 rounded-full bg-violet-500" />
                  )}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <NotificationPanel />

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8" title="Account">
                  <User className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-44">
                <DropdownMenuItem onClick={() => navigate("/settings")}>
                  Settings
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={onLogout} className="text-red-600 dark:text-red-400">
                  <LogOut className="h-3.5 w-3.5 mr-1.5" />
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      <PauseDialog
        open={pauseOpen}
        onOpenChange={setPauseOpen}
        totalTasks={totalTasks}
        flexibleTaskCount={flexibleTaskCount}
      />
    </>
  );
}