-- ============================================================================
-- SAMPLE DATA FOR TRAINARDUINO
-- ============================================================================
-- This file contains sample data to seed the database with example modules,
-- lessons, and exercises for testing purposes.
--
-- HOW TO USE:
-- 1. Run MIGRATIONS_SETUP.md first to create tables
-- 2. Go to Supabase SQL Editor
-- 3. Create a new query
-- 4. Copy the relevant sections below
-- 5. Run to populate sample data
--
-- NOTE: This is optional! Only run if you want sample data.
-- ============================================================================

-- ============================================================================
-- SAMPLE MODULES
-- ============================================================================
INSERT INTO modules (titre, description, ordre, palier_test) VALUES
  (
    'Arduino Basics',
    'Learn the fundamentals of Arduino programming. Understand the board, setup() function, loop() function, and basic digital operations.',
    1,
    1
  ),
  (
    'Digital Input/Output',
    'Master digital pins! Learn to read buttons and control LEDs. Perfect for understanding the basics of microcontroller I/O.',
    2,
    1
  ),
  (
    'Analog Input',
    'Work with analog sensors like potentiometers and light sensors. Learn about ADC (Analog-to-Digital Conversion).',
    3,
    2
  ),
  (
    'Serial Communication',
    'Communicate between Arduino and your computer using serial. Debug your code and create interactive programs.',
    4,
    2
  ),
  (
    'Timers and Interrupts',
    'Control timing precisely using millis(), delayMicroseconds(), and interrupts. Build responsive applications.',
    5,
    3
  );

-- ============================================================================
-- SAMPLE LESSONS FOR MODULE 1
-- ============================================================================
INSERT INTO lessons (module_id, titre, contenu, ordre) VALUES
  (
    1,
    'What is Arduino?',
    '# What is Arduino?

Arduino is an open-source electronics platform based on easy-to-use hardware and software. It was created in Italy in 2005 and is used by millions of developers worldwide.

## Key Points:
- Affordable microcontroller board
- Open-source hardware and software
- Large community and tons of tutorials
- Perfect for beginners and experts
- Can control lights, motors, sensors, and more

## Why Learn Arduino?
1. Learn electronics without expensive equipment
2. Build real projects that interact with the physical world
3. Skills transfer to more complex embedded systems
4. Fun and practical!',
    1
  ),
  (
    1,
    'The Setup Function',
    '# The setup() Function

The setup() function runs ONCE when the Arduino powers on or resets. Use it to initialize your pins and serial communication.

## Syntax:
```cpp
void setup() {
  // Your initialization code here
}
```

## Common setup() Operations:
- Configure pins as INPUT or OUTPUT using pinMode()
- Initialize serial communication with Serial.begin()
- Set initial pin states with digitalWrite()
- Configure interrupts

## Example:
```cpp
void setup() {
  pinMode(13, OUTPUT);      // Pin 13 as output
  Serial.begin(9600);       // Start serial at 9600 baud
  digitalWrite(13, LOW);    // Set pin 13 to LOW
}
```',
    2
  ),
  (
    1,
    'The Loop Function',
    '# The loop() Function

The loop() function runs repeatedly after setup() completes. This is where your main program logic goes.

## Syntax:
```cpp
void loop() {
  // Your code runs repeatedly
}
```

## Key Characteristics:
- Runs continuously, forever
- Only stops if power is disconnected
- Perfect for reading sensors and controlling outputs
- Try to keep it fast (responsive)

## Example:
```cpp
void loop() {
  digitalWrite(13, HIGH);   // Turn LED on
  delay(1000);              // Wait 1 second
  digitalWrite(13, LOW);    // Turn LED off
  delay(1000);              // Wait 1 second
}
```

This code creates a blinking LED with 1-second intervals.',
    3
  );

-- ============================================================================
-- SAMPLE EXERCISES FOR MODULE 1
-- ============================================================================
INSERT INTO exercises (module_id, titre, enonce, critere_correction, exemple_solution, xp_recompense, difficulte, ordre) VALUES
  (
    1,
    'Blink an LED',
    '# Exercise: Blink an LED

Make an LED on pin 13 blink with a 1-second interval (on for 1 second, off for 1 second).

## Hints:
- Use digitalWrite(13, HIGH) to turn on the LED
- Use digitalWrite(13, LOW) to turn off the LED
- Use delay(1000) to wait 1 second
- Put the code in the loop() function

## Grading Criteria:
- LED should blink
- Blink pattern should be 1 second on, 1 second off
- Code should use pinMode() in setup()
- Code should be clean and readable',
    'void setup() {
  pinMode(13, OUTPUT);
}

void loop() {
  digitalWrite(13, HIGH);
  delay(1000);
  digitalWrite(13, LOW);
  delay(1000);
}',
    50,
    'easy',
    1
  ),
  (
    1,
    'Print to Serial',
    '# Exercise: Print to Serial

Write a program that prints "Hello, Arduino!" to the serial monitor every 2 seconds.

## Hints:
- Use Serial.begin(9600) in setup()
- Use Serial.println() to print with a newline
- Use delay(2000) to wait 2 seconds

## Grading Criteria:
- Message prints to serial monitor
- Prints every 2 seconds
- Message is exactly "Hello, Arduino!"
- Code is clean',
    'void setup() {
  Serial.begin(9600);
}

