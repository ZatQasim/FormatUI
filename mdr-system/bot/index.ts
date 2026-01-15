import { Client, GatewayIntentBits, Events, REST, Routes, SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder, type ChatInputCommandInteraction, type Message, type Interaction, ChannelType, PermissionFlagsBits } from 'discord.js';
import { performWebSearch } from './search-engine';
import { selfTrainingAI, startBackgroundTraining } from './self-training-ai';
import { translationEngine } from './translation-engine';
import { FormatWiki } from '../../formatui-env/src/pages/Wiki';
import { storage } from '../storage';
import { log } from '../index';

const quizData: Record<string, { question: string; options: string[]; correct: number }[]> = {
  quran: [
    { question: "How many surahs are in the Quran?", options: ["110", "114", "120", "100"], correct: 1 },
    { question: "What is the longest surah in the Quran?", options: ["Al-Fatiha", "Al-Baqarah", "Al-Imran", "An-Nisa"], correct: 1 },
    { question: "What is the first word revealed in the Quran?", options: ["Allah", "Iqra (Read)", "Bismillah", "Alhamdulillah"], correct: 1 },
    { question: "Which surah is known as the 'Heart of the Quran'?", options: ["Al-Fatiha", "Yaseen", "Al-Rahman", "Al-Mulk"], correct: 1 },
  ],
  history: [
    { question: "In what year did World War II end?", options: ["1943", "1944", "1945", "1946"], correct: 2 },
    { question: "Who was the first President of the United States?", options: ["Thomas Jefferson", "George Washington", "John Adams", "Benjamin Franklin"], correct: 1 },
    { question: "Which ancient civilization built the pyramids of Giza?", options: ["Roman", "Greek", "Egyptian", "Persian"], correct: 2 },
    { question: "What year did the Berlin Wall fall?", options: ["1987", "1988", "1989", "1990"], correct: 2 },
  ],
  science: [
    { question: "What is the chemical symbol for water?", options: ["O2", "H2O", "CO2", "NaCl"], correct: 1 },
    { question: "What planet is known as the Red Planet?", options: ["Venus", "Mars", "Jupiter", "Saturn"], correct: 1 },
    { question: "What is the speed of light?", options: ["300,000 km/s", "150,000 km/s", "500,000 km/s", "100,000 km/s"], correct: 0 },
    { question: "What is the hardest natural substance?", options: ["Gold", "Iron", "Diamond", "Platinum"], correct: 2 },
  ],
  languages: [
    { question: "How do you say 'Hello' in Spanish?", options: ["Bonjour", "Hola", "Ciao", "Hallo"], correct: 1 },
    { question: "What language is 'Konnichiwa'?", options: ["Chinese", "Korean", "Japanese", "Thai"], correct: 2 },
    { question: "How many official languages does the UN have?", options: ["4", "5", "6", "7"], correct: 2 },
    { question: "Which language has the most native speakers?", options: ["English", "Spanish", "Mandarin Chinese", "Hindi"], correct: 2 },
  ],
  coding: [
    { question: "What does HTML stand for?", options: ["Hyper Text Markup Language", "High Tech Modern Language", "Hyper Transfer Markup Language", "Home Tool Markup Language"], correct: 0 },
    { question: "Which company created JavaScript?", options: ["Microsoft", "Apple", "Netscape", "Google"], correct: 2 },
    { question: "What is the time complexity of binary search?", options: ["O(n)", "O(n²)", "O(log n)", "O(1)"], correct: 2 },
    { question: "What does API stand for?", options: ["Application Programming Interface", "Advanced Program Integration", "Automated Process Interface", "Application Process Integration"], correct: 0 },
  ],
};

const dailyNuggets = [
  "💡 Did you know? The human brain can process images in as little as 13 milliseconds!",
  "💡 Fun fact: Honey never spoils. Archaeologists have found 3000-year-old honey in Egyptian tombs that was still edible!",
  "💡 Learning tip: Teaching others is one of the best ways to retain information. Try explaining what you learn!",
  "💡 Productivity: The Pomodoro Technique can boost focus by up to 25%!",
  "💡 Coding tip: Write code for humans first, computers second. Readable code is maintainable code.",
  "💡 Health: Taking a 10-minute walk can boost your creativity by 60%!",
  "💡 Motivation: Success is not final, failure is not fatal - it's the courage to continue that counts.",
  "💡 Study hack: Active recall is 50% more effective than passive reading!",
];

