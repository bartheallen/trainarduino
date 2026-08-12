import { describe, it, expect, beforeEach } from 'vitest';
import { defaultArduinoCorrectionEngine } from '@/lib/correction/engine';
import { SyntaxAnalyzer } from '@/lib/correction/analyzers/syntaxAnalyzer';
import { SetupLoopAnalyzer } from '@/lib/correction/analyzers/setupLoopAnalyzer';
import { PinUsageAnalyzer } from '@/lib/correction/analyzers/pinUsageAnalyzer';

describe('ArduinoCorrectionEngine', () => {
  beforeEach(() => {
    defaultArduinoCorrectionEngine.clearAnalyzers();
    defaultArduinoCorrectionEngine.registerAnalyzer(SyntaxAnalyzer);
    defaultArduinoCorrectionEngine.registerAnalyzer(SetupLoopAnalyzer);
    defaultArduinoCorrectionEngine.registerAnalyzer(PinUsageAnalyzer);
  });

  it('valid Arduino code yields no errors', async () => {
    const code = `void setup() { pinMode(13, OUTPUT); Serial.begin(9600); }
    void loop() { digitalWrite(13, HIGH); delay(1000); }`;
    const report = await defaultArduinoCorrectionEngine.analyze(code, {});
    expect(report.summary.errors).toBe(0);
  });

  it('detects missing setup', async () => {
    const code = `void loop() { digitalWrite(13, HIGH); }`;
    const report = await defaultArduinoCorrectionEngine.analyze(code, {});
    expect(report.issues.some((i) => i.id === 'missing-setup')).toBe(true);
  });

  it('detects missing loop', async () => {
    const code = `void setup() { pinMode(13, OUTPUT); }`;
    const report = await defaultArduinoCorrectionEngine.analyze(code, {});
    expect(report.issues.some((i) => i.id === 'missing-loop')).toBe(true);
  });

  it('detects missing pinMode before digitalWrite', async () => {
    const code = `void setup() { }
    void loop() { digitalWrite(13, HIGH); }`;
    const report = await defaultArduinoCorrectionEngine.analyze(code, {});
    expect(report.issues.some((i) => i.id.startsWith('pinmode-missing-'))).toBe(true);
  });

  it('detects unbalanced braces', async () => {
    const code = `void setup() { pinMode(13, OUTPUT); `; // missing }
    const report = await defaultArduinoCorrectionEngine.analyze(code, {});
    expect(report.issues.some((i) => i.id === 'syntax-unbalanced-braces')).toBe(true);
  });

  it('detects unbalanced parentheses', async () => {
    const code = `void setup( { pinMode(13, OUTPUT); }`;
    const report = await defaultArduinoCorrectionEngine.analyze(code, {});
    expect(report.issues.some((i) => i.id === 'syntax-unbalanced-parentheses')).toBe(true);
  });

  it('detects analogRead on OUTPUT pin', async () => {
    const code = `void setup() { pinMode(0, OUTPUT); }
    void loop() { int v = analogRead(0); }`;
    const report = await defaultArduinoCorrectionEngine.analyze(code, {});
    expect(report.issues.some((i) => i.id.startsWith('analogread-on-output-'))).toBe(true);
  });
});
