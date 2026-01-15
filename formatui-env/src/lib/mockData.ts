
export interface SearchResult {
  id: string;
  title: string;
  url: string;
  description: string;
  category: 'web' | 'news' | 'code';
}

export interface Task {
  id: string;
  title: string;
  status: 'todo' | 'in-progress' | 'done';
  priority: 'low' | 'medium' | 'high';
  tag: string;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export const mockSearchResults: SearchResult[] = [
  {
    id: '1',
    title: 'FormAT Documentation',
    url: 'https://docs.formatui.ai/intro',
    description: 'The official documentation for FormAT AI OS. Learn how to leverage the power of our search engine and generator.',
    category: 'web'
  },
  {
    id: '2',
    title: 'Understanding AI Agents in 2025',
    url: 'https://techblog.com/ai-agents-2025',
    description: 'A deep dive into the architecture of modern AI agents and how they are transforming productivity workflows.',
    category: 'news'
  },
  {
    id: '3',
    title: 'React Hooks for Data Fetching',
    url: 'https://github.com/facebook/react',
    description: 'Best practices for using useEffect and custom hooks for data fetching in React 19.',
    category: 'code'
  },
  {
    id: '4',
    title: 'The Future of Neural Interfaces',
    url: 'https://science.daily/neural-interfaces',
    description: 'Recent breakthroughs in BCI technology suggest that direct thought-to-text input might be closer than we think.',
    category: 'web'
  }
];

export const mockTasks: Task[] = [
  { id: '1', title: 'Design System Update', status: 'in-progress', priority: 'high', tag: 'Design' },
  { id: '2', title: 'Implement Auth Flow', status: 'todo', priority: 'high', tag: 'Backend' },
  { id: '3', title: 'User Testing Round 1', status: 'done', priority: 'medium', tag: 'Research' },
  { id: '4', title: 'Update Dependencies', status: 'todo', priority: 'low', tag: 'Maintenance' },
  { id: '5', title: 'Optimize Search Algorithm', status: 'in-progress', priority: 'high', tag: 'Core' },
];

export const mockChatHistory: Message[] = [
  {
    id: '1',
    role: 'assistant',
    content: 'Hello! I am FormAT. How can I assist you today? I can search the web, generate content, or manage your tasks.',
    timestamp: new Date()
  }
];
