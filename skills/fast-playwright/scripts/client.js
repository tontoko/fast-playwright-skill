import fs from 'fs';
import path from 'path';
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const LOCK_FILE = path.join(__dirname, '../.server.lock');
const SERVER_SCRIPT = path.join(__dirname, 'server.js');

const args = process.argv.slice(2);

// Parse flags
const headed = args.includes('--headed');
const stopServer = args.includes('--stop');
const listSessions = args.includes('--sessions');

// Parse --session <id>
let sessionId = null;
const sessionIndex = args.indexOf('--session');
if (sessionIndex !== -1 && args[sessionIndex + 1]) {
  sessionId = args[sessionIndex + 1];
}

// Filter out flags and their values
const filteredArgs = args.filter((a, i) => {
  if (a.startsWith('--')) return false;
  if (i > 0 && args[i - 1] === '--session') return false;
  return true;
});

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// --- Server Management ---
async function ensureServer() {
  let port = null;

  if (fs.existsSync(LOCK_FILE)) {
    try {
      const data = JSON.parse(fs.readFileSync(LOCK_FILE, 'utf8'));
      try {
        process.kill(data.pid, 0);
        const healthCheck = await fetch(`http://127.0.0.1:${data.port}/health`).catch(() => null);
        if (healthCheck?.ok) {
          port = data.port;
        } else {
          fs.unlinkSync(LOCK_FILE);
        }
      } catch (e) {
        fs.unlinkSync(LOCK_FILE);
      }
    } catch (e) {
      try { fs.unlinkSync(LOCK_FILE); } catch (_) {}
    }
  }

  if (port) return port;

  const serverArgs = headed ? [SERVER_SCRIPT] : [SERVER_SCRIPT, '--headless'];
  const child = spawn(process.execPath, serverArgs, {
    detached: true,
    stdio: 'ignore',
    cwd: path.join(__dirname, '..')
  });

  child.unref();

  for (let i = 0; i < 100; i++) {
    await sleep(100);
    if (fs.existsSync(LOCK_FILE)) {
      try {
        const data = JSON.parse(fs.readFileSync(LOCK_FILE, 'utf8'));
        const healthCheck = await fetch(`http://127.0.0.1:${data.port}/health`).catch(() => null);
        if (healthCheck?.ok) {
          return data.port;
        }
      } catch (e) {}
    }
  }
  throw new Error('Timed out waiting for server');
}

// --- Command Handlers ---
async function handleStop() {
  if (fs.existsSync(LOCK_FILE)) {
    try {
      const data = JSON.parse(fs.readFileSync(LOCK_FILE, 'utf8'));
      process.kill(data.pid, 'SIGTERM');
      fs.unlinkSync(LOCK_FILE);
      console.log('Server stopped');
    } catch (e) {
      try { fs.unlinkSync(LOCK_FILE); } catch (_) {}
      console.log('Server was not running');
    }
  } else {
    console.log('Server was not running');
  }
}

async function handleListSessions() {
  const port = await ensureServer();
  const response = await fetch(`http://127.0.0.1:${port}/sessions`);
  const data = await response.json();

  if (data.sessions.length === 0) {
    console.log('No active sessions');
  } else {
    console.log('Active sessions:');
    for (const s of data.sessions) {
      console.log(`  - ${s.sessionId} (idle: ${s.idleSeconds}s)`);
    }
  }
}

async function handleToolCall(toolName, toolArgs) {
  const port = await ensureServer();

  const headers = { 'Content-Type': 'application/json' };
  if (sessionId) {
    headers['X-Session-Id'] = sessionId;
  }

  const response = await fetch(`http://127.0.0.1:${port}/call`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ name: toolName, arguments: toolArgs })
  });

  const result = await response.json();
  const returnedSessionId = response.headers.get('X-Session-Id');

  if (result.content) {
    for (const block of result.content) {
      if (block.type === 'text') {
        console.log(block.text);
      } else if (block.type === 'image') {
        console.log(`[Image: ${block.mimeType}]`);
      }
    }
  }

  if (returnedSessionId && returnedSessionId !== 'default') {
    console.log(`\n[Session: ${returnedSessionId}]`);
  }

  if (result.error) {
    console.error('Error:', result.error);
    process.exit(1);
  }
}

function showUsage() {
  console.error('Usage: node client.js [options] <tool_name> <json_args>');
  console.error('       node client.js --stop');
  console.error('       node client.js --sessions');
  console.error('Options:');
  console.error('  --headed          Run browser with visible window (default: headless)');
  console.error('  --session <id>    Use specific session ID for isolation');
  console.error('  --sessions        List active sessions');
  console.error('  --stop            Stop the running server');
  process.exit(1);
}

// --- Main ---
async function run() {
  try {
    if (stopServer) {
      await handleStop();
      return;
    }

    if (listSessions) {
      await handleListSessions();
      return;
    }

    if (filteredArgs.length < 2) {
      showUsage();
    }

    const toolName = filteredArgs[0];
    let toolArgs;
    try {
      toolArgs = JSON.parse(filteredArgs[1]);
    } catch (e) {
      console.error('Error: Arguments must be valid JSON');
      process.exit(1);
    }

    await handleToolCall(toolName, toolArgs);

  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

run();
