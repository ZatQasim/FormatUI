
import React, { useState, useEffect } from "react";
import { useRoute } from "wouter";
import { Shield, ShieldAlert, ShieldCheck, Fingerprint, Loader2, Share2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { motion } from "framer-motion";

const SharedReportPage = () => {
  const [, params] = useRoute("/security/report/:id");
  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (params?.id) {
      fetch(`/api/security/report/${params.id}`)
        .then(res => res.json())
        .then(data => {
          setReport(data);
          setLoading(false);
        })
        .catch(() => setLoading(false));
    }
  }, [params?.id]);

  if (loading) {
    return (
      <div className="h-[80vh] flex items-center justify-center">
        <Loader2 className="animate-spin text-primary" size={48} />
      </div>
    );
  }

  if (!report || report.error) {
    return (
      <div className="h-[80vh] flex flex-col items-center justify-center text-center space-y-4">
        <ShieldAlert className="text-destructive" size={64} />
        <h2 className="text-2xl font-bold">Report Not Found</h2>
        <p className="text-muted-foreground">The security report you are looking for does not exist or has been removed.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-4xl mx-auto py-12 px-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-8"
      >
        <div className="flex flex-col gap-2 items-center text-center">
          <div className="p-4 rounded-full bg-primary/10 mb-4 border border-primary/20">
            <Shield className="text-primary" size={48} />
          </div>
          <h1 className="text-4xl font-heading font-bold gradient-text">FormAT Security Report</h1>
          <p className="text-muted-foreground">Verified digital fingerprint analysis for public verification.</p>
        </div>

        <Card className="glass-panel border-white/5 overflow-hidden">
          <CardHeader className="border-b border-white/5 bg-white/5">
            <div className="flex justify-between items-center">
              <div>
                <CardTitle className="text-2xl">{report.fileName}</CardTitle>
                <CardDescription>Generated on {new Date(report.createdAt).toLocaleString()}</CardDescription>
              </div>
              <div className={`px-4 py-2 rounded-full border ${report.isSafe ? 'bg-green-500/10 border-green-500/20 text-green-500' : 'bg-destructive/10 border-destructive/20 text-destructive'} flex items-center gap-2 font-bold`}>
                {report.isSafe ? <ShieldCheck size={20} /> : <ShieldAlert size={20} />}
                {report.isSafe ? 'VERIFIED SAFE' : 'THREAT DETECTED'}
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-8 space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <h3 className="text-sm font-mono text-muted-foreground uppercase tracking-widest">Technical Specifications</h3>
                <div className="space-y-2">
                  <div className="p-4 bg-black/40 rounded-xl border border-white/5 space-y-1">
                    <p className="text-[10px] text-muted-foreground font-mono">HASH ALGORITHM</p>
                    <p className="font-mono text-xs">SHA-256 (High Entropy)</p>
                  </div>
                  <div className="p-4 bg-black/40 rounded-xl border border-white/5 space-y-1">
                    <p className="text-[10px] text-muted-foreground font-mono">DIGITAL FINGERPRINT</p>
                    <p className="font-mono text-[10px] break-all text-primary">{report.fingerprint}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-sm font-mono text-muted-foreground uppercase tracking-widest">Safety Analysis</h3>
                <div className="p-6 rounded-xl bg-white/5 border border-white/5 space-y-4">
                  <p className="text-sm text-muted-foreground leading-relaxed italic">
                    "{report.isSafe 
                      ? "Analysis complete. This file's unique digital signature matches verified safe software templates in our global security network. No behavioral anomalies or malicious payloads were identified."
                      : "CRITICAL: This file's fingerprint has been identified in global threat databases. It exhibits patterns consistent with known security vulnerabilities or malicious distributions."}"
                  </p>
                  <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground">
                    <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                    REAL-TIME VERIFIED BY FORMATUI NODE
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-8 border-t border-white/5 flex flex-col items-center gap-4">
              <p className="text-xs text-muted-foreground text-center max-w-lg">
                This report is cryptographically bound to the file's content. Any modification to the file will invalidate this digital fingerprint. Use this for secure distribution and verification.
              </p>
              <div className="flex items-center gap-2 text-xs font-mono opacity-50">
                <Share2 size={12} />
                SECURE SHAREABLE LINK ACTIVE
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default SharedReportPage;
