-- Mise à jour du contenu pédagogique des leçons des modules 11 à 15.
-- À exécuter dans Supabase SQL Editor après relecture.

UPDATE lessons
SET contenu = '# # Comprendre ce qu''est Arduino

## Objectifs
- comprendre ce qu''est une carte Arduino ;
- voir pourquoi elle est utile pour apprendre l''électronique et la programmation ;
- relier un premier programme à un comportement concret sur une LED.

## Prérequis
- aucun, si vous débutez complètement.

## Explication
Arduino est une plateforme de prototypage. Elle permet de lire des capteurs, d''allumer des composants et de réagir à ce qui se passe dans le monde réel. On peut la comparer à un petit cerveau qui reçoit des informations et envoie des ordres.

Pour bien progresser, il faut garder une idée simple : le code n''est pas isolé. Il sert à agir sur un circuit physique. Une LED, un bouton ou un capteur sont des composants concrets que le programme contrôle.

## Exemple concret
Imaginez une LED connectée à la carte. Quand vous écrivez un programme, vous dites à la carte : « allume cette LED », puis « éteins la », puis répète cette action.

## Code
```cpp
void setup() {
  pinMode(13, OUTPUT);
}

void loop() {
  digitalWrite(13, HIGH);
  delay(500);
  digitalWrite(13, LOW);
  delay(500);
}
```

## Explication du code
- `pinMode(13, OUTPUT)` prépare la broche 13 pour envoyer un signal.
- `digitalWrite(13, HIGH)` allume la LED.
- `digitalWrite(13, LOW)` l''éteint.
- `delay(500)` fait une pause de 500 millisecondes.

## Erreurs fréquentes
- oublier `pinMode()` avant d''utiliser une broche en sortie ;
- confondre `HIGH` et `LOW` ;
- croire que le programme fonctionne sans composant physique branché.

## Mini-défi
Modifiez le programme pour que la LED reste allumée 1 seconde, puis s''éteigne 1 seconde.

## Résultat attendu
Vous devez voir une LED clignoter à intervalle régulier.

## À retenir
- Arduino sert à piloter des composants réels.
- un programme se lit souvent comme une suite d''actions répétées.
- une LED peut être contrôlée avec une simple logique d''allumage et d''extinction.'
WHERE module_id = 11 AND titre = ''What is Arduino?'';

UPDATE lessons
SET contenu = '# # Comprendre la fonction setup()

## Objectifs
- comprendre le rôle de `setup()` ;
- savoir configurer une broche avec `pinMode()` ;
- initialiser un moniteur série de façon simple.

## Prérequis
- la notion de base d''une carte Arduino et d''une broche de sortie.

## Explication
La fonction `setup()` s''exécute une seule fois au démarrage. Elle sert à préparer le programme avant que le comportement principal ne commence. C''est le moment où vous indiquez à la carte ce qu''elle doit faire au départ.

Dans la leçon précédente, nous avons vu qu''un programme peut allumer une LED. Ici, nous apprenons à préparer correctement cette action.

## Exemple concret
Avant d''allumer une LED, il faut dire à la carte que la broche utilisée est une sortie. Sans cette étape, le programme ne sait pas quoi faire avec cette broche.

## Code
```cpp
void setup() {
  pinMode(13, OUTPUT);
  Serial.begin(9600);
  digitalWrite(13, LOW);
}

void loop() {
  digitalWrite(13, HIGH);
  delay(250);
  digitalWrite(13, LOW);
  delay(250);
}
```

## Explication du code
- `pinMode(13, OUTPUT)` prépare la broche 13 pour envoyer un signal.
- `Serial.begin(9600)` active la communication série à 9600 bauds.
- `digitalWrite(13, LOW)` met la LED à l''état éteint au départ.

## Erreurs fréquentes
- oublier `pinMode()` avant d''utiliser une broche ;
- écrire `Serial.begin()` dans `loop()` au lieu de `setup()` ;
- penser que `setup()` se répète.

