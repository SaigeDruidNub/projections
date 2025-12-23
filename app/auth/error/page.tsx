"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Suspense } from "react";

function AuthErrorContent() {
  const searchParams = useSearchParams();
  const error = searchParams.get("error");

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 dark:bg-gray-900">
      <div className="w-full max-w-md space-y-8 rounded-lg bg-white dark:bg-black p-8 shadow-lg">
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
            Authentication Error
          </h2>

          {error === "AccessDenied" && (
            <div className="mt-4 space-y-4">
              <p className="text-red-600 dark:text-red-400">
                Access denied. You do not have permission to sign in.
              </p>
              <div className="rounded-md bg-yellow-50 dark:bg-yellow-900/20 p-4 text-left">
                <p className="text-sm text-yellow-800 dark:text-yellow-200 font-semibold mb-2">
                  Possible reasons:
                </p>
                <ul className="text-sm text-yellow-700 dark:text-yellow-300 list-disc list-inside space-y-1">
                  <li>
                    Your email is not added to the test users in Google Cloud
                    Console
                  </li>
                  <li>The OAuth app is in testing mode and restricts access</li>
                  <li>
                    Your Google account doesn't meet the app's requirements
                  </li>
                </ul>
              </div>
              <div className="rounded-md bg-accent-olive/20 dark:bg-accent-olive/10 p-4 text-left border border-accent-olive">
                <p className="text-sm text-black dark:text-white font-semibold mb-2">
                  To fix this:
                </p>
                <ol className="text-sm text-black dark:text-white list-decimal list-inside space-y-1">
                  <li>Go to Google Cloud Console</li>
                  <li>Navigate to OAuth consent screen</li>
                  <li>Add your email to "Test users" list</li>
                  <li>Or publish the app to make it available to everyone</li>
                </ol>
              </div>
            </div>
          )}

          {error === "Configuration" && (
            <p className="mt-4 text-red-600 dark:text-red-400">
              There is a problem with the server configuration.
            </p>
          )}

          {error === "Verification" && (
            <p className="mt-4 text-red-600 dark:text-red-400">
              The verification token has expired or has already been used.
            </p>
          )}

          {!error && (
            <p className="mt-4 text-gray-600 dark:text-gray-400">
              An unknown error occurred during authentication.
            </p>
          )}

          <div className="mt-6">
            <Link
              href="/auth/signin"
              className="inline-flex items-center justify-center rounded-md bg-gray-900 dark:bg-white px-4 py-2 text-sm font-medium text-white dark:text-black hover:bg-gray-700 dark:hover:bg-gray-200"
            >
              Try Again
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AuthError() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-gray-100 dark:bg-gray-900">
          <div className="text-white">Loading...</div>
        </div>
      }
    >
      <AuthErrorContent />
    </Suspense>
  );
}
