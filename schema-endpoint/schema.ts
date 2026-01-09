import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, timestamp, boolean, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(), // Format: Name#1234
  password: text("password").notNull(),
  email: text("email").unique(),
  discordId: text("discord_id"),
  twoFactorSecret: text("2fa_secret"),
  isPro: boolean("is_pro").notNull().default(false),
});

export const tasks = pgTable("tasks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  discordUserId: text("discord_user_id").notNull(),
  guildId: text("guild_id").notNull().default("web"),
  title: text("title").notNull(),
  description: text("description"), // For Task Notes
  status: text("status").notNull().default("todo"),
  priority: text("priority").notNull().default("medium"),
  tag: text("tag").notNull().default("General"),
  resources: jsonb("resources").notNull().default([]), // For Resources
  createdAt: timestamp("created_at").defaultNow(),
});

export const habits = pgTable("habits", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  discordUserId: text("discord_user_id").notNull(),
  guildId: text("guild_id").notNull(),
  name: text("name").notNull(),
  description: text("description"),
  streak: integer("streak").notNull().default(0),
  bestStreak: integer("best_streak").notNull().default(0),
  lastCompleted: timestamp("last_completed"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const focusSessions = pgTable("focus_sessions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  discordUserId: text("discord_user_id").notNull(),
  guildId: text("guild_id").notNull(),
  duration: integer("duration").notNull(),
  completed: boolean("completed").notNull().default(false),
  startedAt: timestamp("started_at").defaultNow(),
  endedAt: timestamp("ended_at"),
});

export const reflections = pgTable("reflections", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  discordUserId: text("discord_user_id").notNull(),
  guildId: text("guild_id").notNull(),
  content: text("content").notNull(),
  mood: text("mood"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const notes = pgTable("notes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  discordUserId: text("discord_user_id").notNull(),
  guildId: text("guild_id").notNull(),
  topic: text("topic").notNull(),
  content: text("content").notNull(),
  tags: text("tags").array(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const resources = pgTable("resources", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  discordUserId: text("discord_user_id").notNull(),
  guildId: text("guild_id").notNull(),
  title: text("title").notNull(),
  link: text("link").notNull(),
  category: text("category").notNull().default("General"), // Updated
  type: text("type").notNull().default("link"), // New: link, file, template
  description: text("description"), // New
  createdAt: timestamp("created_at").defaultNow(),
});

export const skills = pgTable("skills", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  discordUserId: text("discord_user_id").notNull(),
  guildId: text("guild_id").notNull(),
  name: text("name").notNull(),
  totalHours: integer("total_hours").notNull().default(0),
  level: integer("level").notNull().default(1),
  createdAt: timestamp("created_at").defaultNow(),
});

export const reminders = pgTable("reminders", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  discordUserId: text("discord_user_id").notNull(),
  guildId: text("guild_id").notNull(),
  channelId: text("channel_id").notNull(),
  message: text("message").notNull(),
  remindAt: timestamp("remind_at").notNull(),
  sent: boolean("sent").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const polls = pgTable("polls", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  discordUserId: text("discord_user_id").notNull(),
  guildId: text("guild_id").notNull(),
  channelId: text("channel_id").notNull(),
  messageId: text("message_id"),
  question: text("question").notNull(),
  options: text("options").array().notNull(),
  votes: jsonb("votes").notNull().default({}),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const userStats = pgTable("user_stats", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  discordUserId: text("discord_user_id").notNull().unique(),
  xp: integer("xp").notNull().default(0),
  level: integer("level").notNull().default(1),
  tasksCompleted: integer("tasks_completed").notNull().default(0),
  habitsCompleted: integer("habits_completed").notNull().default(0),
  focusMinutes: integer("focus_minutes").notNull().default(0),
  quizzesCompleted: integer("quizzes_completed").notNull().default(0),
  currentStreak: integer("current_streak").notNull().default(0),
  bestStreak: integer("best_streak").notNull().default(0),
  lastActive: timestamp("last_active").defaultNow(),
  isPro: boolean("is_pro").notNull().default(false),
  petLevel: integer("pet_level").notNull().default(1),
  petName: text("pet_name"),
});

export const quizScores = pgTable("quiz_scores", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  discordUserId: text("discord_user_id").notNull(),
  topic: text("topic").notNull(),
  score: integer("score").notNull(),
  totalQuestions: integer("total_questions").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const aiKnowledge = pgTable("ai_knowledge", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  category: text("category").notNull(),
  pattern: text("pattern").notNull(),
  response: text("response").notNull(),
  weight: integer("weight").notNull().default(1),
  usageCount: integer("usage_count").notNull().default(0),
  feedback: integer("feedback").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const aiTrainingData = pgTable("ai_training_data", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  input: text("input").notNull(),
  expectedOutput: text("expected_output"),
  actualOutput: text("actual_output"),
  category: text("category"),
  quality: integer("quality").default(0),
  processed: boolean("processed").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const conversations = pgTable("conversations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  discordUserId: text("discord_user_id").notNull(),
  guildId: text("guild_id").notNull(),
  channelId: text("channel_id").notNull(),
  messages: text("messages").notNull().default("[]"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const searchHistory = pgTable("search_history", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  discordUserId: text("discord_user_id").notNull(),
  query: text("query").notNull(),
  summary: text("summary").notNull(),
  results: text("results").notNull().default("[]"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const questionHistory = pgTable("question_history", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  discordUserId: text("discord_user_id").notNull(),
  question: text("question").notNull(),
  summary: text("summary").notNull(),
  answer: text("answer").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const securityReports = pgTable("security_reports", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  discordUserId: text("discord_user_id"),
  fileName: text("file_name").notNull(),
  fingerprint: text("fingerprint").notNull(),
  isSafe: boolean("is_safe").notNull(),
  details: jsonb("details").notNull().default({}),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertSecurityReportSchema = createInsertSchema(securityReports).omit({
  id: true,
  createdAt: true,
});

export type InsertSecurityReport = z.infer<typeof insertSecurityReportSchema>;
export type SecurityReport = typeof securityReports.$inferSelect;

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertTaskSchema = createInsertSchema(tasks).omit({
  id: true,
  createdAt: true,
});

export const insertHabitSchema = createInsertSchema(habits).omit({
  id: true,
  createdAt: true,
  streak: true,
  bestStreak: true,
  lastCompleted: true,
});

export const insertFocusSessionSchema = createInsertSchema(focusSessions).omit({
  id: true,
  startedAt: true,
  endedAt: true,
  completed: true,
});

export const insertReflectionSchema = createInsertSchema(reflections).omit({
  id: true,
  createdAt: true,
});

export const insertNoteSchema = createInsertSchema(notes).omit({
  id: true,
  createdAt: true,
});

export const insertResourceSchema = createInsertSchema(resources).omit({
  id: true,
  createdAt: true,
});

export const insertSkillSchema = createInsertSchema(skills).omit({
  id: true,
  createdAt: true,
  totalHours: true,
  level: true,
});

export const insertReminderSchema = createInsertSchema(reminders).omit({
  id: true,
  createdAt: true,
  sent: true,
});

export const insertPollSchema = createInsertSchema(polls).omit({
  id: true,
  createdAt: true,
  votes: true,
  active: true,
  messageId: true,
});

export const insertUserStatsSchema = createInsertSchema(userStats).omit({
  id: true,
});

export const insertQuizScoreSchema = createInsertSchema(quizScores).omit({
  id: true,
  createdAt: true,
});

export const insertAiKnowledgeSchema = createInsertSchema(aiKnowledge).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  usageCount: true,
  feedback: true,
});

export const insertAiTrainingDataSchema = createInsertSchema(aiTrainingData).omit({
  id: true,
  createdAt: true,
  processed: true,
});

export const insertConversationSchema = createInsertSchema(conversations).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertSearchHistorySchema = createInsertSchema(searchHistory).omit({
  id: true,
  createdAt: true,
});

export const insertQuestionHistorySchema = createInsertSchema(questionHistory).omit({
  id: true,
  createdAt: true,
});

export type InsertSearchHistory = z.infer<typeof insertSearchHistorySchema>;
export type SearchHistory = typeof searchHistory.$inferSelect;

export type InsertQuestionHistory = z.infer<typeof insertQuestionHistorySchema>;
export type QuestionHistory = typeof questionHistory.$inferSelect;

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertTask = z.infer<typeof insertTaskSchema>;
export type Task = typeof tasks.$inferSelect;

export type InsertHabit = z.infer<typeof insertHabitSchema>;
export type Habit = typeof habits.$inferSelect;

export type InsertFocusSession = z.infer<typeof insertFocusSessionSchema>;
export type FocusSession = typeof focusSessions.$inferSelect;

export type InsertReflection = z.infer<typeof insertReflectionSchema>;
export type Reflection = typeof reflections.$inferSelect;

export type InsertNote = z.infer<typeof insertNoteSchema>;
export type Note = typeof notes.$inferSelect;

export type InsertResource = z.infer<typeof insertResourceSchema>;
export type Resource = typeof resources.$inferSelect;

export type InsertSkill = z.infer<typeof insertSkillSchema>;
export type Skill = typeof skills.$inferSelect;

export type InsertReminder = z.infer<typeof insertReminderSchema>;
export type Reminder = typeof reminders.$inferSelect;

export type InsertPoll = z.infer<typeof insertPollSchema>;
export type Poll = typeof polls.$inferSelect;

export type InsertUserStats = z.infer<typeof insertUserStatsSchema>;
export type UserStats = typeof userStats.$inferSelect;

export type InsertQuizScore = z.infer<typeof insertQuizScoreSchema>;
export type QuizScore = typeof quizScores.$inferSelect;

export type InsertAiKnowledge = z.infer<typeof insertAiKnowledgeSchema>;
export type AiKnowledge = typeof aiKnowledge.$inferSelect;

export type InsertAiTrainingData = z.infer<typeof insertAiTrainingDataSchema>;
export type AiTrainingData = typeof aiTrainingData.$inferSelect;

export type InsertConversation = z.infer<typeof insertConversationSchema>;
export type Conversation = typeof conversations.$inferSelect;
