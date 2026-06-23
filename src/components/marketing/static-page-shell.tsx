import { MarketingHeader } from "@/components/layout/marketing-header";
import { MarketingFooter } from "@/components/layout/marketing-footer";

interface StaticPageShellProps {
  title: string;
  updated?: string;
  children: React.ReactNode;
}

export function StaticPageShell({ title, updated, children }: StaticPageShellProps) {
  return (
    <>
      <MarketingHeader />
      <main className="marketing-shell min-w-0 pt-24 pb-16">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <header className="mb-10">
            <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              {title}
            </h1>
            {updated ? (
              <p className="mt-3 text-sm text-muted-foreground">{updated}</p>
            ) : null}
          </header>
          <div className="prose prose-neutral max-w-none space-y-8 dark:prose-invert">
            {children}
          </div>
        </div>
      </main>
      <MarketingFooter />
    </>
  );
}
