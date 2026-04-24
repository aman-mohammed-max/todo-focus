# Deployment Guide - ADHD Task Manager Backend

## Prerequisites
- Cloudflare account
- Node.js 18+
- `wrangler` CLI installed: `npm install -g wrangler`

## Quick Start

```bash
# Navigate to backend
cd backend

# Install dependencies
npm install

# Login to Cloudflare
wrangler login
```

## Step 1: Create Cloudflare Resources

```bash
# Create D1 Database
wrangler d1 create adhd-task-manager-db

# Create KV Namespace
wrangler kv:namespace create ADHD_TASK_KV
```

## Step 2: Update Configuration

Copy the `database_id` from the D1 creation output and the `id` from the KV creation output, then update `wrangler.toml`:

```toml
[[d1_databases]]
binding = "DB"
database_name = "adhd-task-manager-db"
database_id = "YOUR_ACTUAL_DATABASE_ID_HERE"

[[kv_namespaces]]
binding = "KV"
id = "YOUR_ACTUAL_KV_NAMESPACE_ID_HERE"
```

## Step 3: Apply Database Schema

```bash
wrangler d1 execute adhd-task-manager-db --file=db/schema.sql
```

## Step 4: Deploy Worker

```bash
wrangler deploy
```

Your API will be live at `https://adhd-task-manager.<your-subdomain>.workers.dev`

## Frontend Configuration

Create `.env.local` in the frontend directory:

```env
VITE_API_URL=https://adhd-task-manager.your-subdomain.workers.dev
```

Then rebuild the frontend and deploy it (can also be served from the same worker).

---

# API Endpoints

## Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/signup` | Create first user (only works if no users exist) |
| POST | `/api/auth/login` | Login with email/password |
| POST | `/api/auth/logout` | Logout (clears session) |
| GET | `/api/auth/me` | Get current user |

## Projects

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/projects` | List all projects with tasks |
| POST | `/api/projects` | Create new project |
| GET | `/api/projects/:id` | Get single project |
| PATCH | `/api/projects/:id` | Update project |
| DELETE | `/api/projects/:id` | Delete project |

## Tasks

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/tasks` | List tasks (optional `?project_id=`) |
| POST | `/api/tasks` | Create new task |
| PATCH | `/api/tasks/:id` | Update task |
| DELETE | `/api/tasks/:id` | Delete task |

## Subtasks

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/subtasks?task_id=ID` | Get subtasks for task |
| POST | `/api/subtasks` | Create subtask |
| PATCH | `/api/subtasks/:id` | Update subtask |
| DELETE | `/api/subtasks/:id` | Delete subtask |

## Personal Tasks

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/personal-tasks` | List personal tasks |
| POST | `/api/personal-tasks` | Create personal task |
| PATCH | `/api/personal-tasks/:id` | Update personal task |
| DELETE | `/api/personal-tasks/:id` | Delete personal task |

## Pause System

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/pause` | List pause periods |
| POST | `/api/pause` | Create pause period |
| DELETE | `/api/pause/:id` | Delete pause period |

## Notifications

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/notifications` | Get overdue and due soon tasks |

## API Keys

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/api-key` | Get API key status |
| POST | `/api/api-key/generate` | Generate new API key |
| POST | `/api/api-key/validate` | Validate an API key |

---

# MCP API (for AI Agents)

The MCP endpoint provides a structured API for external AI agents and tools like n8n.

## Base URL
```
POST /mcp
```

## Authentication
Use the `X-API-Key` header:
```
X-API-Key: tk_your-api-key-here
```

## Request Format
```json
{
  "action": "action.name",
  "data": { ... }
}
```

## Available Actions

### Projects
- `projects.list` - List all projects
- `projects.create` - Create project
- `projects.delete` - Delete project

### Tasks
- `tasks.list` - List tasks (optionally filter by `project_id`)
- `tasks.create` - Create task
- `tasks.update` - Update task (by id)
- `tasks.delete` - Delete task

### Subtasks
- `subtasks.update` - Update subtask (toggle completed)

### Personal Tasks
- `personal.list` - List personal tasks
- `personal.create` - Create personal task
- `personal.update` - Update personal task

### Pause
- `pause.set` - Create pause period
- `pause.get` - List pause periods

### Notifications
- `notifications.get` - Get overdue and due soon tasks

## Response Format
```json
{
  "success": true,
  "data": { ... }
}
```

## Example Usage

```bash
# Generate API key (using session)
curl -X POST https://your-worker.workers.dev/api/api-key/generate \
  -H "Cookie: session=YOUR_SESSION_TOKEN"

# Use MCP with API key
curl -X POST https://your-worker.workers.dev/mcp \
  -H "Content-Type: application/json" \
  -H "X-API-Key: tk_your-api-key" \
  -d '{"action":"projects.list"}'

# Create a task via MCP
curl -X POST https://your-worker.workers.dev/mcp \
  -H "Content-Type: application/json" \
  -H "X-API-Key: tk_your-api-key" \
  -d '{
    "action": "tasks.create",
    "data": {
      "title": "New task from MCP",
      "priority": "high",
      "due_date": "2026-04-20"
    }
  }'
```

---

# Testing

```bash
# Run the test script
./test-api.sh https://your-worker.workers.dev

# Or test locally
wrangler dev
./test-api.sh http://localhost:8787
```