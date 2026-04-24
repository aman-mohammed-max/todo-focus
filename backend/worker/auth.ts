import { betterAuth } from "better-auth";
import { passkey } from "@better-auth/passkey";

export interface Env {
  DB: D1Database;
  KV: KVNamespace;
  BETTER_AUTH_SECRET: string;
  BETTER_AUTH_URL: string;
}

const generateSecret = (): string => {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, b => b.toString(16).padStart(2, '0')).join('');
};

const getOrigin = (url: string): string => {
  try {
    return new URL(url).origin;
  } catch {
    return "http://localhost:8790";
  }
};

export const createAuth = (env: Env) => {
  const baseURL = env.BETTER_AUTH_URL || "https://todo-focus-backend.aman-mohammed979.workers.dev";
  const origin = getOrigin(baseURL);
  
  return betterAuth({
    database: {
      db: env.DB,
      type: "sqlite",
    },
    emailAndPassword: {
      enabled: true,
      requireEmailVerification: false,
    },
    session: {
      expiresIn: 60 * 60 * 24 * 30,
      updateAge: 60 * 60 * 24,
    },
    secret: env.BETTER_AUTH_SECRET || generateSecret(),
    baseURL: baseURL,
    trustedOrigins: [origin],
    plugins: [
      passkey({
        rpName: "Todo Focus",
        rpID: new URL(baseURL).hostname,
      }),
    ],
  });
};

export type AuthInstance = ReturnType<typeof createAuth>;