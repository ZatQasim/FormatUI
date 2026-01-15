import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'pg';
import { 
  type User, type InsertUser,
  type Task, type InsertTask,
  type Conversation, type InsertConversation,
  type Habit, type InsertHabit,
  type FocusSession, type InsertFocusSession,
  type Reflection, type InsertReflection,
  type Note, type InsertNote,
  type Resource, type InsertResource,
  type Skill, type InsertSkill,
  type Reminder, type InsertReminder,
  type Poll, type InsertPoll,
  type UserStats, type InsertUserStats,
  type QuizScore, type InsertQuizScore,
  type AiKnowledge, type InsertAiKnowledge,
  type AiTrainingData, type InsertAiTrainingData,
  type SearchHistory, type InsertSearchHistory,
  type QuestionHistory, type InsertQuestionHistory,
  users, tasks, conversations, habits, focusSessions, reflections,
  notes, resources, skills, reminders, polls, userStats, quizScores,
  aiKnowledge, aiTrainingData, searchHistory, questionHistory, securityReports,
  type SecurityReport, type InsertSecurityReport
} from "../schema-endpoint/schema";
import { eq, and, like, sql, desc, or } from 'drizzle-orm';
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

import { drizzle as drizzlePg } from 'drizzle-orm/node-postgres';
export const db = drizzlePg(pool);

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByDiscordId(discordId: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, updates: Partial<User>): Promise<User | undefined>;
  setUserPro(username: string, isPro: boolean): Promise<User | undefined>;
  getQuestionCountForDay(username: string, dateString: string): Promise<number>;
  
  getTasks(discordUserId: string, guildId: string): Promise<Task[]>;
  getTask(id: string): Promise<Task | undefined>;
  createTask(task: InsertTask): Promise<Task>;
  updateTask(id: string, updates: Partial<Task>): Promise<Task | undefined>;
  deleteTask(id: string): Promise<boolean>;
  
  getHabits(discordUserId: string, guildId: string): Promise<Habit[]>;
  createHabit(habit: InsertHabit): Promise<Habit>;
  updateHabit(id: string, updates: Partial<Habit>): Promise<Habit | undefined>;
  deleteHabit(id: string): Promise<boolean>;
  
  createFocusSession(session: InsertFocusSession): Promise<FocusSession>;
  endFocusSession(id: string): Promise<FocusSession | undefined>;
  
  getReflections(discordUserId: string, guildId: string, limit?: number): Promise<Reflection[]>;
  createReflection(reflection: InsertReflection): Promise<Reflection>;
  
  getNotes(guildId: string, topic?: string): Promise<Note[]>;
  searchNotes(guildId: string, keyword: string): Promise<Note[]>;
  createNote(note: InsertNote): Promise<Note>;
  
  getResources(guildId: string, keyword?: string): Promise<Resource[]>;
  createResource(resource: InsertResource): Promise<Resource>;
  
  getSkills(discordUserId: string, guildId: string): Promise<Skill[]>;
  createSkill(skill: InsertSkill): Promise<Skill>;
  updateSkillHours(id: string, hours: number): Promise<Skill | undefined>;
  
  getReminders(discordUserId: string): Promise<Reminder[]>;
  getPendingReminders(): Promise<Reminder[]>;
  createReminder(reminder: InsertReminder): Promise<Reminder>;
  markReminderSent(id: string): Promise<void>;
  
  createPoll(poll: InsertPoll): Promise<Poll>;
  getPoll(id: string): Promise<Poll | undefined>;
  votePoll(id: string, optionIndex: number, discordUserId: string): Promise<Poll | undefined>;
  closePoll(id: string): Promise<Poll | undefined>;
  
  getUserStats(discordUserId: string): Promise<UserStats | undefined>;
  createUserStats(stats: InsertUserStats): Promise<UserStats>;
  updateUserStats(discordUserId: string, updates: Partial<UserStats>): Promise<UserStats | undefined>;
  addXP(discordUserId: string, amount: number): Promise<UserStats | undefined>;
  
  getQuizScores(discordUserId: string, topic?: string): Promise<QuizScore[]>;
  createQuizScore(score: InsertQuizScore): Promise<QuizScore>;
  getLeaderboard(limit?: number): Promise<UserStats[]>;
  incrementQuizzesCompleted(discordUserId: string): Promise<void>;
  
  getConversation(discordUserId: string, channelId: string): Promise<Conversation | undefined>;
  createConversation(conversation: InsertConversation): Promise<Conversation>;
  updateConversation(id: string, messages: string): Promise<Conversation | undefined>;

  getSearchHistory(discordUserId: string, limit?: number): Promise<SearchHistory[]>;
  createSearchHistory(history: InsertSearchHistory): Promise<SearchHistory>;
  deleteSearchHistory(id: string): Promise<boolean>;
  clearSearchHistory(discordUserId: string): Promise<boolean>;

  getQuestionHistory(discordUserId: string, limit?: number): Promise<QuestionHistory[]>;
  createQuestionHistory(history: InsertQuestionHistory): Promise<QuestionHistory>;

  getSecurityReport(id: string): Promise<SecurityReport | undefined>;
  createSecurityReport(report: InsertSecurityReport): Promise<SecurityReport>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
    return result[0];
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.username, username)).limit(1);
    return result[0];
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
    return result[0];
  }

  async getUserByDiscordId(discordId: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.discordId, discordId)).limit(1);
    return result[0];
  }

  async createUser(user: InsertUser & { discordId?: string | null, twoFactorSecret?: string | null, isPro?: boolean }): Promise<User> {
    const result = await db.insert(users).values(user).returning();
    return result[0];
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User | undefined> {
    const result = await db.update(users).set(updates).where(eq(users.id, id)).returning();
    return result[0];
  }

  async setUserPro(username: string, isPro: boolean): Promise<User | undefined> {
    const result = await db.update(users).set({ isPro }).where(eq(users.username, username)).returning();
    return result[0];
  }

  async getQuestionCountForDay(username: string, dateString: string): Promise<number> {
    try {
      const result = await db.select({ count: sql<number>`count(*)` })
        .from(questionHistory)
        .where(and(
          eq(questionHistory.discordUserId, username),
          sql`DATE(${questionHistory.createdAt}) = DATE(${dateString})`
        ));
      return Number(result[0]?.count || 0);
    } catch (e) {
      console.error("Error getting question count:", e);
      return 0;
    }
  }

  async getTasks(discordUserId: string, guildId: string): Promise<Task[]> {
    return db.select().from(tasks).where(
      and(eq(tasks.discordUserId, discordUserId), eq(tasks.guildId, guildId))
    );
  }

  async getTask(id: string): Promise<Task | undefined> {
    const result = await db.select().from(tasks).where(eq(tasks.id, id)).limit(1);
    return result[0];
  }

  async createTask(task: InsertTask): Promise<Task> {
    const result = await db.insert(tasks).values(task).returning();
    return result[0];
  }

  async updateTask(id: string, updates: Partial<Task>): Promise<Task | undefined> {
    const result = await db.update(tasks).set(updates).where(eq(tasks.id, id)).returning();
    return result[0];
  }

  async deleteTask(id: string): Promise<boolean> {
    const result = await db.delete(tasks).where(eq(tasks.id, id)).returning();
    return result.length > 0;
  }

  async getHabits(discordUserId: string, guildId: string): Promise<Habit[]> {
    return db.select().from(habits).where(
      and(eq(habits.discordUserId, discordUserId), eq(habits.guildId, guildId))
    );
  }

  async createHabit(habit: InsertHabit): Promise<Habit> {
    const result = await db.insert(habits).values(habit).returning();
    return result[0];
  }

  async updateHabit(id: string, updates: Partial<Habit>): Promise<Habit | undefined> {
    const result = await db.update(habits).set(updates).where(eq(habits.id, id)).returning();
    return result[0];
  }

  async deleteHabit(id: string): Promise<boolean> {
    const result = await db.delete(habits).where(eq(habits.id, id)).returning();
    return result.length > 0;
  }

  async createFocusSession(session: InsertFocusSession): Promise<FocusSession> {
    const result = await db.insert(focusSessions).values(session).returning();
    return result[0];
  }

  async endFocusSession(id: string): Promise<FocusSession | undefined> {
    const result = await db.update(focusSessions)
      .set({ completed: true, endedAt: new Date() })
      .where(eq(focusSessions.id, id))
      .returning();
    return result[0];
  }

  async getReflections(discordUserId: string, guildId: string, limit = 10): Promise<Reflection[]> {
    return db.select().from(reflections)
      .where(and(eq(reflections.discordUserId, discordUserId), eq(reflections.guildId, guildId)))
      .orderBy(desc(reflections.createdAt))
      .limit(limit);
  }

  async createReflection(reflection: InsertReflection): Promise<Reflection> {
    const result = await db.insert(reflections).values(reflection).returning();
    return result[0];
  }

  async getNotes(guildId: string, topic?: string): Promise<Note[]> {
    if (topic) {
      return db.select().from(notes).where(
        and(eq(notes.guildId, guildId), eq(notes.topic, topic))
      );
    }
    return db.select().from(notes).where(eq(notes.guildId, guildId));
  }

  async searchNotes(guildId: string, keyword: string): Promise<Note[]> {
    return db.select().from(notes).where(
      and(
        eq(notes.guildId, guildId),
        or(
          like(notes.topic, `%${keyword}%`),
          like(notes.content, `%${keyword}%`)
        )
      )
    );
  }

  async createNote(note: InsertNote): Promise<Note> {
    const result = await db.insert(notes).values(note).returning();
    return result[0];
  }

  async getResources(guildId: string, keyword?: string): Promise<Resource[]> {
    let query = db.select().from(resources).where(eq(resources.guildId, guildId));
    if (keyword) {
      return db.select().from(resources).where(
        and(
          eq(resources.guildId, guildId),
          or(
            like(resources.title, `%${keyword}%`),
            like(resources.category, `%${keyword}%`),
            like(resources.description, `%${keyword}%`)
          )
        )
      );
    }
    return query;
  }

  async createResource(resource: InsertResource): Promise<Resource> {
    const result = await db.insert(resources).values(resource).returning();
    return result[0];
  }

  async getSkills(discordUserId: string, guildId: string): Promise<Skill[]> {
    return db.select().from(skills).where(
      and(eq(skills.discordUserId, discordUserId), eq(skills.guildId, guildId))
    );
  }

  async createSkill(skill: InsertSkill): Promise<Skill> {
    const result = await db.insert(skills).values(skill).returning();
    return result[0];
  }

  async updateSkillHours(id: string, hours: number): Promise<Skill | undefined> {
    const existing = await db.select().from(skills).where(eq(skills.id, id)).limit(1);
    if (!existing[0]) return undefined;
    
    const newTotal = existing[0].totalHours + hours;
    const newLevel = Math.floor(newTotal / 10) + 1;
    
    const result = await db.update(skills)
      .set({ totalHours: newTotal, level: newLevel })
      .where(eq(skills.id, id))
      .returning();
    return result[0];
  }

  async getReminders(discordUserId: string): Promise<Reminder[]> {
    return db.select().from(reminders)
      .where(and(eq(reminders.discordUserId, discordUserId), eq(reminders.sent, false)));
  }

  async getPendingReminders(): Promise<Reminder[]> {
    return db.select().from(reminders).where(
      and(
        eq(reminders.sent, false),
        sql`${reminders.remindAt} <= NOW()`
      )
    );
  }

  async createReminder(reminder: InsertReminder): Promise<Reminder> {
    const result = await db.insert(reminders).values(reminder).returning();
    return result[0];
  }

  async markReminderSent(id: string): Promise<void> {
    await db.update(reminders).set({ sent: true }).where(eq(reminders.id, id));
  }

  async createPoll(poll: InsertPoll): Promise<Poll> {
    const result = await db.insert(polls).values(poll).returning();
    return result[0];
  }

  async getPoll(id: string): Promise<Poll | undefined> {
    const result = await db.select().from(polls).where(eq(polls.id, id)).limit(1);
    return result[0];
  }

  async votePoll(id: string, optionIndex: number, discordUserId: string): Promise<Poll | undefined> {
    const poll = await this.getPoll(id);
    if (!poll || !poll.active) return undefined;
    
    const votes = (poll.votes as Record<string, number>) || {};
    votes[discordUserId] = optionIndex;
    
    const result = await db.update(polls)
      .set({ votes })
      .where(eq(polls.id, id))
      .returning();
    return result[0];
  }

  async closePoll(id: string): Promise<Poll | undefined> {
    const result = await db.update(polls)
      .set({ active: false })
      .where(eq(polls.id, id))
      .returning();
    return result[0];
  }

  async getUserStats(discordUserId: string): Promise<UserStats | undefined> {
    const result = await db.select().from(userStats)
      .where(eq(userStats.discordUserId, discordUserId)).limit(1);
    return result[0];
  }

  async createUserStats(stats: InsertUserStats): Promise<UserStats> {
    const result = await db.insert(userStats).values(stats).returning();
    return result[0];
  }

  async updateUserStats(discordUserId: string, updates: Partial<UserStats>): Promise<UserStats | undefined> {
    const result = await db.update(userStats)
      .set({ ...updates, lastActive: new Date() })
      .where(eq(userStats.discordUserId, discordUserId))
      .returning();
    return result[0];
  }

  async addXP(discordUserId: string, amount: number): Promise<UserStats | undefined> {
    let stats = await this.getUserStats(discordUserId);
    if (!stats) {
      stats = await this.createUserStats({ discordUserId });
    }
    
    const newXP = stats.xp + amount;
    const newLevel = Math.floor(newXP / 100) + 1;
    
    return this.updateUserStats(discordUserId, { xp: newXP, level: newLevel });
  }

  async getQuizScores(discordUserId: string, topic?: string): Promise<QuizScore[]> {
    if (topic) {
      return db.select().from(quizScores).where(
        and(eq(quizScores.discordUserId, discordUserId), eq(quizScores.topic, topic))
      );
    }
    return db.select().from(quizScores).where(eq(quizScores.discordUserId, discordUserId));
  }

  async createQuizScore(score: InsertQuizScore): Promise<QuizScore> {
    const result = await db.insert(quizScores).values(score).returning();
    return result[0];
  }

  async getLeaderboard(limit = 10): Promise<UserStats[]> {
    return db.select().from(userStats).orderBy(desc(userStats.xp)).limit(limit);
  }

  async incrementQuizzesCompleted(discordUserId: string): Promise<void> {
    const stats = await this.getUserStats(discordUserId);
    if (stats) {
      await this.updateUserStats(discordUserId, { quizzesCompleted: stats.quizzesCompleted + 1 });
    }
  }

  async getConversation(discordUserId: string, channelId: string): Promise<Conversation | undefined> {
    const result = await db.select().from(conversations).where(
      and(eq(conversations.discordUserId, discordUserId), eq(conversations.channelId, channelId))
    ).limit(1);
    return result[0];
  }

  async createConversation(conversation: InsertConversation): Promise<Conversation> {
    const result = await db.insert(conversations).values(conversation).returning();
    return result[0];
  }

  async updateConversation(id: string, messages: string): Promise<Conversation | undefined> {
    const result = await db.update(conversations)
      .set({ messages, updatedAt: new Date() })
      .where(eq(conversations.id, id))
      .returning();
    return result[0];
  }

  async getSearchHistory(discordUserId: string, limit: number = 10): Promise<SearchHistory[]> {
    return db.select().from(searchHistory)
      .where(eq(searchHistory.discordUserId, discordUserId))
      .orderBy(desc(searchHistory.createdAt))
      .limit(limit);
  }

  async createSearchHistory(history: InsertSearchHistory): Promise<SearchHistory> {
    const result = await db.insert(searchHistory).values(history).returning();
    return result[0];
  }

  async deleteSearchHistory(id: string): Promise<boolean> {
    const result = await db.delete(searchHistory).where(eq(searchHistory.id, id)).returning();
    return result.length > 0;
  }

  async clearSearchHistory(discordUserId: string): Promise<boolean> {
    const result = await db.delete(searchHistory).where(eq(searchHistory.discordUserId, discordUserId)).returning();
    return true;
  }

  async getQuestionHistory(discordUserId: string, limit: number = 10): Promise<QuestionHistory[]> {
    return db.select().from(questionHistory)
      .where(eq(questionHistory.discordUserId, discordUserId))
      .orderBy(desc(questionHistory.createdAt))
      .limit(limit);
  }

  async createQuestionHistory(history: InsertQuestionHistory): Promise<QuestionHistory> {
    const result = await db.insert(questionHistory).values(history).returning();
    return result[0];
  }

  async getSecurityReport(id: string): Promise<SecurityReport | undefined> {
    const result = await db.select().from(securityReports).where(eq(securityReports.id, id)).limit(1);
    return result[0];
  }

  async createSecurityReport(report: InsertSecurityReport): Promise<SecurityReport> {
    const result = await db.insert(securityReports).values(report).returning();
    return result[0];
  }
  async initializeAI() {
    try {
      const count = await db.select({ count: sql<number>`count(*)` }).from(aiKnowledge);
      if (Number(count[0].count) === 0) {
        await db.insert(aiKnowledge).values([
          { category: "general", pattern: "hello", response: "Hello! I am FormAT. How can I assist you today?", weight: 1 },
          { category: "general", pattern: "who are you", response: "I am FormAT, your intelligent productivity assistant.", weight: 1 }
        ]);
      }
    } catch (e) {
      console.error("AI Initialization error: ", e);
    }
  }
}

export const storage = new DatabaseStorage();
