import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Zap, Eye, EyeOff, Fingerprint } from "lucide-react";
import { api } from "../api-client-react";

const REGISTERED_KEY = "ff_user_registered";

interface AuthPageProps {
  onAuth: () => void;
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

export function AuthPage({ onAuth }: AuthPageProps) {
  const [isFirstTime, setIsFirstTime] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passkeyLoading, setPasskeyLoading] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const checkSession = async () => {
      try {
        const session = await api.getSession();
        if (session) {
          onAuth();
        } else {
          const registered = localStorage.getItem(REGISTERED_KEY);
          setIsFirstTime(!registered);
        }
      } catch {
        const registered = localStorage.getItem(REGISTERED_KEY);
        setIsFirstTime(!registered);
      }
    };
    checkSession();
  }, [onAuth]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (isFirstTime) {
        if (!name.trim()) { setError("Please enter your name."); setLoading(false); return; }
        if (password.length < 8) { setError("Password must be at least 8 characters."); setLoading(false); return; }
        if (password !== confirmPassword) { setError("Passwords don't match."); setLoading(false); return; }
        
        await api.signUp({ email, password, name: name.trim() });
        localStorage.setItem(REGISTERED_KEY, JSON.stringify({ name: name.trim(), email }));
      } else {
        await api.signIn({ email, password });
        localStorage.setItem(REGISTERED_KEY, JSON.stringify({ email }));
      }
      onAuth();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  const handlePasskey = async () => {
    setPasskeyLoading(true);
    setError("");

    try {
      if (isFirstTime) {
        // Registration flow
        const { options } = await api.passkeyRegister({ name: name.trim() || "My Device" });
        
        const credential = await navigator.credentials.create({
          publicKey: {
            challenge: new Uint8Array(options.challenge),
            rp: options.rp,
            user: {
              id: new Uint8Array(options.user.id),
              name: options.user.name,
              displayName: options.user.displayName,
            },
            pubKeyCredParams: options.pubKeyCredParams,
            authenticatorSelection: options.authenticatorSelection,
            timeout: options.timeout,
            extensions: options.extensions,
          },
        });

        if (!credential) {
          throw new Error("Failed to create credential");
        }

        const publicKeyCredential = credential as PublicKeyCredential;
        const response = publicKeyCredential.response as AuthenticatorAttestationResponse;

        await api.passkeyVerify({
          id: publicKeyCredential.id,
          rawId: arrayBufferToBase64(publicKeyCredential.rawId),
          type: publicKeyCredential.type,
          response: {
            clientDataJSON: arrayBufferToBase64(response.clientDataJSON),
            attestationObject: arrayBufferToBase64(response.attestationObject),
            transports: response.getTransports?.() || [],
          },
        });

        localStorage.setItem(REGISTERED_KEY, JSON.stringify({ name: name.trim(), email, passkey: true }));
      } else {
        // Sign-in flow
        const { options } = await api.passkeySignIn();

        const credential = await navigator.credentials.get({
          publicKey: {
            challenge: new Uint8Array(options.challenge),
            rpId: options.rpId,
            allowCredentials: options.allowCredentials.map((c: any) => ({
              id: new Uint8Array(c.id),
              type: c.type,
              transports: c.transports,
            })),
            timeout: options.timeout,
            userVerification: options.userVerification,
            extensions: options.extensions,
          },
        });

        if (!credential) {
          throw new Error("No credential selected");
        }

        const publicKeyCredential = credential as PublicKeyCredential;
        const response = publicKeyCredential.response as AuthenticatorAssertionResponse;

        await api.passkeyVerifySignIn({
          id: publicKeyCredential.id,
          rawId: arrayBufferToBase64(publicKeyCredential.rawId),
          type: publicKeyCredential.type,
          response: {
            clientDataJSON: arrayBufferToBase64(response.clientDataJSON),
            authenticatorData: arrayBufferToBase64(response.authenticatorData),
            signature: arrayBufferToBase64(response.signature),
            userHandle: response.userHandle ? arrayBufferToBase64(response.userHandle) : undefined,
          },
        });

        localStorage.setItem(REGISTERED_KEY, JSON.stringify({ email, passkey: true }));
      }
      onAuth();
    } catch (err) {
      console.error("Passkey error:", err);
      setError(err instanceof Error ? err.message : "Passkey authentication failed");
    } finally {
      setPasskeyLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-8">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-600 mb-4 shadow-lg shadow-violet-500/20">
            <Zap className="h-6 w-6 text-white" strokeWidth={2.5} />
          </div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">FocusFlow</h1>
          <p className="text-sm text-muted-foreground mt-1">Do one thing at a time</p>
        </div>

        <Card className="border shadow-sm">
          <CardContent className="px-6 pt-6 pb-6">
            <p className="text-base font-semibold text-foreground mb-1">
              {isFirstTime ? "Create your account" : "Welcome back"}
            </p>
            {isFirstTime && (
              <p className="text-xs text-muted-foreground mb-5">
                Set up your personal workspace — this is a single-user system.
              </p>
            )}
            {!isFirstTime && <div className="mb-5" />}

            <form onSubmit={handleSubmit} className="space-y-4">
              {isFirstTime && (
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Full Name</Label>
                  <Input
                    placeholder="Alex Chen"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    autoComplete="name"
                    required
                  />
                </div>
              )}

              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Email</Label>
                <Input
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoFocus
                  autoComplete="email"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-medium">Password</Label>
                  {!isFirstTime && (
                    <button
                      type="button"
                      className="text-[10px] text-violet-600 dark:text-violet-400 hover:underline font-medium"
                    >
                      Forgot password?
                    </button>
                  )}
                </div>
                <div className="relative">
                  <Input
                    type={showPw ? "text" : "password"}
                    placeholder={isFirstTime ? "At least 8 characters" : "••••••••"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pr-9"
                    autoComplete={isFirstTime ? "new-password" : "current-password"}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw(!showPw)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPw ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                  </button>
                </div>
              </div>

              {isFirstTime && (
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Confirm Password</Label>
                  <div className="relative">
                    <Input
                      type={showConfirmPw ? "text" : "password"}
                      placeholder="Repeat your password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="pr-9"
                      autoComplete="new-password"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPw(!showConfirmPw)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showConfirmPw ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                    </button>
                  </div>
                </div>
              )}

              {error && (
                <p className="text-xs text-red-600 dark:text-red-400 font-medium">{error}</p>
              )}

              <Button
                type="submit"
                className="w-full bg-violet-600 hover:bg-violet-700 text-white font-medium"
                disabled={loading}
              >
                {loading ? "Please wait..." : isFirstTime ? "Create Account" : "Log in"}
              </Button>
            </form>

            <div className="flex items-center gap-3 my-4">
              <Separator className="flex-1" />
              <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">or</span>
              <Separator className="flex-1" />
            </div>

            <Button
              variant="outline"
              className="w-full gap-2.5 text-sm font-medium"
              onClick={handlePasskey}
              disabled={passkeyLoading}
            >
              <Fingerprint className={`h-4 w-4 text-violet-600 dark:text-violet-400 ${passkeyLoading ? "animate-pulse" : ""}`} />
              {passkeyLoading ? "Authenticating…" : isFirstTime ? "Register with Passkey" : "Sign in with Passkey"}
            </Button>
          </CardContent>
        </Card>

        <p className="text-center text-[11px] text-muted-foreground mt-5">
          {isFirstTime
            ? "Single-user system — only one account is supported."
            : "Passkeys use your device's biometrics — no password needed."}
        </p>
      </div>
    </div>
  );
}