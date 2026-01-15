import React from "react";
import { Link, useLocation } from "wouter";
import {
  Search,
  Bot,
  Sparkles,
  HelpCircle,
  CheckSquare,
  Settings,
  LogOut,
  Menu,
  MessageSquare,
  LogIn,
  History,
  Zap,
  Lock as LockIcon
} from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "../ui/sheet";
import { Button } from "../ui/button";
import { motion } from "framer-motion";

const sidebarItems = [
  { icon: Search, label: "Search", href: "/" },
  { icon: Bot, label: "FormatAI", href: "/ai" },
  { icon: Sparkles, label: "Generator", href: "/generate" },
  { icon: CheckSquare, label: "Tasks", href: "/tasks" },
  { icon: History, label: "Search History", href: "/history" },
  { icon: Sparkles, label: "Pro", href: "/pro" },
  { icon: Zap, label: "Experiments", href: "/experiments" },
  { icon: LockIcon, label: "Security", href: "/security" },
  { icon: HelpCircle, label: "FormatWiki", href: "/Wiki" },
];

export function Shell({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const [isMobileOpen, setIsMobileOpen] = React.useState(false);

  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-sidebar/60 backdrop-blur-xl border-r border-white/5">
      <div className="p-6 flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-400 to-purple-600 flex items-center justify-center">
          <img src="/logo.png" alt="FormAT Logo" className="w-6 h-6" />
        </div>
        <span className="font-bold text-xl text-white">FormAT</span>
      </div>

      <nav className="flex-1 px-4 py-6 space-y-2">
        {sidebarItems.map(item => {
          const isActive = location === item.href;
          return (
            <Link key={item.href} href={item.href}>
              <div
                className={`flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer relative ${
                  isActive
                    ? "bg-primary/15 text-primary"
                    : "text-sidebar-foreground hover:bg-white/5 hover:text-white"
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="active-sidebar"
                    className="absolute inset-0 bg-primary/10 rounded-xl"
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  />
                )}
                <item.icon size={20} className="relative z-10" />
                <span className="relative z-10">{item.label}</span>
              </div>
            </Link>
          );
        })}
      </nav>
    </div>
  );

  return (
    <div className="min-h-screen bg-background text-foreground flex overflow-hidden">
      {/* Desktop Sidebar */}
      <aside className="hidden md:block w-64 fixed inset-y-0 left-0 z-40">
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar */}
      <div className="md:hidden fixed top-4 left-4 z-50">
        <Sheet open={isMobileOpen} onOpenChange={setIsMobileOpen}>
          <SheetTrigger asChild>
            <Button size="icon" variant="outline">
              <Menu size={20} />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0 w-64">
            <SidebarContent />
          </SheetContent>
        </Sheet>
      </div>

      {/* Main Content */}
      <main className="flex-1 md:ml-64 relative min-h-screen">
        {/* BACKGROUND EFFECTS — safely behind content */}
        <div className="absolute inset-0 z-0 pointer-events-none">
          <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20" />
          <div className="absolute top-0 right-0 w-96 h-96 bg-primary/30 rounded-full blur-[120px] opacity-30" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-orange-500/20 rounded-full blur-[120px] opacity-30" />
        </div>

        {/* REAL CONTENT — always visible */}
        <div className="relative z-10 min-h-screen p-4 md:p-8 max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}