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
  ChevronDown
} from "lucide-react";
import logoImage from "@/assets/logo.png";
import { useState } from "react";
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
    <div className="min-h-screen bg-background flex flex-col">
      <header className="sticky top-0 z-50 w-full border-b bg-white/95 dark:bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-white/80 dark:supports-[backdrop-filter]:bg-background/80">
        <div className="container mx-auto flex h-16 items-center justify-between gap-4 px-4 md:px-8 max-w-7xl">
          <Link href="/" className="flex items-center gap-2.5 flex-shrink-0" data-testid="link-home-logo">
            <div className="w-8 h-8 flex items-center justify-center">
              <img src={logoImage} alt="BrushBids" className="w-full h-full dark:invert" />
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-display font-bold text-[#4C392D] dark:text-foreground leading-tight">BrushBids</span>
              <span className="text-[10px] text-[#9E8472] dark:text-muted-foreground font-medium tracking-widest uppercase leading-tight">Art Auctions</span>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-1" data-testid="nav-desktop">
            {filteredNav.map((item) => {
              const isActive = location === item.href;
              return (
                <Link key={item.href} href={item.href}>
                  <button 
                    className={cn(
                      "flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors",
                      isActive 
                        ? "text-[#4C392D] dark:text-foreground bg-[#4C392D]/5 dark:bg-foreground/5" 
                        : "text-[#9E8472] dark:text-muted-foreground hover:text-[#4C392D] dark:hover:text-foreground hover:bg-[#4C392D]/5 dark:hover:bg-foreground/5"
                    )}
                    data-testid={`nav-${item.label.toLowerCase().replace(' ', '-')}`}
                  >
                    <item.icon className="w-4 h-4" />
                    {item.label}
                  </button>
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-muted transition-colors" data-testid="button-user-menu">
                    <Avatar className="w-8 h-8">
                      <AvatarFallback className="bg-[#9E8472] text-white text-xs font-bold">
                        {user?.firstName?.charAt(0).toUpperCase() || user?.username?.charAt(0).toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <span className="hidden md:block text-sm font-medium text-foreground">
                      {user?.firstName || user?.username || 'User'}
                    </span>
                    <ChevronDown className="w-3.5 h-3.5 text-muted-foreground hidden md:block" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <div className="px-2 py-1.5">
                    <p className="text-sm font-medium">{user?.firstName || user?.username}</p>
                    <p className="text-xs text-muted-foreground capitalize">{user?.role === "both" ? "Artist & Collector" : user?.role}</p>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/dashboard" className="cursor-pointer">
                      <LayoutDashboard className="w-4 h-4 mr-2" /> Dashboard
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => logout()} className="cursor-pointer text-destructive" data-testid="button-sign-out">
                    <LogOut className="w-4 h-4 mr-2" /> Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button 
                onClick={() => window.location.href = "/api/login"}
                className="bg-[#4C392D] text-white hover:bg-[#3a2b22] rounded-md"
                data-testid="button-sign-in"
              >
                Sign In
              </Button>
            )}

            <button 
              className="md:hidden p-2 rounded-md hover:bg-muted transition-colors"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              data-testid="button-mobile-menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden border-t bg-white dark:bg-background" data-testid="nav-mobile">
            <nav className="container mx-auto px-4 py-3 space-y-1">
              {filteredNav.map((item) => {
                const isActive = location === item.href;
                return (
                  <Link key={item.href} href={item.href}>
                    <button 
                      className={cn(
                        "flex items-center gap-3 w-full px-4 py-3 rounded-md text-sm font-medium transition-colors",
                        isActive 
                          ? "text-[#4C392D] dark:text-foreground bg-[#4C392D]/5 dark:bg-foreground/5" 
                          : "text-[#9E8472] dark:text-muted-foreground"
                      )}
                      onClick={() => setMobileMenuOpen(false)}
                      data-testid={`nav-mobile-${item.label.toLowerCase().replace(' ', '-')}`}
                    >
                      <item.icon className="w-5 h-5" />
                      {item.label}
                    </button>
                  </Link>
                );
              })}
            </nav>
          </div>
        )}
      </header>

      <main className="flex-1">
        <div className="container mx-auto p-4 md:p-8 max-w-7xl animate-in fade-in duration-500">
          {children}
        </div>
      </main>
    </div>
  );
}
