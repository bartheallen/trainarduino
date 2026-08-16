# Diagnostic des 3 Problèmes Production

**Date**: 2026-08-16  
**Objectif**: Identifier pourquoi les corrections précédentes n'ont pas réellement fonctionné en production

---

## Résumé des Problèmes Reportés

1. ❌ Le pseudo affiche l'email au lieu d'un vrai nom (Google OAuth)
2. ❌ L'XP ne bouge jamais après validation d'un module
3. ❌ Le streak ne bouge jamais non plus

---

## Diagnostic #1: Google Username / Pseudo

### État Actuel du Code

**Flux réel en production:**
1. User complète OAuth Google → redirected to `/api/auth/callback`
2. `app/api/auth/callback/route.ts` appelle `ensureProfileForUser(supabase, user)`
3. `ensureProfileForUser()` appelle `buildGoogleProfileIdentity(user, existingUsernames)`
4. `buildGoogleProfileIdentity()` crée l'username avec la bonne hiérarchie

**Code de buildGoogleProfileIdentity:**
```typescript
// lib/auth.ts:209-250
export async function buildGoogleProfileIdentity(
  user: { id: string; email?: string | null; user_metadata?: Record<string, any> | null },
  existingUsernames: string[] = []
) {
  const meta = user.user_metadata ?? {};
  const preferredUsername = typeof meta.preferred_username === 'string' ? meta.preferred_username : null;
  const givenName = typeof meta.given_name === 'string' ? meta.given_name : null;
  const familyName = typeof meta.family_name === 'string' ? meta.family_name : null;
  const fullName = typeof meta.full_name === 'string' ? meta.full_name : null;

  const candidateBase =
    (preferredUsername && String(preferredUsername).trim()) ||
    (givenName && familyName ? `${givenName} ${familyName}` : (givenName || familyName || ...)) ||
    fallbackLocalPart ||
    'Utilisateur';
  
  // Normalise, deduplicate, return
}
```

**Possible ROOT CAUSE #1:** `buildGoogleProfileIdentity()` est bien appelée, mais Google peut ne pas envoyer `given_name`, `family_name` dans les métadonnées si:
- L'utilisateur a un "name" simple (pas séparé en given/family)
- La géolocalisation de l'utilisateur affecte le format des métadonnées

### Requête SQL à Exécuter

Pour vérifier ce que Google envoie réellement:
```sql
-- Voir les métadonnées Google brutes de votre compte
SELECT 
  id,
  email,
  raw_user_meta_data,
  created_at
FROM auth.users 
WHERE id = 'ec80621b-ab16-4151-9c72-3c755d38cffe'
LIMIT 1;
```

**Remplace `ec80621b-ab16-4151-9c72-3c755d38cffe` par ton vrai user ID Supabase.**

---

## Diagnostic #2: XP Qui Ne Bouge Pas

### Flux en Production (Théorique)

```
User valide exercise
  ↓
validatePracticalTestAction() / confirmPracticalCompletionAction()
  ↓
emitEvent(userId, 'ExerciseValidated', payload)  ← événement publié
  ↓
defaultPublisher.publish(event)  ← mais y a-t-il des abonnés?
  ↓
gamificationSubscriber (écoute ExerciseValidated)
  ↓
profileSubscriber (écoute XpAwarded)
  ↓
db.updateUserXP() ← l'XP devrait augmenter
```

### 🔴 PROBLÈME CRITIQUE IDENTIFIÉ

**Emplacement**: `lib/exerciseServerActions.ts` lignes 37 et 284

```typescript
export async function validatePracticalTestAction(...) {
  initializeEventSystem();  // ⚠️ APPELÉE SANS `await`!
  // ... le code continue sans attendre que les abonnés soient enregistrés
}

export async function confirmPracticalCompletionAction(...) {
  initializeEventSystem();  // ⚠️ APPELÉE SANS `await`!
  // ... même problème
}
```

