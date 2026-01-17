"use client";

import { getSupabaseBrowserClient } from "@/lib/supabase/browser-client";
import { User } from "@supabase/supabase-js";
import { useState, useEffect } from "react";

type AuthProps = {
  user: User | null;
};

type Mode = "signup" | "signin";

export default function Auth({ user }: AuthProps) {
  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState("");
  const supabase = getSupabaseBrowserClient();
  const [currentUser, setCurrentUser] = useState<User | null>(user);

  async function handleSignOut() {
    await supabase.auth.signOut();
    setCurrentUser(null);
    setStatus("Signed out successfully");
  }

  useEffect(() => {
    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setCurrentUser(session?.user ?? null);
      }
    );

    return () => {
      listener?.subscription.unsubscribe();
    };
  }, [supabase]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (mode === "signup") {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}`,
        },
      });
      if (error) {
        setStatus(error.message);
      } else {
        setStatus("Check your inbox to confirm your account.");
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) {
        setStatus(error.message);
      } else {
        setStatus("Signed in successfully");
      }
    }
  }

  async function handleGoogleLogin() {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}`,
        skipBrowserRedirect: false,
      },
    });
  }

  if (currentUser) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-linear-to-br from-slate-50 via-blue-50 to-indigo-50 p-4 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
        <div className="w-full max-w-md">
          <div className="relative overflow-hidden rounded-4xl border border-white/20 bg-white/40 p-8 shadow-2xl shadow-black/10 backdrop-blur-2xl dark:border-white/10 dark:bg-white/5 dark:shadow-black/50">
            <div className="pointer-events-none absolute inset-0 bg-linear-to-br from-white/60 via-transparent to-transparent dark:from-white/5" />

            <div className="relative">
              <div className="mb-6 text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-linear-to-br from-blue-500 to-indigo-600 shadow-lg shadow-blue-500/30">
                  <svg className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h2 className="text-2xl font-semibold text-slate-900 dark:text-white">
                  Welcome back
                </h2>
                <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                  You're signed in
                </p>
              </div>

              <div className="space-y-3 rounded-3xl bg-white/50 p-6 dark:bg-black/20">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-slate-600 dark:text-slate-400">Email</span>
                  <span className="text-sm text-slate-900 dark:text-white">{currentUser.email}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-slate-600 dark:text-slate-400">User ID</span>
                  <span className="font-mono text-xs text-slate-700 dark:text-slate-300">
                    {currentUser.id.slice(0, 8)}...
                  </span>
                </div>
                {currentUser.last_sign_in_at && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-slate-600 dark:text-slate-400">Last sign in</span>
                    <span className="text-xs text-slate-700 dark:text-slate-300">
                      {new Date(currentUser.last_sign_in_at).toLocaleDateString()}
                    </span>
                  </div>
                )}
              </div>

              <button
                onClick={handleSignOut}
                className="mt-6 w-full rounded-full bg-slate-900 px-6 py-3.5 text-sm font-semibold text-white shadow-lg transition-all hover:scale-[1.02] hover:bg-slate-800 active:scale-[0.98] dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-linear-to-br from-slate-50 via-blue-50 to-indigo-50 p-4 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <div className="w-full max-w-md">
        <div className="relative overflow-hidden rounded-4xl border border-white/20 bg-white/40 p-8 shadow-2xl shadow-black/10 backdrop-blur-2xl dark:border-white/10 dark:bg-white/5 dark:shadow-black/50">
          <div className="pointer-events-none absolute inset-0 bg-linear-to-br from-white/60 via-transparent to-transparent dark:from-white/5" />

          <div className="relative">
            <div className="mb-6 text-center">
              <h1 className="text-3xl font-semibold text-slate-900 dark:text-white">
                {mode === "signin" ? "Welcome back" : "Create account"}
              </h1>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                {mode === "signin"
                  ? "Sign in to continue to your account"
                  : "Sign up to get started"}
              </p>
            </div>

            <div className="mb-6 flex rounded-full bg-slate-200/60 p-1 dark:bg-slate-800/60">
              {(["signin", "signup"] as Mode[]).map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => setMode(option)}
                  className={`flex-1 rounded-full px-4 py-2.5 text-sm font-semibold transition-all ${mode === option
                    ? "bg-white text-slate-900 shadow-md dark:bg-slate-700 dark:text-white"
                    : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
                    }`}
                >
                  {option === "signin" ? "Sign In" : "Sign Up"}
                </button>
              ))}
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="email" className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="you@example.com"
                  className="w-full rounded-2xl border border-slate-300/50 bg-white/60 px-4 py-3.5 text-slate-900 placeholder-slate-400 backdrop-blur-sm transition-all focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/20 dark:border-white/10 dark:bg-white/5 dark:text-white dark:placeholder-slate-500 dark:focus:border-blue-400"
                />
              </div>

              <div>
                <label htmlFor="password" className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  placeholder="At least 6 characters"
                  className="w-full rounded-2xl border border-slate-300/50 bg-white/60 px-4 py-3.5 text-slate-900 placeholder-slate-400 backdrop-blur-sm transition-all focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/20 dark:border-white/10 dark:bg-white/5 dark:text-white dark:placeholder-slate-500 dark:focus:border-blue-400"
                />
              </div>

              <button
                type="submit"
                className="w-full rounded-full bg-slate-900 px-6 py-3.5 text-sm font-semibold text-white shadow-lg transition-all hover:scale-[1.02] hover:bg-slate-800 active:scale-[0.98] dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100"
              >
                {mode === "signin" ? "Sign In" : "Create Account"}
              </button>
            </form>

            {status && (
              <div className="mt-4 rounded-2xl bg-blue-50/80 px-4 py-3 text-sm text-blue-900 dark:bg-blue-900/20 dark:text-blue-200">
                {status}
              </div>
            )}

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-300/50 dark:border-slate-700/50" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="bg-transparent px-4 text-slate-500 dark:text-slate-400">
                  Or continue with
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleGoogleLogin}
              className="flex w-full items-center justify-center gap-3 rounded-full border border-slate-300/50 bg-white/60 px-6 py-3.5 text-sm font-semibold text-slate-900 shadow-sm backdrop-blur-sm transition-all hover:scale-[1.02] hover:bg-white/80 active:scale-[0.98] dark:border-white/10 dark:bg-white/5 dark:text-white dark:hover:bg-white/10"
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Continue with Google
            </button>
          </div>
        </div>

        <p className="mt-6 text-center text-xs text-slate-600 dark:text-slate-400">
          Secured by Supabase Auth
        </p>
      </div>
    </div>
  );
}