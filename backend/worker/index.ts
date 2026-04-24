import { Hono } from 'hono';
import { createAuth } from './auth';

type Env = {
  DB: D1Database;
  KV: KVNamespace;
  BETTER_AUTH_SECRET: string;
  BETTER_AUTH_URL: string;
};

const app = new Hono<{ Bindings: Env }>();

// CORS middleware
app.use('*', async (c, next) => {
  await next();
  if (c.res) {
    const origin = c.req.header('Origin') || '*';
    c.res.headers.set('Access-Control-Allow-Origin', origin);
    c.res.headers.set('Access-Control-Allow-Credentials', 'true');
    c.res.headers.set('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE, OPTIONS');
    c.res.headers.set('Access-Control-Allow-Headers', 'Content-Type, Cookie, Authorization, X-API-Key');
  }
});

// Debug endpoint (no auth needed)
app.get('/api/debug', async (c) => {
  try {
    const users = await c.env.DB.prepare('SELECT * FROM user').all();
    const sessions = await c.env.DB.prepare('SELECT * FROM session').all();
    const cookies = c.req.header('Cookie');
    
    return c.json({ 
      debug: true, 
      userCount: users.results?.length ?? 0,
      sessions: sessions.results?.length ?? 0,
      lastSession: sessions.results?.[0],
      receivedCookies: cookies
    });
  } catch (e) {
    return c.json({ debug: true, error: (e as Error).message, userCount: 0 });
  }
});

// Test - create user directly
app.post('/api/test-create-user', async (c) => {
  try {
    const body = await c.req.json().catch(() => ({ email: 'test@example.com', password: 'Test123!', name: 'Test' }));
    const { email, password, name } = body;
    
    // Simple hash for testing (in real app use bcrypt)
    const passwordHash = Array.from(new TextEncoder().encode(password))
      .reduce((h, b) => ((h << 5) - h) + b, 0).toString(16);
    
    const userId = crypto.randomUUID();
    const now = Date.now();
    
    await c.env.DB.prepare(
      'INSERT INTO user (id, name, email, email_verified, created_at, updated_at) VALUES (?, ?, ?, 0, ?, ?)'
    ).bind(userId, name, email, now, now).run();
    
    // Create session
    const sessionId = crypto.randomUUID();
    const expiresAt = now + (30 * 24 * 60 * 60 * 1000); // 30 days
    await c.env.DB.prepare(
      'INSERT INTO session (id, expires_at, token, created_at, updated_at, user_id) VALUES (?, ?, ?, ?, ?, ?)'
    ).bind(sessionId, expiresAt, sessionId, now, now, userId).run();
    
    return c.json({ 
      success: true, 
      user: { id: userId, name, email },
      token: sessionId,
      cookie: `better-auth-session=${sessionId}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${30 * 24 * 60 * 60}`
    });
  } catch (e) {
    return c.json({ success: false, error: (e as Error).message }, 500);
  }
});

// Schema init endpoint (temporary - for setup only)
app.post('/api/init-schema', async (c) => {
  const schema = `
    CREATE TABLE IF NOT EXISTS user (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      email_verified INTEGER DEFAULT 0,
      image TEXT,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS session (
      id TEXT PRIMARY KEY,
      expires_at INTEGER NOT NULL,
      token TEXT NOT NULL UNIQUE,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      ip_address TEXT,
      user_agent TEXT,
      user_id TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS account (
      id TEXT PRIMARY KEY,
      account_id TEXT NOT NULL,
      provider_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      access_token TEXT,
      refresh_token TEXT,
      id_token TEXT,
      access_token_expires_at INTEGER,
      refresh_token_expires_at INTEGER,
      scope TEXT,
      password TEXT,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS verification (
      id TEXT PRIMARY KEY,
      identifier TEXT NOT NULL,
      value TEXT NOT NULL,
      expires_at INTEGER NOT NULL,
      created_at INTEGER
    );
    CREATE TABLE IF NOT EXISTS passkey (
      id TEXT PRIMARY KEY,
      name TEXT,
      credential_id TEXT NOT NULL UNIQUE,
      public_key TEXT NOT NULL,
      counter INTEGER DEFAULT 0,
      device_type TEXT,
      backed_up INTEGER DEFAULT 0,
      created_at INTEGER NOT NULL,
      user_id TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS auth_token (
      id TEXT PRIMARY KEY,
      token TEXT NOT NULL UNIQUE,
      user_id TEXT NOT NULL,
      expires_at INTEGER NOT NULL,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS projects (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      priority TEXT DEFAULT 'medium',
      color TEXT DEFAULT 'blue',
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS tasks (
      id TEXT PRIMARY KEY,
      project_id TEXT,
      title TEXT NOT NULL,
      description TEXT,
      status TEXT DEFAULT 'pending',
      stage TEXT DEFAULT 'planning',
      priority TEXT DEFAULT 'medium',
      due_date TEXT,
      due_time TEXT,
      estimated_minutes INTEGER,
      follow_pause INTEGER DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now')),
      completed_at TEXT
    );
    CREATE TABLE IF NOT EXISTS subtasks (
      id TEXT PRIMARY KEY,
      task_id TEXT,
      title TEXT NOT NULL,
      completed INTEGER DEFAULT 0
    );
    CREATE TABLE IF NOT EXISTS personal_tasks (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      due_date TEXT,
      due_time TEXT,
      priority TEXT DEFAULT 'medium',
      completed INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS pause_periods (
      id TEXT PRIMARY KEY,
      start_date TEXT NOT NULL,
      end_date TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS api_keys (
      id TEXT PRIMARY KEY,
      key_hash TEXT NOT NULL UNIQUE,
      created_at TEXT DEFAULT (datetime('now')),
      revoked INTEGER DEFAULT 0
    );
  `;
  
  const statements = schema.split(';').filter(s => s.trim());
  for (const stmt of statements) {
    if (stmt.trim()) {
      await c.env.DB.prepare(stmt).run();
    }
  }
  return c.json({ success: true, tablesCreated: statements.length });
});

