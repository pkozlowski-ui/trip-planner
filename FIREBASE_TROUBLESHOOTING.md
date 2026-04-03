# Firebase Troubleshooting Guide

## Quick Fix

**Najczęstsze rozwiązanie:** Po zmianie `.env.local` ZRESTARTUJ serwer (`npm run dev`)

## Błąd: "auth/api-key-not-valid"

Ten błąd oznacza, że klucz API Firebase w pliku `.env.local` jest nieprawidłowy lub nie został poprawnie skonfigurowany.

### Krok 1: Sprawdź plik .env.local

Upewnij się, że plik `.env.local` istnieje w katalogu głównym projektu i zawiera wszystkie wymagane zmienne:

```env
VITE_FIREBASE_API_KEY=twoj-rzeczywisty-klucz-api
VITE_FIREBASE_AUTH_DOMAIN=twoj-project-id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=twoj-project-id
VITE_FIREBASE_STORAGE_BUCKET=twoj-project-id.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=twoj-messaging-sender-id
VITE_FIREBASE_APP_ID=twoj-app-id
```

### Krok 2: Sprawdź wartości w Firebase Console

1. Przejdź do [Firebase Console](https://console.firebase.google.com/)
2. Wybierz swój projekt
3. Kliknij ikonę ⚙️ (Settings) > **Project Settings**
4. Przewiń w dół do sekcji **"Your apps"**
5. Jeśli nie masz aplikacji webowej:
   - Kliknij ikonę Web (`</>`)
   - Wprowadź nazwę aplikacji (np. "Trip Planner Web")
   - Kliknij **"Register app"**
6. Skopiuj wartości z obiektu konfiguracyjnego

### Krok 3: Sprawdź format wartości w .env.local

**WAŻNE:** Wartości w `.env.local` NIE powinny mieć cudzysłowów!

❌ **ŹLE:**
```env
VITE_FIREBASE_API_KEY="AIzaSyC..."
VITE_FIREBASE_PROJECT_ID="my-project"
```

✅ **DOBRZE:**
```env
VITE_FIREBASE_API_KEY=AIzaSyC...
VITE_FIREBASE_PROJECT_ID=my-project
```

### Krok 4: Sprawdź czy wartości nie są placeholderami

Upewnij się, że wartości nie zawierają tekstu "your-" lub innych placeholderów:

❌ **ŹLE:**
```env
VITE_FIREBASE_API_KEY=your-api-key-here
VITE_FIREBASE_PROJECT_ID=your-project-id
```

✅ **DOBRZE:**
```env
VITE_FIREBASE_API_KEY=AIzaSyC1234567890abcdefghijklmnop
VITE_FIREBASE_PROJECT_ID=my-trip-planner-project
```

### Krok 5: Zrestartuj serwer deweloperski

Po zmianie `.env.local` musisz zrestartować serwer:

1. Zatrzymaj serwer (Ctrl+C)
2. Uruchom ponownie: `npm run dev`

**Uwaga:** Vite ładuje zmienne środowiskowe tylko przy starcie, więc zmiany w `.env.local` wymagają restartu!

### Krok 6: Sprawdź w konsoli przeglądarki

Otwórz konsolę przeglądarki (F12) i sprawdź:
- Czy są komunikaty o brakujących zmiennych środowiskowych?
- Czy Firebase inicjalizuje się poprawnie?

### Krok 7: Zweryfikuj konfigurację

Uruchom skrypt weryfikacyjny (jeśli dostępny):
```bash
node scripts/verify-firebase-config.js
```

### Krok 8: Sprawdź API Key Restrictions w Firebase Console

1. W Firebase Console przejdź do **Project Settings** > **General**
2. Przewiń do sekcji **"Your apps"**
3. Kliknij na aplikację webową
4. Sprawdź czy API Key nie ma restrykcji, które blokują użycie

### Krok 9: Sprawdź czy Authentication jest włączone

1. W Firebase Console przejdź do **Authentication**
2. Kliknij **"Get started"** jeśli jeszcze nie włączone
3. Przejdź do zakładki **"Sign-in method"**
4. Włącz **"Email/Password"**

## Najczęstsze przyczyny błędów:

1. **Brakujące wartości** - niektóre zmienne nie są ustawione
2. **Placeholder values** - wartości zawierają "your-" lub są puste
3. **Cudzysłowy** - wartości są w cudzysłowach (niepotrzebne)
4. **Brak restartu serwera** - zmiany w .env.local nie zostały załadowane
5. **Nieprawidłowy API Key** - skopiowany z niewłaściwego projektu
6. **API Key restrictions** - restrykcje w Firebase Console blokują użycie

## Sprawdzenie konfiguracji w kodzie

Możesz też sprawdzić w konsoli przeglądarki, czy zmienne są poprawnie załadowane:

```javascript
// W konsoli przeglądarki:
console.log(import.meta.env.VITE_FIREBASE_API_KEY);
console.log(import.meta.env.VITE_FIREBASE_PROJECT_ID);
```

Jeśli widzisz `undefined` lub wartości z "your-", oznacza to problem z konfiguracją.

## Pomoc

Jeśli nadal masz problemy:
1. Sprawdź `FIREBASE_SETUP.md` dla szczegółowych instrukcji
2. Upewnij się, że projekt Firebase istnieje i jest aktywny
3. Sprawdź czy masz dostęp do projektu Firebase