## Mini-défi
Ajoutez une seconde ligne dans `setup()` pour afficher un message au moniteur série au démarrage.

## Résultat attendu
Au démarrage, la broche est configurée, la communication série est prête, et la LED commence à l''état éteint.

## À retenir
- `setup()` sert à initialiser le programme.
- il faut configurer les broches avant de les utiliser.
- un bon démarrage rend le programme plus fiable.'
WHERE module_id = 11 AND titre = ''The Setup Function'';

UPDATE lessons
SET contenu = '# # Comprendre la fonction loop()

## Objectifs
- comprendre le rôle de `loop()` ;
- voir comment un programme Arduino exécute des actions répétées ;
- créer un comportement simple avec une LED.

## Prérequis
- savoir que `setup()` initialise le programme ;
- savoir qu''une broche peut être configurée comme sortie.

## Explication
La fonction `loop()` tourne en permanence tant que la carte reste alimentée. C''est dans cette boucle que le programme réalise les actions principales. Dans la leçon précédente, nous avons préparé les broches. Ici, nous utilisons cette préparation pour faire agir le circuit.

## Exemple concret
Un système simple peut allumer puis éteindre une LED à intervalles réguliers. Ce comportement est souvent le premier programme que l''on écrit sur Arduino.

## Code
```cpp
void setup() {
  pinMode(13, OUTPUT);
}

void loop() {
  digitalWrite(13, HIGH);
  delay(1000);
  digitalWrite(13, LOW);
  delay(1000);
}
```

## Explication du code
- `digitalWrite(13, HIGH)` allume la LED.
- `delay(1000)` fait une pause d''une seconde.
- `digitalWrite(13, LOW)` l''éteint à nouveau.

## Erreurs fréquentes
- mettre le code utile dans `setup()` au lieu de `loop()` ;
- oublier que `loop()` se répète sans fin ;
- utiliser trop de `delay()` quand plusieurs actions doivent être gérées en même temps.

## Mini-défi
Modifiez le programme pour que la LED reste allumée pendant 300 millisecondes puis éteinte pendant 700 millisecondes.

## Résultat attendu
La LED clignote avec un rythme différent de celui du programme de base.

## À retenir
- `loop()` contient le comportement principal du programme.
- il se répète en continu.
- c''est le bon endroit pour faire bouger le programme au fil du temps.'
WHERE module_id = 11 AND titre = ''The Loop Function'';

UPDATE lessons
SET contenu = '# # Comprendre les broches numériques

## Objectifs
- distinguer une broche en entrée et une broche en sortie ;
- comprendre les états `HIGH` et `LOW` ;
- utiliser `pinMode()` pour configurer une broche.

## Prérequis
- la notion de base d''une LED et d''une alimentation.

## Explication
Une broche numérique peut jouer deux rôles principaux. En sortie, elle peut envoyer un signal à un composant comme une LED. En entrée, elle peut recevoir un signal venant d''un bouton ou d''un capteur. La fonction `pinMode()` indique précisément le rôle de la broche.

Dans la leçon précédente, nous avons vu comment allumer une LED. Ici, nous allons comprendre pourquoi il faut définir le rôle de la broche avant d''agir dessus.

## Exemple concret
Une LED peut être allumée par une broche configurée en sortie. Un bouton peut être lu par une broche configurée en entrée.

## Code
```cpp
void setup() {
  pinMode(13, OUTPUT);
  pinMode(2, INPUT);
}

void loop() {
  digitalWrite(13, HIGH);
  delay(200);
  digitalWrite(13, LOW);
  delay(200);
}
```

## Explication du code
- `pinMode(13, OUTPUT)` dit que la broche 13 enverra un signal.
- `pinMode(2, INPUT)` dit que la broche 2 sera utilisée pour lire un état.
- `digitalWrite(13, HIGH)` allume la LED.

