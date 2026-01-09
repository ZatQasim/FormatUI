interface Message {
  role: 'user' | 'assistant';
  content: string;
}

const knowledgeBase: Record<string, string[]> = {
  programming: [
    "Programming is the art of telling computers what to do through code.",
    "Popular languages include Python, JavaScript, TypeScript, Rust, and Go.",
    "Best practices include writing clean code, using version control, and testing.",
  ],
  ai: [
    "Artificial Intelligence simulates human intelligence in machines.",
    "Machine Learning is a subset of AI that learns from data patterns.",
    "Neural networks are inspired by the human brain's structure.",
  ],
  technology: [
    "Technology continues to evolve at an exponential rate.",
    "Cloud computing has revolutionized how we store and process data.",
    "Cybersecurity is increasingly important in our digital age.",
  ],
  formatui: [
    "FormatUI is a state-of-the-art AI assistant platform designed for productivity.",
    "We provide integrated search, AI generation, and task management in one interface.",
    "FormatUI uses FormatAI technology to provide contextual and real-time insights.",
  ],
  general: [
    "I'm FormatUI, an AI assistant built to help you with various tasks.",
    "I can search the web, generate content, and manage your tasks.",
    "Feel free to ask me anything, and I'll do my best to help!",
  ],
};

function findRelevantKnowledge(query: string): string[] {
  const lowerQuery = query.toLowerCase();
  const relevant: string[] = [];

  if (lowerQuery.includes('formatui') || lowerQuery.includes('formatai') || lowerQuery.includes('platform')) {
    relevant.push(...knowledgeBase.formatui);
  }
  if (lowerQuery.includes('program') || lowerQuery.includes('code') || lowerQuery.includes('develop') || lowerQuery.includes('language')) {
    relevant.push(...knowledgeBase.programming);
  }
  if (lowerQuery.includes('ai') || lowerQuery.includes('artificial') || lowerQuery.includes('machine learning') || lowerQuery.includes('intelligence')) {
    relevant.push(...knowledgeBase.ai);
  }
  if (lowerQuery.includes('tech') || lowerQuery.includes('computer') || lowerQuery.includes('software') || lowerQuery.includes('digital')) {
    relevant.push(...knowledgeBase.technology);
  }

  if (relevant.length === 0) {
    relevant.push(...knowledgeBase.general);
  }

  return relevant;
}

function generateResponse(query: string, context: string[]): string {
  const knowledge = findRelevantKnowledge(query);
  const selectedKnowledge = knowledge[Math.floor(Math.random() * knowledge.length)];

  const templates = [
    `Based on my specialized knowledge base, ${selectedKnowledge.toLowerCase()}`,
    `Insight from FormatAI: ${selectedKnowledge}`,
    `I've analyzed your request: ${selectedKnowledge}`,
    `Here is a contextual response: ${selectedKnowledge}`,
    `FormatUI Analysis: ${selectedKnowledge}`,
  ];

  const baseResponse = templates[Math.floor(Math.random() * templates.length)];

  if (query.toLowerCase().includes('how')) {
    return `${baseResponse}\n\nTo help you further, I can perform a deep search or generate a structured guide for these steps.`;
  }

  if (query.toLowerCase().includes('what') || query.toLowerCase().includes('who')) {
    return `${baseResponse}\n\nWould you like me to dive deeper into specific details regarding this?`;
  }

  return baseResponse;
}

export function processAIQuery(query: string, conversationHistory: Message[] = []): string {
  const context = conversationHistory.slice(-5).map(m => m.content);
  return generateResponse(query, context);
}

export function summarizeSearchResults(query: string, results: { title: string; description: string }[]): string {
  if (results.length === 0) {
    return `I couldn't find specific results for "${query}". Try rephrasing your search or being more specific.`;
  }

  const summaryParts = [
    `**AI Summary for "${query}"**\n`,
    `I found ${results.length} relevant sources. Here's what I gathered:\n`,
  ];

  const keyPoints = results.slice(0, 3).map((r, i) => 
    `${i + 1}. **${r.title}**: ${r.description.substring(0, 100)}...`
  );

  summaryParts.push(keyPoints.join('\n'));
  summaryParts.push('\n\n*Use `/search` for detailed results or `/ask` to discuss further.*');

  return summaryParts.join('');
}
