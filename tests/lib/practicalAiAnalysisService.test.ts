import { describe, expect, it, vi } from 'vitest';
import { analyzePracticalCodeWithAi } from '@/lib/services/practicalAiAnalysisService';
import { validatePracticalExercise } from '@/lib/services/practicalValidationService';

const exercise = {
  titre: 'Blink an LED',
  enonce: 'Make an LED blink on pin 13.',
  critere_correction: 'Use pinMode, digitalWrite and delay.',
};

function geminiResponse(text: string) {
  return new Response(JSON.stringify({ candidates: [{ content: { parts: [{ text }] } }] }), { status: 200 });
}

describe('practical AI criteria contract', () => {
  it('recognizes const pin aliases and maps them to pin usage', async () => {
    process.env.GEMINI_API_KEY = 'test-key';
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(geminiResponse('{"criteria":{"pin_used":true,"pin_mode_configured":true,"digital_output_used":true,"delay_used":true}}')));
    const analysis = await analyzePracticalCodeWithAi('const int led = 13; pinMode(led, OUTPUT);', exercise);
    expect(analysis?.criteria.pin_used).toBe(true);
    const result = validatePracticalExercise('const int led = 13; void setup(){pinMode(led, OUTPUT);} void loop(){digitalWrite(led,HIGH);delay(1000);}', exercise as never, analysis?.criteria);
    expect(result.criteriaPassed).toContain('broche utilisée dans le code');
    vi.unstubAllGlobals();
  });

  it('recognizes macro pin aliases', async () => {
    process.env.GEMINI_API_KEY = 'test-key';
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(geminiResponse('{"criteria":{"pin_used":true}}')));
    const analysis = await analyzePracticalCodeWithAi('#define LED_PIN 13\ndigitalWrite(LED_PIN,HIGH);', exercise);
    expect(analysis?.criteria.pin_used).toBe(true);
    vi.unstubAllGlobals();
  });

  it('fails safely for invalid or absent AI responses', async () => {
    process.env.GEMINI_API_KEY = 'test-key';
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(geminiResponse('not json')));
    expect(await analyzePracticalCodeWithAi('digitalWrite(LED_PIN,HIGH);', exercise)).toBeNull();
    const result = validatePracticalExercise('void setup(){} void loop(){digitalWrite(LED_PIN,HIGH);}', exercise as never, null);
    expect(result.criteriaFailed).toContain('broche utilisée dans le code');
    vi.unstubAllGlobals();
  });
});