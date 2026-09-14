import Link from "next/link";
import { siteConfig } from "@/config/site";

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="mt-auto border-t border-stone-100 bg-white">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 py-10">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6">

          {/* Left: wordmark + tagline */}
          <div className="text-center sm:text-left">
            <Link
              href="/"
              className="font-serif font-bold text-stone-900 hover:text-brand transition-colors duration-150"
            >
              {siteConfig.name}
            </Link>
            <p className="mt-0.5 text-xs font-sans text-stone-400">
              {siteConfig.description}
            </p>
          </div>

          {/* Right: copyright */}
          <p className="text-xs font-sans text-stone-400">
            © {year} {siteConfig.authorName}
          </p>
        </div>
      </div>
    </footer>
  );
}
