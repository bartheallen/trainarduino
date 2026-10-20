'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { savePositioningTestResultAction } from '@/lib/positioningServerActions';

interface Question {
  id: number;
  text: string;
  difficulty: number;
  options: string[];
  correctAnswer: number;
  explanation: string;
}

const questions: Question[] = [
  {
    id: 1,
    text: 'À quoi correspond principalement "Arduino" ?',
    difficulty: 1,
    options: [
      'Un langage de programmation',
      'Une plateforme électronique open source',
      'Un jouet robotique',
      'Une imprimante 3D',
    ],
    correctAnswer: 1,
    explanation: 'Arduino est une plateforme matérielle et logicielle open source pour prototyper des systèmes électroniques.',
  },
  {
    id: 2,
    text: 'À quoi sert la fonction setup() dans Arduino ?',
    difficulty: 1,
    options: [
      'Se répéter en boucle',
      'Retarder l’exécution du programme',
      'Configurer les broches et initialiser les réglages',
      'Éteindre l’Arduino',
    ],
    correctAnswer: 2,
    explanation: 'setup() ne s’exécute qu’une fois et sert notamment à préparer les broches et la liaison série.',
  },
  {
    id: 3,
    text: 'Quelle fonction s’exécute en continu dans Arduino ?',
    difficulty: 1,
    options: [
      'void setup()',
      'void init()',
      'void loop()',
      'void start()',
    ],
    correctAnswer: 2,
    explanation: 'loop() recommence automatiquement après sa fin pour maintenir le comportement du programme.',
  },
  {
    id: 4,
    text: 'Quelle est la syntaxe correcte pour configurer une broche numérique en sortie ?',
    difficulty: 2,
    options: [
      'setPin(pin, 1)',
      'digitalOutput(pin)',
      'pinMode(OUTPUT, pin)',
      'pinMode(pin, OUTPUT)',
    ],
    correctAnswer: 3,
    explanation: 'pinMode reçoit d’abord la broche, puis le mode OUTPUT, INPUT ou INPUT_PULLUP.',
  },
  {
    id: 5,
    text: 'Comment lit-on une entrée numérique dans Arduino ?',
    difficulty: 2,
    options: [
      'readPin(pin)',
      'digitalRead(pin)',
      'getDigital(pin)',
      'inputRead(pin)',
    ],
    correctAnswer: 1,
    explanation: 'digitalRead() renvoie l’état logique HIGH ou LOW d’une entrée numérique.',
  },
  {
    id: 6,
    text: 'Pourquoi faut-il utiliser digitalRead() plutôt que analogRead() pour un bouton câblé sur une entrée numérique ?',
    difficulty: 2,
    options: [
      'Parce que analogRead() ne fonctionne que dans setup()',
      'Parce que digitalRead() configure automatiquement la résistance de pull-up',
      'Parce que digitalRead() renvoie un état HIGH ou LOW adapté à une entrée binaire',
      'Parce que les boutons produisent toujours une tension analogique nulle',
    ],
    correctAnswer: 2,
    explanation: 'Un bouton numérique est interprété comme deux états logiques : HIGH ou LOW.',
  },
  {
    id: 7,
    text: 'Quelle approche permet de faire clignoter une LED sans bloquer la lecture d’un bouton ?',
    difficulty: 3,
    options: [
      'Appeler delay(60000) puis lire le bouton',
      'Déplacer loop() dans setup()',
      'Remplacer digitalRead() par pinMode()',
      'Utiliser millis() pour comparer le temps écoulé sans appeler delay()',
    ],
    correctAnswer: 3,
    explanation: 'millis() mesure le temps écoulé sans bloquer loop(), contrairement à un long delay().',
  },
  {
    id: 8,
    text: 'Que fait analogRead(A0) sur une Arduino Uno ?',
    difficulty: 3,
    options: [
      'Il renvoie uniquement HIGH ou LOW',
      'Il mesure une tension et renvoie généralement une valeur de 0 à 1023',
      'Il configure A0 comme sortie numérique',
      'Il mesure directement le courant en ampères',
    ],
    correctAnswer: 1,
    explanation: 'Sur une Arduino Uno, analogRead() convertit la tension d’une entrée analogique en valeur 0 à 1023.',
  },
  {
    id: 9,
    text: 'Quelle séquence est correcte pour envoyer régulièrement la valeur d’un capteur sur le port série ?',
    difficulty: 4,
    options: [
      'Serial.println() avant toute initialisation, uniquement dans setup()',
      'analogRead() remplace Serial.begin()',
      'Serial.begin() dans setup(), puis Serial.println() dans loop()',
      'Serial.begin() doit être rappelé à chaque tour de loop()',
    ],
    correctAnswer: 2,
    explanation: 'Serial.begin() prépare la liaison dans setup(), puis Serial.println() peut envoyer les mesures dans loop().',
  },
  {
    id: 10,
    text: 'Quel est le principal risque d’utiliser une variable non volatile dans une routine d’interruption ?',
    difficulty: 4,
    options: [
      'La carte redémarre toujours après chaque interruption',
      'La variable devient automatiquement une constante',
      'L’interruption ne peut jamais être déclenchée',
      'La valeur peut être optimisée ou lue de manière incohérente entre l’interruption et le code principal',
    ],
    correctAnswer: 3,
    explanation: 'Une variable partagée avec une interruption doit pouvoir être lue sans hypothèse dangereuse du compilateur.',
  },
];

