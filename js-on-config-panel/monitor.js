import os from 'os';
import http from 'http';
import { exec } from 'child_process';

const WEBHOOK_URL = 'https://discord.com/api/webhooks/1314140979481284669/7mjJFLtGIFRyl8It6MfWZFREJZLvO01vMQvqvfznpqgbegQhxckp4loiyS5U_WEeWjdX';

// --- CONFIGURATION ---
const REPL_URL = `https://${process.env.REPL_SLUG}.${process.env.REPL_OWNER}.repl.co`;
const MAX_MEMORY_PERCENT = 88; // Target for "soft reset"

// --- SYSTEM STATE ---
let appLogs = [];
const originalLog = console.log;

// Intercept logs for Discord reporting
console.log = (...args) => {
    const msg = args.map(arg => typeof arg === 'object' ? JSON.stringify(arg) : arg).join(' ');
    if (!msg.includes('📡') && !msg.includes('🔍')) {
        appLogs.push(`[${new Date().toLocaleTimeString()}] ${msg}`);
    }
    originalLog(...args);
};

// --- FEATURE: SELF-RECOVERY & PROTECTION ---
async function selfHeal() {
    const usedMem = (1 - (os.freemem() / os.totalmem())) * 100;

    if (usedMem > MAX_MEMORY_PERCENT) {
        console.log(`🚨 MEMORY CRITICAL (${usedMem.toFixed(2)}%). Executing emergency cleanup...`);
        
        // Forced garbage collection hint (if node started with --expose-gc)
        if (global.gc) global.gc();

        await sendAlert("🛠️ SELF-HEALING TRIGGERED", `Memory reached ${usedMem.toFixed(2)}%. Clearing internal log buffers to prevent Replit termination.`, 15105570);
        appLogs = ["[SYSTEM] Memory cleared to prevent crash."];
    }
}

// --- FEATURE: INTERNAL UPTIME ROBOT ---
// Pings itself from within the network to maintain activity
function startInternalPinger() {
    setInterval(() => {
        http.get(REPL_URL, (res) => {
            // If the server returns a 5xx error, it means the main app is frozen
            if (res.statusCode >= 500) {
                sendAlert("💀 SERVER HANG DETECTED", `Internal ping returned ${res.statusCode}. Main system might be frozen.`, 15548997);
            }
        }).on('error', () => {
            originalLog("📡 Ping Failed: App may be in Recovery Mode.");
        });
    }, 150000); // Ping every 2.5 minutes
}

// --- DISCORD DISPATCHER ---
async function sendAlert(title, message, color) {
    const payload = {
        username: "FormatUI Guard",
        embeds: [{ title, description: `\`\`\`\n${message}\n\`\`\``, color, timestamp: new Date() }]
    };
    await fetch(WEBHOOK_URL, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) }).catch(() => {});
}

async function sendStatusReport() {
    const logs = appLogs.length > 0 ? appLogs.slice(-10).join('\n') : "Steady state maintained.";
    appLogs = []; // Flush buffer to keep RAM low

    const payload = {
        username: "FormatUI Guard",
        embeds: [{
            title: "🛡️ 24/7 Guard: Active",
            color: 3066993,
            fields: [
                { name: "CPU Load", value: os.loadavg()[0].toFixed(2), inline: true },
                { name: "RAM", value: `${((1 - (os.freemem() / os.totalmem())) * 100).toFixed(2)}%`, inline: true },
                { name: "Activity", value: `\`\`\`\n${logs}\n\`\`\`` }
            ],
            timestamp: new Date()
        }]
    };
    fetch(WEBHOOK_URL, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) }).catch(() => {});
}

// --- INITIALIZE ---
console.log("FormatUI systems are online and running"); 
startInternalPinger();
setInterval(selfHeal, 60000); // Check for memory leaks every minute
setInterval(sendStatusReport, 600000); // Status update every 10 minutes