const commands = [
  new SlashCommandBuilder()
    .setName('translate')
    .setDescription('Translate text between languages')
    .addStringOption(option =>
      option.setName('text')
        .setDescription('Text to translate')
        .setRequired(true))
    .addStringOption(option =>
      option.setName('to')
        .setDescription('Target language (en, ar, es, fr, de, tr, ja, zh, ko, ru)')
        .setRequired(true)),

  new SlashCommandBuilder()
    .setName('ask')
    .setDescription('Ask the AI a question')
    .addStringOption(option =>
      option.setName('question')
        .setDescription('Your question')
        .setRequired(true)),

  new SlashCommandBuilder()
    .setName('generate')
    .setDescription('Generate content')
    .addStringOption(option =>
      option.setName('prompt')
        .setDescription('What to generate')
        .setRequired(true))
    .addStringOption(option =>
      option.setName('type')
        .setDescription('Content type')
        .addChoices(
          { name: 'Blog Post', value: 'blog' },
          { name: 'Code', value: 'code' },
          { name: 'Email', value: 'email' },
          { name: 'Social Post', value: 'social' },
          { name: 'Story', value: 'story' },
          { name: 'General', value: 'general' }
        )),

  new SlashCommandBuilder()
    .setName('search')
    .setDescription('Search the web')
    .addStringOption(option =>
      option.setName('query')
        .setDescription('Search query')
        .setRequired(true)),

  new SlashCommandBuilder()
    .setName('addtask')
    .setDescription('Add a new task')
    .addStringOption(option =>
      option.setName('title')
        .setDescription('Task title')
        .setRequired(true))
    .addStringOption(option =>
      option.setName('priority')
        .setDescription('Priority level')
        .addChoices(
          { name: 'High', value: 'high' },
          { name: 'Medium', value: 'medium' },
          { name: 'Low', value: 'low' }
        ))
    .addStringOption(option =>
      option.setName('tag')
        .setDescription('Task category')),

  new SlashCommandBuilder()
    .setName('tasks')
    .setDescription('View your tasks'),

  new SlashCommandBuilder()
    .setName('donetask')
    .setDescription('Complete a task')
    .addStringOption(option =>
      option.setName('id')
        .setDescription('Task ID (first 8 chars)')
        .setRequired(true)),

  new SlashCommandBuilder()
    .setName('addhabit')
    .setDescription('Add a new habit to track')
    .addStringOption(option =>
      option.setName('name')
        .setDescription('Habit name')
        .setRequired(true))
    .addStringOption(option =>
      option.setName('description')
        .setDescription('Habit description')),

  new SlashCommandBuilder()
    .setName('habits')
    .setDescription('View your habits and streaks'),

  new SlashCommandBuilder()
    .setName('completehabit')
    .setDescription('Mark a habit as done for today')
    .addStringOption(option =>
      option.setName('id')
        .setDescription('Habit ID (first 8 chars)')
        .setRequired(true)),

  new SlashCommandBuilder()
    .setName('focus')
    .setDescription('Start a focus session')
    .addIntegerOption(option =>
      option.setName('minutes')
        .setDescription('Duration in minutes (default: 25)')
        .setMinValue(5)
        .setMaxValue(120)),

  new SlashCommandBuilder()
    .setName('reflect')
    .setDescription('Log a reflection or thought')
    .addStringOption(option =>
      option.setName('content')
        .setDescription('Your reflection')
        .setRequired(true))
    .addStringOption(option =>
      option.setName('mood')
        .setDescription('Your current mood')
        .addChoices(
          { name: '😊 Happy', value: 'happy' },
          { name: '😌 Calm', value: 'calm' },
          { name: '😤 Frustrated', value: 'frustrated' },
          { name: '😢 Sad', value: 'sad' },
          { name: '😴 Tired', value: 'tired' },
          { name: '🔥 Motivated', value: 'motivated' }
        )),

  new SlashCommandBuilder()
    .setName('addnote')
    .setDescription('Add a note to the server knowledge base')
    .addStringOption(option =>
      option.setName('topic')
        .setDescription('Note topic')
        .setRequired(true))
    .addStringOption(option =>
      option.setName('content')
        .setDescription('Note content')
        .setRequired(true)),

  new SlashCommandBuilder()
    .setName('getnote')
    .setDescription('Get notes on a topic')
    .addStringOption(option =>
      option.setName('topic')
        .setDescription('Topic to search')
        .setRequired(true)),

  new SlashCommandBuilder()
    .setName('searchnotes')
    .setDescription('Search all notes')
    .addStringOption(option =>
      option.setName('keyword')
        .setDescription('Search keyword')
        .setRequired(true)),

  new SlashCommandBuilder()
    .setName('startsession')
    .setDescription('Create a temporary study/project channel')
    .addStringOption(option =>
      option.setName('topic')
        .setDescription('Session topic')
        .setRequired(true)),

  new SlashCommandBuilder()
    .setName('poll')
    .setDescription('Create a poll')
    .addStringOption(option =>
      option.setName('question')
        .setDescription('Poll question')
        .setRequired(true))
    .addStringOption(option =>
      option.setName('options')
        .setDescription('Options separated by | (e.g., Option1|Option2|Option3)')
        .setRequired(true)),

  new SlashCommandBuilder()
    .setName('quiz')
    .setDescription('Take a quiz')
    .addStringOption(option =>
      option.setName('topic')
        .setDescription('Quiz topic')
        .setRequired(true)
        .addChoices(
          { name: 'Quran', value: 'quran' },
          { name: 'History', value: 'history' },
          { name: 'Science', value: 'science' },
          { name: 'Languages', value: 'languages' },
          { name: 'Coding', value: 'coding' }
        )),

  new SlashCommandBuilder()
    .setName('addskill')
    .setDescription('Log skill practice time')
    .addStringOption(option =>
      option.setName('skill')
        .setDescription('Skill name')
        .setRequired(true))
    .addIntegerOption(option =>
      option.setName('hours')
        .setDescription('Hours practiced')
        .setRequired(true)
        .setMinValue(1)
        .setMaxValue(12)),

  new SlashCommandBuilder()
    .setName('skills')
    .setDescription('View your skills and progress'),

  new SlashCommandBuilder()
    .setName('remindme')
    .setDescription('Set a reminder')
    .addStringOption(option =>
      option.setName('message')
        .setDescription('Reminder message')
        .setRequired(true))
    .addStringOption(option =>
      option.setName('time')
        .setDescription('Time (e.g., 30m, 2h, 1d)')
        .setRequired(true)),

  new SlashCommandBuilder()
    .setName('addresource')
    .setDescription('Add a resource to the server library')
    .addStringOption(option =>
      option.setName('title')
        .setDescription('Resource title')
        .setRequired(true))
    .addStringOption(option =>
      option.setName('link')
        .setDescription('Resource URL')
        .setRequired(true))
    .addStringOption(option =>
      option.setName('category')
        .setDescription('Resource category')),

  new SlashCommandBuilder()
    .setName('searchresource')
    .setDescription('Search server resources')
    .addStringOption(option =>
      option.setName('keyword')
        .setDescription('Search keyword')
        .setRequired(true)),

  new SlashCommandBuilder()
    .setName('stats')
    .setDescription('View your stats and XP'),

  new SlashCommandBuilder()
    .setName('leaderboard')
    .setDescription('View server leaderboard'),

  new SlashCommandBuilder()
    .setName('pet')
    .setDescription('View your virtual pet'),

  new SlashCommandBuilder()
    .setName('prostats')
    .setDescription('View detailed analytics (Pro feature)'),

  new SlashCommandBuilder()
    .setName('nugget')
    .setDescription('Get a knowledge nugget'),

  new SlashCommandBuilder()
    .setName('help')
    .setDescription('View all available commands'),
];

let activeQuizzes: Map<string, { topic: string; questionIndex: number; correct: number; total: number }> = new Map();
let activeFocusSessions: Map<string, { sessionId: string; endTime: number; channelId: string }> = new Map();

