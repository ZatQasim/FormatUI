import React, { useState, useEffect } from "react";
import { Search, Clock } from "lucide-react";
import { motion } from "framer-motion";

export default function SearchHistoryPage() {
  const [searchHistory, setSearchHistory] = useState<any[]>([]);

  useEffect(() => {
    fetch('/api/history/search/all')
      .then(res => res.json())
      .then(data => setSearchHistory(data.history || []))
      .catch(err => console.error("History fetch error:", err));
  }, []);

  return (
    <div className="h-full flex flex-col">
      <div className="mb-8">
        <h1 className="text-3xl font-heading font-bold gradient-text">Search History</h1>
        <p className="text-muted-foreground">View your past search activities</p>
      </div>

      <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-4">
        <div className="glass-panel rounded-2xl border border-white/5 p-6">
          {searchHistory.length > 0 ? (
            <div className="space-y-4">
              {searchHistory.map((item, idx) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="flex items-start gap-4 p-4 bg-white/5 border border-white/5 rounded-xl hover:bg-white/10 transition-colors"
                >
                  <div className="p-2 bg-primary/20 rounded-lg">
                    <Search size={16} className="text-primary" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="font-semibold text-white">"{item.query}"</h4>
                      <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                        <Clock size={10} />
                        {new Date(item.createdAt).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">{item.summary}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4 text-muted-foreground">
                <Search size={24} />
              </div>
              <h4 className="text-lg font-medium text-white mb-2">No history found</h4>
              <p className="text-muted-foreground">Your search activities will appear here.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}