## Erreurs fréquentes
- configurer une broche en sortie alors qu''elle doit lire une valeur ;
- utiliser `digitalWrite()` sur une broche en entrée ;
- oublier que `HIGH` et `LOW` sont des états logiques simples.

## Mini-défi
Remplacez la broche de sortie par une autre broche numérique et vérifiez que le programme reste fonctionnel.

## Résultat attendu
Vous comprenez que la configuration de la broche change complètement le comportement du programme.

## À retenir
- une broche peut être entrée ou sortie.
- `pinMode()` choisit ce rôle.
- `HIGH` et `LOW` représentent deux états simples.'
WHERE module_id = 12 AND titre = ''Digital Pins: INPUT and OUTPUT'';

UPDATE lessons
SET contenu = '# # Lire un bouton avec un programme simple

## Objectifs
- comprendre la différence entre un bouton et une LED ;
- lire un état logique avec `digitalRead()` ;
- utiliser `INPUT_PULLUP` de façon correcte.

## Prérequis
- savoir qu''une broche peut être configurée en entrée ;
- savoir que `HIGH` et `LOW` représentent des états logiques.

## Explication
Un bouton permet de produire un signal simple. Quand il est relâché, la broche ne reçoit pas la même tension que lorsqu''il est pressé. C''est pourquoi nous devons configurer la broche correctement.

Quand vous utilisez `INPUT_PULLUP`, la logique est inversée. Le bouton relâché donne `HIGH`, tandis que le bouton pressé donne `LOW`. Cette inversion est importante car elle peut surprendre un débutant.

## Exemple concret
Un bouton peut servir à allumer une LED quand l''utilisateur appuie dessus.

## Code
```cpp
void setup() {
  pinMode(13, OUTPUT);
  pinMode(2, INPUT_PULLUP);
  Serial.begin(9600);
}

void loop() {
  int etatBouton = digitalRead(2);

  if (etatBouton == LOW) {
    digitalWrite(13, HIGH);
    Serial.println("Bouton appuye");
  } else {
    digitalWrite(13, LOW);
  }
}
```

## Explication du code
- `pinMode(2, INPUT_PULLUP)` configure la broche 2 comme entrée avec une résistance interne.
- `digitalRead(2)` lit l''état du bouton.
- `etatBouton == LOW` signifie que le bouton est pressé.

## Erreurs fréquentes
- croire que `INPUT_PULLUP` donne la même logique qu''une simple entrée ;
- oublier de tester le comportement réel du bouton ;
- ne pas vérifier la polarité du circuit.

## Mini-défi
Modifiez le programme pour que la LED s''allume seulement si le bouton est relâché.

## Résultat attendu
La LED réagit à l''action du bouton et le moniteur série affiche un message au moment de l''appui.

## À retenir
- `INPUT_PULLUP` rend la lecture plus stable.
- bouton relâché = `HIGH` ; bouton appuyé = `LOW`.
- `digitalRead()` sert à lire un état logique.'
WHERE module_id = 12 AND titre = ''Reading Buttons'';

UPDATE lessons
SET contenu = '# # Comprendre les signaux analogiques

## Objectifs
- comprendre la différence entre un signal numérique et un signal analogique ;
- utiliser `analogRead()` ;
- lire une valeur variable issue d''un capteur.

## Prérequis
- savoir qu''une broche peut être utilisée pour lire un état ;
- savoir qu''un programme peut afficher des valeurs dans le moniteur série.

## Explication
Un signal analogique peut prendre de nombreuses valeurs. Contrairement à un bouton qui donne seulement deux états, un capteur analogique peut donner une valeur plus précise. Par exemple, un potentiomètre peut produire une valeur comprise entre 0 et 1023.

Dans la leçon précédente, nous avons vu comment lire un bouton. Ici, nous allons aller plus loin en lisant une valeur continue.

## Exemple concret
Un potentiomètre ou un capteur de lumière peut fournir une valeur variable. Le programme peut ensuite réagir à cette valeur.