export async function startDiscordBot() {
  const token = process.env.DISCORD_BOT_TOKEN;

  if (!token) {
    log('DISCORD_BOT_TOKEN not found. Bot will not start.', 'discord');
    return;
  }

  await startBackgroundTraining();

  const client = new Client({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMessages,
      GatewayIntentBits.MessageContent,
      GatewayIntentBits.DirectMessages,
    ],
  });

  client.once(Events.ClientReady, async (readyClient) => {
    log(`Discord bot logged in as ${readyClient.user.tag}`, 'discord');

    try {
      await readyClient.user.setUsername("FormAT");
      log('Discord bot username updated to FormAT', 'discord');
    } catch (error) {
      log(`Failed to update Discord bot username: ${error}`, 'discord');
    }

    const rest = new REST().setToken(token);

    try {
      log('Registering slash commands...', 'discord');
      await rest.put(
        Routes.applicationCommands(readyClient.user.id),
        { body: commands.map(c => c.toJSON()) },
      );
      log('Slash commands registered successfully!', 'discord');
    } catch (error) {
      log(`Failed to register commands: ${error}`, 'discord');
    }

    setInterval(() => checkReminders(client), 60000);
    setInterval(() => checkFocusSessions(client), 10000);
  });

  client.on(Events.InteractionCreate, async (interaction: Interaction) => {
    if (interaction.isChatInputCommand()) {
      await handleSlashCommand(interaction);
    } else if (interaction.isButton()) {
      await handleButtonInteraction(interaction);
    }
  });

  client.on(Events.MessageCreate, async (message: Message) => {
    if (message.author.bot) return;

    if (message.mentions.has(client.user!)) {
      const content = message.content.replace(/<@!?\d+>/g, '').trim();

      if (content) {
        const response = await selfTrainingAI.processQuery(content);
        const embed = new EmbedBuilder()
          .setColor(0x5865F2)
          .setAuthor({ name: 'FormAT', iconURL: client.user?.displayAvatarURL() })
          .setDescription(response)
          .setFooter({ text: 'Self-Learning AI • Real-time Web Access' })
          .setTimestamp();

        await message.reply({ embeds: [embed] });
        await storage.addXP(message.author.id, 2);
      } else {
        await message.reply('👋 Hi! I\'m FormAT, your AI assistant. Use `/help` to see what I can do!');
      }
    }
  });

  await client.login(token);
  return client;
}

async function handleSlashCommand(interaction: ChatInputCommandInteraction) {
  const command = interaction.commandName;
  const userId = interaction.user.id;
  const guildId = interaction.guildId || 'dm';

  try {
    switch (command) {
      case 'translate': await handleTranslate(interaction); break;
      case 'ask': await handleAsk(interaction); break;
      case 'generate': await handleGenerate(interaction); break;
      case 'search': await handleSearch(interaction); break;
      case 'addtask': await handleAddTask(interaction, userId, guildId); break;
      case 'tasks': await handleListTasks(interaction, userId, guildId); break;
      case 'donetask': await handleDoneTask(interaction, userId, guildId); break;
      case 'addhabit': await handleAddHabit(interaction, userId, guildId); break;
      case 'habits': await handleListHabits(interaction, userId, guildId); break;
      case 'completehabit': await handleCompleteHabit(interaction, userId, guildId); break;
      case 'focus': await handleFocus(interaction, userId, guildId); break;
      case 'reflect': await handleReflect(interaction, userId, guildId); break;
      case 'addnote': await handleAddNote(interaction, userId, guildId); break;
      case 'getnote': await handleGetNote(interaction, guildId); break;
      case 'searchnotes': await handleSearchNotes(interaction, guildId); break;
      case 'startsession': await handleStartSession(interaction); break;
      case 'poll': await handlePoll(interaction, userId, guildId); break;
      case 'quiz': await handleQuiz(interaction, userId); break;
      case 'addskill': await handleAddSkill(interaction, userId, guildId); break;
      case 'skills': await handleListSkills(interaction, userId, guildId); break;
      case 'remindme': await handleRemindMe(interaction, userId, guildId); break;
      case 'addresource': await handleAddResource(interaction, userId, guildId); break;
      case 'searchresource': await handleSearchResource(interaction, guildId); break;
      case 'stats': await handleStats(interaction, userId); break;
      case 'leaderboard': await handleLeaderboard(interaction); break;
      case 'pet': await handlePet(interaction, userId); break;
      case 'prostats': await handleProStats(interaction, userId); break;
      case 'nugget': await handleNugget(interaction); break;
      case 'help': await handleHelp(interaction); break;
    }
  } catch (error) {
    log(`Command error: ${error}`, 'discord');
  }
}

async function handleTranslate(interaction: ChatInputCommandInteraction) {
  const text = interaction.options.getString('text', true);
  const targetLang = interaction.options.getString('to', true);

  await interaction.deferReply();

  const { translation, sources } = await translationEngine.translate(text, targetLang);

  const embed = new EmbedBuilder()
    .setColor(0x5865F2)
    .setTitle('🌐 Translation')
    .addFields(
      { name: 'Original Text', value: text.slice(0, 1024) || 'N/A', inline: false },
      { name: `Translated to ${targetLang.toUpperCase()}`, value: translation.slice(0, 1024) || 'N/A', inline: false }
    );
  
  if (sources.length > 0) {
    embed.addFields({ name: 'Translation Source', value: sources.join(', '), inline: true });
  }
  
  embed.setFooter({ text: 'FormAT Translation • Google • DeepL • MyMemory • LibreTranslate' })
    .setTimestamp();

  await interaction.editReply({ embeds: [embed] });
  await storage.addXP(interaction.user.id, 5);
}

async function handleAsk(interaction: ChatInputCommandInteraction) {
  const question = interaction.options.getString('question', true);

  await interaction.deferReply();

  const response = await selfTrainingAI.processQuery(question);

  const embed = new EmbedBuilder()
    .setColor(0x5865F2)
    .setAuthor({ name: 'FormAT', iconURL: interaction.client.user?.displayAvatarURL() })
    .setTitle('💭 AI Response')
    .setDescription(response)
    .addFields({ name: 'Your Question', value: question.slice(0, 1024) || 'N/A', inline: false })
    .setFooter({ text: 'FormAT • Self-Learning AI' })
    .setTimestamp();

  await interaction.editReply({ embeds: [embed] });
  await storage.addXP(interaction.user.id, 5);
}

async function handleGenerate(interaction: ChatInputCommandInteraction) {
  const prompt = interaction.options.getString('prompt', true);
  const type = interaction.options.getString('type') || 'general';

  await interaction.deferReply();

  const content = await selfTrainingAI.generateContent(prompt, type);

  if (content.length > 4000) {
    const chunks = content.match(/[\s\S]{1,4000}/g) || [];
    for (let i = 0; i < chunks.length; i++) {
      const embed = new EmbedBuilder()
        .setColor(0x5865F2)
        .setTitle(i === 0 ? `✨ Generated: ${prompt.slice(0, 50)}` : '✨ Continued...')
        .setDescription(chunks[i])
        .setFooter({ text: `Part ${i + 1}/${chunks.length} • FormAT Generator` });

      if (i === 0) {
        await interaction.editReply({ embeds: [embed] });
      } else {
        await interaction.followUp({ embeds: [embed] });
      }
    }
  } else {
    const embed = new EmbedBuilder()
      .setColor(0x5865F2)
      .setTitle(`✨ Generated: ${prompt.slice(0, 50)}`)
      .setDescription(content)
      .setFooter({ text: 'FormAT Generator • Self-Contained AI' })
      .setTimestamp();

    await interaction.editReply({ embeds: [embed] });
  }

  await storage.addXP(interaction.user.id, 10);
}

