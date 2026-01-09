import { storage } from '../storage';
import type { Task } from '@schema-endpoint/schema';

export interface TaskCreateOptions {
  discordUserId: string;
  guildId: string;
  title: string;
  priority?: 'low' | 'medium' | 'high';
  tag?: string;
}

export async function createTask(options: TaskCreateOptions): Promise<Task> {
  return storage.createTask({
    discordUserId: options.discordUserId,
    guildId: options.guildId,
    title: options.title,
    status: 'todo',
    priority: options.priority || 'medium',
    tag: options.tag || 'General',
  });
}

export async function listTasks(discordUserId: string, guildId: string): Promise<Task[]> {
  return storage.getTasks(discordUserId, guildId);
}

export async function updateTaskStatus(taskId: string, status: string): Promise<Task | undefined> {
  return storage.updateTask(taskId, { status });
}

export async function deleteTask(taskId: string): Promise<boolean> {
  return storage.deleteTask(taskId);
}

export function formatTaskList(tasks: Task[]): string {
  if (tasks.length === 0) {
    return "📋 **Your Task List is Empty**\n\nUse `/task add [title]` to create your first task!";
  }

  const todoTasks = tasks.filter(t => t.status === 'todo');
  const inProgressTasks = tasks.filter(t => t.status === 'in-progress');
  const doneTasks = tasks.filter(t => t.status === 'done');

  const priorityEmoji = (p: string) => {
    switch (p) {
      case 'high': return '🔴';
      case 'medium': return '🟡';
      case 'low': return '🔵';
      default: return '⚪';
    }
  };

  const formatTask = (task: Task, index: number) => 
    `${priorityEmoji(task.priority)} \`${task.id.slice(0, 8)}\` **${task.title}** [${task.tag}]`;

  let output = '📋 **Your Tasks**\n\n';

  if (todoTasks.length > 0) {
    output += '**📝 To Do**\n';
    output += todoTasks.map((t, i) => formatTask(t, i)).join('\n');
    output += '\n\n';
  }

  if (inProgressTasks.length > 0) {
    output += '**🔄 In Progress**\n';
    output += inProgressTasks.map((t, i) => formatTask(t, i)).join('\n');
    output += '\n\n';
  }

  if (doneTasks.length > 0) {
    output += '**✅ Done**\n';
    output += doneTasks.map((t, i) => formatTask(t, i)).join('\n');
    output += '\n';
  }

  output += `\n*Total: ${tasks.length} tasks | Use \`/task done [id]\` to complete*`;

  return output;
}
