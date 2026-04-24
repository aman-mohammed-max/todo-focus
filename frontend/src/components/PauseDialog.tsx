import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { PauseCircle, CalendarRange, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface PauseDialogProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  totalTasks: number;
  flexibleTaskCount: number;
}

export function PauseDialog({ open, onOpenChange, totalTasks, flexibleTaskCount }: PauseDialogProps) {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [paused, setPaused] = useState(false);

  const affected = flexibleTaskCount;
  const ignored = totalTasks - flexibleTaskCount;

  const todayStr = new Date().toISOString().slice(0, 10);

  const handlePause = () => {
    setPaused(true);
    setTimeout(() => {
      onOpenChange(false);
      setPaused(false);
      setStartDate("");
      setEndDate("");
    }, 800);
  };

  const valid = startDate && endDate && endDate >= startDate;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-1">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-950">
              <PauseCircle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            </div>
            <DialogTitle>Pause Work</DialogTitle>
          </div>
          <DialogDescription>
            Choose a date range to pause flexible tasks. Fixed tasks stay on schedule.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-2">
          <div className="grid grid-cols-[1fr_auto_1fr] items-end gap-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Start date</Label>
              <Input
                type="date"
                value={startDate}
                min={todayStr}
                onChange={(e) => setStartDate(e.target.value)}
                className="h-9 text-sm"
              />
            </div>
            <ArrowRight className="h-4 w-4 text-muted-foreground mb-2.5" />
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">End date</Label>
              <Input
                type="date"
                value={endDate}
                min={startDate || todayStr}
                onChange={(e) => setEndDate(e.target.value)}
                className="h-9 text-sm"
              />
            </div>
          </div>

          {valid && (
            <div className="rounded-xl border border-border bg-muted/40 p-4 space-y-3">
              <div className="flex items-center gap-2">
                <CalendarRange className="h-4 w-4 text-muted-foreground" />
                <span className="text-xs font-semibold text-foreground">Pause Preview</span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className={cn(
                  "rounded-lg p-3 text-center",
                  "bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900"
                )}>
                  <p className="text-2xl font-bold text-amber-700 dark:text-amber-400">{affected}</p>
                  <p className="text-[10px] font-medium text-amber-600 dark:text-amber-500 mt-0.5">Tasks shifted</p>
                  <p className="text-[9px] text-muted-foreground mt-0.5">Follow pause schedule</p>
                </div>
                <div className={cn(
                  "rounded-lg p-3 text-center",
                  "bg-muted border border-border"
                )}>
                  <p className="text-2xl font-bold text-foreground">{ignored}</p>
                  <p className="text-[10px] font-medium text-muted-foreground mt-0.5">Tasks fixed</p>
                  <p className="text-[9px] text-muted-foreground mt-0.5">Stay on deadline</p>
                </div>
              </div>
              <p className="text-[10px] text-muted-foreground text-center">
                Flexible tasks will have their deadlines pushed forward automatically.
              </p>
            </div>
          )}

          <div className="rounded-lg border border-border bg-card p-3">
            <p className="text-xs font-medium text-foreground mb-2">How tasks are classified</p>
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="text-[9px] h-4 px-1.5 gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-amber-500 inline-block" />
                  Flexible
                </Badge>
                <span className="text-[10px] text-muted-foreground">Follow Pause Schedule is ON</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="text-[9px] h-4 px-1.5 gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-zinc-400 inline-block" />
                  Fixed
                </Badge>
                <span className="text-[10px] text-muted-foreground">Follow Pause Schedule is OFF</span>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            size="sm"
            className="bg-amber-600 hover:bg-amber-700 text-white gap-1.5"
            disabled={!valid || paused}
            onClick={handlePause}
          >
            <PauseCircle className="h-3.5 w-3.5" />
            {paused ? "Pausing…" : "Pause Work"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