**Pourquoi c'est un problème:**
1. `initializeEventSystem()` est une fonction `async` qui retourne une `Promise`
2. Quand on l'appelle **sans `await`**, la fonction continue immédiatement (fire-and-forget)
3. `registerAllSubscribers()` fait des `await import()` dynamiques pour charger chaque subscriber
4. Si on n'attend pas cette initialisation, **les modules des subscribers ne sont jamais importés**
5. Si les modules ne sont pas importés, **le code au niveau du module qui enregistre les handlers ne s'exécute jamais**
6. Si les handlers n'existent pas, **les événements sont publiés mais personne ne les écoute**

### Résultat

```
ExerciseValidated publié → aucun abonné enregistré → aucun traitement
→ XP ne change pas, streak ne change pas
```

### Vérification du Code des Abonnés

Les abonnés enregistrent leurs handlers **à l'exécution du module** (top-level code):

```typescript
// lib/events/subscribers/gamificationSubscriber.ts
// ... export async function handleProgressUpdated ...

// ← Ce code s'exécute SEULEMENT si le module est importé
defaultSubscriber.subscribe('ProgressUpdated', handleProgressUpdated);
```

**Question clé:** Est-ce qu'un module subscriber est importé quelque part dans le code réel?
```bash
$ grep -r "subscribers/gamificationSubscriber" app/ lib/ --exclude-dir=tests
# Résultat: (aucune occurrence en dehors de tests/)
```

**Résultat**: Les modules des subscribers ne sont importés que dans les tests, pas dans le code réel.

---

## Diagnostic #3: Trigger handle_new_user

### État Actuel

Le trigger dans `database/migrations.sql` lignes 45-120:

```sql
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO public.profiles (
    id,
    username,
    display_name,
    ...
  )
  VALUES (
    NEW.id,
    COALESCE(
      NULLIF(NEW.raw_user_meta_data->>'preferred_username', ''),
      NULLIF(NEW.raw_user_meta_data->>'username', ''),
      NULLIF(NEW.raw_user_meta_data->>'display_name', ''),
      NULLIF(NEW.raw_user_meta_data->>'full_name', ''),
      NULLIF(NEW.raw_user_meta_data->>'name', ''),
      NULLIF(NEW.email, ''),
      CONCAT('user_', SUBSTRING(NEW.id::text, 1, 8))
    ),
    ...
  );
  RETURN NEW;
END;
$$;
```

✅ **Le trigger semble correct** - il a la bonne hiérarchie de COALESCE.

### Requête SQL pour Vérifier le Contenu Actuel

```sql
-- Voir le contenu exact du trigger en base de données
SELECT prosrc FROM pg_proc WHERE proname = 'handle_new_user';
```

**Note**: Le trigger s'exécute SEULEMENT lors du INSERT initial (création du user). Si le compte existe déjà, le trigger ne s'exécute pas à nouveau.

---

## Chaîne Causale Complète (Théorie vs Réalité)

### Ce Qui DEVRAIT Se Passer

```
1. User valide un exercice
   ↓
2. validatePracticalTestAction() await initializeEventSystem()
   - Charge TOUS les modules des subscribers
   - Enregistre handlers pour ProgressUpdated, ExerciseValidated, etc.
   ↓
3. emitEvent(userId, 'ExerciseValidated', payload)
   ↓
4. Subscribers enregistrés écoutent ExerciseValidated
   ├→ progressSubscriber.handleExerciseValidated()
   │  └→ Publie ProgressUpdated
   │     └→ gamificationSubscriber.handleProgressUpdated()
   │        └→ Publie XpAwarded
   │           └→ profileSubscriber.handleXpAwarded()
   │              ├→ db.updateUserXP(userId, xp)
   │              └→ db.updateUserStreak(userId, timestamp)
   ↓
5. XP augmente ✅
   Streak augmente ✅
```

