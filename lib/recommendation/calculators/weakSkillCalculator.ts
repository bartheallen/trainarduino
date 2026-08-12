import { ScoreCalculator, ScoreContext, ScoreResult } from '../interfaces';

export const WeakSkillCalculator: ScoreCalculator = {
  key: 'weakSkill',
  calculate(context: ScoreContext): ScoreResult {
    // Placeholder: give small score if learningProfile shows weak skills overlapping candidate
    const candidateSkills = (context.candidate?.payload?.skills || []);
    const weak = context.learningProfile?.weak_concepts || [];
    const overlap = candidateSkills.filter((s: string) => weak.includes(s)).length;
    const score = overlap > 0 ? Math.min(50, overlap * 20) : 0;
    return { key: 'weakSkill', score, reason: overlap > 0 ? `Matches ${overlap} weak skills` : 'No weak skill match' };
  },
};
