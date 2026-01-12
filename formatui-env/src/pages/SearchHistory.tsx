import React, { useState, useEffect } from "react";
import { Search, Clock, Trash2, MoreVertical, CheckCircle2, Circle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "../components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../components/ui/dropdown-menu";
import { useToast } from "../hooks/use-toast";

export default function SearchHistoryPage() {
  const [searchHistory, setSearchHistory] = useState<any[]>([]);
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const { toast } = useToast();
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  const fetchHistory = () => {
    const url = user.username 
      ? `/api/history/search/${encodeURIComponent(user.username)}`
      : '/api/history/search/all';

    fetch(url)
      .then(res => res.json())
      .then(data => setSearchHistory(data.history || []))
      .catch(err => console.error("History fetch error:", err));
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const handleDeleteAll = async () => {
    if (!confirm("Are you sure you want to delete all search history?")) return;
    
    try {
      const res = await fetch(`/api/history/search/clear/${encodeURIComponent(user.username || "all")}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        setSearchHistory([]);
        toast({ title: "History cleared", description: "All search history has been removed." });
      }
    } catch (err) {
      toast({ title: "Error", description: "Failed to clear history", variant: "destructive" });
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedIds.size === 0) return;
    if (!confirm(`Are you sure you want to delete ${selectedIds.size} selected items?`)) return;

    try {
      await Promise.all(
        Array.from(selectedIds).map(id => 
          fetch(`/api/history/search/${id}`, { method: 'DELETE' })
        )
      );
      setSearchHistory(prev => prev.filter(item => !selectedIds.has(item.id)));
      setSelectedIds(new Set());
      setIsSelectionMode(false);
      toast({ title: "Items deleted", description: "Selected history items have been removed." });
    } catch (err) {
      toast({ title: "Error", description: "Failed to delete selected items", variant: "destructive" });
    }
  };

  const toggleSelection = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  return (
    <div className="h-full flex flex-col">
      <div className="mb-8 flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-heading font-bold gradient-text">Search History</h1>
          <p className="text-muted-foreground">View and manage your past search activities</p>
        </div>
        
        <div className="flex gap-2">
          {isSelectionMode ? (
            <>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => {
                  setIsSelectionMode(false);
                  setSelectedIds(new Set());
                }}
              >
                Cancel
              </Button>
              <Button 
                variant="destructive" 
                size="sm" 
                onClick={handleDeleteSelected}
                disabled={selectedIds.size === 0}
              >
                Delete Selected ({selectedIds.size})
              </Button>
            </>
          ) : (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full">
                  <MoreVertical size={20} />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={() => setIsSelectionMode(true)}>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Select Items
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleDeleteAll} className="text-destructive focus:text-destructive">
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete Everything
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-4">
        <div className="glass-panel rounded-2xl border border-white/5 p-6">
          {searchHistory.length > 0 ? (
            <div className="space-y-4">
              <AnimatePresence mode="popLayout">
                {searchHistory.map((item, idx) => (
                  <motion.div
                    key={item.id}
                    layout
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ delay: idx * 0.05 }}
                    onClick={() => isSelectionMode && toggleSelection(item.id)}
                    className={`flex items-start gap-4 p-4 border rounded-xl transition-all cursor-pointer ${
                      selectedIds.has(item.id) 
                        ? "bg-primary/10 border-primary/30" 
                        : "bg-white/5 border-white/5 hover:bg-white/10"
                    }`}
                  >
                    {isSelectionMode && (
                      <div className="pt-1">
                        {selectedIds.has(item.id) ? (
                          <CheckCircle2 className="text-primary" size={20} />
                        ) : (
                          <Circle className="text-muted-foreground" size={20} />
                        )}
                      </div>
                    )}
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
              </AnimatePresence>
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