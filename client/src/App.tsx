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
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
