# Firebase Setup Instructions

## Krok 1: Utworzenie projektu Firebase

1. Przejdź do [Firebase Console](https://console.firebase.google.com/)
2. Kliknij "Add project" (Dodaj projekt)
3. Wprowadź nazwę projektu (np. "trip-planner")
4. Wyłącz Google Analytics (lub włącz, jeśli chcesz)
5. Kliknij "Create project"

## Krok 2: Włączenie usług Firebase

### Authentication (Autentykacja)

1. W menu po lewej stronie wybierz "Authentication"
2. Kliknij "Get started"
3. Przejdź do zakładki "Sign-in method"
4. Włącz następujące metody:
   - **Email/Password** - kliknij, włącz, zapisz
   - **Google** - kliknij, włącz, podaj email support i zapisz
   - **Apple** (opcjonalnie) - kliknij, włącz, skonfiguruj

### Cloud Firestore (Baza danych)

1. W menu po lewej stronie wybierz "Firestore Database"
2. Kliknij "Create database"
3. Wybierz tryb:
   - **Start in test mode** (dla rozwoju) - kliknij "Next"
   - Wybierz lokalizację (np. `europe-west` dla Europy)
   - Kliknij "Enable"

### Storage (Przechowywanie plików)

1. W menu po lewej stronie wybierz "Storage"
2. Kliknij "Get started"
3. Zaakceptuj domyślne reguły bezpieczeństwa (dla rozwoju)
4. Wybierz lokalizację (tę samą co Firestore)
5. Kliknij "Done"

## Krok 3: Pobranie konfiguracji

1. W Firebase Console przejdź do **Project Settings** (⚙️ ikona koła zębatego)
2. Przewiń w dół do sekcji "Your apps"
3. Kliknij ikonę Web (`</>`)
4. Jeśli nie masz jeszcze aplikacji webowej:
   - Wprowadź nazwę aplikacji (np. "Trip Planner Web")
   - Kliknij "Register app"
5. Skopiuj obiekt konfiguracyjny, który wygląda tak:
   ```javascript
   const firebaseConfig = {
     apiKey: "AIza...",
     authDomain: "your-project.firebaseapp.com",
     projectId: "your-project-id",
     storageBucket: "your-project.appspot.com",
     messagingSenderId: "123456789",
     appId: "1:123456789:web:abcdef"
   };
   ```

## Krok 4: Konfiguracja w projekcie

1. W katalogu projektu utwórz plik `.env.local`:
   ```bash
   # W terminalu w katalogu projektu:
   touch .env.local
   ```

2. Otwórz plik `.env.local` i wklej następujące wartości z Firebase Console:
   ```env
   VITE_FIREBASE_API_KEY=twoj-api-key
   VITE_FIREBASE_AUTH_DOMAIN=twoj-project-id.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=twoj-project-id
   VITE_FIREBASE_STORAGE_BUCKET=twoj-project-id.appspot.com
   VITE_FIREBASE_MESSAGING_SENDER_ID=twoj-messaging-sender-id
   VITE_FIREBASE_APP_ID=twoj-app-id
   ```

3. Zastąp wartości placeholderów rzeczywistymi wartościami z Firebase Console

**WAŻNE:** 
- NIE używaj cudzysłowów wokół wartości!
- Upewnij się, że wartości nie zawierają tekstu "your-" lub innych placeholderów
- Po zmianie `.env.local` ZRESTARTUJ serwer deweloperski (`npm run dev`)

## Krok 5: Weryfikacja

1. Uruchom serwer deweloperski (jeśli nie działa):
   ```bash
   npm run dev
   ```

2. Otwórz aplikację w przeglądarce (http://localhost:5173)

3. Otwórz konsolę przeglądarki (F12 lub Cmd+Option+I)

4. Powinieneś zobaczyć:
   - ✅ "Firebase App initialized: [DEFAULT]"
   - ✅ "Firebase Auth initialized: [DEFAULT]"
   - ✅ "Firebase Firestore initialized: [DEFAULT]"
   - ✅ "Firebase Storage initialized: [DEFAULT]"
   - ✅ "Firebase configuration looks good!"

5. Jeśli widzisz ostrzeżenia o brakujących zmiennych środowiskowych:
   - Sprawdź, czy plik `.env.local` istnieje
   - Sprawdź, czy wszystkie wartości są poprawnie wklejone
   - Upewnij się, że wartości nie zawierają cudzysłowów
   - Upewnij się, że wartości nie zawierają tekstu "your-" lub innych placeholderów
   - Zrestartuj serwer deweloperski (`npm run dev`)

6. Jeśli widzisz błąd "auth/api-key-not-valid":
   - Sprawdź `FIREBASE_TROUBLESHOOTING.md` dla szczegółowych instrukcji
   - Upewnij się, że skopiowałeś wartości z właściwego projektu Firebase
   - Sprawdź czy API Key nie ma restrykcji w Firebase Console

## Uwagi bezpieczeństwa

- **NIE** commituj pliku `.env.local` do repozytorium (jest już w `.gitignore`)
- W produkcji użyj Firebase Security Rules dla Firestore i Storage
- Dla produkcji rozważ użycie Firebase App Check dla dodatkowej ochrony

## Następne kroki

Po pomyślnej konfiguracji Firebase możesz przejść do:
- Krok 3: Setup Carbon Design System
- Implementacja autentykacji (Krok 6)

