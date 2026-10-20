-- Compact, mobile-first course copy for the existing Arduino foundations path.
-- Review in Supabase SQL Editor before running. It changes content only.

UPDATE lessons SET contenu = '# Arduino en une idée

Arduino lit le monde (bouton, capteur) et commande des composants (LED, moteur).

## À retenir
- `setup()` prépare la carte une fois.
- `loop()` répète le comportement.

## Premier signal
```cpp
void setup() { pinMode(LED_BUILTIN, OUTPUT); }
void loop() { digitalWrite(LED_BUILTIN, HIGH); }
```

**Mini-défi :** remplacez `HIGH` par `LOW`. Que voyez-vous ?' WHERE module_id = 11 AND titre = 'What is Arduino?';

UPDATE lessons SET contenu = '# `setup()` : préparer

`setup()` ne s’exécute qu’au démarrage. Configurez-y les broches et la liaison série.

```cpp
void setup() {
  pinMode(LED_BUILTIN, OUTPUT);
  Serial.begin(9600);
}
```

**Piège :** une broche doit être configurée avant d’être utilisée.' WHERE module_id = 11 AND titre = 'The Setup Function';

UPDATE lessons SET contenu = '# `loop()` : répéter

Après `setup()`, Arduino recommence `loop()` sans fin.

```cpp
void loop() {
  digitalWrite(LED_BUILTIN, HIGH); delay(500);
  digitalWrite(LED_BUILTIN, LOW);  delay(500);
}
```

**Mini-défi :** essayez 200 ms puis 800 ms.' WHERE module_id = 11 AND titre = 'The Loop Function';

UPDATE lessons SET contenu = '# Broches numériques

Une sortie commande (`OUTPUT` + `digitalWrite`). Une entrée lit (`INPUT` + `digitalRead`).

```cpp
pinMode(13, OUTPUT);
pinMode(2, INPUT_PULLUP);
```

`HIGH` est un état haut ; `LOW` un état bas.' WHERE module_id = 12 AND titre = 'Digital Pins: INPUT and OUTPUT';

UPDATE lessons SET contenu = '# Bouton : logique inversée

Avec `INPUT_PULLUP`, le bouton relâché lit `HIGH` et le bouton appuyé lit `LOW`.

```cpp
if (digitalRead(2) == LOW) {
  digitalWrite(13, HIGH);
}
```

**À retenir :** reliez le bouton à GND, pas à 5 V, avec `INPUT_PULLUP`.' WHERE module_id = 12 AND titre = 'Reading Buttons';

UPDATE lessons SET contenu = '# Lire une valeur analogique

Un bouton donne deux états. Un potentiomètre donne une valeur variable : de 0 à 1023 sur une Uno.

```cpp
int valeur = analogRead(A0);
Serial.println(valeur);
```

**Mini-défi :** observez la valeur pendant que vous tournez le potentiomètre.' WHERE module_id = 13 AND titre = 'Understanding Analog Signals';

UPDATE lessons SET contenu = '# Potentiomètre

Ses deux extrémités vont à 5 V et GND ; le curseur central va vers A0. Tourner le bouton change la tension lue.

```cpp
int position = analogRead(A0);
```

Ne branchez jamais un capteur analogique sur une sortie configurée en `OUTPUT`.' WHERE module_id = 13 AND titre = 'Reading a Potentiometer';

UPDATE lessons SET contenu = '# Moniteur série

Le port série est votre fenêtre de débogage. Commencez une seule fois, puis affichez dans `loop()`.

```cpp
void setup() { Serial.begin(9600); }
void loop() { Serial.println("signal OK"); delay(500); }
```

Le débit du moniteur doit correspondre à `9600`.' WHERE module_id = 14 AND titre = 'Serial Communication Basics';

UPDATE lessons SET contenu = '# Recevoir une commande

Vérifiez d’abord qu’une donnée existe ; `Serial.read()` lit un caractère.

```cpp
if (Serial.available() > 0) {
  char commande = Serial.read();
}
```

**Mini-défi :** allumez une LED si la commande reçue est `A`.' WHERE module_id = 14 AND titre = 'Sending and Receiving Data';

UPDATE lessons SET contenu = '# Temps sans bloquer

`delay()` arrête tout. `millis()` permet de mesurer le temps tout en continuant à lire un bouton ou un capteur.

```cpp
if (millis() - precedent >= 500) {
  precedent = millis();
  etatLed = !etatLed;
}
```

Utilisez `unsigned long` pour les temps.' WHERE module_id = 15 AND titre = 'Understanding millis() vs delay()';

UPDATE lessons SET contenu = '# Interruption : réaction brève

Une interruption signale un événement rapide. L’ISR ne doit faire qu’une action très courte.

```cpp
volatile bool appui = false;
void signalerAppui() { appui = true; }
```

Évitez `delay()` et `Serial.println()` dans une ISR.' WHERE module_id = 15 AND titre = 'Introduction to Interrupts';
