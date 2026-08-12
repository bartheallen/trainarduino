import { describe, it, expect } from 'vitest';
import { SetupLoopAnalyzer } from '@/lib/correction/analyzers/setupLoopAnalyzer';

describe('SetupLoopAnalyzer', () => {
  it('detects missing setup', async () => {
    const code = `void loop() {}`;
    const issues = await SetupLoopAnalyzer.analyze(code, {} as any);
    expect(issues.some((i) => i.id === 'missing-setup')).toBe(true);
  });

  it('detects missing loop', async () => {
    const code = `void setup() {}`;
    const issues = await SetupLoopAnalyzer.analyze(code, {} as any);
    expect(issues.some((i) => i.id === 'missing-loop')).toBe(true);
  });
});
