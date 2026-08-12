import type { Analyzer, Issue } from '@/lib/correction/types';

export const SetupLoopAnalyzer: Analyzer = {
  name: 'setup-loop-check',
  async analyze(code: string): Promise<Issue[]> {
    const issues: Issue[] = [];

    const hasSetup = /void\s+setup\s*\(/.test(code);
    const hasLoop = /void\s+loop\s*\(/.test(code);

    if (!hasSetup) {
      issues.push({
        id: 'missing-setup',
        category: 'logic',
        severity: 'error',
        line: null,
        message: 'Missing `setup()` function.',
        correction: 'Add a `void setup() { /* initialisation */ }` function to initialise pins and libraries.',
        example: 'void setup() { Serial.begin(9600); pinMode(13, OUTPUT); }',
        documentationUrl: 'https://www.arduino.cc/reference/en/language/structure/setup/',
      });
    }

    if (!hasLoop) {
      issues.push({
        id: 'missing-loop',
        category: 'logic',
        severity: 'error',
        line: null,
        message: 'Missing `loop()` function.',
        correction: 'Add a `void loop() { }` function containing the repeated logic.',
        example: 'void loop() { digitalWrite(13, HIGH); delay(1000); }',
        documentationUrl: 'https://www.arduino.cc/reference/en/language/structure/loop/',
      });
    }

    return issues;
  },
};
