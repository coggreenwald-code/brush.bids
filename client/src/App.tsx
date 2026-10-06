import { useState, useEffect, useRef } from "react";
import { Switch, Route, Redirect, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Lenis from "lenis";
import NotFound from "@/pages/not-found";
import Home from "@/pages/Home";
import Gallery from "@/pages/Gallery";
import Dashboard from "@/pages/Dashboard";
import ArtworkDetail from "@/pages/ArtworkDetail";
import SubmitArtwork from "@/pages/SubmitArtwork";
import Admin from "@/pages/Admin";
import About from "@/pages/About";
import FAQ from "@/pages/FAQ";
import Terms from "@/pages/Terms";
import Privacy from "@/pages/Privacy";
import Contact from "@/pages/Contact";
import MyBids from "@/pages/MyBids";
import ArtistProfile from "@/pages/ArtistProfile";
import Auth from "@/pages/Auth";
import { WelcomeModal } from "@/components/WelcomeModal";
import { NameRequiredModal } from "@/components/NameRequiredModal";
import { SignupPopup } from "@/components/SignupPopup";
import { useAuth } from "@/hooks/use-auth";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/gallery" component={Gallery} />
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/artwork/:id" component={ArtworkDetail} />
      <Route path="/artist/:id" component={ArtistProfile} />
      <Route path="/submit-artwork" component={SubmitArtwork} />
      <Route path="/admin" component={Admin} />
      <Route path="/about" component={About} />
      <Route path="/faq" component={FAQ} />
      <Route path="/terms" component={Terms} />
      <Route path="/privacy" component={Privacy} />
      <Route path="/contact" component={Contact} />
      <Route path="/my-bids" component={MyBids} />
      <Route path="/portfolio"><Redirect to="/dashboard" /></Route>
      <Route path="/auth" component={Auth} />
      <Route component={NotFound} />
    </Switch>
  );
}

function OnboardingWrapper({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated } = useAuth();
  const [showWelcome, setShowWelcome] = useState(false);
  const [nameSaved, setNameSaved] = useState(false);

  useEffect(() => {
    if (isAuthenticated && user && !user.hasCompletedOnboarding) {
      setShowWelcome(true);
    }
  }, [isAuthenticated, user]);

  const needsName = !!user && !!user.hasCompletedOnboarding && !nameSaved
    && (user.role === "artist" || user.role === "both")
    && (!user.firstName?.trim() || !user.lastName?.trim());

  return (
    <>
      {children}
      {user && (
        <WelcomeModal 
          isOpen={showWelcome} 
          userId={user.id}
          existingFirstName={user.firstName}
          existingLastName={user.lastName}
          onComplete={() => setShowWelcome(false)}
        />
      )}
      {user && needsName && (
        <NameRequiredModal userId={user.id} isOpen onComplete={() => setNameSaved(true)} />
      )}
    </>
  );
}

function SmoothScroll({ children }: { children: React.ReactNode }) {
  const lenisRef = useRef<Lenis | null>(null);

  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.4,
      easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
    });
    lenisRef.current = lenis;

    function raf(time: number) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);

    return () => {
      lenis.destroy();
    };
  }, []);

  return <>{children}</>;
}

function AppShell() {
  return (
    <SmoothScroll>
      <Toaster />
      <OnboardingWrapper>
        <Router />
      </OnboardingWrapper>
      <SignupPopup />
    </SmoothScroll>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AppShell />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
