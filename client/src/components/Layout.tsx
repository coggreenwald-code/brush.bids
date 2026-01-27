import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { 
  Palette, 
  LayoutDashboard, 
  ShieldCheck, 
  LogOut, 
  Menu, 
  X,
  Gavel,
  Home,
  Heart
} from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { user, logout, isAuthenticated } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { label: "Home", href: "/", icon: Home, roles: ["all"] },
    { label: "Gallery", href: "/gallery", icon: Palette, roles: ["all"] },
    { label: "My Bids", href: "/my-bids", icon: Heart, roles: ["buyer", "artist"] },
    { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard, roles: ["artist"] },
    { label: "Admin", href: "/admin", icon: ShieldCheck, roles: ["admin"] },
  ];

  const filteredNav = navItems.filter(item => 
    item.roles.includes("all") || (user && item.roles.includes(user.role))
  );

  return (
    <div className="min-h-screen bg-background flex flex-col md:flex-row">
      {/* Mobile Header */}
      <div className="md:hidden flex items-center justify-between p-4 border-b bg-card">
        <Link href="/" className="text-2xl font-display font-bold text-primary flex items-center gap-2">
          <Gavel className="w-6 h-6" /> BrushBids
        </Link>
        <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
          {mobileMenuOpen ? <X /> : <Menu />}
        </button>
      </div>

      {/* Sidebar / Mobile Menu */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-50 w-64 bg-card border-r transform transition-transform duration-200 ease-in-out md:relative md:translate-x-0 flex flex-col",
        mobileMenuOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full"
      )}>
        <div className="p-6 hidden md:block">
          <Link href="/" className="text-3xl font-display font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent flex items-center gap-2">
            <Gavel className="w-8 h-8 text-primary" /> BrushBids
          </Link>
          <p className="text-xs text-muted-foreground mt-2 font-medium tracking-wider uppercase">Student Art Auction</p>
        </div>

        <nav className="flex-1 px-4 py-4 space-y-2">
          {filteredNav.map((item) => {
            const isActive = location === item.href;
            return (
              <Link key={item.href} href={item.href}>
                <div className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 cursor-pointer group",
                  isActive 
                    ? "bg-primary/10 text-primary font-semibold" 
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}>
                  <item.icon className={cn("w-5 h-5", isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground")} />
                  {item.label}
                </div>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t bg-muted/20">
          {isAuthenticated ? (
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-3 px-2">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white font-bold">
                  {user?.username?.charAt(0).toUpperCase()}
                </div>
                <div className="overflow-hidden">
                  <p className="font-semibold truncate">{user?.username}</p>
                  <p className="text-xs text-muted-foreground capitalize">{user?.role}</p>
                </div>
              </div>
              <Button 
                variant="outline" 
                className="w-full justify-start gap-2" 
                onClick={() => logout()}
              >
                <LogOut className="w-4 h-4" /> Sign Out
              </Button>
            </div>
          ) : (
            <Button 
              className="w-full bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20" 
              onClick={() => window.location.href = "/api/login"}
            >
              Sign In
            </Button>
          )}
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto h-[calc(100vh-64px)] md:h-screen bg-secondary/30">
        <div className="container mx-auto p-4 md:p-8 max-w-7xl animate-in fade-in duration-500">
          {children}
        </div>
      </main>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}
    </div>
  );
}
