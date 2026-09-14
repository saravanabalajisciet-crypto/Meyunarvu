interface SpinnerProps {
  size?: "sm" | "md" | "lg";
  className?: string;
  label?: string;
}

const sizeClasses = {
  sm: "h-3.5 w-3.5 border-[1.5px]",
  md: "h-5 w-5 border-2",
  lg: "h-7 w-7 border-2",
};

export default function Spinner({
  size = "md",
  className = "",
  label = "Loading…",
}: SpinnerProps) {
  return (
    <span
      role="status"
      aria-label={label}
      className={[
        "inline-block animate-spin rounded-full border-current border-t-transparent text-brand",
        sizeClasses[size],
        className,
      ].join(" ")}
    />
  );
}
