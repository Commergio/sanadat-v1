"use client";

interface AppFooterBarProps {
  showAdminLink?: boolean;
}

export function AppFooterBar({ showAdminLink: _showAdminLink = false }: AppFooterBarProps) {
  return (
    <footer className="mt-auto border-t border-border/60 px-4 py-3 lg:px-8">
      <p className="text-center text-[11px] text-muted-foreground">
        © {new Date().getFullYear()} Sanadat
      </p>
    </footer>
  );
}
