const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

function loadEnvFile(envPath) {
  if (!fs.existsSync(envPath)) return;
  const content = fs.readFileSync(envPath, 'utf8');
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const [key, ...rest] = trimmed.split('=');
    process.env[key] = rest.join('=').trim();
  }
}

loadEnvFile(path.resolve(__dirname, '../.env.local'));

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase credentials in .env.local');
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

function validateArduinoCode(code, exercise) {
  const REQUIRED_PATTERNS = [
    { pattern: /setup\s*\(/, message: 'La fonction setup() est manquante.', hint: 'Ajoutez une fonction setup() pour initialiser les broches.' },
    { pattern: /loop\s*\(/, message: 'La fonction loop() est manquante.', hint: 'Ajoutez une boucle principale pour exécuter le programme.' },
  ];
  const OPTIONAL_PATTERNS = [
    { pattern: /pinMode\s*\(/, message: 'Configuration des broches détectée.', hint: 'Bonne base pour piloter vos composants.' },
    { pattern: /digitalWrite\s*\(/, message: 'Écriture numérique détectée.', hint: 'Vous pilotez bien un état logique.' },
    { pattern: /digitalRead\s*\(/, message: 'Lecture numérique détectée.', hint: 'Vous pouvez réagir à un capteur.' },
    { pattern: /analogRead\s*\(/, message: 'Lecture analogique détectée.', hint: 'Vous exploitez des valeurs continues.' },
    { pattern: /analogWrite\s*\(/, message: 'Écriture analogique détectée.', hint: 'Vous générez un signal modulé.' },
    { pattern: /\b(if|for|while|switch)\b/, message: 'Logique de contrôle détectée.', hint: 'L’algorithme commence à prendre forme.' },
    { pattern: /\/\//, message: 'Commentaires présents.', hint: 'Le code reste plus lisible.' },
  ];
  function getBraceBalance(source) {
    let balance = 0;
    for (const char of source) {
      if (char === '{') balance += 1;
      if (char === '}') balance -= 1;
    }
    return balance;
  }
  function getParenthesisBalance(source) {
    let balance = 0;
    for (const char of source) {
      if (char === '(') balance += 1;
      if (char === ')') balance -= 1;
    }
    return balance;
  }
  const issues = [];
  const trimmed = code.trim();
  if (!trimmed) {
    issues.push({ severity: 'error', message: 'Le code est vide.', hint: 'Commencez par définir setup() et loop().' });
  }
  REQUIRED_PATTERNS.forEach(({ pattern, message, hint }) => {
    if (!pattern.test(code)) {
      issues.push({ severity: 'error', message, hint });
    }
  });
  OPTIONAL_PATTERNS.forEach(({ pattern, message, hint }) => {
    if (pattern.test(code)) {
      issues.push({ severity: 'success', message, hint });
    }
  });
  if (getBraceBalance(code) !== 0) {
    issues.push({ severity: 'warning', message: 'Les accolades ne sont pas équilibrées.', hint: 'Vérifiez les blocs de code et les fermetures.' });
  }
  if (getParenthesisBalance(code) !== 0) {
    issues.push({ severity: 'warning', message: 'Les parenthèses ne sont pas équilibrées.', hint: 'Contrôlez les appels de fonction et les conditions.' });
  }
  const detectedSuccesses = issues.filter((issue) => issue.severity === 'success').length;
  const totalScore = Math.max(0, Math.min(100, 35 + detectedSuccesses * 10));
  const passed = issues.filter((issue) => issue.severity === 'error').length === 0 && totalScore >= 60;
  return {
    score: totalScore,
    passed,
    issues,
    xpAwarded: exercise && exercise.xp_recompense ? Math.max(10, Math.round(exercise.xp_recompense * (totalScore / 100))) : 25,
    verdict: passed ? 'success' : issues.some((issue) => issue.severity === 'warning') ? 'warning' : 'error',
  };
}

async function findTestUser() {
  const { data, error } = await supabase.from('profiles').select('*').limit(1);

  if (error) {
    throw new Error(`Unable to query profiles: ${error.message}`);
  }
  if (!Array.isArray(data) || data.length === 0) {
    throw new Error('No profiles found in the database.');
  }

  return data[0];
}

async function findExercise() {
  const { data, error } = await supabase.from('exercises').select('*').limit(1);

  if (error) {
    throw new Error(`Unable to query exercises: ${error.message}`);
  }
  if (!Array.isArray(data) || data.length === 0) {
    throw new Error('No exercises found in the database.');
  }

  return data[0];
}

async function getProfile(userId) {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();
  if (error) {
    throw new Error(`Unable to load profile ${userId}: ${error.message}`);
  }
  return data;
}

async function createOrUpdateSubmission(userId, exerciseId, code, status, xp, note) {
  const { data, error } = await supabase
    .from('submissions')
    .upsert(
      [{ user_id: userId, exercise_id: exerciseId, code_soumis: code, statut: status, xp_gagne: xp, note }],
      { onConflict: 'user_id,exercise_id' }
    )
    .select()
    .single();

  if (error) {
    throw new Error(`Unable to upsert submission: ${error.message}`);
  }

  return data;
}

async function run() {
  console.log('Starting exercise submission integration test...');

  const profile = await findTestUser();
  const exercise = await findExercise();
  const initialProfile = await getProfile(profile.id);
  const beforeXp = Number(initialProfile.xp_total ?? 0);

  console.log('Test user:', { id: profile.id, email: profile.email, beforeXp });
  console.log('Exercise:', { id: exercise.id, titre: exercise.titre, xp_recompense: exercise.xp_recompense });

  const code = exercise.exemple_solution || `void setup() { pinMode(LED_BUILTIN, OUTPUT); } void loop() { digitalWrite(LED_BUILTIN, HIGH); delay(500); digitalWrite(LED_BUILTIN, LOW); delay(500); }`;

  const validation = validateArduinoCode(code, exercise);
  const status = validation.passed ? 'approved' : 'rejected';
  const xpAwarded = validation.passed ? validation.xpAwarded : 0;
  const note = Math.min(1, Math.max(0, validation.score / 100));

  console.log('Validation:', validation);

  const submission = await createOrUpdateSubmission(profile.id, exercise.id, code, status, xpAwarded, note);
  console.log('Submission upserted:', submission);

  const submissionRow = await supabase
    .from('submissions')
    .select('*')
    .eq('user_id', profile.id)
    .eq('exercise_id', exercise.id)
    .single();

  if (submissionRow.error) {
    throw new Error(`Could not read submission row: ${submissionRow.error.message}`);
  }

  console.log('Submission row confirmed:', submissionRow.data);

  const afterProfile = await getProfile(profile.id);
  const afterXp = Number(afterProfile.xp_total ?? 0);
  const diffXp = afterXp - beforeXp;

  console.log('\nRESULT:');
  console.log(`XP before: ${beforeXp}`);
  console.log(`XP after : ${afterXp}`);
  console.log(`Difference: ${diffXp}`);
  console.log(`Submission status: ${status}`);
  console.log(`Submission xp: ${xpAwarded}`);
  console.log(`Submission row id: ${submissionRow.data?.id}`);

  if (diffXp !== xpAwarded) {
    console.warn('XP difference does not match awarded XP. Backend profile XP may not have updated automatically.');
  }
}

run().catch((error) => {
  console.error('Test script failed:', error);
  process.exit(1);
});
