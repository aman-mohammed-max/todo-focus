import { useState, useEffect } from "react";
import { QueryClient, QueryClientProvider, useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Route, Switch, Redirect } from "wouter";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Header } from "@/components/Header";
import { Dashboard } from "@/pages/Dashboard";
import { ProjectDetailLayout } from "@/components/ProjectDetailLayout";
import { PersonalTasksView } from "@/components/PersonalTasksView";
import { AuthPage } from "@/pages/AuthPage";
import { SettingsPage } from "@/pages/SettingsPage";
import { NotFound } from "@/pages/not-found";
import { api, Project, Task, PersonalTask as PersonalTaskType, PausePeriod } from "./api-client-react";

const AUTH_KEY = "ff_user_registered";
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30000,
      retry: 1,
    },
  },
});

function convertDbToProject(dbProject: Project): Project {
  return {
    ...dbProject,
    tasks: dbProject.tasks.map(t => ({
      ...t,
      followPause: t.follow_pause === true || t.follow_pause === 1,
    })),
  };
}

function convertDbToPersonalTask(dbTask: PersonalTaskType): PersonalTaskType {
  return {
    ...dbTask,
    completed: dbTask.completed === true || dbTask.completed === 1,
  };
}

function AppContent() {
  const queryClient = useQueryClient();
  const [authed, setAuthed] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getSession().then((session) => {
      if (session) {
        setAuthed(true);
      }
      setLoading(false);
    });
  }, []);

  const { data: projectsData, isLoading: projectsLoading } = useQuery({
    queryKey: ['projects'],
    queryFn: () => api.getProjects(),
    enabled: authed,
  });

  const { data: personalTasksData, isLoading: personalLoading } = useQuery({
    queryKey: ['personal-tasks'],
    queryFn: () => api.getPersonalTasks(),
    enabled: authed,
  });

  const { data: pausePeriodsData } = useQuery({
    queryKey: ['pause'],
    queryFn: () => api.getPausePeriods(),
    enabled: authed,
  });

  const projects: Project[] = projectsData?.map(convertDbToProject) || [];
  const personalTasks: PersonalTaskType[] = personalTasksData?.map(convertDbToPersonalTask) || [];
  const pausePeriods: PausePeriod[] = pausePeriodsData || [];

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [darkMode]);

  const createProjectMutation = useMutation({
    mutationFn: (data: { name: string; description?: string; priority?: string; color?: string }) => 
      api.createProject(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['projects'] }),
  });

  const updateProjectMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Parameters<typeof api.updateProject>[1] }) =>
      api.updateProject(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['projects'] }),
  });

  const deleteProjectMutation = useMutation({
    mutationFn: (id: string) => api.deleteProject(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['projects'] }),
  });

  const createTaskMutation = useMutation({
    mutationFn: (data: Parameters<typeof api.createTask>[0]) => api.createTask(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['projects'] }),
  });

  const updateTaskMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Parameters<typeof api.updateTask>[1] }) =>
      api.updateTask(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['projects'] }),
  });

  const deleteTaskMutation = useMutation({
    mutationFn: (id: string) => api.deleteTask(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['projects'] }),
  });

  const createSubtaskMutation = useMutation({
    mutationFn: ({ taskId, title }: { taskId: string; title: string }) =>
      api.createSubtask(taskId, title),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['projects'] }),
  });

  const updateSubtaskMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Parameters<typeof api.updateSubtask>[1] }) =>
      api.updateSubtask(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['projects'] }),
  });

  const deleteSubtaskMutation = useMutation({
    mutationFn: (id: string) => api.deleteSubtask(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['projects'] }),
  });

  const createPersonalTaskMutation = useMutation({
    mutationFn: (data: Parameters<typeof api.createPersonalTask>[0]) => api.createPersonalTask(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['personal-tasks'] }),
  });

  const updatePersonalTaskMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Parameters<typeof api.updatePersonalTask>[1] }) =>
      api.updatePersonalTask(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['personal-tasks'] }),
  });

  const deletePersonalTaskMutation = useMutation({
    mutationFn: (id: string) => api.deletePersonalTask(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['personal-tasks'] }),
  });

  const createPauseMutation = useMutation({
    mutationFn: ({ startDate, endDate }: { startDate: string; endDate: string }) =>
      api.createPausePeriod(startDate, endDate),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['pause'] }),
  });

  const deletePauseMutation = useMutation({
    mutationFn: (id: string) => api.deletePausePeriod(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['pause'] }),
  });

  const handleLogout = async () => {
    try {
      await api.logout();
    } catch {
    }
    localStorage.removeItem(AUTH_KEY);
    localStorage.removeItem('session_token');
    localStorage.removeItem('api_key');
    setAuthed(false);
  };

  const handleCreateProject = async (data: { name: string; description?: string; priority?: string; color?: string }) => {
    await createProjectMutation.mutateAsync(data);
  };

  const handleUpdateProject = async (id: string, data: Parameters<typeof api.updateProject>[1]) => {
    await updateProjectMutation.mutateAsync({ id, data });
  };

  const handleDeleteProject = async (id: string) => {
    await deleteProjectMutation.mutateAsync(id);
  };

  const handleCreateTask = async (data: Parameters<typeof api.createTask>[0]) => {
    await createTaskMutation.mutateAsync(data);
  };

  const handleUpdateTask = async (id: string, data: Parameters<typeof api.updateTask>[1]) => {
    await updateTaskMutation.mutateAsync({ id, data });
  };

  const handleDeleteTask = async (id: string) => {
    await deleteTaskMutation.mutateAsync(id);
  };

  const handleCreateSubtask = async (taskId: string, title: string) => {
    await createSubtaskMutation.mutateAsync({ taskId, title });
  };

  const handleUpdateSubtask = async (id: string, data: Parameters<typeof api.updateSubtask>[1]) => {
    await updateSubtaskMutation.mutateAsync({ id, data });
  };

  const handleDeleteSubtask = async (id: string) => {
    await deleteSubtaskMutation.mutateAsync(id);
  };

  const handleCreatePersonalTask = async (data: Parameters<typeof api.createPersonalTask>[0]) => {
    await createPersonalTaskMutation.mutateAsync(data);
  };

  const handleUpdatePersonalTask = async (id: string, data: Parameters<typeof api.updatePersonalTask>[1]) => {
    await updatePersonalTaskMutation.mutateAsync({ id, data });
  };

  const handleDeletePersonalTask = async (id: string) => {
    await deletePersonalTaskMutation.mutateAsync(id);
  };

  const handleCreatePause = async (startDate: string, endDate: string) => {
    await createPauseMutation.mutateAsync({ startDate, endDate });
  };

  const handleDeletePause = async (id: string) => {
    await deletePauseMutation.mutateAsync(id);
  };

  if (!authed) {
    return <AuthPage onAuth={() => {
      setAuthed(true);
    }} />;
  }

  if (loading || projectsLoading || personalLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header onLogout={handleLogout} />
      <main className="mx-auto max-w-7xl px-6 py-8">
        <Switch>
          <Route path="/" component={() => <Redirect to="/dashboard" />} />
          <Route path="/dashboard">
            {() => (
              <Dashboard
                onOpenProject={() => {}}
                projects={projects}
                personalTasks={personalTasks}
                pausePeriods={pausePeriods}
                onCreateProject={handleCreateProject}
                onUpdateProject={handleUpdateProject}
                onDeleteProject={handleDeleteProject}
                onCreateTask={handleCreateTask}
                onUpdateTask={handleUpdateTask}
                onDeleteTask={handleDeleteTask}
                onCreateSubtask={handleCreateSubtask}
                onUpdateSubtask={handleUpdateSubtask}
                onDeleteSubtask={handleDeleteSubtask}
                onCreatePersonalTask={handleCreatePersonalTask}
                onUpdatePersonalTask={handleUpdatePersonalTask}
                onDeletePersonalTask={handleDeletePersonalTask}
                onCreatePause={handleCreatePause}
                onDeletePause={handleDeletePause}
              />
            )}
          </Route>
          <Route path="/project/:id">
            {(params) => {
              const project = projects.find((p) => p.id === params.id);
              if (!project) return <NotFound />;
              return (
                <ProjectDetailLayout
                  project={project}
                  onBack={() => {}}
                  onUpdate={(updated) => handleUpdateProject(updated.id, updated)}
                  onDelete={() => handleDeleteProject(project.id)}
                  onCreateTask={handleCreateTask}
                  onUpdateTask={handleUpdateTask}
                  onDeleteTask={handleDeleteTask}
                  onCreateSubtask={handleCreateSubtask}
                  onUpdateSubtask={handleUpdateSubtask}
                  onDeleteSubtask={handleDeleteSubtask}
                />
              );
            }}
          </Route>
          <Route path="/personal">
            {() => (
              <PersonalTasksView
                tasks={personalTasks}
                onCreateTask={handleCreatePersonalTask}
                onUpdateTask={handleUpdatePersonalTask}
                onDeleteTask={handleDeletePersonalTask}
              />
            )}
          </Route>
          <Route path="/settings">
            {() => (
              <SettingsPage
                onBack={() => {}}
                darkMode={darkMode}
                onDarkModeToggle={() => setDarkMode((d) => !d)}
                onLogout={handleLogout}
              />
            )}
          </Route>
          <Route component={NotFound} />
        </Switch>
      </main>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AppContent />
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;