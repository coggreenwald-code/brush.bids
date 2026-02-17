import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { SiGoogle, SiApple, SiGithub } from "react-icons/si";
import { Mail, ArrowRight } from "lucide-react";
import logoImage from "@/assets/logo.png";

const providers = [
  { label: "Continue with Google", icon: SiGoogle },
  { label: "Continue with Apple", icon: SiApple },
  { label: "Continue with GitHub", icon: SiGithub },
  { label: "Continue with Email", icon: Mail },
];

export default function Auth() {
  const handleSignIn = () => {
    window.location.href = "/api/login";
  };

  return (
    <Layout>
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          <div className="text-center mb-10">
            <div className="w-12 h-12 mx-auto mb-4">
              <img src={logoImage} alt="BrushBids" className="w-full h-full dark:invert" />
            </div>
            <h1 className="text-3xl font-display font-bold tracking-tight" data-testid="text-auth-title">
              Welcome to BrushBids
            </h1>
            <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
              Sign in to submit artwork, place bids, and join our community of student artists and collectors.
            </p>
          </div>

          <div className="space-y-3">
            {providers.map((provider) => (
              <Button
                key={provider.label}
                variant="outline"
                size="lg"
                className="w-full justify-start gap-3 rounded-md text-sm font-normal"
                onClick={handleSignIn}
                data-testid={`button-${provider.label.toLowerCase().replace(/\s+/g, '-')}`}
              >
                <provider.icon className="w-4 h-4 flex-shrink-0" />
                {provider.label}
                <ArrowRight className="w-3.5 h-3.5 ml-auto text-muted-foreground" />
              </Button>
            ))}
          </div>

          <div className="mt-8 text-center">
            <p className="text-xs text-muted-foreground leading-relaxed">
              By continuing, you agree to our{" "}
              <a href="/terms" className="underline underline-offset-2 hover:text-foreground transition-colors" data-testid="link-terms">
                Terms of Service
              </a>{" "}
              and{" "}
              <a href="/terms" className="underline underline-offset-2 hover:text-foreground transition-colors" data-testid="link-privacy">
                Privacy Policy
              </a>
              .
            </p>
          </div>

          <div className="mt-10 pt-8 border-t border-[#e8e0d8] dark:border-border text-center">
            <p className="text-xs text-muted-foreground">
              Secured by Replit Authentication
            </p>
          </div>
        </motion.div>
      </div>
    </Layout>
  );
}
