import { Brand } from "@/components/brand";
import { ModeToggle } from "@/components/mode-toggle";

export function SiteHeader({ children }: { children?: React.ReactNode }) {
  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur">
      <div className="mx-auto flex h-14 w-full max-w-5xl items-center justify-between px-4 sm:px-6">
        <Brand />
        <div className="flex items-center gap-2">
          {children}
          <ModeToggle />
        </div>
      </div>
    </header>
  );
}