// ============ Better-Auth Handler ============
// Session endpoint (must be before catch-all) - uses manual session table
app.get('/api/auth/session', async (c) => {
  const userId = await authenticate(c as any);
  if (!userId) {
    return c.json({ user: null });
  }
  
  try {
    const user = await c.env.DB.prepare('SELECT id, name, email FROM user WHERE id = ?').bind(userId).first<{ id: string; name: string; email: string }>();
    return c.json({ user });
  } catch {
    return c.json({ user: null });
  }
});

// Catch-all for better-auth routes
app.all('/api/auth/*', async (c) => {
  const auth = createAuth(c.env as Env);
  return auth.handler(c.req.raw);
});

// ============ Auth Helper ============
const authenticate = async (c: { env: Env; req: { header: (name: string) => string | null } }): Promise<string | null> => {
  // First try better-auth session
  const auth = createAuth(c.env as Env);
  try {
    const session = await auth.api.getSession({ headers: c.req.header() });
    if (session?.user?.id) return session.user.id;
  } catch {
    // Ignore better-auth errors
  }
  
  // Try API key
  const apiKey = c.req.header('X-API-Key') || c.req.header('Authorization')?.replace('Bearer ', '');
  if (apiKey) {
    try {
      const session = await auth.api.getSession({ headers: { authorization: `Bearer ${apiKey}` } });
      if (session?.user?.id) return session.user.id;
    } catch {
      // Ignore
    }
  }
  
  // Try manual session from cookie (better-auth uses different cookie names)
  const cookieHeader = c.req.header('Cookie') ?? '';
  // Try multiple possible cookie names
  const cookieNames = ['better-auth.session_token', 'better-auth-session', 'session'];
  for (const cookieName of cookieNames) {
    const match = cookieHeader.match(new RegExp(`${cookieName}=([^;]+)`));
    if (match) {
      const token = match[1];
      try {
        const now = Date.now();
        const sessionRow = await c.env.DB.prepare(
          'SELECT user_id FROM session WHERE token = ? AND expires_at > ?'
        ).bind(token, now).first<{ user_id: string }>();
        if (sessionRow?.user_id) return sessionRow.user_id;
      } catch {
        // Ignore
      }
    }
  }
  
  return null;
};

// ============ Helper Functions ============
const generateId = () => crypto.randomUUID();

const hashKey = async (key: string): Promise<string> => {
  try {
    const encoder = new TextEncoder();
    const data = encoder.encode(key);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  } catch {
    return key.split('').reduce((h, c) => ((h << 5) - h) + c.charCodeAt(0) | 0, 0).toString(16);
  }
};

const isInPause = (pause: { start_date: string; end_date: string }): boolean => {
  const now = new Date();
  const start = new Date(pause.start_date);
  const end = new Date(pause.end_date);
  return now >= start && now <= end;
};

const shiftDate = (dateStr: string, days: number): string => {
  const date = new Date(dateStr);
  date.setDate(date.getDate() + days);
  return date.toISOString().split('T')[0];
};

const applyPauseToTask = (task: Record<string, unknown>, pausePeriods: { start_date: string; end_date: string }[]): Record<string, unknown> => {
  if (!task.due_date || task.follow_pause !== 1) return task;
  
  const activePause = pausePeriods.find(p => isInPause(p));
  if (!activePause) return task;

  const pauseStart = new Date(activePause.start_date);
  const pauseEnd = new Date(activePause.end_date);
  const taskDue = new Date(task.due_date as string);
  
  if (taskDue >= pauseStart && taskDue <= pauseEnd) {
    const daysPaused = Math.ceil((pauseEnd.getTime() - taskDue.getTime()) / (1000 * 60 * 60 * 24));
    return { ...task, effective_due_date: shiftDate(task.due_date as string, daysPaused) };
  }
  return task;
};

