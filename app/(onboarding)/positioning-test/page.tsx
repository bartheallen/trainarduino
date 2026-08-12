'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface Question {
  id: number;
  text: string;
  difficulty: number;
  options: string[];
  correctAnswer: number;
}

const questions: Question[] = [
  {
    id: 1,
    text: 'À quoi correspond principalement "Arduino" ?',
    difficulty: 1,
    options: [
      'Une plateforme électronique open source',
      'Un langage de programmation',
      'Un jouet robotique',
      'Une imprimante 3D',
    ],
    correctAnswer: 0,
  },
  {
    id: 2,
    text: 'À quoi sert la fonction setup() dans Arduino ?',
    difficulty: 1,
    options: [
      'Configurer les broches et initialiser les réglages',
      'Se répéter en boucle',
      'Retarder l’exécution du programme',
      'Éteindre l’Arduino',
    ],
    correctAnswer: 0,
  },
  {
    id: 3,
    text: 'Quelle fonction s’exécute en continu dans Arduino ?',
    difficulty: 1,
    options: [
      'void setup()',
      'void loop()',
      'void init()',
      'void start()',
    ],
    correctAnswer: 1,
  },
  {
    id: 4,
    text: 'Quelle est la syntaxe correcte pour configurer une broche numérique en sortie ?',
    difficulty: 2,
    options: [
      'pinMode(pin, OUTPUT)',
      'setPin(pin, 1)',
      'digitalOutput(pin)',
      'pinMode(OUTPUT, pin)',
    ],
    correctAnswer: 0,
  },
  {
    id: 5,
    text: 'Comment lit-on une entrée numérique dans Arduino ?',
    difficulty: 2,
    options: [
      'digitalRead(pin)',
      'readPin(pin)',
      'getDigital(pin)',
      'inputRead(pin)',
    ],
    correctAnswer: 0,
  },
];

export default function PositioningTestPage() {
  const router = useRouter();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [testComplete, setTestComplete] = useState(false);

  const currentQuestion = questions[currentIndex];

  const handleAnswerSelect = (answerIndex: number) => {
    if (!showResult) {
      setSelectedAnswer(answerIndex);
    }
  };

  const handleSubmitAnswer = () => {
    if (selectedAnswer === null) return;

    const isCorrect = selectedAnswer === currentQuestion.correctAnswer;
    if (isCorrect) {
      setScore(score + 1);
    }
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
    if (percentage >= 80) return 'advanced';
    if (percentage >= 60) return 'intermediate';
    return 'beginner';
  };

  const handleCompleteTest = async () => {
    // TODO: Save positioning test results to database
    router.push('/');
  };

  if (testComplete) {
    const level = calculateLevel();
    const levelName = {
      beginner: 'Débutant',
      intermediate: 'Intermédiaire',
      advanced: 'Avancé',
    }[level];

    return (
      <div className="bg-white rounded-lg shadow-lg p-8 text-center">
        <h1 className="text-4xl font-bold text-gray-800 mb-4">Test terminé ! 🎉</h1>
        <p className="text-xl text-gray-600 mb-6">
          Vous avez obtenu <span className="font-bold text-blue-600">{score}/{questions.length}</span>
        </p>
        <div className="bg-blue-50 rounded-lg p-6 mb-8">
          <p className="text-gray-600 mb-2">Votre niveau :</p>
          <p className="text-3xl font-bold text-blue-600">{levelName}</p>
        </div>
        <p className="text-gray-600 mb-8">
          Votre profil a été préparé selon vos résultats. Commençons l’apprentissage ! 🚀
        </p>
        <button
          onClick={handleCompleteTest}
          className="bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700"
        >
          Aller au tableau de bord
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-8">
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-3xl font-bold text-gray-800">Test de positionnement</h1>
          <span className="text-lg font-semibold text-blue-600">
            {currentIndex + 1}/{questions.length}
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
          ></div>
        </div>
      </div>

      <div className="mb-8">
        <h2 className="text-xl font-semibold text-gray-800 mb-6">
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
                  ? 'border-blue-600 bg-blue-50'
                  : 'border-gray-300 bg-white hover:border-blue-300'
              } ${
                showResult
                  ? selectedAnswer === index
                    ? index === currentQuestion.correctAnswer
                      ? 'border-green-600 bg-green-50'
                      : 'border-red-600 bg-red-50'
                    : index === currentQuestion.correctAnswer
                    ? 'border-green-600 bg-green-50'
                    : ''
                  : ''
              } disabled:cursor-not-allowed`}
            >
              <div className="flex items-center">
                <div
                  className={`w-6 h-6 rounded-full border-2 mr-3 flex items-center justify-center ${
                    selectedAnswer === index
                      ? 'border-blue-600'
                      : 'border-gray-300'
                  }`}
                >
                  {selectedAnswer === index && (
                    <div
                      className={`w-3 h-3 rounded-full ${
                        showResult
                          ? index === currentQuestion.correctAnswer
                            ? 'bg-green-600'
                            : 'bg-red-600'
                          : 'bg-blue-600'
                      }`}
                    ></div>
                  )}
                </div>
                <span className="text-gray-800">{option}</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {showResult && (
        <div
          className={`mb-8 p-4 rounded-lg text-center ${
            selectedAnswer === currentQuestion.correctAnswer
              ? 'bg-green-50 border border-green-200'
              : 'bg-red-50 border border-red-200'
          }`}
        >
          <p
            className={`font-semibold ${
              selectedAnswer === currentQuestion.correctAnswer
                ? 'text-green-800'
                : 'text-red-800'
            }`}
          >
            {selectedAnswer === currentQuestion.correctAnswer
              ? '✓ Correct!'
              : '✗ Incorrect!'}
          </p>
        </div>
      )}

      <div className="flex gap-4">
        {!showResult ? (
          <button
            onClick={handleSubmitAnswer}
            disabled={selectedAnswer === null}
            className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Submit Answer
          </button>
        ) : (
          <button
            onClick={handleNext}
            className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700"
          >
            {currentIndex < questions.length - 1 ? 'Next Question' : 'See Results'}
          </button>
        )}
      </div>
    </div>
  );
}
