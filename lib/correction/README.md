Arduino correction engine scaffold

Structure:
- `types.ts`: shared types and interfaces used by analyzers and engine
- `engine.ts`: orchestrator that runs registered analyzers and emits a `CorrectionReport`
- `analyzers/`: modular analyzers (syntax, setup/loop, pin usage...) 
- `report.ts`: simple formatter to render the report as markdown

Décisions d'architecture:
- chaque analyseur implémente `Analyzer` et est indépendant
- l'engine exécute les analyseurs séquentiellement et agrège les issues
- le provider IA peut appeler cet engine avant ou après un LLM pour enrichir l'évaluation
