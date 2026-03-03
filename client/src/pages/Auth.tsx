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
              <img src={logoImage} alt="BrushBids" className="w-full h-full invert" />
            </div>
            <span className="text-xs font-medium text-[#A78BFA] uppercase tracking-[0.3em]">Welcome Back</span>
            <h1 className="text-3xl font-display font-semibold tracking-tight text-white mt-2" data-testid="text-auth-title">
              Welcome to BrushBids
            </h1>
            <p className="text-white/50 mt-2 text-sm leading-relaxed">
              Sign in to submit artwork, place bids, and join our community of student artists and collectors.
            </p>
          </div>

          <div className="space-y-3">
            {providers.map((provider) => (
              <button
                key={provider.label}
                className="w-full flex items-center gap-3 rounded-full px-5 py-3 text-sm font-normal border border-white/10 text-white/80 bg-white/[0.02] transition-colors hover:bg-white/[0.06] hover:border-white/20"
                onClick={handleSignIn}
                data-testid={`button-${provider.label.toLowerCase().replace(/\s+/g, '-')}`}
              >
                <provider.icon className="w-4 h-4 flex-shrink-0 text-white/60" />
                {provider.label}
                <ArrowRight className="w-3.5 h-3.5 ml-auto text-white/30" />
              </button>
            ))}
          </div>

          <div className="mt-8 text-center">
            <p className="text-xs text-white/40 leading-relaxed">
              By continuing, you agree to our{" "}
              <a href="/terms" className="underline underline-offset-2 text-[#A78BFA]/70 hover:text-[#A78BFA] transition-colors" data-testid="link-terms">
                Terms of Service
              </a>{" "}
              and{" "}
              <a href="/terms" className="underline underline-offset-2 text-[#A78BFA]/70 hover:text-[#A78BFA] transition-colors" data-testid="link-privacy">
                Privacy Policy
              </a>
              .
            </p>
          </div>

          <div className="mt-10 pt-8 border-t border-white/5 text-center">
            <p className="text-xs text-white/30">
              Secured by Replit Authentication
            </p>
          </div>
        </motion.div>
      </div>
    </Layout>
  );
}