async function handleSearch(interaction: ChatInputCommandInteraction) {
  const query = interaction.options.getString('query', true);

  await interaction.deferReply();

  const results = await performWebSearch(query);
  const aiSummary = await selfTrainingAI.processQuery(`Summarize information about: ${query}`);

  const embed = new EmbedBuilder()
    .setColor(0x5865F2)
    .setTitle(`🔍 Search Results: "${query.slice(0, 50)}"`)
    .setDescription(aiSummary.slice(0, 512) || 'Searching...')
    .setTimestamp();

  if (results.length === 0) {
    embed.addFields({ name: 'No Results', value: 'Try a different search query', inline: false });
  } else {
    results.slice(0, 5).forEach((result, i) => {
      embed.addFields({
        name: `${i + 1}. ${result.title.slice(0, 60)}`,
        value: `${result.description.substring(0, 120)}...\n[View →](${result.url})`,
        inline: false
      });
    });
  }

  embed.setFooter({ text: `Found ${results.length} results • FormAT Search` });

  await interaction.editReply({ embeds: [embed] });
  await storage.addXP(interaction.user.id, 5);
}

async function handleAddTask(interaction: ChatInputCommandInteraction, userId: string, guildId: string) {
  const title = interaction.options.getString('title', true);
  const priority = interaction.options.getString('priority') || 'medium';
  const tag = interaction.options.getString('tag') || 'General';

  const task = await storage.createTask({
    discordUserId: userId,
    guildId,
    title,
    priority,
    tag,
    status: 'todo'
  });

  const embed = new EmbedBuilder()
    .setColor(0x23A559)
    .setTitle('✅ Task Created')
    .setDescription(`**${task.title}**`)
    .addFields(
      { name: 'ID', value: `\`${task.id.slice(0, 8)}\``, inline: true },
      { name: 'Priority', value: priority, inline: true },
      { name: 'Tag', value: tag, inline: true }
    )
    .setFooter({ text: 'FormAT Task Manager' })
    .setTimestamp();

  await interaction.reply({ embeds: [embed] });
  await storage.addXP(userId, 5);
}

async function handleListTasks(interaction: ChatInputCommandInteraction, userId: string, guildId: string) {
  const tasks = await storage.getTasks(userId, guildId);

  if (tasks.length === 0) {
    await interaction.reply({ content: '📋 You have no tasks. Use `/addtask` to create one!', ephemeral: true });
    return;
  }

  const todoTasks = tasks.filter(t => t.status === 'todo');
  const doneTasks = tasks.filter(t => t.status === 'done');

  let description = '**📋 Your Tasks**\n\n';

  if (todoTasks.length > 0) {
    description += '**To Do:**\n';
    todoTasks.forEach(t => {
      const priorityEmoji = t.priority === 'high' ? '🔴' : t.priority === 'medium' ? '🟡' : '🟢';
      description += `${priorityEmoji} \`${t.id.slice(0, 8)}\` ${t.title} [${t.tag}]\n`;
    });
  }

  if (doneTasks.length > 0) {
    description += '\n**Completed:**\n';
    doneTasks.slice(0, 5).forEach(t => {
      description += `✅ ~~${t.title}~~\n`;
    });
  }

  const embed = new EmbedBuilder()
    .setColor(0x5865F2)
    .setDescription(description)
    .setFooter({ text: `${todoTasks.length} pending • ${doneTasks.length} completed` })
    .setTimestamp();

  await interaction.reply({ embeds: [embed] });
}

async function handleDoneTask(interaction: ChatInputCommandInteraction, userId: string, guildId: string) {
  const taskId = interaction.options.getString('id', true);
  const tasks = await storage.getTasks(userId, guildId);
  const task = tasks.find(t => t.id.startsWith(taskId));

  if (!task) {
    await interaction.reply({ content: '❌ Task not found.', ephemeral: true });
    return;
  }

  await storage.updateTask(task.id, { status: 'done' });
  await storage.addXP(userId, 15);

  const stats = await storage.getUserStats(userId);
  if (stats) {
    await storage.updateUserStats(userId, { tasksCompleted: stats.tasksCompleted + 1 });
  }

  const embed = new EmbedBuilder()
    .setColor(0x23A559)
    .setTitle('🎉 Task Completed!')
    .setDescription(`**${task.title}** has been marked as done!\n\n+15 XP earned!`)
    .setFooter({ text: 'FormAT Task Manager' })
    .setTimestamp();

  await interaction.reply({ embeds: [embed] });
}

async function handleAddHabit(interaction: ChatInputCommandInteraction, userId: string, guildId: string) {
  const name = interaction.options.getString('name', true);
  const description = interaction.options.getString('description');

  const habit = await storage.createHabit({
    discordUserId: userId,
    guildId,
    name,
    description
  });

  const embed = new EmbedBuilder()
    .setColor(0x23A559)
    .setTitle('✨ Habit Created')
    .setDescription(`**${habit.name}**`)
    .addFields(
      { name: 'ID', value: `\`${habit.id.slice(0, 8)}\``, inline: true },
      { name: 'Streak', value: '🔥 0 days', inline: true }
    )
    .setFooter({ text: 'Track daily to build your streak!' })
    .setTimestamp();

  await interaction.reply({ embeds: [embed] });
  await storage.addXP(userId, 5);
}

async function handleListHabits(interaction: ChatInputCommandInteraction, userId: string, guildId: string) {
  const habits = await storage.getHabits(userId, guildId);

  if (habits.length === 0) {
    await interaction.reply({ content: '🌱 No habits yet. Use `/addhabit` to start tracking!', ephemeral: true });
    return;
  }

  let description = '**🌱 Your Habits**\n\n';
  habits.forEach(h => {
    const streakEmoji = h.streak >= 7 ? '🔥' : h.streak >= 3 ? '⭐' : '💪';
    description += `${streakEmoji} **${h.name}** - ${h.streak} day streak (Best: ${h.bestStreak})\n`;
    description += `   ID: \`${h.id.slice(0, 8)}\`\n\n`;
  });

  const embed = new EmbedBuilder()
    .setColor(0x5865F2)
    .setDescription(description)
    .setFooter({ text: 'Use /completehabit to mark done for today' })
    .setTimestamp();

  await interaction.reply({ embeds: [embed] });
}

