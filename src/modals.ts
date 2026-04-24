import { App, FuzzySuggestModal } from 'obsidian';
import type { FixtureFramework } from './fixtures/types';
import { FRAMEWORKS, FRAMEWORK_IDS } from './fixtures';

/**
 * Fuzzy-pick a framework from the registry. Used by pick-framework-* and
 * full-setup commands.
 */
export class FrameworkSuggestModal extends FuzzySuggestModal<FixtureFramework> {
  private readonly onPick: (framework: FixtureFramework) => void | Promise<void>;

  constructor(app: App, promptText: string, onPick: (framework: FixtureFramework) => void | Promise<void>) {
    super(app);
    this.setPlaceholder(promptText);
    this.onPick = onPick;
  }

  getItems(): FixtureFramework[] {
    return FRAMEWORK_IDS.map((id) => FRAMEWORKS[id]);
  }

  getItemText(f: FixtureFramework): string {
    return `${f.name} — ${f.description}`;
  }

  async onChooseItem(f: FixtureFramework): Promise<void> {
    await this.onPick(f);
  }
}
