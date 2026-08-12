import { describe, it, expect } from 'vitest';
import { LogicAnalyzer } from '@/lib/correction/analyzers/logicAnalyzer';
import { ElectronicsAnalyzer } from '@/lib/correction/analyzers/electronicsAnalyzer';
import { MemoryAnalyzer } from '@/lib/correction/analyzers/memoryAnalyzer';
import { PerformanceAnalyzer } from '@/lib/correction/analyzers/performanceAnalyzer';
import { StyleAnalyzer } from '@/lib/correction/analyzers/styleAnalyzer';

describe('LogicAnalyzer', () => {
  it('detects delay in loop', async () => {
    const code = `void loop() { delay(1000); }`;
    const issues = await LogicAnalyzer.analyze(code, {} as any);
    expect(issues.some((i) => i.id === 'logic-delay-in-loop')).toBe(true);
  });

  it('detects unused variables', async () => {
    const code = `void setup() { int unused; } void loop() {}`;
    const issues = await LogicAnalyzer.analyze(code, {} as any);
    expect(issues.some((i) => i.id.startsWith('logic-unused-variable-'))).toBe(true);
  });
});

describe('ElectronicsAnalyzer', () => {
  it('detects PWM on non-PWM pin', async () => {
    const code = `void setup() { analogWrite(4, 128); }`;
    const issues = await ElectronicsAnalyzer.analyze(code, {} as any);
    expect(issues.some((i) => i.id.startsWith('electronics-pwm-wrong-pin-'))).toBe(true);
  });

  it('detects serial pin usage for digitalWrite', async () => {
    const code = `void setup() { pinMode(0, OUTPUT); digitalWrite(0, HIGH); }`;
    const issues = await ElectronicsAnalyzer.analyze(code, {} as any);
    expect(issues.some((i) => i.id === 'electronics-serial-pin-0')).toBe(true);
  });
});

describe('MemoryAnalyzer', () => {
  it('detects String usage', async () => {
    const code = `String payload = "test"; void setup() {} void loop() {}`;
    const issues = await MemoryAnalyzer.analyze(code, {} as any);
    expect(issues.some((i) => i.id === 'memory-string-usage')).toBe(true);
  });

  it('detects large arrays', async () => {
    const code = `int buffer[5000]; void setup() {} void loop() {}`;
    const issues = await MemoryAnalyzer.analyze(code, {} as any);
    expect(issues.some((i) => i.id === 'memory-large-array')).toBe(true);
  });
});

describe('PerformanceAnalyzer', () => {
  it('detects delay usage in loop', async () => {
    const code = `void loop() { delay(2000); }`;
    const issues = await PerformanceAnalyzer.analyze(code, {} as any);
    expect(issues.some((i) => i.id === 'performance-delay-2000')).toBe(true);
  });

  it('detects Serial.print in loop', async () => {
    const code = `void loop() { Serial.print("hi"); }`;
    const issues = await PerformanceAnalyzer.analyze(code, {} as any);
    expect(issues.some((i) => i.id === 'performance-serial-print-loop')).toBe(true);
  });
});

describe('StyleAnalyzer', () => {
  it('detects magic numbers', async () => {
    const code = `void setup() { pinMode(13, OUTPUT); } void loop() { delay(500); }`;
    const issues = await StyleAnalyzer.analyze(code, {} as any);
    expect(issues.some((i) => i.id === 'style-magic-numbers')).toBe(true);
  });

  it('detects long functions', async () => {
    const code = `void helper() {\n${Array(30).fill('int x = 0;').join('\n')}\n} void loop() {}`;
    const issues = await StyleAnalyzer.analyze(code, {} as any);
    expect(issues.some((i) => i.id === 'style-long-function')).toBe(true);
  });
});
