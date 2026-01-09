import { motion } from "framer-motion";
import { Shell } from "../components/layout/Shell";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { CheckCircle2, Sparkles, Zap } from "lucide-react";
import { useToast } from "../hooks/use-toast";
import React, { useState, useEffect } from "react";
import { Input } from "../components/ui/input";
import { useLocation } from "wouter";

export default function ProPage() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [userTag, setUserTag] = useState("");
  const [location] = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("success")) {
      toast({
        title: "Payment Successful",
        description: `Pro activated for ${params.get("tag")}. Welcome to the elite.`,
      });
    }
    if (params.get("canceled")) {
      toast({
        variant: "destructive",
        title: "Payment Canceled",
        description: "Your checkout was not completed.",
      });
    }
  }, [location, toast]);

  const handleSubscribe = async () => {
    if (!userTag || !userTag.includes("#")) {
      toast({
        variant: "destructive",
        title: "Invalid Tag",
        description: "Please enter your valid Format user tag (e.g., Name#1234)",
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch("/api/stripe/create-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userTag }),
      });
      const { url, error } = await response.json();
      if (url) {
        window.location.href = url;
      } else {
        throw new Error(error || "Failed to create checkout session");
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Subscription Error",
        description: error.message || "Could not initiate checkout. Please try again later.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const benefits = [
    { title: "Unlimited AI Generations", desc: "No daily limits on FormatAI or neural processing." },
    { title: "Priority Search Results", desc: "Get faster, more relevant web results immediately." },
    { title: "Exclusive Minimalist Themes", desc: "Personalize your space with unique Pro aesthetics." },
    { title: "Early Access to Labs", desc: "Be the first to test experimental neural features." },
    { title: "Advanced Security Lab", desc: "Full access to deep digital fingerprinting tools." },
    { title: "Priority Support", desc: "24/7 dedicated assistance for your technical needs." },
  ];

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] py-12 px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="w-full max-w-4xl"
      >
        <div className="text-center space-y-4 mb-12">
          <h1 className="text-4xl md:text-5xl font-medium tracking-tight">Experience More.</h1>
          <p className="text-muted-foreground text-lg italic">The art of presence, elevated.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          <Card className="border-white/5 bg-white/5 backdrop-blur-2xl relative overflow-hidden group h-full">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-orange-500/10 opacity-50 group-hover:opacity-100 transition-opacity duration-500" />
            <CardHeader className="text-center relative z-10 pt-12 pb-8">
              <div className="flex justify-center mb-6">
                <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20">
                  <Sparkles className="w-8 h-8 text-primary" />
                </div>
              </div>
              <CardTitle className="text-3xl">Pro Membership</CardTitle>
              <CardDescription className="text-xl font-mono pt-2">
                $5 <span className="text-sm">/ month</span>
              </CardDescription>
            </CardHeader>
            <CardContent className="relative z-10 space-y-8 px-8 pb-12">
              <div className="pt-6 space-y-4">
                <div className="space-y-2">
                  <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground">Confirm User Tag</p>
                  <Input 
                    placeholder="Name#1234" 
                    value={userTag}
                    onChange={(e) => setUserTag(e.target.value)}
                    className="bg-white/5 border-white/10 rounded-xl py-6"
                    data-testid="input-user-tag"
                  />
                </div>

                <Button
                  onClick={handleSubscribe}
                  disabled={isLoading}
                  className="w-full py-6 text-lg font-medium bg-primary hover:bg-primary/90 transition-all duration-300 rounded-xl"
                  data-testid="button-subscribe"
                >
                  {isLoading ? "Preparing Checkout..." : "Upgrade Now"}
                  {!isLoading && <Zap className="ml-2 w-5 h-5 fill-current" />}
                </Button>
              </div>
              
              <p className="text-[10px] text-center text-muted-foreground font-mono uppercase tracking-[0.1em] opacity-50">
                Secure payment handled by Stripe
              </p>
            </CardContent>
          </Card>

          <div className="space-y-4">
            <h2 className="text-xl font-bold px-2">Membership Benefits</h2>
            <div className="grid grid-cols-1 gap-4">
              {benefits.map((benefit, i) => (
                <div key={i} className="glass-panel p-4 rounded-xl border border-white/5 bg-white/5 hover:bg-white/10 transition-all group">
                  <div className="flex items-start gap-3">
                    <div className="mt-1 p-1 rounded-full bg-primary/10 text-primary group-hover:scale-110 transition-transform">
                      <CheckCircle2 size={16} />
                    </div>
                    <div>
                      <h3 className="font-bold text-primary mb-1">{benefit.title}</h3>
                      <p className="text-sm text-muted-foreground leading-relaxed">{benefit.desc}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
