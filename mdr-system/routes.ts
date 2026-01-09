import { eq, desc } from "drizzle-orm";
import { searchHistory } from "../schema-endpoint/schema";
import { db, storage } from "./storage";
import type { Express } from "express";
import { type Server } from "http";
import { startDiscordBot } from "./bot";
import { selfTrainingAI } from "./bot/self-training-ai";
import { performWebSearch } from "./bot/search-engine";
import Stripe from "stripe";
import bodyParser from "body-parser";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2023-10-16" as any,
});

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  app.post("/api/stripe/webhook", bodyParser.raw({ type: "application/json" }), async (req, res) => {
    const sig = req.headers["stripe-signature"];
    let event;

    try {
      event = stripe.webhooks.constructEvent(
        req.body,
        sig!,
        process.env.STRIPE_WEBHOOK_SECRET || ""
      );
    } catch (err: any) {
      console.error(`Webhook Error: ${err.message}`);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      const userTag = session.metadata?.userTag;
      if (userTag) {
        console.log(`Activating Pro for tag: ${userTag}`);
        await storage.setUserPro(userTag, true);
      }
    }

    res.json({ received: true });
  });
  
  app.post("/api/stripe/create-checkout", async (req, res) => {
    try {
      const { userTag } = req.body;
      if (!userTag) {
        return res.status(400).json({ error: "User tag is required" });
      }

      const session = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        line_items: [
          {
            price_data: {
              currency: "usd",
              product_data: {
                name: "FormatUI Pro",
                description: `Subscription for ${userTag}`,
              },
              unit_amount: 500,
              recurring: {
                interval: "month",
              },
            },
            quantity: 1,
          },
        ],
        metadata: {
          userTag: userTag
        },
        mode: "subscription",
        success_url: `${req.headers.origin}/pro?success=true&tag=${encodeURIComponent(userTag)}`,
        cancel_url: `${req.headers.origin}/pro?canceled=true`,
      });
      res.json({ url: session.url });
    } catch (error: any) {
      console.error("Stripe error:", error);
      res.status(500).json({ error: error.message });
    }
  });
  app.post("/api/auth/register", async (req, res) => {
    try {
      res.setHeader('Content-Type', 'application/json');
      const { name, password, discordId, twoFactorSecret } = req.body;
      if (!name || !password) {
        return res.status(400).json({ error: "Missing name or password" });
      }
      
      // Check if user with this discordId already exists
      if (discordId) {
        const existingDiscord = await storage.getUserByDiscordId(discordId);
        if (existingDiscord) {
          return res.status(400).json({ error: "Discord ID already linked to an account" });
        }
      }

      const discriminator = Math.floor(1000 + Math.random() * 9000);
      const username = `${name}#${discriminator}`;
      
      const existing = await storage.getUserByUsername(username);
      if (existing) {
        return res.status(400).json({ error: "Username already exists, please try again" });
      }
      
      const user = await storage.createUser({ 
        username, 
        password, 
        discordId: discordId || null, 
        twoFactorSecret: twoFactorSecret || null,
        isPro: false
      });
      
      const { password: _, ...userWithoutPassword } = user;
      return res.json(userWithoutPassword);
    } catch (e) {
      console.error("Registration error:", e);
      return res.status(500).json({ error: "Registration failed" });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      res.setHeader('Content-Type', 'application/json');
      const { username, password, twoFactorCode } = req.body;
      if (!username || !password) {
        return res.status(400).json({ error: "Missing username or password" });
      }

      const user = await storage.getUserByUsername(username);
      
      if (!user || user.password !== password) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      if (user.twoFactorSecret) {
        if (!twoFactorCode) {
          return res.status(403).json({ error: "2FA_REQUIRED", mfa: true });
        }
        const speakeasy = require("speakeasy");
        const verified = speakeasy.totp.verify({
          secret: user.twoFactorSecret,
          encoding: 'base32',
          token: String(twoFactorCode).trim(),
          window: 2 // Allow slight time drift
        });
        if (!verified) {
          return res.status(401).json({ error: "Invalid 2FA code" });
        }
      }

      const { password: _, ...userWithoutPassword } = user;
      return res.json(userWithoutPassword);
    } catch (e) {
      console.error("Login route error:", e);
      return res.status(500).json({ error: "Login failed" });
    }
  });

  app.get("/api/history/search/all", async (req, res) => {
    try {
      const history = await db.select().from(searchHistory).orderBy(desc(searchHistory.createdAt));
      res.json({ history });
    } catch (error) {
      console.error("Fetch all history error:", error);
      res.status(500).json({ error: "Failed to fetch history" });
    }
  });

  app.post("/api/auth/2fa/generate", async (req, res) => {
    try {
      const speakeasy = require("speakeasy");
      const qrcode = require("qrcode");
      const secret = speakeasy.generateSecret({ 
        name: "FormatUI",
        issuer: "FormatUI Platform"
      });
      const qrCodeUrl = await qrcode.toDataURL(secret.otpauth_url);
      res.setHeader('Content-Type', 'application/json');
      return res.json({ 
        secret: secret.base32, 
        qrCode: qrCodeUrl,
        otpauth_url: secret.otpauth_url
      });
    } catch (e) {
      console.error("2FA generate error:", e);
      return res.status(500).json({ error: "Failed to generate 2FA secret" });
    }
  });

  app.post("/api/generate", async (req, res) => {
    try {
      const { prompt, options, userTag } = req.body;
      const { autoGenerate } = await import('./bot/generator-engine');
      
      if (userTag) {
        const user = await storage.getUserByUsername(userTag);
        if (!user?.isPro) {
          const today = new Date().toDateString();
          const count = await storage.getQuestionCountForDay(userTag, today);
          if (count >= 10) { // Limit for non-pro
            return res.status(403).json({ error: "Daily limit reached. Upgrade to Pro for unlimited AI." });
          }
        }
      }

      const result = await autoGenerate(prompt, options);
      
      if (userTag && userTag !== "guest") {
        await storage.createQuestionHistory({
          discordUserId: userTag,
          question: `[Generator] ${prompt}`,
          summary: `Generated ${options?.type || 'content'} for ${prompt}`,
          answer: result
        });
      }
      
      res.json({ result });
    } catch (e) {
      console.error("Generation API error:", e);
      res.status(500).json({ error: "Generation failed" });
    }
  });

  app.post("/api/auth/reset-request", async (req, res) => {
    try {
      const { email } = req.body;
      const user = await storage.getUserByEmail(email);
      if (!user) return res.status(404).json({ error: "User not found" });
      
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      res.json({ message: "Recovery code sent (simulated)", code });
    } catch (e) {
      res.status(500).json({ error: "Reset failed" });
    }
  });

  app.post("/api/auth/reset-confirm", async (req, res) => {
    try {
      const { email, newPassword } = req.body;
      const user = await storage.getUserByEmail(email);
      if (!user) return res.status(404).json({ error: "User not found" });
      
      await storage.updateUser(user.id, { password: newPassword });
      res.json({ message: "Password updated successfully" });
    } catch (e) {
      res.status(500).json({ error: "Reset failed" });
    }
  });

  app.post("/api/auth/link-email", async (req, res) => {
    try {
      const { username, email } = req.body;
      const user = await storage.getUserByUsername(username);
      if (!user) return res.status(404).json({ error: "User not found" });
      
      await storage.updateUser(user.id, { email });
      res.json({ message: "Email linked successfully" });
    } catch (e) {
      res.status(500).json({ error: "Linking failed" });
    }
  });

  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", bot: "running" });
  });

  app.get("/api/auth/status/:username", async (req, res) => {
    try {
      const user = await storage.getUserByUsername(req.params.username);
      res.json({ isPro: !!user?.isPro });
    } catch (e) {
      res.status(500).json({ error: "Failed to fetch status" });
    }
  });

  app.post("/api/search", async (req, res) => {
    try {
      const { query, userTag } = req.body;
      if (!query) {
        return res.status(400).json({ error: "Query required" });
      }

      let results = await performWebSearch(query);
      
      if (userTag) {
        const user = await storage.getUserByUsername(userTag);
        if (user?.isPro) {
          results = results.sort((a, b) => b.title.length - a.title.length); 
        } else {
          // Non-pro users get fewer results or slower search simulated
          results = results.slice(0, 3);
        }
      }

      res.json({ results: results.slice(0, 5) });
    } catch (error) {
      res.status(500).json({ error: "Search failed" });
    }
  });

  app.post("/api/ask", async (req, res) => {
    try {
      const { question, discordUserId, userTag } = req.body;
      if (!question) {
        return res.status(400).json({ error: "Question required" });
      }

      // Check Pro status for unlimited generations
      if (userTag) {
        const user = await storage.getUserByUsername(userTag);
        if (!user?.isPro) {
          // Check limits for non-pro users (simulated simple check)
          const today = new Date().toDateString();
          const count = await storage.getQuestionCountForDay(userTag, today);
          if (count >= 5) {
            return res.status(403).json({ error: "Daily limit reached. Upgrade to Pro for unlimited AI." });
          }
        }
      }

      const answer = await selfTrainingAI.processQuery(question);
      
      if (discordUserId) {
        const summary = `Q: ${question.substring(0, 100)}...`;
        await storage.createQuestionHistory({
          discordUserId,
          question,
          summary,
          answer
        });
      }
      
      res.json({ answer });
    } catch (error) {
      res.status(500).json({ error: "AI processing failed" });
    }
  });

  app.post("/api/search-with-history", async (req, res) => {
    try {
      const { query, discordUserId, userTag } = req.body;
      if (!query) {
        return res.status(400).json({ error: "Query required" });
      }
      
      let results = await performWebSearch(query);
      
      // Priority Search for Pro users
      if (userTag) {
        const user = await storage.getUserByUsername(userTag);
        if (user?.isPro) {
          // Priority sorting
          results = results.sort((a, b) => b.title.length - a.title.length);
        }
      }

      const summary = `Searched: "${query}" - Found ${results.length} results about ${query.split(' ')[0]}`;
      
      if (discordUserId) {
        await storage.createSearchHistory({
          discordUserId,
          query,
          summary,
          results: JSON.stringify(results.slice(0, 5))
        });
      }
      
      res.json({ results: results.slice(0, 5), summary });
    } catch (error) {
      res.status(500).json({ error: "Search failed" });
    }
  });

  app.get("/api/history/search/:discordUserId", async (req, res) => {
    try {
      const { discordUserId } = req.params;
      const history = await storage.getSearchHistory(discordUserId, 5);
      res.json({ history });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch history" });
    }
  });

  app.get("/api/history/questions/:discordUserId", async (req, res) => {
    try {
      const { discordUserId } = req.params;
      const history = await storage.getQuestionHistory(discordUserId, 5);
      res.json({ history });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch history" });
    }
  });

  app.get("/api/tasks/:userId/:guildId", async (req, res) => {
    const { userId, guildId } = req.params;
    const tasks = await storage.getTasks(userId, guildId);
    res.json(tasks);
  });

  app.post("/api/tasks", async (req, res) => {
    const task = await storage.createTask(req.body);
    res.json(task);
  });

  app.patch("/api/tasks/:id", async (req, res) => {
    const task = await storage.updateTask(req.params.id, req.body);
    if (!task) {
      return res.status(404).json({ error: "Task not found" });
    }
    res.json(task);
  });

  app.post("/api/tasks/:id", async (req, res) => {
    const task = await storage.updateTask(req.params.id, req.body);
    if (!task) {
      return res.status(404).json({ error: "Task not found" });
    }
    res.json(task);
  });

  app.get("/api/security/report/:id", async (req, res) => {
    try {
      const report = await storage.getSecurityReport(req.params.id);
      if (!report) return res.status(404).json({ error: "Report not found" });
      res.json(report);
    } catch (e) {
      res.status(500).json({ error: "Failed to fetch report" });
    }
  });

  app.post("/api/security/report", async (req, res) => {
    try {
      const report = await storage.createSecurityReport(req.body);
      res.json(report);
    } catch (e) {
      console.error("Create security report error:", e);
      res.status(500).json({ error: "Failed to create report" });
    }
  });

  app.delete("/api/tasks/:id", async (req, res) => {
    const deleted = await storage.deleteTask(req.params.id);
    res.json({ deleted });
  });

  startDiscordBot().catch(err => {
    console.error("Failed to start Discord bot:", err);
  });

  return httpServer;
}
