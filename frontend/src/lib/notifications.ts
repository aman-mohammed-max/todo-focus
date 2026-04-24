const NOTIFICATION_PERMISSION_KEY = 'ff_notification_permission';

export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!('Notification' in window)) {
    return 'denied';
  }
  
  if (Notification.permission === 'granted') {
    return 'granted';
  }
  
  if (Notification.permission === 'denied') {
    return 'denied';
  }
  
  const permission = await Notification.requestPermission();
  localStorage.setItem(NOTIFICATION_PERMISSION_KEY, permission);
  return permission;
}

export function getNotificationPermission(): NotificationPermission {
  if (!('Notification' in window)) {
    return 'denied';
  }
  return Notification.permission;
}

export async function showNotification(title: string, options?: NotificationOptions): Promise<Notification | null> {
  if (getNotificationPermission() !== 'granted') {
    return null;
  }
  
  if (!navigator.serviceWorker.controller) {
    await navigator.serviceWorker.ready;
  }
  
  try {
    const registration = await navigator.serviceWorker.ready;
    return registration.showNotification(title, {
      icon: '/icons/icon-192.png',
      badge: '/favicon.png',
      vibrate: [200, 100, 200],
      ...options,
    });
  } catch {
    return new Notification(title, {
      icon: '/icons/icon-192.png',
      ...options,
    });
  }
}

export async function checkTaskNotifications(notifications: { overdue: any[]; dueSoon: any[] }) {
  const permission = getNotificationPermission();
  if (permission !== 'granted') return;
  
  if (notifications.overdue.length > 0) {
    await showNotification('Overdue Tasks', {
      body: `You have ${notifications.overdue.length} overdue task(s)`,
      tag: 'overdue',
      requireInteraction: true,
    });
  }
  
  if (notifications.dueSoon.length > 0) {
    await showNotification('Due Soon', {
      body: `${notifications.dueSoon.length} task(s) due within 24 hours`,
      tag: 'due-soon',
    });
  }
}

export function scheduleNotificationCheck() {
  const checkInterval = 60 * 60 * 1000; // 1 hour
  
  setInterval(async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'https://todo-focus-backend.aman-mohammed979.workers.dev'}/api/notifications`, {
        credentials: 'include',
      });
      if (res.ok) {
        const data = await res.json();
        await checkTaskNotifications(data);
      }
    } catch {
      // Silently fail in background
    }
  }, checkInterval);
}