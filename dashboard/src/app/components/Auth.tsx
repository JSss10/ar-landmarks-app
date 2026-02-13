"use client";

import { getSupabaseBrowserClient } from "@/lib/supabase/browser-client";
import { User } from "@supabase/supabase-js";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

type AuthProps = {
  user: User | null;
};

type Mode = "signup" | "signin";

export default function Auth({ user }: AuthProps) {
  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const supabase = getSupabaseBrowserClient();
  const [currentUser, setCurrentUser] = useState<User | null>(user);
  const router = useRouter();

  async function handleSignOut() {
    await supabase.auth.signOut();
    setCurrentUser(null);
    toast.success("Signed out successfully");
  }

  useEffect(() => {
    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setCurrentUser(session?.user ?? null);
        if (session?.user) {
          router.push("/dashboard");
        }
      }
    );

    return () => {
      listener?.subscription.unsubscribe();
    };
  }, [supabase, router]);

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
        toast.error(error.message);
      } else {
        toast.success("Check your inbox to confirm your account.");
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) {
        toast.error(error.message);
      } else {
        toast.success("Signed in successfully");
        router.push("/dashboard");
      }
    }
  }

  async function handleGoogleLogin() {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/dashboard`,
        skipBrowserRedirect: false,
      },
    });
  }

  if (currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f5f5f7] px-4">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-xl border border-gray-200/60 p-6 sm:p-8">
            <div className="mb-6 text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-green-50">
                <svg className="h-7 w-7 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-2xl font-semibold text-gray-900 tracking-tight">
                Welcome back
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                You're signed in
              </p>
            </div>

            <div className="space-y-3 rounded-xl bg-gray-50 p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-500">Email</span>
                <span className="text-sm text-gray-900">{currentUser.email}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-500">User ID</span>
                <span className="font-mono text-xs text-gray-600">
                  {currentUser.id.slice(0, 8)}...
                </span>
              </div>
              {currentUser.last_sign_in_at && (
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-500">Last sign in</span>
                  <span className="text-xs text-gray-600">
                    {new Date(currentUser.last_sign_in_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                  </span>
                </div>
              )}
            </div>

            <button
              onClick={handleSignOut}
              className="mt-6 w-full inline-flex items-center justify-center px-4 py-2.5 text-sm font-medium text-white bg-gray-900 hover:bg-gray-800 rounded-lg transition-colors"
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f5f5f7] px-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-xl border border-gray-200/60 p-6 sm:p-8">
          <div className="mb-6 text-center">
            <h1 className="text-2xl sm:text-3xl font-semibold text-gray-900 tracking-tight">
              {mode === "signin" ? "Welcome back" : "Create account"}
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              {mode === "signin"
                ? "Sign in to continue to your account"
                : "Sign up to get started"}
            </p>
          </div>

          <div className="mb-6 flex rounded-lg bg-gray-100 p-1">
            {(["signin", "signup"] as Mode[]).map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setMode(option)}
                className={`flex-1 rounded-md px-4 py-2 text-sm font-medium transition-colors ${mode === option
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
                  }`}
              >
                {option === "signin" ? "Sign In" : "Sign Up"}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-gray-700">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="you@example.com"
                className="w-full rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 transition-colors focus:border-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-200"
              />
            </div>

            <div>
              <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-gray-700">
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
                className="w-full rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 transition-colors focus:border-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-200"
              />
            </div>

            <button
              type="submit"
              className="w-full inline-flex items-center justify-center px-4 py-2.5 text-sm font-medium text-white bg-gray-900 hover:bg-gray-800 rounded-lg transition-colors"
            >
              {mode === "signin" ? "Sign In" : "Create Account"}
            </button>
          </form>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="bg-white px-4 text-gray-500">
                Or continue with
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleGoogleLogin}
            className="flex w-full items-center justify-center gap-3 rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
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

        <p className="mt-6 text-center text-xs text-gray-500">
          Secured by Supabase Auth
        </p>
      </div>
    </div>
  );
}