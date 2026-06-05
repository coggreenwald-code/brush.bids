import "../pages/cyrclo.css";
import { useState, useEffect } from "react";
import { Link } from "wouter";
import { SiInstagram, SiX, SiLinkedin, SiFacebook } from "react-icons/si";
import { useAuth } from "@/hooks/use-auth";

const SOCIALS = [
  { Icon: SiInstagram, href: "https://www.instagram.com/", label: "Instagram Link", small: false },
  { Icon: SiX, href: "https://www.x.com/", label: "X Link", small: true },
  { Icon: SiLinkedin, href: "https://www.linkedin.com/", label: "Linkedin Link", small: false },
  { Icon: SiFacebook, href: "https://www.facebook.com/", label: "Facebook Link", small: false },
];

function SocialLinks() {
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
