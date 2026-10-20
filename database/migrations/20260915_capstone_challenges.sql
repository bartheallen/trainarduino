-- Idempotent capstone setup for the five-module milestones.
-- Review and apply in Supabase SQL Editor. No user data is deleted.

ALTER TABLE modules
  ADD COLUMN IF NOT EXISTS is_capstone BOOLEAN NOT NULL DEFAULT false;

UPDATE modules
SET is_capstone = true
WHERE ordre IN (5, 10, 15);

INSERT INTO exercises (
  module_id,
  titre,
  enonce,
  critere_correction,
  exemple_solution,
  circuit_instructions,
  xp_recompense,
  difficulte,
  wokwi_project_url,
  ordre
)
SELECT
  module_id,
  titre,
  enonce,
  critere_correction,
  NULL,
  circuit_instructions,
  150,
  'medium',
  NULL,
  1
FROM (
  VALUES
    (
      (SELECT id FROM modules WHERE ordre = 5 LIMIT 1),
      'Défi synthèse : veilleuse intelligente',
      'Concevez une veilleuse qui utilise une LED, un bouton et un potentiomètre. Le bouton doit permettre de changer le comportement de la LED et le potentiomètre doit influencer son intensité ou son seuil d’allumage. Le programme doit rester lisible et fonctionner sans solution fournie.',
      'Le code contient setup() et loop(), configure une sortie LED et une entrée bouton, lit une valeur analogique sur A0, utilise digitalRead() et commande la LED. Le comportement est conçu par l’apprenant.',
      'LED sur une sortie numérique, bouton entre la broche d’entrée et GND avec INPUT_PULLUP, potentiomètre entre 5V et GND avec curseur sur A0.'
    ),
    (
      (SELECT id FROM modules WHERE ordre = 10 LIMIT 1),
      'Défi synthèse : poste de mesure',
      'Construisez un poste de mesure Arduino qui lit un capteur analogique, signale un dépassement par une LED et publie une mesure lisible sur le moniteur série. Choisissez un seuil cohérent et expliquez votre comportement dans le code.',
      'Le code configure les broches, lit analogRead(), initialise Serial, affiche une mesure et commande une sortie selon un seuil.',
      'Capteur analogique sur A0, LED sur une sortie numérique et moniteur série à 9600 bauds.'
    ),
    (
      (SELECT id FROM modules WHERE ordre = 15 LIMIT 1),
      'Défi synthèse : système réactif',
      'Réalisez un système réactif qui surveille une entrée, met à jour une sortie sans bloquer les autres actions et réagit proprement à un événement bref. Privilégiez millis() et une routine d’interruption courte si le montage le justifie.',
      'Le code utilise setup() et loop(), évite un long delay() pour la logique principale, mesure le temps avec millis() et garde les actions d’interruption courtes si une interruption est utilisée.',
      'Une entrée événementielle, une LED de signalisation et une sortie série facultative pour observer les changements.'
    )
) AS challenge(module_id, titre, enonce, critere_correction, circuit_instructions)
WHERE module_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM exercises existing
    WHERE existing.module_id = challenge.module_id
      AND existing.titre = challenge.titre
  );
