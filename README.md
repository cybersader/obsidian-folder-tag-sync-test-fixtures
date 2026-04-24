<p align="center">
  <strong>Folder Tag Sync Test Fixtures</strong>
</p>

<p align="center">
  A reference-implementation plugin for <a href="https://github.com/cybersader/obsidian-folder-tag-sync">Folder Tag Sync</a>.
  Ships typed fixture frameworks and canonical rule presets so that every behavior of the main plugin can be
  exercised against a known, repeatable vault shape in one command.
</p>

---

## What it provides

Five **fixture frameworks**, each a bundle of files + rules sharing one organizational model:

| Framework | Axes exercised | Files | Rules |
|---|---|---|---|
| **PARA** | work | 10 | 4 identity rules |
| **Johnny Decimal** | work | 7 | 1 identity-with-numeric-prefix rule |
| **Zettelkasten** | capture, work, relation | 6 | 5 marker-only bucket rules |
| **SEACOW (JD-instantiated)** | system, entity, capture, output, work, relation | 13 | 6 rules across 4 transfer operations |
| **SEACOW (Cybersader + multi-entity)** | entity, work, relation | 9 | 2 entity rules + polyhierarchy + edge cases |

Each framework is a single TypeScript value — see `src/fixtures/{para,jd,zettelkasten,seacow-jd,seacow-cybersader}.ts`.

## The type system

Fixtures aren't just arrays of paths — every file declares **what its folder classifies** and every tag declares **what axis it participates in**. The vocabulary is lifted from cybersader/crosswalker's documented knowledge-organization prior art (not invented here):

- **`Axis`** (6 orthogonal SEACOW axes): `system | entity | capture | output | work | relation`
- **`FolderClassifier`**: `{ axes, scheme, naming, subdivisionDepth, siblingUniformity }` — scheme is one of `enumerative | hierarchical | faceted | authority-root | container-only`
- **`TagVocabulary`**: `{ axis, coordination, prefixMarker, authority }` — coordination is `pre-coordinated | post-coordinated | flat-keyword`
- **`HierarchyTransferRule`**: wraps a `FolderClassifier` + `TagVocabulary` with one of **eight transfer operations** (library-science primitives):
  - `identity` — preserve full depth
  - `truncation` — bounded specificity
  - `promotion-to-root` — broader-term collection
  - `flattening-to-leaf` — specific-term indexing
  - `post-coordination` — axis split into N flat tags
  - `aggregation` — compressed descriptor with separator
  - `marker-only` — flat controlled vocabulary
  - `opaque` — folder is clustering-only, no tag

Read `src/fixtures/types.ts` for the full annotations.

## Commands

**Pick-then-act** (fuzzy-suggest over the framework registry):

| Command | Effect |
|---|---|
| **Full setup: pick framework → apply rules + generate** | One command to drop the vault into a known shape |
| **Pick framework → generate fixtures** | Files only |
| **Pick framework → apply rules** | Rules only (backs up existing main-plugin data first) |

**Per-framework explicit commands** (all five frameworks also get direct commands):

- `Generate: <name>`
- `Apply rules: <name>`
- `Restore rules backup: <name>`

**Utility:**

- `Sync: re-run last framework` — idempotent resync of whatever you last generated
- `Restore last rules backup` — undo the most recent apply-rules
- `Clear all generated fixtures` — deletes everything under the configured root

## How sync works

Every generate/sync run is a **three-way diff** under the fixtures root:

- Files the framework expects that match byte-for-byte → skipped
- Files the framework expects that differ or are missing → written/updated
- Files under the root that the framework no longer expects → removed
- Empty folders under the root → pruned

Notice reports `{written, skipped, removed}` every time. Running `generate` twice in a row produces all-skipped output.

## Rule preset management

`Apply rules` writes the framework's rule set into the main Folder Tag Sync plugin's `data.json`, taking a per-framework backup first. `Restore rules backup` puts the previous rules back. The extra typed fields on each rule (`folder`, `tag`, `transfer`, etc.) round-trip through the main plugin as a nested `_typedModel` object — the main plugin ignores them today; Phase 2 will surface them in its settings UI.

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
bun run dev      # watch + auto-copy to folder-tag-sync-dev-vault/.obsidian/plugins/folder-tag-sync-test-fixtures/
bun run build    # production build
bun test         # unit + invariant tests (every framework + the pure diff function)
```

Opening `folder-tag-sync-dev-vault/` in Obsidian and enabling both plugins gives you the full feedback loop.

## Layout

```
src/
├── main.ts               # plugin entry; registers commands; diff-based sync
├── sync.ts               # pure diffFixtures(expected, actual) — unit-testable
├── modals.ts             # FrameworkSuggestModal (fuzzy-pick a framework)
├── fixtures.test.ts      # invariants + shape tests + diff tests
└── fixtures/
    ├── types.ts          # Axis, FolderClassifier, TagVocabulary, HierarchyTransferRule
    ├── index.ts          # FRAMEWORKS registry
    ├── para.ts
    ├── jd.ts
    ├── zettelkasten.ts
    ├── seacow-jd.ts
    └── seacow-cybersader.ts
```

## License

MIT