## Code
```cpp
void setup() {
  Serial.begin(9600);
}

void loop() {
  int valeur = analogRead(A0);
  Serial.println(valeur);
  delay(200);
}
```

## Explication du code
- `analogRead(A0)` lit la valeur sur la broche analogique A0.
- la valeur lue est comprise entre 0 et 1023.
- `Serial.println()` affiche cette valeur dans le moniteur série.

## Erreurs fréquentes
- utiliser une broche numérique alors que la lecture analogique attend une entrée analogique ;
- oublier d''ouvrir le moniteur série ;
- croire que la valeur est toujours identique.

## Mini-défi
Modifiez le programme pour afficher la valeur lue toutes les 500 millisecondes.

## Résultat attendu
Vous voyez des valeurs qui changent lorsque vous manipulez le composant.

## À retenir
- un signal analogique est plus fin qu''un signal binaire.
- `analogRead()` lit une valeur variable.
- les valeurs analogiques sont très utiles pour mesurer le monde réel.'
WHERE module_id = 13 AND titre = ''Understanding Analog Signals'';

UPDATE lessons
SET contenu = '# # Lire un potentiomètre

## Objectifs
- relier une valeur analogique à un composant physique ;
- comprendre l''intérêt d''un potentiomètre ;
- afficher une lecture de manière simple et claire.

## Prérequis
- savoir que `analogRead()` lit une valeur variable ;
- savoir que le moniteur série permet d''observer cette valeur.

## Explication
Un potentiomètre est un composant qui change sa résistance quand on le tourne. Ce changement influe sur la tension lue par la carte. C''est un bon exemple de capteur analogique simple.

Dans la leçon précédente, nous avons vu que `analogRead()` donne une valeur. Ici, nous appliquons cette notion à un composant concret.

## Exemple concret
Quand vous tournez le potentiomètre, la valeur lue par la carte change. Vous pouvez observer cette variation dans le moniteur série.

## Code
```cpp
void setup() {
  Serial.begin(9600);
}

void loop() {
  int valeur = analogRead(A0);
  Serial.print("Valeur lue : ");
  Serial.println(valeur);
  delay(100);
}
```

## Explication du code
- `analogRead(A0)` lit la valeur du potentiomètre.
- `Serial.print()` écrit un texte sans retour à la ligne.
- `Serial.println()` termine la ligne avec un retour à la ligne.

## Erreurs fréquentes
- confondre une lecture analogique avec une lecture numérique ;
- oublier de brancher le potentiomètre correctement ;
- ne pas regarder le moniteur série au bon moment.

## Mini-défi
Modifiez le programme pour afficher seulement la valeur lue, sans texte supplémentaire.

## Résultat attendu
Vous observez des valeurs qui varient quand vous tournez le potentiomètre.

## À retenir
- un potentiomètre est un capteur analogique simple.
- `analogRead()` lit une valeur variable.
- le moniteur série aide à comprendre ce qui se passe.'
WHERE module_id = 13 AND titre = ''Reading a Potentiometer'';

UPDATE lessons
SET contenu = '# # Comprendre la communication série

## Objectifs
- comprendre ce qu''est le moniteur série ;
- utiliser `Serial.begin()` ;
- afficher des informations utiles pour déboguer.

## Prérequis
- savoir ce qu''est un programme Arduino et une boucle `loop()`.

## Explication
Le moniteur série est un outil très important. Il permet de voir ce que fait le programme en temps réel. Sans lui, il est souvent plus difficile de comprendre un problème. C''est un peu une fenêtre ouverte sur le fonctionnement interne de la carte.

Dans la leçon précédente, nous avons vu comment lire des valeurs. Ici, nous allons les afficher proprement.

## Exemple concret
Un programme peut afficher la valeur d''un capteur ou confirmer qu''un bouton est détecté.

