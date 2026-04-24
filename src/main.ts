import { Notice, Plugin, TFile, TFolder } from 'obsidian';
import type {
  FixtureFile,
  FixtureFramework,
  FrameworkId,
} from './fixtures/types';
import { FRAMEWORKS, FRAMEWORK_IDS, getFramework } from './fixtures';
import { diffFixtures, type DiffResult } from './sync';
import { FrameworkSuggestModal } from './modals';

/**
 * Folder Tag Sync — Test Fixtures
 *
 * Provides idempotent sync of canonical fixture data sets into the vault,
 * matched with canonical rule presets for the main Folder Tag Sync plugin.
 * Multiple frameworks (PARA, JD, Zettelkasten, SEACOW-JD, SEACOW-Cybersader)
 * are selectable; each is a FixtureFramework in src/fixtures/.
 *
 * Every fixture file declares its FolderClassifier, and every tag its
 * TagVocabulary — the plugin embodies the typed folder↔tag model so that
 * later phases (rule-pack loader in the main plugin, taxonomy detection,
 * wildcard patterns) have a complete reference implementation to build on.
 */

interface FixturesSettings {
  rootFolder: string;
  _ruleBackups?: Record<FrameworkId, { savedAt: number; data: unknown } | undefined>;
  _lastAppliedFramework?: FrameworkId;
}

const DEFAULT_SETTINGS: FixturesSettings = {
  rootFolder: 'fixtures',
};

const MAIN_PLUGIN_ID = 'folder-tag-sync';

// ─── Fixture-file rendering ───────────────────────────────────────────────

function makeFileBody(file: FixtureFile): string {
  const tagList = file.tags.map((t) => `  - ${t.name}`).join('\n');
  const frontmatter = [
    '---',
    `tags:${file.tags.length ? '\n' + tagList : ' []'}`,
    `generated_by: folder-tag-sync-test-fixtures`,
    `folder_scheme: ${file.folder.scheme}`,
    `folder_axes: ${JSON.stringify(file.folder.axes)}`,
    '---',
    '',
    file.note ?? 'Generated fixture content.',
    '',
  ].join('\n');
  return frontmatter;
}

// ─── Plugin ───────────────────────────────────────────────────────────────

export default class FolderTagSyncFixturesPlugin extends Plugin {
  settings!: FixturesSettings;

  async onload() {
    await this.loadSettings();

    // Per-framework commands: generate-<id>, apply-rules-<id>, restore-rules-<id>
    for (const id of FRAMEWORK_IDS) {
      const framework = FRAMEWORKS[id];
      this.addCommand({
        id: `generate-${id}`,
        name: `Generate: ${framework.name}`,
        callback: () => this.syncFramework(id, true),
      });
      this.addCommand({
        id: `apply-rules-${id}`,
        name: `Apply rules: ${framework.name}`,
        callback: () => this.applyRulesFor(id),
      });
      this.addCommand({
        id: `restore-rules-${id}`,
        name: `Restore rules backup: ${framework.name}`,
        callback: () => this.restoreRulesFor(id),
      });
    }

    // Top-level commands
    this.addCommand({
      id: 'sync',
      name: 'Sync: re-run last framework',
      callback: () => this.syncLastOrPick(),
    });

    this.addCommand({
      id: 'full-setup',
      name: 'Full setup: pick framework → apply rules + generate',
      callback: () => this.openFrameworkPicker('Pick a framework to set up end-to-end…', async (f) => {
        await this.applyRulesFor(f.id);
        await this.syncFramework(f.id, true);
      }),
    });

    this.addCommand({
      id: 'pick-framework-generate',
      name: 'Pick framework → generate fixtures',
      callback: () => this.openFrameworkPicker('Pick a framework to generate fixtures for…', async (f) => {
        await this.syncFramework(f.id, true);
      }),
    });

    this.addCommand({
      id: 'pick-framework-apply-rules',
      name: 'Pick framework → apply rules',
      callback: () => this.openFrameworkPicker('Pick a framework whose rules to apply…', async (f) => {
        await this.applyRulesFor(f.id);
      }),
    });

    this.addCommand({
      id: 'restore-preset-rules',
      name: 'Restore last rules backup',
      callback: () => this.restoreLastBackup(),
    });

    this.addCommand({
      id: 'clear-fixtures',
      name: 'Clear all generated fixtures',
      callback: () => this.clearFixtures(),
    });

    console.log(`${MAIN_PLUGIN_ID}-test-fixtures loaded — ${FRAMEWORK_IDS.length} frameworks registered`);
  }

