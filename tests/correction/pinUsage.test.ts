import { describe, it, expect } from 'vitest';
import { PinUsageAnalyzer } from '@/lib/correction/analyzers/pinUsageAnalyzer';

describe('PinUsageAnalyzer', () => {
  it('warns when digitalWrite used without pinMode', async () => {
    const code = `void loop() { digitalWrite(13, HIGH); }`;
    const issues = await PinUsageAnalyzer.analyze(code, {} as any);
    expect(issues.some((i) => i.id.startsWith('pinmode-missing-'))).toBe(true);
  });

  it('warns when analogRead used on pin configured as OUTPUT', async () => {
    const code = `void setup() { pinMode(0, OUTPUT); }
    void loop() { int v = analogRead(0); }`;
    const issues = await PinUsageAnalyzer.analyze(code, {} as any);
    expect(issues.some((i) => i.id.startsWith('analogread-on-output-'))).toBe(true);
  });
});
