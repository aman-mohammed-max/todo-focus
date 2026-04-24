import { MOCK_DATES } from "@/lib/due-date";

export type Priority = "critical" | "high" | "medium" | "low";
export type TaskStatus = "pending" | "in-progress" | "review" | "done";
export type Stage = "planning" | "in-progress" | "review" | "done";

export interface Subtask {
  id: string;
  title: string;
  completed: boolean;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  stage: Stage;
  priority: Priority;
  subtasks: Subtask[];
  estimatedMinutes?: number;
  dueDate?: string;
  followPause?: boolean;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  priority: Priority;
  color: string;
  tasks: Task[];
  activeTaskId?: string;
}

export interface PersonalTask {
  id: string;
  title: string;
  completed: boolean;
  priority: Priority;
  dueDate?: string;
}

export const mockProjects: Project[] = [
  {
    id: "proj-1",
    name: "API Redesign",
    description: "Refactor REST endpoints to GraphQL with authentication layer",
    priority: "critical",
    color: "violet",
    activeTaskId: "task-1-2",
    tasks: [
      {
        id: "task-1-1",
        title: "Audit existing REST endpoints",
        description: "Map all current endpoints and their usage patterns",
        status: "done",
        stage: "done",
        priority: "high",
        subtasks: [
          { id: "st-1", title: "List all GET endpoints", completed: true },
          { id: "st-2", title: "List all POST endpoints", completed: true },
          { id: "st-3", title: "Document response shapes", completed: true },
        ],
        estimatedMinutes: 90,
        dueDate: MOCK_DATES.overdue,
      },
      {
        id: "task-1-2",
        title: "Design GraphQL schema",
        description: "Define types, queries, and mutations for the new API",
        status: "in-progress",
        stage: "in-progress",
        priority: "critical",
        subtasks: [
          { id: "st-4", title: "Define User type", completed: true },
          { id: "st-5", title: "Define Project type", completed: true },
          { id: "st-6", title: "Define Task mutations", completed: false },
          { id: "st-7", title: "Add pagination support", completed: false },
        ],
        estimatedMinutes: 120,
        dueDate: MOCK_DATES.todayEvening,
      },
      {
        id: "task-1-3",
        title: "Implement authentication middleware",
        description: "JWT + refresh token flow with role-based access",
        status: "pending",
        stage: "planning",
        priority: "critical",
        subtasks: [
          { id: "st-8", title: "Set up JWT library", completed: false },
          { id: "st-9", title: "Build refresh token logic", completed: false },
          { id: "st-10", title: "Write RBAC guards", completed: false },
        ],
        estimatedMinutes: 180,
        dueDate: MOCK_DATES.in2days,
      },
      {
        id: "task-1-4",
        title: "Write resolver tests",
        description: "Unit and integration tests for all resolvers",
        status: "pending",
        stage: "planning",
        priority: "high",
        subtasks: [
          { id: "st-11", title: "Set up test infrastructure", completed: false },
          { id: "st-12", title: "Write query tests", completed: false },
        ],
        estimatedMinutes: 120,
        dueDate: MOCK_DATES.in5days,
      },
      {
        id: "task-1-5",
        title: "Code review & merge",
        description: "Final review pass and merge to main",
        status: "pending",
        stage: "review",
        priority: "medium",
        subtasks: [],
        estimatedMinutes: 60,
        dueDate: MOCK_DATES.in8days,
      },
    ],
  },
  {
    id: "proj-2",
    name: "Dashboard v2",
    description: "New analytics dashboard with real-time metrics and custom widgets",
    priority: "high",
    color: "blue",
    activeTaskId: "task-2-1",
    tasks: [
      {
        id: "task-2-1",
        title: "Build chart components",
        description: "Line, bar, and donut charts using the new design system",
        status: "in-progress",
        stage: "in-progress",
        priority: "high",
        subtasks: [
          { id: "st-13", title: "Line chart component", completed: true },
          { id: "st-14", title: "Bar chart component", completed: false },
          { id: "st-15", title: "Donut chart component", completed: false },
          { id: "st-16", title: "Responsive breakpoints", completed: false },
        ],
        estimatedMinutes: 150,
        dueDate: MOCK_DATES.tomorrow,
      },
      {
        id: "task-2-2",
        title: "Integrate WebSocket data feed",
        description: "Real-time updates via Socket.io",
        status: "pending",
        stage: "planning",
        priority: "high",
        subtasks: [
          { id: "st-17", title: "Set up Socket.io client", completed: false },
          { id: "st-18", title: "Handle reconnection logic", completed: false },
        ],
        estimatedMinutes: 90,
        dueDate: MOCK_DATES.in3days,
      },
      {
        id: "task-2-3",
        title: "Widget drag-and-drop",
        description: "Users can rearrange dashboard widgets",
        status: "pending",
        stage: "planning",
        priority: "medium",
        subtasks: [],
        estimatedMinutes: 120,
        dueDate: MOCK_DATES.in5days,
      },
      {
        id: "task-2-4",
        title: "QA & accessibility audit",
        description: "WCAG 2.1 AA compliance check",
        status: "pending",
        stage: "review",
        priority: "medium",
        subtasks: [],
        estimatedMinutes: 60,
        dueDate: MOCK_DATES.in8days,
      },
    ],
  },
  {
    id: "proj-3",
    name: "Mobile App",
    description: "React Native companion app for iOS and Android",
    priority: "medium",
    color: "emerald",
    activeTaskId: "task-3-1",
    tasks: [
      {
        id: "task-3-1",
        title: "Set up Expo navigation",
        description: "Tab navigator + stack navigator setup",
        status: "in-progress",
        stage: "in-progress",
        priority: "medium",
        subtasks: [
          { id: "st-19", title: "Install expo-router", completed: true },
          { id: "st-20", title: "Define tab structure", completed: false },
          { id: "st-21", title: "Configure deep linking", completed: false },
        ],
        estimatedMinutes: 90,
        dueDate: MOCK_DATES.in2days,
      },
      {
        id: "task-3-2",
        title: "Design system tokens",
        description: "Port web design tokens to mobile",
        status: "done",
        stage: "done",
        priority: "medium",
        subtasks: [
          { id: "st-22", title: "Colors", completed: true },
          { id: "st-23", title: "Typography", completed: true },
        ],
        estimatedMinutes: 45,
      },
      {
        id: "task-3-3",
        title: "Offline sync logic",
        description: "Optimistic updates with conflict resolution",
        status: "pending",
        stage: "planning",
        priority: "low",
        subtasks: [],
        estimatedMinutes: 240,
        dueDate: MOCK_DATES.in8days,
      },
    ],
  },
  {
    id: "proj-4",
    name: "Documentation Site",
    description: "Developer docs built with Docusaurus — API reference and guides",
    priority: "low",
    color: "amber",
    tasks: [
      {
        id: "task-4-1",
        title: "Set up Docusaurus",
        description: "Install, configure, and deploy skeleton",
        status: "done",
        stage: "done",
        priority: "medium",
        subtasks: [
          { id: "st-24", title: "Install Docusaurus", completed: true },
          { id: "st-25", title: "Configure theme", completed: true },
        ],
        estimatedMinutes: 60,
      },
      {
        id: "task-4-2",
        title: "Write API reference pages",
        description: "Auto-generate from OpenAPI spec",
        status: "pending",
        stage: "planning",
        priority: "low",
        subtasks: [],
        estimatedMinutes: 180,
        dueDate: MOCK_DATES.in8days,
      },
    ],
  },
];