  async loadSettings() {
    this.settings = { ...DEFAULT_SETTINGS, ...(await this.loadData()) };
  }

  async saveSettings() {
    await this.saveData(this.settings);
  }

  // ─── Framework picker ──────────────────────────────────────────────────

  openFrameworkPicker(prompt: string, onPick: (f: FixtureFramework) => void | Promise<void>) {
    const modal = new FrameworkSuggestModal(this.app, prompt, onPick);
    modal.open();
  }

  // ─── Sync (diff-first write / update / remove) ─────────────────────────

  async syncFramework(id: FrameworkId, notify: boolean): Promise<DiffResult> {
    const framework = getFramework(id);
    const root = this.settings.rootFolder.replace(/\/$/, '');

    // Build expected map
    const expected = new Map<string, string>();
    for (const file of framework.files) {
      const fullPath = root ? `${root}/${file.path}` : file.path;
      expected.set(fullPath, makeFileBody(file));
    }

    // Build actual map (everything currently under root/)
    const actual = new Map<string, string>();
    const rootFolder = this.app.vault.getAbstractFileByPath(root);
    if (rootFolder instanceof TFolder) {
      for (const f of this.walkMarkdownFiles(rootFolder)) {
        actual.set(f.path, await this.app.vault.read(f));
      }
    }

    const diff = diffFixtures({ expected, actual });

    // Apply writes
    for (const w of diff.toWrite) {
      await this.ensureFolderForFile(w.path);
      const existing = this.app.vault.getAbstractFileByPath(w.path);
      if (existing instanceof TFile) {
        await this.app.vault.modify(existing, w.content);
      } else {
        await this.app.vault.create(w.path, w.content);
      }
    }

    // Apply removes
    for (const p of diff.toRemove) {
      const entry = this.app.vault.getAbstractFileByPath(p);
      if (entry instanceof TFile) {
        await this.app.vault.delete(entry);
      }
    }
    // Prune empty folders under root
    await this.pruneEmptyFolders(root);

    this.settings._lastAppliedFramework = id;
    await this.saveSettings();

    if (notify) {
      new Notice(
        `✓ ${framework.name}: ${diff.toWrite.length} written, ${diff.toSkip.length} skipped, ${diff.toRemove.length} removed`,
      );
    }
    return diff;
  }

  async syncLastOrPick() {
    const last = this.settings._lastAppliedFramework;
    if (last && FRAMEWORKS[last]) {
      await this.syncFramework(last, true);
    } else {
      this.openFrameworkPicker('No prior framework on record. Pick one to sync…', async (f) => {
        await this.syncFramework(f.id, true);
      });
    }
  }

  // ─── Vault helpers ─────────────────────────────────────────────────────

  *walkMarkdownFiles(folder: TFolder): Generator<TFile> {
    for (const child of folder.children) {
      if (child instanceof TFile && child.extension === 'md') {
        yield child;
      } else if (child instanceof TFolder) {
        yield* this.walkMarkdownFiles(child);
      }
    }
  }

  async ensureFolderForFile(filePath: string) {
    const parts = filePath.split('/');
    parts.pop();
    for (let i = 1; i <= parts.length; i += 1) {
      const folderPath = parts.slice(0, i).join('/');
      if (!folderPath) continue;
      const existing = this.app.vault.getAbstractFileByPath(folderPath);
      if (!existing) {
        await this.app.vault.createFolder(folderPath);
      }
    }
  }

  async pruneEmptyFolders(rootPath: string) {
    const root = this.app.vault.getAbstractFileByPath(rootPath);
    if (!(root instanceof TFolder)) return;
    // depth-first — delete empties bottom-up
    await this.pruneFolderRecursive(root);
  }

