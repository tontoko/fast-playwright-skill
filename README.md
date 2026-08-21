# Fast Playwright Skill

Agent Skill for [**@tontoko/fast-playwright-mcp**](https://github.com/tontoko/fast-playwright-mcp) 0.2+.

Compatible with [Agent Skills](https://agentskills.io) — Claude Code, Grok, Cursor, Codex CLI, Goose, and other supported agents.

This skill tells the agent to call the MCP tools first. The bundled `scripts/client.js` is only a fallback when MCP is not connected.

Do not use Microsoft `@playwright/mcp` with this skill. Tool names collide.

## Features

- **MCP 0.2 adaptive catalog** — seven startup tools, the rest on demand
- **Persistent browser sessions** — state kept across calls
- **Token optimization** — `expectation` / snapshot diffs
- **CLI fallback** — `client.js` when the agent has no MCP
- **Headed / headless** — visible or background browser

## MCP (preferred)

```bash
# Claude Code
claude mcp add playwright -- npx -y @tontoko/fast-playwright-mcp@latest

# Grok
grok mcp add playwright -- npx -y @tontoko/fast-playwright-mcp@latest
```

```json
{
  "mcpServers": {
    "playwright": {
      "command": "npx",
      "args": ["-y", "@tontoko/fast-playwright-mcp@latest"]
    }
  }
}
```

0.2 starts with `browser_tools`, `browser_query`, `browser_execute`, `browser_batch_execute`, `browser_navigate`, `browser_snapshot`, and `browser_find`. See [migration-0.2.md](https://github.com/tontoko/fast-playwright-mcp/blob/main/docs/migration-0.2.md).

## Skill install

### Claude Code (Plugin)

```bash
claude plugin marketplace add tontoko/fast-playwright-skill
claude plugin install fast-playwright@fast-playwright-skill
cd ~/.claude/plugins/cache/fast-playwright-skill/fast-playwright/1.1.0
npm install
```

### Manual (Claude / Cursor / Codex / Goose / Grok)

```bash
git clone https://github.com/tontoko/fast-playwright-skill.git ~/.agents/skills/fast-playwright
cd ~/.agents/skills/fast-playwright && npm install
```

Copy or symlink `skills/fast-playwright` into the agent's skills directory if the clone layout is the plugin repo (this repository). Flattened installs use the `skills/fast-playwright/` contents plus this root `package.json`.

## CLI fallback

From the skill directory (after `npm install`):

```bash
node scripts/client.js browser_navigate '{"url": "https://example.com"}'
node scripts/client.js --session agent-a browser_navigate '{"url": "https://example.com"}'
node scripts/client.js --headed browser_navigate '{"url": "https://example.com"}'
node scripts/client.js --sessions
node scripts/client.js --stop
```

| Option | Description |
|--------|-------------|
| `--session <id>` | Isolated browser context |
| `--headed` | Visible browser |
| `--sessions` | List sessions |
| `--stop` | Stop the wrapper |

Requires Node.js 20+. Server idle timeout 30 minutes; session idle timeout 15 minutes.

## Token optimization

```json
{
  "expectation": {
    "includeSnapshot": false,
    "diffOptions": { "enabled": true }
  }
}
```

## Tools

See [skills/fast-playwright/SKILL.md](skills/fast-playwright/SKILL.md).

## Related

- [fast-playwright-mcp](https://github.com/tontoko/fast-playwright-mcp)
- [Agent Skills Specification](https://agentskills.io/specification)

## License

MIT
