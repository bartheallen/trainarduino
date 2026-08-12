import type { Analyzer, Issue } from '@/lib/correction/types';

const UNO_PWM_PINS = new Set([3, 5, 6, 9, 10, 11]);
const SERIAL_PINS = new Set([0, 1]);

function extractPins(code: string, regex: RegExp) {
  return Array.from(code.matchAll(regex)).map((m) => Number(m[1]));
}

export const ElectronicsAnalyzer: Analyzer = {
  name: 'electronics-analyzer',
  async analyze(code: string): Promise<Issue[]> {
    const issues: Issue[] = [];
    const pinModePins = extractPins(code, /pinMode\s*\(\s*(\d+)\s*,/g);
    const digitalWritePins = extractPins(code, /digitalWrite\s*\(\s*(\d+)\s*,/g);
    const analogWritePins = extractPins(code, /analogWrite\s*\(\s*(\d+)\s*,/g);

    const pinCounts = pinModePins.reduce<Record<number, number>>((acc, pin) => {
      acc[pin] = (acc[pin] || 0) + 1;
      return acc;
    }, {});
    for (const pin of Object.keys(pinCounts).map(Number)) {
      if (pinCounts[pin] > 1) {
        issues.push({
          id: `electronics-pin-duplicated-${pin}`,
          category: 'electronics',
          severity: 'warning',
          line: null,
          message: `Pin ${pin} configurée plusieurs fois avec pinMode().`,
          correction: 'Vérifiez que le pin est configuré une seule fois avec le bon mode.',
          example: `pinMode(${pin}, OUTPUT); // une seule fois dans setup()`,
          documentationUrl: null,
        });
      }
    }

    analogWritePins.forEach((pin) => {
      if (!UNO_PWM_PINS.has(pin)) {
        issues.push({
          id: `electronics-pwm-wrong-pin-${pin}`,
          category: 'electronics',
          severity: 'warning',
          line: null,
          message: `analogWrite utilisé sur une broche non PWM (${pin}) sur Arduino UNO.`,
          correction: 'Utilisez une broche PWM valide comme 3, 5, 6, 9, 10 ou 11.',
          example: 'analogWrite(3, 128);',
          documentationUrl: 'https://www.arduino.cc/reference/en/language/functions/analog-io/analogwrite/',
        });
      }
    });

    digitalWritePins.forEach((pin) => {
      if (SERIAL_PINS.has(pin)) {
        issues.push({
          id: `electronics-serial-pin-${pin}`,
          category: 'electronics',
          severity: 'warning',
          line: null,
          message: `digitalWrite sur la broche série ${pin}, ce qui peut interférer avec la communication UART.`,
          correction: 'Évitez d’utiliser les broches 0 et 1 pour des sorties digitales si vous utilisez la communication série.',
          example: 'Utilisez une broche comme 2 ou 13 pour une LED.',
          documentationUrl: null,
        });
      }
    });

    if (/\bServo\b/.test(code) && !/attach\s*\(/.test(code)) {
      issues.push({
        id: 'electronics-servo-attach-missing',
        category: 'electronics',
        severity: 'warning',
        line: null,
        message: 'Servo détecté sans appel évident à attach().',
        correction: 'Appelez attach(pin) dans setup() pour initialiser le servo.',
        example: 'servo.attach(9);',
        documentationUrl: null,
      });
    }

    if (/\b(TWBR|Wire\.begin)\b/.test(code) && /\b(analogRead|digitalRead)\b/.test(code)) {
      issues.push({
        id: 'electronics-i2c-conflit',
        category: 'electronics',
        severity: 'info',
        line: null,
        message: 'I2C détecté ; vérifiez l’usage de A4/A5 pour éviter les conflits de broche.',
        correction: 'Assurez-vous qu’aucune autre fonctionnalité n’utilise les broches A4/A5.',
        example: 'Wire.begin(); // utilisez A4/A5 pour SDA/SCL',
        documentationUrl: null,
      });
    }

    if (/\bpinMode\s*\(\s*13\s*,\s*INPUT_PULLUP\s*\)/.test(code) && /\bdigitalWrite\s*\(\s*13\s*,\s*HIGH\s*\)/.test(code)) {
      issues.push({
        id: 'electronics-input-pullup-high',
        category: 'electronics',
        severity: 'warning',
        line: null,
        message: 'Utilisation d’INPUT_PULLUP avec digitalWrite(HIGH), ce qui peut être trompeur.',
        correction: 'N’utilisez pas digitalWrite(HIGH) sur une pin configurée en INPUT_PULLUP.',
        example: 'pinMode(13, INPUT_PULLUP);',
        documentationUrl: null,
      });
    }

    return issues;
  },
};