async function handleCompleteHabit(interaction: ChatInputCommandInteraction, userId: string, guildId: string) {
  const habitId = interaction.options.getString('id', true);
  const habits = await storage.getHabits(userId, guildId);
  const habit = habits.find(h => h.id.startsWith(habitId));

  if (!habit) {
    await interaction.reply({ content: '❌ Habit not found.', ephemeral: true });
    return;
  }

  const now = new Date();
  const lastCompleted = habit.lastCompleted ? new Date(habit.lastCompleted) : null;
  const isConsecutive = lastCompleted && 
    (now.getTime() - lastCompleted.getTime()) < 48 * 60 * 60 * 1000;

  const newStreak = isConsecutive ? habit.streak + 1 : 1;
  const newBestStreak = Math.max(newStreak, habit.bestStreak);

  await storage.updateHabit(habit.id, {
    streak: newStreak,
    bestStreak: newBestStreak,
    lastCompleted: now
  });

  const xpEarned = 10 + (newStreak * 2);
  await storage.addXP(userId, xpEarned);

  const embed = new EmbedBuilder()
    .setColor(0x23A559)
    .setTitle('🔥 Habit Completed!')
    .setDescription(`**${habit.name}**\n\n🔥 Current Streak: **${newStreak} days**\n⭐ Best Streak: ${newBestStreak} days\n\n+${xpEarned} XP earned!`)
    .setFooter({ text: 'Keep it up!' })
    .setTimestamp();

  await interaction.reply({ embeds: [embed] });
}

async function handleFocus(interaction: ChatInputCommandInteraction, userId: string, guildId: string) {
  const minutes = interaction.options.getInteger('minutes') || 25;

  const session = await storage.createFocusSession({
    discordUserId: userId,
    guildId,
    duration: minutes
  });

  const endTime = Date.now() + (minutes * 60 * 1000);
  activeFocusSessions.set(userId, {
    sessionId: session.id,
    endTime,
    channelId: interaction.channelId
  });

  const embed = new EmbedBuilder()
    .setColor(0x5865F2)
    .setTitle('🎯 Focus Session Started')
    .setDescription(`Focus for **${minutes} minutes**\n\nI'll notify you when it's time for a break!`)
    .addFields(
      { name: 'Ends At', value: `<t:${Math.floor(endTime / 1000)}:R>`, inline: true },
      { name: 'Duration', value: `${minutes} min`, inline: true }
    )
    .setFooter({ text: 'Stay focused! You got this!' })
    .setTimestamp();

  await interaction.reply({ embeds: [embed] });
}

async function handleReflect(interaction: ChatInputCommandInteraction, userId: string, guildId: string) {
  const content = interaction.options.getString('content', true);
  const mood = interaction.options.getString('mood');

  await storage.createReflection({
    discordUserId: userId,
    guildId,
    content,
    mood
  });

  const moodEmojis: Record<string, string> = {
    happy: '😊', calm: '😌', frustrated: '😤', sad: '😢', tired: '😴', motivated: '🔥'
  };

  const embed = new EmbedBuilder()
    .setColor(0x5865F2)
    .setTitle('📝 Reflection Logged')
    .setDescription(content)
    .addFields({ name: 'Mood', value: mood ? `${moodEmojis[mood]} ${mood}` : 'Not specified', inline: true })
    .setFooter({ text: 'Self-reflection is key to growth!' })
    .setTimestamp();

  await interaction.reply({ embeds: [embed], ephemeral: true });
  await storage.addXP(userId, 10);
}

async function handleAddNote(interaction: ChatInputCommandInteraction, userId: string, guildId: string) {
  const topic = interaction.options.getString('topic', true);
  const content = interaction.options.getString('content', true);

  await storage.createNote({
    discordUserId: userId,
    guildId,
    topic,
    content
  });

  const embed = new EmbedBuilder()
    .setColor(0x23A559)
    .setTitle('📚 Note Added')
    .addFields(
      { name: 'Topic', value: topic, inline: true },
      { name: 'Content', value: content.length > 100 ? content.slice(0, 100) + '...' : content, inline: false }
    )
    .setFooter({ text: 'Added to server knowledge base' })
    .setTimestamp();

  await interaction.reply({ embeds: [embed] });
  await storage.addXP(userId, 8);
}

async function handleGetNote(interaction: ChatInputCommandInteraction, guildId: string) {
  const topic = interaction.options.getString('topic', true);
  const notes = await storage.getNotes(guildId, topic);

  if (notes.length === 0) {
    await interaction.reply({ content: `📚 No notes found for topic "${topic}"`, ephemeral: true });
    return;
  }

  let description = `**📚 Notes on "${topic}"**\n\n`;
  notes.slice(0, 5).forEach((note, i) => {
    description += `**${i + 1}.** ${note.content.slice(0, 200)}${note.content.length > 200 ? '...' : ''}\n\n`;
  });

  const embed = new EmbedBuilder()
    .setColor(0x5865F2)
    .setDescription(description)
    .setFooter({ text: `${notes.length} notes found` })
    .setTimestamp();

  await interaction.reply({ embeds: [embed] });
}

async function handleSearchNotes(interaction: ChatInputCommandInteraction, guildId: string) {
  const keyword = interaction.options.getString('keyword', true);
  const notes = await storage.searchNotes(guildId, keyword);

  if (notes.length === 0) {
    await interaction.reply({ content: `🔍 No notes found matching "${keyword}"`, ephemeral: true });
    return;
  }

  let description = `**🔍 Search Results for "${keyword}"**\n\n`;
  notes.slice(0, 5).forEach((note, i) => {
    description += `**${i + 1}. ${note.topic}**\n${note.content.slice(0, 100)}...\n\n`;
  });

  const embed = new EmbedBuilder()
    .setColor(0x5865F2)
    .setDescription(description)
    .setFooter({ text: `${notes.length} results` })
    .setTimestamp();

  await interaction.reply({ embeds: [embed] });
}

async function handleStartSession(interaction: ChatInputCommandInteraction) {
  const topic = interaction.options.getString('topic', true);

  if (!interaction.guild) {
    await interaction.reply({ content: '❌ This command only works in servers.', ephemeral: true });
    return;
  }

  try {
    const channel = await interaction.guild.channels.create({
      name: `session-${topic.toLowerCase().replace(/\s+/g, '-')}`,
      type: ChannelType.GuildText,
      topic: `Study/Project session: ${topic}`,
    });

    const embed = new EmbedBuilder()
      .setColor(0x23A559)
      .setTitle('📖 Session Channel Created')
      .setDescription(`A new session channel has been created for **${topic}**\n\nChannel: ${channel}`)
      .setFooter({ text: 'Collaborate and learn together!' })
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
    await storage.addXP(interaction.user.id, 15);
  } catch (error) {
    await interaction.reply({ content: '❌ Could not create channel. Check bot permissions.', ephemeral: true });
  }
}

