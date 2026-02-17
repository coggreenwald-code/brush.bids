import { useState, useEffect } from "react";
import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
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
import Contact from "@/pages/Contact";
import MyBids from "@/pages/MyBids";
import ArtistProfile from "@/pages/ArtistProfile";
import Auth from "@/pages/Auth";
import { WelcomeModal } from "@/components/WelcomeModal";
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
      <Route path="/contact" component={Contact} />
      <Route path="/my-bids" component={MyBids} />
      <Route path="/auth" component={Auth} />
      <Route component={NotFound} />
    </Switch>
  );
}

function OnboardingWrapper({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated } = useAuth();
  const [showWelcome, setShowWelcome] = useState(false);

  useEffect(() => {
    if (isAuthenticated && user && !user.hasCompletedOnboarding) {
      setShowWelcome(true);
    }
  }, [isAuthenticated, user]);

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
    </>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <OnboardingWrapper>
          <Router />
        </OnboardingWrapper>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
