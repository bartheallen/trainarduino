# 📊 Dashboard Setup Guide

## What's New

Une page dashboard complète a été créée avec un design moderne inspiré de Duolingo!

### ✨ Fonctionnalités

La page `/dashboard` affiche maintenant:

1. **Header avec statistiques** 🎯
   - Pseudo et niveau de l'utilisateur
   - Total d'XP accumulé
   - Pourcentage global de progression

2. **Barre de progression personnelle** 📈
   - Progress bar montrant le chemin vers le prochain niveau
   - XP actuels vs XP needed pour level up
   - Animation fluide et couleurs vives

3. **Barre de progression globale** 🚀
   - Nombre de modules complétés vs total
   - Pourcentage de la jornada
   - Barre animée avec emoji 🎯

4. **Cartes de modules** 🎓
   - Design moderne avec coins arrondis
   - **Statuts visuels:**
     - 🔒 **Verrouillé**: Module grisé, non accessible (niveaux requis)
     - 📚 **En progression**: Accent bleu, barre de progrès
     - ✅ **Complété**: Bordure verte, icône animée
   - Hover effects (scale, shadow)
   - Accès facile au module (click pour accéder)

5. **Message motivant** 🎊
   - Encouragement pour continuer l'apprentissage

## 🎨 Design Inspiré de Duolingo

### Couleurs Principales
- Bleu primaire: Niveaux, stats
- Vert: Modules complétés
- Orange/Rouge: Barre de progression globale
- Violet: Accent secondaire
- Jaune: Highlights

### Éléments de Design
- Cards arrondies (rounded-3xl)
- Shadows subtiles
- Gradients doux
- Animations légères (hover, bounce, pulse)
- Emojis pour la personnalité
- Responsive grid (1 col mobile, 2 col tablet, 3 col desktop)

## 🔧 Configuration Requise

### Base de Données
Le dashboard récupère les données de:

1. **Table `profiles`**
   - `pseudo` - Nom d'utilisateur
   - `xp_total` - Total d'XP
   - `niveau_actuel` - Niveau actuel

2. **Table `modules`**
   - `titre` - Nom du module
   - `description` - Description
   - `ordre` - Ordre d'affichage
   - `palier_test` - Niveau requis pour débloquer

3. **Table `progress`**
   - `statut` - locked/in_progress/completed
   - `score` - Percentage (0-100)
   - `exercices_completes` - Count

### Server Component (Récupération côté serveur)

Le fichier `app/(dashboard)/page.tsx` est un **Server Component async** qui:

1. Récupère l'utilisateur via `getCurrentUser()`
2. Valide l'authentification (redirect si not logged in)
3. Récupère le profil via `getUserProfile(userId)`
4. Récupère la progress via `getUserProgress(userId)`
5. Récupère les modules via `getModules()`
6. Calcule les pourcentages et le statut de chaque module
7. Rend le HTML avec les données réelles

**Avantage**: Les données sont fetched directement du serveur = sécurisé + fast

## 📋 Étapes pour Déployer

### Step 1: Vérifier la base de données
```sql
-- Vérifié que ces tables existent et ont des données
SELECT * FROM profiles;
SELECT * FROM modules;
SELECT * FROM progress;

-- Test: Run le seed.sql si tu n'as pas de données
```

### Step 2: Vérifier l'authentification
```bash
1. npm run dev
2. Visite http://localhost:3000
3. Clique "Sign Up"
4. Crée un compte test
5. Tu devrais être redirigé vers /onboarding/positioning-test
6. Complète le test
7. Tu devrais arriver à /dashboard
```

### Step 3: Vérifier que le dashboard affiche les données
- Vérifie que tu vois ton pseudo
- Vérifie que tu vois ton niveau
- Vérifie que tu vois ton XP
- Vérifie que les modules sont listés
- Vérifie que les statuts sont corrects

## 🐛 Troubleshooting

### "Error loading dashboard"
**Cause**: Erreur lors de la récupération des données
**Solution**:
1. Vérifie que tu es loggé
2. Vérifie que Supabase est connecté
3. Vérifie les logs du serveur (console)
4. Vérifie que .env.local a les bonnes credentials