// ============ API Routes (with auth) ============

// Get current user
app.get('/api/auth/me', async (c) => {
  const userId = await authenticate(c as any);
  if (!userId) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  const user = await c.env.DB.prepare('SELECT id, name, email FROM user WHERE id = ?').bind(userId).first() as { id: string; name: string; email: string } | undefined;
  if (!user) {
    return c.json({ error: 'User not found' }, 404);
  }
  return c.json({ user });
});

// Projects
app.get('/api/projects', async (c) => {
  const userId = await authenticate(c as any);
  if (!userId) return c.json({ error: 'Unauthorized' }, 401);

  const projects = await c.env.DB.prepare('SELECT * FROM projects ORDER BY created_at DESC').all();
  
  const results = [];
  for (const project of projects.results) {
    const tasks = await c.env.DB.prepare('SELECT * FROM tasks WHERE project_id = ?').bind(project.id).all();
    const pausePeriods = await c.env.DB.prepare('SELECT * FROM pause_periods').all() as { results: { start_date: string; end_date: string }[] };
    
    const tasksWithSubtasks = await Promise.all(
      (tasks.results as Record<string, unknown>[]).map(async (task) => {
        const taskWithPause = applyPauseToTask(task, pausePeriods.results);
        const subtasks = await c.env.DB.prepare('SELECT * FROM subtasks WHERE task_id = ?').bind(task.id).all();
        return { ...taskWithPause, subtasks: subtasks.results };
      })
    );
    
    results.push({ ...project, tasks: tasksWithSubtasks });
  }
  
  return c.json(results);
});

app.post('/api/projects', async (c) => {
  const userId = await authenticate(c as any);
  if (!userId) return c.json({ error: 'Unauthorized' }, 401);

  const body = await c.req.json();
  const { name, description, priority = 'medium', color = 'blue' } = body;
  if (!name) return c.json({ error: 'Name required' }, 400);

  try {
    const id = generateId();
    const descriptionValue = description || null;
    await c.env.DB.prepare(
      'INSERT INTO projects (id, name, description, priority, color) VALUES (?, ?, ?, ?, ?)'
    ).bind(id, name, descriptionValue, priority, color).run();

    const project = await c.env.DB.prepare('SELECT * FROM projects WHERE id = ?').bind(id).first();
    return c.json({ ...project, tasks: [] }, 201);
  } catch (e) {
    return c.json({ error: (e as Error).message }, 500);
  }
});

app.get('/api/projects/:id', async (c) => {
  const userId = await authenticate(c as any);
  if (!userId) return c.json({ error: 'Unauthorized' }, 401);

  const id = c.req.param('id');
  const project = await c.env.DB.prepare('SELECT * FROM projects WHERE id = ?').bind(id).first();
  if (!project) return c.json({ error: 'Project not found' }, 404);

  const tasks = await c.env.DB.prepare('SELECT * FROM tasks WHERE project_id = ?').bind(id).all();
  const pausePeriods = await c.env.DB.prepare('SELECT * FROM pause_periods').all() as { results: { start_date: string; end_date: string }[] };
  
  const tasksWithSubtasks = await Promise.all(
    (tasks.results as Record<string, unknown>[]).map(async (task) => {
      const taskWithPause = applyPauseToTask(task, pausePeriods.results);
      const subtasks = await c.env.DB.prepare('SELECT * FROM subtasks WHERE task_id = ?').bind(task.id).all();
      return { ...taskWithPause, subtasks: subtasks.results };
    })
  );

  return c.json({ ...project, tasks: tasksWithSubtasks });
});

app.patch('/api/projects/:id', async (c) => {
  const userId = await authenticate(c as any);
  if (!userId) return c.json({ error: 'Unauthorized' }, 401);

  const id = c.req.param('id');
  const body = await c.req.json();
  
  const updates: string[] = [];
  const values: unknown[] = [];

  if (body.name !== undefined) { updates.push('name = ?'); values.push(body.name); }
  if (body.description !== undefined) { updates.push('description = ?'); values.push(body.description); }
  if (body.priority !== undefined) { updates.push('priority = ?'); values.push(body.priority); }
  if (body.color !== undefined) { updates.push('color = ?'); values.push(body.color); }

  if (updates.length === 0) return c.json({ error: 'No fields to update' }, 400);

  values.push(id);
  await c.env.DB.prepare(`UPDATE projects SET ${updates.join(', ')}, updated_at = datetime('now') WHERE id = ?`).bind(...values).run();

  const project = await c.env.DB.prepare('SELECT * FROM projects WHERE id = ?').bind(id).first();
  return c.json(project);
});

