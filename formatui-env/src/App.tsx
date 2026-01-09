
import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "./components/ui/toaster";
import { TooltipProvider } from "./components/ui/tooltip";
import { Shell } from "./components/layout/Shell";
import NotFound from "./pages/not-found";
import Home from "./pages/Home";
import AI from "./pages/AI";
import Tasks from "./pages/Tasks";
import React, { useEffect, useState } from "react";
import Generator from "./pages/Generator";
import SearchHistoryPage from "./pages/SearchHistory";
import ProPage from "./pages/Pro";
import SecurityPage from "./pages/Security";
import SharedReportPage from "./pages/SharedReport";
import { Zap, Lock as LockIcon, ShieldAlert } from "lucide-react";

const ExperimentsPage = () => {
  const [isPro, setIsPro] = useState<boolean | null>(null);

  useEffect(() => {
    const userTag = window.localStorage.getItem('formatUserId');
    if (!userTag) {
      setIsPro(false);
      return;
    }
    fetch(`/api/auth/status/${userTag}`)
      .then(res => res.json())
      .then(data => setIsPro(data.isPro))
      .catch(() => setIsPro(false));
  }, []);

  if (isPro === null) return null;

  if (!isPro) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh] space-y-6 text-center">
        <LockIcon size={48} className="text-muted-foreground opacity-20" />
        <h2 className="text-2xl font-heading font-bold">Pro Restricted</h2>
        <p className="text-muted-foreground max-w-xs">Experiments are exclusively available for Pro members.</p>
        <a href="/pro" className="text-primary font-medium hover:underline">Upgrade to Pro</a>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] space-y-6 text-center">
      <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20 animate-pulse">
        <Zap size={48} className="text-primary" />
      </div>
      <div className="space-y-2">
        <h2 className="text-4xl font-heading font-bold gradient-text">Early Access Labs</h2>
        <p className="text-muted-foreground text-lg italic max-w-md mx-auto">
          Testing ground for next-generation neural interfaces and experimental minimalist aesthetics.
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl w-full">
        {['Neural Layouts', 'Generative Typography', 'Ambient UI', 'Zero-Latency Search'].map((lab) => (
          <div key={lab} className="glass-panel p-6 rounded-2xl border border-white/5 flex items-center justify-between group cursor-pointer hover:border-primary/30 transition-all">
            <span className="font-medium">{lab}</span>
            <div className="text-[10px] font-mono text-primary bg-primary/10 px-2 py-1 rounded">ACTIVE</div>
          </div>
        ))}
      </div>
    </div>
  );
};

function Router() {
  return (
    <Shell>
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/ai" component={AI} />
        <Route path="/tasks" component={Tasks} />
        <Route path="/generate" component={Generator} />
        <Route path="/history" component={SearchHistoryPage} />
        <Route path="/pro" component={ProPage} />
        <Route path="/experiments" component={ExperimentsPage} />
        <Route path="/security" component={SecurityPage} />
        <Route path="/security/report/:id" component={SharedReportPage} />
        <Route component={NotFound} />
      </Switch>
    </Shell>
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
