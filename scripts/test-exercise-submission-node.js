const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

function loadEnvFile(envPath) {
  if (!fs.existsSync(envPath)) return;
  const content = fs.readFileSync(envPath, 'utf8');
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const match = trimmed.match(/^([A-Za-z0-9_]+)=(.*)$/);
    if (!match) continue;
    const key = match[1];
    let value = match[2];
    if ((value.startsWith("'") && value.endsWith("'")) || (value.startsWith('"') && value.endsWith('"'))) {
      value = value.slice(1, -1);
    }
    process.env[key] = value;
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

async function signUpAndSignIn() {
  const email = `debug+${Date.now()}@example.com`;
  const password = 'Password123!';
  console.log('Signing up user:', email);

  const { data: signUpData, error: signUpError } = await supabase.auth.signUp({ email, password });
  if (signUpError) {
    console.error('SignUp error:', signUpError);
  }

  const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({ email, password });
  if (signInError) {
    throw new Error(`Sign in failed: ${signInError.message}`);
  }

  if (signInData?.session) {
    await supabase.auth.setSession(signInData.session);
  }

  const userId = signInData?.user?.id || signUpData?.user?.id;
  if (!userId) {
    throw new Error('Could not obtain authenticated user id.');
  }
  return { userId, email };
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
  const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).single();
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

async function insertEvent(userId, type, payload) {
  const { data, error } = await supabase
    .from('events')
    .insert([{ user_id: userId, type, payload }])
    .select()
    .single();
  if (error) {
    throw new Error(`Unable to insert event ${type}: ${error.message}`);
  }
  return data;
}

function calculateLevelFromXP(xp) {
  if (xp >= 10000) return 10;
  if (xp >= 8000) return 9;
  if (xp >= 6000) return 8;
  if (xp >= 4500) return 7;
  if (xp >= 3000) return 6;
  if (xp >= 2000) return 5;
  if (xp >= 1200) return 4;
  if (xp >= 600) return 3;
  if (xp >= 200) return 2;
  return 1;
}

async function updateProfileXP(userId, xpToAdd) {
  const profile = await getProfile(userId);
  const newXP = Number(profile.xp_total || 0) + xpToAdd;
  const newLevel = calculateLevelFromXP(newXP);
  const { data, error } = await supabase
    .from('profiles')
    .update({ xp_total: newXP, niveau_actuel: newLevel })
    .eq('id', userId)
    .select()
    .single();
  if (error) {
    throw new Error(`Unable to update profile XP: ${error.message}`);
  }
  return data;
}

async function run() {
  console.log('Starting exercise submission integration test...');

  const { userId, email } = await signUpAndSignIn();
  console.log('Authenticated user:', { userId, email });

  const profile = await getProfile(userId);
  const beforeXp = Number(profile.xp_total || 0);
  console.log('Before XP:', beforeXp);

  const exercise = await findExercise();
  console.log('Selected exercise:', { id: exercise.id, titre: exercise.titre, xp_recompense: exercise.xp_recompense, hasExample: Boolean(exercise.exemple_solution) });

  const code = `void setup() {
    pinMode(LED_BUILTIN, OUTPUT);
    pinMode(2, INPUT_PULLUP);
  }

  void loop() {
    if (digitalRead(2) == HIGH) {
      digitalWrite(LED_BUILTIN, HIGH);
    } else {
      digitalWrite(LED_BUILTIN, LOW);
    }
    delay(500); // blink the onboard LED every half second
  }`;

  console.log('Using test code sample for validation.');
  
  const validation = validateArduinoCode(code, exercise);
  const status = validation.passed ? 'approved' : 'rejected';
  const xpAwarded = validation.passed ? validation.xpAwarded : 0;
  const note = Math.min(1, Math.max(0, validation.score / 100));

  console.log('Validation result:', validation);

  const submission = await createOrUpdateSubmission(userId, exercise.id, code, status, xpAwarded, note);
  console.log('Submission record:', { id: submission.id, statut: submission.statut, xp_gagne: submission.xp_gagne });

  if (validation.passed) {
    await insertEvent(userId, 'XpAwarded', { xp: xpAwarded, exerciseId: exercise.id, awardedAt: new Date().toISOString() });
    await insertEvent(userId, 'ProgressUpdated', { exerciseId: exercise.id, moduleId: exercise.module_id, correct: true, status, xp: xpAwarded, note });
    await updateProfileXP(userId, xpAwarded);
  } else {
    await insertEvent(userId, 'ProgressUpdated', { exerciseId: exercise.id, moduleId: exercise.module_id, correct: false, status, xp: 0, note });
  }

  const submissionRow = await supabase.from('submissions').select('*').eq('user_id', userId).eq('exercise_id', exercise.id).single();
  if (submissionRow.error) {
    throw new Error(`Could not read submission row: ${submissionRow.error.message}`);
  }

  const afterProfile = await getProfile(userId);
  const afterXp = Number(afterProfile.xp_total || 0);
  const diffXp = afterXp - beforeXp;

  console.log('\nRESULTS');
  console.log(`XP before: ${beforeXp}`);
  console.log(`XP after : ${afterXp}`);
  console.log(`Difference: ${diffXp}`);
  console.log(`Awarded XP: ${xpAwarded}`);
  console.log(`Submission status: ${status}`);
  console.log(`Submission ID: ${submissionRow.data?.id}`);
  console.log('Events inserted: XpAwarded and ProgressUpdated');

  if (diffXp !== xpAwarded) {
    console.warn('Warning: XP difference does not match awarded XP.');
  }
}

run().catch((error) => {
  console.error('Test script failed:', error);
  process.exit(1);
});
