import { describe, it, expect } from 'vitest';
import { SyntaxAnalyzer } from '@/lib/correction/analyzers/syntaxAnalyzer';

describe('SyntaxAnalyzer', () => {
  it('no issues on balanced code', async () => {
    const code = `void setup() { }
    void loop() { int x = 0; }`;
    const issues = await SyntaxAnalyzer.analyze(code, {} as any);
    expect(issues.length).toBe(0);
  });

  it('flags unbalanced braces', async () => {
    const code = `void setup() { `;
    const issues = await SyntaxAnalyzer.analyze(code, {} as any);
    expect(issues.some((i) => i.id === 'syntax-unbalanced-braces')).toBe(true);
  });

  it('flags unbalanced parentheses', async () => {
    const code = `digitalWrite(13, HIGH;`;
    const issues = await SyntaxAnalyzer.analyze(code, {} as any);
    expect(issues.some((i) => i.id === 'syntax-unbalanced-parentheses')).toBe(true);
  });
});
