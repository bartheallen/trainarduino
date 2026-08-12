export interface PracticalCompletionEvaluation {
  status: 'in_progress' | 'completed';
  practicalTestCompleted: boolean;
  practicalTestPassed: boolean;
  canCompleteModule: boolean;
}

export function evaluatePracticalModuleCompletion({
  allLessonsCompleted: _allLessonsCompleted,
  practicalTestCompleted,
  practicalTestPassed,
}: {
  allLessonsCompleted: boolean;
  practicalTestCompleted: boolean;
  practicalTestPassed: boolean;
}): PracticalCompletionEvaluation {
  const canCompleteModule = practicalTestCompleted && practicalTestPassed;

  return {
    status: canCompleteModule ? 'completed' : 'in_progress',
    practicalTestCompleted,
    practicalTestPassed,
    canCompleteModule,
  };
}
