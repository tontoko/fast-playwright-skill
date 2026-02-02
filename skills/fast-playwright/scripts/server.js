import { createConnection } from '@tontoko/fast-playwright-mcp';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import express from 'express';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const LOCK_FILE = path.join(__dirname, '../.server.lock');
const SERVER_IDLE_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes
const SESSION_IDLE_TIMEOUT_MS = 15 * 60 * 1000; // 15 minutes per session

// --- Session Management ---
const sessions = new Map(); // sessionId -> { client, server, transports, lastActivity, timer }

async function createSession(sessionId, headless) {
  // Each session gets its own user data directory for isolation
  const userDataDir = path.join(__dirname, '..', '.browser-data', sessionId);
  fs.mkdirSync(userDataDir, { recursive: true });

  const server = await createConnection({
    browser: {
      browserName: 'chromium',
      userDataDir,
      launchOptions: { headless }
    }
  });

  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
  await server.connect(serverTransport);

  const client = new Client(
    { name: 'fast-playwright-skill', version: '1.0.0' },
    { capabilities: {} }
  );
  await client.connect(clientTransport);

  const session = {
    client,
    server,
    transports: [clientTransport, serverTransport],
    lastActivity: Date.now(),
    timer: null
  };

  resetSessionTimer(sessionId, session);
  sessions.set(sessionId, session);

  return session;
}

function resetSessionTimer(sessionId, session) {
  if (session.timer) clearTimeout(session.timer);
  session.lastActivity = Date.now();
  session.timer = setTimeout(() => {
    cleanupSession(sessionId);
  }, SESSION_IDLE_TIMEOUT_MS);
}

async function cleanupSession(sessionId) {
  const session = sessions.get(sessionId);
  if (!session) return;

  if (session.timer) clearTimeout(session.timer);

  try {
    await session.transports[0].close();
  } catch (e) {}

  sessions.delete(sessionId);
}

async function getOrCreateSession(sessionId, headless) {
  let session = sessions.get(sessionId);
  if (session) {
    resetSessionTimer(sessionId, session);
    return session;
  }
  return createSession(sessionId, headless);
}

// --- Server Lifecycle ---
let serverIdleTimer;

function resetServerIdleTimer() {
  if (serverIdleTimer) clearTimeout(serverIdleTimer);
  serverIdleTimer = setTimeout(() => {
    cleanupAndExit();
  }, SERVER_IDLE_TIMEOUT_MS);
}

async function cleanupAndExit() {
  for (const [sessionId] of sessions) {
    await cleanupSession(sessionId);
  }
  try {
    if (fs.existsSync(LOCK_FILE)) {
      fs.unlinkSync(LOCK_FILE);
    }
  } catch (e) {}
  process.exit(0);
}

process.on('SIGINT', cleanupAndExit);
process.on('SIGTERM', cleanupAndExit);

// --- HTTP Server ---
async function startServer() {
  const app = express();
  app.use(express.json());

  app.use((req, res, next) => {
    resetServerIdleTimer();
    next();
  });

  const headless = process.argv.includes('--headless');

  // List available tools (uses a temporary session)
  app.get('/tools', async (req, res) => {
    try {
      const tempId = '__tools_temp__';
      const session = await getOrCreateSession(tempId, headless);
      const result = await session.client.listTools();
      res.json({ tools: result.tools });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // List active sessions
  app.get('/sessions', (req, res) => {
    const list = [];
    for (const [id, session] of sessions) {
      if (id === '__tools_temp__') continue;
      list.push({
        sessionId: id,
        lastActivity: session.lastActivity,
        idleSeconds: Math.floor((Date.now() - session.lastActivity) / 1000)
      });
    }
    res.json({ sessions: list });
  });

  // Delete a session
  app.delete('/sessions/:sessionId', async (req, res) => {
    const { sessionId } = req.params;
    if (sessions.has(sessionId)) {
      await cleanupSession(sessionId);
      res.json({ success: true, message: `Session ${sessionId} closed` });
    } else {
      res.status(404).json({ error: 'Session not found' });
    }
  });

  // Call a tool
  app.post('/call', async (req, res) => {
    const { name, arguments: args } = req.body;
    const sessionId = req.headers['x-session-id'] || 'default';

    if (!name) {
      return res.status(400).json({ error: 'Missing tool name' });
    }

    try {
      const session = await getOrCreateSession(sessionId, headless);
      const result = await session.client.callTool({ name, arguments: args || {} });

      res.set('X-Session-Id', sessionId);
      res.json(result);
    } catch (error) {
      res.status(500).json({
        content: [{ type: 'text', text: `Error: ${error.message}` }],
        isError: true
      });
    }
  });

  // Health check
  app.get('/health', (req, res) => {
    res.json({ status: 'ok', sessions: sessions.size });
  });

  const httpServer = app.listen(0, '127.0.0.1', () => {
    const port = httpServer.address().port;
    const lockData = JSON.stringify({ port, pid: process.pid });
    fs.writeFileSync(LOCK_FILE, lockData);
    resetServerIdleTimer();
  });
}

startServer().catch(err => {
  console.error(err);
  process.exit(1);
});