async function handlePoll(interaction: ChatInputCommandInteraction, userId: string, guildId: string) {
  const question = interaction.options.getString('question', true);
  const optionsStr = interaction.options.getString('options', true);
  const options = optionsStr.split('|').map(o => o.trim()).filter(o => o.length > 0);

  if (options.length < 2 || options.length > 10) {
    await interaction.reply({ content: '❌ Please provide 2-10 options separated by |', ephemeral: true });
    return;
  }

  const poll = await storage.createPoll({
    discordUserId: userId,
    guildId,
    channelId: interaction.channelId,
    question,
    options
  });

  let description = `**${question}**\n\n`;
  const emojis = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟'];
  options.forEach((opt, i) => {
    description += `${emojis[i]} ${opt}\n`;
  });

  const embed = new EmbedBuilder()
    .setColor(0x5865F2)
    .setTitle('📊 Poll')
    .setDescription(description)
    .setFooter({ text: `Poll ID: ${poll.id.slice(0, 8)} • Click a button to vote!` })
    .setTimestamp();

  const row = new ActionRowBuilder<ButtonBuilder>();
  options.slice(0, 5).forEach((_, i) => {
    row.addComponents(
      new ButtonBuilder()
        .setCustomId(`poll_${poll.id}_${i}`)
        .setLabel(`${i + 1}`)
        .setStyle(ButtonStyle.Primary)
    );
  });

  await interaction.reply({ embeds: [embed], components: [row] });
}

async function handleQuiz(interaction: ChatInputCommandInteraction, userId: string) {
  const topic = interaction.options.getString('topic', true);
  const questions = quizData[topic];

  if (!questions || questions.length === 0) {
    await interaction.reply({ content: '❌ No questions available for this topic.', ephemeral: true });
    return;
  }

  const questionIndex = Math.floor(Math.random() * questions.length);
  const question = questions[questionIndex];

  activeQuizzes.set(userId, { topic, questionIndex, correct: 0, total: 0 });

  let description = `**${question.question}**\n\n`;
  question.options.forEach((opt, i) => {
    description += `**${i + 1}.** ${opt}\n`;
  });

  const embed = new EmbedBuilder()
    .setColor(0x5865F2)
    .setTitle(`📝 Quiz: ${topic.charAt(0).toUpperCase() + topic.slice(1)}`)
    .setDescription(description)
    .setFooter({ text: 'Click the correct answer!' })
    .setTimestamp();

  const row = new ActionRowBuilder<ButtonBuilder>();
  question.options.forEach((_, i) => {
    row.addComponents(
      new ButtonBuilder()
        .setCustomId(`quiz_${topic}_${questionIndex}_${i}`)
        .setLabel(`${i + 1}`)
        .setStyle(ButtonStyle.Primary)
    );
  });

  await interaction.reply({ embeds: [embed], components: [row] });
}

async function handleAddSkill(interaction: ChatInputCommandInteraction, userId: string, guildId: string) {
  const skillName = interaction.options.getString('skill', true);
  const hours = interaction.options.getInteger('hours', true);

  const existingSkills = await storage.getSkills(userId, guildId);
  let skill = existingSkills.find(s => s.name.toLowerCase() === skillName.toLowerCase());

  if (skill) {
    skill = await storage.updateSkillHours(skill.id, hours) || skill;
  } else {
    skill = await storage.createSkill({ discordUserId: userId, guildId, name: skillName });
    skill = await storage.updateSkillHours(skill.id, hours) || skill;
  }

  const embed = new EmbedBuilder()
    .setColor(0x23A559)
    .setTitle('📈 Skill Progress Updated')
    .setDescription(`**${skill.name}**`)
    .addFields(
      { name: 'Hours Added', value: `+${hours}h`, inline: true },
      { name: 'Total Hours', value: `${skill.totalHours}h`, inline: true },
      { name: 'Level', value: `⭐ ${skill.level}`, inline: true }
    )
    .setFooter({ text: 'Every hour counts!' })
    .setTimestamp();

  await interaction.reply({ embeds: [embed] });
  await storage.addXP(userId, hours * 5);
}

async function handleListSkills(interaction: ChatInputCommandInteraction, userId: string, guildId: string) {
  const skills = await storage.getSkills(userId, guildId);

  if (skills.length === 0) {
    await interaction.reply({ content: '📚 No skills tracked yet. Use `/addskill` to start!', ephemeral: true });
    return;
  }

  let description = '**📚 Your Skills**\n\n';
  skills.forEach(s => {
    const levelBar = '⬛'.repeat(Math.min(s.level, 10)) + '⬜'.repeat(Math.max(0, 10 - s.level));
    description += `**${s.name}** - Level ${s.level}\n${levelBar} (${s.totalHours}h)\n\n`;
  });

  const embed = new EmbedBuilder()
    .setColor(0x5865F2)
    .setDescription(description)
    .setFooter({ text: 'Keep practicing to level up!' })
    .setTimestamp();

  await interaction.reply({ embeds: [embed] });
}

async function handleRemindMe(interaction: ChatInputCommandInteraction, userId: string, guildId: string) {
  const message = interaction.options.getString('message', true);
  const timeStr = interaction.options.getString('time', true);

  const match = timeStr.match(/^(\d+)([mhd])$/);
  if (!match) {
    await interaction.reply({ content: '❌ Invalid time format. Use: 30m, 2h, or 1d', ephemeral: true });
    return;
  }

  const amount = parseInt(match[1]);
  const unit = match[2];
  let ms = amount * 60 * 1000;
  if (unit === 'h') ms *= 60;
  if (unit === 'd') ms *= 24 * 60;

  const remindAt = new Date(Date.now() + ms);

  await storage.createReminder({
    discordUserId: userId,
    guildId,
    channelId: interaction.channelId,
    message,
    remindAt
  });

  const embed = new EmbedBuilder()
    .setColor(0x23A559)
    .setTitle('⏰ Reminder Set')
    .setDescription(`I'll remind you: **${message}**`)
    .addFields({ name: 'When', value: `<t:${Math.floor(remindAt.getTime() / 1000)}:R>`, inline: true })
    .setFooter({ text: 'FormAT Reminders' })
    .setTimestamp();

  await interaction.reply({ embeds: [embed] });
  await storage.addXP(userId, 3);
}

