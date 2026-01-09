
import React from "react";
import { Link, useLocation } from "wouter";
import { 
  Search, 
  Bot, 
  Sparkles, 
  CheckSquare, 
  Settings, 
  LogOut, 
  Menu,
  Command,
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
];

export function Shell({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const [isMobileOpen, setIsMobileOpen] = React.useState(false);
  const [user, setUser] = React.useState<{username: string, id: string} | null>(null);

  React.useEffect(() => {
    const storedId = window.localStorage.getItem('formatUserId');
    if (storedId) {
      setUser({ username: storedId, id: storedId });
    }
  }, []);

  const handleLogin = async () => {
    const username = window.prompt("Enter your Format Tag (e.g. Name#1234):");
    if (!username) return;
    const password = window.prompt("Enter your password:");
    if (!password) return;
    
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password })
      });
      
      const text = await response.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch (e) {
        console.error("Login failed with non-JSON response:", text);
        throw new Error("Server error. Please try again later.");
      }
      
      if (response.status === 403 && data.error === "2FA_REQUIRED") {
        const twoFactorCode = window.prompt("Enter your 2FA code from Authenticator app:");
        if (!twoFactorCode) return;
        const mfaResponse = await fetch("/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username, password, twoFactorCode })
        });
        const mfaText = await mfaResponse.text();
        try {
          data = JSON.parse(mfaText);
        } catch (e) {
          console.error("MFA verification failed with non-JSON response:", mfaText);
          throw new Error("Server error. Please try again later.");
        }
      }

      if (data.error) throw new Error(data.error);
      
      window.localStorage.setItem('formatUserId', data.username);
      setUser({ username: data.username, id: data.username });
    } catch (e: any) {
      alert(e.message);
    }
  };

  const handleSignup = async () => {
    const name = window.prompt("Choose your name:");
    if (!name) return;
    const discordId = window.prompt("Enter your Discord ID (e.g. user#1234 or 123456789):");
    if (!discordId) return;
    const password = window.prompt("Create a password:");
    if (!password) return;

    let twoFactorSecret = null;
    const want2FA = window.confirm("HIGHLY RECOMMENDED: Would you like to enable Two-Factor Authentication (2FA)?");
    if (want2FA) {
      try {
        const genRes = await fetch("/api/auth/2fa/generate", { 
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username: name })
        });
        const genData = await genRes.json();
        twoFactorSecret = genData.secret;
        
        alert("2FA Setup Instructions:\n\n1. Open Google Authenticator or Authy\n2. Click '+' or 'Add Account'\n3. Enter this Secret Key manually: " + twoFactorSecret + "\n4. Account Name: FormatUI (" + name + ")\n5. Use the 6-digit code generated to log in next time.");
        const verifyCode = window.prompt("Enter the 6-digit code from your app to verify:");
        if (!verifyCode) return;
      } catch (e) {
        alert("2FA generation failed, proceeding without it.");
      }
    }
    
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, password, discordId, twoFactorSecret })
      });
      const text = await res.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch (e) {
        console.error("Registration failed with non-JSON response:", text);
        throw new Error("Server error. Please try again later.");
      }
      if (data.error) throw new Error(data.error);
      
      window.localStorage.setItem('formatUserId', data.username);
      setUser({ username: data.username, id: data.username });
      alert(`Account created! Your Format Tag is: ${data.username}\nDiscord ID: ${discordId}${twoFactorSecret ? '\n2FA is ACTIVE.' : ''}`);
    } catch (e: any) {
      alert(e.message);
    }
  };

  const handleLogout = () => {
    window.localStorage.removeItem('formatUserId');
    setUser(null);
  };

  const handleResetPassword = async () => {
    const email = window.prompt("Enter your linked email:");
    if (!email) return;
    
    try {
      const res = await fetch("/api/auth/reset-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email })
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      
      const code = window.prompt(`Simulated Code: ${data.code}\nEnter the code to verify:`);
      if (code !== data.code) throw new Error("Invalid code");
      
      const newPassword = window.prompt("Enter new password:");
      if (!newPassword) return;
      
      const confirmRes = await fetch("/api/auth/reset-confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, newPassword })
      });
      const confirmData = await confirmRes.json();
      if (confirmData.error) throw new Error(confirmData.error);
      
      alert("Password reset successful!");
    } catch (e: any) {
      alert(e.message);
    }
  };

  const handleLinkEmail = async () => {
    if (!user) return;
    const email = window.prompt("Enter email to link:");
    if (!email) return;
    
    try {
      const res = await fetch("/api/auth/link-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: user.username, email })
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      alert("Email linked!");
    } catch (e: any) {
      alert(e.message);
    }
  };

  const SidebarContent = () => {
    const [isPro, setIsPro] = React.useState(false);

    React.useEffect(() => {
      if (user?.username) {
        fetch(`/api/auth/status/${user.username}`)
          .then(res => res.json())
          .then(data => {
            setIsPro(data.isPro);
            if (data.isPro) {
              document.documentElement.classList.add('pro-theme');
            } else {
              document.documentElement.classList.remove('pro-theme');
            }
          })
          .catch(() => {});
      } else {
        document.documentElement.classList.remove('pro-theme');
      }
    }, [user]);

    return (
      <div className={`flex flex-col h-full ${isPro ? 'bg-gradient-to-b from-sidebar/50 to-primary/5' : 'bg-sidebar/50'} backdrop-blur-xl border-r border-white/5`}>
        <div className="p-6 flex items-center gap-3">
          <div className={`w-8 h-8 rounded-lg overflow-hidden ${isPro ? 'bg-gradient-to-br from-yellow-400 to-orange-600' : 'bg-gradient-to-br from-orange-400 to-purple-600'} p-[1px]`}>
            <div className="w-full h-full bg-black/20 backdrop-blur-sm flex items-center justify-center">
              <img 
                src="/logo.png" 
                alt="FormatUI Logo" 
                className="w-full h-full object-contain"
              />
            </div>
          </div>
          <div className="flex flex-col">
            <span className="font-heading font-bold text-xl tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-white/60">
              FormatUI
            </span>
            {isPro && <span className="text-[8px] font-mono text-primary uppercase tracking-widest -mt-1 font-bold">Pro Edition</span>}
          </div>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-2">
          {sidebarItems.map((item) => {
            const isActive = location === item.href;
            return (
              <Link key={item.href} href={item.href}>
                <div
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer transition-all duration-200 group relative overflow-hidden ${
                    isActive 
                      ? "bg-primary/10 text-primary border border-primary/20" 
                      : "text-sidebar-foreground hover:bg-white/5 hover:text-white"
                  }`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="active-sidebar"
                      className="absolute inset-0 bg-primary/10 rounded-xl"
                      initial={false}
                      transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    />
                  )}
                  <item.icon size={20} className={isActive ? "text-primary" : "text-sidebar-foreground group-hover:text-white"} />
                  <span className="font-medium relative z-10">{item.label}</span>
                </div>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 mt-auto border-t border-white/5 space-y-2">
          {user ? (
            <>
              <div className="px-4 py-2 text-xs font-mono text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                Connected as {user.username} {isPro && <span className="text-primary animate-pulse" title="Pro Member">👑</span>}
              </div>
              <Button variant="ghost" className="w-full justify-start gap-3 text-sidebar-foreground hover:text-white hover:bg-white/5 rounded-xl">
                <Settings size={18} />
                <span>Settings</span>
              </Button>
              <Button 
                variant="ghost" 
                onClick={handleLinkEmail}
                className="w-full justify-start gap-3 text-sidebar-foreground hover:text-white hover:bg-white/5 rounded-xl"
              >
                <MessageSquare size={18} />
                <span>Link Email</span>
              </Button>
              <Button 
                variant="ghost" 
                onClick={handleLogout}
                className="w-full justify-start gap-3 text-sidebar-foreground hover:text-destructive hover:bg-destructive/10 rounded-xl"
              >
                <LogOut size={18} />
                <span>Disconnect</span>
              </Button>
            </>
          ) : (
            <div className="space-y-2">
              <Button 
                onClick={handleLogin}
                className="w-full justify-start gap-3 bg-primary hover:bg-primary/90 text-white rounded-xl shadow-lg shadow-primary/20"
              >
                <LogIn size={18} />
                <span>Format Login</span>
              </Button>
              <Button 
                onClick={handleSignup}
                variant="outline"
                className="w-full justify-start gap-3 border-white/10 hover:bg-white/5 text-white rounded-xl"
              >
                <Sparkles size={18} />
                <span>Format Signup</span>
              </Button>
              <Button 
                onClick={handleResetPassword}
                variant="link"
                className="w-full text-xs text-muted-foreground hover:text-primary"
              >
                Forgot Credentials?
              </Button>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex overflow-hidden font-sans">
      {/* Desktop Sidebar */}
      <aside className="hidden md:block w-64 h-screen fixed top-0 left-0 z-50">
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar */}
      <div className="md:hidden fixed top-4 left-4 z-50">
        <Sheet open={isMobileOpen} onOpenChange={setIsMobileOpen}>
          <SheetTrigger asChild>
            <Button size="icon" variant="outline" className="bg-background/50 backdrop-blur-md border-white/10">
              <Menu size={20} />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0 border-r border-white/10 bg-sidebar w-64">
            <SidebarContent />
          </SheetContent>
        </Sheet>
      </div>

      {/* Main Content */}
      <main className="flex-1 md:ml-64 relative min-h-screen">
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none mix-blend-overlay"></div>
        <div className="absolute top-0 right-0 p-8 opacity-20 pointer-events-none">
           <div className="w-96 h-96 bg-primary/30 rounded-full blur-[100px]"></div>
        </div>
        <div className="absolute bottom-0 left-0 p-8 opacity-20 pointer-events-none">
           <div className="w-96 h-96 bg-orange-500/20 rounded-full blur-[100px]"></div>
        </div>
        
        <div className="relative z-10 h-full p-4 md:p-8 max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
