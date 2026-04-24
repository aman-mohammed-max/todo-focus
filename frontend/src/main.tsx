import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { scheduleNotificationCheck } from "./lib/notifications";

let deferredPrompt: BeforeInstallPromptEvent | null = null;

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e as BeforeInstallPromptEvent;
  window.dispatchEvent(new CustomEvent('pwa-install-ready'));
});

window.addEventListener('appinstalled', () => {
  deferredPrompt = null;
  window.dispatchEvent(new CustomEvent('pwa-installed'));
});

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').then((registration) => {
      console.log('SW registered:', registration.scope);
      scheduleNotificationCheck();
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              window.dispatchEvent(new CustomEvent('pwa-update-ready'));
            }
          });
        }
      });
    }).catch((err) => {
      console.log('SW registration failed:', err);
    });
  });
}

(window as any).installPWA = async () => {
  if (!deferredPrompt) return false;
  await deferredPrompt.prompt();
  const choice = await deferredPrompt.userChoice;
  return choice.outcome === 'accepted';
};

(window as any).isPWAInstallable = () => !!deferredPrompt;

createRoot(document.getElementById("root")!).render(<App />);