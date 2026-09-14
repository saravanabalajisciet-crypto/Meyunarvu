type Variant = "default" | "brand" | "draft" | "published" | "tag";

interface BadgeProps {
  children: React.ReactNode;
  variant?: Variant;
  className?: string;
}

const variantClasses: Record<Variant, string> = {
  default:   "bg-stone-100 text-stone-600",
  brand:     "bg-brand-light text-brand",
  draft:     "bg-amber-50 text-amber-600 border border-amber-100",
  published: "bg-emerald-50 text-emerald-700 border border-emerald-100",
  tag:       "bg-stone-100 text-stone-500 hover:bg-stone-200 transition-colors duration-100",
};

export default function Badge({
  children,
  variant = "default",
  className = "",
}: BadgeProps) {
  return (
    <span
      className={[
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-sans font-medium",
        variantClasses[variant],
        className,
      ].join(" ")}
    >
      {children}
    </span>
  );
}
