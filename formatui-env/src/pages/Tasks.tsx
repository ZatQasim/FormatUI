import React, { useState } from "react";
import { Plus, Tag, FileText, Link as LinkIcon, Loader2, X, ExternalLink, Trash2 } from "lucide-react";
import { motion } from "framer-motion";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

interface TaskResource {
  title: string;
  url: string;
}

interface Task {
  id: string;
  title: string;
  description: string | null;
  status: 'todo' | 'in-progress' | 'done';
  priority: 'low' | 'medium' | 'high';
  tag: string;
  resources: TaskResource[];
  createdAt: string;
}

export default function Tasks() {
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const userId = window.localStorage.getItem('formatUserId') || "guest";

  const { data: tasks = [], isLoading } = useQuery<Task[]>({
    queryKey: [`/api/tasks/${userId}/web`],
  });

  const createTaskMutation = useMutation({
    mutationFn: async (newTask: any) => {
      const userTag = window.localStorage.getItem('formatUserId');
      if (userTag) {
        const userRes = await fetch(`/api/auth/status/${userTag}`);
        const userData = await userRes.json();
        if (!userData.isPro) {
          const tasksRes = await fetch(`/api/tasks/${userId}/web`);
          const existingTasks = await tasksRes.json();
          if (existingTasks.length >= 10) {
            throw new Error("Free limit reached (10 tasks). Upgrade to Pro for unlimited tasks.");
          }
        }
      }

      const res = await apiRequest("POST", "/api/tasks", {
        ...newTask,
        discordUserId: userId,
        guildId: "web",
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/tasks/${userId}/web`] });
      setIsDialogOpen(false);
      toast({ title: "Task created", description: "Your task has been saved." });
    },
  });

  const updateTaskMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string, updates: any }) => {
      const res = await apiRequest("PATCH", `/api/tasks/${id}`, updates);
      return res.json();
    },
    onSuccess: (data: Task) => {
      queryClient.invalidateQueries({ queryKey: [`/api/tasks/${userId}/web`] });
      setSelectedTask(data);
      toast({ title: "Task updated" });
    },
  });

  const deleteTaskMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/tasks/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/tasks/${userId}/web`] });
      setIsDetailsOpen(false);
      toast({ title: "Task deleted" });
    },
  });

  const columns = [
    { id: 'todo', title: 'To Do', color: 'bg-white/10' },
    { id: 'in-progress', title: 'In Progress', color: 'bg-blue-500/20 text-blue-400' },
    { id: 'done', title: 'Done', color: 'bg-green-500/20 text-green-400' }
  ];

  const getPriorityColor = (p: string) => {
    switch(p) {
      case 'high': return 'text-red-400 bg-red-400/10 border-red-400/20';
      case 'medium': return 'text-orange-400 bg-orange-400/10 border-orange-400/20';
      case 'low': return 'text-blue-400 bg-blue-400/10 border-blue-400/20';
      default: return 'text-gray-400';
    }
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-8 px-4 sm:px-0">
        <div>
          <h1 className="text-3xl font-heading font-bold gradient-text">Task Manager</h1>
          <p className="text-muted-foreground">Real-time task tracking with notes and resources</p>
        </div>
        
        <div className="fixed bottom-6 right-6 z-50 sm:static sm:bottom-auto sm:right-auto">
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-white px-6 py-6 sm:px-4 sm:py-2 rounded-full sm:rounded-xl transition-all shadow-xl shadow-primary/30 font-bold sm:font-medium border-none scale-110 sm:scale-100">
                <Plus size={24} className="sm:size-[18px]" /> <span className="hidden sm:inline">New Task</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="glass-panel border-white/10 text-white w-[95vw] max-w-lg">
              <DialogHeader>
                <DialogTitle>Create New Task</DialogTitle>
              </DialogHeader>
              <form onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                createTaskMutation.mutate({
                  title: formData.get('title'),
                  description: formData.get('description'),
                  priority: formData.get('priority'),
                  tag: formData.get('tag') || 'General',
                  status: 'todo',
                  resources: [],
                });
              }} className="space-y-4 pt-4">
                <Input name="title" placeholder="Task Title" required className="bg-white/5 border-white/10" />
                <Textarea name="description" placeholder="Task Notes (Instructions, details...)" className="bg-white/5 border-white/10 min-h-[100px]" />
                <div className="grid grid-cols-2 gap-4">
                  <Select name="priority" defaultValue="medium">
                    <SelectTrigger className="bg-white/5 border-white/10">
                      <SelectValue placeholder="Priority" />
                    </SelectTrigger>
                    <SelectContent className="bg-sidebar border-white/10 text-white">
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                    </SelectContent>
                  </Select>
                  <Input name="tag" placeholder="Tag (e.g. Design)" className="bg-white/5 border-white/10" />
                </div>
                <Button type="submit" disabled={createTaskMutation.isPending} className="w-full bg-primary hover:bg-primary/90">
                  {createTaskMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Create Task
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {isLoading ? (
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="flex-1 overflow-x-auto pb-4">
          <div className="flex gap-6 min-w-max h-full">
            {columns.map((col) => (
              <div key={col.id} className="w-[350px] flex flex-col h-full glass-panel rounded-2xl border border-white/5 p-4">
                <div className="flex items-center justify-between mb-4 px-2">
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${col.id === 'todo' ? 'bg-white/30' : col.id === 'in-progress' ? 'bg-blue-500' : 'bg-green-500'}`}></div>
                    <h3 className="font-semibold text-lg">{col.title}</h3>
                    <span className="text-xs text-muted-foreground bg-white/5 px-2 py-0.5 rounded-full border border-white/5">
                      {tasks.filter((t) => t.status === col.id).length}
                    </span>
                  </div>
                </div>

                <div className="flex-1 space-y-3 overflow-y-auto pr-2 custom-scrollbar">
                  {tasks.filter((t) => t.status === col.id).map((task, idx) => (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.1 }}
                      key={task.id}
                      onClick={() => {
                        setSelectedTask(task);
                        setIsDetailsOpen(true);
                      }}
                      className="bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/10 rounded-xl p-4 cursor-pointer group transition-all"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <span className={`text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded border ${getPriorityColor(task.priority)}`}>
                          {task.priority}
                        </span>
                      </div>
                      <h4 className="font-medium text-white mb-2 leading-snug">{task.title}</h4>
                      
                      {task.description && (
                        <div className="flex items-start gap-2 mt-2 text-xs text-muted-foreground">
                          <FileText size={12} className="mt-0.5 shrink-0" />
                          <p className="line-clamp-2 italic">{task.description}</p>
                        </div>
                      )}

                      <div className="flex items-center justify-between mt-3 text-xs text-muted-foreground">
                         <div className="flex items-center gap-2">
                           <Tag size={12} />
                           <span>{task.tag}</span>
                         </div>
                         {(task.resources?.length ?? 0) > 0 && (
                           <div className="flex items-center gap-1 text-primary">
                             <LinkIcon size={12} />
                             <span>{task.resources.length}</span>
                           </div>
                         )}
                      </div>
                    </motion.div>
                  ))}
                  
                  {tasks.filter((t) => t.status === col.id).length === 0 && (
                    <div className="text-center py-12 text-sm text-muted-foreground italic border border-dashed border-white/5 rounded-xl">
                      No tasks in {col.title}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Task Details Dialog */}
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="glass-panel border-white/10 text-white max-w-2xl max-h-[90vh] overflow-y-auto custom-scrollbar">
          {selectedTask && (
            <>
              <DialogHeader>
                <DialogTitle className="text-2xl font-bold">{selectedTask.title}</DialogTitle>
              </DialogHeader>
              <div className="space-y-6 pt-4">
                <div className="flex flex-wrap gap-4 items-center">
                  <Badge variant="outline" className={getPriorityColor(selectedTask.priority)}>
                    {selectedTask.priority.toUpperCase()}
                  </Badge>
                  <Badge variant="outline" className="border-white/10 text-muted-foreground">
                    <Tag size={12} className="mr-1" /> {selectedTask.tag}
                  </Badge>
                  <Select 
                    value={selectedTask.status} 
                    onValueChange={(val) => updateTaskMutation.mutate({ id: selectedTask.id, updates: { status: val } })}
                  >
                    <SelectTrigger className="w-[140px] h-9 text-xs bg-white/5 border-white/10 focus:ring-primary/30">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-sidebar border-white/10 text-white">
                      <SelectItem value="todo">To Do</SelectItem>
                      <SelectItem value="in-progress">In Progress</SelectItem>
                      <SelectItem value="done">Done</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-3">
                  <h5 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                    <FileText size={14} /> Task Notes
                  </h5>
                  <div className="bg-white/5 border border-white/10 rounded-xl p-4 text-sm whitespace-pre-wrap leading-relaxed min-h-[100px] ring-1 ring-inset ring-white/5">
                    {selectedTask.description || "No notes added to this task."}
                  </div>
                </div>

                <div className="space-y-3">
                  <h5 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                    <LinkIcon size={14} /> Resources
                  </h5>
                  <div className="space-y-2">
                    {selectedTask.resources?.map((res: any, idx: number) => (
                      <div key={idx} className="flex items-center justify-between p-3 bg-white/5 border border-white/10 rounded-xl group hover:bg-white/10 transition-all shadow-sm">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-primary/20 rounded-lg text-primary group-hover:bg-primary/30 transition-colors">
                            <LinkIcon size={14} />
                          </div>
                          <span className="text-sm font-medium">{res.title}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <a href={res.url} target="_blank" rel="noopener noreferrer" className="p-2 text-muted-foreground hover:text-primary transition-colors">
                            <ExternalLink size={16} />
                          </a>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                            onClick={(e) => {
                              e.stopPropagation();
                              const newRes = selectedTask.resources.filter((_: any, i: number) => i !== idx);
                              updateTaskMutation.mutate({ id: selectedTask.id, updates: { resources: newRes } });
                            }}
                          >
                            <Trash2 size={14} />
                          </Button>
                        </div>
                      </div>
                    ))}
                    
                    <form onSubmit={(e) => {
                      e.preventDefault();
                      const form = e.currentTarget;
                      const titleInput = form.elements.namedItem('resTitle') as HTMLInputElement;
                      const urlInput = form.elements.namedItem('resUrl') as HTMLInputElement;
                      const title = titleInput.value;
                      const url = urlInput.value;
                      const newResources = [...(selectedTask.resources || []), { title, url }];
                      updateTaskMutation.mutate({ id: selectedTask.id, updates: { resources: newResources } });
                      form.reset();
                    }} className="flex gap-2 mt-4 bg-white/5 p-2 rounded-xl border border-white/5">
                      <Input name="resTitle" placeholder="Title" className="bg-transparent border-none h-9 text-xs focus-visible:ring-0" required />
                      <Input name="resUrl" placeholder="URL" className="bg-transparent border-none h-9 text-xs focus-visible:ring-0" required />
                      <Button type="submit" variant="ghost" size="icon" className="h-9 w-9 text-primary hover:bg-primary/10">
                        <Plus size={18} />
                      </Button>
                    </form>
                  </div>
                </div>
              </div>
              <DialogFooter className="mt-8 border-t border-white/10 pt-6">
                <Button 
                  variant="destructive" 
                  onClick={() => {
                    if (window.confirm("Are you sure you want to delete this task?")) {
                      deleteTaskMutation.mutate(selectedTask.id);
                    }
                  }}
                  className="bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20 rounded-xl"
                >
                  <Trash2 size={16} className="mr-2" /> Delete Task
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}