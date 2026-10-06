import "../pages/cyrclo.css";
import { useState, useEffect } from "react";
import { Link } from "wouter";
import { SiInstagram, SiX, SiLinkedin, SiFacebook } from "react-icons/si";
import { SOCIAL_URLS } from "@shared/siteConfig";
import { LayoutDashboard, LogOut, ChevronDown } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import brushBidsLogo from "@assets/BrushBids_Logo_1772561349423.png";

const SOCIALS = [
  { Icon: SiInstagram, href: SOCIAL_URLS.instagram, label: "Instagram", small: false },
  { Icon: SiX, href: SOCIAL_URLS.x, label: "X", small: true },
  { Icon: SiLinkedin, href: SOCIAL_URLS.linkedin, label: "LinkedIn", small: false },
  { Icon: SiFacebook, href: SOCIAL_URLS.facebook, label: "Facebook", small: false },
].filter((s) => s.href);

function SocialLinks() {
  if (SOCIALS.length === 0) return null;
  return (
    <div className="social-media-wrapper">
      {SOCIALS.map(({ Icon, href, label, small }) => (
        <a key={label} aria-label={label} href={href} target="_blank" rel="noreferrer" className="social-link w-inline-block">
          <div className={small ? "social-icon-wrap smaller-icon" : "social-icon-wrap"}>
            <div className="social-icon w-embed"><Icon size={small ? 18 : 22} /></div>
            <div className="social-icon w-embed"><Icon size={small ? 18 : 22} /></div>
          </div>
        </a>
      ))}
    </div>
  );
}

type MenuLink = { label: string; href?: string; onClick?: () => void };

/**
 * Shared site navigation. Renders the Cyrclo "notch" hamburger menu that opens a
 * full-screen overlay with the site links and social icons. Used on every page so
 * the navigation is identical across the whole site.
 */
export function SiteMenu() {
  const [open, setOpen] = useState(false);
  const { user, logout, isAuthenticated } = useAuth();

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = open ? "hidden" : prev;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const links: MenuLink[] = [
    { label: "Home", href: "/" },
    { label: "Gallery", href: "/gallery" },
    { label: "About", href: "/about" },
    { label: "FAQ", href: "/faq" },
  ];

  if (isAuthenticated) {
    if (user?.role === "buyer" || user?.role === "both") {
      links.push({ label: "My Bids", href: "/my-bids" });
    }
    if (user?.role === "artist" || user?.role === "both") {
      links.push({ label: "Dashboard", href: "/dashboard" });
    }
    if (user?.role === "admin") {
      links.push({ label: "Admin", href: "/admin" });
    }
    links.push({ label: "Sign Out", onClick: () => logout() });
  } else {
    links.push({ label: "Sign In", href: "/auth" });
  }

  return (
    <div className="cyrclo-page">
      <Link
        href="/"
        className="hidden md:flex items-center gap-2.5 fixed top-4 left-6 z-[1001]"
        data-testid="link-home-logo"
      >
        <div className="w-8 h-8 flex items-center justify-center">
          <img src={brushBidsLogo} alt="BrushBids" className="w-full h-full brightness-0 invert" />
        </div>
        <span className="text-lg font-bold text-white tracking-tight">BrushBids</span>
      </Link>

      <div className="hidden md:flex items-center fixed top-3 right-6 z-[1001]">
        {isAuthenticated ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className="flex items-center gap-2 px-3 py-1.5 rounded-full hover:bg-white/10 transition-colors"
                data-testid="button-user-menu"
              >
                <Avatar className="w-7 h-7">
                  <AvatarFallback className="bg-[#A78BFA]/20 text-[#A78BFA] text-xs font-bold border border-[#A78BFA]/30">
                    {user?.firstName?.charAt(0).toUpperCase() || user?.username?.charAt(0).toUpperCase() || "U"}
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm text-white/80">
                  {user?.firstName || user?.username || "User"}
                </span>
                <ChevronDown className="w-3 h-3 text-white/40" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 bg-[#1a1a2e] border-white/10">
              <div className="px-2 py-1.5">
                <p className="text-sm font-medium text-white">{user?.firstName || user?.username}</p>
                <p className="text-xs text-white/50 capitalize">
                  {user?.role === "both" ? "Artist & Collector" : user?.role}
                </p>
              </div>
              <DropdownMenuSeparator className="bg-white/10" />
              <DropdownMenuItem asChild>
                <Link href="/dashboard" className="cursor-pointer text-white/70 hover:text-white">
                  <LayoutDashboard className="w-4 h-4 mr-2" /> Dashboard
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-white/10" />
              <DropdownMenuItem
                onClick={() => logout()}
                className="cursor-pointer text-red-400 hover:text-red-300"
                data-testid="button-sign-out"
              >
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
      </div>

      <div role="banner" className="navbar w-nav">
        <div className="nav-wrapper">
          <div className="nav-block">
            <nav role="navigation" className={open ? "nav-menu w-nav-menu is-open" : "nav-menu w-nav-menu"}>
              <div className="nav-menu-container">
                <div className="nav-menu-content">
                  <div className="nav-menu-list">
                    {links.map((l) => {
                      const testId = `nav-${l.label.toLowerCase().replace(/\s+/g, "-")}`;
                      return (
                        <div className="nav-overflow" key={l.label}>
                          {l.href ? (
                            <Link
                              href={l.href}
                              onClick={() => setOpen(false)}
                              className="nav-link w-inline-block"
                              data-testid={testId}
                            >
                              <div className="nav-text">{l.label}</div>
                              <div className="nav-text">{l.label}</div>
                            </Link>
                          ) : (
                            <button
                              type="button"
                              onClick={() => {
                                setOpen(false);
                                l.onClick?.();
                              }}
                              className="nav-link nav-link-button w-inline-block"
                              data-testid={testId}
                            >
                              <div className="nav-text">{l.label}</div>
                              <div className="nav-text">{l.label}</div>
                            </button>
                          )}
                        </div>
                      );
                    })}
                    <div className="nav-overflow">
                      <div className="nav-social-media">
                        <SocialLinks />
                      </div>
                    </div>
                  </div>
                </div>
                <div className="nav-background"></div>
              </div>
            </nav>
            <button
              type="button"
              className={open ? "menu-button w-nav-button is-open" : "menu-button w-nav-button"}
              onClick={() => setOpen((v) => !v)}
              aria-label={open ? "Close menu" : "Open menu"}
              aria-expanded={open}
              data-testid="button-menu"
            >
              <div className="nav-menu-block">
                <div className="menu-button-wrap">
                  <div className="menu-line-item"><div className="menu-line top"></div></div>
                  <div className="menu-line-item"><div className="menu-line middle"></div></div>
                  <div className="menu-line-item"><div className="menu-line bottom"></div></div>
                </div>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
