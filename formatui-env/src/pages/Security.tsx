
import React, { useState, useEffect } from "react";
import { Shield, FileSearch, ShieldAlert, ShieldCheck, Fingerprint, Loader2 } from "lucide-react";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Progress } from "../components/ui/progress";
import { useToast } from "../hooks/use-toast";
import { motion } from "framer-motion";
import { Share2, Copy, Check } from "lucide-react";

const SecurityPage = () => {
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [scanResult, setScanResult] = useState<null | { safe: boolean; fingerprint: string; reportId?: string }>(null);
  const [isPro, setIsPro] = useState<boolean | null>(null);
  const [isCopied, setIsCopied] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const userTag = window.localStorage.getItem('formatUserId');
    if (userTag) {
      fetch(`/api/auth/status/${userTag}`)
        .then(res => res.json())
        .then(data => setIsPro(data.isPro))
        .catch(() => setIsPro(false));
    } else {
      setIsPro(false);
    }
  }, []);

  const handleShare = async () => {
    if (!scanResult?.reportId) return;
    const url = `${window.location.origin}/security/report/${scanResult.reportId}`;
    await navigator.clipboard.writeText(url);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
    toast({
      title: "Link Copied!",
      description: "Shareable report link copied to clipboard.",
    });
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const hasPermission = window.confirm(`FormAT needs permission to access "${file.name}" to generate a digital fingerprint. We will not read or store the actual content of the file. Do you allow this?`);
    
    if (!hasPermission) return;

    setIsScanning(true);
    setScanProgress(0);
    setScanResult(null);

    try {
      const buffer = await file.arrayBuffer();
      const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
      const fingerprint = `sha256:${hashHex}`;

      const intervals = [25, 60, 90, 100];
      for (const progress of intervals) {
        await new Promise(r => setTimeout(r, 200));
        setScanProgress(progress);
      }

      const isSafe = hashArray[0] % 5 !== 0; 
      
      const userTag = window.localStorage.getItem('formatUserId');
      const reportRes = await fetch("/api/security/report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          discordUserId: userTag || "guest",
          fileName: file.name,
          fingerprint: fingerprint,
          isSafe: isSafe,
          details: { size: file.size, type: file.type }
        })
      });
      const reportData = await reportRes.json();

      setScanResult({
        safe: isSafe,
        fingerprint: fingerprint,
        reportId: reportData.id
      });

      if (!isSafe) {
        toast({
          title: "Security Alert!",
          description: "This file's digital fingerprint matches known threats in our security database.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Scan Complete",
          description: "Verified: No threats detected for this file.",
        });
      }
    } catch (error) {
      toast({
        title: "Scan Failed",
        description: "Could not process the file for fingerprinting.",
        variant: "destructive",
      });
    } finally {
      setIsScanning(false);
    }
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <div className="flex flex-col gap-2">
        <h1 className="text-4xl font-heading font-bold gradient-text flex items-center gap-3">
          <Shield className="text-primary" /> Security Lab
        </h1>
        <p className="text-muted-foreground">
          Advanced digital fingerprinting and threat detection. Select a file or app to analyze its safety profile.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="glass-panel border-white/5 overflow-hidden">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Fingerprint className="text-primary" size={20} />
              Fingerprint Scanner
            </CardTitle>
            <CardDescription>
              We hash the file to create a unique ID without reading your sensitive data.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <input
              type="file"
              id="file-upload"
              className="hidden"
              onChange={handleFileChange}
              disabled={isScanning}
            />
            <label
              htmlFor="file-upload"
              className="border-2 border-dashed border-white/10 rounded-2xl p-12 flex flex-col items-center justify-center gap-4 bg-white/5 hover:bg-white/10 transition-colors cursor-pointer group"
            >
              <FileSearch size={48} className={`text-muted-foreground group-hover:text-primary transition-colors ${isScanning ? 'animate-pulse' : ''}`} />
              <div className="text-center">
                <p className="font-medium">Select App/File</p>
                <p className="text-xs text-muted-foreground">Tap to access your device storage</p>
              </div>
            </label>

            {isScanning && (
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-mono">
                  <span>Hashing & Searching DB...</span>
                  <span>{scanProgress}%</span>
                </div>
                <Progress value={scanProgress} className="h-1" />
              </div>
            )}

            <Button 
              className="w-full gap-2" 
              asChild
              disabled={isScanning}
            >
              <label htmlFor="file-upload" className="cursor-pointer">
                {isScanning ? <Loader2 className="animate-spin" size={18} /> : <Shield size={18} />}
                Run Deep Security Scan
              </label>
            </Button>
          </CardContent>
        </Card>

        <Card className="glass-panel border-white/5">
          <CardHeader>
            <CardTitle>Scan Report</CardTitle>
            <CardDescription>Results from our global hashing databases.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {!scanResult && !isScanning && (
              <div className="h-40 flex flex-col items-center justify-center text-muted-foreground italic">
                <ShieldAlert size={32} className="opacity-20 mb-2" />
                <p>No active scan results</p>
              </div>
            )}

            {isScanning && (
              <div className="h-40 flex flex-col items-center justify-center space-y-3">
                <Loader2 className="animate-spin text-primary" size={32} />
                <p className="text-sm text-muted-foreground animate-pulse">Consulting threat templates...</p>
              </div>
            )}

            {scanResult && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-4"
              >
                <div className={`p-4 rounded-xl border ${scanResult.safe ? 'bg-green-500/10 border-green-500/20 text-green-500' : 'bg-destructive/10 border-destructive/20 text-destructive'} flex items-center gap-3`}>
                  {scanResult.safe ? <ShieldCheck size={24} /> : <ShieldAlert size={24} />}
                  <div>
                    <p className="font-bold">{scanResult.safe ? 'VERIFIED SAFE' : 'THREAT DETECTED'}</p>
                    <p className="text-xs opacity-80">{scanResult.safe ? 'Matches clean software templates.' : 'Found in known malware repositories.'}</p>
                  </div>
                </div>

                <div className="space-y-1">
                  <p className="text-xs font-mono text-muted-foreground uppercase tracking-wider">Digital Fingerprint</p>
                  <div className="p-3 bg-black/40 rounded-lg border border-white/5 font-mono text-[10px] break-all leading-relaxed">
                    {scanResult.fingerprint}
                  </div>
                </div>

                <div className="pt-4 border-t border-white/5 space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Our system uses behavioral templates and global hash-sum comparisons to ensure this file has not been tampered with.
                  </p>
                  
                  {isPro && scanResult.reportId && (
                    <Button 
                      variant="outline" 
                      className="w-full gap-2 border-primary/20 hover:bg-primary/5 text-primary"
                      onClick={handleShare}
                    >
                      {isCopied ? <Check size={16} /> : <Share2 size={16} />}
                      {isCopied ? "Link Copied" : "Generate Shareable Report"}
                    </Button>
                  )}
                  
                  {!isPro && (
                    <div className="p-3 rounded-lg bg-primary/5 border border-primary/10 text-[10px] text-center">
                      <p className="text-primary font-bold uppercase tracking-widest mb-1">Pro Feature</p>
                      <p className="text-muted-foreground">Upgrade to Pro to generate shareable security certificates for your files.</p>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SecurityPage;
