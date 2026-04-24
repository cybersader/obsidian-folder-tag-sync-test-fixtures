<p align="center">
  <strong>Folder Tag Sync Test Fixtures</strong>
</p>

<p align="center">
  A testing-harness plugin for <a href="https://github.com/cybersader/obsidian-folder-tag-sync">Folder Tag Sync</a> development.
  Generates canonical fixture data sets so you can exercise rules, transformations, and polyhierarchy behavior
  without hand-building a vault every time.
</p>

---

## What it does

Exposes command-palette commands that:

| Command | What it writes |
|---|---|
| **Generate PARA fixture set** | A Projects / Areas / Resources / Archive tree with tagged files |
| **Generate polyhierarchy test set** | Files tagged with `#projects/*`, `#time/*`, AND `#topics/*` — so the same file matches all three Folder Tag Sync rules simultaneously |
| **Generate edge-case fixture set** | Emoji folders, number-prefix folders, deeply nested paths, special chars |
| **Generate all fixture sets** | Runs all three in sequence |
| **Clear all generated fixtures** | Deletes everything under the `fixtures/` root |
| **Apply preset Folder Tag Sync rules** | Writes a canonical rule set (Projects / Time / Topics, priorities 10/20/30) into the main plugin's `data.json` |

All generated files sit under a single root folder (`fixtures/` by default, configurable in settings), so "clear all" is safe.

## Installation

### Via BRAT (recommended for beta use)

1. Install the [BRAT](https://github.com/TfTHacker/obsidian42-brat) community plugin
2. Add beta plugin: `cybersader/obsidian-folder-tag-sync-test-fixtures`
3. Enable in Settings → Community plugins

### Manual

1. Download `main.js` and `manifest.json` from the latest release
2. Create `.obsidian/plugins/folder-tag-sync-test-fixtures/` in your vault
3. Place both files there
4. Enable the plugin

## Development

```bash
bun install
bun run dev     # watch; auto-copies to ../folder-tag-sync-dev-vault/.obsidian/plugins/folder-tag-sync-test-fixtures/
bun run build   # production
```

The esbuild config copies every build into the shared dev vault automatically. Open that vault in Obsidian, enable both plugins, iterate.

## License

MIT