app.delete('/api/projects/:id', async (c) => {
  const userId = await authenticate(c as any);
  if (!userId) return c.json({ error: 'Unauthorized' }, 401);

  const id = c.req.param('id');
  await c.env.DB.prepare('DELETE FROM projects WHERE id = ?').bind(id).run();
  return c.json({ success: true });
});

// Tasks
app.get('/api/tasks', async (c) => {
  const userId = await authenticate(c as any);
  if (!userId) return c.json({ error: 'Unauthorized' }, 401);

  const projectId = c.req.query('project_id');
  let query = 'SELECT * FROM tasks';
  const params: string[] = [];
  
  if (projectId) {
    query += ' WHERE project_id = ?';
    params.push(projectId);
  }
  
  query += ' ORDER BY created_at DESC';
  const tasks = await c.env.DB.prepare(query).bind(...params).all();

  const pausePeriods = await c.env.DB.prepare('SELECT * FROM pause_periods').all() as { results: { start_date: string; end_date: string }[] };
  
  const tasksWithSubtasks = await Promise.all(
    (tasks.results as Record<string, unknown>[]).map(async (task) => {
      const taskWithPause = applyPauseToTask(task, pausePeriods.results);
      const subtasks = await c.env.DB.prepare('SELECT * FROM subtasks WHERE task_id = ?').bind(task.id).all();
      return { ...taskWithPause, subtasks: subtasks.results };
    })
  );

  return c.json(tasksWithSubtasks);
});

