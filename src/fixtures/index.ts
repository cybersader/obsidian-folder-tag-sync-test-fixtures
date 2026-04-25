/**
 * Registry of all fixture frameworks.
 *
 * `FRAMEWORKS` is the single source of truth — tests iterate over it, the
 * fuzzy-suggest modal reads from it, command registration in main.ts loops
 * over it to emit per-framework commands.
 */

import type { FixtureFramework, FrameworkId } from './types';

import { PARA } from './para';
import { JD } from './jd';
import { ZETTELKASTEN } from './zettelkasten';
import { SEACOW_JD } from './seacow-jd';
import { SEACOW_CYBERSADER } from './seacow-cybersader';
import { FACETED_RESEARCH } from './faceted-research';
import { COMPRESSED_INDEX } from './compressed-index';
import { CONTAINER_CLUSTER } from './container-cluster';

export const FRAMEWORKS: Record<FrameworkId, FixtureFramework> = {
  para: PARA,
  jd: JD,
  zettelkasten: ZETTELKASTEN,
  'seacow-jd': SEACOW_JD,
  'seacow-cybersader': SEACOW_CYBERSADER,
  'faceted-research': FACETED_RESEARCH,
  'compressed-index': COMPRESSED_INDEX,
  'container-cluster': CONTAINER_CLUSTER,
};

export const FRAMEWORK_IDS: FrameworkId[] = Object.keys(FRAMEWORKS) as FrameworkId[];

export function getFramework(id: FrameworkId): FixtureFramework {
  return FRAMEWORKS[id];
}

export * from './types';
