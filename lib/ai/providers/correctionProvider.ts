import { defaultArduinoCorrectionEngine } from '@/lib/correction/engine';
import { SyntaxAnalyzer } from '@/lib/correction/analyzers/syntaxAnalyzer';
import { SetupLoopAnalyzer } from '@/lib/correction/analyzers/setupLoopAnalyzer';
import { PinUsageAnalyzer } from '@/lib/correction/analyzers/pinUsageAnalyzer';
import { LogicAnalyzer } from '@/lib/correction/analyzers/logicAnalyzer';
import { ElectronicsAnalyzer } from '@/lib/correction/analyzers/electronicsAnalyzer';
import { MemoryAnalyzer } from '@/lib/correction/analyzers/memoryAnalyzer';
import { PerformanceAnalyzer } from '@/lib/correction/analyzers/performanceAnalyzer';
import { StyleAnalyzer } from '@/lib/correction/analyzers/styleAnalyzer';
import { formatReportMarkdown } from '@/lib/correction/report';
import type { AIProvider, EvaluationContext, EvaluationResult, HintResult, ChatResponse } from '@/lib/ai/types';
import { buildPedagogicalReport } from '@/lib/pedagogy/PedagogicalEngine';

// Lightweight provider that leverages the static correction engine to produce structured feedback
export class CorrectionAIProvider implements AIProvider {
  name = 'correction-engine';
  priority = 10;

  constructor() {
    // register analyzers if not already registered
    defaultArduinoCorrectionEngine.registerAnalyzer(SyntaxAnalyzer);
    defaultArduinoCorrectionEngine.registerAnalyzer(SetupLoopAnalyzer);
    defaultArduinoCorrectionEngine.registerAnalyzer(PinUsageAnalyzer);
    defaultArduinoCorrectionEngine.registerAnalyzer(LogicAnalyzer);
    defaultArduinoCorrectionEngine.registerAnalyzer(ElectronicsAnalyzer);
    defaultArduinoCorrectionEngine.registerAnalyzer(MemoryAnalyzer);
    defaultArduinoCorrectionEngine.registerAnalyzer(PerformanceAnalyzer);
    defaultArduinoCorrectionEngine.registerAnalyzer(StyleAnalyzer);
  }

  async isAvailable() {
    return true;
  }

  async estimateCost() {
    return 0;
  }

  async evaluateCode(code: string, _exercise: any, context: EvaluationContext): Promise<EvaluationResult> {
    const report = await defaultArduinoCorrectionEngine.analyze(code, {
      userId: context.userId ?? null,
      exerciseId: null,
      submissionId: context.submissionId ?? null,
      language: context.language ?? 'arduino',
      memory: context.contextSummary ? { summary: context.contextSummary } : undefined,
    });

    const score = Math.max(0, 1 - report.summary.errors * 0.25 - report.summary.warnings * 0.05);
    const passed = report.summary.errors === 0;

    const suggestions = report.issues.map((i) => i.correction || i.message).slice(0, 5);

    const feedback = formatReportMarkdown(report);

    const commonMistakes = report.issues.map((i) => i.message).slice(0, 5);
    const nextSteps = passed ? ['Testez sur matériel réel', 'Améliorez la robustesse du code'] : ['Corrigez les erreurs signalées puis relancez'];

    const result: EvaluationResult = {
      score: Number(score.toFixed(2)),
      passed,
      feedback,
      suggestions,
      commonMistakes,
      nextSteps,
      providerName: this.name,
      estimatedCostCents: 0,
      modelName: 'correction-engine-v0.1',
      rawValidation: report,
    } as EvaluationResult;

    try {
      const pedagogical = await buildPedagogicalReport({ correction: report, context: { userId: context.userId ?? null, submissionId: context.submissionId ?? null } });
      result.pedagogicalReport = pedagogical;
    } catch (err) {
      // non-fatal
    }

    return result;
  }

  async generateHint(_exercise: any, _previousHints: string[] | null): Promise<HintResult> {
    return { hint: 'Vérifiez l’initialisation des pins dans setup().', reason: 'Initialisation manquante détectée.' } as HintResult;
  }

  async chat(message: string): Promise<ChatResponse> {
    // Minimal chat integration – this provider is not a conversational LLM
    return { reply: `Correction engine received: ${message}` } as ChatResponse;
  }
}