## Code
```cpp
void setup() {
  Serial.begin(9600);
}

void loop() {
  Serial.println("Bonjour depuis Arduino");
  delay(1000);
}
```

## Explication du code
- `Serial.begin(9600)` démarre la communication série.
- `Serial.println()` envoie un message vers le moniteur série.
- `delay(1000)` fait une pause d''une seconde.

## Erreurs fréquentes
- oublier d''ouvrir le moniteur série ;
- utiliser un mauvais débit de communication ;
- croire que le programme affiche sans initialisation préalable.

## Mini-défi
Modifiez le programme pour afficher un message différent à chaque seconde.

## Résultat attendu
Vous voyez des messages apparaître régulièrement dans le moniteur série.

## À retenir
- le moniteur série aide à observer le programme.
- `Serial.begin()` est la première étape.
- `Serial.println()` est pratique pour afficher des messages.'
WHERE module_id = 14 AND titre = ''Serial Communication Basics'';

UPDATE lessons
SET contenu = '# # Envoyer et recevoir des données

## Objectifs
- comprendre la différence entre envoyer et recevoir ;
- utiliser `Serial.available()` et `Serial.read()` ;
- créer une interaction simple entre la carte et l''ordinateur.

## Prérequis
- savoir ce qu''est le moniteur série ;
- savoir que le programme peut lire et écrire des données.

## Explication
Une fois la communication série lancée, la carte peut non seulement envoyer des données, mais aussi recevoir des informations. Cela est utile pour un système de débogage ou pour contrôler un comportement depuis l''ordinateur.

Dans la leçon précédente, nous avons vu comment afficher des messages. Ici, nous utilisons la même communication pour recevoir une commande.

## Exemple concret
L''ordinateur envoie une lettre au programme. La carte l''affiche ensuite dans le moniteur série.

## Code
```cpp
void setup() {
  Serial.begin(9600);
}

void loop() {
  if (Serial.available() > 0) {
    char donnee = Serial.read();
    Serial.print("Vous avez envoye : ");
    Serial.println(donnee);
  }
}
```

## Explication du code
- `Serial.available()` vérifie si des données sont prêtes à être lues.
- `Serial.read()` lit un octet de caractère.
- `Serial.println()` affiche ensuite la valeur lue.

## Erreurs fréquentes
- oublier de vérifier si des données sont disponibles ;
- croire que `Serial.read()` lit immédiatement une chaîne complète ;
- ne pas utiliser le bon format d''affichage.

## Mini-défi
Modifiez le programme pour afficher un message différent si la lettre reçue est `A`.

## Résultat attendu
La carte répond à l''ordinateur et confirme la donnée reçue.

## À retenir
- la communication série peut être bidirectionnelle.
- `Serial.available()` sert à vérifier s''il y a des données.
- `Serial.read()` lit les informations reçues.'
WHERE module_id = 14 AND titre = ''Sending and Receiving Data'';

UPDATE lessons
SET contenu = '# # Comprendre `millis()` et `delay()`

## Objectifs
- comprendre pourquoi `delay()` peut bloquer un programme ;
- utiliser `millis()` pour mesurer du temps sans bloquer la boucle principale ;
- relier cette notion à une tâche concrète comme lire un bouton.

## Prérequis
- savoir ce qu''est une boucle `loop()` ;
- savoir comment lire un bouton avec `digitalRead()`.

## Explication
`delay()` fait une pause complète. Pendant cette pause, la carte ne fait presque rien d''autre. Ce comportement est simple, mais il peut devenir un problème quand plusieurs choses doivent se produire en même temps.

`millis()` ne bloque pas l''exécution. Il mesure le temps écoulé depuis le démarrage de la carte. Le programme peut donc continuer à surveiller un bouton, un capteur ou d''autres actions pendant que le temps avance.

## Exemple concret
Nous allons faire clignoter une LED à chaque seconde, tout en continuant à surveiller un bouton.