### Ce Qui RÉELLEMENT Se Passe

```
1. User valide un exercice
   ↓
2. validatePracticalTestAction() initializeEventSystem() // ⚠️ sans await
   - Promise créée mais pas attendue
   - Code continue immédiatement
   - Les modules des subscribers NE SONT PAS chargés
   ↓
3. emitEvent(userId, 'ExerciseValidated', payload)
   ↓
4. Aucun subscriber n'est enregistré
   ├→ EventBus.publish() s'exécute
   │  └→ Boucle sur les subscribers de 'ExerciseValidated'
   │     └→ Aucun! (Set vide)
   ↓
5. XP ne change pas ❌
   Streak ne change pas ❌
```

---

## Points de Vérification Supplémentaires

### 1. Vérifier Que ensureProfileForUser Est Appelée

Dans `app/api/auth/callback/route.ts:65`:
```typescript
const profile = await ensureProfileForUser(supabase, user);
```

✅ Elle est bien appelée après le callback OAuth.

### 2. Vérifier l'Import des Modules Subscriber

Recherche:
```bash
grep -r "import.*subscribers" lib/ app/ --exclude-dir=tests --exclude-dir=node_modules
```

Résultat attendu: Très peu ou aucun résultat (problème confirmé).

### 3. Vérifier Que registerAllSubscribers Est Async

```typescript
export async function registerAllSubscribers() {
  // ... fait des await import()
}
```

✅ Elle est bien async.

### 4. Vérifier Que initializeEventSystem Est Async

```typescript
export async function initializeEventSystem() {
  await registerAllSubscribers();
  initResult = bootstrapEventBus();
  return initResult;
}
```

✅ Elle est bien async.

---

## Conclusion du Diagnostic

### Problème #1 (Google Username)
**État**: Probablement fonctionnel, mais requiert vérification des métadonnées réelles

**Cause potentielle**: Les métadonnées Google ne contiennent pas `given_name`/`family_name` dans ton cas

**Action requise**: Exécuter la requête SQL pour voir tes vraies métadonnées

---

### Problème #2 & #3 (XP et Streak)
**État**: ❌ DÉFINITIVEMENT CASSÉ EN PRODUCTION

**Cause racine confirmée**: `initializeEventSystem()` est appelée SANS `await` dans exerciseServerActions.ts

**Effet**: Les abonnés ne sont JAMAIS enregistrés, donc les événements sont publiés mais personne ne les traite

**Preuve**:
- Les modules des subscribers ne sont importés que dans les tests
- `registerAllSubscribers()` est appelée sans `await` (fire-and-forget)
- Aucune autre initialisation du système d'événements n'existe dans le code réel

---

## SQL à Exécuter dans Supabase

Copie-colle ces requêtes dans l'SQL Editor de Supabase:

### Requête #1: Voir tes métadonnées Google brutes
```sql
SELECT 
  id,
  email,
  raw_user_meta_data,
  created_at
FROM auth.users 
WHERE id = 'TON_USER_ID'
LIMIT 1;
```

### Requête #2: Voir le contenu du trigger en base (version actuelle)
```sql
SELECT prosrc 
FROM pg_proc 
WHERE proname = 'handle_new_user';
```

### Requête #3: Vérifier que buildGoogleProfileIdentity a bien été utilisée
```sql
-- Voir le username stocké pour ton compte
SELECT 
  id,
  username,
  display_name,
  created_at
FROM profiles
WHERE id = 'TON_USER_ID'
LIMIT 1;
```

---

## Prochaines Étapes Recommandées

Ne fais RIEN pour l'instant - attends la confirmation du diagnostic.

Une fois confirmé:
1. ✅ Fixer `initializeEventSystem()` en l'attendant avec `await`
2. ✅ Ou importer les modules des subscribers au démarrage
3. ✅ Ou faire une initialisation du système d'événements dans `app/layout.tsx`