  async pruneFolderRecursive(folder: TFolder) {
    for (const child of [...folder.children]) {
      if (child instanceof TFolder) {
        await this.pruneFolderRecursive(child);
      }
    }
    if (folder.children.length === 0 && folder.path !== this.settings.rootFolder.replace(/\/$/, '')) {
      await this.app.vault.delete(folder);
    }
  }

  async clearFixtures() {
    const root = this.settings.rootFolder.replace(/\/$/, '');
    if (!root) {
      new Notice('⚠ fixtures rootFolder is empty — refusing to clear the whole vault');
      return;
    }

    const rootEntry = this.app.vault.getAbstractFileByPath(root);
    if (!rootEntry || !(rootEntry instanceof TFolder)) {
      new Notice(`No fixtures folder found at ${root}/`);
      return;
    }

    await this.app.vault.delete(rootEntry, true);
    new Notice(`✓ Cleared ${root}/`);
  }

  // ─── Rule preset management ────────────────────────────────────────────

  async applyRulesFor(id: FrameworkId) {
    const framework = getFramework(id);

    const ftsPlugin = this.getMainPlugin();
    if (!ftsPlugin) return;

    try {
      // Snapshot existing main-plugin data BEFORE we write
      const existing = await ftsPlugin.loadData();
      this.settings._ruleBackups = this.settings._ruleBackups ?? ({} as FixturesSettings['_ruleBackups']);
      this.settings._ruleBackups![id] = { savedAt: Date.now(), data: existing };
      this.settings._lastAppliedFramework = id;
      await this.saveSettings();

      // Install framework's rules. We preserve any non-rules fields in the
      // main plugin's existing data so settings like enableDebug, etc. survive.
      // Phase 2: the main plugin now understands typed fields natively — pass
      // `folder`, `tag`, `transfer`, etc. at the top level without wrapping.
      const merged = {
        ...((existing as Record<string, unknown>) ?? {}),
        rules: framework.rules,
      };
      await ftsPlugin.saveData(merged);

      new Notice(`✓ Applied ${framework.rules.length} rules for ${framework.name}`);
    } catch (err) {
      console.error('Failed to apply rules:', err);
      new Notice(`✗ Failed to apply rules: ${(err as Error).message}`);
    }
  }

  async restoreRulesFor(id: FrameworkId) {
    const backup = this.settings._ruleBackups?.[id];
    if (!backup) {
      new Notice(`No backup recorded for ${id}`);
      return;
    }
    const ftsPlugin = this.getMainPlugin();
    if (!ftsPlugin) return;

    try {
      await ftsPlugin.saveData(backup.data);
      new Notice(`✓ Restored main plugin data from backup taken ${new Date(backup.savedAt).toLocaleString()}`);
    } catch (err) {
      console.error('Failed to restore:', err);
      new Notice(`✗ Failed to restore: ${(err as Error).message}`);
    }
  }

  async restoreLastBackup() {
    const last = this.settings._lastAppliedFramework;
    if (!last) {
      new Notice('No prior apply-rules on record.');
      return;
    }
    await this.restoreRulesFor(last);
  }

  getMainPlugin() {
    const pluginsApi = (this.app as unknown as {
      plugins?: { plugins?: Record<string, Plugin & { loadData: () => Promise<unknown>; saveData: (d: unknown) => Promise<void> }> };
    }).plugins;
    if (!pluginsApi?.plugins) {
      new Notice('✗ Cannot access installed plugins API');
      return null;
    }
    const ftsPlugin = pluginsApi.plugins[MAIN_PLUGIN_ID];
    if (!ftsPlugin) {
      new Notice(`✗ Main plugin "${MAIN_PLUGIN_ID}" is not installed/enabled`);
      return null;
    }
    return ftsPlugin;
  }
}

// Phase 2: `stripTypedFieldsForMainPlugin` was removed. The main plugin's
// MappingRule now carries `folder`, `tag`, `transfer`, etc. natively (all
// optional) — we pass framework.rules through unchanged.
