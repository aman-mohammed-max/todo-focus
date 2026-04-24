import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";

export function InstallPWA() {
  const [show, setShow] = useState(false);
  const [installing, setInstalling] = useState(false);

  useEffect(() => {
    const handleInstallReady = () => setShow(true);
    const handleInstalled = () => setShow(false);

    window.addEventListener('pwa-install-ready', handleInstallReady);
    window.addEventListener('pwa-installed', handleInstalled);

    if ((window as any).isPWAInstallable?.()) {
      setShow(true);
    }

    return () => {
      window.removeEventListener('pwa-install-ready', handleInstallReady);
      window.removeEventListener('pwa-installed', handleInstalled);
    };
  }, []);

  const handleInstall = async () => {
    setInstalling(true);
    try {
      await (window as any).installPWA?.();
    } finally {
      setInstalling(false);
    }
  };

  if (!show) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 animate-in slide-in-from-bottom-2">
      <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 shadow-xl">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 bg-violet-600 rounded-lg flex items-center justify-center">
            <Download className="h-5 w-5 text-white" />
          </div>
          <div>
            <p className="text-sm font-medium text-white">Install FocusFlow</p>
            <p className="text-xs text-zinc-400">Works offline, like a native app</p>
          </div>
        </div>
        <Button
          onClick={handleInstall}
          disabled={installing}
          className="w-full bg-violet-600 hover:bg-violet-700 text-white"
          size="sm"
        >
          {installing ? "Installing..." : "Install App"}
        </Button>
      </div>
    </div>
  );
}

export function PWAUpdateBanner() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const handleUpdateReady = () => setShow(true);
    window.addEventListener('pwa-update-ready', handleUpdateReady);
    return () => window.removeEventListener('pwa-update-ready', handleUpdateReady);
  }, []);

  const handleUpdate = () => {
    window.location.reload();
  };

  if (!show) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-violet-600 text-white px-4 py-2 flex items-center justify-between">
      <p className="text-sm font-medium">A new version is available!</p>
      <Button onClick={handleUpdate} size="sm" variant="outline" className="bg-transparent border-white text-white hover:bg-white hover:text-violet-600">
        Update
      </Button>
    </div>
  );
}