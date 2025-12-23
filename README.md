# Fast Playwright Skill

A cross-platform Agent Skill for fast, persistent, and token-optimized browser automation using Playwright.

Compatible with [Agent Skills](https://agentskills.io) specification - works with Claude Code, Cursor, Codex CLI, Goose, and other supported agents.

## Features

- **Persistent Browser Sessions** - Browser state maintained across calls
- **Multi-Agent Session Isolation** - Each agent gets its own isolated browser context
- **Token Optimization** - Control response size with `expectation` options
- **Headed/Headless Modes** - Switch between visible and headless browser
- **26 Browser Tools** - Navigation, clicking, typing, screenshots, batch execution, and more

## Installation

### Claude Code (Plugin)

```bash
# Add marketplace and install
claude plugin marketplace add tontoko/fast-playwright-skill
claude plugin install fast-playwright@fast-playwright-skill

# Install dependencies (auto-runs via postinstall, or manually)
cd ~/.claude/plugins/cache/fast-playwright-skill/fast-playwright/1.0.0
npm install
```

### Claude Code (Manual)

```bash
git clone https://github.com/tontoko/fast-playwright-skill.git ~/.claude/skills/fast-playwright
cd ~/.claude/skills/fast-playwright && npm install
```

### Cursor

```bash
git clone https://github.com/tontoko/fast-playwright-skill.git ~/.cursor/skills/fast-playwright
cd ~/.cursor/skills/fast-playwright && npm install
```

### Codex CLI (OpenAI)

```bash
git clone https://github.com/tontoko/fast-playwright-skill.git ~/.codex/skills/fast-playwright
cd ~/.codex/skills/fast-playwright && npm install
```

### Goose

```bash
git clone https://github.com/tontoko/fast-playwright-skill.git ~/.goose/skills/fast-playwright
cd ~/.goose/skills/fast-playwright && npm install
```

### Other Agents

For any agent supporting [Agent Skills](https://agentskills.io):

```bash
git clone https://github.com/tontoko/fast-playwright-skill.git <agent-skills-directory>/fast-playwright
cd <agent-skills-directory>/fast-playwright && npm install
```

## Usage

```bash
# Basic navigation
node scripts/client.js browser_navigate '{"url": "https://example.com"}'

# With session isolation (for multi-agent)
node scripts/client.js --session agent-a browser_navigate '{"url": "https://example.com"}'

# Headed mode (visible browser)
node scripts/client.js --headed browser_navigate '{"url": "https://example.com"}'

# List active sessions
node scripts/client.js --sessions

# Stop the server
node scripts/client.js --stop
```

## Options

| Option | Description |
|--------|-------------|
| `--session <id>` | Use isolated browser session |
| `--headed` | Show browser window |
| `--sessions` | List active sessions |
| `--stop` | Stop the server |

## Token Optimization

Control response size with the `expectation` parameter:

```json
{
  "expectation": {
    "includeSnapshot": false,
    "diffOptions": { "enabled": true }
  }
}
```

## Architecture

```
Agent A ──┐                              ┌─► BrowserContext A
          │  X-Session-Id: agent-a       │
          ├─────────────────────────────►├─► Page A
          │                              │
Agent B ──┤  X-Session-Id: agent-b       ├─► BrowserContext B
          │                              │
          └─────────────────────────────►└─► Page B
```

- Server idle timeout: 30 minutes
- Session idle timeout: 15 minutes

## Available Tools

See [SKILL.md](SKILL.md) for the complete tools reference.

## Related

- [fast-playwright-mcp](https://github.com/tontoko/fast-playwright-mcp) - The underlying MCP server
- [Agent Skills Specification](https://agentskills.io/specification) - The open standard

## License

MIT
