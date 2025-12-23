# Fast Playwright Skill

A Claude Code skill for fast, persistent, and token-optimized browser automation using Playwright.

## Features

- **Persistent Browser Sessions** - Browser state maintained across calls
- **Multi-Agent Session Isolation** - Each agent gets its own isolated browser context
- **Token Optimization** - Control response size with `expectation` options
- **Headed/Headless Modes** - Switch between visible and headless browser
- **26 Browser Tools** - Navigation, clicking, typing, screenshots, batch execution, and more

## Installation

### As a Claude Code Plugin

```bash
# Add the marketplace
/plugin marketplace add tontoko/fast-playwright-skill

# Install the plugin
/plugin install fast-playwright@fast-playwright-skill
```

### Manual Installation

```bash
# Clone the repository
git clone https://github.com/tontoko/fast-playwright-skill.git ~/.claude/skills/fast-playwright

# Install dependencies
cd ~/.claude/skills/fast-playwright
node scripts/install.js
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

## License

MIT