export const mockPersonalTasks: PersonalTask[] = [
  { id: "pt-1", title: "Review PR #142 — auth middleware", completed: false, priority: "critical", dueDate: MOCK_DATES.todayMorning },
  { id: "pt-2", title: "Reply to design team Slack thread", completed: false, priority: "high", dueDate: MOCK_DATES.todayEvening },
  { id: "pt-3", title: "Update local dev environment to Node 22", completed: true, priority: "medium" },
  { id: "pt-4", title: "Read GraphQL spec section on subscriptions", completed: false, priority: "medium", dueDate: MOCK_DATES.in5days },
  { id: "pt-5", title: "Renew SSL certificate for staging", completed: false, priority: "high", dueDate: MOCK_DATES.in3days },
  { id: "pt-6", title: "Sync with product team on Q3 roadmap", completed: false, priority: "low", dueDate: MOCK_DATES.in8days },
  { id: "pt-7", title: "Clean up old feature branches", completed: true, priority: "low" },
];

export function getProjectStats(project: Project) {
  const total = project.tasks.length;
  const done = project.tasks.filter((t) => t.status === "done").length;
  const inProgress = project.tasks.filter((t) => t.status === "in-progress").length;
  const pending = project.tasks.filter((t) => t.status === "pending").length;
  const progress = total === 0 ? 0 : Math.round((done / total) * 100);
  return { total, done, inProgress, pending, progress };
}
