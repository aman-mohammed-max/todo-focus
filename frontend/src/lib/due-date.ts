export type Urgency = "overdue" | "due-soon" | "upcoming" | "normal" | "none";

export function getUrgency(dueDate: string | undefined): Urgency {
  if (!dueDate) return "none";
  const now = new Date();
  const due = new Date(dueDate);
  const diffMs = due.getTime() - now.getTime();
  const diffHours = diffMs / (1000 * 60 * 60);
  if (diffHours < 0) return "overdue";
  if (diffHours < 24) return "due-soon";
  if (diffHours < 72) return "upcoming";
  return "normal";
}

export function formatDueLabel(dueDate: string | undefined): string {
  if (!dueDate) return "";
  const now = new Date();
  const due = new Date(dueDate);
  const diffMs = due.getTime() - now.getTime();
  const diffHours = diffMs / (1000 * 60 * 60);
  const diffDays = Math.floor(Math.abs(diffHours) / 24);

  if (diffHours < 0) {
    if (diffDays === 0) return "Overdue today";
    if (diffDays === 1) return "1 day overdue";
    return `${diffDays} days overdue`;
  }
  if (diffHours < 1) return "Due in < 1 hour";
  if (diffHours < 24) return `Due in ${Math.round(diffHours)}h`;
  if (diffDays === 1) return "Due tomorrow";
  if (diffDays < 7) return `Due in ${diffDays} days`;
  return `Due ${due.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`;
}

export function quickDueDate(option: "today" | "tomorrow" | "in3days" | "thisweek"): string {
  const d = new Date();
  if (option === "today") {
    d.setHours(23, 59, 0, 0);
  } else if (option === "tomorrow") {
    d.setDate(d.getDate() + 1);
    d.setHours(23, 59, 0, 0);
  } else if (option === "in3days") {
    d.setDate(d.getDate() + 3);
    d.setHours(23, 59, 0, 0);
  } else {
    // this week = next Sunday
    const day = d.getDay();
    const daysUntilSunday = day === 0 ? 7 : 7 - day;
    d.setDate(d.getDate() + daysUntilSunday);
    d.setHours(23, 59, 0, 0);
  }
  return d.toISOString().slice(0, 16);
}

// Seed mock dates relative to now
const now = new Date();
function offsetISO(days: number, hours = 23, minutes = 59): string {
  const d = new Date(now);
  d.setDate(d.getDate() + days);
  d.setHours(hours, minutes, 0, 0);
  return d.toISOString().slice(0, 16);
}
export const MOCK_DATES = {
  overdue: offsetISO(-1),
  todayMorning: offsetISO(0, 10, 0),
  todayEvening: offsetISO(0, 17, 30),
  tomorrow: offsetISO(1),
  in2days: offsetISO(2),
  in3days: offsetISO(3),
  in5days: offsetISO(5),
  in8days: offsetISO(8),
};
