import type { Metadata } from "next";
import LoginForm from "./LoginForm";
import { siteConfig } from "@/config/site";

export const metadata: Metadata = {
  title: `Sign in — ${siteConfig.name}`,
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
          <p className="mt-1 text-sm text-stone-500">Author sign in</p>
        </div>

        <LoginForm />
      </div>
    </div>
  );
}
