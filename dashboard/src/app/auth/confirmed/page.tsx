"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function EmailConfirmedPage() {
  const router = useRouter();
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          router.push("/dashboard");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f5f5f7] px-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-xl border border-gray-200/60 p-6 sm:p-8">
          <div className="mb-6 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-green-50">
              <svg
                className="h-7 w-7 text-green-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <h1 className="text-2xl font-semibold text-gray-900 tracking-tight">
              Email verified
            </h1>
            <p className="mt-2 text-sm text-gray-500">
              Your account has been confirmed successfully. You will be
              redirected to the dashboard in{" "}
              <span className="font-medium text-gray-900">{countdown}</span>{" "}
              seconds.
            </p>
          </div>

          <button
            onClick={() => router.push("/dashboard")}
            className="w-full inline-flex items-center justify-center px-4 py-2.5 text-sm font-medium text-white bg-linear-to-r from-blue-500 to-cyan-400 hover:from-blue-600 hover:to-cyan-500 rounded-lg transition-all shadow-sm"
          >
            Go to Dashboard
          </button>
        </div>

        <p className="mt-6 text-center text-xs text-gray-500">
          Secured by Supabase Auth
        </p>
      </div>
    </div>
  );
}