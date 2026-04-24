import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { ArrowLeft, User, Bell, Palette, Shield, LogOut, KeyRound, Fingerprint, Plus, Eye, EyeOff, Key, Trash2, Copy, RefreshCw, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { api, setApiKey } from "../api-client-react";

interface SettingsPageProps {
  onBack: () => void;
  darkMode: boolean;
  onDarkModeToggle: () => void;
  onLogout: () => void;
}

export function SettingsPage({ onBack, darkMode, onDarkModeToggle, onLogout }: SettingsPageProps) {
  const [timeFormat, setTimeFormat] = useState<"12h" | "24h">("12h");
  const [overdueAlerts, setOverdueAlerts] = useState(true);
  const [dueSoonAlerts, setDueSoonAlerts] = useState(true);
  const [completionNotifs, setCompletionNotifs] = useState(false);
  const [weeklyDigest, setWeeklyDigest] = useState(true);
  const [name, setName] = useState("Alex Chen");
  const [email, setEmail] = useState("alex@example.com");
  const [apiKey, setApiKeyState] = useState<string | null>(null);
  const [apiKeyVisible, setApiKeyVisible] = useState(false);
  const [keyCopied, setKeyCopied] = useState(false);
  const [regenDialogOpen, setRegenDialogOpen] = useState(false);
  const [lastGenerated, setLastGenerated] = useState<string | null>(null);
  const [regenLoading, setRegenLoading] = useState(false);
  const [passkeys, setPasskeys] = useState<string[]>([]);

  const [apiKeyLoading, setApiKeyLoading] = useState(true);

  useEffect(() => {
    const loadApiKey = async () => {
      try {
        const keyData = await api.getApiKey();
        if (keyData.hasKey) {
          const gen = await api.generateApiKey();
          setApiKeyState(gen.apiKey);
          setLastGenerated(keyData.created_at || new Date().toISOString());
        }
        setApiKeyState(null);
      } catch (e) {
        console.error('Failed to load API key:', e);
      } finally {
        setApiKeyLoading(false);
      }
    };
    loadApiKey();
  }, []);

  const [pwDialogOpen, setPwDialogOpen] = useState(false);
  const [emailDialogOpen, setEmailDialogOpen] = useState(false);
  const [passkeyDialogOpen, setPasskeyDialogOpen] = useState(false);
  const [deletePasskeyTarget, setDeletePasskeyTarget] = useState<string | null>(null);

  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [pwSaved, setPwSaved] = useState(false);

  const [newEmail, setNewEmail] = useState("");
  const [emailSent, setEmailSent] = useState(false);

  const [newPasskeyName, setNewPasskeyName] = useState("");

  const handleSavePassword = () => {
    setPwSaved(true);
    setTimeout(() => {
      setPwSaved(false);
      setPwDialogOpen(false);
      setCurrentPw(""); setNewPw(""); setConfirmPw("");
    }, 1000);
  };

  const handleSendVerification = () => {
    setEmailSent(true);
  };

  const handleAddPasskey = () => {
    if (!newPasskeyName.trim()) return;
    setPasskeys((prev) => [...prev, newPasskeyName.trim()]);
    setNewPasskeyName("");
    setPasskeyDialogOpen(false);
  };

  const handleCopyKey = () => {
    if (!apiKey) return;
    navigator.clipboard.writeText(apiKey).catch(() => {});
    setKeyCopied(true);
    setTimeout(() => setKeyCopied(false), 2000);
  };

  const handleRegen = async () => {
    setRegenLoading(true);
    try {
      const gen = await api.generateApiKey();
      setApiKeyState(gen.apiKey);
      setLastGenerated(new Date().toISOString());
      setApiKey(gen.apiKey);
    } catch (e) {
      console.error('Failed to generate API key:', e);
    } finally {
      setRegenLoading(false);
      setRegenDialogOpen(false);
    }
  };

  const maskedKey = apiKey ? apiKey.slice(0, 7) + "••••••••••••" + apiKey.slice(-4) : "••••••••••••";

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Button
          variant="ghost"
          size="sm"
          className="gap-1.5 text-muted-foreground hover:text-foreground pl-0"
          onClick={() => window.history.back()}
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
      </div>

      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground">Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">Manage your preferences and account</p>
      </div>

      <div className="space-y-6">
        <SettingsSection icon={Palette} title="General">
          <SettingsRow label="Dark Mode" description="Switch between light and dark theme">
            <Switch checked={darkMode} onCheckedChange={onDarkModeToggle} />
          </SettingsRow>
          <Separator />
          <SettingsRow label="Time Format" description="How times are displayed throughout the app">
            <Select value={timeFormat} onValueChange={(v) => setTimeFormat(v as "12h" | "24h")}>
              <SelectTrigger className="h-8 w-24 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="12h">12-hour</SelectItem>
                <SelectItem value="24h">24-hour</SelectItem>
              </SelectContent>
            </Select>
          </SettingsRow>
        </SettingsSection>

        <SettingsSection icon={Bell} title="Notifications">
          <SettingsRow label="Overdue Alerts" description="Get notified when tasks are past due">
            <Switch checked={overdueAlerts} onCheckedChange={setOverdueAlerts} />
          </SettingsRow>
          <Separator />
          <SettingsRow label="Due Soon Reminders" description="Alert 24 hours before a task deadline">
            <Switch checked={dueSoonAlerts} onCheckedChange={setDueSoonAlerts} />
          </SettingsRow>
          <Separator />
          <SettingsRow label="Completion Notifications" description="Notify when tasks are marked complete">
            <Switch checked={completionNotifs} onCheckedChange={setCompletionNotifs} />
          </SettingsRow>
          <Separator />
          <SettingsRow label="Weekly Digest" description="Summary of progress and upcoming deadlines">
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="text-[9px] h-4 px-1.5">Soon</Badge>
              <Switch checked={weeklyDigest} onCheckedChange={setWeeklyDigest} />
            </div>
          </SettingsRow>
        </SettingsSection>

        <SettingsSection icon={User} title="Account">
          <div className="space-y-4 py-1">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Full Name</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} className="h-9" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Email</Label>
              <div className="flex gap-2">
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-9 flex-1"
                />
                <Button
                  variant="outline"
                  size="sm"
                  className="h-9 shrink-0"
                  onClick={() => { setNewEmail(""); setEmailSent(false); setEmailDialogOpen(true); }}
                >
                  Change
                </Button>
              </div>
            </div>
            <div className="flex items-center gap-2 pt-1">
              <Button size="sm" className="bg-violet-600 hover:bg-violet-700 text-white">
                Save Changes
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5"
                onClick={() => setPwDialogOpen(true)}
              >
                <KeyRound className="h-3.5 w-3.5" />
                Change Password
              </Button>
            </div>
          </div>
        </SettingsSection>

        <SettingsSection icon={Fingerprint} title="Passkeys">
          <div className="space-y-3 py-1">
            <p className="text-xs text-muted-foreground">
              Sign in using your device's biometrics — face ID, fingerprint, or PIN. No password needed.
            </p>
            {passkeys.length > 0 && (
              <div className="space-y-2">
                {passkeys.map((pk) => (
                  <div key={pk} className="flex items-center justify-between rounded-lg border border-border bg-muted/30 px-3 py-2.5">
                    <div className="flex items-center gap-2">
                      <Fingerprint className="h-4 w-4 text-violet-500" />
                      <span className="text-sm font-medium text-foreground">{pk}</span>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 text-muted-foreground hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950"
                      onClick={() => setDeletePasskeyTarget(pk)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
            {passkeys.length === 0 && (
              <p className="text-xs text-muted-foreground italic">No passkeys registered.</p>
            )}
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5"
              onClick={() => { setNewPasskeyName(""); setPasskeyDialogOpen(true); }}
            >
              <Plus className="h-3.5 w-3.5" />
              Add Passkey
            </Button>
          </div>
        </SettingsSection>

        <SettingsSection icon={Key} title="API Keys">
          <div className="space-y-4 py-1">
            <p className="text-xs text-muted-foreground">
              Use this key to connect external tools and integrations. Keep it secure — treat it like a password.
            </p>

            <div className="rounded-xl border border-border bg-muted/30 p-4 space-y-3">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div>
                  <p className="text-xs font-semibold text-foreground">Your API Key</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">Last generated: {lastGenerated}</p>
                </div>
                <Badge className="text-[9px] h-5 px-2 bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-200 dark:border-emerald-900" variant="outline">
                  Active
                </Badge>
              </div>

              <div className="flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2.5">
                <code className="flex-1 text-sm font-mono text-foreground truncate select-all">
                  {apiKeyVisible ? apiKey : maskedKey}
                </code>
                <button
                  type="button"
                  onClick={() => setApiKeyVisible(!apiKeyVisible)}
                  className="shrink-0 text-muted-foreground hover:text-foreground transition-colors"
                  title={apiKeyVisible ? "Hide key" : "Show key"}
                >
                  {apiKeyVisible ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                </button>
              </div>

              {keyCopied && (
                <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  <span className="text-xs font-medium">Copied to clipboard</span>
                </div>
              )}

              <div className="flex items-center gap-2 flex-wrap">
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5 h-8 text-xs"
                  onClick={handleCopyKey}
                >
                  <Copy className="h-3 w-3" />
                  {keyCopied ? "Copied!" : "Copy Key"}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5 h-8 text-xs text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800 hover:bg-amber-50 dark:hover:bg-amber-950"
                  onClick={() => setRegenDialogOpen(true)}
                >
                  <RefreshCw className="h-3 w-3" />
                  Regenerate Key
                </Button>
              </div>

              <p className="text-[10px] text-muted-foreground">
                Keep this key secure. It allows external integrations to access your workspace.
              </p>
            </div>
          </div>
        </SettingsSection>

        <SettingsSection icon={Shield} title="Danger Zone">
          <div className="flex items-center justify-between py-1">
            <div>
              <p className="text-sm font-medium text-foreground">Log out</p>
              <p className="text-xs text-muted-foreground">Sign out of your account</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300 dark:border-red-900 dark:hover:bg-red-950"
              onClick={onLogout}
            >
              <LogOut className="h-3.5 w-3.5" />
              Log out
            </Button>
          </div>
        </SettingsSection>
      </div>

      <Dialog open={pwDialogOpen} onOpenChange={setPwDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Change Password</DialogTitle>
            <DialogDescription>Enter your current password to set a new one.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <PasswordField label="Current password" value={currentPw} onChange={setCurrentPw} show={showCurrent} onToggle={() => setShowCurrent(!showCurrent)} placeholder="••••••••" autoComplete="current-password" />
            <PasswordField label="New password" value={newPw} onChange={setNewPw} show={showNew} onToggle={() => setShowNew(!showNew)} placeholder="At least 8 characters" autoComplete="new-password" />
            <PasswordField label="Confirm new password" value={confirmPw} onChange={setConfirmPw} show={showNew} onToggle={() => setShowNew(!showNew)} placeholder="Repeat new password" autoComplete="new-password" />
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setPwDialogOpen(false)}>Cancel</Button>
            <Button
              size="sm"
              className="bg-violet-600 hover:bg-violet-700 text-white"
              disabled={!currentPw || !newPw || newPw !== confirmPw || pwSaved}
              onClick={handleSavePassword}
            >
              {pwSaved ? "Saved!" : "Update Password"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={emailDialogOpen} onOpenChange={setEmailDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Change Email</DialogTitle>
            <DialogDescription>
              {emailSent
                ? "A verification link has been sent. Check your inbox."
                : "Enter your new email address. We'll send a verification link."}
            </DialogDescription>
          </DialogHeader>
          {!emailSent ? (
            <>
              <div className="space-y-1.5 py-2">
                <Label className="text-xs font-medium">New Email</Label>
                <Input
                  type="email"
                  placeholder="new@example.com"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  autoFocus
                />
              </div>
              <DialogFooter>
                <Button variant="outline" size="sm" onClick={() => setEmailDialogOpen(false)}>Cancel</Button>
                <Button
                  size="sm"
                  className="bg-violet-600 hover:bg-violet-700 text-white"
                  disabled={!newEmail.includes("@")}
                  onClick={handleSendVerification}
                >
                  Send Verification
                </Button>
              </DialogFooter>
            </>
          ) : (
            <DialogFooter>
              <Button size="sm" className="bg-violet-600 hover:bg-violet-700 text-white w-full" onClick={() => setEmailDialogOpen(false)}>
                Done
              </Button>
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={passkeyDialogOpen} onOpenChange={setPasskeyDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Register Passkey</DialogTitle>
            <DialogDescription>Give this passkey a name to identify the device.</DialogDescription>
          </DialogHeader>
          <div className="space-y-1.5 py-2">
            <Label className="text-xs font-medium">Device Name</Label>
            <Input
              placeholder="e.g. MacBook Face ID"
              value={newPasskeyName}
              onChange={(e) => setNewPasskeyName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAddPasskey()}
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setPasskeyDialogOpen(false)}>Cancel</Button>
            <Button
              size="sm"
              className="bg-violet-600 hover:bg-violet-700 text-white gap-1.5"
              disabled={!newPasskeyName.trim()}
              onClick={handleAddPasskey}
            >
              <Fingerprint className="h-3.5 w-3.5" />
              Register
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!deletePasskeyTarget} onOpenChange={(v) => !v && setDeletePasskeyTarget(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Remove passkey?</DialogTitle>
            <DialogDescription>
              "{deletePasskeyTarget}" will be removed. You'll need to sign in with your password instead.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setDeletePasskeyTarget(null)}>Cancel</Button>
            <Button
              size="sm"
              className="bg-red-600 hover:bg-red-700 text-white"
              onClick={() => {
                setPasskeys((prev) => prev.filter((p) => p !== deletePasskeyTarget));
                setDeletePasskeyTarget(null);
              }}
            >
              Remove
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function PasswordField({
  label, value, onChange, show, onToggle, placeholder, autoComplete
}: {
  label: string; value: string; onChange: (v: string) => void;
  show: boolean; onToggle: () => void; placeholder: string; autoComplete?: string;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-medium">{label}</Label>
      <div className="relative">
        <Input
          type={show ? "text" : "password"}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="pr-9"
          autoComplete={autoComplete}
        />
        <button
          type="button"
          onClick={onToggle}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
        >
          {show ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
        </button>
      </div>
    </div>
  );
}

function SettingsSection({ icon: Icon, title, children }: { icon: React.ElementType; title: string; children: React.ReactNode }) {
  return (
    <Card>
      <CardHeader className="pb-3 pt-5">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-muted">
            <Icon className="h-3.5 w-3.5 text-muted-foreground" />
          </div>
          <h3 className="text-sm font-semibold text-foreground">{title}</h3>
        </div>
      </CardHeader>
      <CardContent className="pt-0 space-y-0">{children}</CardContent>
    </Card>
  );
}

function SettingsRow({ label, description, children }: { label: string; description?: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between py-3 gap-4">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground">{label}</p>
        {description && <p className="text-xs text-muted-foreground mt-0.5">{description}</p>}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}