void loop() {
  Serial.println("Hello, Arduino!");
  delay(2000);
}',
    50,
    'easy',
    2
  ),
  (
    1,
    'Variable Counter',
    '# Exercise: Variable Counter

Create a counter that increments from 0 to 10, printing each value to the serial monitor with a 1-second delay between each print.

## Hints:
- Declare a variable outside loop() that persists
- Use a loop or increment the variable manually
- Consider what happens when counter reaches 10

## Grading Criteria:
- Counter counts from 0 to 10
- Values print to serial every 1 second
- Counter behavior is consistent',
    'int counter = 0;

void setup() {
  Serial.begin(9600);
}

void loop() {
  Serial.println(counter);
  counter++;
  if (counter > 10) {
    counter = 0;
  }
  delay(1000);
}',
    75,
    'medium',
    3
  );

-- ============================================================================
-- SAMPLE LESSONS FOR MODULE 2
-- ============================================================================
INSERT INTO lessons (module_id, titre, contenu, ordre) VALUES
  (
    2,
    'Digital Pins: INPUT and OUTPUT',
    '# Digital Pins: INPUT and OUTPUT

Arduino pins can be configured as either INPUT or OUTPUT using the pinMode() function.

## OUTPUT Pins
Used to control things: LEDs, motors, buzzers, etc.
```cpp
pinMode(13, OUTPUT);
digitalWrite(13, HIGH);   // 5V
digitalWrite(13, LOW);    // 0V
```

## INPUT Pins
Used to read things: buttons, switches, sensors, etc.
```cpp
pinMode(2, INPUT);
int state = digitalRead(2);  // 0 or 1
```

## Voltage Levels
- HIGH = 5V (or 3.3V on some boards)
- LOW = 0V (ground)

## Pull-up Resistors
Use INPUT_PULLUP to enable internal pull-up resistor:
```cpp
pinMode(2, INPUT_PULLUP);  // Button won''t float
```',
    1
  ),
  (
    2,
    'Reading Buttons',
    '# Reading Buttons

Buttons are simple sensors that detect when pressed.

## Wiring:
- One side → Pin (e.g., pin 2)
- Other side → GND
- Optional: 10k pull-up resistor to 5V

## Code Example:
```cpp
void setup() {
  pinMode(2, INPUT_PULLUP);
  Serial.begin(9600);
}

void loop() {
  int buttonState = digitalRead(2);
  if (buttonState == LOW) {
    Serial.println("Button pressed!");
  }
  delay(50);  // Debounce
}
```

## Debouncing
Buttons can "bounce" (multiple signals) when pressed.
Always add a small delay (20-50ms) when reading buttons.',
    2
  );

-- ============================================================================
-- SAMPLE EXERCISES FOR MODULE 2
-- ============================================================================
INSERT INTO exercises (module_id, titre, enonce, critere_correction, exemple_solution, xp_recompense, difficulte, ordre) VALUES
  (
    2,
    'Control LED with Button',
    '# Exercise: Control LED with Button

Set up:
- Pin 13: LED (OUTPUT)
- Pin 2: Button (INPUT_PULLUP)

When button is pressed, turn LED on. When released, turn off.

## Hints:
- Use pinMode() for both pins
- Check button state in loop()
- Control LED based on button state

## Grading Criteria:
- LED turns on when button pressed
- LED turns off when button released
- No flickering or unexpected behavior',
    'void setup() {
  pinMode(13, OUTPUT);
  pinMode(2, INPUT_PULLUP);
}

void loop() {
  int buttonState = digitalRead(2);
  if (buttonState == LOW) {
    digitalWrite(13, HIGH);
  } else {
    digitalWrite(13, LOW);
  }
  delay(20);
}',
    75,
    'medium',
    1
  );

-- ============================================================================
-- SAMPLE POSITIONING TEST QUESTIONS (in comments, not in DB yet)
-- ============================================================================
-- Questions structure (for reference):
-- id, text, difficulty, options (JSON), correctAnswer (index)
--
-- Question 1 (easy):
--   text: "What does 'Arduino' primarily refer to?"
--   options: ["open-source electronics platform", "programming language", "robot toy", "3D printer"]
--   correctAnswer: 0
--
-- Question 2 (easy):
--   text: "What is the purpose of setup() function?"
--   options: ["configure pins and initialize", "loop continuously", "delay execution", "turn off Arduino"]
--   correctAnswer: 0
--
-- Question 3 (easy):
--   text: "Which function runs continuously?"
--   options: ["void setup()", "void loop()", "void init()", "void start()"]
--   correctAnswer: 1
--
-- Question 4 (medium):
--   text: "Correct syntax for setting pin as output?"
--   options: ["pinMode(pin, OUTPUT)", "setPin(pin, 1)", "digitalOutput(pin)", "pinMode(OUTPUT, pin)"]
--   correctAnswer: 0
--
-- Question 5 (medium):
--   text: "How do you read digital input?"
--   options: ["digitalRead(pin)", "readPin(pin)", "getDigital(pin)", "inputRead(pin)"]
--   correctAnswer: 0

-- ============================================================================
-- NOTES
-- ============================================================================
-- After inserting sample data:
-- 1. Test signup to create user
-- 2. User should see modules in dashboard
-- 3. User can click on Module 1
-- 4. User can see lessons and exercises
--
-- To add more modules/lessons/exercises:
-- 1. Copy the INSERT statements
-- 2. Modify values
-- 3. Keep the same structure
-- 4. Run in SQL Editor
--
-- To delete all sample data and start fresh:
-- DELETE FROM positioning_test_results;
-- DELETE FROM submissions;
-- DELETE FROM progress;
-- DELETE FROM exercises;
-- DELETE FROM lessons;
-- DELETE FROM modules;
