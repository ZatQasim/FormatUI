
import React, { useState } from "react";
import { Sparkles, Code, FileText, Image, Music, Wand2, Copy, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/hooks/use-toast";

const templates = [
  { id: 'blog', icon: FileText, label: 'Blog Post', desc: 'SEO optimized articles' },
  { id: 'code', icon: Code, label: 'Code Snippet', desc: 'React, Python, Node.js' },
  { id: 'email', icon: Sparkles, label: 'Cold Email', desc: 'High conversion templates' },
  { id: 'social', icon: Music, label: 'Social Post', desc: 'Viral captions & tags' },
  { id: 'seo', icon: Wand2, label: 'SEO Strategy', desc: 'Keywords & ranking plans' },
  { id: 'study', icon: FileText, label: 'Study Guide', desc: 'Summaries & key points' },
  { id: 'management', icon: Check, label: 'Management', desc: 'Plans & resource guides' },
];

export default function Generator() {
  const { toast } = useToast();
  const [selectedTemplate, setSelectedTemplate] = useState('blog');
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState("");
  const [copied, setCopied] = useState(false);

  const handleGenerate = async () => {
    const userTag = window.localStorage.getItem('formatUserId') || "guest";
    const topicElement = document.querySelector('textarea') as HTMLTextAreaElement;
    const topic = topicElement?.value || "";
    
    if (!topic.trim()) {
      toast({ variant: "destructive", title: "Input Required", description: "Please enter a topic or prompt." });
      return;
    }

    setIsGenerating(true);
    setResult("");
    
    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          prompt: topic,
          userTag: userTag,
          options: { type: selectedTemplate }
        })
      });
      
      const data = await response.json();
      if (data.error) throw new Error(data.error);
      
      setResult(data.result);
      setIsGenerating(false);
    } catch (e: any) {
      toast({ variant: "destructive", title: "Generation Failed", description: e.message });
      setIsGenerating(false);
    }
  };

  const handleCopy = () => {
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-5xl mx-auto">
       <div className="mb-8 text-center">
          <h1 className="text-3xl font-heading font-bold gradient-text mb-2">Creative Generator</h1>
          <p className="text-muted-foreground">What do you want to create today?</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {templates.map((t) => (
            <button
              key={t.id}
              onClick={() => setSelectedTemplate(t.id)}
              className={`p-4 rounded-xl border transition-all duration-200 text-left group relative overflow-hidden ${
                selectedTemplate === t.id 
                  ? 'bg-primary/10 border-primary text-primary' 
                  : 'bg-white/5 border-white/5 text-muted-foreground hover:bg-white/10 hover:border-white/10 hover:text-white'
              }`}
            >
              <div className={`mb-3 w-10 h-10 rounded-lg flex items-center justify-center ${
                selectedTemplate === t.id ? 'bg-primary text-white' : 'bg-white/10 group-hover:bg-white/20'
              }`}>
                <t.icon size={20} />
              </div>
              <div className="font-semibold">{t.label}</div>
              <div className="text-xs opacity-70">{t.desc}</div>
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Input Section */}
          <div className="glass-panel p-6 rounded-2xl border border-white/5 h-fit">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <Wand2 size={18} className="text-primary" /> Configuration
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="text-sm text-muted-foreground mb-2 block">Topic / Prompt</label>
                <textarea 
                  className="w-full h-32 bg-black/20 border border-white/10 rounded-xl p-3 text-white focus:outline-none focus:ring-1 focus:ring-primary/50 resize-none"
                  placeholder="Describe exactly what you want to generate..."
                ></textarea>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                 <div>
                    <label className="text-sm text-muted-foreground mb-2 block">Tone</label>
                    <select className="w-full bg-black/20 border border-white/10 rounded-xl p-2 text-white focus:outline-none">
                      <option>Professional</option>
                      <option>Casual</option>
                      <option>Excited</option>
                      <option>Witty</option>
                    </select>
                 </div>
                 <div>
                    <label className="text-sm text-muted-foreground mb-2 block">Length</label>
                    <select className="w-full bg-black/20 border border-white/10 rounded-xl p-2 text-white focus:outline-none">
                      <option>Short</option>
                      <option>Medium</option>
                      <option>Long Form</option>
                    </select>
                 </div>
              </div>

              <button 
                onClick={handleGenerate}
                disabled={isGenerating}
                className="w-full bg-gradient-to-r from-orange-500 to-purple-600 text-white font-bold py-3 rounded-xl shadow-lg shadow-purple-500/20 hover:opacity-90 transition-opacity mt-2 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isGenerating ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles size={18} /> Generate Content
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Output Section */}
          <div className="glass-panel p-6 rounded-2xl border border-white/5 min-h-[400px] relative flex flex-col">
            <div className="flex items-center justify-between mb-4">
               <h3 className="font-semibold text-muted-foreground">Output</h3>
               {result && (
                 <button 
                   onClick={handleCopy}
                   className="text-xs flex items-center gap-1 text-muted-foreground hover:text-white bg-white/5 px-2 py-1 rounded-lg transition-colors"
                 >
                   {copied ? <Check size={14} /> : <Copy size={14} />}
                   {copied ? 'Copied' : 'Copy'}
                 </button>
               )}
            </div>

            <div className="flex-1 bg-black/20 rounded-xl p-4 font-mono text-sm text-gray-300 leading-relaxed overflow-y-auto border border-white/5 relative">
              {isGenerating ? (
                 <div className="absolute inset-0 flex items-center justify-center flex-col gap-4">
                    <div className="w-16 h-1 bg-white/10 rounded-full overflow-hidden">
                       <motion.div 
                         className="h-full bg-primary"
                         initial={{ width: "0%" }}
                         animate={{ width: "100%" }}
                         transition={{ duration: 1.5, repeat: Infinity }}
                       />
                    </div>
                    <span className="text-xs text-muted-foreground animate-pulse">AI is writing...</span>
                 </div>
              ) : result ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                   <pre className="whitespace-pre-wrap font-sans">{result}</pre>
                </motion.div>
              ) : (
                <div className="h-full flex items-center justify-center text-muted-foreground/30 italic">
                   Generated content will appear here...
                </div>
              )}
            </div>
          </div>
        </div>
    </div>
  );
}
