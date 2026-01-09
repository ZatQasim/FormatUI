
import React, { useState } from "react";
import { Search, Globe, Mic, Image, ArrowRight, Zap, Bot, Sparkles, History, Clock } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { mockSearchResults } from "@/lib/mockData";

export default function Home() {
  const [query, setQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [results, setResults] = useState<any[]>([]);
  const [summary, setSummary] = useState("");
  const [history, setHistory] = useState<any[]>([]);

  React.useEffect(() => {
    const fetchHistory = async () => {
      const id = window.localStorage.getItem('formatUserId');
      if (id) {
        try {
          const res = await fetch(`/api/history/search/${id}`);
          const data = await res.json();
          setHistory(data.history || []);
        } catch (e) {
          console.error("History fetch failed", e);
        }
      }
    };
    fetchHistory();
  }, [hasSearched]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    
    setIsSearching(true);
    setResults([]);
    setSummary("");
    
    const userTag = window.localStorage.getItem('formatUserId');
    try {
      const response = await fetch('/api/search-with-history', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          query, 
          discordUserId: userTag,
          userTag: userTag 
        })
      });
      
      const text = await response.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch (e) {
        console.error("Search failed with non-JSON response:", text);
        setResults(mockSearchResults);
        setIsSearching(false);
        setHasSearched(true);
        return;
      }
      
      setResults(data.results || mockSearchResults);
      setSummary(data.summary || "");
      setIsSearching(false);
      setHasSearched(true);
    } catch (error) {
      setResults(mockSearchResults);
      setIsSearching(false);
      setHasSearched(true);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] w-full max-w-5xl mx-auto space-y-12 pb-20">
      <motion.div 
        layout
        className={`w-full flex flex-col items-center transition-all duration-500 ${hasSearched ? 'mt-0 mb-4' : 'mt-20'}`}
      >
        {!hasSearched && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 text-center"
          >
            <div className="w-24 h-24 mx-auto mb-6 rounded-2xl overflow-hidden shadow-2xl shadow-primary/20 animate-float bg-white/5 backdrop-blur-sm p-2 flex items-center justify-center">
              <img 
                src="/logo.png" 
                alt="FormatUI Logo" 
                className="w-full h-full object-contain"
              />
            </div>
            <h1 className="text-4xl md:text-5xl font-heading font-bold mb-3 bg-clip-text text-transparent bg-gradient-to-br from-white via-white to-white/50">
              Format your thoughts.
            </h1>
            <p className="text-muted-foreground text-lg">
              The minimalist AI search and productivity hub.
            </p>
          </motion.div>
        )}

        <div className="w-full max-w-2xl relative group z-20">
          <div className="absolute inset-0 bg-gradient-to-r from-orange-500/20 to-purple-600/20 rounded-2xl blur-xl group-hover:opacity-100 opacity-50 transition-opacity duration-500"></div>
          <form onSubmit={handleSearch} className="relative">
            <div className="relative glass-panel rounded-2xl overflow-hidden flex items-center p-2 transition-all duration-300 ring-1 ring-white/10 group-hover:ring-primary/50">
              <div className="pl-4 text-muted-foreground">
                <Search size={24} />
              </div>
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Ask anything..."
                className="w-full bg-transparent border-none text-xl p-4 focus:ring-0 focus:outline-none placeholder:text-muted-foreground/50 text-white font-medium"
              />
              <div className="flex items-center gap-2 pr-2">
                <button type="button" className="p-2 hover:bg-white/10 rounded-xl text-muted-foreground hover:text-white transition-colors">
                  <Mic size={20} />
                </button>
                <button type="submit" className="p-3 bg-primary text-white rounded-xl hover:bg-primary/90 transition-all shadow-lg shadow-primary/20">
                  <ArrowRight size={20} />
                </button>
              </div>
            </div>
            
            {/* Quick Actions (only show when not searched) */}
            {!hasSearched && (
              <div className="flex gap-2 mt-4 justify-center">
                <button type="button" className="px-4 py-2 rounded-full glass-panel hover:bg-white/5 text-sm font-medium text-muted-foreground hover:text-primary transition-colors flex items-center gap-2">
                  <Globe size={14} /> Web Search
                </button>
                <button type="button" className="px-4 py-2 rounded-full glass-panel hover:bg-white/5 text-sm font-medium text-muted-foreground hover:text-primary transition-colors flex items-center gap-2">
                  <Zap size={14} /> Deep Think
                </button>
              </div>
            )}
          </form>
        </div>
      </motion.div>

      {/* Loading State */}
      <AnimatePresence>
        {isSearching && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="my-12 flex flex-col items-center gap-4"
          >
            <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin"></div>
            <p className="text-muted-foreground font-mono text-sm animate-pulse">Thinking deeply...</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Results */}
      <AnimatePresence>
        {hasSearched && !isSearching && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full grid grid-cols-1 lg:grid-cols-3 gap-8"
          >
            <div className="lg:col-span-2 space-y-6">
              {/* AI Summary Card */}
              <div className="glass-panel p-6 rounded-2xl border-l-4 border-l-primary relative overflow-hidden">
                 <div className="absolute top-0 right-0 p-4 opacity-10">
                   <Bot size={100} />
                 </div>
                 <h3 className="text-lg font-heading font-semibold mb-3 flex items-center gap-2 text-primary">
                   <Sparkles size={18} /> FormatUI AI Summary
                 </h3>
                 <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">
                   {summary || `I've analyzed the real-time web results for "${query}". Here is the distilled information from current sources.`}
                 </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {(results.length > 0 ? results : mockSearchResults).map((result, idx) => (
                  <motion.div
                    key={result.id || idx}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    className="glass-panel p-5 rounded-xl hover:bg-white/5 transition-colors cursor-pointer group border-l-4 border-l-transparent hover:border-l-orange-500"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs font-mono uppercase tracking-wider text-muted-foreground/70 bg-white/5 px-2 py-0.5 rounded">
                        {result.category}
                      </span>
                      <span className="text-xs text-muted-foreground truncate max-w-[200px]">{result.url}</span>
                    </div>
                    <h3 className="text-lg font-semibold text-white group-hover:text-primary transition-colors mb-2">
                      {result.title}
                    </h3>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {result.description}
                    </p>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* History Sidebar */}
            <div className="space-y-6">
              <div className="glass-panel p-6 rounded-2xl">
                <h3 className="text-sm font-mono uppercase tracking-widest text-muted-foreground mb-4 flex items-center gap-2">
                  <History size={16} /> Recent Searches
                </h3>
                <div className="space-y-4">
                  {history && history.length > 0 ? history.map((item: any) => (
                    <div key={item.id} className="group cursor-pointer">
                      <p className="text-sm text-white group-hover:text-primary transition-colors font-medium line-clamp-1">{item.query}</p>
                      <div className="flex items-center gap-2 text-[10px] text-muted-foreground mt-1">
                        <Clock size={10} /> {item.createdAt ? new Date(item.createdAt).toLocaleDateString() : 'Recent'}
                      </div>
                    </div>
                  )) : (
                    <p className="text-xs text-muted-foreground italic">No history yet</p>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
