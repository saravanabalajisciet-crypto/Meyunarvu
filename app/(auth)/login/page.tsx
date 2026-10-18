import type { Metadata } from "next";
import Link from "next/link";
import LoginForm from "./LoginForm";
import { siteConfig } from "@/config/site";

export const metadata: Metadata = {
  title: "Sign in",
  robots: { index: false },
};

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-white px-4">
      <div className="w-full max-w-sm">
        {/* Wordmark */}
        <div className="mb-10 text-center">
          <span className="text-2xl font-serif font-semibold tracking-tight text-stone-900">
            {siteConfig.name}
          </span>
          <p className="mt-1 text-sm text-stone-500">Sign in to your account</p>
        </div>

        <LoginForm />

        <p className="mt-6 text-center text-sm text-stone-500">
          Don&apos;t have an account?{" "}
          <Link
            href="/signup"
            className="font-medium text-brand hover:text-brand-dark"
          >
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}