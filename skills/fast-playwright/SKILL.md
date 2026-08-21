---
name: fast-playwright
description: Fast, persistent, token-optimized browser automation via @tontoko/fast-playwright-mcp. Use when working with web pages, browser automation, clicking, typing, screenshots, or web scraping. Prefer this MCP over Microsoft @playwright/mcp and over desktop pixel clicks.
---

# Fast Playwright

Use **`@tontoko/fast-playwright-mcp` 0.2+**. This is the tontoko fork, not Microsoft `@playwright/mcp`.

Prefer native MCP tools. Fall back to this skill's `scripts/client.js` only when the MCP server is not connected.

## MCP first (0.2)

Install the server in the agent:

```bash
# Claude Code
claude mcp add playwright -- npx -y @tontoko/fast-playwright-mcp@latest

# Grok
grok mcp add playwright -- npx -y @tontoko/fast-playwright-mcp@latest
```

Standard MCP config:

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

Do not install Microsoft `@playwright/mcp` alongside this server. The tool names collide.

### Adaptive catalog

0.2 starts with seven tools:

| Tool | Role |
|------|------|
| `browser_tools` | Search, enable, disable, reset the catalog |
| `browser_query` | Dispatch read-only tools |
| `browser_execute` | Dispatch action / destructive tools |
| `browser_batch_execute` | Multi-step actions |
| `browser_navigate` | Open a URL |
| `browser_snapshot` | Accessibility snapshot |
| `browser_find` | Find elements |

Hidden registered tools stay directly callable by name. To surface one in the catalog: `browser_tools` with `action: "search"`, then enable it, or dispatch through `browser_query` / `browser_execute`.

`--tool-profile=full` restores the complete static catalog. `--tool-profile=minimal` leaves only the three gateways.

### How to call

1. Discover with the agent's MCP search (`search_tool` on Grok; the MCP tool list on Claude/Cursor).
2. Call `playwright__<tool>` (Grok) or `mcp__playwright__<tool>` (Claude) or the server's native name.
3. After navigate/click/type, snapshot (or a screenshot) before the next action.
4. Use `expectation` to cut tokens (`includeSnapshot: false`, `diffOptions.enabled: true`).

Do not drive a web page with desktop pixel clicks when this MCP is available.

Docs: https://github.com/tontoko/fast-playwright-mcp — especially `docs/migration-0.2.md`.

## CLI fallback (no MCP)

`scripts/client.js` sits next to `SKILL.md`. A flattened skill dir has `scripts/` at the top; a clone of this plugin repo has them under `skills/fast-playwright/`. Resolve that before calling node — the caller's cwd does not contain `scripts/`.

```bash
_fp_root="${FAST_PLAYWRIGHT_DIR:-$HOME/.agents/skills/fast-playwright}"
if [ -f "$_fp_root/skills/fast-playwright/scripts/client.js" ]; then
  FAST_PLAYWRIGHT_DIR="$_fp_root/skills/fast-playwright"
elif [ -f "$_fp_root/scripts/client.js" ]; then
  FAST_PLAYWRIGHT_DIR="$_fp_root"
else
  FAST_PLAYWRIGHT_DIR="$_fp_root"
fi
node "$FAST_PLAYWRIGHT_DIR/scripts/install.js"   # once
node "$FAST_PLAYWRIGHT_DIR/scripts/client.js" <tool_name> '<json_args>'
```

| Option | Description |
|--------|-------------|
| `--session <id>` | Isolated browser context |
| `--headed` | Visible browser (restart server to switch) |
| `--sessions` | List sessions |
| `--stop` | Stop the skill HTTP wrapper |

Sessions expire after 15 minutes idle. Restart after `--headed` / headless switch: `node scripts/client.js --stop`.

```bash
node scripts/client.js --session agent-a browser_navigate '{"url": "https://site-a.com"}'
node scripts/client.js --headed browser_navigate '{"url": "https://example.com"}'
```

## Token optimization

```json
{
  "expectation": {
    "includeSnapshot": false,
    "diffOptions": { "enabled": true }
  }
}
```

## CLI tool names

Same names as the MCP tools. Hidden 0.2 tools remain callable by these names through `client.js`.

### Navigation
```bash
node scripts/client.js browser_navigate '{"url": "https://example.com"}'
node scripts/client.js browser_navigate_back '{}'
node scripts/client.js browser_navigate_forward '{}'
```

### Interaction
```bash
node scripts/client.js browser_click '{"selectors": [{"css": "button.submit"}]}'
node scripts/client.js browser_type '{"selectors": [{"css": "#search"}], "text": "query"}'
node scripts/client.js browser_press_key '{"key": "Enter"}'
node scripts/client.js browser_hover '{"selectors": [{"css": ".menu-item"}]}'
node scripts/client.js browser_drag '{"startSelectors": [{"css": "#source"}], "endSelectors": [{"css": "#target"}]}'
node scripts/client.js browser_select_option '{"selectors": [{"css": "select#country"}], "values": ["US"]}'
node scripts/client.js browser_file_upload '{"paths": ["/path/to/file.pdf"]}'
node scripts/client.js browser_handle_dialog '{"accept": true}'
```

### Page state
```bash
node scripts/client.js browser_snapshot '{}'
node scripts/client.js browser_take_screenshot '{"filename": "page.png"}'
node scripts/client.js browser_evaluate '{"function": "() => document.title"}'
node scripts/client.js browser_console_messages '{}'
node scripts/client.js browser_network_requests '{}'
```

### Discovery
```bash
node scripts/client.js browser_find_elements '{"searchCriteria": {"text": "Submit"}}'
node scripts/client.js browser_inspect_html '{"selectors": [{"css": "main"}]}'
```

### Tabs and browser
```bash
node scripts/client.js browser_tab_list '{}'
node scripts/client.js browser_tab_new '{"url": "https://example.com"}'
node scripts/client.js browser_tab_select '{"index": 0}'
node scripts/client.js browser_tab_close '{}'
node scripts/client.js browser_resize '{"width": 1920, "height": 1080}'
node scripts/client.js browser_close '{}'
node scripts/client.js browser_install '{}'
```

### Wait, diagnose, batch
```bash
node scripts/client.js browser_wait_for '{"text": "Loading complete"}'
node scripts/client.js browser_wait_for '{"textGone": "Loading..."}'
node scripts/client.js browser_wait_for '{"time": 2}'
node scripts/client.js browser_diagnose '{}'
node scripts/client.js browser_batch_execute '{
  "steps": [
    {"tool": "browser_type", "arguments": {"selectors": [{"css": "#user"}], "text": "me"}},
    {"tool": "browser_click", "arguments": {"selectors": [{"css": "#login"}]}}
  ]
}'
```

## Selectors

- CSS: `{"css": "#id"}`
- Role: `{"role": "button", "text": "Submit"}`
- Text: `{"text": "Click me"}`
- Ref: `{"ref": "e3"}` from a previous snapshot

Fallbacks:

```json
{"selectors": [{"css": "#submit"}, {"role": "button", "text": "Submit"}]}
```
