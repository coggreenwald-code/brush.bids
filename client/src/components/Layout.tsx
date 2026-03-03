import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { 
  Palette, 
  LayoutDashboard, 
  ShieldCheck, 
  LogOut, 
  Menu, 
  X,
  Home,
  Heart,
  ChevronDown,
  Users
} from "lucide-react";
import logoImage from "@/assets/logo.png";
import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { user, logout, isAuthenticated } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [visible, setVisible] = useState(true);
  const lastScrollY = useRef(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      setScrolled(currentScrollY > 20);
      if (currentScrollY > lastScrollY.current && currentScrollY > 100) {
        setVisible(false);
      } else {
        setVisible(true);
      }
      lastScrollY.current = currentScrollY;
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navItems = [
    { label: "Home", href: "/", icon: Home, roles: ["all"] },
    { label: "Gallery", href: "/gallery", icon: Palette, roles: ["all"] },
    { label: "About", href: "/about", icon: Users, roles: ["all"] },
    { label: "My Bids", href: "/my-bids", icon: Heart, roles: ["buyer", "both"] },
    { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard, roles: ["artist", "both"] },
    { label: "Admin", href: "/admin", icon: ShieldCheck, roles: ["admin"] },
  ];

  const filteredNav = navItems.filter(item => 
    item.roles.includes("all") || (user && item.roles.includes(user.role))
  );

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header 
        className={cn(
          "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
          scrolled 
            ? "glass-nav shadow-lg shadow-black/10" 
            : "bg-transparent",
          visible ? "translate-y-0" : "-translate-y-full"
        )}
      >
        <div className="container mx-auto flex h-16 items-center justify-between gap-6 px-4 md:px-8 max-w-7xl">
          <Link href="/" className="flex items-center gap-2.5 flex-shrink-0" data-testid="link-home-logo">
            <div className="w-8 h-8 flex items-center justify-center">
              <img src={logoImage} alt="BrushBids" className="w-full h-full brightness-0 invert" />
            </div>
            <span className="text-lg font-bold text-white tracking-tight">BrushBids</span>
          </Link>

          <nav className="hidden md:flex items-center gap-8" data-testid="nav-desktop">
            {filteredNav.map((item) => {
              const isActive = location === item.href;
              return (
                <Link key={item.href} href={item.href}>
                  <button 
                    className={cn(
                      "text-sm tracking-wide transition-colors duration-200 py-1 relative",
                      isActive 
                        ? "text-white font-medium" 
                        : "text-white/50 hover:text-white/80"
                    )}
                    data-testid={`nav-${item.label.toLowerCase().replace(' ', '-')}`}
                  >
                    {item.label}
                    {isActive && (
                      <span className="absolute -bottom-1 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#A78BFA] to-transparent" />
                    )}
                  </button>
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-2 px-3 py-1.5 rounded-full hover:bg-white/10 transition-colors" data-testid="button-user-menu">
                    <Avatar className="w-7 h-7">
                      <AvatarFallback className="bg-[#A78BFA]/20 text-[#A78BFA] text-xs font-bold border border-[#A78BFA]/30">
                        {user?.firstName?.charAt(0).toUpperCase() || user?.username?.charAt(0).toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <span className="hidden md:block text-sm text-white/80">
                      {user?.firstName || user?.username || 'User'}
                    </span>
                    <ChevronDown className="w-3 h-3 text-white/40 hidden md:block" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48 bg-[#1a1a2e] border-white/10">
                  <div className="px-2 py-1.5">
                    <p className="text-sm font-medium text-white">{user?.firstName || user?.username}</p>
                    <p className="text-xs text-white/50 capitalize">{user?.role === "both" ? "Artist & Collector" : user?.role}</p>
                  </div>
                  <DropdownMenuSeparator className="bg-white/10" />
                  <DropdownMenuItem asChild>
                    <Link href="/dashboard" className="cursor-pointer text-white/70 hover:text-white">
                      <LayoutDashboard className="w-4 h-4 mr-2" /> Dashboard
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="bg-white/10" />
                  <DropdownMenuItem onClick={() => logout()} className="cursor-pointer text-red-400 hover:text-red-300" data-testid="button-sign-out">
                    <LogOut className="w-4 h-4 mr-2" /> Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Link href="/auth">
                <Button 
                  className="rounded-full text-sm bg-white text-[#0a0a0f] font-medium px-6 hover:bg-white/90"
                  data-testid="button-sign-in"
                >
                  Sign In
                </Button>
              </Link>
            )}

            <button 
              className="md:hidden p-2 rounded-lg hover:bg-white/10 transition-colors text-white"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              data-testid="button-mobile-menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden border-t border-white/5 bg-[#0a0a0f]/98 backdrop-blur-xl" data-testid="nav-mobile">
            <nav className="container mx-auto px-4 py-4 space-y-1">
              {filteredNav.map((item) => {
                const isActive = location === item.href;
                return (
                  <Link key={item.href} href={item.href}>
                    <button 
                      className={cn(
                        "flex items-center gap-3 w-full px-4 py-3 rounded-lg text-sm transition-colors",
                        isActive 
                          ? "text-[#A78BFA] bg-[#A78BFA]/10 font-medium" 
                          : "text-white/60 hover:text-white hover:bg-white/5"
                      )}
                      onClick={() => setMobileMenuOpen(false)}
                      data-testid={`nav-mobile-${item.label.toLowerCase().replace(' ', '-')}`}
                    >
                      <item.icon className="w-4 h-4" />
                      {item.label}
                    </button>
                  </Link>
                );
              })}
            </nav>
          </div>
        )}
      </header>

      <main className="flex-1 pt-16">
        {children}
      </main>
    </div>
  );
}
