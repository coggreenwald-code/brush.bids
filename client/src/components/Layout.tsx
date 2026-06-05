import { SiteMenu } from "@/components/SiteMenu";

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SiteMenu />
      <main className="flex-1 pt-16">
        {children}
      </main>
    </div>
  );
}
