import { Inbox } from "lucide-react";

interface AdminEmptyStateProps {
  title: string;
  description: string;
}

export function AdminEmptyState({ title, description }: AdminEmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-muted/20 px-6 py-16 text-center">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
        <Inbox className="h-6 w-6 text-muted-foreground" />
      </div>
      <p className="text-sm font-semibold">{title}</p>
      <p className="mt-1 max-w-sm text-xs text-muted-foreground">{description}</p>
    </div>
  );
}
