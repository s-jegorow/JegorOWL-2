const int POT_PIN = A0;
const int BUTTON_PIN = 2;
const int POT_THRESHOLD = 4;
const unsigned long DEBOUNCE_MS = 20;

int lastPotValue = -1;
int lastButtonState = HIGH;
unsigned long lastButtonChange = 0;

void readPot() {
  int value = analogRead(POT_PIN);
  if (abs(value - lastPotValue) < POT_THRESHOLD) return;

  lastPotValue = value;
  Serial.print("pot1:");
  Serial.println(value);
}

void readButton() {
  int state = digitalRead(BUTTON_PIN);
  if (state == lastButtonState) return;
  if (millis() - lastButtonChange < DEBOUNCE_MS) return;

  lastButtonChange = millis();
  lastButtonState = state;

  Serial.print("btn1:");
  Serial.println(state == LOW ? 1 : 0);
}

void setup() {
  Serial.begin(115200);
  pinMode(BUTTON_PIN, INPUT_PULLUP);
}

void loop() {
  readPot();
  readButton();
}
