import type { Analyzer, Issue } from '@/lib/correction/types';

// Very small static analyzer: warn if digitalWrite/analogWrite used without apparent pinMode
export const PinUsageAnalyzer: Analyzer = {
  name: 'pin-usage',
  async analyze(code: string) {
    const issues: Issue[] = [];


    // find numeric pin usages e.g. digitalWrite(13, HIGH)
    const digitalWrites = Array.from(code.matchAll(/digitalWrite\s*\(\s*(\d+)\s*,/g)).map((m) => Number(m[1]));
    // capture pinMode with mode
    const pinModeMatches = Array.from(code.matchAll(/pinMode\s*\(\s*(\d+)\s*,\s*(INPUT|OUTPUT|INPUT_PULLUP)\s*\)/gi));
    const pinModeMap = new Map<number, string>();
    for (const m of pinModeMatches) {
      pinModeMap.set(Number(m[1]), (m[2] || '').toUpperCase());
    }

    for (const p of digitalWrites) {
      if (!pinModeMap.has(p)) {
        issues.push({
          id: `pinmode-missing-${p}`,
          category: 'electronics',
          severity: 'warning',
          line: null,
          message: `Use of digitalWrite on pin ${p} without an obvious pinMode(${p}, ...) call.`,
          correction: `Ensure you call pinMode(${p}, OUTPUT) in setup() before using digitalWrite(${p}, value).`,
          example: `void setup() { pinMode(${p}, OUTPUT); }`,
          documentationUrl: 'https://www.arduino.cc/reference/en/language/functions/digital-io/pinmode/',
        });
      }
    }

    // analogRead used on pin configured as OUTPUT is likely incorrect
    const analogReads = Array.from(code.matchAll(/analogRead\s*\(\s*(\d+)\s*\)/g)).map((m) => Number(m[1]));
    for (const p of analogReads) {
      const mode = pinModeMap.get(p);
      if (mode === 'OUTPUT') {
        issues.push({
          id: `analogread-on-output-${p}`,
          category: 'electronics',
          severity: 'warning',
          line: null,
          message: `Call to analogRead(${p}) while pin ${p} is configured as OUTPUT.`,
          correction: `Use analogRead on an INPUT pin or remove pinMode(${p}, OUTPUT).`,
          example: `pinMode(${p}, INPUT); int v = analogRead(${p});`,
          documentationUrl: 'https://www.arduino.cc/reference/en/language/functions/analog-io/analogread/',
        });
      }
    }

    return issues;
  },
};
