import type { Overview } from './types';
import fixture from './demo-overview.json';

export const DEMO_SNAPSHOT = 'Snapshot demo · 31 Okt 2026';
export const demoData = fixture as Overview;
export const freshDemo = (): Overview => JSON.parse(JSON.stringify(demoData)) as Overview;