export default function PositioningTestPage() {
  const router = useRouter();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [testComplete, setTestComplete] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const currentQuestion = questions[currentIndex];

  const handleAnswerSelect = (answerIndex: number) => {
    if (!showResult) {
      setSelectedAnswer(answerIndex);
    }
  };

  const handleSubmitAnswer = () => {
    if (selectedAnswer === null) return;

    const isCorrect = selectedAnswer === currentQuestion.correctAnswer;
    if (isCorrect) setScore((value) => value + 1);
    setShowResult(true);
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setSelectedAnswer(null);
      setShowResult(false);
    } else {
      setTestComplete(true);
    }
  };

  const calculateLevel = () => {
    const percentage = (score / questions.length) * 100;
    if (percentage >= 90) return 'expert';
    if (percentage >= 70) return 'advanced';
    if (percentage >= 40) return 'intermediate';
    return 'beginner';
  };

  const handleCompleteTest = async () => {
    const correctAnswers = score;
    const totalQuestions = questions.length;

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      await savePositioningTestResultAction(correctAnswers, totalQuestions);
      router.push('/dashboard');
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Une erreur est survenue lors de l’enregistrement du test.';
      setSubmitError(message);
      console.error('Failed to save positioning test result:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (testComplete) {
    const level = calculateLevel();
    const levelName = {
      beginner: 'Débutant',
      intermediate: 'Intermédiaire',
      advanced: 'Avancé',
      expert: 'Expert',
    }[level];

    return (
      <div className="min-h-screen px-3 py-6 text-slate-100 sm:px-6 sm:py-10">
        <div className="mx-auto max-w-2xl rounded-[2rem] border border-white/10 bg-slate-900/80 p-5 text-center shadow-2xl shadow-cyan-950/30 sm:p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-cyan-300">Diagnostic de départ</p>
          <h1 className="mb-4 mt-3 text-2xl font-bold text-white sm:text-4xl">Test terminé</h1>
          <p className="mb-6 text-lg text-slate-300 sm:text-xl">
            Vous avez obtenu <span className="font-bold text-cyan-300">{score}/{questions.length}</span>
          </p>
          <div className="mb-6 rounded-2xl border border-cyan-400/20 bg-cyan-400/10 p-6">
            <p className="mb-2 text-slate-400">Votre niveau de départ</p>
            <p className="text-3xl font-bold text-cyan-300">{levelName}</p>
          </div>
          <p className="mb-8 text-slate-300">
            Le test peut ouvrir au maximum les six premiers modules. Les suivants se débloquent par la pratique.
          </p>
          {submitError && (
            <div className="mb-6 rounded-2xl border border-rose-400/20 bg-rose-400/10 p-4 text-left text-sm text-rose-200">
              <p className="font-semibold">Enregistrement du test impossible</p>
              <p className="mt-1 break-words">{submitError}</p>
            </div>
          )}

          <button
            onClick={handleCompleteTest}
            disabled={isSubmitting}
            className="w-full rounded-xl bg-cyan-400 px-5 py-3 font-semibold text-slate-950 hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto sm:px-8"
          >
            {isSubmitting ? 'Enregistrement...' : 'Aller au tableau de bord'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen px-3 py-5 text-slate-100 sm:px-6 sm:py-8">
      <div className="mx-auto max-w-3xl rounded-[2rem] border border-white/10 bg-slate-900/80 p-4 shadow-2xl shadow-cyan-950/30 sm:p-8">
        <div className="mb-6 sm:mb-8">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <h1 className="text-2xl font-bold text-white sm:text-3xl">Test de positionnement</h1>
            <span className="text-lg font-semibold text-cyan-300">
              {currentIndex + 1}/{questions.length}
            </span>
          </div>
          <div className="h-2 w-full rounded-full bg-slate-800">
            <div
              className="h-2 rounded-full bg-cyan-400 transition-all duration-300"
              style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
            ></div>
          </div>
        </div>

        <div className="mb-8">
          <h2 className="mb-6 break-words text-lg font-semibold text-white sm:text-xl">
            {currentQuestion.text}
          </h2>

          <div className="space-y-3">
            {currentQuestion.options.map((option, index) => (
              <button
                key={index}
                onClick={() => handleAnswerSelect(index)}
                disabled={showResult}
                className={`w-full p-4 text-left rounded-lg border-2 transition-all ${
                  selectedAnswer === index
                    ? 'border-cyan-300 bg-cyan-400/10'
                    : 'border-white/10 bg-slate-950/50 hover:border-cyan-400/40'
                } ${
                  showResult
                    ? selectedAnswer === index
                      ? index === currentQuestion.correctAnswer
                        ? 'border-emerald-400 bg-emerald-400/10'
                        : 'border-rose-400 bg-rose-400/10'
                      : index === currentQuestion.correctAnswer
                      ? 'border-emerald-400 bg-emerald-400/10'
                      : ''
                    : ''
                } disabled:cursor-not-allowed`}
              >
                <div className="flex items-center">
                  <div
                    className={`w-6 h-6 rounded-full border-2 mr-3 flex items-center justify-center ${
                      selectedAnswer === index
                        ? 'border-cyan-300'
                        : 'border-slate-600'
                    }`}
                  >
                    {selectedAnswer === index && (
                      <div
                        className={`w-3 h-3 rounded-full ${
                          showResult
                            ? index === currentQuestion.correctAnswer
                              ? 'bg-emerald-400'
                              : 'bg-rose-400'
                            : 'bg-cyan-300'
                        }`}
                      ></div>
                    )}
                  </div>
                  <span className="text-slate-200">{option}</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {showResult && (
          <div
            className={`mb-8 rounded-2xl border p-4 text-center ${
              selectedAnswer === currentQuestion.correctAnswer
                ? 'border-emerald-400/20 bg-emerald-400/10'
                : 'border-rose-400/20 bg-rose-400/10'
            }`}
          >
            <p
              className={`font-semibold ${
                selectedAnswer === currentQuestion.correctAnswer
                  ? 'text-emerald-200'
                  : 'text-rose-200'
              }`}
            >
              {selectedAnswer === currentQuestion.correctAnswer
                ? '✓ Correct !'
                : '✗ Incorrect'}
            </p>
            <p className="mt-2 text-sm leading-6 text-slate-300">{currentQuestion.explanation}</p>
          </div>
        )}

        <div className="flex gap-4">
          {!showResult ? (
            <button
              onClick={handleSubmitAnswer}
              disabled={selectedAnswer === null}
              className="flex-1 rounded-xl bg-cyan-400 py-3 font-semibold text-slate-950 hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Valider la réponse
            </button>
          ) : (
            <button
              onClick={handleNext}
              className="flex-1 rounded-xl bg-cyan-400 py-3 font-semibold text-slate-950 hover:bg-cyan-300"
            >
              {currentIndex < questions.length - 1 ? 'Question suivante' : 'Voir les résultats'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