### "Can't access module - locked"
**Cause**: Normal! Ton niveau est trop bas
**Solution**: Complète un module pour monter de niveau

### "No modules showing"
**Cause**: Aucun module dans la base de données
**Solution**:
1. Visite Supabase SQL Editor
2. Exécute le contenu de database/seed.sql
3. Rafraîchis le dashboard

### "User not found redirect"
**Cause**: Pas loggé
**Solution**: Sign up d'abord sur /auth/signup

## 📱 Responsive Design

Le dashboard s'adapte à tous les écrans:

- **Mobile** (< 768px): 1 colonne, layout vertical
- **Tablet** (768px-1024px): 2 colonnes
- **Desktop** (> 1024px): 3 colonnes

Stats cards:
- Mobile: Empilées verticalement
- Desktop: 3 colonnes côte à côte

## 🎯 Prochaines Étapes

### Améliorer le Dashboard
- [ ] Ajouter un bouton "Sign Out" dans le header
- [ ] Ajouter une section "Badges débloqués"
- [ ] Ajouter une section "Recommandations"
- [ ] Ajouter des stats "Jours de suite" (streak)
- [ ] Ajouter une section "Leaderboard"

### Intégrer les Modules
- [ ] Créer `app/(modules)/[id]/page.tsx`
- [ ] Afficher les leçons du module
- [ ] Afficher les exercices
- [ ] Intégrer l'éditeur Monaco
- [ ] Intégrer le simulateur Wokwi

### Gamification
- [ ] Système de badges
- [ ] Achievements
- [ ] Streak counter
- [ ] Daily challenges

## 📊 Component Structure

```
app/(dashboard)/page.tsx
├── Server Component (async)
├── getCurrentUser()
├── getUserProfile()
├── getUserProgress()
├── getModules()
├── Header Section
│   ├── Welcome message
│   └── Stats Cards (3)
├── Level Progress Bar
├── Overall Progress Bar
└── Modules Grid
    └── Module Cards (N)
        ├── Status Badge
        ├── Module Content
        └── Module Order
```

## 🔌 Intégration avec Autres Pages

### Liens vers les modules
Chaque carte clique vers `/modules/{module_id}`:
```typescript
href={isLocked ? '#' : `/modules/${module.id}`}
```

Crée la page `app/(modules)/[id]/page.tsx` pour afficher les leçons/exercices.

### Mise à jour de la progress
Quand l'utilisateur complète un exercice:
1. Appelle `updateModuleProgress()`
2. Appelle `updateUserXP()`
3. Le dashboard se remet à jour au prochain refresh

### Auto-unlock des modules
Quand progress passe à 'completed':
1. Appelle `unlockNextModule()`
2. Crée une progress row pour le module suivant
3. Le dashboard affiche le nouveau module débloqué

## 📚 Code Snippets

### Récupérer les données (Server Component)
```typescript
const profile = await getUserProfile(user.id);
const progress = await getUserProgress(user.id);
const modules = await getModules();
```

### Calculer le pourcentage
```typescript
const completedCount = allProgress.filter(p => p.statut === 'completed').length;
const progressPercentage = Math.round((completedCount / modules.length) * 100);
```

### Déterminer le statut d'un module
```typescript
const userProgress = allProgress.find(p => p.module_id === module.id);
const status = userProgress?.statut || 'locked'; // 'locked', 'in_progress', 'completed'
```

## 🚀 Déployer en Production

### Sur Vercel
```bash
1. git push
2. Vercel redéploie automatiquement
3. Vérifie les logs si erreur
```

### Variables d'environnement
Vercel doit avoir:
```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

## ✅ Checklist Final

- [ ] Dashboard accessible à http://localhost:3000/dashboard
- [ ] Affiche ton pseudo correctement
- [ ] Affiche ton niveau correctement
- [ ] Affiche ton XP totale correctement
- [ ] Affiche les modules correctement
- [ ] Les modules verrouillés sont grisés
- [ ] Les modules complétés ont une bordure verte
- [ ] Le layout est responsive
- [ ] Pas d'erreurs dans la console
- [ ] Les couleurs sont vives et attrayantes
- [ ] Les emojis s'affichent correctement

---

**Dashboard complète! 🎉 Prêt pour les prochaines étapes!**
