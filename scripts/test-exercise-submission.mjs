import { createClient } from '@supabase/supabase-js';
import { validateArduinoCode } from '../lib/services/learningEngine';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase credentials in .env.local');
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function findTestUser() {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .limit(1)
    .single();

  if (error || !data) {
    throw new Error(`Unable to find a test profile: ${error?.message}`);
  }

  return data;
}

async function findExercise() {
  const { data, error } = await supabase
    .from('exercises')
    .select('*')
    .limit(1)
    .single();

  if (error || !data) {
    throw new Error(`Unable to find an exercise: ${error?.message}`);
  }

  return data;
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
