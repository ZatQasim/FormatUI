
import React, { useState, useRef, useEffect } from "react";
import { Send, Bot, User, RefreshCw, Paperclip, MoreHorizontal, Sparkles, Languages } from "lucide-react";
import { mockChatHistory, Message } from "@/lib/mockData";
import { motion, AnimatePresence } from "framer-motion";

const LANGUAGES = [
  { code: 'en', name: 'English' },
  { code: 'es', name: 'Spanish' },
  { code: 'fr', name: 'French' },
  { code: 'de', name: 'German' },
  { code: 'it', name: 'Italian' },
  { code: 'pt', name: 'Portuguese' },
  { code: 'ru', name: 'Russian' },
  { code: 'zh', name: 'Chinese' },
  { code: 'ja', name: 'Japanese' },
  { code: 'ko', name: 'Korean' }
];

export default function AI() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [targetLang, setTargetLang] = useState('en');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const [summary, setSummary] = useState("");

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userTag = window.localStorage.getItem('formatUserId');
    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setIsTyping(true);
    setSummary("");

    try {
      const response = await fetch('/api/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          question: userMsg.content,
          targetLang,
          discordUserId: userTag,
          userTag: userTag
        })
      });
      
      const data = await response.json();
      if (data.error) throw new Error(data.error);
      
      if (data.answer) {
        setSummary(`Direct Answer: ${data.answer.substring(0, 200)}...`);
      }

      const aiMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.answer || `I've researched "${userMsg.content}" from live web sources. Here is the latest information.`,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, aiMsg]);
      setIsTyping(false);
    } catch (error) {
      setIsTyping(false);
    }
  };

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-heading font-bold gradient-text">FormAT Chat</h1>
          <p className="text-muted-foreground">Advanced conversational intelligence</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-3 py-1.5">
            <Languages size={16} className="text-primary" />
            <select 
              value={targetLang}
              onChange={(e) => setTargetLang(e.target.value)}
              className="bg-transparent text-sm text-white focus:outline-none cursor-pointer"
            >
              {LANGUAGES.map(lang => (
                <option key={lang.code} value={lang.code} className="bg-neutral-900">{lang.name}</option>
              ))}
            </select>
          </div>
          <div className="flex gap-2">
            <button className="p-2 hover:bg-white/5 rounded-lg text-muted-foreground hover:text-white transition-colors">
              <RefreshCw size={20} />
            </button>
            <button className="p-2 hover:bg-white/5 rounded-lg text-muted-foreground hover:text-white transition-colors">
              <MoreHorizontal size={20} />
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 glass-panel rounded-2xl border border-white/5 flex flex-col overflow-hidden relative">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-background/50 pointer-events-none z-10"></div>
        
        {/* Summary Area */}
        <AnimatePresence>
          {summary && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="px-6 py-4 bg-primary/5 border-b border-white/5 relative overflow-hidden shrink-0"
            >
              <div className="flex items-center gap-2 text-primary mb-1">
                <Sparkles size={14} />
                <span className="text-[10px] font-mono uppercase tracking-widest font-bold">Quick Summary</span>
              </div>
              <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed italic">
                {summary}
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6" ref={scrollRef}>
          {messages.map((msg) => (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              key={msg.id}
              className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
            >
              <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                msg.role === 'assistant' 
                  ? 'bg-gradient-to-br from-orange-400 to-purple-600' 
                  : 'bg-white/10'
              }`}>
                {msg.role === 'assistant' ? <Bot size={20} className="text-white" /> : <User size={20} />}
              </div>
              <div className={`max-w-[80%] rounded-2xl p-4 ${
                msg.role === 'assistant' 
                  ? 'bg-white/5 border border-white/5 text-gray-200' 
                  : 'bg-primary/20 border border-primary/20 text-white'
              }`}>
                <p className="leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                <div className="mt-2 text-xs text-muted-foreground/50 text-right">
                  {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            </motion.div>
          ))}
          
          {isTyping && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex gap-4"
            >
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-400 to-purple-600 flex items-center justify-center shrink-0">
                <Bot size={20} className="text-white" />
              </div>
              <div className="bg-white/5 border border-white/5 rounded-2xl p-4 flex items-center gap-2">
                <div className="w-2 h-2 bg-white/50 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                <div className="w-2 h-2 bg-white/50 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                <div className="w-2 h-2 bg-white/50 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
              </div>
            </motion.div>
          )}
        </div>

        {/* Input Area */}
        <div className="p-4 bg-black/20 backdrop-blur-md border-t border-white/5 relative z-20">
          <form onSubmit={handleSend} className="relative flex items-center gap-2 max-w-4xl mx-auto">
            <button type="button" className="p-3 text-muted-foreground hover:text-white transition-colors rounded-xl hover:bg-white/5">
              <Paperclip size={20} />
            </button>
            <div className="flex-1 relative">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Message FormAT..."
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-1 focus:ring-primary/50 focus:border-primary/50 transition-all placeholder:text-muted-foreground/50"
              />
            </div>
            <button 
              type="submit" 
              disabled={!input.trim()}
              className="p-3 bg-primary text-white rounded-xl hover:bg-primary/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-primary/20"
            >
              <Send size={20} />
            </button>
          </form>
          <div className="text-center mt-2">
            <p className="text-[10px] text-muted-foreground/40 font-mono">FormAT Endpoint </p>
          </div>
        </div>
      </div>
    </div>
  );
}