async function handleAddResource(interaction: ChatInputCommandInteraction, userId: string, guildId: string) {
  const title = interaction.options.getString('title', true);
  const link = interaction.options.getString('link', true);
  const category = interaction.options.getString('category');

  await storage.createResource({
    discordUserId: userId,
    guildId,
    title,
    link,
    category
  });

  const embed = new EmbedBuilder()
    .setColor(0x23A559)
    .setTitle('📎 Resource Added')
    .addFields(
      { name: 'Title', value: title, inline: true },
      { name: 'Category', value: category || 'General', inline: true },
      { name: 'Link', value: `[View Resource](${link})`, inline: false }
    )
    .setFooter({ text: 'Added to server library' })
    .setTimestamp();

  await interaction.reply({ embeds: [embed] });
  await storage.addXP(userId, 10);
}

async function handleSearchResource(interaction: ChatInputCommandInteraction, guildId: string) {
  const keyword = interaction.options.getString('keyword', true);
  const resources = await storage.getResources(guildId, keyword);

  if (resources.length === 0) {
    await interaction.reply({ content: `📚 No resources found for "${keyword}"`, ephemeral: true });
    return;
  }

  let description = `**📚 Resources for "${keyword}"**\n\n`;
  resources.slice(0, 10).forEach((r, i) => {
    description += `**${i + 1}. ${r.title}** ${r.category ? `[${r.category}]` : ''}\n[View Resource](${r.link})\n\n`;
  });

  const embed = new EmbedBuilder()
    .setColor(0x5865F2)
    .setDescription(description)
    .setFooter({ text: `${resources.length} resources found` })
    .setTimestamp();

  await interaction.reply({ embeds: [embed] });
}

async function handleStats(interaction: ChatInputCommandInteraction, userId: string) {
  let stats = await storage.getUserStats(userId);
  if (!stats) {
    stats = await storage.createUserStats({ discordUserId: userId });
  }

  const xpToNext = 100 - (stats.xp % 100);
  const progressBar = '█'.repeat(Math.floor((stats.xp % 100) / 10)) + '░'.repeat(10 - Math.floor((stats.xp % 100) / 10));

  const embed = new EmbedBuilder()
    .setColor(0x5865F2)
    .setTitle(`📊 ${interaction.user.username}'s Stats`)
    .addFields(
      { name: '⭐ Level', value: `${stats.level}`, inline: true },
      { name: '✨ XP', value: `${stats.xp}`, inline: true },
      { name: '🔥 Streak', value: `${stats.currentStreak} days`, inline: true },
      { name: 'Progress to Next Level', value: `${progressBar} (${xpToNext} XP needed)`, inline: false },
      { name: '✅ Tasks', value: `${stats.tasksCompleted}`, inline: true },
      { name: '🌱 Habits', value: `${stats.habitsCompleted}`, inline: true },
      { name: '🎯 Focus', value: `${stats.focusMinutes} min`, inline: true }
    )
    .setFooter({ text: stats.isPro ? '⭐ Pro User' : 'Use /pro to unlock premium features!' })
    .setTimestamp();

  await interaction.reply({ embeds: [embed] });
}

async function handleLeaderboard(interaction: ChatInputCommandInteraction) {
  const leaderboard = await storage.getLeaderboard(10);
  
  const medals = ['🥇', '🥈', '🥉'];
  let description = '*Top contributors by XP*\n\n';
  
  if (leaderboard.length === 0) {
    description += 'No users yet! Be the first to join the leaderboard!';
  } else {
    leaderboard.forEach((user, index) => {
      const medal = medals[index] || `**${index + 1}.**`;
      description += `${medal} <@${user.discordUserId}> - Level ${user.level} (${user.xp} XP)\n`;
    });
  }
  
  const embed = new EmbedBuilder()
    .setColor(0x5865F2)
    .setTitle('🏆 Server Leaderboard')
    .setDescription(description)
    .setFooter({ text: 'Earn XP to climb the ranks!' })
    .setTimestamp();

  await interaction.reply({ embeds: [embed] });
}

async function handlePet(interaction: ChatInputCommandInteraction, userId: string) {
  let stats = await storage.getUserStats(userId);
  if (!stats) {
    stats = await storage.createUserStats({ discordUserId: userId });
  }

  const petStages = ['🥚', '🐣', '🐥', '🐤', '🐦', '🦅', '🦜', '🔥🦅'];
  const petLevel = Math.min(stats.petLevel, petStages.length);
  const petEmoji = petStages[petLevel - 1];

  const embed = new EmbedBuilder()
    .setColor(0x5865F2)
    .setTitle(`${petEmoji} Your Pet`)
    .setDescription(`**${stats.petName || 'Unnamed Pet'}** - Level ${petLevel}`)
    .addFields(
      { name: 'Stage', value: petEmoji, inline: true },
      { name: 'Level', value: `${petLevel}/${petStages.length}`, inline: true },
      { name: 'Next Evolution', value: petLevel < petStages.length ? `${(petLevel) * 50 - stats.xp % (petLevel * 50)} XP` : 'MAX LEVEL!', inline: true }
    )
    .setFooter({ text: 'Complete tasks and habits to help your pet grow!' })
    .setTimestamp();

  await interaction.reply({ embeds: [embed] });
}

async function handleProStats(interaction: ChatInputCommandInteraction, userId: string) {
  const stats = await storage.getUserStats(userId);

  if (!stats?.isPro) {
    const embed = new EmbedBuilder()
      .setColor(0xFFD700)
      .setTitle('⭐ Pro Features')
      .setDescription('Unlock advanced analytics and premium features!')
      .addFields(
        { name: '📊 Detailed Analytics', value: 'Track your productivity over time', inline: false },
        { name: '🔔 Priority Reminders', value: 'Never miss important tasks', inline: false },
        { name: '💡 Extra Nuggets', value: 'More daily knowledge nuggets', inline: false },
        { name: '⭐ Bonus XP', value: '2x XP on all activities', inline: false }
      )
      .setFooter({ text: 'Contact admin to upgrade to Pro!' })
      .setTimestamp();

    await interaction.reply({ embeds: [embed], ephemeral: true });
    return;
  }

  const embed = new EmbedBuilder()
    .setColor(0xFFD700)
    .setTitle(`⭐ ${interaction.user.username}'s Pro Analytics`)
    .setDescription('Detailed productivity insights')
    .addFields(
      { name: '📈 Weekly XP', value: `${stats.xp} XP`, inline: true },
      { name: '🔥 Best Streak', value: `${stats.bestStreak} days`, inline: true },
      { name: '📊 Total Focus', value: `${stats.focusMinutes} min`, inline: true },
      { name: '✅ Completion Rate', value: `${Math.round((stats.tasksCompleted / Math.max(1, stats.tasksCompleted + 5)) * 100)}%`, inline: true },
      { name: '📚 Quizzes', value: `${stats.quizzesCompleted}`, inline: true },
      { name: '🎯 Efficiency Score', value: `${Math.min(100, stats.level * 10)}%`, inline: true }
    )
    .setFooter({ text: '⭐ Pro User Analytics' })
    .setTimestamp();

  await interaction.reply({ embeds: [embed] });
}

