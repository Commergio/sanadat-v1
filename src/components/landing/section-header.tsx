import { cn } from "@/lib/utils";

interface SectionHeaderProps {
  label: string;
  title: string;
  subtitle?: string;
  align?: "center" | "start";
  className?: string;
}

export function SectionHeader({
  label,
  title,
  subtitle,
  align = "center",
  className,
}: SectionHeaderProps) {
  const centered = align === "center";

  return (
    <div
      className={cn(
        "mb-14 sm:mb-16 lg:mb-20",
        centered && "mx-auto max-w-3xl text-center",
        !centered && "max-w-2xl",
        className
      )}
    >
      <p className="mb-4 inline-flex items-center rounded-full border border-primary/20 bg-primary/5 px-3.5 py-1 text-xs font-semibold uppercase tracking-wider text-primary">
        {label}
      </p>
      <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl lg:text-[2.75rem] lg:leading-tight">
        {title}
      </h2>
      {subtitle && (
        <p
          className={cn(
            "mt-4 text-base leading-relaxed text-muted-foreground sm:text-lg",
            centered && "mx-auto max-w-2xl"
          )}
        >
          {subtitle}
        </p>
      )}
    </div>
  );
}