## Code
```cpp
const unsigned long interval = 1000;
unsigned long previousMillis = 0;
bool ledState = false;

void setup() {
  pinMode(13, OUTPUT);
  pinMode(2, INPUT_PULLUP);
  Serial.begin(9600);
}

void loop() {
  unsigned long currentMillis = millis();

  if (currentMillis - previousMillis >= interval) {
    previousMillis = currentMillis;
    ledState = !ledState;
    digitalWrite(13, ledState ? HIGH : LOW);
  }

  int buttonState = digitalRead(2);
  if (buttonState == LOW) {
    Serial.println("Bouton appuye");
  }
}
```

## Explication du code
- `previousMillis` garde en mémoire le moment du dernier changement.
- `currentMillis` donne le temps actuel.
- l''instruction `if` vérifie si un intervalle de 1 seconde s''est écoulé.
- pendant ce temps, le programme continue à surveiller le bouton.

## Erreurs fréquentes
- utiliser `delay()` dans l''exemple principal alors que l''objectif est de montrer un code non bloquant ;
- oublier d''actualiser `previousMillis` ;
- croire que `millis()` remplace simplement `delay()` sans changer la logique du programme.

## Mini-défi
Modifiez le programme pour que la LED clignote toutes les 500 millisecondes.

## Résultat attendu
La LED change d''état régulièrement, tandis que le bouton continue d''être surveillé.

## À retenir
- `delay()` bloque l''exécution.
- `millis()` mesure le temps sans bloquer la boucle principale.
- un programme non bloquant reste réactif à d''autres événements.'
WHERE module_id = 15 AND titre = ''Understanding millis() vs delay()'';

UPDATE lessons
SET contenu = '# # Introduction aux interruptions

## Objectifs
- comprendre ce qu''est une interruption ;
- savoir pourquoi elle existe ;
- utiliser `attachInterrupt()` et une fonction ISR de façon simple.

## Prérequis
- savoir qu''un programme Arduino exécute une boucle `loop()` ;
- savoir qu''une broche peut être lue avec `digitalRead()`.

## Explication
Une interruption est un mécanisme qui permet à la carte de réagir immédiatement à un événement important. Au lieu d''attendre la fin d''un autre traitement, la carte interrompt temporairement le programme principal pour exécuter une action rapide.

Cette idée est utile lorsqu''un bouton doit être traité immédiatement ou lorsqu''un capteur change d''état très vite.

## Exemple concret
Un bouton pressé peut déclencher une interruption. La fonction de service d''interruption, ou ISR, exécute alors une action courte.

## Code
```cpp
volatile bool flag = false;

void setup() {
  pinMode(2, INPUT_PULLUP);
  pinMode(13, OUTPUT);
  attachInterrupt(digitalPinToInterrupt(2), toggleLed, FALLING);
}

void loop() {
  if (flag) {
    flag = false;
    digitalWrite(13, HIGH);
    delay(200);
    digitalWrite(13, LOW);
  }
}

void toggleLed() {
  flag = true;
}
```

## Explication du code
- `attachInterrupt()` branche une interruption à la broche 2.
- `toggleLed()` est la fonction appelée lorsque l''événement se produit.
- une ISR doit rester courte et ne pas contenir de code trop lourd.

## Erreurs fréquentes
- mettre trop de code dans l''ISR ;
- modifier des variables sans les déclarer comme `volatile` ;
- croire qu''une interruption remplace complètement la logique du programme principal.

## Mini-défi
Modifiez l''exemple pour que l''interruption allume la LED pendant 1 seconde au lieu de 200 millisecondes.

## Résultat attendu
Le programme réagit rapidement à l''événement, puis reprend le reste de son comportement.

## À retenir
- une interruption réagit vite à un événement important.
- `attachInterrupt()` branche cette réaction.
- une ISR doit rester courte et simple.'
WHERE module_id = 15 AND titre = ''Introduction to Interrupts'';