app.post('/api/tasks', async (c) => {
  const userId = await authenticate(c as any);
  if (!userId) return c.json({ error: 'Unauthorized' }, 401);

  const body = await c.req.json();
  const { project_id, title, description, status = 'pending', priority = 'medium', due_date, due_time, stage = 'planning', estimated_minutes, follow_pause = true } = body;
  
  if (!title) return c.json({ error: 'Title required' }, 400);

  const id = generateId();
  await c.env.DB.prepare(
    `INSERT INTO tasks (id, project_id, title, description, status, priority, due_date, due_time, stage, estimated_minutes, follow_pause) 
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).bind(id, project_id || null, title, description || null, status, priority, due_date || null, due_time || null, stage, estimated_minutes || null, follow_pause ? 1 : 0).run();

  const task = await c.env.DB.prepare('SELECT * FROM tasks WHERE id = ?').bind(id).first();
  return c.json({ ...task, subtasks: [] }, 201);
});

app.patch('/api/tasks/:id', async (c) => {
  const userId = await authenticate(c as any);
  if (!userId) return c.json({ error: 'Unauthorized' }, 401);

  const id = c.req.param('id');
  const body = await c.req.json();

  const task = await c.env.DB.prepare('SELECT * FROM tasks WHERE id = ?').bind(id).first();
  if (!task) return c.json({ error: 'Task not found' }, 404);

  const updates: string[] = [];
  const values: unknown[] = [];

  if (body.title !== undefined) { updates.push('title = ?'); values.push(body.title); }
  if (body.description !== undefined) { updates.push('description = ?'); values.push(body.description); }
  if (body.status !== undefined) { 
    updates.push('status = ?'); 
    values.push(body.status);
    if (body.status === 'done') {
      updates.push('completed_at = ?');
      values.push(new Date().toISOString());
    }
  }
  if (body.priority !== undefined) { updates.push('priority = ?'); values.push(body.priority); }
  if (body.due_date !== undefined) { updates.push('due_date = ?'); values.push(body.due_date); }
  if (body.due_time !== undefined) { updates.push('due_time = ?'); values.push(body.due_time); }
  if (body.stage !== undefined) { updates.push('stage = ?'); values.push(body.stage); }
  if (body.estimated_minutes !== undefined) { updates.push('estimated_minutes = ?'); values.push(body.estimated_minutes); }
  if (body.follow_pause !== undefined) { updates.push('follow_pause = ?'); values.push(body.follow_pause ? 1 : 0); }

  if (updates.length === 0) return c.json({ error: 'No fields to update' }, 400);

  values.push(id);
  await c.env.DB.prepare(`UPDATE tasks SET ${updates.join(', ')} WHERE id = ?`).bind(...values).run();

  const subtasks = await c.env.DB.prepare('SELECT * FROM subtasks WHERE task_id = ?').bind(id).all();
  const updated = await c.env.DB.prepare('SELECT * FROM tasks WHERE id = ?').bind(id).first();
  return c.json({ ...updated, subtasks: subtasks.results });
});

app.delete('/api/tasks/:id', async (c) => {
  const userId = await authenticate(c as any);
  if (!userId) return c.json({ error: 'Unauthorized' }, 401);

  const id = c.req.param('id');
  await c.env.DB.prepare('DELETE FROM tasks WHERE id = ?').bind(id).run();
  return c.json({ success: true });
});

// Subtasks
app.get('/api/subtasks', async (c) => {
  const userId = await authenticate(c as any);
  if (!userId) return c.json({ error: 'Unauthorized' }, 401);

  const taskId = c.req.query('task_id');
  if (!taskId) return c.json({ error: 'task_id required' }, 400);

  const subtasks = await c.env.DB.prepare('SELECT * FROM subtasks WHERE task_id = ?').bind(taskId).all();
  return c.json(subtasks.results);
});

app.post('/api/subtasks', async (c) => {
  const userId = await authenticate(c as any);
  if (!userId) return c.json({ error: 'Unauthorized' }, 401);

  const body = await c.req.json();
  const { task_id, title } = body;
  if (!task_id || !title) return c.json({ error: 'Task ID and title required' }, 400);

  const id = generateId();
  await c.env.DB.prepare('INSERT INTO subtasks (id, task_id, title) VALUES (?, ?, ?)').bind(id, task_id, title).run();

  const subtask = await c.env.DB.prepare('SELECT * FROM subtasks WHERE id = ?').bind(id).first();
  return c.json(subtask, 201);
});

app.patch('/api/subtasks/:id', async (c) => {
  const userId = await authenticate(c as any);
  if (!userId) return c.json({ error: 'Unauthorized' }, 401);

  const id = c.req.param('id');
  const body = await c.req.json();

  const updates: string[] = [];
  const values: unknown[] = [];

  if (body.title !== undefined) { updates.push('title = ?'); values.push(body.title); }
  if (body.completed !== undefined) { updates.push('completed = ?'); values.push(body.completed ? 1 : 0); }

  if (updates.length === 0) return c.json({ error: 'No fields to update' }, 400);

  values.push(id);
  await c.env.DB.prepare(`UPDATE subtasks SET ${updates.join(', ')} WHERE id = ?`).bind(...values).run();

  const subtask = await c.env.DB.prepare('SELECT * FROM subtasks WHERE id = ?').bind(id).first();
  return c.json(subtask);
});

app.delete('/api/subtasks/:id', async (c) => {
  const userId = await authenticate(c as any);
  if (!userId) return c.json({ error: 'Unauthorized' }, 401);

  const id = c.req.param('id');
  await c.env.DB.prepare('DELETE FROM subtasks WHERE id = ?').bind(id).run();
  return c.json({ success: true });
});

// Personal Tasks
app.get('/api/personal-tasks', async (c) => {
  const userId = await authenticate(c as any);
  if (!userId) return c.json({ error: 'Unauthorized' }, 401);

  const tasks = await c.env.DB.prepare('SELECT * FROM personal_tasks ORDER BY created_at DESC').all();
  return c.json(tasks.results);
});

app.post('/api/personal-tasks', async (c) => {
  const userId = await authenticate(c as any);
  if (!userId) return c.json({ error: 'Unauthorized' }, 401);

  const body = await c.req.json();
  const { title, due_date, due_time, priority = 'medium' } = body;
  if (!title) return c.json({ error: 'Title required' }, 400);

  const id = generateId();
  await c.env.DB.prepare(
    'INSERT INTO personal_tasks (id, title, due_date, due_time, priority) VALUES (?, ?, ?, ?, ?)'
  ).bind(id, title, due_date || null, due_time || null, priority).run();

  const task = await c.env.DB.prepare('SELECT * FROM personal_tasks WHERE id = ?').bind(id).first();
  return c.json(task, 201);
});

app.patch('/api/personal-tasks/:id', async (c) => {
  const userId = await authenticate(c as any);
  if (!userId) return c.json({ error: 'Unauthorized' }, 401);

  const id = c.req.param('id');
  const body = await c.req.json();

  const updates: string[] = [];
  const values: unknown[] = [];

  if (body.title !== undefined) { updates.push('title = ?'); values.push(body.title); }
  if (body.due_date !== undefined) { updates.push('due_date = ?'); values.push(body.due_date); }
  if (body.due_time !== undefined) { updates.push('due_time = ?'); values.push(body.due_time); }
  if (body.priority !== undefined) { updates.push('priority = ?'); values.push(body.priority); }
  if (body.completed !== undefined) { updates.push('completed = ?'); values.push(body.completed ? 1 : 0); }

  if (updates.length === 0) return c.json({ error: 'No fields to update' }, 400);

  values.push(id);
  await c.env.DB.prepare(`UPDATE personal_tasks SET ${updates.join(', ')} WHERE id = ?`).bind(...values).run();

  const task = await c.env.DB.prepare('SELECT * FROM personal_tasks WHERE id = ?').bind(id).first();
  if (!task) return c.json({ error: 'Task not found' }, 404);
  return c.json(task);
});

app.delete('/api/personal-tasks/:id', async (c) => {
  const userId = await authenticate(c as any);
  if (!userId) return c.json({ error: 'Unauthorized' }, 401);

  const id = c.req.param('id');
  await c.env.DB.prepare('DELETE FROM personal_tasks WHERE id = ?').bind(id).run();
  return c.json({ success: true });
});

// Pause Periods
app.get('/api/pause', async (c) => {
  const userId = await authenticate(c as any);
  if (!userId) return c.json({ error: 'Unauthorized' }, 401);

  const periods = await c.env.DB.prepare('SELECT * FROM pause_periods ORDER BY start_date DESC').all();
  return c.json(periods.results);
});

app.post('/api/pause', async (c) => {
  const userId = await authenticate(c as any);
  if (!userId) return c.json({ error: 'Unauthorized' }, 401);

  const body = await c.req.json();
  const { start_date, end_date } = body;
  if (!start_date || !end_date) return c.json({ error: 'Start date and end date required' }, 400);

  const id = generateId();
  await c.env.DB.prepare('INSERT INTO pause_periods (id, start_date, end_date) VALUES (?, ?, ?)').bind(id, start_date, end_date).run();

  const period = await c.env.DB.prepare('SELECT * FROM pause_periods WHERE id = ?').bind(id).first();
  return c.json(period, 201);
});

app.delete('/api/pause/:id', async (c) => {
  const userId = await authenticate(c as any);
  if (!userId) return c.json({ error: 'Unauthorized' }, 401);

  const id = c.req.param('id');
  await c.env.DB.prepare('DELETE FROM pause_periods WHERE id = ?').bind(id).run();
  return c.json({ success: true });
});

// Notifications
app.get('/api/notifications', async (c) => {
  const userId = await authenticate(c as any);
  if (!userId) return c.json({ error: 'Unauthorized' }, 401);

  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const tasks = await c.env.DB.prepare(`
    SELECT t.*, p.name as project_name
    FROM tasks t
    LEFT JOIN projects p ON t.project_id = p.id
    WHERE t.due_date IS NOT NULL 
    AND t.status != 'done'
  `).all() as { results: Array<Record<string, unknown>> };

  const pausePeriods = await c.env.DB.prepare('SELECT * FROM pause_periods').all() as { results: { start_date: string; end_date: string }[] };
  const activePause = pausePeriods.results.find(p => isInPause(p));

  const overdue: unknown[] = [];
  const dueSoon: unknown[] = [];

  for (const task of tasks.results) {
    let effectiveDueDate = task.due_date as string;

    if (activePause && task.follow_pause === 1) {
      const pauseStart = new Date(activePause.start_date);
      const pauseEnd = new Date(activePause.end_date);
      const taskDue = new Date(task.due_date as string);
      
      if (taskDue >= pauseStart && taskDue <= pauseEnd) {
        const daysPaused = Math.ceil((pauseEnd.getTime() - taskDue.getTime()) / (1000 * 60 * 60 * 24));
        effectiveDueDate = shiftDate(task.due_date as string, daysPaused);
      }
    }

    const dueDate = new Date(effectiveDueDate);
    dueDate.setHours(23, 59, 59, 999);

    if (dueDate < now) {
      overdue.push({ ...task, effective_due_date: effectiveDueDate });
    } else if (dueDate <= tomorrow) {
      dueSoon.push({ ...task, effective_due_date: effectiveDueDate });
    }
  }

  return c.json({ overdue, dueSoon });
});

// API Key endpoints
app.get('/api/api-key', async (c) => {
  const userId = await authenticate(c as any);
  if (!userId) return c.json({ error: 'Unauthorized' }, 401);

  const keyRecord = await c.env.DB.prepare(
    'SELECT id, created_at FROM api_keys WHERE revoked = 0 ORDER BY created_at DESC LIMIT 1'
  ).first() as { id: string; created_at: string } | undefined;

  if (!keyRecord) return c.json({ hasKey: false });

  return c.json({ hasKey: true, created_at: keyRecord.created_at });
});

app.post('/api/api-key/generate', async (c) => {
  const userId = await authenticate(c as any);
  if (!userId) return c.json({ error: 'Unauthorized' }, 401);

  const existing = await c.env.DB.prepare('SELECT * FROM api_keys WHERE revoked = 0').all();
  for (const key of existing.results as { id: string }[]) {
    await c.env.DB.prepare('UPDATE api_keys SET revoked = 1 WHERE id = ?').bind(key.id).run();
  }

  const apiKey = `tk_${generateId()}`;
  const keyHash = await hashKey(apiKey);

  const id = generateId();
  await c.env.DB.prepare('INSERT INTO api_keys (id, key_hash) VALUES (?, ?)').bind(id, keyHash).run();

  await c.env.KV.put(`apikey:${keyHash}`, userId, { expirationTtl: 60 * 60 * 24 * 365 });

  return c.json({ apiKey });
});

// ============ MCP Routes ============
const authenticateMcp = async (c: { env: Env; req: { header: (name: string) => string | null } }): Promise<string | null> => {
  const apiKey = c.req.header('X-API-Key') || c.req.header('Authorization')?.replace('Bearer ', '');
  if (!apiKey) return null;

  const keyHash = await hashKey(apiKey);
  const userId = await c.env.KV.get(`apikey:${keyHash}`);
  return userId;
};

app.post('/mcp', async (c) => {
  const userId = await authenticateMcp(c as any);
  if (!userId) {
    return c.json({ success: false, error: 'Unauthorized - invalid or missing API key' }, 401);
  }

  const body = await c.req.json();
  const { action, data } = body;

  if (!action) {
    return c.json({ success: false, error: 'action is required' }, 400);
  }

  try {
    switch (action) {
      case 'projects.list': {
        const projects = await c.env.DB.prepare('SELECT * FROM projects ORDER BY created_at DESC').all();
        return c.json({ success: true, data: projects.results });
      }

      case 'projects.create': {
        const { name, description, priority = 'medium', color = 'blue' } = data || {};
        if (!name) return c.json({ success: false, error: 'name is required' }, 400);
        
        const id = generateId();
        await c.env.DB.prepare(
          'INSERT INTO projects (id, name, description, priority, color) VALUES (?, ?, ?, ?, ?)'
        ).bind(id, name, description || null, priority, color).run();
        
        const project = await c.env.DB.prepare('SELECT * FROM projects WHERE id = ?').bind(id).first();
        return c.json({ success: true, data: project });
      }

      case 'projects.delete': {
        const { id } = data || {};
        if (!id) return c.json({ success: false, error: 'id is required' }, 400);
        
        await c.env.DB.prepare('DELETE FROM projects WHERE id = ?').bind(id).run();
        return c.json({ success: true, data: { id } });
      }

      case 'tasks.list': {
        const projectId = data?.project_id;
        let query = 'SELECT * FROM tasks';
        const params: string[] = [];
        
        if (projectId) {
          query += ' WHERE project_id = ?';
          params.push(projectId);
        }
        
        query += ' ORDER BY created_at DESC';
        const tasks = await c.env.DB.prepare(query).bind(...params).all();
        
        const tasksWithSubtasks = await Promise.all(
          (tasks.results as Record<string, unknown>[]).map(async (task) => {
            const subtasks = await c.env.DB.prepare('SELECT * FROM subtasks WHERE task_id = ?').bind(task.id).all();
            return { ...task, subtasks: subtasks.results };
          })
        );
        
        return c.json({ success: true, data: tasksWithSubtasks });
      }

      case 'tasks.create': {
        const { project_id, title, description, status = 'pending', priority = 'medium', due_date, stage = 'planning', follow_pause = true } = data || {};
        if (!title) return c.json({ success: false, error: 'title is required' }, 400);
        
        const id = generateId();
        await c.env.DB.prepare(
          'INSERT INTO tasks (id, project_id, title, description, status, priority, due_date, stage, follow_pause) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
        ).bind(id, project_id || null, title, description || null, status, priority, due_date || null, stage, follow_pause ? 1 : 0).run();
        
        const task = await c.env.DB.prepare('SELECT * FROM tasks WHERE id = ?').bind(id).first();
        return c.json({ success: true, data: task });
      }

      case 'tasks.update': {
        const { id, ...updates } = data || {};
        if (!id) return c.json({ success: false, error: 'id is required' }, 400);
        
        const setClauses: string[] = [];
        const values: unknown[] = [];
        
        for (const [key, value] of Object.entries(updates)) {
          if (key === 'follow_pause') {
            setClauses.push('follow_pause = ?');
            values.push(value ? 1 : 0);
          } else if (key !== 'id') {
            setClauses.push(`${key} = ?`);
            values.push(value);
          }
        }
        
        if (setClauses.length > 0) {
          values.push(id);
          await c.env.DB.prepare(`UPDATE tasks SET ${setClauses.join(', ')} WHERE id = ?`).bind(...values).run();
        }
        
        const task = await c.env.DB.prepare('SELECT * FROM tasks WHERE id = ?').bind(id).first();
        return c.json({ success: true, data: task });
      }

      case 'tasks.delete': {
        const { id } = data || {};
        if (!id) return c.json({ success: false, error: 'id is required' }, 400);
        
        await c.env.DB.prepare('DELETE FROM tasks WHERE id = ?').bind(id).run();
        return c.json({ success: true, data: { id } });
      }

      case 'subtasks.update': {
        const { id, title, completed } = data || {};
        if (!id) return c.json({ success: false, error: 'id is required' }, 400);
        
        const setClauses: string[] = [];
        const values: unknown[] = [];
        
        if (title !== undefined) { setClauses.push('title = ?'); values.push(title); }
        if (completed !== undefined) { setClauses.push('completed = ?'); values.push(completed ? 1 : 0); }
        
        if (setClauses.length > 0) {
          values.push(id);
          await c.env.DB.prepare(`UPDATE subtasks SET ${setClauses.join(', ')} WHERE id = ?`).bind(...values).run();
        }
        
        const subtask = await c.env.DB.prepare('SELECT * FROM subtasks WHERE id = ?').bind(id).first();
        return c.json({ success: true, data: subtask });
      }

      case 'personal.list': {
        const tasks = await c.env.DB.prepare('SELECT * FROM personal_tasks ORDER BY created_at DESC').all();
        return c.json({ success: true, data: tasks.results });
      }

      case 'personal.create': {
        const { title, due_date, priority = 'medium' } = data || {};
        if (!title) return c.json({ success: false, error: 'title is required' }, 400);
        
        const id = generateId();
        await c.env.DB.prepare(
          'INSERT INTO personal_tasks (id, title, due_date, priority) VALUES (?, ?, ?, ?)'
        ).bind(id, title, due_date || null, priority).run();
        
        const task = await c.env.DB.prepare('SELECT * FROM personal_tasks WHERE id = ?').bind(id).first();
        return c.json({ success: true, data: task });
      }

      case 'personal.update': {
        const { id, ...updates } = data || {};
        if (!id) return c.json({ success: false, error: 'id is required' }, 400);
        
        const setClauses: string[] = [];
        const values: unknown[] = [];
        
        for (const [key, value] of Object.entries(updates)) {
          if (key === 'completed') {
            setClauses.push('completed = ?');
            values.push(value ? 1 : 0);
          } else if (key !== 'id') {
            setClauses.push(`${key} = ?`);
            values.push(value);
          }
        }
        
        if (setClauses.length > 0) {
          values.push(id);
          await c.env.DB.prepare(`UPDATE personal_tasks SET ${setClauses.join(', ')} WHERE id = ?`).bind(...values).run();
        }
        
        const task = await c.env.DB.prepare('SELECT * FROM personal_tasks WHERE id = ?').bind(id).first();
        return c.json({ success: true, data: task });
      }

      case 'pause.set': {
        const { start_date, end_date } = data || {};
        if (!start_date || !end_date) return c.json({ success: false, error: 'start_date and end_date are required' }, 400);
        
        const id = generateId();
        await c.env.DB.prepare('INSERT INTO pause_periods (id, start_date, end_date) VALUES (?, ?, ?)').bind(id, start_date, end_date).run();
        
        const period = await c.env.DB.prepare('SELECT * FROM pause_periods WHERE id = ?').bind(id).first();
        return c.json({ success: true, data: period });
      }

      case 'pause.get': {
        const periods = await c.env.DB.prepare('SELECT * FROM pause_periods ORDER BY start_date DESC').all();
        return c.json({ success: true, data: periods.results });
      }

      case 'notifications.get': {
        const now = new Date();
        const tomorrow = new Date(now);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const tasks = await c.env.DB.prepare(`
          SELECT t.*, p.name as project_name
          FROM tasks t
          LEFT JOIN projects p ON t.project_id = p.id
          WHERE t.due_date IS NOT NULL 
          AND t.status != 'done'
        `).all() as { results: Array<Record<string, unknown>> };

        const pausePeriods = await c.env.DB.prepare('SELECT * FROM pause_periods').all() as { results: { start_date: string; end_date: string }[] };
        const activePause = pausePeriods.results.find(p => isInPause(p));

        const overdue: unknown[] = [];
        const dueSoon: unknown[] = [];

        for (const task of tasks.results) {
          let effectiveDueDate = task.due_date as string;

          if (activePause && task.follow_pause === 1) {
            const pauseStart = new Date(activePause.start_date);
            const pauseEnd = new Date(activePause.end_date);
            const taskDue = new Date(task.due_date as string);
            
            if (taskDue >= pauseStart && taskDue <= pauseEnd) {
              const daysPaused = Math.ceil((pauseEnd.getTime() - taskDue.getTime()) / (1000 * 60 * 60 * 24));
              effectiveDueDate = shiftDate(task.due_date as string, daysPaused);
            }
          }

          const dueDate = new Date(effectiveDueDate);
          dueDate.setHours(23, 59, 59, 999);

          if (dueDate < now) {
            overdue.push({ ...task, effective_due_date: effectiveDueDate });
          } else if (dueDate <= tomorrow) {
            dueSoon.push({ ...task, effective_due_date: effectiveDueDate });
          }
        }

        return c.json({ success: true, data: { overdue, dueSoon } });
      }

      default:
        return c.json({ success: false, error: `Unknown action: ${action}` }, 400);
    }
  } catch (e) {
    return c.json({ success: false, error: e instanceof Error ? e.message : 'Unknown error' }, 500);
  }
});

export default app;