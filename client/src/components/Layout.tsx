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
import logoImage from "@/assets/logo.png";
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
    { label: "My Bids", href: "/my-bids", icon: Heart, roles: ["buyer", "both"] },
    { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard, roles: ["artist", "both"] },
    { label: "Admin", href: "/admin", icon: ShieldCheck, roles: ["admin"] },
  ];

  const filteredNav = navItems.filter(item => 
    item.roles.includes("all") || (user && item.roles.includes(user.role))
  );

  return (
    <div className="min-h-screen bg-background flex flex-col md:flex-row">
      {/* Mobile Header */}
      <div className="md:hidden flex items-center justify-between p-4 border-b bg-[#1F4959] text-white">
        <Link href="/" className="text-2xl font-display font-bold flex items-center gap-2">
          <img src={logoImage} alt="BrushBids" className="w-7 h-7 invert" /> BrushBids
        </Link>
        <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} data-testid="button-mobile-menu">
          {mobileMenuOpen ? <X /> : <Menu />}
        </button>
      </div>

      {/* Sidebar / Mobile Menu */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-50 w-64 bg-[#1F4959] text-white transform transition-transform duration-200 ease-in-out md:relative md:translate-x-0 flex flex-col",
        mobileMenuOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full"
      )}>
        {/* Logo Section */}
        <div className="p-6 hidden md:block border-b border-white/10">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center p-1.5">
              <img src={logoImage} alt="BrushBids" className="w-full h-full invert" />
            </div>
            <div>
              <span className="text-2xl font-display font-bold">BrushBids</span>
              <p className="text-xs text-white/60 font-medium tracking-wider uppercase">ART AUCTIONS</p>
            </div>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-6 space-y-1">
          {filteredNav.map((item) => {
            const isActive = location === item.href;
            return (
              <Link key={item.href} href={item.href}>
                <div 
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 cursor-pointer group",
                    isActive 
                      ? "bg-white/15 text-white font-semibold" 
                      : "text-white/70 hover:bg-white/10 hover:text-white"
                  )}
                  data-testid={`nav-${item.label.toLowerCase().replace(' ', '-')}`}
                >
                  <item.icon className={cn("w-5 h-5", isActive ? "text-white" : "text-white/70 group-hover:text-white")} />
                  {item.label}
                </div>
              </Link>
            );
          })}
        </nav>

        {/* User Section */}
        <div className="p-4 border-t border-white/10">
          {isAuthenticated ? (
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-3 px-2">
                <div className="w-10 h-10 rounded-full bg-[#5C7C89] flex items-center justify-center text-white font-bold text-sm">
                  {user?.firstName?.charAt(0).toUpperCase() || user?.username?.charAt(0).toUpperCase() || 'U'}
                </div>
                <div className="overflow-hidden">
                  <p className="font-semibold truncate text-white">
                    {user?.firstName || user?.username || 'User'}
                  </p>
                  <p className="text-xs text-white/60 capitalize">{user?.role === "both" ? "Artist & Collector" : user?.role}</p>
                </div>
              </div>
              <Button 
                variant="outline" 
                className="w-full justify-start gap-2 border-white/20 text-white hover:bg-white/10 hover:text-white" 
                onClick={() => logout()}
                data-testid="button-sign-out"
              >
                <LogOut className="w-4 h-4" /> Sign Out
              </Button>
            </div>
          ) : (
            <Button 
              className="w-full bg-white text-[#1F4959] hover:bg-white/90 font-semibold shadow-lg" 
              onClick={() => window.location.href = "/api/login"}
              data-testid="button-sign-in"
            >
              Sign In
            </Button>
          )}
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto h-[calc(100vh-64px)] md:h-screen">
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
