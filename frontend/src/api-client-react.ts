const BASE_URL = import.meta.env.VITE_API_URL || 'https://todo-focus-backend.aman-mohammed979.workers.dev';
let storedApiKey: string | null = null;

export function setApiKey(key: string | null) {
  storedApiKey = key;
}

export function getStoredApiKey(): string | null {
  return storedApiKey;
}

export type User = {
  id: string;
  name: string;
  email: string;
};

export type Project = {
  id: string;
  name: string;
  description?: string | null;
  priority?: string;
  color?: string;
  tasks?: Task[];
};

export type Task = {
  id: string;
  project_id?: string | null;
  title: string;
  description?: string | null;
  status?: string;
  priority?: string;
  due_date?: string | null;
  due_time?: string | null;
  stage?: string;
  estimated_minutes?: number | null;
  follow_pause?: number;
  subtasks?: Subtask[];
};

export type Subtask = {
  id: string;
  task_id: string;
  title: string;
  completed?: number;
};

export type PersonalTask = {
  id: string;
  title: string;
  due_date?: string | null;
  due_time?: string | null;
  priority?: string;
  completed?: number;
};

export type PausePeriod = {
  id: string;
  start_date: string;
  end_date: string;
};

async function json<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`HTTP ${response.status}: ${text}`);
  }
  return (await response.json()) as T;
}

const fetchOpts = (opts: RequestInit = {}): RequestInit => ({
  credentials: 'include',
  ...opts,
  headers: {
    'Content-Type': 'application/json',
    ...opts.headers,
  },
});

export const api = {
  signUp: async (data: { email: string; password: string; name?: string }): Promise<{ user: User }> =>
    json(await fetch(`${BASE_URL}/api/auth/sign-up/email`, fetchOpts({ 
      method: 'POST', 
      body: JSON.stringify(data) 
    }))),

  signIn: async (data: { email: string; password: string }): Promise<{ user: User }> =>
    json(await fetch(`${BASE_URL}/api/auth/sign-in/email`, fetchOpts({ 
      method: 'POST', 
      body: JSON.stringify(data) 
    }))),

  getSession: async (): Promise<{ user: User } | null> => {
    try {
      const res = await fetch(`${BASE_URL}/api/auth/session`, fetchOpts());
      if (!res.ok) return null;
      return json(res);
    } catch {
      return null;
    }
  },

  logout: async (): Promise<{ success: boolean }> => 
    json(await fetch(`${BASE_URL}/api/auth/sign-out`, fetchOpts({ method: 'POST' }))),

  getMe: async (): Promise<{ user: User }> => 
    json(await fetch(`${BASE_URL}/api/auth/me`, fetchOpts())),

  getProjects: async (): Promise<Project[]> => json(await fetch(`${BASE_URL}/api/projects`, fetchOpts())),
  createProject: async (data: { name: string; description?: string; priority?: string; color?: string }): Promise<Project> =>
    json(await fetch(`${BASE_URL}/api/projects`, fetchOpts({ method: 'POST', body: JSON.stringify(data) }))),
  updateProject: async (id: string, data: Partial<Omit<Project, 'id'>>): Promise<Project> =>
    json(await fetch(`${BASE_URL}/api/projects/${id}`, fetchOpts({ method: 'PATCH', body: JSON.stringify(data) }))),
  deleteProject: async (id: string): Promise<{ success: boolean }> => 
    json(await fetch(`${BASE_URL}/api/projects/${id}`, fetchOpts({ method: 'DELETE' }))),

  createTask: async (data: any): Promise<Task> => 
    json(await fetch(`${BASE_URL}/api/tasks`, fetchOpts({ method: 'POST', body: JSON.stringify(data) }))),
  updateTask: async (id: string, data: any): Promise<Task> => 
    json(await fetch(`${BASE_URL}/api/tasks/${id}`, fetchOpts({ method: 'PATCH', body: JSON.stringify(data) }))),
  deleteTask: async (id: string): Promise<{ success: boolean }> => 
    json(await fetch(`${BASE_URL}/api/tasks/${id}`, fetchOpts({ method: 'DELETE' }))),

  createSubtask: async (taskId: string, title: string): Promise<Subtask> =>
    json(await fetch(`${BASE_URL}/api/subtasks`, fetchOpts({ method: 'POST', body: JSON.stringify({ task_id: taskId, title }) }))),
  updateSubtask: async (id: string, data: Partial<Subtask>): Promise<Subtask> =>
    json(await fetch(`${BASE_URL}/api/subtasks/${id}`, fetchOpts({ method: 'PATCH', body: JSON.stringify(data) }))),
  deleteSubtask: async (id: string): Promise<{ success: boolean }> => 
    json(await fetch(`${BASE_URL}/api/subtasks/${id}`, fetchOpts({ method: 'DELETE' }))),

  getPersonalTasks: async (): Promise<PersonalTask[]> => json(await fetch(`${BASE_URL}/api/personal-tasks`, fetchOpts())),
  createPersonalTask: async (data: { title: string; due_date?: string; due_time?: string; priority?: string }): Promise<PersonalTask> =>
    json(await fetch(`${BASE_URL}/api/personal-tasks`, fetchOpts({ method: 'POST', body: JSON.stringify(data) }))),
  updatePersonalTask: async (id: string, data: any): Promise<PersonalTask> =>
    json(await fetch(`${BASE_URL}/api/personal-tasks/${id}`, fetchOpts({ method: 'PATCH', body: JSON.stringify(data) }))),
  deletePersonalTask: async (id: string): Promise<{ success: boolean }> => 
    json(await fetch(`${BASE_URL}/api/personal-tasks/${id}`, fetchOpts({ method: 'DELETE' }))),

  getPausePeriods: async (): Promise<PausePeriod[]> => json(await fetch(`${BASE_URL}/api/pause`, fetchOpts())),
  createPausePeriod: async (data: { start_date: string; end_date: string }): Promise<PausePeriod> =>
    json(await fetch(`${BASE_URL}/api/pause`, fetchOpts({ method: 'POST', body: JSON.stringify(data) }))),
  deletePausePeriod: async (id: string): Promise<{ success: boolean }> => 
    json(await fetch(`${BASE_URL}/api/pause/${id}`, fetchOpts({ method: 'DELETE' }))),

  getApiKey: async (): Promise<{ hasKey: boolean; created_at?: string }> => 
    json(await fetch(`${BASE_URL}/api/api-key`, fetchOpts())),
  generateApiKey: async (): Promise<{ apiKey: string }> => 
    json(await fetch(`${BASE_URL}/api/api-key/generate`, fetchOpts({ method: 'POST' }))),

  passkeyRegister: async (data: { name?: string }): Promise<{ options: any }> =>
    json(await fetch(`${BASE_URL}/api/auth/passkey/register`, fetchOpts({ 
      method: 'POST', 
      body: JSON.stringify(data) 
    }))),

  passkeyVerify: async (data: any): Promise<{ success: boolean }> =>
    json(await fetch(`${BASE_URL}/api/auth/passkey/register/verify`, fetchOpts({ 
      method: 'POST', 
      body: JSON.stringify(data) 
    }))),

  passkeySignIn: async (): Promise<{ options: any }> =>
    json(await fetch(`${BASE_URL}/api/auth/passkey/sign-in`, fetchOpts())),

  passkeyVerifySignIn: async (data: any): Promise<{ success: boolean }> =>
    json(await fetch(`${BASE_URL}/api/auth/passkey/sign-in/verify`, fetchOpts({ 
      method: 'POST', 
      body: JSON.stringify(data) 
    }))),
};