async function handleNugget(interaction: ChatInputCommandInteraction) {
  const nugget = dailyNuggets[Math.floor(Math.random() * dailyNuggets.length)];

  const embed = new EmbedBuilder()
    .setColor(0xFFD700)
    .setTitle('💡 Knowledge Nugget')
    .setDescription(nugget)
    .setFooter({ text: 'Learn something new every day!' })
    .setTimestamp();

  await interaction.reply({ embeds: [embed] });
  await storage.addXP(interaction.user.id, 2);
}

async function handleHelp(interaction: ChatInputCommandInteraction) {
  const embed = new EmbedBuilder()
    .setColor(0x5865F2)
    .setTitle('🧠 FormAT AI Assistant')
    .setDescription('Your personal productivity and growth companion!')
    .addFields(
      { name: '🤖 AI Commands', value: '`/ask` `/generate` `/translate` `/search` `/nugget`', inline: false },
      { name: '📋 Productivity', value: '`/addtask` `/tasks` `/donetask` `/focus` `/reflect`', inline: false },
      { name: '🌱 Habits & Skills', value: '`/addhabit` `/habits` `/completehabit` `/addskill` `/skills`', inline: false },
      { name: '📚 Knowledge Base', value: '`/addnote` `/getnote` `/searchnotes` `/addresource` `/searchresource`', inline: false },
      { name: '👥 Collaboration', value: '`/startsession` `/poll`', inline: false },
      { name: '🎮 Learning & Fun', value: '`/quiz` `/pet` `/leaderboard`', inline: false },
      { name: '⚡ Utilities', value: '`/remindme` `/stats` `/prostats`', inline: false }
    )
    .addFields({ name: '✨ Features', value: '📊 Real-time XP • 🏆 Leaderboards • 🌐 Multi-API Translation • 🔍 Web Search • 💬 AI Chat', inline: false })
    .setFooter({ text: 'FormAT • Multi-API Translation • Web Search • Knowledge Base' })
    .setTimestamp();

  await interaction.reply({ embeds: [embed] });
}

async function handleButtonInteraction(interaction: any) {
  const customId = interaction.customId;

  if (customId.startsWith('poll_')) {
    const [, pollId, optionIndex] = customId.split('_');
    const poll = await storage.getPoll(pollId);
    
    if (!poll || !poll.active) {
      await interaction.reply({ content: '❌ This poll is no longer active.', ephemeral: true });
      return;
    }

    await storage.votePoll(pollId, parseInt(optionIndex), interaction.user.id);
    await interaction.reply({ content: `✅ Your vote has been recorded!`, ephemeral: true });
    await storage.addXP(interaction.user.id, 2);
  }

  if (customId.startsWith('quiz_')) {
    const [, topic, questionIndexStr, answerIndex] = customId.split('_');
    const questionIndex = parseInt(questionIndexStr);
    const questions = quizData[topic];
    const question = questions?.[questionIndex];

    if (!question) {
      await interaction.reply({ content: '❌ Quiz data not found.', ephemeral: true });
      return;
    }

    const isCorrect = parseInt(answerIndex) === question.correct;
    
    if (isCorrect) {
      await storage.addXP(interaction.user.id, 20);
      await storage.incrementQuizzesCompleted(interaction.user.id);
      const embed = new EmbedBuilder()
        .setColor(0x23A559)
        .setTitle('✅ Correct!')
        .setDescription(`Great job! The answer was: **${question.options[question.correct]}**\n\n+20 XP earned!`)
        .setTimestamp();
      await interaction.reply({ embeds: [embed] });
    } else {
      const embed = new EmbedBuilder()
        .setColor(0xFF0000)
        .setTitle('❌ Incorrect')
        .setDescription(`The correct answer was: **${question.options[question.correct]}**\n\nKeep learning!`)
        .setTimestamp();
      await interaction.reply({ embeds: [embed] });
    }
  }
}

async function checkReminders(client: Client) {
  try {
    const pending = await storage.getPendingReminders();
    
    for (const reminder of pending) {
      try {
        const channel = await client.channels.fetch(reminder.channelId);
        if (channel && channel.isTextBased()) {
          const embed = new EmbedBuilder()
            .setColor(0x5865F2)
            .setTitle('⏰ Reminder')
            .setDescription(`<@${reminder.discordUserId}>\n\n${reminder.message}`)
            .setTimestamp();

          await (channel as any).send({ embeds: [embed] });
          await storage.markReminderSent(reminder.id);
        }
      } catch (e) {
        log(`Reminder error: ${e}`, 'discord');
      }
    }
  } catch (e) {
    log(`Check reminders error: ${e}`, 'discord');
  }
}

async function checkFocusSessions(client: Client) {
  const now = Date.now();
  
  for (const [userId, session] of activeFocusSessions.entries()) {
    if (now >= session.endTime) {
      try {
        const channel = await client.channels.fetch(session.channelId);
        if (channel && channel.isTextBased()) {
          await storage.endFocusSession(session.sessionId);
          
          const stats = await storage.getUserStats(userId);
          if (stats) {
            const duration = Math.round((session.endTime - (now - 10000)) / 60000);
            await storage.updateUserStats(userId, { focusMinutes: stats.focusMinutes + duration });
          }
          await storage.addXP(userId, 25);

          const embed = new EmbedBuilder()
            .setColor(0x23A559)
            .setTitle('🎉 Focus Session Complete!')
            .setDescription(`<@${userId}> Great work! Time for a well-deserved break.\n\n+25 XP earned!`)
            .setTimestamp();

          await (channel as any).send({ embeds: [embed] });
        }
        
        activeFocusSessions.delete(userId);
      } catch (e) {
        log(`Focus session error: ${e}`, 'discord');
        activeFocusSessions.delete(userId);
      }
    }
  }
}
